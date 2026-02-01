import React from "react";
import { useNavigate } from "react-router-dom";
import {
  FiCheckCircle, FiActivity, FiShield, FiArrowRight
} from "react-icons/fi";
import { BiFingerprint } from "react-icons/bi";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import "./Banner.css";

const Banner = () => {
  const navigate = useNavigate();

  // --- 3D Tilt Logic for Dashboard ---
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const mouseX = useSpring(x, { stiffness: 150, damping: 15 });
  const mouseY = useSpring(y, { stiffness: 150, damping: 15 });

  const rotateX = useTransform(mouseY, [-0.5, 0.5], ["8deg", "-8deg"]);
  const rotateY = useTransform(mouseX, [-0.5, 0.5], ["-8deg", "8deg"]);

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseXVal = e.clientX - rect.left;
    const mouseYVal = e.clientY - rect.top;
    x.set(mouseXVal / width - 0.5);
    y.set(mouseYVal / height - 0.5);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  const scrollToLogin = () => {
    const section = document.getElementById("login-section");
    if (section) section.scrollIntoView({ behavior: "smooth" });
  };

  // Features List for Marquee
  const features = [
    "100% Accurate Biometric Attendance",
    "One-Click Automated Payroll",
    "Real-time Workforce Analytics",
    "Geo-Fencing & Remote Tracking",
    "Bank-Grade Data Security",
    "Smart Shift Rostering"
  ];

  return (
    <div className="petpooja-wrapper">

      {/* Dynamic Background */}
      <div className="bg-circle bg-circle-1"></div>
      <div className="bg-circle bg-circle-2"></div>
      <div className="grid-lines"></div>

      <div className="content-container">
        <div className="content-grid">

          {/* --- LEFT: Hero Text --- */}
          <div className="hero-text-section">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="badge-wrapper"
            >
              <span className="badge-dot"></span> Version 2.0 Live
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="hero-title"
            >
              Automate your <br />
              <span className="highlight">HR Operations</span> <br />
              with Precision.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="hero-desc"
            >
              From Biometric Attendance to Payroll generation in seconds.
              Join 500+ companies streamlining their workforce with Audit365-HR.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="hero-actions"
            >
              <button className="btn-primary" onClick={scrollToLogin}>
                Get Started <FiArrowRight />
              </button>
            </motion.div>

            <div className="trust-badges">
              <div className="trust-item"><FiShield className="t-icon" /> ISO 27001 Certified</div>
              <div className="trust-item"><FiCheckCircle className="t-icon" /> 99.9% Uptime</div>
            </div>
          </div>

          {/* --- RIGHT: 3D Animation Stage --- */}
          <div className="hero-visual-section">
            <div className="animation-stage">

              {/* 1. 3D Dashboard Platform */}
              <motion.div
                className="dashboard-3d-container"
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
              >
                {/* The Main Screen */}
                <div className="dash-glass-panel">
                  {/* Replace with your actual image path */}
                  <img
                    src="/images/Dashboard.png" 
                    alt="Dashboard Interface"
                    className="dash-main-img"
                  />
                  {/* Scanning Line Effect */}
                  <div className="scan-line-overlay"></div>
                </div>

                {/* Floating User Card */}
                <div className="float-card user-card">
                  <div className="u-avatar-large">
                    <img src="https://img.freepik.com/free-photo/close-up-smiley-woman-working-laptop_23-2149300651.jpg" alt="User" />
                  </div>
                  <div className="active-dot-overlay"></div>
                </div>

                {/* Stats Card */}
                <div className="float-card stats-card">
                  <span className="s-label">Today's Attendance</span>
                  <div className="s-row">
                    <span className="s-val">98.5%</span>
                    <FiActivity className="s-icon-up"/>
                  </div>
                </div>
              </motion.div>

              {/* 2. Biometric System (Hidden on Mobile via CSS) */}
              <div className="scanner-system">
                {/* Laser Connector */}
                <svg className="connector-svg">
                  <motion.path
                    d="M 280 20 L 50 20 L 0 100"
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="2"
                    strokeDasharray="6,6"
                    initial={{ strokeDashoffset: 0 }}
                    animate={{ strokeDashoffset: -200 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  />
                  <circle cx="280" cy="20" r="4" fill="#3b82f6" className="pulse-dot" />
                </svg>

                <div className="scanner-unit">
                  {/* Scanner Body */}
                  <div className="scanner-body">
                    <div className="scan-surface">
                      <BiFingerprint className="fp-icon" />
                      <motion.div
                        className="scan-light-bar"
                        animate={{ top: ["-10%", "110%", "-10%"] }}
                        transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
                      ></motion.div>
                    </div>
                  </div>

                  {/* Finger Animation */}
                  <motion.div
                    className="finger-hand-wrapper"
                    animate={{
                      x: [50, 0, 50],
                      opacity: [0, 1, 0]
                    }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", repeatDelay: 0.5 }}
                  >
                    <div className="finger-shape">
                      <div className="finger-nail"></div>
                    </div>
                  </motion.div>

                  {/* Success Ripple */}
                  <div className="scan-ripple"></div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* --- Seamless Ticker --- */}
      <div className="ticker-wrapper">
        <div className="ticker-track">
          {[...features, ...features, ...features, ...features].map((text, index) => (
            <div className="ticker-item" key={index}>
              <FiCheckCircle /> {text}
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default Banner;