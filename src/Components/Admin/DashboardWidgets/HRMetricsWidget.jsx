import React, { useState } from "react";
import Chart from "react-apexcharts";
import moment from "moment";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FiTrendingUp, FiCalendar, FiClock, FiArrowRight, 
  FiCheck, FiCheckCircle, FiUsers, FiCoffee 
} from "react-icons/fi";
import { FaLaptopHouse } from "react-icons/fa";

import "./HRMetricsWidget.css";

const HRMetricsWidget = ({ stats, leaves, wfh, events }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("all"); // 'all', 'leaves', 'wfh'
  const currentTheme = document.body.getAttribute("data-theme") || "dark";

  // Filtering Data
  const pendingLeaves = (leaves || []).filter(l => l.status === "Pending");
  const pendingWfh = (wfh || []).filter(w => w.status === "pending");
  const upcomingEvents = (events || []).slice(0, 3);

  // Live Today's Pulse Logic (Informative Summary)
  const todayStr = moment().format("YYYY-MM-DD");
  const onLeaveToday = (leaves || []).filter(l => l.status === "Approved" && moment(todayStr).isBetween(l.startDate, l.endDate, 'day', '[]')).length;
  const wfhToday = (wfh || []).filter(w => w.status === "approved" && moment(todayStr).isBetween(w.fromDate, w.toDate, 'day', '[]')).length;

  // Render Logic for Tabs
  const getQueueData = () => {
    let data = [];
    if (activeTab === "all" || activeTab === "leaves") {
      data = [...data, ...pendingLeaves.map(l => ({ ...l, type: 'leave' }))];
    }
    if (activeTab === "all" || activeTab === "wfh") {
      data = [...data, ...pendingWfh.map(w => ({ ...w, type: 'wfh' }))];
    }
    // Sort by date created/requested (assuming latest first, slicing top 6 for UI)
    return data.slice(0, 6);
  };

  const queueData = getQueueData();

  // Chart Data
  const attendanceSeries = [
    { name: 'Present', data: [85, 88, 92, 80, 95, stats?.todayAttendance || 90] },
    { name: 'Absent', data: [10, 8, 5, 15, 3, (stats?.totalEmployees - stats?.todayAttendance) || 5] }
  ];

  return (
    <div className="row g-4 mb-4">
      
      {/* LEFT COLUMN: Pulse Summary, Chart & Events */}
      <div className="col-xl-7 col-lg-12">
        <div className="row g-4">
          
          {/* Informative Summary: Today's Pulse */}
          <div className="col-12">
            <div className="row g-3">
              <div className="col-md-4">
                <div className="hq-pulse-card primary">
                  <FiUsers className="pulse-icon" />
                  <div>
                    <h4>{stats?.todayAttendance || 0}</h4>
                    <span>Present Today</span>
                  </div>
                </div>
              </div>
              <div className="col-md-4">
                <div className="hq-pulse-card warning">
                  <FiCoffee className="pulse-icon" />
                  <div>
                    <h4>{onLeaveToday}</h4>
                    <span>On Leave</span>
                  </div>
                </div>
              </div>
              <div className="col-md-4">
                <div className="hq-pulse-card info">
                  <FaLaptopHouse className="pulse-icon" />
                  <div>
                    <h4>{wfhToday}</h4>
                    <span>Remote (WFH)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Attendance Chart */}
          <div className="col-12">
            <div className="hq-glass-surface p-4 h-100 position-relative overflow-hidden">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="d-flex justify-content-between align-items-center hq-section-title m-0"><FiTrendingUp className="me-2 text-primary" /> Workforce Trend</h6>
                <button className="hq-btn-link d-flex align-items-center" onClick={() => navigate("/admin/employee-attendence-lists")}>
                  Full Report <FiArrowRight className="ms-1" />
                </button>
              </div>
              <Chart 
                options={{
                  chart: { toolbar: { show: false }, background: 'transparent', fontFamily: 'Inter, sans-serif' },
                  stroke: { curve: 'smooth', width: 3 },
                  fill: { type: 'gradient', gradient: { opacityFrom: 0.4, opacityTo: 0 } },
                  xaxis: { categories: ["Mon", "Tue", "Wed", "Thu", "Fri", "Today"], labels: { style: { colors: "var(--hq-text-muted)" } } },
                  yaxis: { labels: { style: { colors: "var(--hq-text-muted)" } } },
                  colors: ["#10b981", "#ef4444"], 
                  grid: { borderColor: "var(--hq-border)", strokeDashArray: 4 },
                  dataLabels: { enabled: false },
                  legend: { position: 'top', horizontalAlign: 'right', labels: { colors: 'var(--hq-text-muted)' } },
                  tooltip: { theme: currentTheme === 'dark' ? 'dark' : 'light' }
                }} 
                series={attendanceSeries} 
                type="area" height={240} width="100%"
              />
            </div>
          </div>

          {/* Upcoming Events Mini-List */}
          <div className="col-12">
            <div className="hq-glass-surface p-4">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h6 className="d-flex justify-content-between align-items-center hq-section-title m-0"><FiCalendar className="me-2 text-warning" /> Company Events</h6>
                <button className="hq-btn-link" onClick={() => navigate("/admin/events")}>Manage All</button>
              </div>
              <div className="d-flex flex-column gap-3">
                {upcomingEvents.length > 0 ? upcomingEvents.map((evt, idx) => (
                  <motion.div 
                    whileHover={{ scale: 1.01, x: 5 }}
                    key={idx} 
                    className="hq-event-card" 
                    style={{ borderLeftColor: evt.color || 'var(--hq-accent)' }}
                  >
                    <div className="flex-grow-1">
                      <h6 className="m-0 fw-bold dynamic-text-color">{evt.title}</h6>
                      <small className="text-muted"><FiClock className="me-1"/> {moment(evt.startDate).format("MMM DD, YYYY")}</small>
                    </div>
                    <span className="hq-badge-soft">{evt.departmentId?.name || "Global"}</span>
                  </motion.div>
                )) : (
                  <div className="text-center text-muted py-3 small fst-italic border rounded border-dashed border-secondary border-opacity-25">No upcoming events scheduled</div>
                )}
              </div>
            </div>
          </div>
          
        </div>
      </div>

      {/* RIGHT COLUMN: Interactive Tabbed Action Queue */}
      <div className="col-xl-5 col-lg-12">
        <div className="hq-glass-surface p-0 h-100 d-flex flex-column overflow-hidden">
          
          <div className="p-4 border-bottom border-opacity-10 d-flex justify-content-between align-items-center" style={{ borderColor: "var(--hq-border)" }}>
            <h6 className="hq-section-title m-0">Action Queue</h6>
            <span className="badge bg-danger rounded-pill px-2">{pendingLeaves.length + pendingWfh.length} Pending</span>
          </div>

          {/* Custom Tabs */}
          <div className="hq-tabs-container px-4 pt-3">
            <button className={`hq-tab ${activeTab === 'all' ? 'active' : ''}`} onClick={() => setActiveTab('all')}>All</button>
            <button className={`hq-tab ${activeTab === 'leaves' ? 'active' : ''}`} onClick={() => setActiveTab('leaves')}>Leaves ({pendingLeaves.length})</button>
            <button className={`hq-tab ${activeTab === 'wfh' ? 'active' : ''}`} onClick={() => setActiveTab('wfh')}>WFH ({pendingWfh.length})</button>
          </div>
          
          <div className="flex-grow-1 p-3 overflow-auto" style={{ maxHeight: "600px" }}>
            <AnimatePresence mode="popLayout">
              {queueData.length > 0 ? (
                queueData.map((item, i) => (
                  <motion.div 
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.2, delay: i * 0.05 }}
                    key={`${item.type}-${item._id || i}`} 
                    className="hq-queue-item"
                  >
                    <div className="d-flex align-items-center gap-3 w-100">
                      <div className={`hq-avatar-mini ${item.type === 'leave' ? 'bg-danger-soft text-danger' : 'bg-info-soft text-info'}`}>
                        {item.type === 'leave' ? item.employeeId?.name?.charAt(0) : <FaLaptopHouse />}
                      </div>
                      <div className="flex-grow-1 overflow-hidden">
                        <span className="hq-emp-name dynamic-text-color d-block text-truncate">
                          {item.type === 'leave' ? item.employeeId?.name : item.userId?.name}
                        </span>
                        <div className="d-flex align-items-center gap-2">
                          <span className={`hq-tiny-badge ${item.type === 'leave' ? 'leave' : 'wfh'}`}>
                            {item.type === 'leave' ? item.leaveType : 'Work From Home'}
                          </span>
                          <small className="text-muted" style={{ fontSize: '11px' }}>
                            {moment(item.startDate || item.fromDate).format("MMM DD")} - {moment(item.endDate || item.toDate).format("MMM DD")}
                          </small>
                        </div>
                      </div>
                      <motion.button 
                        whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                        className="hq-btn-act tick shadow-sm" 
                        onClick={() => navigate(item.type === 'leave' ? "/admin/leaves" : "/admin/wfh/requests")} 
                        title="Review"
                      >
                        <FiCheck />
                      </motion.button>
                    </div>
                  </motion.div>
                ))
              ) : (
                <motion.div 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="d-flex flex-column align-items-center justify-content-center h-100 text-muted opacity-50 py-5"
                >
                  <FiCheckCircle size={48} className="mb-3" />
                  <p className="m-0 fw-medium">Queue is completely clear!</p>
                  <small>No pending {activeTab !== 'all' ? activeTab : 'requests'} right now.</small>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

    </div>
  );
};

export default HRMetricsWidget;