import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import axios from "axios";
import EmployeeLayout from "./EmployeeLayout";
import "./MarkAttendance.css"; 
import {
  FaCheckCircle, FaRegCircle, FaPlay, FaPause, 
  FaMapMarkerAlt, FaCamera, FaHistory, FaLongArrowAltRight,
  FaCalendarTimes
} from "react-icons/fa";
import { MdVerified } from "react-icons/md";
import moment from "moment"; // Assuming you have moment, otherwise use standard Date

const MarkAttendance = () => {
  const [loading, setLoading] = useState(false);
  const [markedToday, setMarkedToday] = useState(false);
  const [inOutLogs, setInOutLogs] = useState([]);
  
  // Settings State
  const [faceRequired, setFaceRequired] = useState(false);
  const [companySettings, setCompanySettings] = useState({ isSaturdayOff: true, isSundayOff: true });
  const [holidays, setHolidays] = useState([]);

  const API_URL = import.meta.env.VITE_API_URL;
  const user = JSON.parse(localStorage.getItem("user"));
  const token = user?.token;

  useEffect(() => {
    if (user?.id) {
      fetchTodayLogs(user.id);
      fetchAdminSettings();
      fetchHolidays();
    }
  }, []);

  const fetchAdminSettings = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/settings`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data.success) {
        const data = res.data.data;
        setFaceRequired(data?.attendance?.faceRequired || false);
        // Store weekend settings
        setCompanySettings({
            isSaturdayOff: data?.attendance?.isSaturdayOff ?? true, // Default to Off if not found
            isSundayOff: data?.attendance?.isSundayOff ?? true
        });
      }
    } catch (err) { console.error(err); }
  };

  const fetchHolidays = async () => {
    try {
        const res = await axios.get(`${API_URL}/api/holidays`, { headers: { Authorization: `Bearer ${token}` } });
        if(res.data.success) {
            setHolidays(res.data.data || []);
        }
    } catch (err) { console.error("Error fetching holidays", err); }
  };

  const fetchTodayLogs = async (employeeId) => {
    try {
      const res = await axios.get(`${API_URL}/api/attendance/employee/${employeeId}`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data.success && Array.isArray(res.data.data)) {
        const todayIST = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
        const todayLog = res.data.data.find(log => new Date(log.date).toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" }) === todayIST);
        
        if (todayLog) {
          setMarkedToday(true);
          setInOutLogs(todayLog.inOutLogs || []);
        }
      }
    } catch (err) { console.error(err); }
  };

  // --- HELPER: Check if Today is Off ---
  const checkRestrictedDay = () => {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday, 6 = Saturday
    const dateStr = today.toISOString().split('T')[0]; // YYYY-MM-DD format

    // 1. Check Weekend
    if (dayOfWeek === 0 && companySettings.isSundayOff) return "It's Sunday (Weekly Off)";
    if (dayOfWeek === 6 && companySettings.isSaturdayOff) return "It's Saturday (Weekly Off)";

    // 2. Check Holiday
    const isHoliday = holidays.find(h => {
        // Handle Date Range or Single Date
        const start = h.startDate.split('T')[0];
        const end = h.endDate ? h.endDate.split('T')[0] : start;
        return dateStr >= start && dateStr <= end;
    });

    if (isHoliday) return `Holiday: ${isHoliday.name}`;

    return null; // Allowed
  };

  // --- CAMERA LOGIC ---
  const captureSelfie = () => {
    return new Promise(async (resolve, reject) => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        const video = document.createElement("video");
        Object.assign(video.style, { position: "fixed", top: 0, left: 0, width: "100%", height: "100%", zIndex: 9999, background: "black", objectFit: "cover" });
        video.autoplay = true;
        video.srcObject = stream;
        document.body.appendChild(video);

        const btn = document.createElement("button");
        btn.innerHTML = `<div style="display:flex; align-items:center; gap:10px;"><span style="font-size:24px">📸</span> <span style="font-size:16px;">CAPTURE</span></div>`;
        Object.assign(btn.style, {
          position: "fixed", bottom: "40px", left: "50%", transform: "translateX(-50%)",
          padding: "15px 40px", zIndex: 10000, background: "white", color: "black",
          border: "none", borderRadius: "50px", fontWeight: "800", boxShadow: "0 10px 20px rgba(0,0,0,0.5)", cursor: "pointer"
        });
        document.body.appendChild(btn);

        btn.onclick = () => {
          const canvas = document.createElement("canvas");
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          canvas.getContext("2d").drawImage(video, 0, 0);
          const base64 = canvas.toDataURL("image/jpeg");
          stream.getTracks().forEach(t => t.stop());
          video.remove();
          btn.remove();
          resolve(base64);
        };
      } catch (err) { reject(err); }
    });
  };

  const handleMark = async () => {
    // 🔥 STEP 1: Check for Weekend/Holiday before doing anything
    const restrictionReason = checkRestrictedDay();
    if (restrictionReason) {
        Swal.fire({
            icon: 'info',
            title: 'No Attendance Required',
            text: `${restrictionReason}. You cannot mark attendance today.`,
            confirmButtonColor: 'var(--primary-color)'
        });
        return;
    }

    if (!navigator.geolocation) return Swal.fire("Error", "Geolocation not supported", "error");
    setLoading(true);

    navigator.geolocation.getCurrentPosition(async (pos) => {
      try {
        let selfie = null;
        if (faceRequired) {
          try {
            selfie = await captureSelfie();
            if (!selfie) { setLoading(false); return; }
          } catch { setLoading(false); return Swal.fire("Camera Error", "Permission denied", "error"); }
        }

        const res = await axios.post(`${API_URL}/api/attendance/mark`, {
          employeeId: user.id,
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          liveImage: selfie
        }, { headers: { Authorization: `Bearer ${token}` } });

        if (res.data.success) {
          Swal.fire({ icon: 'success', title: 'Marked!', text: res.data.message, timer: 2000, showConfirmButton: false });
          fetchTodayLogs(user.id);
        }
      } catch (err) { Swal.fire("Error", err.response?.data?.message || "Failed", "error"); }
      finally { setLoading(false); }
    }, (err) => { setLoading(false); Swal.fire("Location Error", "Please enable GPS", "error"); });
  };

  const handleCheck = (type) => {
    // 🔥 Also block Session Resume/Break on Holidays (Optional, remove if they can work OT)
    const restrictionReason = checkRestrictedDay();
    if (restrictionReason) {
        Swal.fire({ icon: 'info', title: 'Restricted', text: `Today is ${restrictionReason}` });
        return;
    }

    if (!navigator.geolocation) return Swal.fire("Error", "GPS needed", "error");
    navigator.geolocation.getCurrentPosition(async (pos) => {
      try {
        const res = await axios.post(`${API_URL}/api/attendance/session`, {
          employeeId: user.id,
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          actionType: type
        }, { headers: { Authorization: `Bearer ${token}` } });

        if (res.data.success) {
          Swal.fire({ icon: 'success', title: 'Success', text: `Session ${type === 'in' ? 'Resumed' : 'Paused'}`, timer: 1500, showConfirmButton: false });
          fetchTodayLogs(user.id);
        }
      } catch (err) { Swal.fire("Error", err.response?.data?.message, "error"); }
    });
  };

  return (
    <EmployeeLayout>
      <div className="ma-wrapper">
        <div className="ma-card animate__animated animate__fadeInUp">
          
          {/* HEADER */}
          <div className="ma-header">
            <h3 className="ma-title">
                <FaMapMarkerAlt size={18} /> Mark Attendance
            </h3>
            <p className="ma-date">
                {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>

          {/* FLOATING STATUS WIDGET */}
          <div className="ma-status-card">
            <span className="status-label">CURRENT STATUS</span>
            {checkRestrictedDay() ? (
                // 🔥 Holiday/Weekend Visual Indicator
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
            
            {/* BIG ACTION BUTTON */}
            <button 
                className="btn-mark-hero" 
                onClick={handleMark} 
                // Disable button if marked OR if it's a restricted day
                disabled={loading || markedToday || checkRestrictedDay()}
                style={checkRestrictedDay() ? { opacity: 0.6, cursor: 'not-allowed', background: '#94a3b8' } : {}}
            >
              {loading ? (
                <div className="spinner-border spinner-border-sm text-white"></div>
              ) : checkRestrictedDay() ? (
                // 🔥 Show Holiday Text on Button
                 <>
                   <FaCalendarTimes size={20} />
                   <span>Enjoy your Off Day</span>
                 </>
              ) : (
                <>
                  {faceRequired ? <FaCamera size={20} /> : <FaCheckCircle size={20} />}
                  <span>{markedToday ? "Check-In Complete" : "Tap to Check-In"}</span>
                </>
              )}
            </button>

            {/* SESSION CONTROLS */}
            {markedToday && !checkRestrictedDay() && (
              <div className="session-actions animate__animated animate__fadeIn">
                <button className="btn-sess resume" onClick={() => handleCheck("in")}>
                  <FaPlay size={18} />
                  <span>Resume</span>
                </button>
                <button className="btn-sess break" onClick={() => handleCheck("out")}>
                  <FaPause size={18} />
                  <span>Break</span>
                </button>
              </div>
            )}

            {/* ACTIVITY TIMELINE */}
            {inOutLogs.length > 0 && (
              <div className="ma-log-section animate__animated animate__fadeIn">
                <div className="log-title"><FaHistory /> Timeline</div>
                <div className="log-list">
                  {inOutLogs.map((log, i) => (
                    <div key={i} className="log-item">
                      <div className="log-time-box">
                        <span className="lbl">IN</span>
                        <span className="val">{log.inTime}</span>
                      </div>
                      <div className="log-arrow"><FaLongArrowAltRight /></div>
                      <div className="log-time-box text-end">
                        <span className="lbl">OUT</span>
                        {log.outTime ? (
                            <span className="val">{log.outTime}</span>
                        ) : (
                            <span className="val text-warning d-flex align-items-center gap-1 justify-content-end">
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
    </EmployeeLayout>
  );
};

export default MarkAttendance;