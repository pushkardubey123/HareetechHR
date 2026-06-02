import React, { useEffect, useState } from "react";
import Chart from "react-apexcharts";
import { 
  FiCheckCircle, FiAlertCircle, FiClock, FiLayers, 
  FiTrendingUp, FiActivity, FiArrowRight 
} from "react-icons/fi";
import Loader from "../Loader/Loader";

const TicketDashboard = ({ api, setViewMode, setActiveTab }) => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modern Enterprise Colors
  const colors = {
    primary: "#3b82f6",
    success: "#10b981",
    warning: "#f59e0b",
    danger: "#ef4444",
    purple: "#8b5cf6",
    cyan: "#06b6d4"
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/tickets/dashboard/metrics");
      setMetrics(res.data.data);
    } catch (error) {
      console.error("Dashboard fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="py-5"><Loader /></div>;
  if (!metrics) return <div className="text-center py-5 text-muted">Failed to load dashboard data.</div>;

  // --- STATS CALCULATIONS ---
  const resolvedTotal = metrics.statusDistribution["Resolved"] + metrics.statusDistribution["Closed"];
  const pendingTotal = metrics.totalTickets - resolvedTotal;
  const resolutionRate = metrics.totalTickets > 0 ? ((resolvedTotal / metrics.totalTickets) * 100).toFixed(1) : 0;
  const slaSuccessRate = metrics.totalTickets > 0 ? (((metrics.totalTickets - metrics.totalEscalated) / metrics.totalTickets) * 100).toFixed(1) : 0;

  // --- APEX CHARTS CONFIGURATIONS ---

  // 1. Radial Bar Chart (Overall Health)
  const healthOptions = {
    chart: { type: 'radialBar', fontFamily: 'Inter, sans-serif' },
    plotOptions: {
      radialBar: {
        hollow: { size: '65%' },
        track: { background: '#e2e8f0', strokeWidth: '100%' },
        dataLabels: {
          name: { fontSize: '14px', color: '#64748b', offsetY: -10 },
          value: { fontSize: '28px', fontWeight: 700, color: '#1e293b', offsetY: 10, formatter: val => `${val}%` }
        }
      }
    },
    colors: [resolutionRate > 70 ? colors.success : colors.warning],
    stroke: { lineCap: "round" },
    labels: ['Resolution Rate']
  };

  // 2. Donut Chart (Status Breakdown)
  const statusLabels = Object.keys(metrics.statusDistribution).filter(k => metrics.statusDistribution[k] > 0);
  const statusSeries = statusLabels.map(k => metrics.statusDistribution[k]);
  
  const statusOptions = {
    chart: { type: 'donut', fontFamily: 'Inter, sans-serif' },
    labels: statusLabels,
    colors: [colors.primary, colors.warning, colors.purple, colors.success, "#1e293b"],
    plotOptions: { pie: { donut: { size: '60%' } } },
    dataLabels: { enabled: false },
    stroke: { width: 0 },
    legend: { position: 'bottom', fontSize: '13px', fontWeight: 600, markers: { radius: 12 } }
  };

  // 3. Bar Chart (Priority Workload)
  const priorityLabels = Object.keys(metrics.priorityDistribution);
  const prioritySeries = [{ name: "Tickets", data: priorityLabels.map(k => metrics.priorityDistribution[k]) }];
  
  const priorityOptions = {
    chart: { type: 'bar', toolbar: { show: false }, fontFamily: 'Inter, sans-serif' },
    plotOptions: { bar: { borderRadius: 6, columnWidth: '40%', distributed: true } },
    colors: [colors.gray, colors.primary, colors.warning, colors.danger],
    dataLabels: { enabled: false },
    xaxis: { categories: priorityLabels, axisBorder: { show: false }, axisTicks: { show: false } },
    yaxis: { labels: { style: { colors: '#64748b' } } },
    grid: { borderColor: '#f1f5f9', strokeDashArray: 4 },
    legend: { show: false }
  };

  // 4. Area Chart (Department Trend - Simulated for ApexCharts)
  const deptLabels = metrics.departmentDistribution.slice(0, 5).map(d => d.departmentName);
  const deptSeries = [{ name: 'Volume', data: metrics.departmentDistribution.slice(0, 5).map(d => d.count) }];

  const deptOptions = {
    chart: { type: 'area', toolbar: { show: false }, fontFamily: 'Inter, sans-serif' },
    colors: [colors.cyan],
    fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0.05, stops: [0, 90, 100] } },
    dataLabels: { enabled: false },
    stroke: { curve: 'smooth', width: 3 },
    xaxis: { categories: deptLabels, axisBorder: { show: false }, axisTicks: { show: false } },
    yaxis: { labels: { style: { colors: '#64748b' } } },
    grid: { borderColor: '#f1f5f9', strokeDashArray: 4 }
  };

  return (
    <div className="crm-fade-in pb-4">
      {/* 🚀 HEADER & NAVIGATION */}
      <div className="d-flex flex-wrap justify-content-between align-items-end mb-4 gap-3">
        <div>
          <h3 className="crm-page-title mb-1 d-flex align-items-center">
            <FiActivity className="me-2 text-primary"/> Support Command Center
          </h3>
          <p className="crm-page-subtitle m-0">Live operational metrics and service level monitoring.</p>
        </div>
        
        {/* 🔥 NAVIGATION BUTTON TO DETAILED REPORT */}
        <button 
          className="btn btn-dark d-flex align-items-center gap-2 fw-bold px-4 py-2"
          style={{ borderRadius: '8px' }}
          onClick={() => {
            setActiveTab("reports");
            setViewMode("list");
          }}
        >
          View Detailed Analytics <FiArrowRight />
        </button>
      </div>

      {/* 📊 ROW 1: PREMIUM STAT CARDS */}
      <div className="row g-3 mb-4">
        {[
          { title: "Total Tickets", val: metrics.totalTickets, icon: <FiLayers/>, col: colors.primary, bg: "#eff6ff" },
          { title: "Resolved", val: resolvedTotal, icon: <FiCheckCircle/>, col: colors.success, bg: "#ecfdf5" },
          { title: "Pending Queue", val: pendingTotal, icon: <FiClock/>, col: colors.warning, bg: "#fffbeb" },
          { title: "SLA Breached", val: metrics.totalEscalated, icon: <FiAlertCircle/>, col: colors.danger, bg: "#fef2f2" }
        ].map((stat, i) => (
          <div key={i} className="col-md-3 col-sm-6">
            <div className="crm-card border-0 p-4 h-100" style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  <p className="text-muted small fw-bold mb-1 text-uppercase letter-spacing-1">{stat.title}</p>
                  <h2 className="m-0 fw-bolder" style={{ color: "#1e293b", fontSize: '2rem' }}>{stat.val}</h2>
                </div>
                <div className="p-3 rounded-3" style={{ backgroundColor: stat.bg, color: stat.col, fontSize: '22px' }}>
                  {stat.icon}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 📈 ROW 2: DETAILED GRAPHS */}
      <div className="row g-4 mb-4">
        
        {/* Department Volume (Area Chart) */}
        <div className="col-lg-8">
          <div className="crm-card border-0 h-100" style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
            <h5 className="fw-bold mb-4" style={{color: "#1e293b"}}>Ticket Volume by Department</h5>
            <div style={{ minHeight: "300px" }}>
              {deptSeries[0].data.length > 0 ? (
                <Chart options={deptOptions} series={deptSeries} type="area" height="300" />
              ) : <p className="text-muted text-center mt-5">No Data Available</p>}
            </div>
          </div>
        </div>

        {/* Overall System Health (Radial Bar) */}
        <div className="col-lg-4">
          <div className="crm-card border-0 h-100 d-flex flex-column justify-content-between" style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
            <h5 className="fw-bold m-0" style={{color: "#1e293b"}}>System Health</h5>
            <div className="d-flex justify-content-center">
              <Chart options={healthOptions} series={[resolutionRate]} type="radialBar" height="280" />
            </div>
            <div className="bg-light rounded p-3 text-center">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span className="small text-muted fw-bold">SLA Adherence</span>
                <span className="badge bg-success">{slaSuccessRate}%</span>
              </div>
              <div className="progress" style={{height: '6px'}}>
                <div className="progress-bar bg-success" style={{width: `${slaSuccessRate}%`}}></div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* 🎯 ROW 3: DONUT & BAR CHARTS */}
      <div className="row g-4">
        
        {/* Priority Workload (Bar Chart) */}
        <div className="col-lg-7">
          <div className="crm-card border-0 h-100" style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
            <h5 className="fw-bold mb-4" style={{color: "#1e293b"}}>Workload Priority</h5>
            <Chart options={priorityOptions} series={prioritySeries} type="bar" height="280" />
          </div>
        </div>

        {/* Status Breakdown (Donut Chart) */}
        <div className="col-lg-5">
          <div className="crm-card border-0 h-100" style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
            <h5 className="fw-bold mb-4" style={{color: "#1e293b"}}>Status Breakdown</h5>
            <div className="d-flex justify-content-center">
              {statusSeries.length > 0 ? (
                <Chart options={statusOptions} series={statusSeries} type="donut" height="280" />
              ) : <p className="text-muted mt-5">No Tickets Logged</p>}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};

export default TicketDashboard;