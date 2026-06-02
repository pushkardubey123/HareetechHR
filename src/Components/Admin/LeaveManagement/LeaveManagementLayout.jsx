import React, { useEffect, useState } from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
import DynamicLayout from "../../Common/DynamicLayout"; 
import LeaveRequests from "./LeaveRequests";
import LeaveCalendar from "./LeaveCalendar";
import LeaveTypes from "./Configuration/LeaveTypes";
import LeavePolicies from "./Configuration/LeavePolicies";
import LeaveReports from "./LeaveReports";
import { 
  BiGridAlt, BiCalendarCheck, BiCog, BiBarChart, BiCalendarEvent, BiLayer 
} from "react-icons/bi";
import "./LeaveManagement.css";

const LeaveManagementLayout = () => {
  const [activeTab, setActiveTab] = useState("requests");
  
  // ✅ SEPARATE PERMISSION STATES FOR EACH SUB-MODULE
  const [perms, setPerms] = useState({
    requests: { view: false, create: false, edit: false, delete: false },
    holidays: { view: false, create: false, edit: false, delete: false },
    types: { view: false, create: false, edit: false, delete: false },
    policies: { view: false, create: false, edit: false, delete: false }
  });
  
  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : null;
  const role = user?.role;
  const token = user?.token;
  const API_URL = import.meta.env.VITE_API_URL;
  const isAdmin = role === "admin";

  useEffect(() => {
    const savedTab = localStorage.getItem("activeLeaveTab");
    if (savedTab) setActiveTab(savedTab);
  }, []);

  // ✅ FETCH DETAILED PERMISSIONS
  useEffect(() => {
    const fetchPermissions = async () => {
      if (isAdmin) { 
        setPerms({
          requests: { view: true, create: true, edit: true, delete: true },
          holidays: { view: true, create: true, edit: true, delete: true },
          types: { view: true, create: true, edit: true, delete: true },
          policies: { view: true, create: true, edit: true, delete: true }
        });
        return; 
      }
      if (!token) return;

      try {
        const res = await axios.get(`${API_URL}/api/my-modules`, { headers: { Authorization: `Bearer ${token}` } });
        if (res.data && res.data.detailed) {
            const det = res.data.detailed;
            setPerms({
               requests: det.leave_requests || { view: false, create: false, edit: false, delete: false },
               holidays: det.holidays || { view: false, create: false, edit: false, delete: false },
               types: det.leave_types || { view: false, create: false, edit: false, delete: false },
               policies: det.leave_policies || { view: false, create: false, edit: false, delete: false }
            });
        }
      } catch (e) {
          console.error("Failed to fetch permissions", e);
      }
    };
    fetchPermissions();
  }, [token, isAdmin, API_URL]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    localStorage.setItem("activeLeaveTab", tab);
  };

  // ✅ RENDER CONTENT
  const renderContent = () => {
    switch (activeTab) {
      case "requests": return <LeaveRequests perms={perms.requests} />;
      case "calendar": return <LeaveCalendar perms={perms.holidays} />;
      case "types": return <LeaveTypes perms={perms.types} />;
      case "policies": return <LeavePolicies perms={perms.policies} />;
      case "reports": return <LeaveReports />; 
      default: return <LeaveRequests perms={perms.requests} />;
    }
  };

  return (
    <DynamicLayout>
      <div className="lm-wrapper">
        <ToastContainer position="top-right" autoClose={3000} theme="colored" />

        {/* --- HEADER BOX --- */}
        <div className="lm-header-card">
          <div className="lm-header-left">
            <div className="lm-header-icon">
              <BiCalendarCheck />
            </div>
            <div>
              <h1 className="lm-title">Leave Management</h1>
              <p className="lm-subtitle">Manage time-off, accruals, and company policies efficiently.</p>
            </div>
          </div>
          
          <div className="lm-header-right">
             <div className="lm-date-box">
                <p className="lm-date-label">Today's Date</p>
                <p className="lm-date-value">{new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
             </div>
          </div>
        </div>

        {/* --- TABS NAVIGATION BOX --- */}
        <div className="lm-tabs-container">
          <div className="lm-tabs-scroll">
            <TabButton id="requests" label="Requests" icon={<BiGridAlt />} active={activeTab} onClick={handleTabChange} />
            <TabButton id="calendar" label="Calendar" icon={<BiCalendarEvent />} active={activeTab} onClick={handleTabChange} />
            
            {perms.requests.view && (
                <TabButton id="reports" label="Analytics" icon={<BiBarChart />} active={activeTab} onClick={handleTabChange} />
            )}
            
            {(perms.types?.view || perms.types?.create || perms.types?.edit || perms.policies?.view || perms.policies?.create || perms.policies?.edit) && (
                <>
                    <div className="lm-tab-divider"></div>
                    {(perms.types?.view || perms.types?.create || perms.types?.edit) && (
                        <TabButton id="types" label="Types" icon={<BiLayer />} active={activeTab} onClick={handleTabChange} />
                    )}
                    {(perms.policies?.view || perms.policies?.create || perms.policies?.edit) && (
                        <TabButton id="policies" label="Policies" icon={<BiCog />} active={activeTab} onClick={handleTabChange} />
                    )}
                </>
            )}
          </div>
        </div>

        {/* --- DYNAMIC CONTENT AREA --- */}
        <div className="lm-content-area">
          {renderContent()}
        </div>
      </div>
    </DynamicLayout>
  );
};

// Helper Tab Component
const TabButton = ({ id, label, icon, active, onClick }) => (
  <button
    onClick={() => onClick(id)}
    className={`lm-tab-btn ${active === id ? "active" : ""}`}
  >
    <span className="lm-tab-icon">{icon}</span>
    {label}
  </button>
);

export default LeaveManagementLayout;