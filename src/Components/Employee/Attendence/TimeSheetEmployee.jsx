import React, { useEffect, useState, useContext, useMemo } from "react";
import axios from "axios";
import EmployeeLayout from "../EmployeeLayout";
import { 
  FaSearch, FaFileCsv, FaFilePdf, FaClock, FaCalendarCheck, 
  FaHourglassHalf, FaBusinessTime, FaCalendarAlt 
} from "react-icons/fa";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Papa from "papaparse";
import Swal from "sweetalert2";
import { SettingsContext } from "../../Redux/SettingsContext"; 
import { addCommonHeaderFooter, addCommonFooter } from "../../../Utils/pdfHeaderFooter";
import TableLoader from "../../Admin/Loader/Loader";
import "./EmployeeTimesheet.css"; // Ensure you created the CSS file

const EmployeeTimesheet = () => {
  const [timesheets, setTimesheets] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const user = JSON.parse(localStorage.getItem("user"));
  const token = user?.token;
  const employeeId = user?.id;
  const { settings } = useContext(SettingsContext);

  // --- FETCH DATA ---
  const fetchTimesheets = async () => {
    setLoading(true);
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/timesheet/employee/${employeeId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        setTimesheets(res.data.data.reverse()); // Latest first
      }
    } catch (err) {
      console.error("Error fetching timesheets:", err);
      // Removed Swal to prevent popup on simple errors, console is enough
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTimesheets(); }, []);

  // --- FILTER LOGIC ---
  const filteredData = useMemo(() => {
    return timesheets.filter((item) => {
      const matchSearch = new Date(item.date).toLocaleDateString().includes(searchQuery) || 
                          (item.remark && item.remark.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const itemDate = new Date(item.date).toISOString().split('T')[0];
      const matchDate = (!startDate || itemDate >= startDate) && (!endDate || itemDate <= endDate);

      return matchSearch && matchDate;
    });
  }, [timesheets, searchQuery, startDate, endDate]);

  // --- STATS CALCULATION ---
  const stats = useMemo(() => {
    const totalHours = filteredData.reduce((acc, curr) => acc + (parseFloat(curr.totalPayableHours) || 0), 0);
    const daysWorked = filteredData.filter(d => d.status !== 'Absent').length;
    const avgHours = daysWorked > 0 ? (totalHours / daysWorked).toFixed(1) : 0;
    
    return { totalHours: totalHours.toFixed(1), daysWorked, avgHours };
  }, [filteredData]);

  // --- EXPORT CSV ---
  const exportCSV = () => {
    const rows = filteredData.map((item) => ({
      Date: new Date(item.date).toLocaleDateString(),
      Status: item.status,
      Regular_Hrs: item.regularHours,
      OT_Hrs: item.otHours,
      Total_Payable: item.totalPayableHours,
      Remark: item.remark || "-",
    }));
    const csv = Papa.unparse(rows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "My_Timesheet.csv";
    link.click();
  };

  // --- EXPORT PDF ---
  const exportPDF = async () => {
    const doc = new jsPDF();
    await addCommonHeaderFooter(doc, settings);

    doc.setFontSize(14); doc.setFont("helvetica", "bold");
    doc.text("MY TIMESHEET REPORT", 14, 45);

    const rows = filteredData.map((item) => [
      new Date(item.date).toLocaleDateString(),
      item.status,
      item.regularHours,
      item.otHours,
      item.totalPayableHours,
    ]);

    autoTable(doc, {
      startY: 50,
      head: [["Date", "Status", "Regular", "Overtime", "Payable"]],
      body: rows,
      theme: "grid",
      headStyles: { fillColor: [79, 70, 229] },
    });

    addCommonFooter(doc, settings);
    doc.save("My_Timesheet.pdf");
  };

  return (
    <EmployeeLayout>
      <div className="et-wrapper">
        
        {/* HEADER */}
        <div className="et-header animate__animated animate__fadeInDown">
          <div className="et-title">
            <h3><FaClock className="text-primary"/> My Timesheet</h3>
            <p>View detailed breakdown of your working hours.</p>
          </div>
        </div>

        {/* STATS CARDS */}
        <div className="et-stats-grid">
          <div className="et-stat-card purple">
            <div className="et-icon-box"><FaHourglassHalf /></div>
            <div className="et-stat-info">
              <h4>{stats.totalHours}</h4>
              <span>Payable Hours</span>
            </div>
          </div>
          <div className="et-stat-card blue">
            <div className="et-icon-box"><FaCalendarCheck /></div>
            <div className="et-stat-info">
              <h4>{stats.daysWorked}</h4>
              <span>Days Present</span>
            </div>
          </div>
          <div className="et-stat-card green">
            <div className="et-icon-box"><FaBusinessTime /></div>
            <div className="et-stat-info">
              <h4>{stats.avgHours}</h4>
              <span>Avg Hrs/Day</span>
            </div>
          </div>
        </div>

        {/* FILTERS */}
        <div className="et-filter-bar animate__animated animate__fadeInUp">
          <div className="et-input-group">
            <FaCalendarAlt className="et-icon" />
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div className="et-input-group">
            <FaCalendarAlt className="et-icon" />
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
          <div className="et-input-group" style={{flex: 2}}>
            <FaSearch className="et-icon" />
            <input type="text" placeholder="Search by date..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
          
          <div className="et-btn-group">
            <button className="et-btn et-btn-pdf" onClick={exportPDF}><FaFilePdf /> PDF</button>
            <button className="et-btn et-btn-csv" onClick={exportCSV}><FaFileCsv /> CSV</button>
          </div>
        </div>

        {/* TABLE */}
        <div className="et-table-container animate__animated animate__fadeInUp">
          {loading ? (
            <div className="p-5"><TableLoader /></div>
          ) : (
            <div className="table-responsive">
              <table className="et-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Regular Hrs</th>
                    <th>Overtime</th>
                    <th>Total Payable</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.length === 0 ? (
                    <tr><td colSpan="5" className="text-center p-5 text-muted">No records found.</td></tr>
                  ) : (
                    filteredData.map((item) => (
                      <tr key={item._id}>
                        <td>
                          <div className="fw-bold">{new Date(item.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                          <small className="text-muted">{new Date(item.date).toLocaleDateString('en-GB', { weekday: 'long' })}</small>
                        </td>
                        <td>
                          <span className={`et-badge et-${item.status.toLowerCase()}`}>{item.status}</span>
                        </td>
                        <td>
                          <span className="fw-bold text-muted">{item.regularHours}h</span>
                        </td>
                        <td>
                          {parseFloat(item.otHours) > 0 ? (
                            <div className={`et-ot-badge ${item.isOtApproved ? 'approved' : 'pending'}`}>
                              {item.otHours}h {item.isOtApproved ? '(Appr)' : '(Pend)'}
                            </div>
                          ) : (
                            <span className="text-muted opacity-50">-</span>
                          )}
                        </td>
                        <td>
                          <span className="et-payable">{item.totalPayableHours}h</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </EmployeeLayout>
  );
};

export default EmployeeTimesheet;