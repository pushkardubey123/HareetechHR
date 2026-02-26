import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import EmployeeNavbar from "./EmployeeNavbar";
import { 
  FiGrid, FiClock, FiFileText, FiHome, FiCalendar, 
  FiBell, FiLogOut, FiChevronDown, FiCheckSquare, 
  FiCreditCard, FiActivity, FiLayers
} from "react-icons/fi";
import { BiSolidDashboard, BiExit } from "react-icons/bi";
import { MdCoPresent, MdOutlineAddHome } from "react-icons/md";
import { CiBoxList } from "react-icons/ci";
import { IoDocuments } from "react-icons/io5";
import "../Admin/AdminLayout.css"; 
import Footer from "..//Home/Footer"; // Import Footer

const EmployeeLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 1100);
  const [user, setUser] = useState(null);
  const [openMenus, setOpenMenus] = useState({});
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (window.innerWidth <= 1100) setSidebarOpen(false);
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
    { name: "Dashboard", to: "/employee/dashboard", icon: <BiSolidDashboard /> },
    { 
      name: "Leave Panel", 
      icon: <FiCalendar />,
      submenu: [
        { name: "Apply Leave", to: "/employee/apply-leave" },
        { name: "My Leave List", to: "/employee/my-leaves" },
      ] 
    },
    { 
      name: "Attendance", 
      icon: <MdCoPresent />, 
      submenu: [
        { name: "Mark Attendance", to: "/employee/mark-attendence" },
        { name: "My Timesheet", to: "/employee/timesheet" },
      ] 
    },
    { 
      name: "WFH Request", 
      icon: <MdOutlineAddHome />, 
      submenu: [
        { name: "Apply WFH", to: "/wfh/apply" },
        { name: "WFH Lists", to: "/wfh/mine" },
      ] 
    },
    { name: "Salary Slips", to: "/employee/salary-slips", icon: <CiBoxList /> },
    { name: "My Tasks", to: "/employee/tasks", icon: <FiCheckSquare /> },
    { name: "Documents", to: "/employee/my-documents", icon: <IoDocuments /> },
    { name: "Events", to: "/employee/events", icon: <FiActivity /> },
    { name: "Exit Request", to: "/employee/exit-request", icon: <BiExit /> },
    { name: "Notifications", to: "/employee/notification", icon: <FiBell /> },
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

      {/* SIDEBAR */}
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

      {/* MAIN CONTENT */}
      <main className="main-viewport-content">
        <EmployeeNavbar 
          sidebarOpen={sidebarOpen} 
          toggleSidebar={() => setSidebarOpen(!sidebarOpen)} 
        />
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