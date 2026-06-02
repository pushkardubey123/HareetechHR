import React, { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { 
  FiPlus, FiInbox, FiSend, FiFileText, 
  FiStar, FiAlertOctagon, FiTrash2, FiTag, FiX 
} from "react-icons/fi";
import MailNavbar from "./MailNavbar"; // Ensure path is correct
import "./MailLayout.css"; // Ensure CSS file exists

const MailLayout = () => {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Mobile menu close helper
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  // Folder Configuration
  const navItems = [
    { to: "/mail/inbox", icon: <FiInbox />, label: "Inbox" },
    { to: "/mail/sent", icon: <FiSend />, label: "Sent" },
    { to: "/mail/drafts", icon: <FiFileText />, label: "Drafts" }, // New
    { to: "/mail/starred", icon: <FiStar />, label: "Starred" }, // New
    { to: "/mail/spam", icon: <FiAlertOctagon />, label: "Spam" }, // New
    { to: "/mail/trash", icon: <FiTrash2 />, label: "Trash" },
  ];

  const customLabels = [
    { name: "Personal", color: "#ef4444" },
    { name: "Work", color: "#3b82f6" },
    { name: "Urgent", color: "#f59e0b" },
  ];

  return (
    <div className="mail-layout-container">
      
      {/* 1. TOP NAVBAR (Controls Sidebar Toggle) */}
      <MailNavbar toggleSidebar={() => setIsMobileMenuOpen(!isMobileMenuOpen)} />

      {/* 2. MAIN BODY GRID */}
      <div className="mail-body-grid">
        
        {/* MOBILE OVERLAY (Click outside to close) */}
        {isMobileMenuOpen && (
          <div 
            className="d-lg-none position-fixed top-0 start-0 w-100 h-100 bg-dark opacity-50"
            style={{ zIndex: 40 }}
            onClick={closeMobileMenu}
          />
        )}

        {/* --- LEFT SIDEBAR --- */}
        <aside className={`mail-sidebar-panel ${isMobileMenuOpen ? 'mobile-show' : ''}`}>
          
          {/* Mobile Close Button (Only visible on small screens) */}
          <div className="d-flex justify-content-end d-lg-none mb-2">
            <button className="btn btn-sm btn-icon text-muted" onClick={closeMobileMenu}>
              <FiX size={20} />
            </button>
          </div>

          {/* COMPOSE BUTTON (Premium Gradient) */}
          <button 
            className="btn-compose-premium shadow-sm"
            onClick={() => {
              navigate('/mail/compose');
              closeMobileMenu();
            }}
          >
            <FiPlus size={20} /> 
            <span>Compose</span>
          </button>

          {/* NAVIGATION LINKS */}
          <div className="mt-3 d-flex flex-column gap-1">
            {navItems.map((item) => (
              <NavLink 
                key={item.label}
                to={item.to} 
                className={({ isActive }) => `mail-nav-link ${isActive ? 'active' : ''}`}
                onClick={closeMobileMenu}
              >
                <div className="d-flex align-items-center gap-3">
                  {item.icon}
                  <span>{item.label}</span>
                </div>
                {/* Optional: Add badge here later <span className="badge-pill-count">2</span> */}
              </NavLink>
            ))}
          </div>

          {/* LABELS SECTION (Visual Appeal) */}
          <div className="labels-header d-flex align-item-center">
            <FiTag className="me-2 mt-1" /> Labels
          </div>
          
          <div className="d-flex flex-column gap-1">
            {customLabels.map((lbl, idx) => (
              <div key={idx} className="mail-nav-link" style={{cursor: 'pointer'}}>
                <div className="d-flex align-items-center">
                  <span className="label-dot" style={{ backgroundColor: lbl.color }}></span>
                  {lbl.name}
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* --- RIGHT CONTENT AREA (Outlet) --- */}
        <main className="mail-viewport-area">
          {/* Outlet ke andar MailList, Compose, ViewMail render honge */}
          <Outlet />
        </main>
        
      </div>
    </div>
  );
};

export default MailLayout;