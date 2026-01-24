import React, { useContext, useState } from "react";
import { FaUserCircle } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import Login from "./Login";
import { SettingsContext } from "../Redux/SettingsContext";

const HomeNavbar = () => {
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();
  const { settings } = useContext(SettingsContext);

  return (
    <>
      <nav
        className="navbar sticky-top px-4 shadow"
        style={{
          backgroundColor: "#000000", // pure black
          backdropFilter: "blur(8px)",
          zIndex: 1000,
          height: "64px",
        }}
      >
        <div className="container-fluid d-flex justify-content-between align-items-center">
          {/* Logo */}
          <div
            className="navbar-brand d-flex align-items-center"
            style={{ cursor: "pointer" }}
            onClick={() => navigate("/")}
          >
            {settings?.logo && (
              <img
                src={`${import.meta.env.VITE_API_URL}${settings.logo}`}
                alt="logo"
                style={{
                  height: "42px",
                  maxWidth: "160px",
                  objectFit: "contain",
                  filter: "drop-shadow(0px 2px 2px rgba(255,255,255,0.2))",
                }}
              />
            )}
          </div>

          {/* Buttons */}
          <div className="d-flex align-items-center gap-2">
            <button
              className="btn btn-outline-light btn-sm rounded-pill px-3"
              onClick={() => navigate("/jobs")}
            >
              Career
            </button>

            <button
              className="btn btn-light btn-sm rounded-pill d-flex align-items-center gap-2 px-3"
              onClick={() => setShowModal(true)}
            >
              <FaUserCircle size={16} /> <span className="fw-semibold">Login</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Login Modal */}
      {showModal && (
        <Login
          onClose={() => setShowModal(false)}
          onLoginSuccess={() => setShowModal(false)}
        />
      )}
    </>
  );
};

export default HomeNavbar;
