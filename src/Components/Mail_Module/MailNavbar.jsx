import React, { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaSignOutAlt, FaBars, FaMoon, FaSun, FaArrowLeft } from "react-icons/fa";
import { Dropdown } from "react-bootstrap";
import Swal from "sweetalert2";
import NotificationBell from "../Employee/NotificationBell"; // Path check karlein
import { SettingsContext } from "../Redux/SettingsContext";
import "../Admin/AdminNavbar.css"; // Same CSS use kar rahe hain consistent look ke liye

const API = import.meta.env.VITE_API_URL;

const MailNavbar = ({ toggleSidebar }) => {
  const navigate = useNavigate();
  const { user, settings, logout } = useContext(SettingsContext);
  const [isDarkMode, setIsDarkMode] = useState(localStorage.getItem("theme") === "dark");

  // Helper: Image URL handle karne ke liye
  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith("http") || imagePath.startsWith("blob:")) return imagePath;
    const cleanPath = imagePath.startsWith("/") ? imagePath : `/${imagePath}`;
    return `${API}/static${cleanPath}?t=${Date.now()}`;
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
      confirmButtonText: "Logout",
      confirmButtonColor: "#3b82f6",
    }).then((res) => {
      if (res.isConfirmed) {
        logout();
        navigate("/");
      }
    });
  };

  return (
    <nav className="navbar navbar-dark sticky-top premium-nav-dark px-2 px-md-4">
      <div className="container-fluid d-flex align-items-center justify-content-between p-0">
        
        {/* --- LEFT: Hamburger & Back button --- */}
        <div className="d-flex align-items-center gap-2 gap-md-3">
          <div className="nav-toggle-icon" onClick={toggleSidebar}>
            <FaBars size={18} />
          </div>

          <button 
            className="btn btn-link text-white p-0 d-flex align-items-center gap-2 text-decoration-none"
            onClick={() => navigate(-1)} 
            title="Back"
          >
            <FaArrowLeft size={16} />
            <span className="d-none d-sm-inline fw-semibold">Mail Center</span>
          </button>
        </div>

        {/* --- RIGHT: Actions & Profile --- */}
        <div className="d-flex align-items-center gap-2 gap-md-3">
          
          <div className="d-flex align-items-center gap-1 gap-md-2">
            <button className="theme-toggle-btn" onClick={toggleTheme}>
              {isDarkMode ? <FaSun size={16} className="text-warning" /> : <FaMoon size={16} />}
            </button>

            <div className="notification-wrapper">
              <NotificationBell />
            </div>
          </div>

          <div className="nav-sep d-none d-sm-block"></div>

          {/* --- PROFILE DROPDOWN --- */}
          <Dropdown align="end">
            <Dropdown.Toggle as="div" className="nav-profile-box" style={{ cursor: "pointer" }}>
              <div className="text-end d-none d-lg-block">
                <p className="p-name text-truncate" style={{ maxWidth: 120 }}>
                  {user?.name || "User"}
                </p>
                <p className="p-role">{user?.role || "Member"}</p>
              </div>

              <img
                src={
                  user?.profilePic
                    ? getImageUrl(user.profilePic)
                    : `https://ui-avatars.com/api/?name=${user?.name || 'User'}&background=3b82f6&color=fff`
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
                <p className="p-name text-dark mb-0">{user?.name || "User"}</p>
                <small className="text-muted">{user?.role || "Member"}</small>
              </div>

              <Dropdown.Item onClick={() => navigate(user?.role === 'admin' ? "/admin/dashboard" : "/employee/dashboard")}>
                Dashboard
              </Dropdown.Item>

              <Dropdown.Divider />

              <Dropdown.Item onClick={handleLogoutClick} className="text-danger">
                <FaSignOutAlt className="me-2" /> Logout
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </div>
      </div>
    </nav>
  );
};

export default MailNavbar;