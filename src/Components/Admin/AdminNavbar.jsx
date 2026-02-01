import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaSignOutAlt, FaCog, FaBars, FaMoon, FaSun } from "react-icons/fa";
import { MdOutlineEmail } from "react-icons/md";
import { Dropdown } from "react-bootstrap";
import Swal from "sweetalert2";
import NotificationBell from "./NotificationBell";
import { SettingsContext } from "../Redux/SettingsContext";
import './AdminNavbar.css'

const AdminNavbar = ({ toggleSidebar }) => {
  const [user, setUser] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const navigate = useNavigate();
  const { settings } = useContext(SettingsContext);

  useEffect(() => {
    setUser(JSON.parse(localStorage.getItem("user")));
    const savedTheme = localStorage.getItem("theme") === "dark";
    setIsDarkMode(savedTheme);
    document.body.setAttribute("data-theme", savedTheme ? "dark" : "light" );
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    localStorage.setItem("theme", newTheme ? "dark" : "light");
    document.body.setAttribute("data-theme", newTheme ? "dark" : "light");
  };

  const handleLogout = () => {
    Swal.fire({
      title: "Logout?",
      text: "Are you sure?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Logout",
      confirmButtonColor: "#3b82f6",
    }).then((res) => {
      if (res.isConfirmed) {
        localStorage.removeItem("user");
        navigate("/");
      }
    });
  };

  return (
    <nav className="navbar navbar-dark sticky-top premium-nav-dark px-2 px-md-4">
      <div className="container-fluid d-flex align-items-center justify-content-between p-0">
        
        {/* Left: Hamburger & Logo */}
        <div className="d-flex align-items-center gap-2 gap-md-3">
          <div className="nav-toggle-icon" onClick={toggleSidebar}>
            <FaBars size={18} />
          </div>
          
          <div className="nav-brand-box" onClick={() => navigate("/admin/dashboard")}>
            {settings?.logo ? (
              <img src={`${import.meta.env.VITE_API_URL}${settings.logo}`} alt="logo" className="nav-logo" />
            ) : (
              <h4 className="m-0 fw-bold brand-text">HR<span className="text-primary">PRO</span></h4>
            )}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="d-flex align-items-center gap-2 gap-md-3">
          {/* Icons Group */}
          <div className="d-flex align-items-center gap-1 gap-md-2">
            <button className="theme-toggle-btn" onClick={toggleTheme}>
              {isDarkMode ? <FaSun size={16} className="text-warning" /> : <FaMoon size={16} />}
            </button>

            <button className="nav-icon-circle d-none d-sm-flex" onClick={() => navigate("/mail/inbox")}>
              <MdOutlineEmail size={18} />
            </button>
            
            <div className="notification-wrapper">
                <NotificationBell />
            </div>
          </div>

          <div className="nav-sep d-none d-sm-block"></div>

          {/* Profile */}
          <Dropdown align="end">
            <Dropdown.Toggle as="div" className="nav-profile-box">
              <div className="text-end d-none d-lg-block">
                <p className="p-name text-truncate" style={{maxWidth: '120px'}}>{user?.name || "Admin"}</p>
                <p className="p-role">{user?.role || "Manager"}</p>
              </div>
              <img 
                src={user?.profilePic ? `${import.meta.env.VITE_API_URL}/static/${user.profilePic}` : "https://ui-avatars.com/api/?name=Admin&background=3b82f6&color=fff"} 
                alt="user" 
                className="profile-img"
              />
            </Dropdown.Toggle>

            <Dropdown.Menu className="profile-drop-menu shadow border-0">
              <div className="d-lg-none px-3 py-2 border-bottom">
                 <p className="p-name text-dark mb-0">{user?.name || "Admin"}</p>
                 <small className="text-muted">{user?.role || "Manager"}</small>
              </div>
              <Dropdown.Item onClick={() => navigate("/admin/setting")} className="py-2 d-flex align-item-center">
                <FaCog className="me-2 mt-1" /> Settings
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

export default AdminNavbar;