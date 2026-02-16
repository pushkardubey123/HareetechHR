import React, { useContext, useState, useEffect } from "react";
import { FaUserCircle, FaBriefcase, FaChevronRight } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { SettingsContext } from "../Redux/SettingsContext";
import "bootstrap/dist/css/bootstrap.min.css"; // Ensure Bootstrap is imported
import "./HomeNavbar.css";

const HomeNavbar = () => {
  const navigate = useNavigate();
  const { settings } = useContext(SettingsContext);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToLogin = () => {
    const section = document.getElementById("login-section");
    if (section) {
      section.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
<nav className={`navbar fixed-top navbar-expand-lg transition-all ${scrolled ? "navbar-scrolled" : "navbar-transparent"}`}>
      <div className="container-fluid px-lg-5 px-3 flex-nowrap"> 
        
        {/* --- Logo Section --- */}
        <div className="navbar-brand d-flex align-items-center gap-2" onClick={() => navigate("/")} style={{ cursor: "pointer" }}>
          <div className="logo-text">
              <span className="logo-icon-box">
                <span className="logo-dot"></span>
              </span>
              <span className="logo-font">Audit365<span className="text-primary-highlight">HR</span></span>
            </div>
        </div>

        {/* --- Actions Section --- */}
        {/* Changed gap-3 to 'gap-2 gap-sm-3' for tighter spacing on mobile */}
        <div className="d-flex align-items-center gap-2 gap-sm-3 ms-auto">
          
          {/* Career Button (Hidden on mobile) */}
          <button className="btn-custom btn-ghost d-none d-sm-flex" onClick={() => navigate("/jobs")}>
            <FaBriefcase className="me-2" /> Career
          </button>

          {/* Login Button */}
          <button className="btn-custom btn-glow" onClick={scrollToLogin}>
            <span>Login Portal</span>
            <FaChevronRight className="ms-2 icon-move" />
          </button>
        </div>
      </div>
    </nav>
  );
};

export default HomeNavbar;