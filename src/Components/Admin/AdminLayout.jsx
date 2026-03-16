import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import AdminNavbar from "./AdminNavbar";
import { 
  FiGrid, FiUsers, FiClock, FiCreditCard, FiBriefcase, FiSettings, 
  FiLogOut, FiChevronDown, FiFileText, FiLayers, FiCalendar, 
  FiHome, FiTarget, FiActivity, FiBell, FiAward, FiPlusCircle,
  FiRepeat, FiTrendingUp, FiCheckCircle
} from "react-icons/fi";
import "./AdminLayout.css";
import Footer from "../Home/Footer"; 
import { MdWebAsset } from "react-icons/md";

const AdminLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 1100);
  const [user, setUser] = useState(null);
  const [openMenus, setOpenMenus] = useState({});
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (window.innerWidth <= 1100) setSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const currentTheme = localStorage.getItem("theme") || "light";
    document.body.setAttribute("data-theme", currentTheme);
  }, [location.pathname]);

  useEffect(() => {
    setUser(JSON.parse(localStorage.getItem("user")));
    const handleResize = () => {
      if (window.innerWidth <= 1100) setSidebarOpen(false);
      else setSidebarOpen(true);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleSubmenu = (name) => {
    if (!sidebarOpen && window.innerWidth > 1100) setSidebarOpen(true);
    setOpenMenus(prev => ({ ...prev, [name]: !prev[name] }));
  };

  const navItems = [
    { name: "Dashboard", to: "/admin/dashboard", icon: <FiGrid /> },
    { 
      name: "Staff", icon: <FiUsers />, 
      submenu: [
        { name: "Employee Approvals", to: "/pending-employee" },
        { name: "Employee Directory", to: "/admin/employee-management" }
      ] 
    },
    { 
      name: "Attendance", icon: <FiClock />, 
      submenu: [
        { name: "Employee Att. Lists", to: "/admin/employee-attendence-lists" },
        { name: "Office Timing", to: "/admin/office-timming" },
        { name: "Time Sheets", to: "/admin/time-sheets" },
        { name: "Bulk Attendance", to: "/admin/bulk-attendance" }
      ] 
    },
    { 
      name: "Payroll", icon: <FiCreditCard />, 
      submenu: [
        { name: "Set Salary", to: "/admin/payroll" },
        { name: "Full & Final", to: "/admin/fullandfinal" }
      ] 
    },
    { 
      name: "Asset Management", icon: <MdWebAsset />, 
      submenu: [
        { name: "Dashboard", to: "/admin/asset-management" }
      ] 
    },
    { name: "Project", to: "/admin/project-management", icon: <FiLayers /> },
    { name: "Leave Panel", to: "/admin/leaves", icon: <FiRepeat /> },
    { name: "Branches", to: "/admin/branchs", icon: <FiHome /> },
    { name: "Department", to: "/admin/department", icon: <FiTarget /> },
    { name: "Designations", to: "/admin/designations", icon: <FiActivity /> },
    { name: "Shifts", to: "/admin/shifts", icon: <FiCalendar /> },
    { 
      name: "Reports", icon: <FiTrendingUp />, 
      submenu: [
        { name: "Monthly Attendance", to: "/admin/MonthlyAttendance" },
        { name: "Leave Report", to: "/admin/leave-report" },
        { name: "Payroll Report", to: "/admin/payroll-report" }
      ] 
    },
    { 
      name: "Meeting", icon: <FiCalendar />, 
      submenu: [
        { name: "Create Meeting", to: "/admin/meeting-form" },
        { name: "Meeting Lists", to: "/admin/meeting-calender" }
      ] 
    },
    { name: "Events", to: "/admin/events", icon: <FiAward /> },
    { name: "Performance (KPIs)", to: "/admin/lms", icon: <FiCheckCircle /> },
    { 
      name: "Notification", icon: <FiBell />, 
      submenu: [
        { name: "Send Notification", to: "/admin/send-notification" },
        { name: "Notification History", to: "/admin/notification-history" }
      ] 
    },
    { 
      name: "Recruitment (ATS)", icon: <FiBriefcase />, 
      submenu: [
        { name: "Create Job", to: "/admin/jobcreate" },
        { name: "Job Lists", to: "/admin/joblist" },
        { name: "Job Candidates", to: "/jobs/candidates" },
        { name: "Interview Schedule", to: "/jobs/interview" }
      ] 
    },
    { name: "Birthday/Anniversary", to: "/admin/bday-anniversary", icon: <FiAward /> },
    { name: "WFH Requests", to: "/admin/wfh/requests", icon: <FiPlusCircle /> },
    { name: "Documents", to: "/admin/documents", icon: <FiFileText /> },
    { name: "Exit Lists", to: "/admin/employee-exit-lists", icon: <FiLogOut /> },
    { name: "Settings", to: "/admin/setting", icon: <FiSettings /> },
  ];

  return (
    <div className={`hrms-master-container ${sidebarOpen ? "expanded" : "collapsed"}`}>
      
      {/* Mobile Overlay */}
      {sidebarOpen && window.innerWidth <= 1100 && (
        <div 
          className="mobile-overlay-click-trap" 
          style={{ position: 'fixed', inset: 0, zIndex: 1040}}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* --- SIDEBAR STARTS --- */}
      <aside className="midnight-sidebar">
        <div className="sidebar-header-box">
            <div className="logo-icon-circle"><FiActivity /></div>
            {sidebarOpen && (
              <div className="header-text-box">
                <h4 className="hey-text m-0">Audit365-HR</h4>
                <p className="sub-text m-0">Control Panel</p>
              </div>
            )}
        </div>

        <div className="nav-items-scroller">
            {navItems.map((item, i) => {
              const isActive = location.pathname === item.to || item.submenu?.some(s => location.pathname === s.to);
              return (
                <div key={i} className="nav-group-item w-100">
                  {!item.submenu ? (
                    <Link to={item.to} className={`nav-link-main ${isActive ? "active" : ""}`}>
                      <span className="nav-icon">{item.icon}</span>
                      <span className="nav-label">{item.name}</span>
                    </Link>
                  ) : (
                    <>
                      <div className={`nav-link-main has-dropdown ${openMenus[item.name] ? "opened" : ""} ${isActive ? "active-parent" : ""}`} onClick={() => toggleSubmenu(item.name)}>
                        <span className="nav-icon">{item.icon}</span>
                        <span className="nav-label">{item.name}</span>
                        {sidebarOpen && <FiChevronDown className="ms-auto arrow-icon" />}
                      </div>
                      <div className={`dropdown-container ${openMenus[item.name] && sidebarOpen ? "show" : ""}`}>
                        {item.submenu.map((sub, si) => (
                          <Link key={si} to={sub.to} className={`dropdown-link ${location.pathname === sub.to ? "active" : ""}`}>
                             {sub.name}
                          </Link>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
        </div>

        <div className="sidebar-bottom-action">
           <button onClick={() => navigate("/")} className="btn-logout-premium">
              <span className="logout-icon-box"><FiLogOut /></span>
              {sidebarOpen && <span className="logout-text">Sign Out</span>}
           </button>
        </div>
      </aside>
      {/* --- SIDEBAR ENDS --- */}

      {/* --- MAIN CONTENT AREA --- */}
      <main className="main-viewport-content">
        <AdminNavbar 
          sidebarOpen={sidebarOpen} 
          toggleSidebar={() => setSidebarOpen(!sidebarOpen)} 
        />
        
        {/* Scrollable View */}
        <div className="main-scroll-view">
          {/* REMOVED PADDING HERE to fix white borders */}
          <div className="content-wrapper" style={{ padding: '0', minHeight: '80vh' }}>
            {children}
          </div>
          
          <Footer />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;