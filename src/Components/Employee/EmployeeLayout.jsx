import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import EmployeeNavbar from "./EmployeeNavbar";
import { 
  FiGrid, FiClock, FiFileText, FiHome, FiCalendar, 
  FiBell, FiLogOut, FiChevronDown, FiCheckSquare, 
  FiCreditCard, FiActivity, FiLayers,
  FiUsers, FiRepeat, FiBriefcase, FiTarget, FiTrendingUp, FiAward, FiPlusCircle, FiSettings, FiAlertCircle
} from "react-icons/fi";
import { BiSolidDashboard, BiExit } from "react-icons/bi";
import { MdCoPresent, MdOutlineAddHome, MdWebAsset } from "react-icons/md";
import { CiBoxList } from "react-icons/ci";
import { IoDocuments } from "react-icons/io5";
import "../Admin/AdminLayout.css"; 
import Footer from "../Home/Footer";
import axios from "axios";

// ✅ 1. URL TO MODULE MAP
const employeeRouteModuleMap = {
  "/employee/apply-leave": "Leave Management",
  "/employee/my-leaves": "Leave Management",
  "/employee/mark-attendence": "Attendance",
  "/employee/timesheet": "Attendance",
  "/wfh/": "WFH Requests", 
  "/employee/salary-slips": "Payroll",
  "/employee/tasks": "Project Management",
  "/employee/my-assets": "Asset Management",
  "/employee/my-documents": "Documents",
  "/employee/events": "Events",
  "/employee/employee-dates": "Birthdays & Anniversaries",
  "/employee/exit-request": "Exit Management",
  "/employee/notification": "Notification",
  "/mail": "Mail" 
};

const EmployeeLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 1100);
  const [user, setUser] = useState(null);
  const [openMenus, setOpenMenus] = useState({});
  
  const [companyModules, setCompanyModules] = useState([]); 
  const [hrPermissions, setHrPermissions] = useState([]);   
  
  const [isProfileComplete, setIsProfileComplete] = useState(true);
  const [showProfileModal, setShowProfileModal] = useState(false);

  // 🔥 SHIELD FOR EMPLOYEES 🔥
  const [isVerifying, setIsVerifying] = useState(true);

  const location = useLocation();
  const navigate = useNavigate();

  const getToken = () => {
    try {
      const userObj = JSON.parse(localStorage.getItem("user") || "{}");
      return localStorage.getItem("token") || userObj.token;
    } catch (e) {
      return null;
    }
  };

  useEffect(() => {
    if (window.innerWidth <= 1100) setSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    setUser(JSON.parse(localStorage.getItem("user") || "{}"));
    const handleResize = () => {
      if (window.innerWidth <= 1100) setSidebarOpen(false);
      else setSidebarOpen(true);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setIsVerifying(true); // Lock the page

      const token = getToken();
      const userData = JSON.parse(localStorage.getItem("user") || "{}");
      if (!token) return;

      const API_URL = import.meta.env.VITE_API_URL; 
      let fetchedModules = [];

      try {
        const subRes = await axios.get(`${API_URL}/user/my-subscription`, { headers: { Authorization: `Bearer ${token}` } });
        if (subRes.data.success && subRes.data.data?.planId) {
          fetchedModules = subRes.data.data.planId.allowedModules || [];
          setCompanyModules(fetchedModules);
        }

        if (userData.role === "admin") {
          setHrPermissions(["staff_verification", "employee_management"]);
        } else {
          const res = await axios.get(`${API_URL}/api/my-modules`, { headers: { Authorization: `Bearer ${token}` } });
          if (res.data.modules) setHrPermissions(res.data.modules);
        }

        const profileRes = await axios.get(`${API_URL}/user/profile`, { headers: { Authorization: `Bearer ${token}` } });
        const profile = profileRes.data.data;

        const isMissingInfo = !profile || !profile.phone || !profile.dob || !profile.address;

        if (isMissingInfo) {
          setIsProfileComplete(false);
          if (!sessionStorage.getItem("empProfileModalSkipped")) {
            setShowProfileModal(true);
          }
        } else {
          setIsProfileComplete(true);
          setShowProfileModal(false);
        }
      } catch (error) {
        console.error("Failed to fetch data", error);
      }

      // ✅ ROUTE VERIFICATION LOGIC
      const currentPath = location.pathname;
      let requiredModule = null;

      for (const [pathKey, moduleName] of Object.entries(employeeRouteModuleMap)) {
        if (currentPath.startsWith(pathKey)) {
          requiredModule = moduleName;
          break;
        }
      }

      if (requiredModule && !fetchedModules.includes(requiredModule)) {
        navigate("/employee/dashboard", { replace: true }); 
      } else {
        setIsVerifying(false); // Unlock the page
      }
    };
    
    fetchData();
  }, [location.pathname, navigate]);


  const handleSkipProfile = () => {
    setShowProfileModal(false);
    sessionStorage.setItem("empProfileModalSkipped", "true");
  };

  const handleGoToProfile = () => {
    setShowProfileModal(false);
    sessionStorage.setItem("empProfileModalSkipped", "true");
    navigate("/employee/profile");
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    sessionStorage.removeItem("empProfileModalSkipped"); 
    navigate("/");
  };

  const toggleSubmenu = (name) => {
    if (!sidebarOpen && window.innerWidth > 1100) setSidebarOpen(true);
    setOpenMenus(prev => ({ ...prev, [name]: !prev[name] }));
  };

  const navItems = [
    { name: "Dashboard", to: "/employee/dashboard", icon: <BiSolidDashboard />, alwaysShow: true },
    { name: "My Profile", to: "/employee/profile", icon: <FiUsers />, alwaysShow: true },
    
    companyModules.includes("Leave Management") && { name: "My Leave Panel", icon: <FiCalendar />, submenu: [{ name: "Apply Leave", to: "/employee/apply-leave" }, { name: "My Leave List", to: "/employee/my-leaves" }] },
    companyModules.includes("Attendance") && { name: "My Attendance", icon: <MdCoPresent />, submenu: [{ name: "Mark Attendance", to: "/employee/mark-attendence" }, { name: "My Timesheet", to: "/employee/timesheet" }] },
    companyModules.includes("WFH Requests") && { name: "WFH Request", icon: <MdOutlineAddHome />, submenu: [{ name: "Apply WFH", to: "/wfh/apply" }, { name: "WFH Lists", to: "/wfh/mine" }] },
    companyModules.includes("Payroll") && { name: "Salary Slips", to: "/employee/salary-slips", icon: <CiBoxList /> },
    companyModules.includes("Project Management") && { name: "My Tasks", to: "/employee/tasks", icon: <FiCheckSquare /> },
    companyModules.includes("Asset Management") && { name: "My Assets", to: "/employee/my-assets", icon: <MdWebAsset /> },
    companyModules.includes("Documents") && { name: "My Documents", to: "/employee/my-documents", icon: <IoDocuments /> },
    companyModules.includes("Events") && { name: "Company Events", to: "/employee/events", icon: <FiActivity /> },
    companyModules.includes("Birthdays & Anniversaries") && { name: "Celebrations", to: "/employee/employee-dates", icon: <FiGift /> },
    companyModules.includes("Exit Management") && { name: "Exit Request", to: "/employee/exit-request", icon: <BiExit /> },
    companyModules.includes("Notification") && { name: "Notifications", to: "/employee/notification", icon: <FiBell /> },
    companyModules.includes("Mail") && { name: "Internal Mail", to: "/mail/inbox", icon: <FiMail /> },
    
    (hrPermissions.includes("staff_verification") || hrPermissions.includes("employee_management")) && { 
      name: "Staff Management", icon: <FiUsers />, 
      submenu: [
        hrPermissions.includes("staff_verification") && { name: "Employee Approvals", to: "/pending-employee" },
        hrPermissions.includes("employee_management") && { name: "Employee Directory", to: "/admin/employee-management" }
      ].filter(Boolean)
    }
  ].filter(Boolean); 

  return (
    <div className={`hrms-master-container ${sidebarOpen ? "expanded" : "collapsed"}`}>
      {sidebarOpen && window.innerWidth <= 1100 && (
        <div className="mobile-overlay-click-trap" style={{ position: 'fixed', inset: 0, zIndex: 1040}} onClick={() => setSidebarOpen(false)} />
      )}

      {showProfileModal && (
        <div className="setup-modal-overlay" style={{ zIndex: 9999 }}>
          <div className="setup-modal-card" style={{ borderTopColor: '#10b981' }}>
            <div className="icon-wrapper" style={{ color: '#10b981' }}><FiUsers /></div>
            <h3>Complete Your Profile</h3>
            <p>Your profile information (like Contact, DOB, Address) is incomplete. Please update it for payroll and company records.</p>
            <div className="action-buttons">
              <button className="btn-skip" onClick={handleSkipProfile}>Skip for now</button>
              <button className="btn-setup" style={{ background: '#10b981', boxShadow: '0 4px 10px rgba(16, 185, 129, 0.3)', borderColor: '#059669' }} onClick={handleGoToProfile}>Update Profile</button>
            </div>
          </div>
        </div>
      )}

      <aside className="midnight-sidebar">
        <div className="sidebar-header-box">
            <div className="logo-icon-circle"><FiLayers /></div>
            {sidebarOpen && (
              <div className="header-text-box">
                <h4 className="hey-text m-0">{user?.role?.toUpperCase() || 'EMPLOYEE'}</h4>
                <p className="sub-text m-0">Self Service</p>
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
           <button onClick={handleLogout} className="btn-logout-premium">
              <span className="logout-icon-box"><FiLogOut /></span>
              {sidebarOpen && <span className="logout-text">Sign Out</span>}
           </button>
        </div>
      </aside>

      <main className="main-viewport-content">
        
        {!isProfileComplete && !showProfileModal && location.pathname !== '/employee/profile' && (
           <div className="setup-alert-banner" style={{ background: 'linear-gradient(90deg, #10b981, #059669)', boxShadow: '0 4px 15px rgba(16, 185, 129, 0.25)' }}>
              <div className="banner-text">
                <FiAlertCircle className="me-2" style={{fontSize: '1.2rem'}}/>
                <span><strong>Action Required:</strong> Your employee profile is incomplete.</span>
              </div>
              <button onClick={handleGoToProfile} className="banner-btn" style={{ color: '#00ff62' }}>Complete Profile</button>
           </div>
        )}

        <EmployeeNavbar sidebarOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <div className="main-scroll-view">
          <div className="content-wrapper" style={{ padding: '0px', minHeight: '80vh' }}>
            
            {/* 🔥 SHIELD: Block rendering until verified 🔥 */}
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

export default EmployeeLayout;