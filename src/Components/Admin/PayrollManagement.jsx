import React, { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import AdminLayout from "./AdminLayout";
import { useForm } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Papa from "papaparse";
import Loader from "./Loader/Loader";
import { generateSalarySlipPDF } from "./generateSalarySlipPDF";
import { SettingsContext } from "../Redux/SettingsContext";
import { addCommonHeaderFooter, addCommonFooter } from "../../Utils/pdfHeaderFooter";

// Icons
import { FaUserTie, FaTrash, FaPen, FaFilePdf, FaFileCsv, FaPlus, FaSearch, FaArrowRight } from "react-icons/fa";
import { MdOutlineEventNote, MdCalculate, MdAttachMoney } from "react-icons/md";

import "./PayrollManagement.css";

// Validation Schema
const schema = yup.object().shape({
  employeeId: yup.string().required("Please select an employee"),
  month: yup.string().required("Month is required"),
  basicSalary: yup
    .number()
    .typeError("Must be a valid number")
    .required("Basic salary is required")
    .min(0, "Cannot be negative"),
  workingDays: yup.number().typeError("Number").nullable(),
  paidDays: yup.number().typeError("Number").nullable(),
});

const PayrollManagement = () => {
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState([]);
  const [payrolls, setPayrolls] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [allowances, setAllowances] = useState([]);
  const [deductions, setDeductions] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [editable, setEditable] = useState(false);
  const [selectedEmployeeDetails, setSelectedEmployeeDetails] = useState(null);
  const { settings } = useContext(SettingsContext);
  
  const navigate = useNavigate();
  const token = JSON.parse(localStorage.getItem("user"))?.token || "";

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm({ resolver: yupResolver(schema) });

  // Watch fields
  const selectedEmployeeId = watch("employeeId");
  const selectedMonth = watch("month");
  const watchedBasic = watch("basicSalary");
  const watchedPaidDays = watch("paidDays");

  // --- API: Fetch Data ---
  const fetchData = async () => {
    setLoading(true);
    try {
      const [empRes, payRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_URL}/user/`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${import.meta.env.VITE_API_URL}/api/payrolls`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      setEmployees((empRes.data.data || []).filter((e) => e.role === "employee"));
      setPayrolls((payRes.data.data || []).reverse());
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Failed to fetch payroll data", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // --- Logic: Auto-fill Employee Basic Salary ---
  useEffect(() => {
    if (selectedEmployeeId && !editingId) {
      const emp = employees.find((e) => e._id === selectedEmployeeId);
      if (emp) {
        setSelectedEmployeeDetails(emp);
        setValue("basicSalary", emp.basicSalary || 0);
        setEditable(false);
      }
    } else if (!selectedEmployeeId) {
      setSelectedEmployeeDetails(null);
    }
  }, [selectedEmployeeId, employees, editingId]);

  // 🔥🔥🔥 MAIN LOGIC: Auto-Calculate Paid Days (With LOP Concept) 🔥🔥🔥
  useEffect(() => {
    const fetchAndCompute = async () => {
      if (!selectedEmployeeId || !selectedMonth) {
        if (!editingId) { setValue("workingDays", ""); setValue("paidDays", ""); }
        return;
      }
      try {
        // 1. Employee ki Attendance lao
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/attendance/employee/${selectedEmployeeId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const all = res.data?.data || [];
        
        const [yearStr, monthStr] = selectedMonth.split("-");
        const year = Number(yearStr);
        const month = Number(monthStr);

        // 2. Sirf Selected Month ka data filter karo
        const monthRecords = all.filter((rec) => {
          if (!rec.date) return false;
          const d = new Date(rec.date);
          return d.getFullYear() === year && d.getMonth() + 1 === month;
        });

        // 3. 🔥 Calculate Paid Days
        let calculatedPaidDays = 0;
        let totalPresent = 0;

        monthRecords.forEach(record => {
            const status = (record.status || "").toLowerCase();
            // adminCheckoutTime me humne leave type store kiya tha (e.g., "Leave: Loss of Pay")
            const remarks = (record.adminCheckoutTime || "").toLowerCase(); 

            // Case A: Present / Late (Working Days)
            if (status === "present" || status === "late") {
                calculatedPaidDays += 1;
                totalPresent += 1;
            } 
            // Case B: Half Day
            else if (status === "half day") {
                calculatedPaidDays += 0.5;
                totalPresent += 0.5;
            }
            // Case C: On Leave (CHECK FOR LOSS OF PAY)
            else if (status === "on leave") {
                // Agar Leave Type me "Loss of Pay" ya "LOP" likha hai -> UNPAID
                if (remarks.includes("loss of pay") || remarks.includes("lop") || remarks.includes("unpaid")) {
                    // Do nothing (Salary Katega)
                } else {
                    // Paid Leave (Sick, Casual, Earned) -> Salary Milegi
                    calculatedPaidDays += 1;
                }
            }
            // Case D: Holiday / Weekly Off (Usually Paid)
            else if (status === "holiday" || status === "weekly off") {
                calculatedPaidDays += 1;
            }
            // Case E: Absent (Unpaid) -> Ignored
        });

        if (!editingId) {
          // Working Days = Total days employee was functionally active or on paid leave
          setValue("workingDays", calculatedPaidDays); 
          // Paid Days = Same as working days for calculation
          setValue("paidDays", calculatedPaidDays);
        }
      } catch (err) { console.error(err); }
    };
    fetchAndCompute();
  }, [selectedEmployeeId, selectedMonth]);

  // --- Calculation Engine ---
  const calculateNet = () => {
    const basic = parseFloat(watchedBasic || 0);
    
    // Get Total Days in Selected Month (e.g., 28, 30, 31)
    let totalMonthDays = 30;
    if (selectedMonth?.includes("-")) {
      const [y, m] = selectedMonth.split("-");
      totalMonthDays = new Date(Number(y), Number(m), 0).getDate();
    }

    const paidDays = Number(watchedPaidDays || 0);

    // 🔥 FORMULA: (Basic Salary / Total Days in Month) * Paid Days
    const proratedBasic = totalMonthDays > 0 ? (basic / totalMonthDays) * paidDays : 0;

    const totalAllowances = allowances.reduce((sum, a) => sum + (Number(a.amount) || 0), 0);
    const totalDeductions = deductions.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);
    
    const net = proratedBasic + totalAllowances - totalDeductions;
    return Math.max(0, Math.round((net + Number.EPSILON) * 100) / 100);
  };

  const fmt = (val) => val ? Number(val).toLocaleString('en-IN') : "0";

  // --- Dynamic Form Handlers ---
  const allowanceTitles = ["HRA", "Conveyance", "Special Allowance", "Bonus"];
  const deductionTitles = ["PF", "Professional Tax", "TDS"];

  const addSet = (type) => {
    const template = type === "allowances" ? allowanceTitles : deductionTitles;
    const setter = type === "allowances" ? setAllowances : setDeductions;
    setter(template.map(title => ({ title, amount: 0 })));
  };

  const updateItem = (type, idx, val) => {
    const list = type === "allowances" ? [...allowances] : [...deductions];
    list[idx].amount = Number(val || 0);
    type === "allowances" ? setAllowances(list) : setDeductions(list);
  };

  const removeRow = (type, idx) => {
    if (type === "allowances") setAllowances(allowances.filter((_, i) => i !== idx));
    else setDeductions(deductions.filter((_, i) => i !== idx));
  };

  // --- Submit Handler ---
  const onSubmit = async (data) => {
    const payload = { 
      ...data, 
      allowances, 
      deductions, 
      netSalary: calculateNet() 
    };

    try {
      if (editingId) {
        await axios.put(`${import.meta.env.VITE_API_URL}/api/payrolls/${editingId}`, payload, { headers: { Authorization: `Bearer ${token}` } });
        Swal.fire("Updated!", "Payroll record updated.", "success");
      } else {
        await axios.post(`${import.meta.env.VITE_API_URL}/api/payrolls`, payload, { headers: { Authorization: `Bearer ${token}` } });
        Swal.fire("Success!", "Payroll generated.", "success");
      }
      resetForm();
      fetchData();
    } catch (err) { Swal.fire("Error", "Something went wrong.", "error"); }
  };

  const resetForm = () => {
    reset();
    setAllowances([]);
    setDeductions([]);
    setEditingId(null);
    setEditable(false);
    setSelectedEmployeeDetails(null);
  };

  const handleEdit = (p) => {
    setEditingId(p._id);
    reset({
      employeeId: p.employeeId._id,
      month: p.month,
      basicSalary: p.basicSalary,
      workingDays: p.workingDays || 0,
      paidDays: p.paidDays || 0,
    });
    setAllowances(p.allowances || []);
    setDeductions(p.deductions || []);
    setEditable(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    const res = await Swal.fire({ title: "Delete Record?", text: "This cannot be undone.", icon: "warning", showCancelButton: true, confirmButtonColor: "#ef4444" });
    if (res.isConfirmed) {
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/payrolls/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      fetchData();
      Swal.fire("Deleted", "Record removed.", "success");
    }
  };

  const exportToPDF = async () => {
    const doc = new jsPDF("landscape", "mm", "a4");
    await addCommonHeaderFooter(doc, settings);
    autoTable(doc, {
      startY: 55,
      head: [["Employee", "Month", "Basic (Rs)", "Allowances", "Deductions", "Net Salary"]],
      body: payrolls.map(p => [
        p.employeeId?.name, 
        p.month, 
        fmt(p.basicSalary), 
        fmt(p.allowances?.reduce((s,a)=>s+(a.amount||0),0)),
        fmt(p.deductions?.reduce((s,d)=>s+(d.amount||0),0)),
        fmt(p.netSalary)
      ]),
      theme: "grid",
    });
    addCommonFooter(doc, settings);
    doc.save("Payroll_Report.pdf");
  };

  const exportToCSV = () => {
     const csvData = payrolls.map(p => ({ 
         Employee: p.employeeId?.name, 
         Month: p.month,
         Basic: p.basicSalary,
         NetSalary: p.netSalary 
     }));
     const csv = Papa.unparse(csvData);
     const link = document.createElement("a");
     link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
     link.download = "payroll_report.csv";
     link.click();
  };

  const filteredPayrolls = payrolls.filter((p) =>
    p.employeeId?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="payroll-container">
        
        {/* === Header Section === */}
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4 gap-3 page-header">
          <div>
            <h2>Payroll Hub</h2>
            <div className="text-secondary small">Manage salaries, generated slips & history</div>
          </div>
          <div className="d-flex gap-2">
            <button className="btn btn-fintech-outline d-flex align-items-center gap-2" onClick={exportToCSV}>
              <FaFileCsv /> Export CSV
            </button>
            <button className="btn btn-fintech-primary d-flex align-items-center gap-2" onClick={exportToPDF}>
              <FaFilePdf /> Export PDF
            </button>
          </div>
        </div>

        {/* === Main Form Area === */}
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="row g-4">
            
            <div className="col-lg-8">
              <div className="fintech-card">
                
                {/* 1. Employee Info */}
                <div className="section-title"><FaUserTie className="me-2"/> Employee & Period</div>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label-styled">Select Employee</label>
                    <select className="modern-input" {...register("employeeId")}>
                      <option value="">-- Choose Employee --</option>
                      {employees.map((emp) => (
                        <option key={emp._id} value={emp._id}>{emp.name} ({emp.employeeId || "N/A"})</option>
                      ))}
                    </select>
                    <div className="text-danger small mt-1">{errors.employeeId?.message}</div>
                    
                    {selectedEmployeeDetails && (
                        <div className="mt-2 p-2 bg-opacity-10 bg-primary rounded d-flex gap-3 text-secondary small">
                            <span><strong>PAN:</strong> {selectedEmployeeDetails.pan || "--"}</span>
                            <span><strong>Bank:</strong> {selectedEmployeeDetails.bankAccount || "--"}</span>
                        </div>
                    )}
                  </div>

                  <div className="col-md-6">
                    <label className="form-label-styled">Salary Month</label>
                    <input type="month" className="modern-input" {...register("month")} />
                    <div className="text-danger small mt-1">{errors.month?.message}</div>
                  </div>
                </div>

                <div className="my-4 border-top border-secondary opacity-25"></div>

                {/* 2. Attendance & Basic */}
                <div className="section-title"><MdOutlineEventNote className="me-2"/> Attendance Data</div>
                <div className="row g-3">
                  <div className="col-md-4">
                      <label className="form-label-styled">Total Working Days</label>
                      <input type="number" className="modern-input" {...register("workingDays")} placeholder="Auto" />
                  </div>
                  <div className="col-md-4">
                      <label className="form-label-styled">Paid Days (Salary Days)</label>
                      <input type="number" className="modern-input" {...register("paidDays")} placeholder="Auto" />
                  </div>
                  <div className="col-md-4">
                      <div className="d-flex justify-content-between">
                        <label className="form-label-styled">Basic Salary</label>
                        <div className="form-check form-switch">
                            <input className="form-check-input" type="checkbox" title="Enable Edit" checked={editable} onChange={e => setEditable(e.target.checked)}/>
                        </div>
                      </div>
                      <input type="number" className="modern-input" {...register("basicSalary")} disabled={!editable} />
                  </div>
                </div>

                <div className="my-4 border-top border-secondary opacity-25"></div>

                {/* 3. Allowances & Deductions */}
                <div className="row g-4">
                    {/* Allowances */}
                    <div className="col-md-6 earnings-column position-relative">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <span className="section-title mb-0 text-success">Earnings</span>
                            <button type="button" className="btn btn-sm btn-fintech-outline py-0 d-flex align-items-center" onClick={() => addSet("allowances")}>
                                <FaPlus className="me-1"/> Presets
                            </button>
                        </div>
                        {allowances.length === 0 && <div className="text-center text-secondary small py-3 dashed-box">No allowances added</div>}
                        {allowances.map((item, i) => (
                            <div key={i} className="dynamic-row-wrapper">
                                <input className="modern-input py-1 bg-transparent border-0" value={item.title} readOnly />
                                <input 
                                    type="number" 
                                    className="modern-input py-1 text-end" 
                                    value={item.amount} 
                                    onChange={(e) => updateItem("allowances", i, e.target.value)}
                                    placeholder="0"
                                />
                                <button type="button" className="btn-icon-trash" onClick={() => removeRow("allowances", i)}><FaTrash size={14}/></button>
                            </div>
                        ))}
                        <button type="button" className="btn btn-sm btn-link text-decoration-none mt-2" onClick={() => setAllowances([...allowances, {title: "Other", amount: 0}])}>+ Add Custom Row</button>
                    </div>

                    {/* Deductions */}
                    <div className="col-md-6">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <span className="section-title mb-0 text-danger">Deductions</span>
                            <button type="button" className="btn btn-sm btn-fintech-outline py-0 d-flex align-item-center" onClick={() => addSet("deductions")}>
                                <FaPlus className="me-1"/> Presets
                            </button>
                        </div>
                        {deductions.length === 0 && <div className="text-center text-secondary small py-3 dashed-box">No deductions added</div>}
                        {deductions.map((item, i) => (
                            <div key={i} className="dynamic-row-wrapper">
                                <input className="modern-input py-1 bg-transparent border-0" value={item.title} readOnly />
                                <input 
                                    type="number" 
                                    className="modern-input py-1 text-end" 
                                    value={item.amount} 
                                    onChange={(e) => updateItem("deductions", i, e.target.value)}
                                    placeholder="0"
                                />
                                <button type="button" className="btn-icon-trash" onClick={() => removeRow("deductions", i)}><FaTrash size={14}/></button>
                            </div>
                        ))}
                         <button type="button" className="btn btn-sm btn-link text-decoration-none mt-2" onClick={() => setDeductions([...deductions, {title: "Other", amount: 0}])}>+ Add Custom Row</button>
                    </div>
                </div>

              </div>
            </div>

            {/* Right: Summary Widget */}
            <div className="col-lg-4">
                <div className="fintech-card h-100 d-flex flex-column">
                    <div className="section-title"><MdCalculate className="me-2"/> Calculation</div>
                    
                    <div className="live-widget flex-grow-1">
                        <div className="text-secondary text-uppercase ls-1 small">Estimated Net Salary</div>
                        <div className="live-amount">₹ {fmt(calculateNet())}</div>
                        <div className="mt-3 w-100">
                             <div className="d-flex justify-content-between small text-secondary mb-1">
                                <span>Total Earnings:</span>
                                <span className="text-success">+ {fmt(allowances.reduce((s,a)=>s+Number(a.amount||0),0))}</span>
                             </div>
                             <div className="d-flex justify-content-between small text-secondary">
                                <span>Total Deductions:</span>
                                <span className="text-danger">- {fmt(deductions.reduce((s,d)=>s+Number(d.amount||0),0))}</span>
                             </div>
                        </div>
                    </div>

                    <div className="mt-4 d-grid gap-2">
                        <button type="submit" className="btn btn-fintech-primary">
                            {editingId ? "Update Payroll" : "Generate Payroll"}
                        </button>
                        <button type="button" className="btn btn-fintech-outline" onClick={resetForm}>
                            Reset Form
                        </button>
                    </div>
                </div>
            </div>
          </div>
        </form>

        {/* === Table Section (Limited View) === */}
        <div className="fintech-card mt-4 p-0">
            <div className="p-4 d-flex flex-column flex-sm-row justify-content-between align-items-center gap-3 border-bottom border-light border-opacity-10">
                <h5 className="m-0 fw-bold d-flex align-items-center gap-2"><MdAttachMoney/> Recent Payment History</h5>
                <div className="d-flex gap-2">
                    <div className="position-relative d-none d-md-block">
                        <FaSearch className="position-absolute text-secondary" style={{top: 10, left: 10}} />
                        <input 
                            type="text" 
                            className="modern-input ps-5 py-1" 
                            placeholder="Search in recent..." 
                            style={{width: 200}}
                            value={searchTerm} 
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button className="btn btn-sm btn-fintech-outline d-flex align-items-center gap-2" onClick={() => navigate("/admin/fullandfinal")}>
                        View All History <FaArrowRight size={12}/>
                    </button>
                </div>
            </div>
            
            <div className="fintech-table-wrapper">
                <table className="fintech-table">
                    <thead>
                        <tr>
                            <th>Employee</th>
                            <th>Period</th>
                            <th>Basic Salary</th>
                            <th>Earnings</th>
                            <th>Deductions</th>
                            <th>Net Pay</th>
                            <th className="text-end">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                             <tr><td colSpan="7" className="text-center p-5"><Loader/></td></tr> 
                        ) : filteredPayrolls.length === 0 ? (
                             <tr><td colSpan="7" className="text-center p-5 text-secondary">No recent payroll records found.</td></tr>
                        ) : (
                             filteredPayrolls.slice(0, 5).map((p) => (
                                <tr key={p._id}>
                                    <td>
                                        <div className="fw-bold">{p.employeeId?.name}</div>
                                        <div className="small text-secondary">{p.employeeId?.email}</div>
                                    </td>
                                    <td><span className="badge-month">{p.month}</span></td>
                                    <td className="font-monospace">₹{fmt(p.basicSalary)}</td>
                                    <td className="text-success font-monospace">+₹{fmt(p.allowances?.reduce((s,a)=>s+(a.amount||0),0))}</td>
                                    <td className="text-danger font-monospace">-₹{fmt(p.deductions?.reduce((s,d)=>s+(d.amount||0),0))}</td>
                                    <td><span className="fw-bold text-primary fs-6">₹{fmt(p.netSalary)}</span></td>
                                    <td className="text-end">
                                        <button className="btn btn-sm btn-icon-light me-2" title="Edit" onClick={() => handleEdit(p)}><FaPen size={14} className="text-warning"/></button>
                                        <button className="btn btn-sm btn-icon-light me-2" title="PDF" onClick={() => generateSalarySlipPDF(p, settings)}><FaFilePdf size={14} className="text-info"/></button>
                                        <button className="btn btn-sm btn-icon-light" title="Delete" onClick={() => handleDelete(p._id)}><FaTrash size={14} className="text-danger"/></button>
                                    </td>
                                </tr>
                             ))
                        )}
                    </tbody>
                </table>
                {filteredPayrolls.length > 5 && (
                    <div className="text-center p-3 border-top border-light border-opacity-10 bg-opacity-50">
                        <span 
                            className="text-primary fw-bold" 
                            style={{cursor: 'pointer'}} 
                            onClick={() => navigate("/admin/fullandfinal")}
                        >
                            + {filteredPayrolls.length - 5} More Records (Click to View All)
                        </span>
                    </div>
                )}
            </div>
        </div>

      </div>
    </AdminLayout>
  );
};

export default PayrollManagement;