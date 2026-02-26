import React, { useState, useEffect, useContext, useMemo } from "react";
import Swal from "sweetalert2";
import axios from "axios";
import EmployeeLayout from "./EmployeeLayout";
import "./MyAttendanceList.css"; 
import {
  FaCheckCircle, FaRegCircle, FaPlay, FaPause, 
  FaMapMarkerAlt, FaCamera, FaHistory, FaLongArrowAltRight,
  FaCalendarTimes, FaFilePdf, FaChevronLeft, FaChevronRight
} from "react-icons/fa";
import { MdVerified } from "react-icons/md";
import moment from "moment";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { SettingsContext } from "../Redux/SettingsContext";
import { addCommonHeaderFooter, addCommonFooter } from "../../Utils/pdfHeaderFooter";

const MyAttendanceList = () => {
  // --- STATES FOR SMART WIDGET ---
  const [loading, setLoading] = useState(false);
  const [markedToday, setMarkedToday] = useState(false);
  const [isWorking, setIsWorking] = useState(false); 
  const [inOutLogs, setInOutLogs] = useState([]);
  const [faceRequired, setFaceRequired] = useState(false);
  const [companySettings, setCompanySettings] = useState({ isSaturdayOff: true, isSundayOff: true });
  const [holidays, setHolidays] = useState([]);

  // --- STATES FOR TABLE & FILTERS ---
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

  // --- API CALLS ---
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
        const sortedData = res.data.data.sort((a, b) => new Date(b.date) - new Date(a.date));
        setAttendances(sortedData);
        setOriginalAttendance(sortedData);

        const todayIST = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
        const todayLog = sortedData.find(log => new Date(log.date).toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" }) === todayIST);
        
        if (todayLog) {
          setMarkedToday(true);
          const logs = todayLog.inOutLogs || [];
          setInOutLogs(logs);
          if (logs.length > 0) {
            const lastLog = logs[logs.length - 1];
            setIsWorking(!lastLog.outTime);
          } else {
            setIsWorking(false);
          }
        } else {
          setMarkedToday(false);
          setIsWorking(false);
          setInOutLogs([]);
        }
      }
    } catch (err) { console.error(err); }
  };

  // --- HELPER LOGIC ---
  const checkRestrictedDay = () => {
    const today = new Date();
    const dayOfWeek = today.getDay(); 
    const dateStr = today.toISOString().split('T')[0]; 

    if (dayOfWeek === 0 && companySettings.isSundayOff) return "Sunday (Weekly Off)";
    if (dayOfWeek === 6 && companySettings.isSaturdayOff) return "Saturday (Weekly Off)";

    const isHoliday = holidays.find(h => {
        const start = h.startDate.split('T')[0];
        const end = h.endDate ? h.endDate.split('T')[0] : start;
        return dateStr >= start && dateStr <= end;
    });

    if (isHoliday) return `Holiday: ${isHoliday.name}`;
    return null; 
  };

  const captureSelfie = () => {
    // Implement your selfie capture logic if faceRequired is true
    return null; 
  };

  // --- ACTIONS (PUNCH IN / OUT) ---
  const handleMarkAttendance = async () => {
    const restrictionReason = checkRestrictedDay();
    if (restrictionReason) return Swal.fire({ icon: 'info', title: 'Restricted', text: `Today is ${restrictionReason}.` });
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
          employeeId: user?.id || user?._id, latitude: pos.coords.latitude, longitude: pos.coords.longitude, liveImage: selfie
        }, { headers: { Authorization: `Bearer ${token}` } });

        if (res.data.success) {
          Swal.fire({ icon: 'success', title: 'Punched In!', text: res.data.message, timer: 1500, showConfirmButton: false });
          fetchAttendanceData(user?.id || user?._id);
        }
      } catch (err) { Swal.fire("Error", err.response?.data?.message || "Failed", "error"); }
      finally { setLoading(false); }
    }, () => { setLoading(false); Swal.fire("Location Error", "Please enable GPS", "error"); });
  };

  const handleSession = (type) => {
    const restrictionReason = checkRestrictedDay();
    if (restrictionReason) return Swal.fire({ icon: 'info', title: 'Restricted', text: `Today is ${restrictionReason}` });
    if (!navigator.geolocation) return Swal.fire("Error", "GPS needed", "error");
    
    setLoading(true);
    navigator.geolocation.getCurrentPosition(async (pos) => {
      try {
        const res = await axios.post(`${API_URL}/api/attendance/session`, {
          employeeId: user?.id || user?._id, latitude: pos.coords.latitude, longitude: pos.coords.longitude, actionType: type
        }, { headers: { Authorization: `Bearer ${token}` } });

        if (res.data.success) {
          Swal.fire({ icon: 'success', title: 'Success', text: `Session ${type === 'in' ? 'Resumed' : 'Paused'}`, timer: 1500, showConfirmButton: false });
          fetchAttendanceData(user?.id || user?._id);
        }
      } catch (err) { Swal.fire("Error", err.response?.data?.message, "error"); }
      finally { setLoading(false); }
    });
  };

  // --- FILTERS & PAGINATION ---
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
    if (filteredData.length === 0) return alert("No records found to export.");

    const doc = new jsPDF("landscape", "mm", "a4");
    const pageWidth = doc.internal.pageSize.getWidth();
    try { await addCommonHeaderFooter(doc, settings); } catch (e) {}

    let currentY = 60;
    doc.setFont("helvetica", "bold"); doc.setFontSize(16); doc.setTextColor(20, 20, 20); 
    
    let reportTitle = selectedMonth !== "All" ? `MONTHLY ATTENDANCE REPORT - ${moment(selectedMonth, "MM").format("MMMM").toUpperCase()} ${selectedYear}` : "ATTENDANCE STATEMENT REPORT";
    doc.text(reportTitle, pageWidth / 2, currentY, { align: "center" });
    currentY += 8;

    let subTitle = [`Year: ${selectedYear}`];
    if (selectedMonth !== "All") subTitle.push(`Period: ${moment(selectedMonth, "MM").format("MMMM")}`);
    
    if (subTitle.length > 0) {
        doc.setFontSize(10); doc.setFont("helvetica", "italic"); doc.setTextColor(100, 100, 100);
        doc.text(subTitle.join("   |   "), pageWidth / 2, currentY, { align: "center" });
        currentY += 8;
    }

    const presentCount = filteredData.filter(d => d.status === "Present" || d.status === "Late").length;
    const absentCount = filteredData.filter(d => d.status === "Absent").length;

    doc.setDrawColor(180, 180, 180); doc.setFillColor(248, 248, 248);
    doc.roundedRect(14, currentY, pageWidth - 28, 20, 2, 2, "FD");

    doc.setFontSize(10); doc.setFont("helvetica", "bold"); doc.setTextColor(40, 40, 40);
    doc.text("Total Records :", 18, currentY + 8); doc.setFont("helvetica", "normal"); doc.text(`${filteredData.length} Days`, 50, currentY + 8);
    doc.setFont("helvetica", "bold"); doc.text("Total Present :", 18, currentY + 15); doc.setFont("helvetica", "normal"); doc.text(`${presentCount} Days (Absent: ${absentCount})`, 50, currentY + 15);

    currentY += 30;

    autoTable(doc, {
      startY: currentY,
      head: [["S.No", "Date", "First Punch In", "Last Punch Out", "Total Hours", "Status"]],
      body: filteredData.map((att, i) => {
        const isOff = att.status === 'Absent' || att.status === 'Holiday' || att.status.includes('Off');
        const firstIn = att.inOutLogs?.[0]?.inTime || att.inTime || "--:--";
        const lastOut = att.inOutLogs?.[att.inOutLogs.length - 1]?.outTime || att.outTime || "--:--";
        const hours = att.workedMinutes ? `${(att.workedMinutes / 60).toFixed(1)} Hrs` : "-";
        
        return [ i + 1, moment(att.date).format("DD MMM YYYY"), isOff ? "-" : firstIn, isOff ? "-" : lastOut, hours, att.status ];
      }),
      theme: "grid",
      headStyles: { fillColor: [30, 30, 32], textColor: [255, 255, 255] },
      styles: { fontSize: 9, cellPadding: 5 }
    });

    try { addCommonFooter(doc, settings); } catch (e) {}
    doc.save(`Attendance_Report_${selectedYear}.pdf`);
  };

  return (
    <EmployeeLayout>
      <div className="payroll-page">
        {/* HEADER (No Dark/Light Mode Button Here) */}
        <div className="mb-4">
          <h2 className="payroll-title"><FaHistory className="me-2"/> Attendance Dashboard</h2>
          <p className="small-muted">Mark your daily presence and track logs</p>
        </div>

        <div className="row">
          
          {/* ================= LEFT COLUMN: SMART WIDGET ================= */}
          <div className="col-lg-4 mb-4">
            <div className="payroll-card p-0 overflow-hidden h-100 position-relative">
              <div className="ma-header">
                <h3 className="ma-title"><FaMapMarkerAlt size={18} /> Daily Punch</h3>
                <p className="ma-date">{moment().format('dddd, DD MMMM YYYY')}</p>
              </div>

              <div className="ma-status-card">
                <span className="status-label">CURRENT STATUS</span>
                {checkRestrictedDay() ? (
                    <div className="status-pill" style={{background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444'}}>
                        <FaCalendarTimes size={16}/> <span>{checkRestrictedDay().split(':')[0]}</span>
                    </div>
                ) : isWorking ? (
                  <div className="status-pill active">
                    <MdVerified size={18}/> <span>Working</span> <div className="pulse-dot"></div>
                  </div>
                ) : markedToday ? (
                  <div className="status-pill" style={{background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', border: '1px solid #fcd34d'}}>
                    <FaPause size={14}/> <span>On Break / Checked Out</span>
                  </div>
                ) : (
                  <div className="status-pill inactive"><FaRegCircle size={16}/> <span>Not Started</span></div>
                )}
              </div>

              <div className="ma-body px-4 pb-4">
                {/* SMART BUTTON */}
                {checkRestrictedDay() ? (
                    <button className="btn-mark-hero" disabled style={{ opacity: 0.6, background: 'var(--al-text-sub)' }}>
                       <FaCalendarTimes size={20} /> <span>Enjoy your Off Day</span>
                    </button>
                ) : !markedToday ? (
                    <button className="btn-mark-hero" onClick={handleMarkAttendance} disabled={loading}>
                      {loading ? <div className="spinner-border spinner-border-sm text-white"></div> : <><FaCheckCircle size={20} /> <span>First Check-In</span></>}
                    </button>
                ) : isWorking ? (
                    <button className="btn-mark-hero" onClick={() => handleSession('out')} disabled={loading} style={{ background: 'linear-gradient(135deg, #ef4444, #b91c1c)' }}>
                       {loading ? <div className="spinner-border spinner-border-sm text-white"></div> : <><FaPause size={18} /> <span>Check-Out (Break)</span></>}
                    </button>
                ) : (
                    <button className="btn-mark-hero" onClick={() => handleSession('in')} disabled={loading} style={{ background: 'linear-gradient(135deg, #10b981, #047857)' }}>
                       {loading ? <div className="spinner-border spinner-border-sm text-white"></div> : <><FaPlay size={18} /> <span>Resume Work (Check-In)</span></>}
                    </button>
                )}

                {/* TIMELINE */}
                {inOutLogs.length > 0 && (
                  <div className="ma-log-section animate__animated animate__fadeIn">
                    <div className="log-title"><FaHistory /> Today's Timeline</div>
                    <div className="log-list">
                      {inOutLogs.map((log, i) => (
                        <div key={i} className="log-item glass-input border-0" style={{padding: '12px', borderLeft: '4px solid var(--al-primary) !important'}}>
                          <div className="log-time-box">
                            <span className="lbl text-success-custom">IN</span>
                            <span className="val">{log.inTime}</span>
                          </div>
                          <div className="log-arrow"><FaLongArrowAltRight /></div>
                          <div className="log-time-box text-end">
                            <span className="lbl text-danger-custom">OUT</span>
                            {log.outTime ? (
                                <span className="val">{log.outTime}</span>
                            ) : (
                                <span className="val text-warning-custom d-flex align-items-center gap-1 justify-content-end">
                                    <span className="status-active-dot"></span> Active
                                </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ================= RIGHT COLUMN: HISTORY & TABLE ================= */}
          <div className="col-lg-8">
            <div className="payroll-card mb-4">
              <h4 className="section-title">Filter History</h4>
              <div className="row g-3">
                <div className="col-md-4">
                  <select className="form-select glass-input" value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
                    {["2024", "2025", "2026"].map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                <div className="col-md-4">
                  <select className="form-select glass-input" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)}>
                    <option value="All">All Months</option>
                    {moment.months().map((m, i) => (
                       <option key={m} value={moment().month(i).format("MM")}>{m}</option>
                    ))}
                  </select>
                </div>
                <div className="col-md-4 d-flex align-items-end">
                  <button className="btn-primary-custom w-100" onClick={exportToPDF}><FaFilePdf className="me-2"/> PDF Report</button>
                </div>
              </div>
            </div>

            <div className="payroll-card">
              <div className="table-container">
                <table className="payroll-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>First Punch In</th>
                      <th>Last Punch Out</th>
                      <th>Work Hrs</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentRecords.length > 0 ? (
                      currentRecords.map((att) => {
                         const isOff = att.status === 'Absent' || att.status === 'Holiday' || att.status.includes('Off');
                         const firstIn = att.inOutLogs?.[0]?.inTime || att.inTime || "--:--";
                         const lastOut = att.inOutLogs?.[att.inOutLogs.length - 1]?.outTime || att.outTime || "--:--";
                         const hrs = att.workedMinutes ? `${(att.workedMinutes/60).toFixed(1)} Hrs` : "-";
                         
                         return (
                          <tr key={att._id}>
                            <td>{moment(att.date).format("DD MMM YYYY")}</td>
                            <td className="text-success-custom fw-bold">{isOff ? "-" : firstIn}</td>
                            <td className="text-danger-custom fw-bold">{isOff ? "-" : lastOut}</td>
                            <td className="text-secondary-custom">{hrs}</td>
                            <td>
                              <span className="net-box py-1 px-3" style={{ fontSize: '0.75rem' }}>{att.status}</span>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr><td colSpan="5" className="text-center py-4 text-secondary-custom">No attendance records found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {filteredData.length > 0 && (
                <div className="d-flex justify-content-between align-items-center mt-4">
                  <span className="small-muted">Showing {indexOfFirstRecord + 1} to {Math.min(indexOfLastRecord, filteredData.length)} of {filteredData.length}</span>
                  <div className="d-flex gap-2">
                    <button className="btn-outline-custom py-1 px-2" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}><FaChevronLeft/></button>
                    <button className="btn-primary-custom py-1 px-3">{currentPage}</button>
                    <button className="btn-outline-custom py-1 px-2" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}><FaChevronRight/></button>
                  </div>
                </div>
              )}
            </div>
          </div>
          
        </div>
      </div>
    </EmployeeLayout>
  );
};

export default MyAttendanceList;