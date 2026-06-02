import React, { useState, useEffect, useContext, useMemo } from "react";
import Swal from "sweetalert2";
import axios from "axios";
import EmployeeLayout from "../Common/DynamicLayout";
import "./MarkAttendance.css"; 
import {
  FaCheckCircle, FaRegCircle, FaPlay, FaPause, 
  FaMapMarkerAlt, FaCamera, FaHistory, FaLongArrowAltRight,
  FaCalendarTimes, FaFilePdf, FaChevronLeft, FaChevronRight
} from "react-icons/fa";
import { MdVerified } from "react-icons/md";
import moment from "moment";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { SettingsContext } from "../Redux/SettingsContext"; // If you have settings context for PDF logo

const MarkAttendance = () => {
  // --- EXISTING STATES ---
  const [loading, setLoading] = useState(false);
  const [markedToday, setMarkedToday] = useState(false);
  const [inOutLogs, setInOutLogs] = useState([]);
  const [faceRequired, setFaceRequired] = useState(false);
  const [companySettings, setCompanySettings] = useState({ isSaturdayOff: true, isSundayOff: true });
  const [holidays, setHolidays] = useState([]);

  // --- NEW STATES FOR TABLE & FILTERS ---
  const [attendances, setAttendances] = useState([]);
  const [originalAttendance, setOriginalAttendance] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(moment().format("MM"));
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 10;
  const { settings } = useContext(SettingsContext) || {};

  const API_URL = import.meta.env.VITE_API_URL;
  const user = JSON.parse(localStorage.getItem("user"));
  const token = user?.token;

  useEffect(() => {
    if (user?.id || user?._id) {
      fetchAttendanceData(user?.id || user?._id);
      fetchAdminSettings();
      fetchHolidays();
    }
  }, []);

  // --- FETCH API CALLS ---
  const fetchAdminSettings = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/settings`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data.success) {
        const data = res.data.data;
        setFaceRequired(data?.attendance?.faceRequired || false);
        setCompanySettings({
            isSaturdayOff: data?.attendance?.isSaturdayOff ?? true,
            isSundayOff: data?.attendance?.isSundayOff ?? true
        });
      }
    } catch (err) { console.error(err); }
  };

  const fetchHolidays = async () => {
    try {
        const res = await axios.get(`${API_URL}/api/holidays`, { headers: { Authorization: `Bearer ${token}` } });
        if(res.data.success) {
            setHolidays(res.data.data.holidays || []);
        }
    } catch (err) { console.error("Error fetching holidays", err); }
  };

  const fetchAttendanceData = async (employeeId) => {
    try {
      const res = await axios.get(`${API_URL}/api/attendance/employee/${employeeId}`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data.success && Array.isArray(res.data.data)) {
        // Full Data for Table
        const sortedData = res.data.data.sort((a, b) => new Date(b.date) - new Date(a.date));
        setAttendances(sortedData);
        setOriginalAttendance(sortedData);

        // Today's Logic for Widget
        const todayIST = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
        const todayLog = sortedData.find(log => new Date(log.date).toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" }) === todayIST);
        
        if (todayLog) {
          setMarkedToday(true);
          setInOutLogs(todayLog.inOutLogs || []);
        }
      }
    } catch (err) { console.error(err); }
  };

  // --- HELPER LOGIC ---
  const checkRestrictedDay = () => {
    const today = new Date();
    const dayOfWeek = today.getDay(); 
    const dateStr = today.toISOString().split('T')[0]; 

    if (dayOfWeek === 0 && companySettings.isSundayOff) return "It's Sunday (Weekly Off)";
    if (dayOfWeek === 6 && companySettings.isSaturdayOff) return "It's Saturday (Weekly Off)";

    const isHoliday = holidays.find(h => {
        const start = h.startDate.split('T')[0];
        const end = h.endDate ? h.endDate.split('T')[0] : start;
        return dateStr >= start && dateStr <= end;
    });

    if (isHoliday) return `Holiday: ${isHoliday.name}`;
    return null; 
  };

  const captureSelfie = () => { /* Kept Same as yours */ };

  // --- ACTION HANDLERS ---
  const handleMark = async () => {
    const restrictionReason = checkRestrictedDay();
    if (restrictionReason) {
        return Swal.fire({ icon: 'info', title: 'No Attendance Required', text: `${restrictionReason}. You cannot mark attendance today.`, confirmButtonColor: 'var(--ma-primary)' });
    }

    if (!navigator.geolocation) return Swal.fire("Error", "Geolocation not supported", "error");
    setLoading(true);

    navigator.geolocation.getCurrentPosition(async (pos) => {
      try {
        let selfie = null;
        if (faceRequired) {
          try { selfie = await captureSelfie(); if (!selfie) { setLoading(false); return; } } 
          catch { setLoading(false); return Swal.fire("Camera Error", "Permission denied", "error"); }
        }

        const res = await axios.post(`${API_URL}/api/attendance/mark`, {
          employeeId: user.id || user._id, latitude: pos.coords.latitude, longitude: pos.coords.longitude, liveImage: selfie
        }, { headers: { Authorization: `Bearer ${token}` } });

        if (res.data.success) {
          Swal.fire({ icon: 'success', title: 'Marked!', text: res.data.message, timer: 2000, showConfirmButton: false });
          fetchAttendanceData(user.id || user._id);
        }
      } catch (err) { Swal.fire("Error", err.response?.data?.message || "Failed", "error"); }
      finally { setLoading(false); }
    }, () => { setLoading(false); Swal.fire("Location Error", "Please enable GPS", "error"); });
  };

  const handleCheck = (type) => {
    const restrictionReason = checkRestrictedDay();
    if (restrictionReason) return Swal.fire({ icon: 'info', title: 'Restricted', text: `Today is ${restrictionReason}` });

    if (!navigator.geolocation) return Swal.fire("Error", "GPS needed", "error");
    navigator.geolocation.getCurrentPosition(async (pos) => {
      try {
        const res = await axios.post(`${API_URL}/api/attendance/session`, {
          employeeId: user.id || user._id, latitude: pos.coords.latitude, longitude: pos.coords.longitude, actionType: type
        }, { headers: { Authorization: `Bearer ${token}` } });

        if (res.data.success) {
          Swal.fire({ icon: 'success', title: 'Success', text: `Session ${type === 'in' ? 'Resumed' : 'Paused'}`, timer: 1500, showConfirmButton: false });
          fetchAttendanceData(user.id || user._id);
        }
      } catch (err) { Swal.fire("Error", err.response?.data?.message, "error"); }
    });
  };

  // --- FILTER & PAGINATION LOGIC ---
  const filteredData = useMemo(() => {
    return originalAttendance.filter(att => {
      const date = moment(att.date);
      return (selectedMonth === "All" || date.format("MM") === selectedMonth) && (date.format("YYYY") === selectedYear);
    });
  }, [originalAttendance, selectedMonth, selectedYear]);

  useEffect(() => { setCurrentPage(1); }, [selectedMonth, selectedYear]);

  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = filteredData.slice(indexOfFirstRecord, indexOfLastRecord);
  const totalPages = Math.ceil(filteredData.length / recordsPerPage) || 1;

  // --- PDF EXPORT ---
  const exportToPDF = async () => {
    if (filteredData.length === 0) return Swal.fire("Empty", "No records found to export.", "info");

    const doc = new jsPDF("landscape", "mm", "a4");
    const pageWidth = doc.internal.pageSize.getWidth();
    let currentY = 20;

    doc.setFont("helvetica", "bold"); doc.setFontSize(16);
    doc.text(`ATTENDANCE REPORT - ${selectedMonth !== "All" ? moment(selectedMonth, "MM").format("MMMM") : "ALL"} ${selectedYear}`, pageWidth / 2, currentY, { align: "center" });
    currentY += 15;

    autoTable(doc, {
      startY: currentY,
      head: [["S.No", "Date", "First Punch In", "Last Punch Out", "Total Hours", "Status"]],
      body: filteredData.map((att, i) => {
        const isOff = att.status === 'Absent' || att.status.includes('Off') || att.status === 'Holiday';
        const firstIn = att.inOutLogs?.[0]?.inTime || att.inTime || "--:--";
        const lastOut = att.inOutLogs?.[att.inOutLogs.length - 1]?.outTime || att.outTime || "--:--";
        const hours = att.workedMinutes ? `${(att.workedMinutes / 60).toFixed(1)} Hrs` : "-";
        
        return [ i + 1, moment(att.date).format("DD MMM YYYY"), isOff ? "-" : firstIn, isOff ? "-" : lastOut, hours, att.status ];
      }),
      theme: "grid",
      headStyles: { fillColor: [79, 70, 229] },
    });
    doc.save(`Attendance_Report_${selectedYear}.pdf`);
  };

  return (
    <EmployeeLayout>
      <div className="ma-wrapper" style={{ alignItems: 'flex-start' }}>
        <div className="container-fluid p-0">
          <div className="row g-4">
            
            {/* LEFT COLUMN: EXISTING WIDGET */}
            <div className="col-lg-4">
              <div className="ma-card animate__animated animate__fadeInLeft w-100" style={{ maxWidth: '100%' }}>
                <div className="ma-header">
                  <h3 className="ma-title"><FaMapMarkerAlt size={18} /> Daily Punch</h3>
                  <p className="ma-date">{new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                </div>

                <div className="ma-status-card">
                  <span className="status-label">CURRENT STATUS</span>
                  {checkRestrictedDay() ? (
                      <div className="status-pill" style={{background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderColor: '#fca5a5'}}>
                          <FaCalendarTimes size={16}/> <span>{checkRestrictedDay().split(':')[0]}</span>
                      </div>
                  ) : markedToday ? (
                    <div className="status-pill active">
                      <MdVerified size={18}/> <span>Present</span> <div className="pulse-dot"></div>
                    </div>
                  ) : (
                    <div className="status-pill inactive">
                      <FaRegCircle size={16}/> <span>Not Marked</span>
                    </div>
                  )}
                </div>

                <div className="ma-body">
                  <button 
                      className="btn-mark-hero" 
                      onClick={handleMark} 
                      disabled={loading || markedToday || checkRestrictedDay()}
                      style={checkRestrictedDay() ? { opacity: 0.6, cursor: 'not-allowed', background: 'var(--ma-text-sub)' } : {}}
                  >
                    {loading ? ( <div className="spinner-border spinner-border-sm text-white"></div> ) 
                    : checkRestrictedDay() ? ( <><FaCalendarTimes size={20} /><span>Enjoy your Off Day</span></> ) 
                    : ( <>{faceRequired ? <FaCamera size={20} /> : <FaCheckCircle size={20} />}<span>{markedToday ? "Check-In Complete" : "Tap to Check-In"}</span></> )}
                  </button>

                  {markedToday && !checkRestrictedDay() && (
                    <div className="session-actions animate__animated animate__fadeIn">
                      <button className="btn-sess resume" onClick={() => handleCheck("in")}><FaPlay size={18} /><span>Resume</span></button>
                      <button className="btn-sess break" onClick={() => handleCheck("out")}><FaPause size={18} /><span>Break</span></button>
                    </div>
                  )}

                  {inOutLogs.length > 0 && (
                    <div className="ma-log-section animate__animated animate__fadeIn">
                      <div className="log-title"><FaHistory /> Timeline</div>
                      <div className="log-list">
                        {inOutLogs.map((log, i) => (
                          <div key={i} className="log-item">
                            <div className="log-time-box"><span className="lbl">IN</span><span className="val">{log.inTime}</span></div>
                            <div className="log-arrow"><FaLongArrowAltRight /></div>
                            <div className="log-time-box text-end">
                              <span className="lbl">OUT</span>
                              {log.outTime ? ( <span className="val">{log.outTime}</span> ) : ( <span className="val text-warning d-flex align-items-center gap-1 justify-content-end"><span className="status-active-dot"></span> Active</span> )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: FILTERS & TABLE */}
            <div className="col-lg-8">
              <div className="ma-card animate__animated animate__fadeInRight w-100 p-4" style={{ maxWidth: '100%' }}>
                
                {/* Filters */}
                <div className="row g-3 mb-4">
                  <div className="col-md-4">
                    <label className="status-label mb-1">Select Year</label>
                    <select className="ma-filter-input" value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
                      {["2024", "2025", "2026", "2027"].map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                  <div className="col-md-4">
                    <label className="status-label mb-1">Select Month</label>
                    <select className="ma-filter-input" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}>
                      <option value="All">All Months</option>
                      {moment.months().map((m, i) => ( <option key={m} value={moment().month(i).format("MM")}>{m}</option> ))}
                    </select>
                  </div>
                  <div className="col-md-4 d-flex align-items-end">
                    <button className="ma-btn-primary w-100" onClick={exportToPDF}><FaFilePdf /> Export PDF</button>
                  </div>
                </div>

                {/* Table */}
                <div className="ma-table-container">
                  <table className="ma-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Punch In</th>
                        <th>Punch Out</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentRecords.length > 0 ? (
                        currentRecords.map((att) => {
                           const isOff = att.status === 'Absent' || att.status === 'Holiday' || att.status.includes('Off');
                           const firstIn = att.inOutLogs?.[0]?.inTime || att.inTime || "--:--";
                           const lastOut = att.inOutLogs?.[att.inOutLogs.length - 1]?.outTime || att.outTime || "--:--";
                           return (
                            <tr key={att._id}>
                              <td>{moment(att.date).format("DD MMM YYYY")}</td>
                              <td style={{ color: isOff ? 'var(--ma-text-sub)' : 'var(--ma-success)', fontWeight: 'bold' }}>{isOff ? "-" : firstIn}</td>
                              <td style={{ color: isOff ? 'var(--ma-text-sub)' : 'var(--ma-danger)', fontWeight: 'bold' }}>{isOff ? "-" : lastOut}</td>
                              <td>
                                <span className={`status-pill ${isOff ? 'inactive' : 'active'}`} style={{ padding: '4px 12px', fontSize: '0.75rem' }}>
                                  {att.status}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr><td colSpan="4" className="text-center py-4" style={{color: 'var(--ma-text-sub)'}}>No records found.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {filteredData.length > 0 && (
                  <div className="d-flex justify-content-between align-items-center mt-4">
                    <span style={{color: 'var(--ma-text-sub)', fontSize: '0.85rem'}}>
                      Showing {indexOfFirstRecord + 1} to {Math.min(indexOfLastRecord, filteredData.length)} of {filteredData.length} entries
                    </span>
                    <div className="d-flex gap-2">
                      <button className="ma-btn-outline" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}><FaChevronLeft/></button>
                      <button className="ma-btn-primary" style={{padding: '5px 15px'}}>{currentPage}</button>
                      <button className="ma-btn-outline" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}><FaChevronRight/></button>
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </EmployeeLayout>
  );
};

export default MarkAttendance;