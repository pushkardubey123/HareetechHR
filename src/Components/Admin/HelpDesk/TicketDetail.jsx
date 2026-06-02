import React, { useEffect, useState } from "react";
import moment from "moment";
import { toast } from "react-toastify";
import { FiArrowLeft, FiLock } from "react-icons/fi";

const TicketDetail = ({ api, ticket, activeTab, isAgentOrAdmin, onBack }) => {
  const user = JSON.parse(localStorage.getItem("user"));
  const isAdmin = user?.role === "admin";
  const isTicketClosed = ticket.status === "Closed";
  const isLockedForMe = isTicketClosed && !isAdmin; // Admin can override the lock

  const [comments, setComments] = useState([]);
  const [updateData, setUpdateData] = useState({ 
    status: ticket.status, 
    assigneeId: ticket.assigneeId?._id || "",
    slaDeadline: ticket.slaDeadline ? moment(ticket.slaDeadline).format("YYYY-MM-DDTHH:mm") : ""
  });
  const [commentData, setCommentData] = useState({ message: "", isInternalNote: false });
  const [staffList, setStaffList] = useState([]);
  const [hasFullAccess, setHasFullAccess] = useState(isAdmin);

  useEffect(() => {
    fetchComments();
    if (isAgentOrAdmin) api.get(`/user?departmentId=${ticket.departmentId._id}`).then(res => setStaffList(res.data.data || []));

    if (!isAdmin) {
      api.get("/api/my-modules").then(res => {
        if (res.data.modules?.includes("helpdesk")) setHasFullAccess(true);
      }).catch(()=>{});
    }
  }, []);

  const fetchComments = async () => {
    try {
      const res = await api.get(`/api/tickets/${ticket._id}/comments`);
      setComments(res.data.data || []);
    } catch (err) {}
  };

  const handleUpdateTicket = async () => {
    try {
      await api.put(`/api/tickets/${ticket._id}`, updateData);
      toast.success("Ticket updated successfully!");
    } catch (err) { toast.error(err.response?.data?.message || "Update failed"); }
  };

  const handleClaimTicket = async () => {
    try {
      await api.put(`/api/tickets/${ticket._id}`, { assigneeId: user.id || user._id, status: "In-Progress" });
      toast.success("You have claimed this ticket!");
      onBack(); 
    } catch (err) { toast.error("Failed to claim ticket"); }
  };

  const handlePostResponse = async (e) => {
    e.preventDefault();
    if (!commentData.message) return;
    try {
      await api.post(`/api/tickets/${ticket._id}/comment`, commentData);
      toast.success("Response added!");
      setCommentData({ message: "", isInternalNote: false });
      fetchComments();
    } catch (err) { toast.error(err.response?.data?.message || "Failed to post"); }
  };

  return (
    <div className="crm-fade-in">
      <div className="d-flex justify-content-between align-items-start mb-4">
        <div><h3 className="crm-page-title mb-1">{ticket.title}</h3><p className="crm-page-subtitle mb-0">Ticket #{ticket.ticketId}</p></div>
        <button className="crm-btn-outline" onClick={onBack}><div className="d-flex align-item-center justify-content-center"><FiArrowLeft className="mt-1 me-1" /> Back to List</div></button>
      </div>

      {/* 🔒 LOCKED ALERT */}
      {isLockedForMe && (
        <div className="alert alert-danger d-flex align-items-center gap-2 mb-4" style={{borderLeft: '4px solid #ef4444'}}>
          <FiLock className="fs-5"/> 
          <strong>This ticket is Closed.</strong> You cannot modify details or add comments unless an Admin reopens it.
        </div>
      )}

      <div className="row g-4 mb-4">
        <div className="col-md-6">
          <div className="crm-card h-100">
            <h5 className="crm-card-title">Ticket Information</h5>
            <div className="crm-detail-grid">
              <p><strong>Department:</strong> <span>{ticket.departmentId?.name || 'General'}</span></p>
              <p><strong>Priority:</strong> <span>{ticket.priority}</span></p>
              <p><strong>Current Status:</strong> <span>{ticket.status}</span></p>
              <p><strong>Requester:</strong> <span>{ticket.requesterId?.name}</span></p>
              <p><strong>Current Deadline:</strong> <span className={ticket.isEscalated ? "text-danger fw-bold" : ""}>{moment(ticket.slaDeadline).format("DD MMM, YY hh:mm A")}</span></p>
            </div>
          </div>
        </div>
        
        <div className="col-md-6">
          <div className="crm-card h-100 d-flex flex-column">
            <h5 className="crm-card-title">Assign & SLA Settings</h5>
            
            {!isLockedForMe && ticket.assigneeId === null && activeTab === "manage-tickets" && (
              <div className="mb-3 p-3 bg-warning bg-opacity-10 border border-warning rounded">
                <strong className="d-block mb-2 text-warning">This ticket is currently unassigned!</strong>
                <button className="crm-btn-success w-100" onClick={handleClaimTicket}>Pick / Claim Ticket</button>
              </div>
            )}

            <div className="mb-3">
              <label className="crm-label">Assigned Staff</label>
              <select className="form-select crm-input" value={updateData.assigneeId} onChange={e => setUpdateData({...updateData, assigneeId: e.target.value})} disabled={isLockedForMe || !hasFullAccess || activeTab === "my-tickets"}>
                <option value="">Unassigned</option>
                {staffList.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
              </select>
            </div>
            
            <div className="row g-2 mb-3">
              <div className="col-md-6">
                <label className="crm-label">Status</label>
                <select className="form-select crm-input" value={updateData.status} onChange={e => setUpdateData({...updateData, status: e.target.value})} disabled={isLockedForMe || activeTab === "my-tickets"}>
                  <option value="Open">Open</option><option value="In-Progress">In-Progress</option><option value="Waiting on Employee">Waiting on Employee</option><option value="Resolved">Resolved</option><option value="Closed">Closed</option>
                </select>
              </div>
              <div className="col-md-6">
                <label className="crm-label">Expected Resolution By</label>
                <input type="datetime-local" className="form-control crm-input" value={updateData.slaDeadline} onChange={e => setUpdateData({...updateData, slaDeadline: e.target.value})} disabled={isLockedForMe || (!hasFullAccess && activeTab === "my-tickets")} />
              </div>
            </div>

            <div className="mt-auto text-end">
              <button className="crm-btn-primary-dark" onClick={handleUpdateTicket} disabled={isLockedForMe}>Update Ticket</button>
            </div>
          </div>
        </div>
      </div>

      <div className="crm-card mb-4 pb-0">
        <h5 className="crm-card-title">Conversation Thread</h5>
        <div className="crm-chat-box mb-4">
          <div className="crm-chat-header"><strong>{ticket.requesterId?.name}</strong></div>
          <div className="crm-chat-body">{ticket.description}</div>
        </div>
        {comments.map((msg, i) => (
           <div key={i} className={`crm-chat-box mb-4 ${msg.isInternalNote ? 'border-warning' : ''}`}>
             <div className={`crm-chat-header ${msg.isInternalNote ? 'bg-warning bg-opacity-10' : ''}`}><strong>{msg.senderId?.name}</strong></div>
             <div className={`crm-chat-body ${msg.isInternalNote ? 'bg-warning bg-opacity-10' : ''}`}>{msg.message}</div>
           </div>
        ))}
      </div>

      <div className="crm-card" style={{ opacity: isLockedForMe ? 0.6 : 1, pointerEvents: isLockedForMe ? 'none' : 'auto' }}>
        <h5 className="crm-card-title d-flex justify-content-between align-items-center">Add Response
          {hasFullAccess && activeTab === "manage-tickets" && <label className="small text-muted"><input type="checkbox" checked={commentData.isInternalNote} onChange={e => setCommentData({...commentData, isInternalNote: e.target.checked})}/> Internal Note</label>}
        </h5>
        <form onSubmit={handlePostResponse}>
          <textarea className="form-control crm-input mb-3" rows="3" value={commentData.message} onChange={e => setCommentData({...commentData, message: e.target.value})} placeholder={isLockedForMe ? "Chat is locked" : "Type response..."} disabled={isLockedForMe}></textarea>
          <button type="submit" className="crm-btn-success" disabled={isLockedForMe}>Post Response</button>
        </form>
      </div>
    </div>
  );
};
export default TicketDetail;