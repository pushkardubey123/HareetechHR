import React, { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaSignOutAlt, FaCog, FaBars, FaMoon, FaSun } from "react-icons/fa";
import { MdOutlineEmail } from "react-icons/md";
import { Dropdown } from "react-bootstrap";
import Swal from "sweetalert2";
import NotificationBell from "./NotificationBell";
import { SettingsContext } from "../Redux/SettingsContext"; // Path check karlein
import "./AdminNavbar.css";

const API = import.meta.env.VITE_API_URL;

const AdminNavbar = ({ toggleSidebar }) => {
  const navigate = useNavigate();
  
  // 🔹 Sab kuch Context se le rahe hain
  const { user, settings, logout } = useContext(SettingsContext);
  const [isDarkMode, setIsDarkMode] = useState(localStorage.getItem("theme") === "dark");

  // Helper function for Image URL
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
        logout(); // Context wala logout call hoga
        navigate("/");
      }
    });
  };

  return (
    <nav className="navbar navbar-dark sticky-top premium-nav-dark px-2 px-md-4">
      <div className="container-fluid d-flex align-items-center justify-content-between p-0">
        
        {/* --- LEFT SECTION --- */}
        <div className="d-flex align-items-center gap-2 gap-md-3">
          <div className="nav-toggle-icon" onClick={toggleSidebar}>
            <FaBars size={18} />
          </div>

          <div className="nav-brand-box" onClick={() => navigate("/admin/dashboard")}>
            {settings?.logo ? (
              <img src={getImageUrl(settings.logo)} alt="logo" className="nav-logo" />
            ) : (
              <h4 className="m-0 fw-bold brand-text">
                HR<span className="text-primary">PRO</span>
              </h4>
            )}
          </div>
        </div>

        {/* --- RIGHT SECTION --- */}
        <div className="d-flex align-items-center gap-2 gap-md-3">
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

          {/* --- PROFILE DROPDOWN --- */}
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