import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import AdminLayout from "./AdminLayout";
import Loader from "./Loader/Loader";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { 
  FaFilePdf, FaFileExcel, FaSearch, FaMoneyBillWave, 
  FaUsers, FaCalendarAlt, FaFilter 
} from "react-icons/fa";
import { addCommonHeaderFooter, addCommonFooter } from "../../Utils/pdfHeaderFooter";
import { SettingsContext } from "../Redux/SettingsContext";
import "./FullAndFinalSalary.css"; // Ensure this is imported

const FullAndFinalSalary = () => {
  const [payrolls, setPayrolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDept, setSelectedDept] = useState("All");
  const [selectedMonth, setSelectedMonth] = useState("All");

  const { settings } = useContext(SettingsContext);
  const token = JSON.parse(localStorage.getItem("user"))?.token;

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/payrolls`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPayrolls(res.data.data.reverse());
    } catch (err) {
      console.error("Error fetching payrolls:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- Helpers ---
  const getUniqueDepartments = () => ["All", ...new Set(payrolls.map((p) => p.employeeId?.departmentId?.name).filter(Boolean))];
  const getUniqueMonths = () => ["All", ...new Set(payrolls.map((p) => p.month).filter(Boolean))];

  // --- Filtering ---
  const filteredPayrolls = payrolls.filter((p) => {
    const nameMatch = p.employeeId?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const deptMatch = selectedDept === "All" || p.employeeId?.departmentId?.name === selectedDept;
    const monthMatch = selectedMonth === "All" || p.month === selectedMonth;
    return nameMatch && deptMatch && monthMatch;
  });

  // --- Statistics ---
  const totalDisbursed = filteredPayrolls.reduce((acc, curr) => acc + (curr.netSalary || 0), 0);
  const totalRecords = filteredPayrolls.length;

  const fmt = (num) => num ? Number(num).toLocaleString("en-IN") : "0";

  // --- Export Logic (Same as yours, keeping functionality) ---
  const exportToPDF = async () => {
    const doc = new jsPDF("landscape", "mm", "a4");
    await addCommonHeaderFooter(doc, settings);
    
    // Title
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("FULL AND FINAL SETTLEMENT REPORT", 14, 45);
    
    // Meta info
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 52);
    doc.text(`Total Records: ${filteredPayrolls.length}`, 14, 58);
    doc.text(`Total Amount: Rs. ${fmt(totalDisbursed)}`, 14, 64);

    const rows = filteredPayrolls.map((p, i) => [
      i + 1,
      p.employeeId?.name || "-",
      p.employeeId?.departmentId?.name || "-",
      p.month,
      fmt(p.basicSalary),
      fmt(p.netSalary)
    ]);

    autoTable(doc, {
      startY: 70,
      head: [["#", "Employee", "Department", "Month", "Basic", "Net Salary"]],
      body: rows,
      theme: "grid",
      headStyles: { fillColor: [63, 81, 181] }
    });
    
    addCommonFooter(doc, settings);
    doc.save("FnF_Report.pdf");
  };

  const exportToExcel = () => {
    const excelData = filteredPayrolls.map((p, i) => ({
      S_No: i + 1,
      Employee: p.employeeId?.name,
      Department: p.employeeId?.departmentId?.name || "-",
      Month: p.month,
      Basic: p.basicSalary,
      Allowances: p.allowances?.map((a) => `${a.title}: ${a.amount}`).join(", "),
      Deductions: p.deductions?.map((d) => `${d.title}: ${d.amount}`).join(", "),
      Net_Salary: p.netSalary,
    }));
    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Salary Report");
    XLSX.writeFile(wb, "FnF_Report.xlsx");
  };

  return (
    <AdminLayout>
      <div className="container-fluid fnf-container px-4 py-4">
        
        {/* Header Section */}
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-center mb-4">
          <div>
            <h3 className="fw-bold m-0" style={{color: 'var(--text-dark)'}}>Full & Final Settlements</h3>
            <p className="text-secondary small m-0">View all salary disbursements and history</p>
          </div>
          <div className="d-flex gap-2 mt-3 mt-md-0">
             <button className="btn btn-action btn-success text-white" onClick={exportToExcel}>
               <FaFileExcel /> Excel
             </button>
             <button className="btn btn-action btn-danger text-white" onClick={exportToPDF}>
               <FaFilePdf /> PDF Report
             </button>
          </div>
        </div>

        {/* Summary Widgets */}
        <div className="row g-4 mb-4">
            <div className="col-md-6 col-xl-3">
                <div className="stat-card">
                    <div className="stat-icon bg-primary bg-opacity-10 text-primary">
                        <FaMoneyBillWave />
                    </div>
                    <div className="stat-info">
                        <h5>Total Disbursed</h5>
                        <h3>₹ {fmt(totalDisbursed)}</h3>
                    </div>
                </div>
            </div>
            <div className="col-md-6 col-xl-3">
                <div className="stat-card">
                    <div className="stat-icon bg-info bg-opacity-10 text-info">
                        <FaUsers />
                    </div>
                    <div className="stat-info">
                        <h5>Total Employees</h5>
                        <h3>{totalRecords}</h3>
                    </div>
                </div>
            </div>
            {/* You can add more cards here */}
        </div>

        {/* Main Content Card */}
        <div className="fnf-card p-4">
          
          {/* Filter Bar */}
          <div className="row g-3 mb-4 align-items-end">
             <div className="col-md-4">
                <label className="text-secondary small fw-bold mb-1">Search Employee</label>
                <div className="input-group">
                   <span className="input-group-text bg-white border-end-0"><FaSearch className="text-muted"/></span>
                   <input 
                      type="text" 
                      className="form-control modern-control border-start-0 ps-0" 
                      placeholder="Type name..." 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                   />
                </div>
             </div>
             <div className="col-md-3">
                <label className="text-secondary small fw-bold mb-1">Department</label>
                <select className="form-select modern-control" value={selectedDept} onChange={(e) => setSelectedDept(e.target.value)}>
                    {getUniqueDepartments().map((d, i) => <option key={i} value={d}>{d}</option>)}
                </select>
             </div>
             <div className="col-md-3">
                <label className="text-secondary small fw-bold mb-1">Month</label>
                <div className="input-group">
                    <span className="input-group-text bg-white border-end-0"><FaCalendarAlt className="text-muted"/></span>
                    <select className="form-select modern-control border-start-0 ps-2" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}>
                        {getUniqueMonths().map((m, i) => <option key={i} value={m}>{m}</option>)}
                    </select>
                </div>
             </div>
             <div className="col-md-2 text-end">
                <small className="text-muted">Showing {filteredPayrolls.length} records</small>
             </div>
          </div>

          {/* Table */}
          <div className="fnf-table-wrapper">
             <div className="table-responsive">
                <table className="table mb-0 fnf-table">
                   <thead>
                      <tr>
                         <th>#</th>
                         <th>Employee Details</th>
                         <th>Month</th>
                         <th className="text-center">Basic Salary</th>
                         <th className="text-center salary-text text-secondary" style={{minWidth: '200px'}}>Allowances</th>
                         <th className="text-center salary-text text-secondary" style={{minWidth: '200px'}}>Deductions</th>
                         <th className="text-end">Net Salary</th>
                      </tr>
                   </thead>
                   <tbody>
                      {loading ? (
                         <tr><td colSpan="7" className="text-center py-5"><Loader /></td></tr>
                      ) : filteredPayrolls.length === 0 ? (
                         <tr><td colSpan="7" className="text-center py-5 text-secondary">No records found matching criteria.</td></tr>
                      ) : (
                         filteredPayrolls.map((p, i) => (
                            <tr key={p._id}>
                               <td className="text-primary">{i + 1}</td>
                               <td>
                                  <div className="fw-bold text-dark">{p.employeeId?.name}</div>
                                  <div className="small text-muted text-danger">{p.employeeId?.departmentId?.name || "No Dept"}</div>
                               </td>
                               <td><span className="badge bg-light text-dark border">{p.month}</span></td>
                               
                               <td className="text-center salary-text text-secondary">₹{fmt(p.basicSalary)}</td>
                               
                               <td className="text-center salary-text text-secondary">
                                  {p.allowances?.length > 0 ? (
                                     <div className="d-flex flex-wrap">
                                        {p.allowances.map((a, idx) => (
                                           <span key={idx} className="mini-badge pos" title={a.title}>
                                              {a.title.slice(0,3)}: {a.amount}
                                           </span>
                                        ))}
                                     </div>
                                  ) : "-"}
                               </td>
                               
                               <td className="text-center salary-text text-secondary">
                                  {p.deductions?.length > 0 ? (
                                     <div className="d-flex flex-wrap">
                                        {p.deductions.map((d, idx) => (
                                           <span key={idx} className="mini-badge neg" title={d.title}>
                                              {d.title.slice(0,3)}: {d.amount}
                                           </span>
                                        ))}
                                     </div>
                                  ) : "-"}
                               </td>
                               
                               <td className="text-end">
                                  <span className="salary-text text-primary fs-6">₹{fmt(p.netSalary)}</span>
                               </td>
                            </tr>
                         ))
                      )}
                   </tbody>
                </table>
             </div>
          </div>
          
        </div>
      </div>
    </AdminLayout>
  );
};

export default FullAndFinalSalary;