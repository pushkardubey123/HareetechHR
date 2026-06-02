import React, { useEffect, useState } from "react";
import DynamicLayout from "../Common/DynamicLayout";
import axios from "axios";
import Swal from "sweetalert2";
import { toast } from "react-toastify";
import moment from "moment";
import Chart from "react-apexcharts";
import {
  FiLifeBuoy, FiClock, FiAlertTriangle, FiCheckCircle,
  FiPlus, FiMessageSquare, FiRefreshCw, FiSend, FiUser,
  FiInbox, FiEyeOff
} from "react-icons/fi";
import Loader from "../Admin/Loader/Loader";
import './Helpdesk.css';

const HelpdeskManagement = () => {
  const user = JSON.parse(localStorage.getItem("user"));
  const token = user?.token;

  const [loading, setLoading] = useState(false);
  
  // 👑 RBAC Logic
  const [isAgentOrAdmin, setIsAgentOrAdmin] = useState(user?.role === "admin"); 
  const [activeTab, setActiveTab] = useState(user?.role === "admin" ? "dashboard" : "my-tickets");

  const [metrics, setMetrics] = useState(null);
  const [manageTickets, setManageTickets] = useState([]); 
  const [myTickets, setMyTickets] = useState([]); 
  const [departments, setDepartments] = useState([]);
  const [currentTheme, setCurrentTheme] = useState(document.body.getAttribute("data-theme") || "light");

  const [showRaiseModal, setShowRaiseModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [formData, setFormData] = useState({ title: "", description: "", departmentId: "", priority: "Medium" });
  const [commentData, setCommentData] = useState({ message: "", isInternalNote: false });

  const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    headers: { Authorization: `Bearer ${token}` },
  });

  // Track Theme Changes
  useEffect(() => {
    const observer = new MutationObserver(() => setCurrentTheme(document.body.getAttribute("data-theme") || "light"));
    observer.observe(document.body, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => { checkPermissionsAndFetch(); }, [activeTab]);

  const checkPermissionsAndFetch = async () => {
    setLoading(true);
    try {
      let hasAgentAccess = user?.role === "admin";
      if (!hasAgentAccess) {
        const permRes = await api.get("/api/my-modules");
        const modules = permRes.data.modules || [];
        if (modules.includes("helpdesk")) {
          hasAgentAccess = true;
          setIsAgentOrAdmin(true);
          if (activeTab === "my-tickets" && !metrics) setActiveTab("dashboard");
        }
      }

      const deptRes = await api.get("/api/departments/public");
      setDepartments(deptRes.data.data || []);

      if (hasAgentAccess && activeTab === "dashboard") {
        const metRes = await api.get("/api/tickets/dashboard/metrics");
        setMetrics(metRes.data.data);
      } else if (hasAgentAccess && activeTab === "manage-tickets") {
        const tktRes = await api.get("/api/tickets/manage");
        setManageTickets(tktRes.data.data);
      } else if (activeTab === "my-tickets") {
        const myTktRes = await api.get("/api/tickets/my-tickets");
        setMyTickets(myTktRes.data.data);
      }
    } catch (err) {
      toast.error("Failed to sync helpdesk data");
    }
    setLoading(false);
  };

  const handleRaiseTicket = async (e) => {
    e.preventDefault();
    try {
      await api.post("/api/tickets/raise", formData);
      Swal.fire({ title: "Ticket Raised", text: "Your issue has been logged successfully.", icon: "success", timer: 2000, showConfirmButton: false });
      setShowRaiseModal(false);
      setFormData({ title: "", description: "", departmentId: "", priority: "Medium" });
      checkPermissionsAndFetch();
    } catch (err) { toast.error("Failed to raise ticket"); }
  };

  const handleUpdateStatus = async (ticketId, newStatus) => {
    try {
      await api.put(`/api/tickets/${ticketId}`, { status: newStatus });
      toast.success(`Ticket marked as ${newStatus}`);
      checkPermissionsAndFetch();
      setShowViewModal(false);
    } catch (err) { toast.error("Status update failed"); }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentData.message) return;
    try {
      await api.post(`/api/tickets/${selectedTicket._id}/comment`, commentData);
      toast.success(commentData.isInternalNote ? "Internal Note Saved" : "Reply Sent");
      setCommentData({ message: "", isInternalNote: false });
      setShowViewModal(false); 
    } catch (err) { toast.error("Failed to send message"); }
  };

  // UI Helpers
  const getPriorityBadge = (priority) => {
    const colors = { Urgent: "hd-badge-urgent", High: "hd-badge-high", Medium: "hd-badge-medium", Low: "hd-badge-low" };
    return <span className={`hd-badge ${colors[priority]}`}>{priority}</span>;
  };

  const getStatusBadge = (status) => {
    const colors = { Open: "hd-status-open", "In-Progress": "hd-status-progress", "Waiting on Employee": "hd-status-waiting", Resolved: "hd-status-resolved", Closed: "hd-status-closed" };
    return <span className={`hd-status ${colors[status]}`}>{status}</span>;
  };

  const currentList = activeTab === "manage-tickets" ? manageTickets : myTickets;

  return (
    <DynamicLayout>
      <div className="hd-master-wrapper fade-in">
        <div className="hd-container">
          
          {/* HEADER */}
          <div className="hd-header-glass mb-4">
            <div className="hd-header-content">
              <div className="hd-icon-ring"><FiLifeBuoy /></div>
              <div>
                <h2 className="hd-title">Support Hub</h2>
                <p className="hd-subtitle">{isAgentOrAdmin ? "Enterprise Ticketing & SLA Management" : "Raise & Track your Requests"}</p>
              </div>
            </div>
            <div className="hd-header-actions">
              <button className="hd-btn-outline" onClick={checkPermissionsAndFetch}>
                <FiRefreshCw className={loading ? "spin" : ""} /> Sync
              </button>
              <button className="hd-btn-primary" onClick={() => setShowRaiseModal(true)}>
                <FiPlus /> Raise Ticket
              </button>
            </div>
          </div>

          {/* TABS */}
          <div className="hd-tabs-wrapper mb-4">
            {isAgentOrAdmin && (
              <>
                <button className={`hd-tab ${activeTab === "dashboard" ? "active" : ""}`} onClick={() => setActiveTab("dashboard")}>Analytics</button>
                <button className={`hd-tab ${activeTab === "manage-tickets" ? "active" : ""}`} onClick={() => setActiveTab("manage-tickets")}>Team Queue</button>
              </>
            )}
            <button className={`hd-tab ${activeTab === "my-tickets" ? "active" : ""}`} onClick={() => setActiveTab("my-tickets")}>My Requests</button>
          </div>

          {/* DASHBOARD VIEW */}
          {activeTab === "dashboard" && metrics && isAgentOrAdmin && (
            <div className="hd-dashboard-grid fade-in-up">
              <div className="hd-kpi-cards">
                <div className="hd-kpi-card">
                  <div className="hd-kpi-icon purple"><FiMessageSquare /></div>
                  <div className="hd-kpi-data"><h3>{metrics.totalTickets}</h3><p>Total Tickets</p></div>
                </div>
                <div className="hd-kpi-card">
                  <div className="hd-kpi-icon blue"><FiClock /></div>
                  <div className="hd-kpi-data"><h3>{metrics.statusDistribution['Open'] || 0}</h3><p>Pending Action</p></div>
                </div>
                <div className="hd-kpi-card">
                  <div className="hd-kpi-icon green"><FiCheckCircle /></div>
                  <div className="hd-kpi-data"><h3>{metrics.statusDistribution['Resolved'] || 0}</h3><p>Resolved</p></div>
                </div>
                <div className={`hd-kpi-card ${metrics.totalEscalated > 0 ? 'breached' : ''}`}>
                  <div className="hd-kpi-icon red"><FiAlertTriangle className={metrics.totalEscalated > 0 ? "pulse" : ""} /></div>
                  <div className="hd-kpi-data"><h3>{metrics.totalEscalated}</h3><p>SLA Breached</p></div>
                </div>
              </div>

              <div className="hd-chart-section hd-card">
                <h6 className="hd-card-title">Workload Distribution</h6>
                <Chart 
                  options={{ chart: { type: 'donut', background: 'transparent' }, labels: Object.keys(metrics.statusDistribution), colors: ['#3b82f6', '#f59e0b', '#64748b', '#10b981', '#0f172a'], dataLabels: { enabled: false }, stroke: { width: 0 }, legend: { labels: { colors: currentTheme === 'dark' ? '#cbd5e1' : '#475569' } }, theme: { mode: currentTheme } }} 
                  series={Object.values(metrics.statusDistribution)} type="donut" height={280}
                />
              </div>
            </div>
          )}

          {/* TICKETS TABLE VIEW */}
          {(activeTab === "manage-tickets" || activeTab === "my-tickets") && (
            <div className="hd-card hd-table-card fade-in-up">
              <div className="hd-card-header">
                <h6 className="hd-card-title">{activeTab === "manage-tickets" ? "Company Tickets Queue" : "My Ticket History"}</h6>
              </div>
              
              {currentList.length === 0 ? (
                <div className="hd-empty-state">
                  <div className="hd-empty-icon"><FiInbox /></div>
                  <h5>No Tickets Found</h5>
                  <p>You're all caught up! There are no tickets in this view.</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="hd-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Subject & Category</th>
                        {activeTab === "manage-tickets" && <th>Requester</th>}
                        <th>Priority</th>
                        <th>Status</th>
                        <th>SLA Deadline</th>
                        <th className="text-end">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentList.map(t => (
                        <tr key={t._id} className={t.isEscalated && activeTab === "manage-tickets" ? "hd-row-breached" : ""}>
                          <td className="hd-tkt-id">{t.ticketId}</td>
                          <td>
                            <div className="hd-tkt-title" title={t.title}>{t.title}</div>
                            <div className="hd-tkt-dept">{t.departmentId?.name || 'General Support'}</div>
                          </td>
                          {activeTab === "manage-tickets" && (
                            <td>
                              <div className="hd-user-pill">
                                <div className="hd-avatar">{t.requesterId?.name?.charAt(0) || 'U'}</div>
                                <span>{t.requesterId?.name || 'Unknown'}</span>
                              </div>
                            </td>
                          )}
                          <td>{getPriorityBadge(t.priority)}</td>
                          <td>{getStatusBadge(t.status)}</td>
                          <td>
                            <div className={`hd-sla-timer ${t.isEscalated ? 'breached' : ''}`}>
                              {t.isEscalated && activeTab === "manage-tickets" ? <FiAlertTriangle /> : <FiClock />}
                              {moment(t.slaDeadline).format("DD MMM, HH:mm")}
                            </div>
                          </td>
                          <td className="text-end">
                            <button className="hd-btn-action" onClick={() => { setSelectedTicket(t); setShowViewModal(true); }}>
                              {activeTab === "manage-tickets" ? "Review" : "View"}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        {/* MODAL 1: RAISE TICKET */}
        {showRaiseModal && (
          <div className="hd-modal-overlay fade-in">
            <div className="hd-modal-box slide-down">
              <div className="hd-modal-header">
                <h5>Raise a Ticket</h5>
                <button className="hd-modal-close" onClick={() => setShowRaiseModal(false)}>&times;</button>
              </div>
              <form onSubmit={handleRaiseTicket}>
                <div className="hd-modal-body">
                  <div className="hd-form-group">
                    <label>Issue Title <span className="text-danger">*</span></label>
                    <input type="text" className="hd-input" placeholder="E.g., Internet not working" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required />
                  </div>
                  <div className="hd-form-row">
                    <div className="hd-form-group half">
                      <label>Department <span className="text-danger">*</span></label>
                      <select className="hd-input" value={formData.departmentId} onChange={e => setFormData({...formData, departmentId: e.target.value})} required>
                        <option value="">Select Dept</option>
                        {departments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                      </select>
                    </div>
                    <div className="hd-form-group half">
                      <label>Urgency <span className="text-danger">*</span></label>
                      <select className="hd-input" value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value})}>
                        <option value="Low">Low</option><option value="Medium">Medium</option>
                        <option value="High">High</option><option value="Urgent">Urgent</option>
                      </select>
                    </div>
                  </div>
                  <div className="hd-form-group">
                    <label>Description <span className="text-danger">*</span></label>
                    <textarea className="hd-input" rows="4" placeholder="Describe your issue in detail..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} required></textarea>
                  </div>
                </div>
                <div className="hd-modal-footer">
                  <button type="button" className="hd-btn-outline" onClick={() => setShowRaiseModal(false)}>Cancel</button>
                  <button type="submit" className="hd-btn-primary">Submit Request</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 2: TICKET THREAD (CHAT UI) */}
        {showViewModal && selectedTicket && (
          <div className="hd-modal-overlay fade-in">
            <div className="hd-modal-box chat-modal slide-down">
              
              <div className="hd-modal-header chat-header">
                <div>
                  <h5 className="mb-1 d-flex align-items-center gap-2">
                    {selectedTicket.ticketId} {getStatusBadge(selectedTicket.status)}
                  </h5>
                  <p className="hd-chat-subtitle mb-0 text-truncate" title={selectedTicket.title}>{selectedTicket.title}</p>
                </div>
                <button className="hd-modal-close" onClick={() => setShowViewModal(false)}>&times;</button>
              </div>

              <div className="hd-chat-body">
                {/* Original Request Bubble */}
                <div className="hd-chat-bubble user-bubble">
                  <div className="bubble-avatar">{selectedTicket.requesterId?.name?.charAt(0) || 'U'}</div>
                  <div className="bubble-content">
                    <div className="bubble-meta">
                      <strong>{selectedTicket.requesterId?.name}</strong>
                      <span>{moment(selectedTicket.createdAt).format("DD MMM, HH:mm")}</span>
                    </div>
                    <div className="bubble-text">{selectedTicket.description}</div>
                  </div>
                </div>

                {/* System Divider */}
                <div className="hd-chat-divider"><span>Ticket Assigned to {selectedTicket.departmentId?.name || 'Support'}</span></div>

                {/* Dummy Reply (If you integrate real comments later, map them here) */}
                <div className="hd-chat-placeholder">
                  <FiMessageSquare />
                  <p>Communication thread will appear here.</p>
                </div>
              </div>

              <div className="hd-chat-footer">
                {/* Resolution Controls for Agent */}
                {activeTab === "manage-tickets" && selectedTicket.status !== 'Resolved' && selectedTicket.status !== 'Closed' && (
                  <div className="hd-agent-bar">
                    <span>Agent Actions:</span>
                    <button type="button" className="hd-btn-success-sm" onClick={() => handleUpdateStatus(selectedTicket._id, 'Resolved')}>
                      <FiCheckCircle /> Mark Resolved
                    </button>
                  </div>
                )}

                {/* Input Area */}
                <form onSubmit={handleAddComment} className="hd-chat-input-wrapper">
                  {activeTab === "manage-tickets" && (
                    <div className="hd-internal-switch">
                      <label className="switch">
                        <input type="checkbox" checked={commentData.isInternalNote} onChange={e => setCommentData({...commentData, isInternalNote: e.target.checked})} />
                        <span className="slider"></span>
                      </label>
                      <span className={`switch-label ${commentData.isInternalNote ? 'warning-text' : ''}`}>
                        {commentData.isInternalNote ? <><FiEyeOff/> Internal Note (Hidden)</> : "Public Reply"}
                      </span>
                    </div>
                  )}
                  <div className={`hd-input-group ${commentData.isInternalNote ? 'internal-mode' : ''}`}>
                    <input 
                      type="text" 
                      placeholder={commentData.isInternalNote ? "Type internal note..." : "Type your reply..."} 
                      value={commentData.message} 
                      onChange={e => setCommentData({...commentData, message: e.target.value})} 
                      required
                    />
                    <button type="submit" className="hd-send-btn"><FiSend /></button>
                  </div>
                </form>
              </div>

            </div>
          </div>
        )}

        {loading && <Loader />}
      </div>
    </DynamicLayout>
  );
};

export default HelpdeskManagement;