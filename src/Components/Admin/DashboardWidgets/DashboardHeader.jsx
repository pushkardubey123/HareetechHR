import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FiUsers, FiBriefcase, FiArrowRight } from "react-icons/fi";
import { FaUserClock, FaDoorOpen } from "react-icons/fa";

const DashboardHeader = ({ stats }) => {
  const navigate = useNavigate();

  const kpis = [
    { label: "Total Workforce", value: stats?.totalEmployees || 0, icon: <FiUsers />, color: "#3b82f6", route: "/admin/employee-management" },
    { label: "Present Today", value: stats?.todayAttendance || 0, icon: <FaUserClock />, color: "#10b981", route: "/admin/employee-attendence-lists" },
    { label: "Active Projects", value: stats?.totalProjects || 0, icon: <FiBriefcase />, color: "#0ea5e9", route: "/admin/project-management" },
    { label: "Exit Requests", value: stats?.exitRequests || 0, icon: <FaDoorOpen />, color: "#ef4444", route: "/admin/employee-exit-lists" },
  ];

  return (
    <div className="row g-3 mb-4">
      {kpis.map((k, i) => (
        <div key={i} className="col-xl-3 col-lg-6 col-md-6">
          <motion.div 
            whileHover={{ y: -6, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate(k.route)}
            className="hq-glass-surface p-4 d-flex align-items-center position-relative"
            style={{ cursor: "pointer", borderTop: `3px solid ${k.color}` }}
          >
            <div 
              className="d-flex align-items-center justify-content-center rounded-3 me-3"
              style={{ width: "54px", height: "54px", backgroundColor: `color-mix(in srgb, ${k.color} var(--hq-icon-bg-opacity), transparent)`, color: k.color, fontSize: "24px" }}
            >
              {k.icon}
            </div>
            <div className="flex-grow-1">
              <h3 className="m-0 fw-bold" style={{ fontSize: "24px", color: "var(--hq-text-main)" }}>{k.value}</h3>
              <p className="m-0 mt-1 fw-semibold text-uppercase" style={{ fontSize: "11px", color: "var(--hq-text-muted)", letterSpacing: "0.5px" }}>{k.label}</p>
            </div>
            <div className="position-absolute" style={{ right: "20px", opacity: 0.3 }}>
              <FiArrowRight size={20} color="var(--hq-text-main)" />
            </div>
          </motion.div>
        </div>
      ))}
    </div>
  );
};

export default DashboardHeader;