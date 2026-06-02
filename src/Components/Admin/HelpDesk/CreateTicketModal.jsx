import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import Swal from "sweetalert2";

const CreateTicketModal = ({ api, isAgentOrAdmin, onClose, onSuccess }) => {
  const user = JSON.parse(localStorage.getItem("user"));
  const isAdmin = user?.role === "admin";

  const [formData, setFormData] = useState({ title: "", description: "", branchId: "", departmentId: "", priority: "Medium", assigneeId: "" });
  
  const [branches, setBranches] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [staffList, setStaffList] = useState([]);

  useEffect(() => {
    if (isAdmin) {
      api.get("/api/branch").then(res => setBranches(res.data.data || [])).catch(()=>{});
    } else {
      // Normal employee doesn't need branch dropdown, just fetch depts
      api.get("/api/departments/public").then(res => setDepartments(res.data.data || []));
    }
  }, []);

  const handleBranchChange = (e) => {
    const bId = e.target.value;
    setFormData({ ...formData, branchId: bId, departmentId: "", assigneeId: "" });
    setDepartments([]); setStaffList([]);
    if (bId) api.get(`/api/departments/public?branchId=${bId}`).then(res => setDepartments(res.data.data || []));
  };

  const handleDeptChange = (e) => {
    const dId = e.target.value;
    setFormData({ ...formData, departmentId: dId, assigneeId: "" });
    if (dId && isAgentOrAdmin) {
      const bIdQuery = formData.branchId ? `&branchId=${formData.branchId}` : "";
      api.get(`/user?departmentId=${dId}${bIdQuery}`).then(res => setStaffList(res.data.data || [])).catch(()=>{});
    }
  };

  const handleRaiseTicket = async (e) => {
    e.preventDefault();
    if (isAdmin && !formData.branchId) return toast.error("Please select a Branch");
    try {
      const payload = { ...formData, assigneeId: formData.assigneeId === "" ? null : formData.assigneeId };
      await api.post("/api/tickets/raise", payload);
      Swal.fire({ title: "Success", text: "Ticket routed successfully.", icon: "success", timer: 2000, showConfirmButton: false });
      onSuccess();
      onClose();
    } catch (err) { toast.error(err.response?.data?.message || "Failed to create ticket"); }
  };

  return (
    <div className="crm-modal-overlay">
      <div className="crm-modal-content crm-fade-in">
        <h4 className="mb-2 fw-bold">Create New Ticket</h4>
        <form onSubmit={handleRaiseTicket}>
          
          {isAdmin && (
            <div className="mb-3">
              <label className="crm-label">Select Branch <span className="text-danger">*</span></label>
              <select className="form-select crm-input" value={formData.branchId} onChange={handleBranchChange} required>
                <option value="">-- Choose Branch --</option>
                {branches.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
              </select>
            </div>
          )}

          <div className="row g-3 mb-3">
            <div className="col-md-8">
              <label className="crm-label">Title <span className="text-danger">*</span></label>
              <input type="text" className="form-control crm-input" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required disabled={isAdmin && !formData.branchId} />
            </div>
            <div className="col-md-4">
              <label className="crm-label">Priority</label>
              <select className="form-select crm-input" value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value})} disabled={isAdmin && !formData.branchId}>
                <option value="Low">Low</option><option value="Medium">Medium</option><option value="High">High</option><option value="Urgent">Urgent</option>
              </select>
            </div>
          </div>

          <div className="mb-3">
            <label className="crm-label">Department Category <span className="text-danger">*</span></label>
            <select className="form-select crm-input" value={formData.departmentId} onChange={handleDeptChange} required disabled={isAdmin && !formData.branchId}>
              <option value="">Select Department</option>
              {departments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
            </select>
          </div>

          <div className="mb-3">
            <label className="crm-label">Description <span className="text-danger">*</span></label>
            <textarea className="form-control crm-input" rows="3" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} required disabled={isAdmin && !formData.branchId}></textarea>
          </div>

          {isAgentOrAdmin && formData.departmentId && (
            <div className="mb-4">
              <label className="crm-label">Assign To (Optional)</label>
              <select className="form-select crm-input" value={formData.assigneeId} onChange={e => setFormData({...formData, assigneeId: e.target.value})}>
                <option value="">Unassigned (Send to Department Queue)</option>
                {staffList.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
              </select>
            </div>
          )}

          <div className="d-flex gap-2">
            <button type="submit" className="crm-btn-primary-dark">Submit Ticket</button>
            <button type="button" className="crm-btn-outline" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};
export default CreateTicketModal;