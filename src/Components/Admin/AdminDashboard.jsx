import React, { useEffect, useState } from "react";
import DynamicLayout from "../Common/DynamicLayout";
import axios from "axios";
import Swal from "sweetalert2";
import Loader from "./Loader/Loader";
import { useNavigate } from "react-router-dom";
import {
  FiUsers, FiCalendar, FiCheckCircle, FiClock, FiActivity,
  FiBriefcase, FiAlertCircle, FiVideo, FiCheck, FiX, FiRefreshCw, FiGrid, FiTrendingUp, FiPlus, FiMapPin
} from "react-icons/fi";
import { FaProjectDiagram, FaUserClock, FaDoorOpen } from "react-icons/fa";
import Chart from "react-apexcharts";
import moment from "moment";
import Calendar from "react-calendar";
import 'react-calendar/dist/Calendar.css';
import "./AdminDashboard.css";
import { toast } from "react-toastify";

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [attendanceSummary, setAttendanceSummary] = useState({ present: 0, late: 0, absent: 0 });
  const [projectData, setProjectData] = useState({ labels: [], series: [] });
  const [recentLeaves, setRecentLeaves] = useState([]);
  const [upcomingMeetings, setUpcomingMeetings] = useState([]);
  
  // Event & Calendar States
  const [events, setEvents] = useState([]);
  const [date, setDate] = useState(new Date());
  
  // Modal States
  const [showModal, setShowModal] = useState(false);
  const [branches, setBranches] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [formData, setFormData] = useState({
    branchId: "",
    departmentId: "",
    title: "",
    startDate: "",
    endDate: ""
  });

  const navigate = useNavigate();
  const token = JSON.parse(localStorage.getItem("user"))?.token;
  const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    headers: { Authorization: `Bearer ${token}` },
  });

  useEffect(() => { fetchAllData(); }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [dashRes, attRes, leaveRes, meetingRes, projRes, eventRes, branchRes] = await Promise.all([
        api.get("/api/reports/dashboard"),
        api.get(`/api/attendance/monthly?month=${moment().format("YYYY-MM")}`),
        api.get("/api/leaves"),
        api.get("/api/meeting/all"),
        api.get("/api/projects"),
        api.get("/api/events"),
        api.get("/api/branch")
      ]);

      setStats(dashRes.data?.data);
      
      const sum = { present: 0, late: 0, absent: 0 };
      attRes.data?.data?.forEach(r => {
        if (r.status === "Present") sum.present++;
        else if (r.status === "Late") sum.late++;
        else sum.absent++;
      });
      setAttendanceSummary(sum);

      setRecentLeaves((leaveRes.data.data || []).filter(l => l.status === "Pending").slice(0, 6));
      setUpcomingMeetings((meetingRes.data || []).slice(0, 4));
      setEvents(eventRes.data.data || []);
      setBranches(branchRes.data.data || []);

      let p=0, ip=0, c=0;
      projRes.data?.data?.forEach(proj => {
        proj.tasks?.forEach(t => {
          if(t.status === 'pending') p++;
          else if(t.status === 'in-progress') ip++;
          else c++;
        });
      });
      setProjectData({ labels: ['Pending', 'In Progress', 'Done'], series: [p, ip, c] });

    } catch (err) { console.error("Sync Error", err); }
    setLoading(false);
  };

  const handleInputChange = async (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    if (name === "branchId") {
       if(value) {
         try {
           const res = await api.get(`/api/departments?branchId=${value}`);
           setDepartments(res.data.data || []);
         } catch(err) { console.error(err); }
       } else {
         setDepartments([]);
       }
    }
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    if(!formData.branchId || !formData.title || !formData.startDate || !formData.endDate) {
      Swal.fire("Required", "Please fill all mandatory fields", "warning");
      return;
    }
    try {
      await api.post("/api/events/create", formData);
      Swal.fire({ title: 'Event Added', icon: 'success', toast: true, position: 'top-end', timer: 2000, showConfirmButton: false });
      setShowModal(false);
      setFormData({ branchId: "", departmentId: "", title: "", startDate: "", endDate: "" });
      fetchAllData();
    } catch (err) { Swal.fire("Error", "Failed to create event", "error"); }
  };

  // --- CALENDAR RANGE HIGHLIGHT LOGIC ---
  const tileClassName = ({ date, view }) => {
    if (view === 'month') {
      const dateMoment = moment(date);
      // Check if this date is part of ANY event
      const event = events.find(e => 
        dateMoment.isBetween(moment(e.startDate), moment(e.endDate), 'day', '[]')
      );

      if (event) {
        const isStart = dateMoment.isSame(moment(event.startDate), 'day');
        const isEnd = dateMoment.isSame(moment(event.endDate), 'day');

        if (isStart && isEnd) return 'event-range-single'; // Both start and end same day
        if (isStart) return 'event-range-start';
        if (isEnd) return 'event-range-end';
        return 'event-range-middle';
      }
    }
    return null;
  };
