import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import DynamicLayout from "../Common/DynamicLayout";
import Loader from "./Loader/Loader";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import moment from "moment";
import { 
  FaFilePdf, FaFileExcel, FaSearch, FaMoneyBillWave, 
  FaUsers, FaCalendarAlt, FaFilter, FaFileInvoiceDollar, FaBuilding
} from "react-icons/fa";
import { addCommonHeaderFooter, addCommonFooter } from "../../Utils/pdfHeaderFooter";
import { generateSalarySlipPDF } from "./generateSalarySlipPDF";
import { SettingsContext } from "../Redux/SettingsContext";
import "./FullAndFinalSalary.css"; 

const FullAndFinalSalary = () => {
  const [payrolls, setPayrolls] = useState([]);
  const [employees, setEmployees] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDept, setSelectedDept] = useState("All");
  const [selectedMonth, setSelectedMonth] = useState("All");

  const { settings } = useContext(SettingsContext);
  
  // ✅ PERMISSION LOGIC
  const userStr = localStorage.getItem("user");
  const userObj = userStr ? JSON.parse(userStr) : null;
  const token = userObj?.token;
  const isAdmin = userObj?.role === "admin";
  const [perms, setPerms] = useState({ view: false, create: false, edit: false, delete: false });

  useEffect(() => {
    const fetchPerms = async () => {
      if (isAdmin || !token) return;
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/my-modules`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.detailed?.payroll) {
          setPerms(res.data.detailed.payroll);
        }
      } catch (e) {
        console.error("Permission fetch failed", e);
      }
    };
    fetchPerms();
    fetchData();
  }, [token, isAdmin]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [payRes, empRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_URL}/api/payrolls`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${import.meta.env.VITE_API_URL}/user`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setPayrolls(payRes.data.data.reverse());
      setEmployees(empRes.data.data.filter(e => e.role === "employee"));
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  const getUniqueDepartments = () => ["All", ...new Set(payrolls.map((p) => p.employeeId?.departmentId?.name).filter(Boolean))];
  const getUniqueMonths = () => ["All", ...new Set(payrolls.map((p) => p.month).filter(Boolean))];

  const filteredPayrolls = payrolls.filter((p) => {
    const nameMatch = p.employeeId?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const deptMatch = selectedDept === "All" || p.employeeId?.departmentId?.name === selectedDept;
    const monthMatch = selectedMonth === "All" || p.month === selectedMonth;
    return nameMatch && deptMatch && monthMatch;
  });

  const totalDisbursed = filteredPayrolls.reduce((acc, curr) => acc + (curr.netSalary || 0), 0);
  const totalRecords = filteredPayrolls.length;

  const fmt = (num) => num ? Number(num).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0.00";

  const exportToPDF = async () => {
    if (filteredPayrolls.length === 0) {
      alert("No records found to export.");
      return;
    }
    const doc = new jsPDF("landscape", "mm", "a4");
    const pageWidth = doc.internal.pageSize.getWidth();
    try { await addCommonHeaderFooter(doc, settings); } catch (e) {}

    let currentY = 60;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(20, 20, 20); 
    
    let reportTitle = "FULL & FINAL SETTLEMENT REPORT";
    if (searchTerm) reportTitle = `EMPLOYEE STATEMENT: ${searchTerm.toUpperCase()}`;
    else if (selectedMonth !== "All") reportTitle = `MONTHLY PAYROLL REPORT - ${moment(selectedMonth, "YYYY-MM").format("MMMM YYYY").toUpperCase()}`;
    
    doc.text(reportTitle, pageWidth / 2, currentY, { align: "center" });
    currentY += 8;

    let subTitle = [];
    if (selectedDept !== "All") subTitle.push(`Department: ${selectedDept}`);
    if (selectedMonth !== "All" && !searchTerm) subTitle.push(`Period: ${selectedMonth}`);
    
    if (subTitle.length > 0) {
        doc.setFontSize(10);
        doc.setFont("helvetica", "italic");
        doc.setTextColor(100, 100, 100);
        doc.text(subTitle.join("   |   "), pageWidth / 2, currentY, { align: "center" });
        currentY += 8;
    }

    doc.setDrawColor(180, 180, 180);
    doc.setFillColor(248, 248, 248);
    doc.roundedRect(14, currentY, pageWidth - 28, 20, 2, 2, "FD");

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(40, 40, 40);
    
    doc.text("Total Records :", 18, currentY + 8);
    doc.setFont("helvetica", "normal");
    doc.text(`${totalRecords}`, 50, currentY + 8);
    
    doc.setFont("helvetica", "bold");
    doc.text("Total Disbursed :", 18, currentY + 15);
    doc.setFont("helvetica", "normal");
    doc.text(`Rs. ${fmt(totalDisbursed)}`, 50, currentY + 15);

    const generatedOn = moment().format('DD MMM YYYY, hh:mm A');
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated On: ${generatedOn}`, pageWidth - 18, currentY + 12, { align: "right" });

    currentY += 30;

    autoTable(doc, {
      startY: currentY,
      head: [["S.No", "Employee Name", "Department", "Period", "Basic Pay", "Allowances", "Deductions", "Net Salary"]],
      body: filteredPayrolls.map((p, i) => {
        const allws = p.allowances?.reduce((s, a) => s + (Number(a.amount) || 0), 0);
        const deds = p.deductions?.reduce((s, d) => s + (Number(d.amount) || 0), 0);
        return [
          i + 1, p.employeeId?.name || "N/A", p.employeeId?.departmentId?.name || "N/A",
          p.month, fmt(p.basicSalary), `+ ${fmt(allws)}`, `- ${fmt(deds)}`, fmt(p.netSalary)
        ];
      }),
      theme: "grid",
      headStyles: { fillColor: [30, 30, 32], textColor: [255, 255, 255], fontStyle: "bold", halign: "center" },
      bodyStyles: { textColor: [20, 20, 20], lineColor: [180, 180, 180] },
      alternateRowStyles: { fillColor: [248, 248, 250] },
      columnStyles: {
        0: { halign: "center", cellWidth: 15 }, 1: { halign: "left", fontStyle: "bold" }, 2: { halign: "left" },
        3: { halign: "center" }, 4: { halign: "right" }, 5: { halign: "right", textColor: [60, 60, 60] },
        6: { halign: "right", textColor: [60, 60, 60] }, 7: { halign: "right", fontStyle: "bold" }
      },
      styles: { fontSize: 9, cellPadding: 5 },
      margin: { left: 14, right: 14 }
    });

    try { addCommonFooter(doc, settings); } catch (e) {}

    let fileName = `Settlement_Report`;
    if (selectedMonth !== "All") fileName += `_${selectedMonth}`;
    if (searchTerm) fileName += `_${searchTerm.replace(/\s+/g, '')}`;
    doc.save(`${fileName}.pdf`);
  };

  const exportToExcel = () => {
    const excelData = filteredPayrolls.map((p, i) => ({
      S_No: i + 1, Employee: p.employeeId?.name, Department: p.employeeId?.departmentId?.name || "-",
      Month: p.month, Basic: p.basicSalary,
      Allowances: p.allowances?.map((a) => `${a.title}: ${a.amount}`).join(", ") || "-",
      Deductions: p.deductions?.map((d) => `${d.title}: ${d.amount}`).join(", ") || "-",
      Net_Salary: p.netSalary,
    }));
    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Salary Report");
    XLSX.writeFile(wb, "Full_And_Final_Report.xlsx");
  };

  return (
    <DynamicLayout>
      <div className="fnf-super-container">
        
        <div className="fnf-header-bar mb-4">
          <div className="header-titles">
            <h2 className="m-0 fw-bolder">Full & Final Settlements</h2>
            <p className="text-muted m-0 mt-1">Comprehensive view of all salary disbursements and financial records.</p>
          </div>
          <div className="header-actions">
             <button className="btn-premium btn-excel" onClick={exportToExcel}>
               <FaFileExcel size={16}/> Export Excel
             </button>
             <button className="btn-premium btn-pdf" onClick={exportToPDF}>
               <FaFilePdf size={16}/> Export Report PDF
             </button>
          </div>
        </div>

        <div className="row g-4 mb-4">
            <div className="col-md-6 col-xl-4">
                <div className="premium-stat-card card-blue">
                    <div className="stat-icon-box"><FaMoneyBillWave /></div>
                    <div className="stat-content">
                        <span className="stat-label">Total Disbursed Amount</span>
                        <h3 className="stat-value">₹ {fmt(totalDisbursed)}</h3>
                    </div>
                </div>
            </div>
            <div className="col-md-6 col-xl-4">
                <div className="premium-stat-card card-purple">
                    <div className="stat-icon-box"><FaUsers /></div>
                    <div className="stat-content">
                        <span className="stat-label">Records Found</span>
                        <h3 className="stat-value">{totalRecords} Entries</h3>
                    </div>
                </div>
            </div>
            <div className="col-md-12 col-xl-4">
                <div className="premium-stat-card card-outline flex-row align-items-center justify-content-center">
                   <div className="text-center">
                     <p className="mb-1 text-muted small">Current Applied Filter</p>
                     <h5 className="fw-bold m-0" style={{color: 'var(--text-main)'}}>
                       {selectedMonth === "All" ? "All Time" : moment(selectedMonth, "YYYY-MM").format("MMMM YYYY")}
                     </h5>
                   </div>
                </div>
            </div>
        </div>

        <div className="fnf-main-card">
          <div className="fnf-filter-section">
             <div className="filter-group flex-grow-1">
                <label><FaSearch/> Search Employee</label>
                <input type="text" className="premium-input" placeholder="Type name here..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
             </div>
             <div className="filter-group">
                <label><FaBuilding/> Department</label>
                <select className="premium-select" value={selectedDept} onChange={(e) => setSelectedDept(e.target.value)}>
                    {getUniqueDepartments().map((d, i) => <option key={i} value={d}>{d}</option>)}
                </select>
             </div>
             <div className="filter-group">
                <label><FaCalendarAlt/> Salary Month</label>
                <select className="premium-select" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}>
                    {getUniqueMonths().map((m, i) => <option key={i} value={m}>{m}</option>)}
                </select>
             </div>
          </div>

          <div className="fnf-table-wrapper">
             <div className="table-responsive">
                <table className="premium-table">
                   <thead>
                      <tr>
                         <th width="5%">#</th>
                         <th width="20%">Employee Details</th>
                         <th width="10%">Period</th>
                         <th width="15%" className="text-end">Basic Salary</th>
                         <th width="20%">Allowances</th>
                         <th width="15%">Deductions</th>
                         <th width="15%" className="text-end">Net Salary</th>
                         <th width="10%" className="text-center">Slip</th>
                      </tr>
                   </thead>
                   <tbody>
                      {loading ? (
                         <tr><td colSpan="8" className="text-center py-5"><Loader /></td></tr>
                      ) : filteredPayrolls.length === 0 ? (
                         <tr><td colSpan="8" className="text-center py-5"><div className="empty-state">No records found matching criteria.</div></td></tr>
                      ) : (
                         filteredPayrolls.map((p, i) => (
                            <tr key={p._id}>
                               <td className="fw-bold opacity-50">{i + 1}</td>
                               <td>
                                  <div className="emp-name">{p.employeeId?.name}</div>
                                  <div className="emp-dept">{p.employeeId?.departmentId?.name || "No Dept"}</div>
                               </td>
                               <td><span className="badge-period">{p.month}</span></td>
                               <td className="text-end fw-medium">₹{fmt(p.basicSalary)}</td>
                               <td>
                                  {p.allowances?.length > 0 ? (
                                     <div className="badge-container">
                                        {p.allowances.map((a, idx) => (
                                           <span key={idx} className="chip-pos" title={a.title}>{a.title.slice(0,3)}: {a.amount}</span>
                                        ))}
                                     </div>
                                  ) : <span className="opacity-25">-</span>}
                               </td>
                               <td>
                                  {p.deductions?.length > 0 ? (
                                     <div className="badge-container">
                                        {p.deductions.map((d, idx) => (
                                           <span key={idx} className="chip-neg" title={d.title}>{d.title.slice(0,3)}: {d.amount}</span>
                                        ))}
                                     </div>
                                  ) : <span className="opacity-25">-</span>}
                               </td>
                               <td className="text-end"><span className="net-pay-highlight">₹{fmt(p.netSalary)}</span></td>
                               <td className="text-center">
                                  <button className="btn-icon-download" title="Download Payslip" onClick={() => generateSalarySlipPDF(p, settings, employees)}>
                                    <FaFileInvoiceDollar size={18} />
                                  </button>
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
    </DynamicLayout>
  );
};

export default FullAndFinalSalary;