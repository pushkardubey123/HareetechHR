import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Papa from "papaparse";
import AdminLayout from "./AdminLayout";
import Loader from "./Loader/Loader";
import { addCommonHeaderFooter, addCommonFooter } from "../../Utils/pdfHeaderFooter";
import { SettingsContext } from "../Redux/SettingsContext";
import { 
  FaFilePdf, FaFileCsv, FaWallet, FaArrowUp, 
  FaArrowDown, FaUserTie, FaFilter, FaChevronLeft, FaChevronRight 
} from "react-icons/fa";
import { BiMoney } from "react-icons/bi";
import "./PayrollReport.css";

const PayrollReport = () => {
  const [payrolls, setPayrolls] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; // Change this to show more rows

  const { settings } = useContext(SettingsContext);
  const token = JSON.parse(localStorage.getItem("user"))?.token;

  // --- Fetch Data ---
  const fetchPayrolls = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/payrolls`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPayrolls(res.data.data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchPayrolls(); }, []);

  // --- Reset Pagination when Filters Change ---
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedMonth, selectedEmployee, selectedStatus]);

  // --- Derived Data ---
  
  // 1. Employee List (Unique & Safe)
  const employeeList = Array.from(
    new Set(
      payrolls
        .filter((p) => p.employeeId && p.employeeId._id)
        .map((p) => JSON.stringify({ id: p.employeeId._id, name: p.employeeId.name }))
    )
  ).map((str) => JSON.parse(str));

  // 2. Filtered Data
  const filteredPayrolls = payrolls.filter((p) => {
    const matchMonth = selectedMonth ? p.month === selectedMonth : true;
    const matchEmployee = selectedEmployee ? p.employeeId?._id === selectedEmployee : true;
    const matchStatus = selectedStatus ? p.status === selectedStatus : true;
    return matchMonth && matchEmployee && matchStatus;
  });

  // 3. Totals (Based on filtered data)
  const totalBasic = filteredPayrolls.reduce((sum, p) => sum + p.basicSalary, 0);
  const totalNet = filteredPayrolls.reduce((sum, p) => sum + p.netSalary, 0);
  const totalAllowances = filteredPayrolls.reduce((sum, p) => sum + (p.allowances?.reduce((a, x) => a + x.amount, 0) || 0), 0);
  const totalDeductions = filteredPayrolls.reduce((sum, p) => sum + (p.deductions?.reduce((a, x) => a + x.amount, 0) || 0), 0);

  // 4. Pagination Logic
  const totalPages = Math.ceil(filteredPayrolls.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredPayrolls.slice(indexOfFirstItem, indexOfLastItem);

  // --- Export Functions ---
  const exportToPDF = async() => {
    const doc = new jsPDF("landscape", "mm", "a4");
    const pageWidth = doc.internal.pageSize.getWidth();
    await addCommonHeaderFooter(doc, settings);

    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold"); doc.setFontSize(13);
    doc.text("PAYROLL REPORT", pageWidth / 2, 42, { align: "center" });
    doc.setFont("helvetica", "normal"); doc.setFontSize(10);
    doc.text(`Month: ${selectedMonth || "All"}`, 14, 50);

    const rows = filteredPayrolls.map((p, i) => [
      i + 1, p.employeeId?.name || "Deleted", p.employeeId?.email || "-", p.month,
      `Rs.${p.basicSalary}`, `Rs.${p.allowances?.reduce((s, a) => s + a.amount, 0) || 0}`,
      `Rs.${p.deductions?.reduce((s, d) => s + d.amount, 0) || 0}`, `Rs.${p.netSalary}`, p.status
    ]);

    autoTable(doc, {
      startY: 60,
      head: [["#", "Employee", "Email", "Month", "Basic", "Allow", "Deduct", "Net", "Status"]],
      body: rows,
      theme: "grid",
      headStyles: { fillColor: [0, 0, 0], textColor: [255, 255, 255] },
    });
    addCommonFooter(doc, settings);
    doc.save("Payroll_Report.pdf");
  };

  const exportToCSV = () => {
    const csvData = filteredPayrolls.map((p, i) => ({
      S_No: i + 1, Employee: p.employeeId?.name, Basic: p.basicSalary, Net: p.netSalary, Status: p.status
    }));
    const csv = Papa.unparse(csvData);
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    link.setAttribute("download", "Payroll_Report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <AdminLayout>
      <div className="payroll-container">
        
        {/* Header & Export */}
        <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
          <div>
            <h4 className="fw-bold mb-1" style={{ color: 'var(--text-primary)' }}>Payroll Overview</h4>
            <p className="small mb-0" style={{ color: 'var(--text-secondary)' }}>Manage salaries and export reports</p>
          </div>
          <div className="d-flex gap-2">
            <button className="btn btn-outline-success btn-sm d-flex align-items-center gap-2" onClick={exportToCSV}>
              <FaFileCsv /> CSV
            </button>
            <button className="btn btn-primary btn-sm d-flex align-items-center gap-2 shadow-sm" onClick={exportToPDF}>
              <FaFilePdf /> PDF
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="row g-3 mb-4">
          <div className="col-12 col-md-6 col-xl-3">
            <div className="stat-widget">
              <div className="stat-icon bg-primary bg-opacity-10 text-primary"><FaWallet /></div>
              <div className="stat-content">
                <p>Total Basic</p>
                <h4>₹{totalBasic.toLocaleString()}</h4>
              </div>
            </div>
          </div>
          <div className="col-12 col-md-6 col-xl-3">
             <div className="stat-widget">
               <div className="stat-icon bg-success bg-opacity-10 text-success"><FaArrowUp /></div>
               <div className="stat-content">
                 <p>Allowances</p>
                 <h4>₹{totalAllowances.toLocaleString()}</h4>
               </div>
             </div>
          </div>
          <div className="col-12 col-md-6 col-xl-3">
             <div className="stat-widget">
               <div className="stat-icon bg-danger bg-opacity-10 text-danger"><FaArrowDown /></div>
               <div className="stat-content">
                 <p>Deductions</p>
                 <h4>₹{totalDeductions.toLocaleString()}</h4>
               </div>
             </div>
          </div>
          <div className="col-12 col-md-6 col-xl-3">
             <div className="stat-widget border-primary border-opacity-25" style={{background: 'rgba(79, 70, 229, 0.04)'}}>
               <div className="stat-icon bg-primary text-white shadow-sm"><BiMoney /></div>
               <div className="stat-content">
                 <p className="text-primary">Net Payable</p>
                 <h4 className="text-primary">₹{totalNet.toLocaleString()}</h4>
               </div>
             </div>
          </div>
        </div>

        {/* Filters */}
        <div className="premium-card p-3 mb-4">
           <div className="row g-3">
              <div className="col-md-4">
                 <div className="filter-label"><FaUserTie className="me-1"/> Employee</div>
                 <select className="form-select premium-input" value={selectedEmployee} onChange={e => setSelectedEmployee(e.target.value)}>
                    <option value="">All Employees</option>
                    {employeeList.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
                 </select>
              </div>
              <div className="col-md-4">
                 <div className="filter-label"><FaFilter className="me-1"/> Month</div>
                 <input type="month" className="form-control premium-input" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} />
              </div>
              <div className="col-md-4">
                 <div className="filter-label"><FaFilter className="me-1"/> Status</div>
                 <select className="form-select premium-input" value={selectedStatus} onChange={e => setSelectedStatus(e.target.value)}>
                    <option value="">All Status</option>
                    <option value="Paid">Paid</option>
                    <option value="Pending">Pending</option>
                 </select>
              </div>
           </div>
        </div>

        {/* --- Table Wrapper (Flex Container) --- */}
        <div className="payroll-table-wrapper">
          
          {/* 1. Scrollable Table Area */}
          <div className="table-scroll-area">
            <table className="premium-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Month</th>
                  <th>Basic</th>
                  <th>Allowances</th>
                  <th>Deductions</th>
                  <th>Net Salary</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="7" className="text-center py-5"><Loader /></td></tr>
                ) : currentItems.length === 0 ? (
                  <tr><td colSpan="7" className="text-center py-5 text-muted">No records found.</td></tr>
                ) : (
                  currentItems.map((p) => (
                    <tr key={p._id}>
                      <td>
                        <div className="d-flex align-items-center gap-3">
                           <div className="emp-avatar">
                              {p.employeeId?.name?.charAt(0) || "U"}
                           </div>
                           <div>
                              <div className="fw-bold">{p.employeeId?.name || "Deleted User"}</div>
                              <div className="small opacity-50">{p.employeeId?.email}</div>
                           </div>
                        </div>
                      </td>
                      <td className="text-muted fw-semibold">{p.month}</td>
                      <td>₹{p.basicSalary.toLocaleString()}</td>
                      <td className="text-success">+₹{(p.allowances?.reduce((s,a)=>s+a.amount,0) || 0).toLocaleString()}</td>
                      <td className="text-danger">-₹{(p.deductions?.reduce((s,d)=>s+d.amount,0) || 0).toLocaleString()}</td>
                      <td className="fw-bold">₹{p.netSalary.toLocaleString()}</td>
                      <td>
                         <span className={`status-badge ${p.status === 'Paid' ? 'status-paid' : 'status-pending'}`}>
                            {p.status}
                         </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* 2. Fixed Pagination Footer */}
          {!loading && filteredPayrolls.length > 0 && (
            <div className="pagination-footer">
                <span className="page-info">
                    Showing <span style={{color: 'var(--primary-color)', fontWeight: 'bold'}}>
                        {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredPayrolls.length)}
                    </span> of {filteredPayrolls.length} entries
                </span>
                
                <div className="d-flex gap-2">
                    <button className="pg-btn" disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)}>
                        <FaChevronLeft />
                    </button>
                    
                    {/* Show limited page numbers */}
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter(num => num === 1 || num === totalPages || (num >= currentPage - 1 && num <= currentPage + 1))
                        .map((num, idx, arr) => (
                           <React.Fragment key={num}>
                               {idx > 0 && num !== arr[idx - 1] + 1 && <span className="px-1 pt-2">...</span>}
                               <button 
                                  className={`pg-btn ${currentPage === num ? 'active' : ''}`}
                                  onClick={() => setCurrentPage(num)}
                               >
                                  {num}
                               </button>
                           </React.Fragment>
                        ))
                    }

                    <button className="pg-btn" disabled={currentPage === totalPages} onClick={() => setCurrentPage(prev => prev + 1)}>
                        <FaChevronRight />
                    </button>
                </div>
            </div>
          )}

        </div>
      </div>
    </AdminLayout>
  );
};

export default PayrollReport;