const handleLeaveAction = async (id, status) => {
  try {
    const res = await api.put(`/api/leaves/${id}`, { status });

    toast.success(`Leave ${status} successfully`);
    fetchAllData();

  } catch (err) {
    toast.error(err.response?.data?.message || "Update failed");
  }
};

  const selectedDateEvents = events.filter(e => 
    moment(date).isBetween(moment(e.startDate), moment(e.endDate), 'day', '[]')
  );

  const kpis = [
    { label: "Employees", value: stats?.totalEmployees, icon: <FiUsers />, color: "blue" },
    { label: "Leaves", value: stats?.totalLeaves, icon: <FiCalendar />, color: "purple" },
    { label: "Projects", value: stats?.totalProjects, icon: <FaProjectDiagram />, color: "cyan" },
    { label: "Today Pres.", value: stats?.todayAttendance, icon: <FaUserClock />, color: "orange" },
    { label: "Exits", value: stats?.exitRequests, icon: <FaDoorOpen />, color: "red" },
  ];

  return (
    <DynamicLayout>
      <div className="iso-dashboard-container">
        <div className="hq-global-wrapper">
          <div className="hq-header animate__animated animate__fadeInDown">
            <div className="hq-header-text">
              <h2 className="hq-page-title">Command Center</h2>
              <p className="hq-page-subtitle">Real-time enterprise operations management</p>
              <button className="hq-btn-sync mt-3" onClick={fetchAllData}>
                <FiRefreshCw className={loading ? "spin" : ""} /> Sync Analytics
              </button>
            </div>
            <div className="hq-header-visual">
               <svg width="200" height="120" viewBox="0 0 200 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="150" cy="60" r="50" fill="var(--hq-accent)" fillOpacity="0.1" />
                <rect x="20" y="20" width="120" height="80" rx="12" fill="var(--hq-card)" stroke="var(--hq-accent)" strokeWidth="2" />
                <rect x="35" y="40" width="50" height="6" rx="3" fill="var(--hq-accent)" />
                <rect x="35" y="55" width="80" height="6" rx="3" fill="var(--hq-text-muted)" fillOpacity="0.3" />
                <rect x="35" y="70" width="60" height="6" rx="3" fill="var(--hq-text-muted)" fillOpacity="0.3" />
                <circle cx="160" cy="40" r="15" fill="#f59e0b" fillOpacity="0.2" />
                <path d="M155 40L158 43L165 36" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="170" cy="85" r="20" fill="var(--hq-accent)" />
                <path d="M165 85H175M170 80V90" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
          </div>

          <div className="hq-kpi-row mt-4">
            {kpis.map((k, i) => (
              <div key={i} className={`hq-kpi-card ${k.color} animate__animated animate__zoomIn`} style={{animationDelay: `${i*0.1}s`}}>
                <div className="hq-kpi-icon-box">{k.icon}</div>
                <div className="hq-kpi-info">
                  <h3 className="dynamic-text-color">{k.value || 0}</h3>
                  <p className="hq-kpi-label">{k.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* ======================================================== */}
          {/* NEW SECTION: Today's Attendance Overview (Chart + Stats) */}
          {/* ======================================================== */}
          <div className="hq-glass-surface p-4 mt-4 animate__animated animate__fadeInUp">
            <h6 className="hq-section-title mb-3"><FiActivity className="me-2" /> Today's Attendance Overview</h6>
            
            <div className="d-flex flex-column flex-lg-row align-items-center gap-4">
                <div className="flex-grow-1 w-100" style={{ minWidth: "65%" }}>
                    <Chart 
                        options={{
                            chart: { toolbar: { show: false }, sparkline: { enabled: false } },
                            stroke: { curve: 'smooth', width: 3 },
                            fill: { type: 'gradient', gradient: { opacityFrom: 0.4, opacityTo: 0 } },
                            xaxis: { categories: ["Present", "Late", "Absent"], labels: { style: { colors: "#94a3b8" } } },
                            colors: ["#6366f1"],
                            grid: { borderColor: "rgba(148, 163, 184, 0.1)", padding: { top: 0, right: 0, bottom: 0, left: 0 } },
                            dataLabels: { enabled: false },
                            tooltip: { theme: 'dark' }
                        }} 
                        series={[{name: 'Staff', data: [attendanceSummary.present, attendanceSummary.late, attendanceSummary.absent]}]} 
                        type="area" height={220} 
                    />
                </div>

                <div className="d-flex flex-row flex-lg-column w-100 justify-content-around gap-3" style={{ maxWidth: "300px" }}>
                    
                    <div className="p-3 rounded w-100 d-flex align-items-center justify-content-between" style={{ backgroundColor: "rgba(16, 185, 129, 0.1)", borderLeft: "4px solid #10b981" }}>
                        <div>
                            <small className="d-block fw-bold text-muted mb-1">Present</small>
                            <h4 className="m-0 fw-bolder text-dark">{attendanceSummary.present}</h4>
                        </div>
                        <div className="bg-white rounded-circle p-2 text-success"><FiCheckCircle size={20}/></div>
                    </div>

                    <div className="p-3 rounded w-100 d-flex align-items-center justify-content-between" style={{ backgroundColor: "rgba(245, 158, 11, 0.1)", borderLeft: "4px solid #f59e0b" }}>
                        <div>
                            <small className="d-block fw-bold text-muted mb-1">Late</small>
                            <h4 className="m-0 fw-bolder text-dark">{attendanceSummary.late}</h4>
                        </div>
                        <div className="bg-white rounded-circle p-2 text-warning"><FiClock size={20}/></div>
                    </div>

                    <div className="p-3 rounded w-100 d-flex align-items-center justify-content-between" style={{ backgroundColor: "rgba(239, 68, 68, 0.1)", borderLeft: "4px solid #ef4444" }}>
                        <div>
                            <small className="d-block fw-bold text-muted mb-1">Absent</small>
                            <h4 className="m-0 fw-bolder text-dark">{attendanceSummary.absent}</h4>
                        </div>
                        <div className="bg-white rounded-circle p-2 text-danger"><FiX size={20}/></div>
                    </div>

                </div>
            </div>
          </div>
          {/* ======================================================== */}
          
          {/* ORIGINAL SECTION: Trend Chart & Calendar */}
          <div className="hq-grid-top mt-4">
              <div className="hq-glass-surface p-4">
                  <h6 className="hq-section-title mb-3"><FiTrendingUp className="me-2" /> Attendance Trend</h6>
                  <Chart 
                  options={{
                      chart: { toolbar: { show: false } },
                      stroke: { curve: 'smooth', width: 3 },
                      fill: { type: 'gradient', gradient: { opacityFrom: 0.4, opacityTo: 0 } },
                      xaxis: { categories: ["Present", "Late", "Absent"], labels: { style: { colors: "#94a3b8" } } },
                      colors: ["#6366f1"],  
                      grid: { borderColor: "rgba(148, 163, 184, 0.1)" },
                      dataLabels: { enabled: false }
                  }} 
                  series={[{name: 'Staff', data: [attendanceSummary.present, attendanceSummary.late, attendanceSummary.absent]}]} 
                  type="area" height={280} 
                  />
              </div>

              <div className="hq-glass-surface p-3 d-flex flex-column">
                  <div className="d-flex justify-content-between align-items-center mb-2 px-2">
                      <h6 className="hq-section-title m-0"><FiCalendar className="me-2"/> Event Calendar</h6>
                      <button className="btn btn-sm btn-dark rounded-pill px-3 d-flex align-item-center" onClick={() => setShowModal(true)}>
                      <FiPlus /> Add
                      </button>
                  </div>
                  <div className="flex-grow-1 d-flex justify-content-center">
                      <Calendar 
                          onChange={setDate} 
                          value={date} 
                          className="hq-calendar-custom"
                          tileClassName={tileClassName} 
                      />
                  </div>
                  <div className="mt-2 pt-2 border-top">
                      <p className="text-muted small mb-1 fw-bold">{moment(date).format("dddd, MMM Do")}</p>
                      <div className="d-flex flex-wrap gap-1">
                          {selectedDateEvents.length > 0 ? (
                              selectedDateEvents.map(e => (
                                  <span key={e._id} className="badge bg-soft-primary text-primary border border-primary-subtle">
                                      {e.title}
                                  </span>
                              ))
                          ) : <span className="text-muted small fst-italic">No events scheduled</span>}
                      </div>
                  </div>
              </div>
          </div>

          <div className="hq-grid-bottom mt-4">
               <div className="hq-glass-surface p-4">
                  <h6 className="hq-section-title mb-3"><FiGrid className="me-2" /> Project Status</h6>
                  <div className="d-flex justify-content-center align-items-center h-100">
                      <Chart 
                          options={{
                              chart: { type: 'donut' },
                              labels: projectData.labels,
                              colors: ['#6366f1', '#f59e0b', '#10b981'],
                              plotOptions: { pie: { donut: { size: '70%', labels: { show: true, total: { show: true, label: 'Tasks', color: '#94a3b8' } } } } },
                              dataLabels: { enabled: false },
                              stroke: { width: 0 },
                              legend: { position: 'bottom', labels: { colors: '#94a3b8' } }
                          }} 
                          series={projectData.series} type="donut" width="100%" height={250}
                      />
                  </div>
              </div>

              <div className="hq-glass-surface p-4">
                  <h6 className="hq-section-title mb-3"><FiVideo className="me-2 text-danger"/> Upcoming Briefs</h6>
                  <div className="hq-brief-stack-horizontal">
                    {upcomingMeetings.length > 0 ? upcomingMeetings.map((m, i) => (
                      <div key={i} className="hq-brief-card-horiz animate__animated animate__fadeInRight" style={{animationDelay: `${i*0.1}s`}}>
                        <div className="d-flex justify-content-between align-items-start mb-2">
                            <div className="tile-badge-sm">{moment(m.date).format("DD MMM")}</div>
                            <span className="badge bg-light text-dark">{m.startTime}</span>
                        </div>
                        <p className="brief-title dynamic-text-color text-truncate">{m.title}</p>
                        <div className="d-flex align-items-center text-muted small mt-auto">
                            <FiMapPin className="me-1"/> HQ Room
                        </div>
                      </div>
                    )) : (
                        <div className="w-100 text-center text-muted py-4">No upcoming briefs</div>
                    )}
                  </div>
              </div>
          </div>

          <div className="hq-table-container mt-4 animate__animated animate__fadeInUp">
            <div className="hq-table-header p-4 d-flex justify-content-between">
              <h6 className="hq-section-title m-0">Approval Queue</h6>
              <button className="hq-btn-link" onClick={() => navigate("/admin/leaves")}>Pipeline Hub</button>
            </div>
            <div className="table-responsive">
              <table className="table hq-table-pro">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Request Type</th>
                    <th>Schedule</th>
                    <th className="text-end">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {recentLeaves.map((l, i) => (
                    <tr key={i}>
                      <td>
                        <div className="d-flex align-items-center gap-3">
                          <div className="hq-avatar-mini">{l.employeeId?.name.charAt(0)}</div>
                          <span className="hq-emp-name dynamic-text-color">{l.employeeId?.name}</span>
                        </div>
                      </td>
                      <td><span className="hq-pill-type">{l.leaveType}</span></td>
                      <td className="hq-date-text">{moment(l.startDate).format("MMM DD")} — {moment(l.endDate).format("MMM DD")}</td>
                      <td className="text-end">
                        <div className="d-flex gap-2 justify-content-end">
                           <button className="hq-btn-act tick" onClick={() => handleLeaveAction(l._id, 'Approved')}><FiCheck /></button>
                           <button className="hq-btn-act cross" onClick={() => handleLeaveAction(l._id, 'Rejected')}><FiX /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        {showModal && (
    <div className="hq-modal-overlay">
      <div className="hq-modal-dialog">
        <div className="modal-content hq-modal-content">
          
          <div className="modal-header border-0 pb-0 px-4 pt-4">
            <h5 className="modal-title d-flex align-items-center">
              <FiCalendar className="me-2 text-primary"/> Schedule Event
            </h5>
            <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
          </div>

          <form onSubmit={handleCreateEvent}>
            <div className="modal-body p-4">
              
              <div className="mb-4">
                <label className="form-label">EVENT TITLE <span className="text-danger"></span></label>
                <input 
                  type="text" 
                  className="form-control hq-input" 
                  name="title" 
                  value={formData.title} 
                  onChange={handleInputChange} 
                  placeholder="e.g. Annual Summit" 
                  required
                />
              </div>

              <div className="row g-3 mb-4">
                <div className="col-6">
                  <label className="form-label">START DATE <span className="text-danger"></span></label>
                  <input 
                    type="date" 
                    className="form-control hq-input" 
                    name="startDate" 
                    value={formData.startDate} 
                    onChange={handleInputChange} 
                    required
                  />
                </div>
                <div className="col-6">
                  <label className="form-label">END DATE <span className="text-danger"></span></label>
                  <input 
                    type="date" 
                    className="form-control hq-input" 
                    name="endDate" 
                    value={formData.endDate} 
                    onChange={handleInputChange} 
                    required
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="form-label">BRANCH <span className="text-danger"></span></label>
                <select 
                  className="form-select hq-input" 
                  name="branchId" 
                  value={formData.branchId} 
                  onChange={handleInputChange} 
                  required
                >
                  <option value="">Select Branch</option>
                  {branches.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
                </select>
              </div>

              <div className="mb-2">
                <label className="form-label">DEPARTMENT</label>
                <select 
                  className="form-select hq-input" 
                  name="departmentId" 
                  value={formData.departmentId} 
                  onChange={handleInputChange}
                >
                  <option value="">All Departments</option>
                  {departments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                </select>
              </div>
            </div>

            <div className="modal-footer border-0 pt-0 px-4 pb-4">
              <button type="button" className="btn btn-light rounded-pill px-4 fw-bold" onClick={() => setShowModal(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary rounded-pill px-4 fw-bold">
                Create Schedule
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )}
        </div>
        {loading && <Loader />}
      </DynamicLayout>
    );
  };

export default AdminDashboard;