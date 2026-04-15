import React, { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import { toast } from "react-toastify";
import DynamicLayout from "../Common/DynamicLayout";
import { useForm } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import Loader from "./Loader/Loader";
import { generateSalarySlipPDF } from "./generateSalarySlipPDF";
import { SettingsContext } from "../Redux/SettingsContext";

import { FaUserTie, FaTrash, FaPen, FaFilePdf, FaCheckCircle, FaSearch, FaTimes } from "react-icons/fa";
import { MdOutlineEventNote, MdCalculate, MdAttachMoney, MdOutlinePendingActions } from "react-icons/md";
import moment from "moment"; 
import "./PayrollManagement.css";

const schema = yup.object().shape({
  employeeId: yup.string().required("Select an employee"),
  month: yup.string().required("Month is required"),
  basicSalary: yup.number().typeError("Must be a number").required("Required").min(0),
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
  const [activeTab, setActiveTab] = useState("pending"); 

  const [bulkMonth, setBulkMonth] = useState("");
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewData, setPreviewData] = useState([]);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  const { settings } = useContext(SettingsContext);
  const navigate = useNavigate();
  
  const userStr = localStorage.getItem("user");
  const userObj = userStr ? JSON.parse(userStr) : null;
  const token = userObj?.token;
  const isAdmin = userObj?.role === "admin";
  const [perms, setPerms] = useState({ view: false, create: false, edit: false, delete: false });

  const { register, handleSubmit, setValue, watch, reset } = useForm({ resolver: yupResolver(schema) });

  const selectedEmployeeId = watch("employeeId");
  const selectedMonth = watch("month");
  const watchedBasic = watch("basicSalary");
  const watchedWorkingDays = watch("workingDays");
  const watchedPaidDays = watch("paidDays");

  useEffect(() => {
    const fetchPerms = async () => {
      if (isAdmin || !token) return;
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/my-modules`, { headers: { Authorization: `Bearer ${token}` } });
        if (res.data.detailed?.payroll) setPerms(res.data.detailed.payroll);
      } catch (e) {}
    };
    fetchPerms();
    fetchData();
  }, [token, isAdmin]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [empRes, payRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_URL}/user/`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${import.meta.env.VITE_API_URL}/api/payrolls`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      setEmployees((empRes.data.data || []).filter((e) => e.role === "employee"));
      setPayrolls((payRes.data.data || []).reverse());
    } catch (err) { toast.error("Failed to fetch data"); } 
    finally { setLoading(false); }
  };

  // 🔥 SINGLE EMPLOYEE SMART SYNC 🔥
  useEffect(() => {
    const handleEmployeeMonthChange = async () => {
      if (!selectedEmployeeId || !selectedMonth) return;
      const emp = employees.find((e) => e._id === selectedEmployeeId);
      if (!emp) return;

      const [yearStr, monthStr] = selectedMonth.split("-");
      const year = Number(yearStr);
      const monthNum = Number(monthStr);
      const monthDays = new Date(year, monthNum, 0).getDate(); 
      const startDate = new Date(year, monthNum - 1, 1);
      const endDate = new Date(year, monthNum, 0, 23, 59, 59);
      
      const existingRecord = payrolls.find(p => p.employeeId?._id === selectedEmployeeId && p.month === selectedMonth);
      if (existingRecord) {
        setEditingId(existingRecord._id); 
        setValue("basicSalary", existingRecord.basicSalary);
        setValue("workingDays", existingRecord.workingDays || monthDays); 
        setValue("paidDays", existingRecord.paidDays || 0);
        setAllowances(existingRecord.allowances || []); 
        setDeductions(existingRecord.deductions || []); 
        setEditable(true);
        return;
      }

      setEditingId(null); 
      setAllowances([]); 
      setDeductions([]); 
      setValue("basicSalary", emp.basicSalary || 0); 
      setValue("workingDays", monthDays); // Default strictly to month days
      setEditable(false);

      try {
        const [attRes, wfhRes] = await Promise.all([
          axios.get(`${import.meta.env.VITE_API_URL}/api/attendance/employee/${selectedEmployeeId}`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${import.meta.env.VITE_API_URL}/api/wfh/all?employeeId=${selectedEmployeeId}`, { headers: { Authorization: `Bearer ${token}` } }) 
        ]);

        const allAttLogs = attRes.data?.data || [];
        const allWfhLogs = wfhRes.data?.data || [];

        const monthRecords = allAttLogs.filter((rec) => {
          if (!rec.date) return false; 
          const d = new Date(rec.date);
          return d.getFullYear() === year && d.getMonth() + 1 === monthNum;
        });

        const validWfhRecords = allWfhLogs.filter(wfh => wfh.userId?._id === selectedEmployeeId && wfh.status === "approved");

        let calcPaid = 0; 
        let otMins = 0;

        monthRecords.forEach(r => {
            const status = (r.status || "").toLowerCase(); 
            const remarks = (r.adminCheckoutTime || "").toLowerCase(); 
            const recordDate = moment(r.date);

            const isWFH = validWfhRecords.some(wfh => 
                recordDate.isSameOrAfter(moment(wfh.fromDate).startOf('day')) && 
                recordDate.isSameOrBefore(moment(wfh.toDate).endOf('day'))
            );

            if (isWFH) calcPaid += 1;
            else if (["present", "late", "holiday", "weekly off", "wfh"].includes(status)) calcPaid += 1;
            else if (status === "half day") calcPaid += 0.5;
            else if (status === "on leave") {
                if (remarks.includes("half")) calcPaid += 0.5;
                // 🔥 UNPAID CHECK 🔥
                else if (!remarks.includes("unpaid") && !remarks.includes("loss of pay") && !remarks.includes("lop")) calcPaid += 1;
            }

            if (r.overtimeApproved && r.overtimeMinutes > 0) otMins += r.overtimeMinutes;
        });

        setValue("paidDays", calcPaid);
        if (otMins > 0) {
            const otPay = Math.round(otMins * ((emp.basicSalary || 0) / monthDays / 8 / 60));
            setAllowances([{ title: `Overtime Pay`, amount: otPay }]);
        }
      } catch (err) {
        console.error("Auto calculation failed for form", err);
      }
    };
    handleEmployeeMonthChange();
  }, [selectedEmployeeId, selectedMonth, employees, payrolls, setValue, token]);

  const calculateNet = () => {
    const basic = parseFloat(watchedBasic || 0);
    const paidDays = Number(watchedPaidDays || 0);
    const wDays = Number(watchedWorkingDays || 30); 
    
    // Proration matches mathematically: (Basic / Total Month Days) * Paid Days
    const proratedBasic = wDays > 0 ? (basic / wDays) * paidDays : 0; 
    
    const tAllow = allowances.reduce((s, a) => s + (Number(a.amount) || 0), 0);
    const tDed = deductions.reduce((s, d) => s + (Number(d.amount) || 0), 0);
    return Math.max(0, Math.round((proratedBasic + tAllow - tDed) * 100) / 100);
  };

  const fmt = (v) => v ? Number(v).toLocaleString('en-IN') : "0";

  const handlePreviewBulk = async () => {
    if (!bulkMonth) return toast.warning("Please select a month first!");
    setIsPreviewing(true);
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/payrolls/preview-bulk`, { month: bulkMonth }, { headers: { Authorization: `Bearer ${token}` } });
      setPreviewData(res.data.data || []);
      setShowPreviewModal(true);
    } catch (err) { toast.error(err.response?.data?.message || "Failed to fetch preview"); } 
    finally { setIsPreviewing(false); }
  };

  const handleConfirmGenerate = async () => {
    setIsGenerating(true);
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/payrolls/bulk-generate`, { month: bulkMonth }, { headers: { Authorization: `Bearer ${token}` } });
      Swal.fire("Success!", res.data.message, "success");
      setShowPreviewModal(false);
      fetchData(); 
    } catch (err) { Swal.fire("Error", err.response?.data?.message || "Generation failed", "error"); } 
    finally { setIsGenerating(false); }
  };

  const onSubmit = async (data) => {
    const payload = { ...data, allowances, deductions, netSalary: calculateNet(), status: "Paid" }; 
    try {
      if (editingId) {
        await axios.put(`${import.meta.env.VITE_API_URL}/api/payrolls/${editingId}`, payload, { headers: { Authorization: `Bearer ${token}` } });
        toast.success("Payroll updated!");
      } else {
        await axios.post(`${import.meta.env.VITE_API_URL}/api/payrolls`, payload, { headers: { Authorization: `Bearer ${token}` } });
        toast.success("Payroll generated & assigned!");
      }
      resetForm(); fetchData();
    } catch (err) { Swal.fire("Error", err.response?.data?.message || "Failed", "error"); }
  };

  const handleAssign = async (id) => {
    try {
        await axios.put(`${import.meta.env.VITE_API_URL}/api/payrolls/assign/${id}`, {}, { headers: { Authorization: `Bearer ${token}` } });
        toast.success("Payroll Officially Assigned!");
        fetchData();
    } catch (err) { toast.error("Failed to assign"); }
  };

  const handleDelete = async (id) => {
    const res = await Swal.fire({ title: "Delete?", text: "Cannot be undone.", icon: "warning", showCancelButton: true, confirmButtonColor: "#ef4444" });
    if (res.isConfirmed) {
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/payrolls/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      fetchData(); toast.success("Removed.");
    }
  };

  const resetForm = () => { reset(); setAllowances([]); setDeductions([]); setEditingId(null); setEditable(false); };

  const handleEdit = (p) => {
    setEditingId(p._id);
    const [yStr, mStr] = p.month.split('-');
    const mDays = new Date(Number(yStr), Number(mStr), 0).getDate();
    reset({ employeeId: p.employeeId._id, month: p.month, basicSalary: p.basicSalary, workingDays: p.workingDays || mDays, paidDays: p.paidDays || 0 });
    setAllowances(p.allowances || []); setDeductions(p.deductions || []); setEditable(true); window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const canCreate = isAdmin || perms.create; const canEdit = isAdmin || perms.edit; const canDelete = isAdmin || perms.delete;
  
  const pendingPayrolls = payrolls.filter((p) => p.status === "Pending" && p.employeeId?.name?.toLowerCase().includes(searchTerm.toLowerCase()));
  const officialPayrolls = payrolls.filter((p) => p.status === "Paid" && p.employeeId?.name?.toLowerCase().includes(searchTerm.toLowerCase()));

  const currentLop = Math.max(0, Number(watchedWorkingDays || 30) - Number(watchedPaidDays || 0));

  return (
    <DynamicLayout>
      <div className="payroll-container dynamic-bg">
        <div className="page-header mb-4 d-flex justify-content-between align-items-center flex-wrap">
            <div>
              <h2 className="dynamic-text-color">Payroll Hub</h2>
              <div className="text-secondary small fw-medium">Manage auto-scheduled & manual salaries</div>
            </div>
            
            {canCreate && (
              <div className="d-flex gap-2 align-items-center bg-white p-2 rounded shadow-sm mt-3 mt-md-0">
                <input type="month" className="form-control form-control-sm m-0" style={{width: '150px'}} value={bulkMonth} onChange={(e) => setBulkMonth(e.target.value)} />
                <button className="btn btn-sm btn-primary d-flex align-items-center gap-1" onClick={handlePreviewBulk} disabled={isPreviewing}>
                  {isPreviewing ? <Loader size={14}/> : <><MdCalculate /> Auto-Generate</>}
                </button>
              </div>
            )}
        </div>

        {/* MANUAL FORM */}
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="row g-4">
            <div className="col-lg-8">
              <div className="fintech-card dynamic-card-bg border-dynamic">
                <div className="section-title dynamic-text-color"><FaUserTie className="me-2"/> Employee & Period</div>
                <div className="row g-3">
                  <div className="col-md-6">
                    <select className="modern-input dynamic-input" {...register("employeeId")}>
                      <option value="">-- Select Employee --</option>
                      {employees.map(e => <option key={e._id} value={e._id}>{e.name}</option>)}
                    </select>
                  </div>
                  <div className="col-md-6">
                    <input type="month" className="modern-input dynamic-input date-input-fix" {...register("month")} />
                  </div>
                </div>

                <div className="my-4 border-top border-secondary opacity-25"></div>
                <div className="section-title dynamic-text-color"><MdOutlineEventNote className="me-2"/> Attendance Data</div>
                <div className="row g-3">
                  <div className="col-md-3"><label className="small text-secondary">Month Days (Total)</label><input type="number" className="modern-input dynamic-input" {...register("workingDays")} /></div>
                  <div className="col-md-3"><label className="small text-secondary">Paid Days</label><input type="number" className="modern-input dynamic-input text-success fw-bold" step="0.5" {...register("paidDays")} /></div>
                  
                  {/* 🔥 LOP INDICATOR IN FORM 🔥 */}
                  <div className="col-md-2 d-flex flex-column justify-content-center text-center">
                    <label className="small text-secondary">LOP (Unpaid/Absent)</label>
                    <div className="fw-bold text-danger fs-5">{currentLop > 0 ? currentLop : "0"}</div>
                  </div>

                  <div className="col-md-4">
                      <div className="d-flex justify-content-between"><label className="small text-secondary">Basic</label><input type="checkbox" checked={editable} onChange={e=>setEditable(e.target.checked)}/></div>
                      <input type="number" className="modern-input dynamic-input" {...register("basicSalary")} disabled={!editable} />
                  </div>
                </div>

                <div className="my-4 border-top border-secondary opacity-25"></div>
                <div className="row g-4">
                    <div className="col-md-6">
                        <div className="d-flex justify-content-between mb-2"><span className="text-success fw-bold small">Earnings</span><button type="button" className="btn btn-sm py-0 text-primary" onClick={() => setAllowances([...allowances, {title: "New", amount: 0}])}>+ Add</button></div>
                        {allowances.map((a, i) => (
                            <div key={i} className="d-flex gap-2 mb-2">
                                <input className="modern-input py-1 w-50" value={a.title} onChange={e => {const arr=[...allowances]; arr[i].title=e.target.value; setAllowances(arr)}}/>
                                <input type="number" className="modern-input py-1 w-50 text-success" value={a.amount} onChange={e => {const arr=[...allowances]; arr[i].amount=e.target.value; setAllowances(arr)}}/>
                                <button type="button" className="btn text-danger p-0" onClick={()=>setAllowances(allowances.filter((_,idx)=>idx!==i))}><FaTrash/></button>
                            </div>
                        ))}
                    </div>
                    <div className="col-md-6">
                        <div className="d-flex justify-content-between mb-2"><span className="text-danger fw-bold small">Deductions</span><button type="button" className="btn btn-sm py-0 text-primary" onClick={() => setDeductions([...deductions, {title: "New", amount: 0}])}>+ Add</button></div>
                        {deductions.map((d, i) => (
                            <div key={i} className="d-flex gap-2 mb-2">
                                <input className="modern-input py-1 w-50" value={d.title} onChange={e => {const arr=[...deductions]; arr[i].title=e.target.value; setDeductions(arr)}}/>
                                <input type="number" className="modern-input py-1 w-50 text-danger" value={d.amount} onChange={e => {const arr=[...deductions]; arr[i].amount=e.target.value; setDeductions(arr)}}/>
                                <button type="button" className="btn text-danger p-0" onClick={()=>setDeductions(deductions.filter((_,idx)=>idx!==i))}><FaTrash/></button>
                            </div>
                        ))}
                    </div>
                </div>
              </div>
            </div>

            <div className="col-lg-4">
                <div className="fintech-card h-100 d-flex flex-column dynamic-card-bg border-dynamic text-center justify-content-center">
                    <MdCalculate className="text-secondary fs-1 mb-2 mx-auto"/>
                    <div className="text-secondary small fw-bold">Estimated Net Salary</div>
                    <div className="fs-1 fw-bold text-primary my-3">₹ {fmt(calculateNet())}</div>
                    {canCreate || canEdit ? (
                      <div className="d-grid gap-2 px-3">
                          <button type="submit" className="btn btn-fintech-primary">{editingId ? "Update Record" : "Generate & Assign"}</button>
                          <button type="button" className="btn btn-fintech-outline" onClick={resetForm}>Clear Form</button>
                      </div>
                    ) : ( <div className="text-muted small mt-2">No permissions.</div> )}
                </div>
            </div>
          </div>
        </form>

        {/* TABS SYSTEM */}
        <div className="mt-5">
            <ul className="nav nav-pills mb-3 gap-2" style={{borderBottom: '2px solid var(--pm-border)'}}>
                <li className="nav-item">
                    <button className={`nav-link d-flex align-item-center fw-bold px-4 py-2 rounded-top ${activeTab === 'pending' ? 'bg-warning text-dark' : 'text-secondary'}`} onClick={() => setActiveTab('pending')} style={{border: 'none'}}>
                        <MdOutlinePendingActions className="me-1 mt-1"/> Pending Approvals ({pendingPayrolls.length})
                    </button>
                </li>
                <li className="nav-item">
                    <button className={`nav-link fw-bold px-4 py-2 rounded-top d-flex align-item-center ${activeTab === 'official' ? 'bg-success text-white' : 'text-secondary'}`} onClick={() => setActiveTab('official')} style={{border: 'none'}}>
                        <MdAttachMoney className="me-1 mt-1"/> Official Payrolls
                    </button>
                </li>
            </ul>

            <div className="fintech-card p-0 dynamic-card-bg border-dynamic">
                <div className="p-3 d-flex justify-content-between align-items-center border-bottom border-secondary border-opacity-10">
                    <div className="position-relative">
                        <FaSearch className="position-absolute text-secondary" style={{top: 10, left: 10}} />
                        <input type="text" className="modern-input ps-5 py-1" placeholder="Search..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                    </div>
                </div>
                
                <div className="fintech-table-wrapper border-0">
                    <table className="fintech-table m-0">
                        <thead>
                            <tr>
                                <th>Employee</th>
                                <th>Month</th>
                                <th>Days Summary</th> 
                                <th>LOP/Unpaid</th>
                                <th>Basic</th>
                                <th>Earnings</th>
                                <th>Deductions</th>
                                <th>Net Pay</th>
                                <th>Status</th>
                                <th className="text-end">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(activeTab === 'pending' ? pendingPayrolls : officialPayrolls).length === 0 ? (
                                <tr><td colSpan="11" className="text-center py-4 text-secondary">No records found.</td></tr>
                            ) : (
                                (activeTab === 'pending' ? pendingPayrolls : officialPayrolls).map((p) => {
                                    const lopDays = Math.max(0, (p.workingDays || 30) - (p.paidDays || 0));
                                    return (
                                    <tr key={p._id}>
                                        <td data-label="Employee" className="fw-bold dynamic-text-color">{p.employeeId?.name}</td>
                                        <td data-label="Month"><span className="badge-month">{p.month}</span></td>
                                        
                                        <td data-label="Days Summary">
                                          <div className="d-flex flex-md-column gap-2 gap-md-0" style={{fontSize: '0.8rem'}}>
                                            <span className="text-secondary" title="Total Days in Month">Month: {p.workingDays || 30}</span>
                                            <span className="text-success fw-bold" title="Payable Days">Paid: {p.paidDays || 0}</span>
                                          </div>
                                        </td>
                                        
                                        <td data-label="LOP/Unpaid">
                                            {lopDays > 0 ? (
                                                <span className="badge bg-danger bg-opacity-10 text-danger border border-danger">
                                                    {lopDays} Days
                                                </span>
                                            ) : (
                                                <span className="text-muted fw-medium">0 Days</span>
                                            )}
                                        </td>
                                        
                                        <td data-label="Basic" className="font-monospace fw-medium text-secondary">₹{fmt(p.basicSalary)}</td>
                                        <td data-label="Earnings" className="text-success font-monospace fw-medium">+₹{fmt(p.allowances?.reduce((s,a)=>s+(a.amount||0),0))}</td>
                                        <td data-label="Deductions" className="text-danger font-monospace fw-medium">-₹{fmt(p.deductions?.reduce((s,d)=>s+(d.amount||0),0))}</td>
                                        <td data-label="Net Pay" className="fw-bold text-primary fs-6">₹{fmt(p.netSalary)}</td>
                                        
                                        <td data-label="Status">
                                            <span className={`badge ${p.status === 'Pending' ? 'bg-warning text-dark' : 'bg-success'}`}>{p.status}</span>
                                        </td>
                                        
                                        <td data-label="Actions" className="text-end mobile-action-left">
                                            <div className="d-flex justify-content-end gap-2 actions-container">
                                                {p.status === 'Pending' && canEdit && (
                                                    <button className="btn btn-sm btn-success d-flex align-items-center gap-1" onClick={() => handleAssign(p._id)} title="Approve"><FaCheckCircle/> Approve</button>
                                                )}
                                                {canEdit && <button className="btn btn-sm btn-icon-light" onClick={() => handleEdit(p)} title="Edit"><FaPen size={12} className="text-warning"/></button>}
                                                {p.status === 'Paid' && <button className="btn btn-sm btn-icon-light" onClick={() => generateSalarySlipPDF(p, settings, employees)} title="Download Payslip"><FaFilePdf size={12} className="text-info"/></button>}
                                                {canDelete && <button className="btn btn-sm btn-icon-light" onClick={() => handleDelete(p._id)} title="Delete"><FaTrash size={12} className="text-danger"/></button>}
                                            </div>
                                        </td>
                                    </tr>
                                )})
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        {/* 🔥 BULK PREVIEW MODAL 🔥 */}
        {showPreviewModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
            <div className="dynamic-card-bg" style={{ width: '90%', maxWidth: '900px', maxHeight: '90vh', overflowY: 'auto', borderRadius: '16px', padding: '24px', border: '1px solid var(--pm-border)' }}>
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h4 className="m-0 fw-bold dynamic-text-color d-flex align-items-center gap-2"><MdCalculate className="text-primary"/> Auto-Generation Preview ({bulkMonth})</h4>
                <button className="btn btn-sm btn-light border-0 rounded-circle p-2" onClick={() => setShowPreviewModal(false)}><FaTimes size={18} className="text-danger"/></button>
              </div>

              <div className="alert alert-info py-2 small"><strong>Review LOP & Overtime!</strong> This is the draft. WFH, Half-days, and Unpaid leaves have been automatically calculated.</div>

              <div className="fintech-table-wrapper mb-4" style={{maxHeight: '400px', overflowY: 'auto'}}>
                <table className="fintech-table m-0">
                  <thead style={{position: 'sticky', top: 0, zIndex: 10, background: 'var(--pm-table-head)'}}>
                    <tr>
                      <th>Employee</th>
                      <th>Paid Days</th>
                      <th>LOP/Unpaid</th>
                      <th>Earnings (OT)</th>
                      <th>Net Salary</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.map((d, i) => {
                      const [y, m] = bulkMonth.split('-');
                      const monthDays = new Date(y, m, 0).getDate(); 
                      const lopDays = Math.max(0, monthDays - d.paidDays);
                      
                      return (
                      <tr key={i} style={{opacity: d.alreadyGenerated ? 0.5 : 1}}>
                        <td className="fw-bold dynamic-text-color">{d.name}</td>
                        <td className="text-success fw-bold">{d.paidDays}</td>
                        <td className={lopDays > 0 ? "text-danger fw-bold" : "text-muted"}>{lopDays > 0 ? lopDays : 0}</td>
                        <td className="text-success font-monospace">+₹{fmt(d.allowances.reduce((s,a)=>s+a.amount,0))}</td>
                        <td className="fw-bold fs-6">₹{fmt(d.netSalary)}</td>
                        <td>{d.alreadyGenerated ? <span className="badge bg-secondary">Already Exists</span> : <span className="badge bg-success">Ready</span>}</td>
                      </tr>
                    )})}
                  </tbody>
                </table>
              </div>

              <div className="d-flex justify-content-end gap-3 mt-3 pt-3 border-top border-secondary border-opacity-25">
                <button className="btn btn-fintech-outline" onClick={() => setShowPreviewModal(false)}>Cancel & Edit Leaves</button>
                <button className="btn btn-fintech-primary d-flex align-items-center gap-2" onClick={handleConfirmGenerate} disabled={isGenerating}>
                  {isGenerating ? <Loader size={20}/> : <><FaCheckCircle/> Save as Pending</>}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </DynamicLayout>
  );
};

export default PayrollManagement;