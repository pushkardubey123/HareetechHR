import React, { useEffect, useState } from "react";
import axios from "axios";
import DynamicLayout from "../../Common/DynamicLayout";
import { 
  FaSearch, FaFileCsv, FaFilePdf, FaUserAlt, 
  FaCalendarAlt, FaClock 
} from "react-icons/fa";
import Papa from "papaparse";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import "./Timesheet.css";

const Timesheet = () => {
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [timesheets, setTimesheets] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);

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
        if (res.data.detailed?.attendance) {
          setPerms(res.data.detailed.attendance);
        }
      } catch (e) { console.error("Permission fetch failed", e); }
    };
    fetchPerms();
    fetchEmployees(); 
    fetchTimesheets();
  }, [token, isAdmin]);

  const fetchEmployees = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/user`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data.success) setEmployees(res.data.data);
    } catch (err) { console.log(err); }
  };

  const fetchTimesheets = async () => {
    setLoading(true);
    try {
      let query = `?`;
      if (startDate) query += `startDate=${startDate}&`;
      if (endDate) query += `endDate=${endDate}&`;
      if (selectedEmployee !== "all") query += `employee=${selectedEmployee}`;
      
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/timesheet/all${query}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) setTimesheets(res.data.data);
    } catch (err) { console.log(err); } 
    finally { setLoading(false); }
  };

  useEffect(() => { fetchTimesheets(); }, [startDate, endDate, selectedEmployee]);

  const filtered = timesheets.filter(
    (item) =>
      item?.employee?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item?.employee?.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const exportCSV = () => {
    const rows = filtered.map((item) => ({
      Date: new Date(item.date).toLocaleDateString(),
      Name: item.employee?.name,
      Status: item.status,
      Regular_Hrs: item.regularHours,
      OT_Hrs: item.otHours,
      Total_Payable: item.totalPayableHours
    }));
    const csv = Papa.unparse(rows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "Timesheet.csv";
    link.click();
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("Payroll Timesheet", 14, 15);
    autoTable(doc, {
      startY: 25,
      head: [["Date", "Name", "Status", "Reg Hrs", "OT Hrs", "Payable"]],
      body: filtered.map((t) => [
        new Date(t.date).toLocaleDateString(),
        t.employee?.name,
        t.status,
        t.regularHours,
        t.otHours,
        t.totalPayableHours
      ]),
    });
    doc.save("Timesheet.pdf");
  };

  return (
    <DynamicLayout>
      <div className="premium-timesheet-wrapper">
        <div className="pt-header">
          <div className="pt-title">
            <h2>Payroll Timesheet</h2>
            <p>Manage attendance, overtime, and payable hours.</p>
          </div>
          <div className="d-flex gap-3">
            <button className="pt-btn pt-btn-csv" onClick={exportCSV}><FaFileCsv /> Export CSV</button>
            <button className="pt-btn pt-btn-pdf" onClick={exportPDF}><FaFilePdf /> Export PDF</button>
          </div>
        </div>

        <div className="pt-filter-card">
          <div className="row g-3">
            <div className="col-md-3">
              <div className="pt-input-group">
                <FaCalendarAlt className="pt-icon" />
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
            </div>
            <div className="col-md-3">
              <div className="pt-input-group">
                <FaCalendarAlt className="pt-icon" />
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
            </div>
            <div className="col-md-3">
              <div className="pt-input-group">
                <FaUserAlt className="pt-icon" />
                <select value={selectedEmployee} onChange={(e) => setSelectedEmployee(e.target.value)}>
                  <option value="all">All Employees</option>
                  {employees.map((emp) => <option key={emp._id} value={emp._id}>{emp.name}</option>)}
                </select>
              </div>
            </div>
            <div className="col-md-3">
              <div className="pt-input-group">
                <FaSearch className="pt-icon" />
                <input type="text" placeholder="Search employee..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              </div>
            </div>
          </div>
        </div>

        <div className="pt-table-container">
          <div className="table-responsive">
            <table className="pt-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Employee Profile</th>
                  <th>Attendance Status</th>
                  <th>Regular Hrs</th>
                  <th>Overtime</th>
                  <th>Total Payable</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="6" className="text-center py-5">Loading data...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan="6" className="text-center py-5 text-muted">No records found matching filters.</td></tr>
                ) : (
                  filtered.map((t) => (
                    <tr key={t._id}>
                      <td>
                        <div className="fw-bold">{new Date(t.date).toLocaleDateString('en-GB', {day: '2-digit', month:'short', year:'numeric'})}</div>
                        <div className="small text-muted">{new Date(t.date).toLocaleDateString('en-GB', {weekday: 'long'})}</div>
                      </td>
                      <td>
                        <div className="fw-bold">{t.employee?.name}</div>
                        <div className="small text-muted" style={{fontSize: '0.8rem'}}>{t.employee?.email}</div>
                      </td>
                      <td>
                        <span className={`pt-badge ${t.status.toLowerCase()}`}>{t.status}</span>
                        {t.hasMissingCheckout && <div className="text-danger small mt-1 fw-bold" style={{fontSize:'0.75rem'}}>⚠ Checkout Missing</div>}
                      </td>
                      <td><span className="fw-bold">{t.regularHours}h</span></td>
                      <td>
                        {parseFloat(t.otHours) > 0 ? (
                          <div className={`pt-ot-badge ${t.isOtApproved ? 'approved' : 'pending'}`}>
                            {t.otHours}h {t.isOtApproved ? 'Approved' : 'Pending'}
                          </div>
                        ) : <span className="text-muted opacity-50">-</span>}
                      </td>
                      <td><span className="pt-payable">{t.totalPayableHours}h</span></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DynamicLayout>
  );
};

export default Timesheet;