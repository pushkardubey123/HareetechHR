import React, { useEffect, useState } from "react";
import moment from "moment";
import { FiMessageSquare, FiRefreshCw } from "react-icons/fi";
import { toast } from "react-toastify";

const TicketList = ({ api, activeTab, isAgentOrAdmin, onViewTicket, refreshKey, onRefresh }) => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ status: "", priority: "", assigneeId: "" });
  const [staffList, setStaffList] = useState([]);

  useEffect(() => {
    fetchTickets();
    if (isAgentOrAdmin) {
      api.get("/user").then(res => setStaffList(res.data.data || [])).catch(()=>console.log("staff fetch error"));
    }
  }, [activeTab, refreshKey]);

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const endpoint = activeTab === "manage-tickets" ? "/api/tickets/manage" : "/api/tickets/my-tickets";
      
      // Build Query String for Filters
      const queryParams = new URLSearchParams();
      if (filters.status) queryParams.append("status", filters.status);
      if (filters.priority) queryParams.append("priority", filters.priority);
      if (filters.assigneeId) queryParams.append("assigneeId", filters.assigneeId);

      const res = await api.get(`${endpoint}?${queryParams.toString()}`);
      setTickets(res.data.data || []);
    } catch (err) {
      toast.error("Failed to fetch tickets");
    }
    setLoading(false);
  };

  const getBadgeClass = (val, type) => {
    if (type === 'priority') return val === 'High' || val === 'Urgent' ? 'crm-badge-danger' : val === 'Medium' ? 'crm-badge-info' : 'crm-badge-secondary';
    if (type === 'status') return val === 'Open' ? 'crm-badge-success' : val === 'Resolved' || val === 'Closed' ? 'crm-badge-dark' : 'crm-badge-warning';
  };

  return (
    <div className="crm-fade-in">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h3 className="crm-page-title">{activeTab === "manage-tickets" ? "Internal Tickets Queue" : "My Ticket Requests"}</h3>
          <p className="crm-page-subtitle">Track requests and route them to the right person.</p>
        </div>
        <button className="crm-btn-outline" onClick={onRefresh}>
          <FiRefreshCw className={`me-2 ${loading ? 'spin' : ''}`}/> Refresh
        </button>
      </div>

      {/* Filter Bar */}
      <div className="crm-filter-card mb-4">
        <div className="row g-3 align-items-end">
          <div className="col-md-3">
            <label className="crm-label">Status</label>
            <select className="form-select crm-input" value={filters.status} onChange={e => setFilters({...filters, status: e.target.value})}>
              <option value="">Any</option><option value="Open">Open</option><option value="In-Progress">In-Progress</option><option value="Resolved">Resolved</option>
            </select>
          </div>
          <div className="col-md-3">
            <label className="crm-label">Priority</label>
            <select className="form-select crm-input" value={filters.priority} onChange={e => setFilters({...filters, priority: e.target.value})}>
              <option value="">Any</option><option value="Low">Low</option><option value="Medium">Medium</option><option value="High">High</option>
            </select>
          </div>
          {activeTab === "manage-tickets" && (
            <div className="col-md-3">
              <label className="crm-label">Assigned Staff</label>
              <select className="form-select crm-input" value={filters.assigneeId} onChange={e => setFilters({...filters, assigneeId: e.target.value})}>
                <option value="">Any</option>
                <option value="Unassigned">Unassigned Only</option>
                {staffList.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
              </select>
            </div>
          )}
          <div className="col-md-3 d-flex gap-2">
            <button className="crm-btn-outline flex-grow-1" onClick={fetchTickets}>Apply Filter</button>
            <button className="crm-btn-reset flex-grow-1" onClick={() => { setFilters({status:"", priority:"", assigneeId:""}); setTimeout(onRefresh, 100); }}>Reset</button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="crm-card">
        <div className="table-responsive">
          <table className="crm-table">
            <thead>
              <tr>
                <th>Ticket #</th><th>Title & Dept</th>{activeTab === "manage-tickets" && <th>Requester</th>}
                <th>Priority</th><th>Status</th><th>Assigned To</th><th>Created At</th><th className="text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {tickets.length === 0 ? (
                <tr><td colSpan="8" className="text-center py-5 text-muted">No tickets found.</td></tr>
              ) : (
                tickets.map((t) => (
                  <tr key={t._id} className={t.isEscalated ? "crm-row-breach" : ""}>
                    <td className="fw-bold">{t.ticketId}</td>
                    <td><div className="text-truncate fw-bold" style={{maxWidth: '200px'}}>{t.title}</div><small className="text-muted">{t.departmentId?.name || 'General'}</small></td>
                    {activeTab === "manage-tickets" && <td>{t.requesterId?.name}</td>}
                    <td><span className={`crm-badge ${getBadgeClass(t.priority, 'priority')}`}>{t.priority.toUpperCase()}</span></td>
                    <td><span className={`crm-badge ${getBadgeClass(t.status, 'status')}`}>{t.status}</span></td>
                    <td>{t.assigneeId?.name || <span className="text-muted fst-italic">Unassigned</span>}</td>
                    <td>{moment(t.createdAt).format("DD MMM, YY")}</td>
                    <td className="text-center">
                      <button className="crm-icon-btn" onClick={() => onViewTicket(t)}><FiMessageSquare /></button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TicketList;