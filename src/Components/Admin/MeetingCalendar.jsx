import React, { useEffect, useState } from "react";
import axios from "axios";
import moment from "moment";
import Swal from "sweetalert2";
import AdminLayout from "./AdminLayout";
// Icons
import { BiCalendar, BiChevronLeft, BiChevronRight, BiTimeFive } from "react-icons/bi";
import { BsCalendarEvent, BsDot } from "react-icons/bs";
import "./EventManagement.css";

const MeetingCalendar = () => {
  const [meetings, setMeetings] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(moment());

  const token = JSON.parse(localStorage.getItem("user"))?.token;
  const headers = { headers: { Authorization: `Bearer ${token}` } };

  useEffect(() => {
    fetchMeetings();
  }, []);

  const fetchMeetings = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/meeting/all`, headers);
      setMeetings(res.data);
    } catch (err) {
      console.error("Fetch error", err);
    }
  };

  // --- Professional SweetAlert Modal ---
  const handleEditDelete = (meeting) => {
    // Detect Theme
    const isDark = document.body.getAttribute('data-theme') === 'dark';
    
    // CSS for Modal to match Theme
    const modalBg = isDark ? '#0f172a' : '#ffffff';
    const modalText = isDark ? '#f8fafc' : '#0f172a';
    const inputBg = isDark ? '#1e293b' : '#f8fafc';
    const inputBorder = isDark ? '#334155' : '#e2e8f0';

    Swal.fire({
      title: `<span style="font-size:18px; font-weight:600;">Edit Meeting</span>`,
      background: modalBg,
      color: modalText,
      width: '500px',
      html: `
        <div style="text-align:left; font-size:14px;">
          <label style="color:#94a3b8; font-size:12px; font-weight:600; text-transform:uppercase;">Meeting Title</label>
          <input id="title" class="swal2-input" value="${meeting.title}" 
            style="margin:5px 0 15px 0; width:100%; background:${inputBg}; border:1px solid ${inputBorder}; color:${modalText}; font-size:14px;" />

          <label style="color:#94a3b8; font-size:12px; font-weight:600; text-transform:uppercase;">Description</label>
          <textarea id="desc" class="swal2-textarea" 
            style="margin:5px 0 15px 0; width:100%; background:${inputBg}; border:1px solid ${inputBorder}; color:${modalText}; font-size:14px;">${meeting.description || ""}</textarea>

          <div style="display:grid; grid-template-columns:1fr 1fr; gap:15px;">
             <div>
                <label style="color:#94a3b8; font-size:12px; font-weight:600; text-transform:uppercase;">Start Time</label>
                <input type="time" id="startTime" class="swal2-input" value="${meeting.startTime}" 
                  style="margin:5px 0; width:100%; background:${inputBg}; border:1px solid ${inputBorder}; color:${modalText};" />
             </div>
             <div>
                <label style="color:#94a3b8; font-size:12px; font-weight:600; text-transform:uppercase;">End Time</label>
                <input type="time" id="endTime" class="swal2-input" value="${meeting.endTime}" 
                  style="margin:5px 0; width:100%; background:${inputBg}; border:1px solid ${inputBorder}; color:${modalText};" />
             </div>
          </div>
          
          <div style="margin-top:15px; padding:10px; background:${isDark ? 'rgba(99,102,241,0.1)' : '#eff6ff'}; border-radius:8px;">
            <a href="${meeting.googleMeetLink}" target="_blank" style="color:#6366f1; text-decoration:none; font-weight:600; font-size:13px; display:flex; align-items:center; gap:5px;">
               🎥 Join Google Meet
            </a>
          </div>
        </div>
      `,
      showCancelButton: true,
      showDenyButton: true,
      confirmButtonText: 'Save Changes',
      denyButtonText: 'Delete Meeting',
      confirmButtonColor: '#4f46e5',
      denyButtonColor: '#ef4444',
      focusConfirm: false,
      preConfirm: () => {
         return {
            title: document.getElementById('title').value,
            description: document.getElementById('desc').value,
            startTime: document.getElementById('startTime').value,
            endTime: document.getElementById('endTime').value,
            // Date same rahegi, agar change karni hai to date input bhi add kar sakte hain
         }
      }
    }).then(async (res) => {
      if (res.isConfirmed) {
        // Handle Update
        await axios.put(`${import.meta.env.VITE_API_URL}/api/meeting/update/${meeting._id}`, res.value, headers);
        fetchMeetings();
        Swal.fire({icon:'success', title:'Updated', background: modalBg, color: modalText, timer: 1500, showConfirmButton: false});
      } else if (res.isDenied) {
        // Handle Delete
        await axios.delete(`${import.meta.env.VITE_API_URL}/api/meeting/delete/${meeting._id}`, headers);
        fetchMeetings();
        Swal.fire({icon:'success', title:'Deleted', background: modalBg, color: modalText, timer: 1500, showConfirmButton: false});
      }
    });
  };

  const renderCalendar = () => {
    const start = currentMonth.clone().startOf("month").startOf("week");
    const end = currentMonth.clone().endOf("month").endOf("week");
    const today = moment();
    const day = start.clone();
    const rows = [];

    while (day.isBefore(end)) {
      const week = [];
      for (let i = 0; i < 7; i++) {
        const currentDay = day.clone();
        const isToday = currentDay.isSame(today, "day");
        const isCurrentMonth = currentDay.month() === currentMonth.month();

        // Filter meetings for this day
        const dayMeetings = meetings.filter((m) =>
          currentDay.isSame(moment(m.date), "day")
        );

        week.push(
          <td 
            key={currentDay.format("DD-MM-YYYY")} 
            className={`${isToday ? "today" : ""}`} 
            style={{ opacity: isCurrentMonth ? 1 : 0.4 }}
          >
            <div className="date-number">
              {currentDay.date()}
              {isToday && <span style={{fontSize:'10px', color:'var(--primary-color)'}}>Today</span>}
            </div>
            
            <div className="events-list">
              {dayMeetings.slice(0, 3).map((m, idx) => (
                <div
                  key={idx}
                  className="event-chip"
                  onClick={() => handleEditDelete(m)}
                  title={m.title}
                >
                  {m.startTime} {m.title}
                </div>
              ))}
              {dayMeetings.length > 3 && (
                <div style={{fontSize:'11px', color:'var(--text-secondary)', paddingLeft:'4px'}}>
                  +{dayMeetings.length - 3} more
                </div>
              )}
            </div>
          </td>
        );
        day.add(1, "day");
      }
      rows.push(<tr key={day.format("YYYY-WW")}>{week}</tr>);
    }
    return rows;
  };

  const upcoming = meetings
    .filter((m) => moment(m.date).isSameOrAfter(moment(), "day"))
    .sort((a,b) => new Date(a.date) - new Date(b.date));

  return (
    <AdminLayout>
      <div className="calendar-container">
        
        {/* Header Section */}
        <div className="calendar-top">
          <div>
            <h2 className="d-flex align-items-center">
              <BiCalendar className="me-2 text-primary" style={{color: 'var(--primary-color)'}} /> 
              {currentMonth.format("MMMM YYYY")}
            </h2>
            <p style={{margin:0, color:'var(--text-secondary)', fontSize:'14px'}}>Manage your team schedules efficiently.</p>
          </div>
          
          <div className="calendar-buttons">
            <button onClick={() => setCurrentMonth(currentMonth.clone().subtract(1, "month"))}>
               <BiChevronLeft size={20}/>
            </button>
            <button onClick={() => setCurrentMonth(moment())} style={{fontSize:'13px'}}>
               Today
            </button>
            <button onClick={() => setCurrentMonth(currentMonth.clone().add(1, "month"))}>
               <BiChevronRight size={20}/>
            </button>
          </div>
        </div>

        {/* Layout: Main Calendar + Sidebar */}
        <div className="calendar-layout">
          
          {/* Main Grid */}
          <div className="calendar-main">
            <table className="calendar-table">
              <thead>
                <tr>
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                    <th key={d}>{d}</th>
                  ))}
                </tr>
              </thead>
              <tbody>{renderCalendar()}</tbody>
            </table>
          </div>

          {/* Sticky Sidebar */}
          <div className="calendar-sidebar">
            <h3><BsCalendarEvent size={16} /> Upcoming Events</h3>
            
            {upcoming.length === 0 ? (
               <div style={{textAlign:'center', padding:'40px 0', color:'var(--text-secondary)'}}>
                  <p>No upcoming meetings</p>
               </div>
            ) : (
               upcoming.slice(0, 6).map((m, idx) => (
                  <div key={idx} className="upcoming-card" onClick={() => handleEditDelete(m)}>
                     <strong>{m.title}</strong>
                     <p>
                        <BiCalendar size={12} /> {moment(m.date).format("MMM D")} 
                        <BsDot /> 
                        <BiTimeFive size={12} /> {m.startTime}
                     </p>
                  </div>
               ))
            )}
          </div>

        </div>
      </div>
    </AdminLayout>
  );
};

export default MeetingCalendar;