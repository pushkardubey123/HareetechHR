import React, { useState, useEffect } from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import AdminLayout from "../AdminLayout"; 
import LeaveRequests from "./LeaveRequests";
import LeaveCalendar from "./LeaveCalendar";
import LeaveTypes from "./Configuration/LeaveTypes";
import LeavePolicies from "./Configuration/LeavePolicies";
import LeaveReports from "./LeaveReports";
import { 
  BiGridAlt, BiCalendarCheck, BiCog, BiBarChart, BiCalendarEvent, BiLayer 
} from "react-icons/bi";
import "./LeaveManagement.css"; // Ensure CSS is imported

const LeaveManagementLayout = () => {
  const [activeTab, setActiveTab] = useState("requests");

  useEffect(() => {
    const savedTab = localStorage.getItem("activeLeaveTab");
    if (savedTab) setActiveTab(savedTab);
  }, []);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    localStorage.setItem("activeLeaveTab", tab);
  };

  const renderContent = () => {
    switch (activeTab) {
      case "requests": return <LeaveRequests />;
      case "calendar": return <LeaveCalendar />;
      case "types": return <LeaveTypes />;
      case "policies": return <LeavePolicies />;
      case "reports": return <LeaveReports />;
      default: return <LeaveRequests />;
    }
  };

  return (
    <AdminLayout>
      <div className="min-h-screen text-[var(--text-primary)] font-inter p-4 md:p-6 space-y-6">
        
        <ToastContainer position="top-right" autoClose={3000} theme="colored" />

        {/* --- HEADER BOX --- */}
        <div className="glass-box px-8 py-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold flex items-center gap-3">
              <span className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500">
                <BiCalendarCheck size={32} />
              </span>
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-500">
                Leave Management
              </span>
            </h1>
            <p className="text-[var(--text-secondary)] mt-2 font-medium">
              Manage time-off, accruals, and company policies efficiently.
            </p>
          </div>
          
          {/* Example Stat Mini-Cards could go here */}
          <div className="hidden md:flex gap-4">
             <div className="text-right">
                <p className="text-xs text-[var(--text-secondary)] font-bold uppercase tracking-wider">Date</p>
                <p className="font-semibold text-lg">{new Date().toLocaleDateString()}</p>
             </div>
          </div>
        </div>

        {/* --- TABS NAVIGATION BOX --- */}
        <div className="glass-box p-2 sticky top-2 z-30">
          <div className="flex gap-2 overflow-x-auto no-scrollbar items-center">
            <TabButton id="requests" label="Requests" icon={<BiGridAlt />} active={activeTab} onClick={handleTabChange} />
            <TabButton id="calendar" label="Calendar" icon={<BiCalendarEvent />} active={activeTab} onClick={handleTabChange} />
            <TabButton id="reports" label="Analytics" icon={<BiBarChart />} active={activeTab} onClick={handleTabChange} />
            
            <div className="w-[1px] h-6 bg-[var(--border-color)] mx-2"></div>
            
            <TabButton id="types" label="Types" icon={<BiLayer />} active={activeTab} onClick={handleTabChange} />
            <TabButton id="policies" label="Policies" icon={<BiCog />} active={activeTab} onClick={handleTabChange} />
          </div>
        </div>

        {/* --- DYNAMIC CONTENT AREA --- */}
        <div className="animate-fade-in min-h-[600px]">
          {renderContent()}
        </div>

      </div>
    </AdminLayout>
  );
};

const TabButton = ({ id, label, icon, active, onClick }) => (
  <button
    onClick={() => onClick(id)}
    className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold transition-all duration-300 whitespace-nowrap
      ${active === id 
        ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/30 transform scale-[1.02]" 
        : "text-[var(--text-secondary)] hover:bg-[var(--bg-page)] hover:text-[var(--text-primary)]"
      }`}
  >
    <span className="text-lg">{icon}</span>
    {label}
  </button>
);

export default LeaveManagementLayout;