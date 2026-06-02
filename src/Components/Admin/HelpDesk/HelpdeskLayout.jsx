import React, { useEffect, useState } from "react";
import axios from "axios";
import { FiLifeBuoy, FiPlus } from "react-icons/fi";
import Loader from "../Loader/Loader";
import DynamicLayout from '../../Common/DynamicLayout'
import TicketList from "./TicketList";
import TicketDetail from "./TicketDetail";
import CreateTicketModal from "./CreateTicketModal";
import TicketDashboard from "./TicketDashboard";
import TicketReport from "./TicketReport";
import './Helpdesk.css';

const HelpdeskLayout = () => {
  const user = JSON.parse(localStorage.getItem("user"));
  const token = user?.token;
  const isAdmin = user?.role === "admin";

  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(isAdmin ? "dashboard" : "manage-tickets"); // Force employees to queue first
  const [viewMode, setViewMode] = useState("list"); 
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showRaiseModal, setShowRaiseModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isAuthorizedAgent, setIsAuthorizedAgent] = useState(isAdmin);

  const api = axios.create({ baseURL: import.meta.env.VITE_API_URL, headers: { Authorization: `Bearer ${token}` } });

  useEffect(() => {
    if (!isAdmin) {
      api.get("/api/my-modules").then(res => {
        if (res.data.modules?.includes("helpdesk")) setIsAuthorizedAgent(true);
      }).catch(()=>{});
    }
  }, []);

  const triggerRefresh = () => setRefreshKey(oldKey => oldKey + 1);

  return (
    <DynamicLayout>
      <div className="crm-hd-wrapper">
        {viewMode === "list" && (
          <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
            <div className="crm-tabs-container m-0 border-0">
              {isAdmin && <button className={`crm-tab ${activeTab === "dashboard" ? "active" : ""}`} onClick={() => setActiveTab("dashboard")}>Dashboard</button>}
              
              <button className={`crm-tab ${activeTab === "manage-tickets" ? "active" : ""}`} onClick={() => setActiveTab("manage-tickets")}>
                 {isAdmin ? "Company Queue" : "Department Queue"}
              </button>
              
              <button className={`crm-tab ${activeTab === "my-tickets" ? "active" : ""}`} onClick={() => setActiveTab("my-tickets")}>
                 My Requests
              </button>

              {isAdmin && (
                <button className={`crm-tab ${activeTab === "reports" ? "active" : ""}`} onClick={() => setActiveTab("reports")}>
                  Analytics & Reports
                </button>
              )}
            </div>
            <button className="crm-btn-primary" onClick={() => setShowRaiseModal(true)}><FiPlus className="me-1"/> Create Ticket</button>
          </div>
        )}

        {/* Dashboard Component */}
        {viewMode === "list" && activeTab === "dashboard" && isAdmin && (
          <TicketDashboard 
            api={api} 
            setViewMode={setViewMode} 
            setActiveTab={setActiveTab} 
          />
        )}

        {/* Reports Component */}
        {viewMode === "list" && activeTab === "reports" && isAdmin && (
          <TicketReport api={api} />
        )}

        {/* Ticket List Component */}
        {viewMode === "list" && (activeTab === "manage-tickets" || activeTab === "my-tickets") && (
          <TicketList 
            api={api} 
            activeTab={activeTab} 
            isAgentOrAdmin={isAdmin || isAuthorizedAgent} 
            onViewTicket={(t) => { setSelectedTicket(t); setViewMode("detail"); }} 
            refreshKey={refreshKey} 
            onRefresh={triggerRefresh} 
          />
        )}

        {/* Ticket Detail Component */}
        {viewMode === "detail" && selectedTicket && (
          <TicketDetail 
            api={api} 
            ticket={selectedTicket} 
            activeTab={activeTab} 
            isAgentOrAdmin={isAdmin || isAuthorizedAgent} 
            onBack={() => { setViewMode("list"); triggerRefresh(); }} 
          />
        )}

        {/* Create Modal */}
        {showRaiseModal && (
          <CreateTicketModal 
            api={api} 
            isAgentOrAdmin={isAdmin || isAuthorizedAgent} 
            onClose={() => setShowRaiseModal(false)} 
            onSuccess={triggerRefresh} 
          />
        )}
        
        {loading && <Loader />}
      </div>
    </DynamicLayout>
  );
};

export default HelpdeskLayout;