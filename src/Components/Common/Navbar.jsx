import React, { useContext, useState, useEffect } from "react";
import { FaUserCircle, FaBriefcase, FaChevronRight } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { SettingsContext } from "../Redux/SettingsContext";
import "bootstrap/dist/css/bootstrap.min.css";
import "./HomeNavbar.css";

const HomeNavbar = () => {
  const navigate = useNavigate();
  const { settings } = useContext(SettingsContext);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Trigger glass effect slightly earlier for a smoother feel
      setScrolled(window.scrollY > 10);
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
    <nav className={`navbar fixed-top transition-all ${scrolled ? "navbar-scrolled" : "navbar-transparent"}`}>
      <div className="container-fluid px-4 px-lg-5 flex-nowrap"> 
        
        {/* --- Logo Section --- */}
        <div className="navbar-brand d-flex align-items-center gap-3" onClick={() => navigate("/")} style={{ cursor: "pointer" }}>
          <div className="logo-text">
            <span className="logo-icon-box">
              <span className="logo-dot"></span>
            </span>
            <span className="logo-font">
              Hareetech<span className="text-primary-highlight">HR</span>
            </span>
          </div>
        </div>

        {/* --- Actions Section --- */}
        <div className="d-flex align-items-center gap-2 gap-sm-4 ms-auto nav-actions">
          
          {/* Career Button (Hidden on very small screens) */}
          <button className="btn-custom btn-ghost d-none d-sm-flex" onClick={() => navigate("/jobs")}>
            <FaBriefcase className="me-2 icon-soft" /> Career
          </button>

          {/* Login Button */}
          <button className="btn-custom btn-glow" onClick={scrollToLogin}>
            <span>Login</span>
            <FaChevronRight className="ms-2 icon-move" />
          </button>

        </div>
      </div>
    </nav>
  );
};

export default HomeNavbar;