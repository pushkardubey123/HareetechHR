import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Chart from "react-apexcharts";
import axios from "axios";
import moment from "moment";
import { 
  FiArrowRight, FiDollarSign, FiFileText, FiClock, 
  FiAlertCircle, FiCheckCircle, FiActivity, FiPieChart
} from "react-icons/fi";

import "./PayrollOperationsWidget.css"; 

const PayrollOperationsWidget = () => {
  const navigate = useNavigate();
  const currentTheme = document.body.getAttribute("data-theme") || "dark";

  // --- DYNAMIC STATE FOR DATABASE DATA ---
  const [payrolls, setPayrolls] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- FETCH DATA FROM BACKEND ---
  useEffect(() => {
    const fetchPayrollData = async () => {
      try {
        const token = JSON.parse(localStorage.getItem("user"))?.token;
        const headers = { Authorization: `Bearer ${token}` };
        const baseUrl = import.meta.env.VITE_API_URL;

        const res = await axios.get(`${baseUrl}/api/payrolls`, { headers });
        setPayrolls(res.data.data || []);
      } catch (error) {
        console.error("Error fetching payroll data:", error);
      }
      setLoading(false);
    };
    fetchPayrollData();
  }, []);

  // --- DYNAMIC CALCULATIONS ---
  const currentMonthStr = moment().format("YYYY-MM");
  
  // Total Disbursed (All Time Paid)
  const totalDisbursed = payrolls.filter(p => p.status === 'Paid').reduce((acc, curr) => acc + (curr.netSalary || 0), 0);
  
  // Pending Approvals
  const pendingPayrolls = payrolls.filter(p => p.status === 'Pending');
  const pendingAmount = pendingPayrolls.reduce((acc, curr) => acc + (curr.netSalary || 0), 0);

  // This Month Analytics
  const currentMonthPayrolls = payrolls.filter(p => p.month === currentMonthStr);
  const monthTotal = currentMonthPayrolls.reduce((acc, curr) => acc + (curr.netSalary || 0), 0);
  const monthPaid = currentMonthPayrolls.filter(p => p.status === 'Paid').length;
  const monthPending = currentMonthPayrolls.filter(p => p.status === 'Pending').length;

  // Chart Data Preparation (Last 6 Months Trend)
  const getLast6Months = () => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      months.push(moment().subtract(i, 'months').format("YYYY-MM"));
    }
    return months;
  };

  const trendMonths = getLast6Months();
  const trendData = trendMonths.map(month => {
    return payrolls
      .filter(p => p.month === month && p.status === 'Paid')
      .reduce((acc, curr) => acc + (curr.netSalary || 0), 0);
  });

  const chartLabels = trendMonths.map(m => moment(m, "YYYY-MM").format("MMM 'YY"));

  const formatCurrency = (num) => {
    if (num >= 10000000) return `₹${(num / 10000000).toFixed(2)}Cr`;
    if (num >= 100000) return `₹${(num / 100000).toFixed(2)}L`;
    if (num >= 1000) return `₹${(num / 1000).toFixed(1)}K`;
    return `₹${num.toLocaleString('en-IN')}`;
  };

  // --- FRAMER MOTION VARIANTS ---
  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 250, damping: 20 } }
  };

  return (
    <motion.div className="po-widget-wrapper row g-4 mb-4" variants={containerVariants} initial="hidden" animate="show">
      
      {/* ================= LEFT: FINANCIAL HEALTH & TRENDS ================= */}
      <div className="col-xl-7 col-lg-12">
        <div className="po-premium-surface d-flex flex-column h-100 po-border-indigo">
          
          <motion.div variants={itemVariants} className="po-card-header mb-4">
            <h6 className="po-section-title d-flex justify-content-center align-item-center">
              <FiActivity className="po-icon-indigo me-2" /> Financial Health
            </h6>
            <button className="po-btn-link" onClick={() => navigate("/admin/payroll-report")}>Detailed Report <FiArrowRight/></button>
          </motion.div>

          <div className="row g-3 mb-4">
            <motion.div variants={itemVariants} className="col-sm-4">
              <div className="po-stat-box primary-box">
                <span className="po-stat-lbl">Total Disbursed (All)</span>
                <h3 className="po-stat-val">{formatCurrency(totalDisbursed)}</h3>
              </div>
            </motion.div>
            <motion.div variants={itemVariants} className="col-sm-4">
              <div className="po-stat-box warning-box">
                <span className="po-stat-lbl">Pending Clearance</span>
                <h3 className="po-stat-val text-warning">{formatCurrency(pendingAmount)}</h3>
                <small className="po-stat-sub text-warning">{pendingPayrolls.length} Records</small>
              </div>
            </motion.div>
            <motion.div variants={itemVariants} className="col-sm-4">
              <div className="po-stat-box info-box">
                <span className="po-stat-lbl">This Month ({moment().format("MMM")})</span>
                <h3 className="po-stat-val text-info">{formatCurrency(monthTotal)}</h3>
                <div className="d-flex justify-content-between mt-1">
                  <small className="po-stat-sub text-success">{monthPaid} Paid</small>
                  <small className="po-stat-sub text-danger">{monthPending} Pending</small>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Sleek Spline Area Chart for Payroll Trend */}
          <motion.div variants={itemVariants} className="flex-grow-1 po-chart-container">
            <div className="d-flex align-items-center mb-2">
              <FiPieChart className="text-muted me-2" size={14} />
              <span className="text-muted fw-bold" style={{fontSize: '10px', letterSpacing: '1px'}}>6-MONTH DISBURSEMENT TREND</span>
            </div>
            <Chart 
              options={{
                chart: { type: 'area', toolbar: { show: false }, background: 'transparent', parentHeightOffset: 0 },
                stroke: { curve: 'smooth', width: 3 },
                fill: { type: 'gradient', gradient: { opacityFrom: 0.4, opacityTo: 0 } },
                colors: ['#4f46e5'],
                xaxis: { categories: chartLabels, labels: { style: { colors: 'var(--po-text-muted)' } }, axisBorder: { show: false }, axisTicks: { show: false } },
                yaxis: { labels: { formatter: (val) => formatCurrency(val), style: { colors: 'var(--po-text-muted)' } } },
                grid: { borderColor: "var(--po-border)", strokeDashArray: 3, xaxis: { lines: { show: true } }, yaxis: { lines: { show: false } } },
                dataLabels: { enabled: false },
                tooltip: { theme: currentTheme === 'dark' ? 'dark' : 'light', y: { formatter: (val) => `₹${val.toLocaleString('en-IN')}` } }
              }} 
              series={[{ name: "Disbursed", data: trendData }]} 
              type="area" height={220} width="100%"
            />
          </motion.div>

        </div>
      </div>

      {/* ================= RIGHT: ACTION CENTER & PENDING QUEUE ================= */}
      <div className="col-xl-5 col-lg-12">
        <div className="po-premium-surface d-flex flex-column h-100 po-border-emerald">
          
          <motion.div variants={itemVariants} className="po-card-header mb-4">
            <h6 className="po-section-title d-flex align-items-center"><FiDollarSign className="po-icon-emerald me-2" /> Payroll Desk</h6>
            <div className="d-flex gap-2">
              <button className="po-btn-outline" onClick={() => navigate("/admin/payroll")}>Process</button>
            </div>
          </motion.div>

          {/* High-Priority Action Cards */}
          <motion.div variants={itemVariants} className="row g-3 mb-4">
            <div className="col-6">
              <motion.div whileHover={{ y: -4, borderColor: '#10b981' }} className="po-action-card" onClick={() => navigate("/admin/payroll")}>
                <div className="po-icon-wrap green mb-2"><FiClock size={20} /></div>
                <h6 className="po-action-title">Run Payroll</h6>
                <small className="po-action-sub">Auto-generate monthly salaries</small>
              </motion.div>
            </div>
            <div className="col-6">
              <motion.div whileHover={{ y: -4, borderColor: '#f59e0b' }} className="po-action-card" onClick={() => navigate("/admin/fullandfinal")}>
                <div className="po-icon-wrap warning mb-2"><FiFileText size={20} /></div>
                <h6 className="po-action-title">F&F Settlement</h6>
                <small className="po-action-sub">Manage exiting employees</small>
              </motion.div>
            </div>
          </motion.div>

          {/* Pending Queue List */}
          <motion.div variants={itemVariants} className="flex-grow-1 d-flex flex-column">
            <div className="d-flex justify-content-between align-items-center mb-3 po-list-header">
              <span className="text-muted fw-bold" style={{fontSize: '11px', letterSpacing: '0.5px'}}>PENDING APPROVALS</span>
              <span className="badge bg-danger rounded-pill">{pendingPayrolls.length} Unpaid</span>
            </div>

            <div className="po-stream-list flex-grow-1 overflow-auto" style={{maxHeight: '200px'}}>
              <AnimatePresence>
                {loading ? (
                  <div className="po-empty-state">Syncing ledgers...</div>
                ) : pendingPayrolls.length > 0 ? (
                  pendingPayrolls.slice(0, 5).map((p, i) => (
                    <motion.div 
                      whileHover={{ x: 4, backgroundColor: "var(--po-card-hover)" }}
                      key={p._id || i} className="po-stream-item"
                      onClick={() => navigate("/admin/payroll")}
                    >
                      <div className="d-flex align-items-center gap-3 overflow-hidden">
                        <div className="po-avatar-icon warning"><FiAlertCircle /></div>
                        <div className="po-stream-info">
                          <span className="po-stream-title">{p.employeeId?.name || "Unknown"}</span>
                          <small className="po-stream-sub">Period: {p.month}</small>
                        </div>
                      </div>
                      <div className="text-end">
                        <span className="fw-bold text-warning" style={{fontSize: '13px'}}>₹{p.netSalary?.toLocaleString('en-IN')}</span>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <motion.div initial={{opacity:0}} animate={{opacity:1}} className="po-empty-state">
                    <FiCheckCircle size={32} className="mb-2 text-success opacity-50 m-auto" />
                    <p className="m-0 fw-medium">All clear!</p>
                    <small>No pending payrolls to process.</small>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

        </div>
      </div>

    </motion.div>
  );
};

export default PayrollOperationsWidget;