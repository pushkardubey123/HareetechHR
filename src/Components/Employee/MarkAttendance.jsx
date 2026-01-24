import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import axios from "axios";
import EmployeeLayout from "./EmployeeLayout";
import "./MarkAttendance.css"; 
import {
  FaCheckCircle, FaRegCircle, FaPlay, FaPause, 
  FaMapMarkerAlt, FaCamera, FaHistory, FaLongArrowAltRight
} from "react-icons/fa";
import { MdVerified } from "react-icons/md";

const MarkAttendance = () => {
  const [loading, setLoading] = useState(false);
  const [markedToday, setMarkedToday] = useState(false);
  const [inOutLogs, setInOutLogs] = useState([]);
  const [faceRequired, setFaceRequired] = useState(false);
  
  const API_URL = import.meta.env.VITE_API_URL;
  const user = JSON.parse(localStorage.getItem("user"));
  const token = user?.token;

  useEffect(() => {
    // Theme logic removed from here as it's handled by EmployeeLayout/Navbar via body attribute
    if (user?.id) {
      fetchTodayLogs(user.id);
      fetchAdminSettings();
    }
  }, []);

  const fetchAdminSettings = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/settings`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data.success) setFaceRequired(res.data.data?.attendance?.faceRequired || false);
    } catch (err) { console.error(err); }
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
            {markedToday ? (
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
                disabled={loading || markedToday}
            >
              {loading ? (
                <div className="spinner-border spinner-border-sm text-white"></div>
              ) : (
                <>
                  {faceRequired ? <FaCamera size={20} /> : <FaCheckCircle size={20} />}
                  <span>{markedToday ? "Check-In Complete" : "Tap to Check-In"}</span>
                </>
              )}
            </button>

            {/* SESSION CONTROLS */}
            {markedToday && (
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