import React, { useEffect, useState } from "react";
import moment from "moment";
import AdminLayout from "./AdminLayout";
import axios from "axios";
import { FiSearch, FiDownload, FiCalendar, FiUser } from "react-icons/fi";
import { BsCalendar2Check } from "react-icons/bs";
import { Tooltip, OverlayTrigger } from "react-bootstrap";
import "./MonthlyAttendance.css";

const MonthlyAttendance = () => {
  const [data, setData] = useState([]);
  const [month, setMonth] = useState(moment().format("YYYY-MM"));
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const daysInMonth = moment(month, "YYYY-MM").daysInMonth();
  const user = JSON.parse(localStorage.getItem("user"));
  const token = user?.token;

  /* ================= FETCH ATTENDANCE ================= */
  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/attendance/monthly?month=${month}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setData(res.data.data || []);
    } catch (err) {
      console.error("Attendance fetch error", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [month]);

  /* ================= HELPERS ================= */
  const getStatusBadge = (status) => {
    switch (status) {
      case "Present": return <span className="ma-status-badge badge-p" title="Present">P</span>;
      case "Absent": return <span className="ma-status-badge badge-a" title="Absent">A</span>;
      case "Late": return <span className="ma-status-badge badge-l" title="Late">L</span>;
      case "On Leave": return <span className="ma-status-badge badge-lv" title="On Leave">LV</span>;
      case "Half Day": return <span className="ma-status-badge badge-lv" title="Half Day">HD</span>;
      case "Holiday": return <span className="ma-status-badge badge-h" title="Holiday">H</span>;
      case "Weekly Off": return <span className="ma-status-badge badge-wo" title="Weekly Off">W</span>;
      default: return <span className="ma-status-badge badge-none">-</span>;
    }
  };

const filteredData = data.filter(emp => {
  const safeName = emp.name || ""; // Agar name nahi hai to empty string maan lo
  const safeSearch = searchTerm || "";
  return safeName.toLowerCase().includes(safeSearch.toLowerCase());
});

  return (
    <AdminLayout>
      <div className="monthly-attendance-wrapper">
        <div className="ma-container">
          
          {/* PAGE HEADER */}
          <div className="ma-page-header">
            <div className="ma-header-title">
              <div className="ma-header-icon">
                <BsCalendar2Check />
              </div>
              <div>
                <h2>Monthly Attendance</h2>
                <p>Track and monitor employee attendance records</p>
              </div>
            </div>
          </div>

          {/* TOOLBAR */}
          <div className="ma-toolbar-card">
            <div className="ma-search-box">
              <FiSearch className="ma-search-icon" />
              <input 
                type="text" 
                placeholder="Search employee..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="ma-action-controls">
              <div className="ma-month-picker-wrapper">
                <FiCalendar className="ma-picker-icon" />
                <input
                  type="month"
                  className="ma-month-picker"
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                />
              </div>
              <button className="ma-btn-export">
                <FiDownload /> Export Report
              </button>
            </div>
          </div>

          {/* TABLE CARD */}
          <div className="ma-table-card">
            {loading ? (
              <div className="ma-loading-state">
                <div className="ma-spinner"></div>
                <p>Loading attendance data...</p>
              </div>
            ) : (
              <div className="ma-table-responsive ma-custom-scrollbar">
                <table className="ma-attendance-table">
                  <thead>
                    <tr>
                      <th className="ma-sticky-col-header">
                        <div className="d-flex align-items-center gap-2">
                          <FiUser /> Employee Details
                        </div>
                      </th>

                      {/* DYNAMIC DAYS HEADER */}
                      {Array.from({ length: daysInMonth }, (_, i) => {
                        const currentDate = moment(`${month}-${i + 1}`, "YYYY-MM-D");
                        const isWeekend = currentDate.day() === 0 || currentDate.day() === 6;
                        return (
                          <th key={`head-${i + 1}`} className={`ma-day-header ${isWeekend ? 'ma-weekend-header' : ''}`}>
                            <div className="ma-day-number">{i + 1}</div>
                            <div className="ma-day-name">{currentDate.format('ddd')}</div>
                          </th>
                        );
                      })}

                      {/* SUMMARY HEADERS */}
                      <th className="ma-summary-header th-present">Present</th>
                      <th className="ma-summary-header th-absent">Absent</th>
                      <th className="ma-summary-header th-late">Late</th>
                      <th className="ma-summary-header th-leave">Leave</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredData.length > 0 ? (
                      filteredData.map((emp) => (
                        <tr key={emp.employeeId} className="ma-table-row">
                          
                          {/* EMPLOYEE NAME (STICKY WITH TICKER) */}
                          <td className="ma-sticky-col-cell p-0">
                            {/* THIS WRAPPER STOPS UI STRETCHING */}
                            <div className="ma-cell-content-wrapper">
                                {/* Top: Employee Info */}
                                <div className="ma-employee-info">
                                  <div className="ma-avatar">
                                    {emp.name.charAt(0).toUpperCase()}
                                  </div>
                                  <div className="ma-name-wrapper">
                                    <span className="ma-emp-name">{emp.name}</span>
                                    <span className="ma-emp-id">ID: {emp.employeeId.slice(-6).toUpperCase()}</span>
                                  </div>
                                </div>

                                {/* Bottom: Animated Ticker */}
                                <div className="ma-ticker-wrap">
                                    <div className="ma-ticker">
                                        <span className="t-item t-p">P: <b>{emp.present || 0}</b></span>
                                        <span className="t-item t-a">A: <b>{emp.absent || 0}</b></span>
                                        <span className="t-item t-l">L: <b>{emp.late || 0}</b></span>
                                        <span className="t-item t-o">LV: <b>{emp.leave || 0}</b></span>
                                        {/* Cloned for seamless loop */}
                                        <span className="t-item t-p">P: <b>{emp.present || 0}</b></span>
                                        <span className="t-item t-a">A: <b>{emp.absent || 0}</b></span>
                                        <span className="t-item t-l">L: <b>{emp.late || 0}</b></span>
                                        <span className="t-item t-o">LV: <b>{emp.leave || 0}</b></span>
                                    </div>
                                </div>
                            </div>
                          </td>

                          {/* DAYS CELLS */}
                          {Array.from({ length: daysInMonth }, (_, i) => {
                            const day = i + 1;
                            const status = emp.attendance?.[day];
                            const currentDate = moment(`${month}-${day}`, "YYYY-MM-D");
                            const isWeekend = currentDate.day() === 0 || currentDate.day() === 6;

                            return (
                              <td key={`${emp.employeeId}-${day}`} className={`ma-day-cell ${isWeekend ? 'ma-weekend-cell' : ''}`}>
                                {getStatusBadge(status)}
                              </td>
                            );
                          })}

                          {/* SUMMARY CELLS */}
                          <td className="ma-summary-cell sum-present">{emp.present || 0}</td>
                          <td className="ma-summary-cell sum-absent">{emp.absent || 0}</td>
                          <td className="ma-summary-cell sum-late">{emp.late || 0}</td>
                          <td className="ma-summary-cell sum-leave">{emp.leave || 0}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={daysInMonth + 5} className="ma-empty-state">
                          No attendance records found for this month.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      </div>
    </AdminLayout>
  );
};

export default MonthlyAttendance;