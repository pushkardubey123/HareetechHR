import React, { useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaSignOutAlt, FaUserCircle, FaBars, FaMoon, FaSun, FaUserAlt } from "react-icons/fa";
import { MdOutlineEmail } from "react-icons/md";
import { Dropdown } from "react-bootstrap";
import Swal from "sweetalert2";
import NotificationBell from "./NotificationBell";
import { SettingsContext } from "../Redux/SettingsContext";
import '../Admin/AdminNavbar.css'; 

const API = import.meta.env.VITE_API_URL;

const EmployeeNavbar = ({ toggleSidebar }) => {
  const navigate = useNavigate();
  
  // 🔹 Use Context for Live User Data
  const { user, settings, logout } = useContext(SettingsContext);
  
  const [isDarkMode, setIsDarkMode] = useState(localStorage.getItem("theme") === "dark");
  const [imgError, setImgError] = useState(false); // State to track broken images

  // Initialize Theme
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") === "dark";
    setIsDarkMode(savedTheme);
    document.body.setAttribute("data-theme", savedTheme ? "dark" : "light");
  }, []);

  // Helper: Generate clean Image URL
  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith("http") || imagePath.startsWith("blob:")) return imagePath;
    
    // Ensure /static prefix is handled correctly
    const cleanPath = imagePath.startsWith("/") ? imagePath : `/${imagePath}`;
    const finalPath = imagePath.includes("static") ? cleanPath : `/static${cleanPath}`;
    
    return `${API}${finalPath}?t=${Date.now()}`; // Add timestamp to prevent caching
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
        logout(); // Call logout from Context
        navigate("/");
      }
    });
  };

  return (
    <nav className="navbar navbar-dark sticky-top premium-nav-dark px-2 px-md-4">
      <div className="container-fluid d-flex align-items-center justify-content-between p-0">
        
        {/* --- Left: Hamburger & Logo --- */}
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

        {/* --- Right: Actions --- */}
        <div className="d-flex align-items-center gap-2 gap-md-3">
          {/* Icons Group */}
          <div className="d-flex align-items-center gap-1 gap-md-2">
            
            <button className="theme-toggle-btn" onClick={toggleTheme} title="Toggle Theme">
              {isDarkMode ? <FaSun size={16} className="text-warning" /> : <FaMoon size={16} />}
            </button>

            <button className="nav-icon-circle d-none d-sm-flex" onClick={() => navigate("/mail/inbox")} title="Inbox">
              <MdOutlineEmail size={18} />
            </button>
            
            <div className="notification-wrapper">
                <NotificationBell />
            </div>
          </div>

          <div className="nav-sep d-none d-sm-block"></div>

          {/* --- Profile Dropdown --- */}
          <Dropdown align="end">
            <Dropdown.Toggle as="div" className="nav-profile-box" style={{cursor: "pointer"}}>
              <div className="text-end d-none d-lg-block">
                <p className="p-name text-truncate" style={{maxWidth: '120px'}}>
                    {user?.name || "Employee"}
                </p>
                <p className="p-role">{user?.role || "Team Member"}</p>
              </div>

              {/* 🔹 IMAGE LOGIC: Show Image OR Fallback Icon */}
              {!imgError && user?.profilePic ? (
                <img 
                  src={getImageUrl(user.profilePic)} 
                  alt="user" 
                  className="profile-img"
                  onError={() => setImgError(true)} // If load fails, switch to icon
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
              {/* Mobile Only Info Header inside Dropdown */}
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