import React, { useEffect, useState } from "react";
import Chart from "react-apexcharts";
import moment from "moment";
import { 
  FiCheckCircle, FiAlertCircle, FiClock, FiLayers, 
  FiTrendingUp, FiActivity, FiArrowRight, FiList,
  FiShield, FiTarget, FiMessageCircle, FiAlertTriangle
} from "react-icons/fi";
import Loader from "../Loader/Loader";

const TicketDashboard = ({ api, setViewMode, setActiveTab }) => {
  const [metrics, setMetrics] = useState(null);
  const [recentTickets, setRecentTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  // Theme Detection for Charts
  const currentTheme = document.body.getAttribute("data-theme") || "light";
  const isDark = currentTheme === "dark";

  // Dynamic Chart Colors based on Theme
  const textMainColor = isDark ? "#f8fafc" : "#1e293b";
  const textMutedColor = isDark ? "#94a3b8" : "#64748b";
  const gridColor = isDark ? "#1e293b" : "#f1f5f9";

  // Modern Enterprise Colors
  const colors = {
    primary: "#3b82f6",   // Blue
    success: "#10b981",   // Green
    warning: "#f59e0b",   // Orange
    danger: "#ef4444",    // Red
    purple: "#8b5cf6",    // Purple
    cyan: "#06b6d4",      // Cyan
    dark: isDark ? "#cbd5e1" : "#1e293b",      // Slate adapting
    gray: isDark ? "#475569" : "#94a3b8"       // Gray adapting
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const metricRes = await api.get("/api/tickets/dashboard/metrics");
      setMetrics(metricRes.data.data);

      const ticketRes = await api.get("/api/tickets/manage");
      const allTickets = ticketRes.data.data || [];
      const activeTickets = allTickets.filter(t => t.status !== "Resolved" && t.status !== "Closed");
      setRecentTickets(activeTickets.slice(0, 5)); 
      
    } catch (error) {
      console.error("Dashboard fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="py-5"><Loader /></div>;
  if (!metrics) return <div className="text-center py-5 text-muted">Failed to load dashboard data.</div>;

  // --- STATS CALCULATIONS ---
  const resolvedTotal = (metrics.statusDistribution["Resolved"] || 0) + (metrics.statusDistribution["Closed"] || 0);
  const openTotal = metrics.statusDistribution["Open"] || 0;
  const inProgressTotal = metrics.statusDistribution["In-Progress"] || 0;
  const waitingTotal = metrics.statusDistribution["Waiting on Employee"] || 0;
  const pendingTotal = openTotal + inProgressTotal + waitingTotal;
  
  const urgentTotal = (metrics.priorityDistribution["Urgent"] || 0) + (metrics.priorityDistribution["High"] || 0);
  
  const resolutionRate = metrics.totalTickets > 0 ? ((resolvedTotal / metrics.totalTickets) * 100).toFixed(1) : 0;
  const slaSuccessRate = metrics.totalTickets > 0 ? (((metrics.totalTickets - metrics.totalEscalated) / metrics.totalTickets) * 100).toFixed(1) : 0;

  // --- APEX CHARTS CONFIGURATIONS ---

  const healthOptions = {
    chart: { type: 'radialBar', fontFamily: 'Inter, sans-serif' },
    plotOptions: {
      radialBar: {
        hollow: { size: '65%' },
        track: { background: gridColor, strokeWidth: '100%' },
        dataLabels: {
          name: { fontSize: '14px', color: textMutedColor, offsetY: -10 },
          value: { fontSize: '28px', fontWeight: 700, color: textMainColor, offsetY: 10, formatter: val => `${val}%` }
        }
      }
    },
    colors: [resolutionRate > 70 ? colors.success : colors.warning],
    stroke: { lineCap: "round" },
    labels: ['Resolution Rate']
  };

  const statusLabels = Object.keys(metrics.statusDistribution).filter(k => metrics.statusDistribution[k] > 0);
  const statusSeries = statusLabels.map(k => metrics.statusDistribution[k]);
  
  const statusOptions = {
    chart: { type: 'donut', fontFamily: 'Inter, sans-serif', background: 'transparent' },
    labels: statusLabels,
    colors: [colors.primary, colors.warning, colors.purple, colors.success, colors.dark],
    plotOptions: { pie: { donut: { size: '70%', labels: { show: true, name: { show: true, color: textMutedColor }, value: { show: true, fontWeight: 700, color: textMainColor } } } } },
    dataLabels: { enabled: false },
    stroke: { width: 0 },
    legend: { position: 'right', fontSize: '13px', fontWeight: 600, labels: { colors: textMainColor }, markers: { radius: 12 } },
    tooltip: { theme: isDark ? 'dark' : 'light' }
  };

  const priorityLabels = Object.keys(metrics.priorityDistribution);
  const prioritySeries = [{ name: "Tickets", data: priorityLabels.map(k => metrics.priorityDistribution[k]) }];
  
  const priorityOptions = {
    chart: { type: 'bar', toolbar: { show: false }, fontFamily: 'Inter, sans-serif' },
    plotOptions: { bar: { borderRadius: 4, columnWidth: '45%', distributed: true } },
    colors: [colors.gray, colors.primary, colors.warning, colors.danger],
    dataLabels: { enabled: false },
    xaxis: { categories: priorityLabels, axisBorder: { show: false }, axisTicks: { show: false }, labels: { style: { fontWeight: 600, colors: textMainColor } } },
    yaxis: { labels: { style: { colors: textMutedColor } } },
    grid: { borderColor: gridColor, strokeDashArray: 4 },
    legend: { show: false },
    tooltip: { theme: isDark ? 'dark' : 'light' }
  };

  const deptLabels = metrics.departmentDistribution.slice(0, 6).map(d => d.departmentName);
  const deptSeries = [{ name: 'Ticket Volume', data: metrics.departmentDistribution.slice(0, 6).map(d => d.count) }];

  const deptOptions = {
    chart: { type: 'area', toolbar: { show: false }, fontFamily: 'Inter, sans-serif' },
    colors: [colors.purple],
    fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0.05, stops: [0, 90, 100] } },
    dataLabels: { enabled: false },
    stroke: { curve: 'smooth', width: 3 },
    xaxis: { categories: deptLabels, axisBorder: { show: false }, axisTicks: { show: false }, labels: { style: { fontWeight: 600, fontSize: '11px', colors: textMainColor } } },
    yaxis: { labels: { style: { colors: textMutedColor } } },
    grid: { borderColor: gridColor, strokeDashArray: 4 },
    tooltip: { theme: isDark ? 'dark' : 'light' }
  };

  return (
    <div className="crm-fade-in pb-4">
      
      {/* 🚀 HEADER & QUICK NAVIGATION ACTIONS */}
      <div className="d-flex flex-wrap justify-content-between align-items-end mb-4 gap-3">
        <div>
          <h3 className="crm-page-title mb-1 d-flex align-items-center">
            <FiActivity className="me-2 text-primary"/> Command Center
          </h3>
          <p className="crm-page-subtitle m-0">Live operational metrics, SLA tracking, and workload distribution.</p>
        </div>
        
        <div className="d-flex gap-2">
          <button className="crm-btn-outline d-flex align-items-center gap-2 fw-bold" onClick={() => { setActiveTab("manage-tickets"); setViewMode("list"); }}>
            <FiList /> Go to Queue
          </button>
          <button className="crm-btn-primary d-flex align-items-center gap-2 fw-bold shadow-sm" onClick={() => { setActiveTab("reports"); setViewMode("list"); }}>
            Deep Analytics <FiArrowRight />
          </button>
        </div>
      </div>

      {/* 🧩 ROW 1: 8 MINI DETAIL CARDS */}
      <div className="row g-3 mb-4">
        {[
          { title: "Total Raised", val: metrics.totalTickets, icon: <FiLayers/>, col: colors.primary, bgClass: "crm-bg-primary-soft" },
          { title: "Unassigned", val: openTotal, icon: <FiMessageCircle/>, col: colors.cyan, bgClass: "crm-bg-cyan-soft" },
          { title: "In Progress", val: inProgressTotal, icon: <FiClock/>, col: colors.warning, bgClass: "crm-bg-warning-soft" },
          { title: "Resolved", val: resolvedTotal, icon: <FiCheckCircle/>, col: colors.success, bgClass: "crm-bg-success-soft" },
          { title: "Urgent/High", val: urgentTotal, icon: <FiAlertTriangle/>, col: colors.danger, bgClass: "crm-bg-danger-soft" },
          { title: "SLA Breached", val: metrics.totalEscalated, icon: <FiAlertCircle/>, col: colors.danger, bgClass: "crm-bg-danger-soft" },
          { title: "Resolution Rate", val: `${resolutionRate}%`, icon: <FiTarget/>, col: colors.purple, bgClass: "crm-bg-purple-soft" },
          { title: "SLA Success", val: `${slaSuccessRate}%`, icon: <FiShield/>, col: slaSuccessRate > 75 ? colors.success : colors.danger, bgClass: "crm-bg-gray-soft" }
        ].map((stat, i) => (
          <div key={i} className="col-lg-3 col-md-4 col-sm-6">
            <div className="crm-card border-0 p-3 h-100 d-flex align-items-center gap-3 crm-hover-raise">
              <div className={`p-3 rounded-3 d-flex align-items-center justify-content-center ${stat.bgClass}`} style={{ color: stat.col, fontSize: '20px', width: '50px', height: '50px' }}>
                {stat.icon}
              </div>
              <div>
                <p className="text-muted mb-0 fw-bold" style={{fontSize: '11px', letterSpacing: '0.5px', textTransform: 'uppercase'}}>{stat.title}</p>
                <h4 className="m-0 fw-bolder crm-text-main">{stat.val}</h4>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 📈 ROW 2: PREMIUM APEX CHARTS */}
      <div className="row g-4 mb-4">
        
        <div className="col-lg-8">
          <div className="crm-card border-0 h-100">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h5 className="fw-bold m-0 crm-text-main">Volume by Department</h5>
              <span className="crm-badge crm-bg-purple-soft" style={{color: colors.purple}}>Top 6 Depts</span>
            </div>
            <div style={{ minHeight: "280px" }}>
              {deptSeries[0].data.length > 0 ? (
                <Chart options={deptOptions} series={deptSeries} type="area" height="280" />
              ) : <p className="text-muted text-center mt-5">No Data Available</p>}
            </div>
          </div>
        </div>

        <div className="col-lg-4">
          <div className="crm-card border-0 h-100 d-flex flex-column justify-content-between">
            <h5 className="fw-bold m-0 crm-text-main">System Health</h5>
            <div className="d-flex justify-content-center">
              <Chart options={healthOptions} series={[resolutionRate]} type="radialBar" height="280" />
            </div>
            <div className="crm-surface-alt rounded p-3 text-center">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span className="small text-muted fw-bold">SLA Adherence</span>
                <span className="badge bg-success">{slaSuccessRate}%</span>
              </div>
              <div className="progress" style={{height: '6px', backgroundColor: gridColor}}>
                <div className="progress-bar bg-success" style={{width: `${slaSuccessRate}%`}}></div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* 🎯 ROW 3: BAR CHART & LIVE TABLE */}
      <div className="row g-4">
        
        <div className="col-lg-4">
          <div className="crm-card border-0 h-100">
            <h5 className="fw-bold mb-4 crm-text-main">Workload Priority</h5>
            <Chart options={priorityOptions} series={prioritySeries} type="bar" height="280" />
          </div>
        </div>

        <div className="col-lg-8">
          <div className="crm-card border-0 h-100 d-flex flex-column">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="fw-bold m-0 crm-text-main">Live Active Feed</h5>
              <button className="crm-btn-outline px-3 py-1" style={{fontSize: '12px'}} onClick={() => { setActiveTab("manage-tickets"); setViewMode("list"); }}>
               <div className="d-flex align-items-center"> View All <FiArrowRight className="ms-1"/></div>
              </button>
            </div>
            
            <div className="table-responsive flex-grow-1">
              {/* Bootstap classes stripped to allow CSS variables to work */}
              <table className="table crm-table-custom align-middle m-0" style={{fontSize: '13px'}}>
                <thead className="crm-table-head">
                  <tr>
                    <th className="fw-bold">Ticket ID & Title</th>
                    <th className="fw-bold">Department</th>
                    <th className="fw-bold">Priority</th>
                    <th className="fw-bold">Status</th>
                    <th className="fw-bold text-end">Raised</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTickets.length === 0 ? (
                    <tr><td colSpan="5" className="text-center py-4 text-muted">No active tickets right now.</td></tr>
                  ) : (
                    recentTickets.map((t) => (
                      <tr key={t._id}>
                        <td>
                          <div className="fw-bold crm-text-main">{t.ticketId}</div>
                          <div className="text-truncate text-muted" style={{maxWidth: '150px'}}>{t.title}</div>
                        </td>
                        <td>{t.departmentId?.name || "N/A"}</td>
                        <td>
                          <span className={`crm-badge crm-badge-${t.priority === 'Urgent' || t.priority === 'High' ? 'danger' : t.priority === 'Medium' ? 'info' : 'secondary'}`}>
                            {t.priority}
                          </span>
                        </td>
                        <td>
                          <span className={`crm-badge crm-badge-${t.status === 'Open' ? 'success' : 'warning'}`}>
                            {t.status}
                          </span>
                        </td>
                        <td className="text-end text-muted">
                          {moment(t.createdAt).fromNow()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            
          </div>
        </div>

      </div>

    </div>
  );
};

export default TicketDashboard;