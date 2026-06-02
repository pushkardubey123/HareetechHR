import React, { useEffect, useState, useRef } from "react";
import { FaBell, FaSyncAlt, FaTrash, FaUserClock, FaCalendarAlt, FaLaptop, FaBellSlash, FaCircle } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./AdminNotificationBell.css";
import { IoExit } from "react-icons/io5";

const AdminNotificationBell = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [show, setShow] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);
  const timeoutRef = useRef(null);

  const navigate = useNavigate();
  const token = JSON.parse(localStorage.getItem("user"))?.token;
  
  const axiosInstance = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
  });

  axiosInstance.interceptors.request.use((config) => {
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });

  const fetchAdminAlerts = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get("/api/notifications/admin-alerts");
      const filtered = res.data?.data?.filter((a) => a.count > 0) || [];
      setAlerts(filtered);
      setAcknowledged(false);
    } catch (err) {
      console.error("Admin alert fetch error:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const unreadCount = acknowledged ? 0 : alerts.length;

  const clearAlerts = (e) => {
    e.stopPropagation();
    setAlerts([]);
    setAcknowledged(true);
  };

  const handleMouseEnter = () => {
    clearTimeout(timeoutRef.current);
    setShow(true);
    setAcknowledged(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setShow(false);
    }, 250);
  };

  const getNotificationConfig = (title) => {
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes("employee") || lowerTitle.includes("staff") || lowerTitle.includes("verification")) {
      return { path: "/pending-employee", icon: <FaUserClock size={16} />, themeClass: "noti-primary" };
    }
    if (lowerTitle.includes("leave")) {
      return { path: "/admin/leaves", icon: <FaCalendarAlt size={16} />, themeClass: "noti-warning" };
    }
    if (lowerTitle.includes("asset")) {
      return { path: "/admin/asset-management", icon: <FaLaptop size={16} />, themeClass: "noti-info" };
    }
    if (lowerTitle.includes("exit")) {
      return { path: "/admin/employee-exit-lists", icon: <IoExit size={16} />, themeClass: "noti-info" };
    }
    return { path: "/admin/dashboard", icon: <FaCircle size={16} />, themeClass: "noti-secondary" };
  };

  const handleNotificationClick = (title) => {
    const config = getNotificationConfig(title);
    setShow(false);
    navigate(config.path);
  };

  useEffect(() => {
    fetchAdminAlerts();
    const interval = setInterval(fetchAdminAlerts, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div 
      className="premium-bell-wrapper" 
      onMouseEnter={handleMouseEnter} 
      onMouseLeave={handleMouseLeave}
    >
      {/* HIGHLIGHTED BELL ICON CONTAINER */}
      <div className={`bell-icon-container ${show ? 'active' : ''}`}>
        <FaBell size={22} className={`bell-icon ${unreadCount > 0 ? 'bell-ringing' : ''}`} />
        {unreadCount > 0 && (
          <span className="custom-notification-badge">
            {unreadCount}
          </span>
        )}
      </div>

      {/* HOVER MODAL / DROPDOWN MENU */}
      {show && (
        <div className="premium-hover-menu">
          {/* HEADER */}
          <div className="noti-header">
            <h6 className="noti-title">Admin Alerts</h6>
            <div className="noti-actions">
              <FaSyncAlt title="Refresh" className="action-icon" onClick={(e) => { e.stopPropagation(); fetchAdminAlerts(); }} />
              <FaTrash title="Clear All" className="action-icon trash-icon" onClick={clearAlerts} />
            </div>
          </div>

          {/* BODY */}
          <div className="noti-body custom-scrollbar">
            {loading ? (
              <div className="noti-loading">
                <div className="custom-spinner"></div>
                <span className="loading-text">Syncing alerts...</span>
              </div>
            ) : alerts.length === 0 ? (
              <div className="noti-empty">
                <div className="empty-state-icon">
                  <FaBellSlash size={24} />
                </div>
                <span className="empty-state-title">All caught up!</span>
                <span className="empty-state-sub">No new notifications.</span>
              </div>
            ) : (
              alerts.map((alert, idx) => {
                const config = getNotificationConfig(alert.title);
                return (
                  <div key={idx} className="noti-item" onClick={() => handleNotificationClick(alert.title)}>
                    <div className={`noti-icon-wrapper ${config.themeClass}`}>
                      {config.icon}
                    </div>
                    <div className="noti-content">
                      <h6 className="noti-item-title">{alert.title}</h6>
                      <div className="noti-item-sub">
                        <span className="status-dot"></span>
                        <span>{alert.count} action(s) required</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          
          {/* FOOTER */}
          {alerts.length > 0 && (
            <div className="noti-footer">
              <span>Click anywhere to open details</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminNotificationBell;