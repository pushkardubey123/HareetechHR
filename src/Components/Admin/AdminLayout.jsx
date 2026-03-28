import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import AdminNavbar from "./AdminNavbar";
import { 
  FiGrid, FiUsers, FiClock, FiCreditCard, FiBriefcase, FiSettings, 
  FiLogOut, FiChevronDown, FiFileText, FiLayers, FiCalendar, 
  FiHome, FiTarget, FiActivity, FiBell, FiAward, FiPlusCircle,
  FiRepeat, FiTrendingUp, FiCheckCircle, FiAlertCircle, FiInfo, FiGift
} from "react-icons/fi";
import "./AdminLayout.css";
import Footer from "../Home/Footer"; 
import { FaLaptop } from "react-icons/fa";

// ✅ 1. URL TO MODULE MAP
const adminRouteModuleMap = {
  "/admin/employee-attendence-lists": "Attendance",
  "/admin/office-timming": "Attendance",
  "/admin/time-sheets": "Attendance",
  "/admin/bulk-attendance": "Attendance",
  "/admin/payroll": "Payroll",
  "/admin/fullandfinal": "Payroll",
  "/admin/leaves": "Leave Management",
  "/admin/jobcreate": "Recruitment (ATS)",
  "/admin/joblist": "Recruitment (ATS)",
  "/jobs/": "Recruitment (ATS)", 
  "/admin/asset-management": "Asset Management",
  "/admin/project-management": "Project Management",
  "/admin/MonthlyAttendance": "Reports",
  "/admin/leave-report": "Reports",
  "/admin/payroll-report": "Reports",
  "/admin/meeting-form": "Meeting",
  "/admin/meeting-calender": "Meeting",
  "/admin/events": "Events",
  "/admin/send-notification": "Notification",
  "/admin/notification-history": "Notification",
  "/admin/lms": "LMS (KPIs)",
  "/admin/documents": "Documents",
  "/admin/wfh": "WFH Requests",
  "/admin/employee-exit-lists": "Exit Management",
  "/admin/bday-anniversary": "Birthdays & Anniversaries",
  "/mail": "Mail" 
};

const AdminLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 1100);
  const [user, setUser] = useState(null);
  const [openMenus, setOpenMenus] = useState({});
  const location = useLocation();
  const navigate = useNavigate();

  const [isSetupComplete, setIsSetupComplete] = useState(true);
  const [showSetupModal, setShowSetupModal] = useState(false);

  const [subscription, setSubscription] = useState(null);
  const [daysLeft, setDaysLeft] = useState(0);
  const [allowedModules, setAllowedModules] = useState([]);
  
  // 🔥 THE SHIELD: Block rendering until verification is done 🔥
  const [isVerifying, setIsVerifying] = useState(true); 

  useEffect(() => {
    if (window.innerWidth <= 1100) setSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const currentTheme = localStorage.getItem("theme") || "light";
    document.body.setAttribute("data-theme", currentTheme);
  }, [location.pathname]);

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem("user"));
    setUser(userData);
    const handleResize = () => {
      if (window.innerWidth <= 1100) setSidebarOpen(false);
      else setSidebarOpen(true);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const fetchAdminData = async () => {
      setIsVerifying(true); // Lock the page

      const userData = JSON.parse(localStorage.getItem("user"));
      let fetchedModules = [];

      if (userData?.role === "admin" && userData?.token) {
        try {
          const headers = { Authorization: `Bearer ${userData.token}` };
          
          const [settingsRes, profileRes, subRes] = await Promise.all([
            axios.get(`${import.meta.env.VITE_API_URL}/api/settings`, { headers }).catch(() => ({data:{}})),
            axios.get(`${import.meta.env.VITE_API_URL}/user/profile`, { headers }).catch(() => ({data:{}})),
            axios.get(`${import.meta.env.VITE_API_URL}/user/my-subscription`, { headers }).catch(() => ({data:{}}))
          ]);

          const settings = settingsRes.data?.data;
          const profile = profileRes.data?.data;
          const isCompanyIncomplete = !settings || !settings.name || !settings.email || !settings.phone;
          const isProfileIncomplete = !profile || !profile.phone;

          if (isCompanyIncomplete || isProfileIncomplete) {
            setIsSetupComplete(false); 
            if (!sessionStorage.getItem("setupModalSkipped")) setShowSetupModal(true);
          } else {
            setIsSetupComplete(true);
            setShowSetupModal(false);
          }

          if (subRes.data?.success) {
            const subData = subRes.data.data;
            setSubscription(subData);
            
            if (subData.planId && subData.planId.allowedModules) {
              fetchedModules = subData.planId.allowedModules;
              setAllowedModules(fetchedModules);
            }

            if (subData.planId?.isTrial) {
                const validDate = new Date(subData.validUpto);
                const todayDate = new Date();
                validDate.setHours(0, 0, 0, 0);
                todayDate.setHours(0, 0, 0, 0);
                const diffTime = validDate.getTime() - todayDate.getTime();
                const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
                setDaysLeft(diffDays > 0 ? diffDays : 0);
            }
          }
        } catch (err) {
          console.error("Failed to fetch admin data", err);
        }
      }

      // ✅ 2. ROUTE VERIFICATION LOGIC (Run immediately after fetch)
      const currentPath = location.pathname;
      let requiredModule = null;

      for (const [pathKey, moduleName] of Object.entries(adminRouteModuleMap)) {
        if (currentPath.startsWith(pathKey)) {
          requiredModule = moduleName;
          break;
        }
      }

      // Agar module required hai aur allowed list me nahi hai -> REDIRECT
      if (requiredModule && !fetchedModules.includes(requiredModule)) {
        navigate("/subscription", { replace: true });
      } else {
        // Verification pass ho gayi -> Page ko unlock karo
        setIsVerifying(false); 
      }
    };

    fetchAdminData();
  }, [location.pathname, navigate]);


  const handleSkipSetup = () => {
    setShowSetupModal(false);
    sessionStorage.setItem("setupModalSkipped", "true"); 
  };

  const handleGoToSettings = () => {
    setShowSetupModal(false);
    sessionStorage.setItem("setupModalSkipped", "true"); 
    navigate("/admin/setting");
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    sessionStorage.removeItem("setupModalSkipped");
    navigate("/");
  };

  const toggleSubmenu = (name) => {
    if (!sidebarOpen && window.innerWidth > 1100) setSidebarOpen(true);
    setOpenMenus(prev => ({ ...prev, [name]: !prev[name] }));
  };

  const navItems = [
    { name: "Dashboard", to: "/admin/dashboard", icon: <FiGrid />, alwaysShow: true },
    { name: "Settings", to: "/admin/setting", icon: <FiSettings />, alwaysShow: true },
    { name: "Staff", icon: <FiUsers />, alwaysShow: true, submenu: [{ name: "Employee Approvals", to: "/pending-employee" }, { name: "Employee Directory", to: "/admin/employee-management" }] },
    { name: "Branches", to: "/admin/branchs", icon: <FiHome />, alwaysShow: true },
    { name: "Department", to: "/admin/department", icon: <FiTarget />, alwaysShow: true },
    { name: "Designations", to: "/admin/designations", icon: <FiActivity />, alwaysShow: true },
    { name: "Shifts", to: "/admin/shifts", icon: <FiCalendar />, alwaysShow: true },
    
    { name: "Attendance", moduleName: "Attendance", icon: <FiClock />, submenu: [{ name: "Employee Att. Lists", to: "/admin/employee-attendence-lists" }, { name: "Office Timing", to: "/admin/office-timming" }, { name: "Time Sheets", to: "/admin/time-sheets" }, { name: "Bulk Attendance", to: "/admin/bulk-attendance" }] },
    { name: "Payroll", moduleName: "Payroll", icon: <FiCreditCard />, submenu: [{ name: "Set Salary", to: "/admin/payroll" }, { name: "Full & Final", to: "/admin/fullandfinal" }] },
    { name: "Leave Panel", moduleName: "Leave Management", to: "/admin/leaves", icon: <FiRepeat /> },
    { name: "Recruitment (ATS)", moduleName: "Recruitment (ATS)", icon: <FiBriefcase />, submenu: [{ name: "Create Job", to: "/admin/jobcreate" }, { name: "Job Lists", to: "/admin/joblist" }, { name: "Job Candidates", to: "/jobs/candidates" }, { name: "Interview Schedule", to: "/jobs/interview" }] },
    { name: "Asset Management", moduleName: "Asset Management", to: "/admin/asset-management", icon: <FaLaptop /> },
    { name: "Project", moduleName: "Project Management", to: "/admin/project-management", icon: <FiLayers /> },
    { name: "Reports", moduleName: "Reports", icon: <FiTrendingUp />, submenu: [{ name: "Monthly Attendance", to: "/admin/MonthlyAttendance" }, { name: "Leave Report", to: "/admin/leave-report" }, { name: "Payroll Report", to: "/admin/payroll-report" }] },
    { name: "Meeting", moduleName: "Meeting", icon: <FiCalendar />, submenu: [{ name: "Create Meeting", to: "/admin/meeting-form" }, { name: "Meeting Lists", to: "/admin/meeting-calender" }] },
    { name: "Events", moduleName: "Events", to: "/admin/events", icon: <FiAward /> },
    { name: "Notification", moduleName: "Notification", icon: <FiBell />, submenu: [{ name: "Send Notification", to: "/admin/send-notification" }, { name: "Notification History", to: "/admin/notification-history" }] },
    { name: "Performance (KPIs)", moduleName: "LMS (KPIs)", to: "/admin/lms", icon: <FiCheckCircle /> },
    { name: "Documents", moduleName: "Documents", to: "/admin/documents", icon: <FiFileText /> },
    { name: "WFH Requests", moduleName: "WFH Requests", to: "/admin/wfh/requests", icon: <FiPlusCircle /> },
    { name: "Exit Lists", moduleName: "Exit Management", to: "/admin/employee-exit-lists", icon: <FiLogOut /> },
    { name: "Birthday/Anniversary", moduleName: "Birthdays & Anniversaries", to: "/admin/bday-anniversary", icon: <FiGift /> },
    { name: "Internal Mail", moduleName: "Mail", to: "/mail/inbox", icon: <FiBell /> }
  ];

  const filteredNavItems = navItems.filter(item => {
    if (item.alwaysShow) return true;
    return allowedModules.includes(item.moduleName);
  });

  return (
    <div className={`hrms-master-container ${sidebarOpen ? "expanded" : "collapsed"}`}>
      
      {sidebarOpen && window.innerWidth <= 1100 && (
        <div className="mobile-overlay-click-trap" style={{ position: 'fixed', inset: 0, zIndex: 1040}} onClick={() => setSidebarOpen(false)} />
      )}

      {showSetupModal && (
        <div className="setup-modal-overlay">
          <div className="setup-modal-card">
            <div className="icon-wrapper"><FiSettings /></div>
            <h3>Complete Your Profile and Company Details</h3>
            <p>Your company details are missing. Please fill them out to ensure smooth operation of the HRMS portal.</p>
            <div className="action-buttons">
              <button className="btn-skip" onClick={handleSkipSetup}>Skip for now</button>
              <button className="btn-setup" onClick={handleGoToSettings}>Go to Settings</button>
            </div>
          </div>
        </div>
      )}

      <aside className="midnight-sidebar">
        <div className="sidebar-header-box">
            <div className="logo-icon-circle"><FiActivity /></div>
            {sidebarOpen && (
              <div className="header-text-box">
                <h4 className="hey-text m-0">HareetechHR</h4>
                <p className="sub-text m-0">Control Panel</p>
              </div>
            )}
        </div>

        <div className="nav-items-scroller">
            {filteredNavItems.map((item, i) => {
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
           <button onClick={handleLogout} className="btn-logout-premium">
              <span className="logout-icon-box"><FiLogOut /></span>
              {sidebarOpen && <span className="logout-text">Sign Out</span>}
           </button>
        </div>
      </aside>

      <main className="main-viewport-content">
        
        {subscription?.planId?.isTrial && (
           <div className="alert alert-warning rounded-0 border-0 m-0 text-center fw-bold py-2 d-flex align-items-center justify-content-center shadow-sm" style={{ backgroundColor: "#fef3c7", color: "#9a3412" }}>
              <FiInfo className="me-2 fs-5" />
              You are currently on a Free Trial. You have <span className="badge bg-danger ms-2 me-2 fs-6">{daysLeft} Days</span> remaining.
              <Link to="/subscription" className="ms-3 btn btn-sm btn-danger fw-bold rounded-pill px-3">Upgrade Plan</Link>
           </div>
        )}

        {!isSetupComplete && !showSetupModal && location.pathname !== '/admin/setting' && (
           <div className="setup-alert-banner">
              <div className="banner-text">
                <FiAlertCircle className="me-2" style={{fontSize: '1.2rem'}}/>
                <span><strong>Action Required:</strong> Your profile and company details is incomplete.</span>
              </div>
              <button onClick={handleGoToSettings} className="banner-btn">Complete Setup</button>
           </div>
        )}

        <AdminNavbar sidebarOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        
        <div className="main-scroll-view">
          <div className="content-wrapper" style={{ padding: '0', minHeight: '80vh' }}>
            
            {/* 🔥 THE MAGIC HAPPENS HERE: If verifying, show loader instead of children 🔥 */}
            {isVerifying ? (
              <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
                <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}></div>
              </div>
            ) : (
              children
            )}
            
          </div>
          <Footer />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;