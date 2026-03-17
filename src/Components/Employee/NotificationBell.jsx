import React, { useEffect, useState, useRef } from "react";
import { FaBell, FaTrash, FaBellSlash, FaRegClock, FaInfoCircle, FaArrowRight } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import moment from "moment";
import "./NotificationBell.css"; // Ensure you create this CSS file

const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [show, setShow] = useState(false);
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

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get("/api/notifications");
      setNotifications(res.data?.data || []);
    } catch (err) {
      console.error("Fetch notifications error", err.message);
    } finally {
      setLoading(false);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markUnreadAsRead = async () => {
    const unread = notifications.filter((n) => !n.read);
    if (unread.length === 0) return;

    try {
      await Promise.all(
        unread.map((n) => axiosInstance.put(`/api/notifications/${n._id}/read`))
      );
      // Update local state smoothly
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch {
      console.error("Failed to mark as read");
    }
  };

  const clearAll = async (e) => {
    e.stopPropagation();
    try {
      const res = await axiosInstance.put("/api/notifications/clear-bell", {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) {
        setNotifications([]);
      }
    } catch (error) {
      console.error(error);
      Swal.fire({
        toast: true,
        position: 'top-end',
        icon: 'error',
        title: 'Failed to clear notifications',
        showConfirmButton: false,
        timer: 3000
      });
    }
  };

  // 🔹 Hover Logic: Mouse enter pe open aur mark as read call hoga
  const handleMouseEnter = () => {
    clearTimeout(timeoutRef.current);
    setShow(true);
    if (unreadCount > 0) {
      markUnreadAsRead();
    }
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setShow(false);
    }, 250);
  };

  const handleViewAll = () => {
    setShow(false);
    navigate("/employee/notification");
  };

  useEffect(() => {
    fetchNotifications();
    // Optional: Auto refresh every 1 minute
    const interval = setInterval(fetchNotifications, 60000);
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
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </div>

      {/* HOVER MODAL / DROPDOWN MENU */}
      {show && (
        <div className="premium-hover-menu">
          {/* HEADER */}
          <div className="noti-header">
            <h6 className="noti-title">Notifications</h6>
            <div className="noti-actions">
              <FaTrash 
                title="Clear All" 
                className="action-icon trash-icon" 
                onClick={clearAll} 
              />
            </div>
          </div>

          {/* BODY */}
          <div className="noti-body custom-scrollbar">
            {loading && notifications.length === 0 ? (
              <div className="noti-loading">
                <div className="custom-spinner"></div>
                <span className="loading-text">Loading...</span>
              </div>
            ) : notifications.length === 0 ? (
              <div className="noti-empty">
                <div className="empty-state-icon">
                  <FaBellSlash size={24} />
                </div>
                <span className="empty-state-title">You're all caught up!</span>
                <span className="empty-state-sub">No new notifications.</span>
              </div>
            ) : (
              notifications.slice(0, 5).map((notif) => (
                <div key={notif._id} className={`noti-item ${notif.read ? 'read' : 'unread'}`}>
                  <div className="noti-icon-wrapper noti-primary">
                    <FaInfoCircle size={18} />
                  </div>
                  <div className="noti-content">
                    <h6 className="noti-item-title">{notif.title}</h6>
                    <p className="noti-item-desc">{notif.message}</p>
                    <div className="noti-item-time">
                      <FaRegClock size={11} className="me-1" />
                      {moment(notif.createdAt).fromNow()}
                    </div>
                  </div>
                  {!notif.read && <div className="unread-dot"></div>}
                </div>
              ))
            )}
          </div>
          
          {/* FOOTER */}
          {notifications.length > 0 && (
            <div className="noti-footer" onClick={handleViewAll}>
              <span className="view-all-btn">
                View All Notifications <FaArrowRight size={12} className="ms-1" />
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;