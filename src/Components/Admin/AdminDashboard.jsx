import React, { useEffect, useState } from "react";
import DynamicLayout from "../Common/DynamicLayout";
import axios from "axios";
import { FiRefreshCw, FiZap, FiTerminal } from "react-icons/fi";
import { toast } from "react-toastify";
import Loader from "./Loader/Loader";
import { motion } from "framer-motion";
import moment from "moment";

// Child Widgets
import DashboardHeader from "./DashboardWidgets/DashboardHeader";
import HRMetricsWidget from "./DashboardWidgets/HRMetricsWidget";
import OperationsWidget from "./DashboardWidgets/OperationsWidget";
import PayrollOperationsWidget from "./DashboardWidgets/PayrollOperationsWidget";
import TalentMeetingsWidget from "./DashboardWidgets/TalentMeetingsWidget";

import "./AdminDashboard.css";

// 🔥 ULTRA-PREMIUM AURORA BACKGROUND 🔥
const AuroraBackground = () => (
  <div className="aurora-bg-container">
    <div className="aurora-blob blob-1"></div>
    <div className="aurora-blob blob-2"></div>
    <div className="aurora-blob blob-3"></div>
    <div className="aurora-noise-overlay"></div>
  </div>
);

// 🔥 LIVE PROCESSING CORE (Calculation HUD) 🔥
const LiveProcessingCore = () => {
  const [metrics, setMetrics] = useState({
    load: 42.5,
    ops: 12450,
    latency: 12
  });

  // Simulate real-time data calculations
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics({
        load: (Math.random() * 15 + 35).toFixed(1), // Fluctuates 35% - 50%
        ops: Math.floor(Math.random() * 8000) + 10000, // 10k - 18k operations
        latency: Math.floor(Math.random() * 8) + 8 // 8ms - 16ms
      });
    }, 800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="live-core-wrapper d-none d-md-flex">
      {/* Rotating Tech Rings */}
      <div className="core-ring core-ring-outer"></div>
      <div className="core-ring core-ring-inner"></div>
      
      {/* Live Calculation Data */}
      <div className="core-data-display">
        <div className="core-label">SYS_LOAD</div>
        <div className="core-value-main">{metrics.load}%</div>
        
        <div className="core-divider"></div>
        
        <div className="core-stats-row">
          <div className="core-stat">
            <span className="lbl">OPS/s</span>
            <span className="val">{metrics.ops.toLocaleString()}</span>
          </div>
          <div className="core-stat">
            <span className="lbl">PING</span>
            <span className="val text-success">{metrics.latency}ms</span>
          </div>
        </div>

        {/* Live Audio-style visualizer */}
        <div className="core-visualizer">
          <span className="bar b1"></span>
          <span className="bar b2"></span>
          <span className="bar b3"></span>
          <span className="bar b4"></span>
          <span className="bar b5"></span>
        </div>
      </div>
    </div>
  );
};

const AdminDashboard = () => {
  const [loading, setLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(moment().format("HH:mm:ss [IST]"));
  const [dashboardData, setDashboardData] = useState({
    stats: null, tickets: null, projects: [], leaves: [], wfh: [], assets: [], events: [],
    jobs: [], applications: [], interviews: [] 
  });

  const token = JSON.parse(localStorage.getItem("user"))?.token;
  const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    headers: { Authorization: `Bearer ${token}` },
  });

  // Live Clock Update
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(moment().format("HH:mm:ss A")), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => { fetchAllModulesData(); }, []);

  const fetchAllModulesData = async () => {
    setLoading(true);
    try {
      const [dashRes, ticketRes, projRes, leaveRes, wfhRes, assetRes, eventRes, jobRes, appRes, interviewRes] = await Promise.allSettled([
        api.get("/api/reports/dashboard"), api.get("/api/tickets/dashboard/metrics"),
        api.get("/api/projects"), api.get("/api/leaves"), api.get("/api/wfh/all"),
        api.get("/api/assets/assignments"), api.get("/api/events"),
        api.get("/api/jobs"), api.get("/api/applications"), api.get("/api/interviews") 
      ]);

      setDashboardData({
        stats: dashRes.status === "fulfilled" ? dashRes.value.data.data : null,
        tickets: ticketRes.status === "fulfilled" ? ticketRes.value.data.data : null,
        projects: projRes.status === "fulfilled" ? projRes.value.data.data : [],
        leaves: leaveRes.status === "fulfilled" ? leaveRes.value.data.data : [],
        wfh: wfhRes.status === "fulfilled" ? wfhRes.value.data.data : [],
        assets: assetRes.status === "fulfilled" ? assetRes.value.data.data : [],
        events: eventRes.status === "fulfilled" ? eventRes.value.data.data : [],
        jobs: jobRes.status === "fulfilled" ? jobRes.value.data.data : [],
        applications: appRes.status === "fulfilled" ? appRes.value.data.data : [],
        interviews: interviewRes.status === "fulfilled" ? interviewRes.value.data.interviews : []
      });
    } catch (err) { toast.error("Matrix Sync Failed"); }
    setLoading(false);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.15, delayChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 40, scale: 0.98 },
    show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 200, damping: 20 } }
  };

  return (
    <DynamicLayout>
      <div className="iso-dashboard-container">
        
        {/* Background Animation Engine */}
        <AuroraBackground />

        {/* Main Glassmorphism Wrapper */}
        <div className="hq-global-glass-wrapper">
          
          {/* HEADER SECTION */}
          <div className="hq-premium-header mb-5 position-relative d-flex justify-content-between align-items-center">
            
            <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, ease: "easeOut" }} className="d-flex flex-column align-items-start">
              <div className="d-flex align-items-center gap-3 mb-2">
                <span className="hq-live-badge"><span className="dot"></span> LIVE SYSTEM</span>
                {/* 🔥 LIVE CLOCK ADDED HERE 🔥 */}
                <span className="hq-mono-time"><FiTerminal className="me-1"/> {currentTime}</span>
              </div>
              <h2 className="hq-gradient-title">Master Command Center</h2>
              <p className="hq-page-subtitle mb-3">Enterprise Resource & Operations Matrix</p>
              
              {/* 🔥 BUTTON MOVED JUST BELOW THE SUBTITLE 🔥 */}
              <motion.button 
                whileHover={{ scale: 1.05 }} 
                whileTap={{ scale: 0.95 }}
                className="hq-btn-cyber" 
                onClick={fetchAllModulesData} 
                disabled={loading}
              >
                <div className="btn-bg-glow"></div>
                <span className="btn-content">
                  {loading ? <FiRefreshCw className="spin me-2" /> : <FiZap className="me-2 text-warning" />}
                  {loading ? "Synchronizing..." : "Initialize Sync"}
                </span>
              </motion.button>
            </motion.div>

            {/* 🔥 CALCULATION BASED HUD INSTEAD OF QUANTUM CORE 🔥 */}
            <LiveProcessingCore />

          </div>

          {/* WIDGETS RENDER ZONE */}
          <motion.div variants={containerVariants} initial="hidden" animate="show">
            <motion.div variants={itemVariants} className="mb-4"><DashboardHeader stats={dashboardData.stats} /></motion.div>
            <motion.div variants={itemVariants} className="mb-4"><HRMetricsWidget stats={dashboardData.stats} leaves={dashboardData.leaves} wfh={dashboardData.wfh} events={dashboardData.events} /></motion.div>
            <motion.div variants={itemVariants} className="mb-4"><OperationsWidget tickets={dashboardData.tickets} projects={dashboardData.projects} assets={dashboardData.assets} /></motion.div>
            <motion.div variants={itemVariants} className="mb-4"><PayrollOperationsWidget /></motion.div>
            <motion.div variants={itemVariants} className="mb-4"><TalentMeetingsWidget /></motion.div>
          </motion.div>

        </div>
        {loading && <Loader />}
      </div>
    </DynamicLayout>
  );
};

export default AdminDashboard;