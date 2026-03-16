import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import EmployeeNavbar from "./EmployeeNavbar";
import { 
  FiGrid, FiClock, FiFileText, FiHome, FiCalendar, 
  FiBell, FiLogOut, FiChevronDown, FiCheckSquare, 
  FiCreditCard, FiActivity, FiLayers,
  FiUsers, FiRepeat, FiBriefcase, FiTarget, FiTrendingUp, FiAward, FiPlusCircle, FiSettings
} from "react-icons/fi";
import { BiSolidDashboard, BiExit } from "react-icons/bi";
import { MdCoPresent, MdOutlineAddHome, MdWebAsset } from "react-icons/md";
import { CiBoxList } from "react-icons/ci";
import { IoDocuments } from "react-icons/io5";
import "../Admin/AdminLayout.css"; 
import Footer from "../Home/Footer";
import axios from "axios";

const EmployeeLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 1100);
  const [user, setUser] = useState(null);
  const [openMenus, setOpenMenus] = useState({});
  const [modules, setModules] = useState([]); 
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
    const fetchModules = async () => {
      const userData = JSON.parse(localStorage.getItem("user") || "{}");
      
      // ✅ FIX: Admin ko refresh par SAARE modules milenge
      if (userData.role === "admin") {
        setModules([
          "staff_verification", "employee_management", // ✅ NEW MODULES
          "attendance", "payroll", "project", 
          "recruitment", "reports", "meeting", "document", "event", 
          "exit", "notification", "wfh", "department", "branch", 
          "designation", "shift", "bday", "lms", "settings","asset_management",
          "leave_requests", "leave_types", "leave_policies", "holidays"
        ]);
        return; 
      }

      try {
        const token = getToken();
        if (!token) return;

        const API_URL = import.meta.env.VITE_API_URL; 
        const res = await axios.get(`${API_URL}/api/my-modules`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (res.data.modules) {
          setModules(res.data.modules);
        }
      } catch (error) {
        console.error("Failed to fetch modules", error);
      }
    };
    fetchModules();
  }, []);

  const toggleSubmenu = (name) => {
    if (!sidebarOpen && window.innerWidth > 1100) setSidebarOpen(true);
    setOpenMenus(prev => ({ ...prev, [name]: !prev[name] }));
  };

  // ✅ DYNAMIC MENUS: Self Service (Always) + Management (If Permission Granted)
  const navItems = [
    // --- 1. SELF SERVICE (ALWAYS VISIBLE TO EMPLOYEE) ---
    { name: "Dashboard", to: "/employee/dashboard", icon: <BiSolidDashboard /> },
    { 
      name: "My Leave Panel", icon: <FiCalendar />,
      submenu: [
        { name: "Apply Leave", to: "/employee/apply-leave" },
        { name: "My Leave List", to: "/employee/my-leaves" },
      ] 
    },
    { 
      name: "My Attendance", icon: <MdCoPresent />, 
      submenu: [
        { name: "Mark Attendance", to: "/employee/mark-attendence" },
        { name: "My Timesheet", to: "/employee/timesheet" },
      ] 
    },
    { 
      name: "WFH Request", icon: <MdOutlineAddHome />, 
      submenu: [
        { name: "Apply WFH", to: "/wfh/apply" },
        { name: "WFH Lists", to: "/wfh/mine" },
      ] 
    },
    { name: "Salary Slips", to: "/employee/salary-slips", icon: <CiBoxList /> },
    { name: "My Tasks", to: "/employee/tasks", icon: <FiCheckSquare /> },
    { name: "My Assets", to: "/employee/my-assets", icon: <MdWebAsset /> },
    { name: "My Documents", to: "/employee/my-documents", icon: <IoDocuments /> },
    { name: "Company Events", to: "/employee/events", icon: <FiActivity /> },
    { name: "Exit Request", to: "/employee/exit-request", icon: <BiExit /> },
    { name: "Notifications", to: "/employee/notification", icon: <FiBell /> },
    
    // --- 2. MANAGEMENT/AUTHORITY MENUS (DYNAMIC) ---
    
    // ✅ Replaced "staff" with both new modules
    (modules.includes("staff_verification") || modules.includes("employee_management")) && { 
      name: "Staff Management", icon: <FiUsers />, 
      submenu: [
        modules.includes("staff_verification") && { name: "Employee Approvals", to: "/pending-employee" },
        modules.includes("employee_management") && { name: "Employee Directory", to: "/admin/employee-management" }
      ].filter(Boolean)
    },

    modules.includes("attendance") && { 
      name: "Team Attendance", icon: <FiClock />, 
      submenu: [
        { name: "Employee Att. Lists", to: "/admin/employee-attendence-lists" },
        { name: "Office Timing", to: "/admin/office-timming" },
        { name: "Time Sheets", to: "/admin/time-sheets" },
        { name: "Bulk Attendance", to: "/admin/bulk-attendance" }
      ] 
    },
    modules.includes("payroll") && { 
      name: "Payroll Admin", icon: <FiCreditCard />, 
      submenu: [
        { name: "Set Salary", to: "/admin/payroll" },
        { name: "Full & Final", to: "/admin/fullandfinal" }
      ] 
    },
    modules.includes("project") && { name: "Project Admin", to: "/admin/project-management", icon: <FiLayers /> },
    modules.includes("leave_requests") && { name: "Team Leaves", to: "/admin/leaves", icon: <FiRepeat /> },
    
    modules.includes("branch") && { name: "Manage Branches", to: "/admin/branchs", icon: <FiHome /> },
    modules.includes("department") && { name: "Manage Departments", to: "/admin/department", icon: <FiTarget /> },
    modules.includes("designation") && { name: "Manage Designations", to: "/admin/designations", icon: <FiActivity /> },
    modules.includes("shift") && { name: "Manage Shifts", to: "/admin/shifts", icon: <FiCalendar /> },

    modules.includes("reports") && { 
      name: "Reports", icon: <FiTrendingUp />, 
      submenu: [
        { name: "Monthly Attendance", to: "/admin/MonthlyAttendance" },
        { name: "Leave Report", to: "/admin/leave-report" },
        { name: "Payroll Report", to: "/admin/payroll-report" }
      ] 
    },
    modules.includes("asset_management") && { 
      name: "Asset Management", icon: <FiTrendingUp />, 
      submenu: [
        { name: "Dashboard", to: "/admin/asset-management" }
      ] 
    },

    modules.includes("meeting") && { 
      name: "Meetings Admin", icon: <FiCalendar />, 
      submenu: [
        { name: "Create Meeting", to: "/admin/meeting-form" },
        { name: "Meeting Lists", to: "/admin/meeting-calender" }
      ] 
    },
    modules.includes("event") && { name: "Events Admin", to: "/admin/events", icon: <FiAward /> },
    modules.includes("lms") && { name: "Performance (KPIs)", to: "/admin/lms", icon: <FiCheckCircle /> },

    modules.includes("notification") && { 
      name: "Send Notification", icon: <FiBell />, 
      submenu: [
        { name: "Send Notification", to: "/admin/send-notification" },
        { name: "Notification History", to: "/admin/notification-history" }
      ] 
    },

    modules.includes("recruitment") && { 
      name: "Recruitment (ATS)", icon: <FiBriefcase />, 
      submenu: [
        { name: "Create Job", to: "/admin/jobcreate" },
        { name: "Job Lists", to: "/admin/joblist" },
        { name: "Job Candidates", to: "/jobs/candidates" },
        { name: "Interview Schedule", to: "/jobs/interview" }
      ] 
    },

    modules.includes("bday") && { name: "Birthday/Anniversary", to: "/admin/bday-anniversary", icon: <FiAward /> },
    modules.includes("wfh") && { name: "WFH Requests Admin", to: "/admin/wfh/requests", icon: <FiPlusCircle /> },
    modules.includes("document") && { name: "Documents Admin", to: "/admin/documents", icon: <FiFileText /> },
    modules.includes("exit") && { name: "Exit Lists Admin", to: "/admin/employee-exit-lists", icon: <FiLogOut /> },
    
  ].filter(Boolean); 

  return (
    <div className={`hrms-master-container ${sidebarOpen ? "expanded" : "collapsed"}`}>
      {sidebarOpen && window.innerWidth <= 1100 && (
        <div className="mobile-overlay-click-trap" style={{ position: 'fixed', inset: 0, zIndex: 1040}} onClick={() => setSidebarOpen(false)} />
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
           <button onClick={() => navigate("/")} className="btn-logout-premium">
              <span className="logout-icon-box"><FiLogOut /></span>
              {sidebarOpen && <span className="logout-text">Sign Out</span>}
           </button>
        </div>
      </aside>

      <main className="main-viewport-content">
        <EmployeeNavbar sidebarOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <div className="main-scroll-view">
          <div className="content-wrapper" style={{ padding: '20px', minHeight: '80vh' }}>
            {children}
          </div>
          <Footer />
        </div>
      </main>
    </div>
  );
};

export default EmployeeLayout;