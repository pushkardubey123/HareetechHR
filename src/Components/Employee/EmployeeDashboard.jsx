import React, { useEffect, useState } from "react";
import EmployeeLayout from "./EmployeeLayout";
import axios from "axios";
import Loader from "../Admin/Loader/Loader";
import { useNavigate } from "react-router-dom";
import {
  FiCheckCircle, FiClock, FiCalendar, FiRefreshCw, 
  FiTrendingUp, FiAlertCircle, FiActivity, FiMapPin, FiBriefcase
} from "react-icons/fi";
import Chart from "react-apexcharts";
import moment from "moment";
import Calendar from "react-calendar";
import 'react-calendar/dist/Calendar.css';
import "./EmployeeDashboard.css"; // Ensure using the NEW CSS file

const EmployeeDashboard = () => {
  const [loading, setLoading] = useState(false);
  const [userName, setUserName] = useState("");
  
  // Data States
  const [leaveStats, setLeaveStats] = useState({ total: 0, pending: 0, approved: 0 });
  const [attendanceTrend, setAttendanceTrend] = useState({ series: [] });
  const [taskData, setTaskData] = useState({ labels: [], series: [] });
  const [events, setEvents] = useState([]); 
  const [recentLeaves, setRecentLeaves] = useState([]);
  const [date, setDate] = useState(new Date());
  const [selectedDateEvents, setSelectedDateEvents] = useState([]);

  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));
  const token = user?.token;
  const employeeId = user?._id || user?.id; 

  const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    headers: { Authorization: `Bearer ${token}` },
  });

  useEffect(() => {
    if (user) setUserName(user.name || user.username);
    fetchAllData();
  }, []);

  // Filter events when date changes
  useEffect(() => {
    const dailyEvents = events.filter(e => 
      moment(date).isBetween(moment(e.startDate), moment(e.endDate), 'day', '[]')
    );
    setSelectedDateEvents(dailyEvents);
  }, [date, events]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const month = moment().format("YYYY-MM");
      
      const [leaveRes, attRes, projRes, eventRes] = await Promise.all([
        api.get(`/api/leaves/employee/${employeeId}`),
        api.get(`/api/attendance/monthly?month=${month}`),
        api.get(`/api/projects`),
        api.get(`/api/events/employee/${employeeId}`)
      ]);

      // 1. Leaves
      const myLeaves = leaveRes.data.data || [];
      setLeaveStats({
        total: myLeaves.length,
        pending: myLeaves.filter(l => l.status === "Pending").length,
        approved: myLeaves.filter(l => l.status === "Approved").length,
      });
      setRecentLeaves(myLeaves.slice(0, 4));

      // 2. Attendance Trend
      const myAtt = (attRes.data.data || []).filter(a => a.employeeId?._id === employeeId || a.employeeId === employeeId);
      const trendData = myAtt.map(a => a.status === 'Present' ? 100 : a.status === 'Late' ? 50 : 0).slice(-7);
      setAttendanceTrend({
        series: [{ name: 'Score', data: trendData.length > 0 ? trendData : [0,0,0,0,0,0,0] }]
      });

      // 3. Tasks
      let p = 0, ip = 0, c = 0;
      (projRes.data.data || []).forEach(proj => {
        proj.tasks?.forEach(t => {
          const isAssigned = Array.isArray(t.assignedTo) 
            ? t.assignedTo.some(u => (u._id || u) === employeeId) 
            : (t.assignedTo?._id || t.assignedTo) === employeeId;
          if (isAssigned) {
            if (t.status === 'pending') p++;
            else if (t.status === 'in-progress') ip++;
            else c++;
          }
        });
      });
      setTaskData({ labels: ['Pending', 'In Progress', 'Done'], series: [p, ip, c] });

      // 4. Events
      setEvents(eventRes.data.data || []);

    } catch (err) { console.error("Sync Error", err); }
    setLoading(false);
  };

  // --- Calendar Tile Dot Logic ---
  const tileContent = ({ date, view }) => {
    if (view === 'month') {
      const hasEvent = events.some(e => 
        moment(date).isBetween(moment(e.startDate), moment(e.endDate), 'day', '[]')
      );
      if (hasEvent) return <div className="event-dot"></div>;
    }
    return null;
  };

  const kpis = [
    { label: "Total Leaves", value: leaveStats.total, icon: <FiCalendar />, color: "blue" },
    { label: "Approved", value: leaveStats.approved, icon: <FiCheckCircle />, color: "green" },
    { label: "Pending Req.", value: leaveStats.pending, icon: <FiClock />, color: "orange" },
    { label: "Active Tasks", value: taskData.series[1] || 0, icon: <FiActivity />, color: "purple" },
  ];

  return (
    <EmployeeLayout>
      <div className="emp-dashboard-wrapper">
        
        {/* --- HEADER --- */}
        <div className="ed-header animate__animated animate__fadeInDown">
          <div>
            <h2 className="ed-page-title" style={{margin:0}}>Welcome, {userName.split(' ')[0]}!</h2>
            <p className="ed-page-subtitle text-muted" style={{marginBottom:0}}>Dashboard Overview</p>
          </div>
          <button className="btn btn-primary btn-sm d-flex align-items-center gap-2" onClick={fetchAllData}>
            <FiRefreshCw className={loading ? "spin" : ""} /> Sync
          </button>
        </div>

        {/* --- KPI STATS --- */}
        <div className="ed-stats-grid">
          {kpis.map((k, i) => (
            <div key={i} className={`ed-stat-card ${k.color} animate__animated animate__zoomIn`} style={{animationDelay: `${i*0.1}s`}}>
              <div className="ed-icon-box">{k.icon}</div>
              <div>
                <h3 className="dynamic-text mb-0 fw-bold">{k.value}</h3>
                <small className="text-muted fw-bold text-uppercase" style={{fontSize:'0.7rem'}}>{k.label}</small>
              </div>
            </div>
          ))}
        </div>

        {/* --- MAIN GRID (Charts Left | Calendar Right) --- */}
        <div className="ed-grid-container">
          
          {/* LEFT COLUMN: Charts & Table */}
          <div className="ed-col-left">
            
            {/* Chart: Attendance */}
            <div className="ed-card">
              <h6 className="ed-title"><FiTrendingUp className="text-primary"/> Attendance Trend (Last 7 Days)</h6>
              <div className="ed-chart-box">
                <Chart 
                  options={{
                      chart: { toolbar: { show: false }, sparkline: { enabled: false } },
                      stroke: { curve: 'smooth', width: 3 },
                      fill: { type: 'gradient', gradient: { opacityFrom: 0.5, opacityTo: 0 } },
                      xaxis: { categories: ["D1", "D2", "D3", "D4", "D5", "D6", "Today"], labels: { style: { colors: "#94a3b8" } } },
                      colors: ["#10b981"],
                      grid: { borderColor: "rgba(148, 163, 184, 0.1)" },
                      dataLabels: { enabled: false },
                      yaxis: { show: false }
                  }} 
                  series={attendanceTrend.series} 
                  type="area" height={250} 
                />
              </div>
            </div>

            {/* Recent Leaves Table */}
            <div className="ed-card">
               <div className="d-flex justify-content-between align-items-center mb-3">
                  <h6 className="ed-title mb-0"><FiBriefcase className="text-orange"/> Recent Leave Requests</h6>
                  <button className="btn btn-sm btn-link text-decoration-none" onClick={()=>navigate('/employee/my-leaves')}>View All</button>
               </div>
               <div className="ed-table-responsive">
                  <table className="ed-table">
                    <thead>
                      <tr><th>Type</th><th>Dates</th><th>Status</th></tr>
                    </thead>
                    <tbody>
                      {recentLeaves.length === 0 ? (
                        <tr><td colSpan="3" className="text-center text-muted">No records found</td></tr>
                      ) : (
                        recentLeaves.map((l,i) => (
                          <tr key={i}>
                            <td className="fw-bold">{l.leaveType}</td>
                            <td>{moment(l.startDate).format("MMM DD")} - {moment(l.endDate).format("MMM DD")}</td>
                            <td>
                              <span className={`badge-soft bs-${l.status === 'Approved' ? 'success' : l.status === 'Rejected' ? 'danger' : 'warning'}`}>
                                {l.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
               </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Calendar & Events */}
          <div className="ed-col-right">
             
             {/* Calendar Widget */}
             <div className="ed-card ed-calendar-wrapper">
                <h6 className="ed-title"><FiCalendar className="text-primary"/> Schedule</h6>
                <Calendar 
                  onChange={setDate} 
                  value={date} 
                  tileContent={tileContent} // Shows Dots
                />
             </div>

             {/* Selected Day Events */}
             <div className="ed-card">
                <h6 className="ed-title mb-2">Events on {moment(date).format("MMM DD")}</h6>
                <div className="ed-list-stack">
                  {selectedDateEvents.length === 0 ? (
                      <div className="text-center text-muted py-3">
                          <small>No events for this date.</small>
                      </div>
                  ) : (
                      selectedDateEvents.map((ev, i) => (
                        <div key={i} className="ed-list-item">
                          <div className="ed-date-badge">{moment(ev.startDate).format("DD")}</div>
                          <div style={{overflow: 'hidden'}}>
                            <p className="mb-0 fw-bold text-truncate dynamic-text" title={ev.title}>{ev.title}</p>
                            <small className="text-muted d-flex align-items-center gap-1">
                                <FiMapPin size={10}/> {ev.location || "Office"}
                            </small>
                          </div>
                        </div>
                      ))
                  )}
                </div>
             </div>

             {/* Task Status Donut */}
             <div className="ed-card">
                <h6 className="ed-title"><FiActivity className="text-purple"/> Task Stats</h6>
                <div className="d-flex justify-content-center">
                  <Chart 
                      options={{
                          chart: { type: 'donut' },
                          labels: taskData.labels,
                          colors: ['#ef4444', '#f59e0b', '#10b981'],
                          dataLabels: { enabled: false },
                          stroke: { width: 0 },
                          legend: { position: 'bottom', labels: { colors: '#94a3b8' } }
                      }} 
                      series={taskData.series} type="donut" width="100%" 
                  />
               </div>
             </div>

          </div>

        </div>
      </div>
      {loading && <Loader />}
    </EmployeeLayout>
  );
};

export default EmployeeDashboard;