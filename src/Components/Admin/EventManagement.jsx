import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import axios from "axios";
import moment from "moment";
import DynamicLayout from "../Common/DynamicLayout";
import "./EventManagement.css";
// Icons import
import { BiCalendarEvent, BiChevronLeft, BiChevronRight, BiPlus, BiTimeFive } from "react-icons/bi";
import { BsPinAngleFill, BsCalendarCheck } from "react-icons/bs";

const EventManagement = () => {
  const [events, setEvents] = useState([]);
  const [branches, setBranches] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(moment());

  // ✅ PERMISSION LOGIC
  const userStr = localStorage.getItem("user");
  const userObj = userStr ? JSON.parse(userStr) : null;
  const token = userObj?.token;
  const isAdmin = userObj?.role === "admin";
  const [perms, setPerms] = useState({ view: false, create: false, edit: false, delete: false });

  const headers = { headers: { Authorization: `Bearer ${token}` } };

  useEffect(() => {
    const fetchPerms = async () => {
      if (isAdmin || !token) return;
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/my-modules`, headers);
        if (res.data.detailed?.event) {
          setPerms(res.data.detailed.event);
        }
      } catch (e) { console.error("Permission fetch failed", e); }
    };
    fetchPerms();
    fetchBranches();
    fetchEvents();
  }, [token, isAdmin]);

  const fetchBranches = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/branch`, headers);
      setBranches(res.data.data || []);
    } catch (err) { console.error(err); }
  };

  const fetchDepartmentsByBranch = async (branchId) => {
    if (!branchId) return [];
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/departments?branchId=${branchId}`, headers);
      return res.data.data || [];
    } catch (err) { return []; }
  };

  const fetchEvents = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/events`, headers);
      setEvents(res.data.data || []);
    } catch (err) { console.error(err); }
  };

  const getThemeColors = () => {
    const isDark = document.body.getAttribute('data-theme') === 'dark';
    return {
      bg: isDark ? '#0f172a' : '#ffffff',
      text: isDark ? '#f8fafc' : '#0f172a',
      inputBg: isDark ? '#1e293b' : '#f8fafc',
      border: isDark ? '#334155' : '#dee2e6'
    };
  };

  const canCreate = isAdmin || perms.create;
  const canEdit = isAdmin || perms.edit;
  const canDelete = isAdmin || perms.delete;

  /* ================= ADD EVENT MODAL ================= */
  const handleAddEvent = async () => {
    const theme = getThemeColors();
    
    const branchOptions = branches
      .map((b) => `<option value="${b._id}">${b.name}</option>`)
      .join("");

    Swal.fire({
      title: '<h3 class="fw-bold mb-0">📅 Create New Event</h3>',
      background: theme.bg,
      color: theme.text,
      width: '700px',
      html: `
        <div class="text-start container-fluid px-0 mt-3">
          <div class="row g-3">
            <div class="col-md-6">
              <label class="form-label fw-bold small text-uppercase opacity-75">Branch</label>
              <select id="branch" class="form-select shadow-none" 
                style="background-color:${theme.inputBg}; color:${theme.text}; border-color:${theme.border}">
                <option value="">Select Branch</option>
                ${branchOptions}
              </select>
            </div>
            
            <div class="col-md-6">
              <label class="form-label fw-bold small text-uppercase opacity-75">Department</label>
              <select id="department" class="form-select shadow-none" 
                style="background-color:${theme.inputBg}; color:${theme.text}; border-color:${theme.border}">
                <option value="">Select Department</option>
              </select>
            </div>

            <div class="col-12">
              <label class="form-label fw-bold small text-uppercase opacity-75">Event Title</label>
              <input id="title" class="form-control shadow-none" placeholder="e.g. Annual Sports Meet"
                style="background-color:${theme.inputBg}; color:${theme.text}; border-color:${theme.border}">
            </div>

            <div class="col-md-6">
              <label class="form-label fw-bold small text-uppercase opacity-75">Start Date</label>
              <input type="date" id="start" class="form-control shadow-none"
                style="background-color:${theme.inputBg}; color:${theme.text}; border-color:${theme.border}">
            </div>
            <div class="col-md-6">
              <label class="form-label fw-bold small text-uppercase opacity-75">End Date</label>
              <input type="date" id="end" class="form-control shadow-none"
                style="background-color:${theme.inputBg}; color:${theme.text}; border-color:${theme.border}">
            </div>
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Create Event',
      confirmButtonColor: '#4f46e5',
      cancelButtonColor: '#94a3b8',
      focusConfirm: false,
      
      didOpen: () => {
        const branchSelect = document.getElementById("branch");
        const deptSelect = document.getElementById("department");

        branchSelect.addEventListener("change", async (e) => {
          deptSelect.innerHTML = '<option>Loading...</option>';
          const depts = await fetchDepartmentsByBranch(e.target.value);
          deptSelect.innerHTML = `<option value="">Select Department</option>` +
            depts.map((d) => `<option value="${d._id}">${d.name}</option>`).join("");
        });
      },
      
      preConfirm: () => {
        const branchId = document.getElementById("branch").value;
        const departmentId = document.getElementById("department").value;
        const title = document.getElementById("title").value.trim();
        const startDate = document.getElementById("start").value;
        const endDate = document.getElementById("end").value;

        if (!branchId || !title || !startDate || !endDate) {
          Swal.showValidationMessage("Please fill all required fields");
          return false;
        }
        return { branchId, departmentId, title, startDate, endDate };
      },
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await axios.post(`${import.meta.env.VITE_API_URL}/api/events/create`, result.value, headers);
          fetchEvents();
          Swal.fire({
            icon: "success", 
            title: "Created!", 
            background: theme.bg, 
            color: theme.text,
            timer: 1500,
            showConfirmButton: false
          });
        } catch (error) {
          Swal.fire("Error", "Failed to create event", "error");
        }
      }
    });
  };

  /* ================= EDIT / DELETE MODAL ================= */
  const handleEditDelete = (e) => {
    const theme = getThemeColors();
    const disabledAttr = canEdit ? '' : 'disabled="disabled"';

    Swal.fire({
      title: '<h4 class="fw-bold">Event Details</h4>',
      background: theme.bg,
      color: theme.text,
      html: `
        <div class="text-start container-fluid px-0">
          <div class="mb-3">
            <label class="form-label fw-bold small text-uppercase opacity-75">Event Title</label>
            <input id="title" class="form-control shadow-none" value="${e.title}" ${disabledAttr}
              style="background-color:${theme.inputBg}; color:${theme.text}; border-color:${theme.border}">
          </div>
          <div class="row g-2">
            <div class="col-6">
              <label class="form-label fw-bold small text-uppercase opacity-75">Start Date</label>
              <input type="date" id="start" class="form-control shadow-none" value="${moment(e.startDate).format("YYYY-MM-DD")}" ${disabledAttr}
                style="background-color:${theme.inputBg}; color:${theme.text}; border-color:${theme.border}">
            </div>
            <div class="col-6">
              <label class="form-label fw-bold small text-uppercase opacity-75">End Date</label>
              <input type="date" id="end" class="form-control shadow-none" value="${moment(e.endDate).format("YYYY-MM-DD")}" ${disabledAttr}
                style="background-color:${theme.inputBg}; color:${theme.text}; border-color:${theme.border}">
            </div>
          </div>
        </div>
      `,
      showCancelButton: true,
      showConfirmButton: canEdit,
      showDenyButton: canDelete,
      confirmButtonText: "Update",
      denyButtonText: "Delete",
      cancelButtonText: "Close",
      confirmButtonColor: "#4f46e5",
      denyButtonColor: "#ef4444",
      preConfirm: () => ({
        title: document.getElementById("title").value,
        startDate: document.getElementById("start").value,
        endDate: document.getElementById("end").value,
      }),
    }).then(async (result) => {
      if (result.isConfirmed && canEdit) {
        await axios.put(`${import.meta.env.VITE_API_URL}/api/events/${e._id}`, result.value, headers);
        fetchEvents();
        Swal.fire({icon: "success", title: "Updated", background: theme.bg, color: theme.text, timer: 1500, showConfirmButton: false});
      }
      if (result.isDenied && canDelete) {
        await axios.delete(`${import.meta.env.VITE_API_URL}/api/events/${e._id}`, headers);
        fetchEvents();
        Swal.fire({icon: "success", title: "Deleted", background: theme.bg, color: theme.text, timer: 1500, showConfirmButton: false});
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

        const dayEvents = events.filter((e) =>
          currentDay.isBetween(moment(e.startDate), moment(e.endDate), "day", "[]")
        );

        week.push(
          <td key={currentDay.format()} className={isToday ? "today" : ""} style={{opacity: isCurrentMonth ? 1 : 0.4}}>
            <div className="date-number">
              {currentDay.date()}
              {isToday && <span style={{fontSize:'10px', color:'var(--primary-color)'}}>Today</span>}
            </div>
            <div className="events-wrapper">
              {dayEvents.slice(0, 3).map((e) => (
                <div
                  key={e._id}
                  className="event-chip"
                  onClick={() => handleEditDelete(e)}
                  title={e.title}
                >
                  {e.title}
                </div>
              ))}
              {dayEvents.length > 3 && (
                 <div style={{fontSize:'10px', color:'var(--text-secondary)', paddingLeft:'5px'}}>
                   +{dayEvents.length - 3} more
                 </div>
              )}
            </div>
          </td>
        );
        day.add(1, "day");
      }
      rows.push(<tr key={day.format()}>{week}</tr>);
    }
    return rows;
  };

  const upcoming = events
    .filter((e) => moment(e.startDate).isSameOrAfter(moment(), "day"))
    .sort((a,b) => new Date(a.startDate) - new Date(b.startDate));

  return (
    <DynamicLayout>
      <div className="calendar-container">
        
        {/* HEADER SECTION */}
        <div className="calendar-top">
          <div>
            <h2 className="d-flex align-items-center">
              <BiCalendarEvent className="me-2 text-primary" style={{color: 'var(--primary-color)'}}/> 
              {currentMonth.format("MMMM YYYY")}
            </h2>
            <p className="m-0 text-muted" style={{fontSize:'14px', color:'var(--text-secondary)'}}>
                Manage company-wide events and holidays
            </p>
          </div>
          
          <div className="calendar-buttons">
            <button onClick={() => setCurrentMonth(currentMonth.clone().subtract(1, "month"))}>
                <BiChevronLeft size={20}/>
            </button>
            <button onClick={() => setCurrentMonth(moment())} style={{fontSize:'13px'}}>Today</button>
            <button onClick={() => setCurrentMonth(currentMonth.clone().add(1, "month"))}>
                <BiChevronRight size={20}/>
            </button>
            {/* ✅ PROTECTED CREATE EVENT BUTTON */}
            {canCreate && (
              <button className="active d-flex align-items-center gap-1" onClick={handleAddEvent}>
                 <BiPlus size={18} /> New Event
              </button>
            )}
          </div>
        </div>

        <div className="calendar-layout">
          
          {/* MAIN CALENDAR */}
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

          {/* SIDEBAR */}
          <div className="calendar-sidebar">
            <h3><BsPinAngleFill /> Upcoming Events</h3>
            
            <div className="sidebar-content">
              {upcoming.slice(0, 5).map((e) => (
                  <div key={e._id} className="upcoming-card" onClick={() => handleEditDelete(e)}>
                    <strong>{e.title}</strong>
                    <p>
                      <BsCalendarCheck size={12} /> {moment(e.startDate).format("MMM D")} - {moment(e.endDate).format("MMM D")}
                    </p>
                  </div>
              ))}
              
              {upcoming.length === 0 && (
                <div className="text-center py-4 text-muted opacity-75">
                   <BiTimeFive size={24} className="mb-2"/>
                   <p style={{fontSize:'13px'}}>No upcoming events found</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DynamicLayout>
  );
};

export default EventManagement;