import React, { useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaSignOutAlt, FaUserCircle, FaBars, FaMoon, FaSun, FaUserAlt } from "react-icons/fa";
import { Dropdown } from "react-bootstrap";
import Swal from "sweetalert2";
import NotificationBell from "./NotificationBell";
import { SettingsContext } from "../Redux/SettingsContext";
import axios from "axios";
import '../Admin/AdminNavbar.css'; 
import { FiMail } from "react-icons/fi";

const API = import.meta.env.VITE_API_URL;

const EmployeeNavbar = ({ toggleSidebar }) => {
  const navigate = useNavigate();
  const { user, settings, logout } = useContext(SettingsContext);
  
  const [isDarkMode, setIsDarkMode] = useState(localStorage.getItem("theme") === "dark");
  const [imgError, setImgError] = useState(false);
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
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    localStorage.setItem("theme", newTheme ? "dark" : "light");
    document.body.setAttribute("data-theme", newTheme ? "dark" : "light");
  };

  const handleLogout = () => {
    Swal.fire({
      title: "Logout?",
      text: "Are you sure you want to log out?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Logout",
      confirmButtonColor: "#3b82f6",
      cancelButtonColor: "#d33",
    }).then((res) => {
      if (res.isConfirmed) {
        logout(); 
        navigate("/");
      }
    });
  };

  // ✅ CHECK IF MODULES ARE ALLOWED
  const isMailAllowed = companyModules.includes("Mail");
  const isNotificationAllowed = companyModules.includes("Notification"); // 🔥 NAYA CHECK

  return (
    <nav className="navbar navbar-dark sticky-top premium-nav-dark px-2 px-md-4">
      <div className="container-fluid d-flex align-items-center justify-content-between p-0">
        
        <div className="d-flex align-items-center gap-2 gap-md-3">
          <div className="nav-toggle-icon" onClick={toggleSidebar}>
            <FaBars size={18} />
          </div>
          
          <div className="nav-brand-box" onClick={() => navigate("/employee/dashboard")} style={{cursor: "pointer"}}>
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

          <div className="nav-sep d-none d-sm-block"></div>

          <Dropdown align="end">
            <Dropdown.Toggle as="div" className="nav-profile-box" style={{cursor: "pointer"}}>
              <div className="text-end d-none d-lg-block">
                <p className="p-name text-truncate" style={{maxWidth: '120px'}}>
                    {user?.name || "Employee"}
                </p>
                <p className="p-role">{user?.role || "Team Member"}</p>
              </div>

              {!imgError && user?.profilePic ? (
                <img 
                  src={getImageUrl(user.profilePic)} 
                  alt="user" 
                  className="profile-img"
                  onError={() => setImgError(true)} 
                />
              ) : (
                <div 
                    className="d-flex align-items-center justify-content-center bg-primary text-white" 
                    style={{
                        width: "40px", 
                        height: "40px", 
                        borderRadius: "50%", 
                        fontSize: "18px",
                        boxShadow: "0 2px 5px rgba(0,0,0,0.2)"
                    }}
                >
                  <FaUserAlt />
                </div>
              )}

            </Dropdown.Toggle>

            <Dropdown.Menu className="profile-drop-menu shadow border-0">
              <div className="d-lg-none px-3 py-2 border-bottom">
                 <p className="p-name text-dark mb-0">{user?.name || "Employee"}</p>
                 <small className="text-muted">{user?.role || "Team Member"}</small>
              </div>

              <Dropdown.Item onClick={() => navigate("/employee/profile")} className="text-danger py-2 d-flex align-item-center">
                <FaUserCircle className="me-2 mt-1" /> My Profile
              </Dropdown.Item>
              
              <Dropdown.Divider />
              
              <Dropdown.Item onClick={handleLogout} className="text-danger py-2 d-flex align-item-center">
                <FaSignOutAlt className="me-2 mt-1" /> Logout
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </div>
      </div>
    </nav>
  );
};

export default EmployeeNavbar;