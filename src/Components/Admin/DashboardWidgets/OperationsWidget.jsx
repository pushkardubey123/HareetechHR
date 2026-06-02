import React, { useState, useEffect } from "react";
import Chart from "react-apexcharts";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { FaTicketAlt, FaProjectDiagram, FaServer } from "react-icons/fa";
import { FiArrowRight, FiCheckCircle, FiAlertTriangle, FiActivity, FiClock, FiTrendingUp } from "react-icons/fi";
import moment from "moment";

import "./OperationsWidget.css";

const OperationsWidget = ({ tickets, projects, assets }) => {
  const navigate = useNavigate();
  const currentTheme = document.body.getAttribute("data-theme") || "dark";
  const [trendData, setTrendData] = useState([0, 0, 0, 0, 0, 0, 0]);

  // --- HELPDESK DATA ---
  const tTotal = tickets?.totalTickets || 0;
  const tOpen = (tickets?.statusDistribution?.['Open'] || 0) + (tickets?.statusDistribution?.['In-Progress'] || 0);
  const tResolved = (tickets?.statusDistribution?.['Resolved'] || 0) + (tickets?.statusDistribution?.['Closed'] || 0);
  const tEscalated = tickets?.totalEscalated || 0;
  const resolutionRate = tTotal > 0 ? Math.round((tResolved / tTotal) * 100) : 0;
  const slaHealth = tEscalated > 0 ? "critical" : "healthy";

  // --- DYNAMIC GRAPH FETCHING ---
  // Fetching real 7-day trend data from database
  useEffect(() => {
    const fetchTicketTrend = async () => {
      try {
        const token = JSON.parse(localStorage.getItem("user"))?.token;
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/tickets/manage`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const allTickets = res.data.data || [];
        // Group tickets by last 7 days
        const last7Days = Array(7).fill(0);
        for (let i = 6; i >= 0; i--) {
          const dateStr = moment().subtract(i, 'days').format('YYYY-MM-DD');
          last7Days[6 - i] = allTickets.filter(t => moment(t.createdAt).format('YYYY-MM-DD') === dateStr).length;
        }
        setTrendData(last7Days);
      } catch (err) {
        console.error("Failed to fetch trend data", err);
      }
    };
    fetchTicketTrend();
  }, []);

  const sparklineCategories = Array(7).fill('').map((_, i) => moment().subtract(6 - i, 'days').format('ddd'));

  // --- PROJECT DATA ---
  const activeProjects = (projects || [])
    .filter(p => p.status !== "completed")
    .slice(0, 4)
    .map(p => {
      const totalTasks = p.tasks?.length || 0;
      const completedTasks = p.tasks?.filter(t => t.status === "completed").length || 0;
      const progress = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);
      let daysLeft = p.endDate ? moment(p.endDate).diff(moment(), 'days') : null;
      return { ...p, progress, daysLeft };
    });

  // --- ASSET DATA ---
  const assignedAssets = (assets || []).filter(a => a.status === "Assigned").length;
  const totalAssets = (assets || []).length || (assignedAssets > 0 ? assignedAssets + 15 : 0); 
  const assetUtil = totalAssets > 0 ? Math.round((assignedAssets / totalAssets) * 100) : 0;

  // --- ANIMATION VARIANTS (Precision Snappy) ---
  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: "tween", ease: "easeOut", duration: 0.4 } }
  };

  // Precision SVG Radial Ring
  const PrecisionRadial = ({ progress }) => {
    const radius = 22;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (progress / 100) * circumference;
    const color = progress === 100 ? "#10b981" : "var(--ow-text-main)";

    return (
      <div className="ow-radial-wrap">
        <svg width="60" height="60" viewBox="0 0 60 60">
          <circle cx="30" cy="30" r={radius} fill="none" stroke="var(--ow-border)" strokeWidth="3" />
          <motion.circle 
            cx="30" cy="30" r={radius} fill="none" stroke={color} strokeWidth="3" strokeLinecap="square"
            strokeDasharray={circumference} initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }} transition={{ duration: 1.5, ease: "easeOut" }}
            style={{ transform: "rotate(-90deg)", transformOrigin: "50% 50%" }}
          />
        </svg>
        <span className="ow-radial-text">{progress}%</span>
      </div>
    );
  };

  return (
    <motion.div className="ow-precision-wrapper row g-4 mb-4" variants={containerVariants} initial="hidden" animate="show">
      
      {/* ================= LEFT: HELPDESK & INFRASTRUCTURE ================= */}
      <div className="col-xl-5 col-lg-12">
        <div className="ow-card d-flex flex-column h-100">
          
          <motion.div variants={itemVariants} className="ow-card-header mb-4">
            <h6 className="ow-card-title d-flex align-items-center">
              <FaTicketAlt className="me-2 text-accent" /> Helpdesk Intelligence
            </h6>
            <button className="ow-btn-text" onClick={() => navigate("/admin/helpdesk")}>CONSOLE <FiArrowRight/></button>
          </motion.div>

          <motion.div variants={itemVariants} className={`ow-sla-banner ${slaHealth} mb-3`}>
            <div className="d-flex align-items-center gap-2">
              {slaHealth === 'critical' ? <FiAlertTriangle size={16} /> : <FiCheckCircle size={16} />}
              <span className="fw-bold">{slaHealth === 'critical' ? 'SLA BREACH DETECTED' : 'SYSTEMS OPERATIONAL'}</span>
            </div>
            <span className="ow-mono-num">{tEscalated}</span>
          </motion.div>

          <motion.div variants={itemVariants} className="row g-2 mb-3">
            <div className="col-6"><div className="ow-stat-box"><span className="lbl">Open Issues</span><span className="val">{tOpen}</span></div></div>
            <div className="col-6"><div className="ow-stat-box"><span className="lbl">Resolved</span><span className="val text-success">{tResolved}</span></div></div>
            <div className="col-6"><div className="ow-stat-box"><span className="lbl">Resolution Rate</span><span className="val">{resolutionRate}%</span></div></div>
            <div className="col-6"><div className="ow-stat-box"><span className="lbl">Escalated</span><span className="val text-danger">{tEscalated}</span></div></div>
          </motion.div>

          {/* DYNAMIC CHARTS (Data from DB) */}
          <motion.div variants={itemVariants} className="row g-2 mb-4 align-items-center ow-chart-area p-2">
            <div className="col-6 position-relative d-flex justify-content-center">
              <Chart 
                options={{
                  chart: { type: 'donut', background: 'transparent' },
                  labels: ['Open', 'In-Progress', 'Resolved', 'Closed'],
                  colors: ['#3b82f6', '#f59e0b', '#10b981', '#64748b'],
                  stroke: { show: false }, dataLabels: { enabled: false },
                  plotOptions: { pie: { donut: { size: '85%' } } }, legend: { show: false },
                  tooltip: { theme: currentTheme === 'dark' ? 'dark' : 'light' }
                }} 
                series={[
                  tickets?.statusDistribution?.['Open'] || 0,
                  tickets?.statusDistribution?.['In-Progress'] || 0,
                  tickets?.statusDistribution?.['Resolved'] || 0,
                  tickets?.statusDistribution?.['Closed'] || 0
                ]} 
                type="donut" height={120}
              />
              <div className="position-absolute text-center" style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)', pointerEvents:'none' }}>
                <span className="ow-mono-num d-block fs-5">{tTotal}</span>
              </div>
            </div>
            <div className="col-6">
              <small className="ow-micro-lbl d-block mb-1"><FiTrendingUp className="me-1"/> VOL TREND (7D)</small>
              <Chart 
                options={{
                  chart: { type: 'area', sparkline: { enabled: true } },
                  stroke: { curve: 'straight', width: 2 },
                  fill: { type: 'gradient', gradient: { opacityFrom: 0.2, opacityTo: 0 } },
                  colors: ['var(--ow-text-main)'],
                  xaxis: { categories: sparklineCategories },
                  tooltip: { theme: currentTheme === 'dark' ? 'dark' : 'light', fixed: { enabled: false }, x: { show: true }, marker: { show: false } }
                }}
                series={[{ name: "Tickets", data: trendData }]}
                type="area" height={60}
              />
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="mt-auto ow-action-banner" onClick={() => navigate("/admin/asset-management")}>
            <div className="d-flex align-items-center w-100">
              <div className="ow-icon-square me-3"><FaServer size={18} /></div>
              <div className="flex-grow-1">
                <div className="d-flex justify-content-between align-items-end mb-1">
                  <span className="ow-action-title">IT Infrastructure</span>
                  <span className="ow-mono-num">{assetUtil}%</span>
                </div>
                <div className="ow-progress-track">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${assetUtil}%` }} transition={{ duration: 1 }} className="ow-progress-fill" />
                </div>
              </div>
            </div>
          </motion.div>

        </div>
      </div>

      {/* ================= RIGHT COLUMN: PROJECT PIPELINE ================= */}
      <div className="col-xl-7 col-lg-12">
        <div className="ow-card d-flex flex-column h-100">
          
          <motion.div variants={itemVariants} className="ow-card-header mb-4">
            <h6 className="ow-card-title d-flex justify-content-center"><FaProjectDiagram className="me-2 text-accent" /> Project Execution</h6>
            <button className="ow-btn-text" onClick={() => navigate("/admin/project-management")}>PIPELINE <FiArrowRight/></button>
          </motion.div>

          <div className="d-flex flex-column gap-2 mt-2 flex-grow-1">
            <AnimatePresence>
              {activeProjects.length > 0 ? activeProjects.map((proj, idx) => (
                <motion.div key={proj._id || idx} variants={itemVariants} whileHover={{ x: 4 }} className="ow-project-row">
                  
                  <PrecisionRadial progress={proj.progress} />
                  
                  <div className="flex-grow-1 ms-3">
                    <div className="d-flex justify-content-between align-items-start">
                      <div className="overflow-hidden">
                        <h6 className="ow-project-name text-truncate">{proj.name}</h6>
                        <div className="d-flex align-items-center gap-2 mt-1">
                          <span className={`ow-status-chip ${proj.status}`}>{proj.status.replace('-', ' ')}</span>
                          {proj.daysLeft !== null && (
                            <span className={`ow-micro-lbl d-flex align-items-center gap-1 ${typeof proj.daysLeft === 'number' && proj.daysLeft < 3 ? 'text-danger' : 'text-muted'}`}>
                              <FiClock size={10} /> {typeof proj.daysLeft === 'number' ? `${proj.daysLeft}D LEFT` : proj.daysLeft}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="text-end">
                        <div className="ow-avatar-stack mb-1 justify-content-end">
                          {(proj.assignedEmployees || []).slice(0, 3).map((emp, i) => (
                            <div key={i} className="ow-avatar-mini" title={emp.name}>{emp.name?.charAt(0)}</div>
                          ))}
                          {(proj.assignedEmployees?.length > 3) && (
                            <div className="ow-avatar-mini more">+{proj.assignedEmployees.length - 3}</div>
                          )}
                        </div>
                        <span className="ow-micro-lbl">{proj.tasks?.filter(t => t.status === 'completed').length || 0}/{proj.tasks?.length || 0} TASKS</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )) : (
                <motion.div variants={itemVariants} className="ow-empty-state h-100">
                  <FiCheckCircle size={24} className="mb-2" />
                  <div>0_ACTIVE_DEPLOYMENTS</div>
                  <small className="opacity-50">Pipeline is empty.</small>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
        </div>
      </div>

    </motion.div>
  );
};

export default OperationsWidget;