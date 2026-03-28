import React, { useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaSignOutAlt, FaCog, FaBars, FaMoon, FaSun, FaCrown } from "react-icons/fa"; // Added FaCrown
import { Dropdown } from "react-bootstrap";
import Swal from "sweetalert2";
import NotificationBell from "./NotificationBell";
import { SettingsContext } from "../Redux/SettingsContext"; 
import axios from "axios";
import "./AdminNavbar.css";
import { FiMail } from "react-icons/fi";

const API = import.meta.env.VITE_API_URL;

const AdminNavbar = ({ toggleSidebar }) => {
  const navigate = useNavigate();
  const { user, settings, logout } = useContext(SettingsContext);
  
  const [isDarkMode, setIsDarkMode] = useState(localStorage.getItem("theme") === "dark");
  const [companyModules, setCompanyModules] = useState([]);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") === "dark";
    setIsDarkMode(savedTheme);
    document.body.setAttribute("data-theme", savedTheme ? "dark" : "light");

    const fetchPlanModules = async () => {
      const token = user?.token || localStorage.getItem("token");
      if (!token) return;
      try {
        const subRes = await axios.get(`${API}/user/my-subscription`, { 
          headers: { Authorization: `Bearer ${token}` } 
        });
        if (subRes.data.success && subRes.data.data?.planId) {
          setCompanyModules(subRes.data.data.planId.allowedModules || []);
        }
      } catch (err) {
        console.error("Failed to fetch plan modules for Navbar", err);
      }
    };
    fetchPlanModules();

  }, [user]);

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith("http") || imagePath.startsWith("blob:")) return imagePath;
    const cleanPath = imagePath.startsWith("/") ? imagePath : `/${imagePath}`;
    const finalPath = imagePath.includes("static") ? cleanPath : `/static${cleanPath}`;
    return `${API}${finalPath}?t=${Date.now()}`;
  };

  const toggleTheme = () => {
    const next = !isDarkMode;
    setIsDarkMode(next);
    localStorage.setItem("theme", next ? "dark" : "light");
    document.body.setAttribute("data-theme", next ? "dark" : "light");
  };

  const handleLogoutClick = () => {
    Swal.fire({
      title: "Logout?",
      text: "Are you sure you want to exit?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, Logout",
      confirmButtonColor: "#3b82f6",
    }).then((res) => {
      if (res.isConfirmed) {
        logout(); 
        navigate("/");
      }
    });
  };

  // ✅ CHECK IF MODULES ARE ALLOWED
  const isMailAllowed = companyModules.includes("Mail");
  const isNotificationAllowed = companyModules.includes("Notification");

  return (
    <nav className="navbar navbar-dark sticky-top premium-nav-dark px-2 px-md-4">
      <div className="container-fluid d-flex align-items-center justify-content-between p-0">
        
        <div className="d-flex align-items-center gap-2 gap-md-3">
          <div className="nav-toggle-icon" onClick={toggleSidebar}>
            <FaBars size={18} />
          </div>

          <div className="nav-brand-box" onClick={() => navigate("/admin/dashboard")}>
            {settings?.logo ? (
              <img src={getImageUrl(settings.logo)} alt="logo" className="nav-logo" />
            ) : (
              ""
            )}
          </div>
        </div>

        <div className="d-flex align-items-center gap-2 gap-md-3">
          <div className="d-flex align-items-center gap-2">
            
            <button className="theme-toggle-btn" onClick={toggleTheme} title="Toggle Theme">
              {isDarkMode ? <FaSun size={16} className="text-warning" /> : <FaMoon size={16} />}
            </button>

            {/* 🔹 MAIL ICON 🔹 */}
            {isMailAllowed && (
              <div className="premium-mail-wrapper d-none d-sm-block" onClick={() => navigate("/mail/inbox")} title="Inbox">
                <div className="mail-icon-container">
                  <FiMail size={20} className="mail-icon" />
                </div>
              </div>
            )}
            
            {/* 🔹 NOTIFICATION BELL 🔹 */}
            {isNotificationAllowed && (
              <div className="notification-wrapper">
                  <NotificationBell />
              </div>
            )}
          </div>

          {/* 🔹 PREMIUM UPGRADE BUTTON 🔹 */}
          <button 
            onClick={() => navigate("/subscription")} // Update this route if your subscription page path is different
            className="d-none d-sm-flex align-items-center justify-content-center gap-2"
            style={{
              background: "linear-gradient(135deg, #FFD700 0%, #FDB931 100%)", // Premium Gold Gradient
              color: "#4A3B00", // Dark contrasting text
              border: "1px solid #E5C100",
              borderRadius: "6px", // Rectangular look
              padding: "6px 16px",
              fontSize: "14px",
              fontWeight: "700",
              boxShadow: "0 4px 12px rgba(255, 215, 0, 0.25)",
              cursor: "pointer",
              transition: "all 0.3s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 6px 16px rgba(255, 215, 0, 0.4)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 4px 12px rgba(255, 215, 0, 0.25)";
            }}
          >
            <FaCrown size={14} /> <span>Upgrade</span>
          </button>

          <div className="nav-sep d-none d-sm-block"></div>

          <Dropdown align="end">
            <Dropdown.Toggle as="div" className="nav-profile-box" style={{ cursor: "pointer" }}>
              <div className="text-end d-none d-lg-block">
                <p className="p-name text-truncate" style={{ maxWidth: 120 }}>
                  {user?.name || user?.username || "Admin"}
                </p>
                <p className="p-role">{user?.role || "Administrator"}</p>
              </div>

              <img
                src={
                  user?.profilePic
                    ? getImageUrl(user.profilePic)
                    : `https://ui-avatars.com/api/?name=${user?.name || 'Admin'}&background=3b82f6&color=fff`
                }
                alt="user"
                className="profile-img"
                onError={(e) => {
                  e.target.src = "https://via.placeholder.com/150?text=User";
                }}
              />
            </Dropdown.Toggle>

            <Dropdown.Menu className="profile-drop-menu shadow border-0">
              <div className="d-lg-none px-3 py-2 border-bottom">
                <p className="p-name text-dark mb-0">{user?.name || "Admin"}</p>
                <small className="text-muted">{user?.role || "Administrator"}</small>
              </div>

              <Dropdown.Item onClick={() => navigate("/admin/setting")} className="py-2 d-flex align-item-center">
                <FaCog className="me-2 mt-1" /> Settings
              </Dropdown.Item>

              <Dropdown.Divider />

              <Dropdown.Item onClick={handleLogoutClick} className="text-danger py-2 d-flex align-item-center">
                <FaSignOutAlt className="me-2 mt-1" /> Logout
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </div>
      </div>
    </nav>
  );
};

export default AdminNavbar;