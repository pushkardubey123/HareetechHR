import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify"; 
import { 
  BiCheck, BiX, BiSearch, BiWallet, BiPlus, BiCalendar, BiFilterAlt, BiLoaderAlt
} from "react-icons/bi";
import "./LeaveRequests.css";

const LeaveRequests = ({ perms }) => {
  const API_URL = import.meta.env.VITE_API_URL;
  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : null;
  const token = user?.token;
  const isAdmin = user?.role === "admin";

  const canView = isAdmin || perms?.view;
  const canEdit = isAdmin || perms?.edit;
  const canCreate = isAdmin || perms?.create;

  const [leaves, setLeaves] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [leaveTypes, setLeaveTypes] = useState([]);
  
  const [filter, setFilter] = useState("Pending");
  const [loading, setLoading] = useState(false);
  const [btnLoading, setBtnLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [activeModal, setActiveModal] = useState(null); 

  const [adjustForm, setAdjustForm] = useState({
    employeeId: "", leaveTypeId: "", adjustmentType: "add", days: "", reason: ""
  });
  const [accrualLeaveType, setAccrualLeaveType] = useState("");
  const [cfYear, setCfYear] = useState({
    oldYear: new Date().getFullYear() - 1,
    newYear: new Date().getFullYear()
  });

  useEffect(() => {
    if (token) {
      fetchLeaves();
      if(canView) {
          fetchEmployees();
          fetchLeaveTypes();
      }
    }
  }, [token, canView]);

  const fetchLeaves = async () => {
    try {
      setLoading(true);
      const endpoint = canView ? `${API_URL}/api/leaves` : `${API_URL}/api/leaves/employee/${user.id}`;
      const res = await axios.get(endpoint, { headers: { Authorization: `Bearer ${token}` } });
      setLeaves(res.data.data || []);
    } catch (err) { toast.error("Failed to load leaves"); } 
    finally { setLoading(false); }
  };

  const fetchEmployees = async () => {
    try {
      const res = await axios.get(`${API_URL}/user`, { headers: { Authorization: `Bearer ${token}` } });
      const emps = res.data.data.filter(u => u.role === 'employee'); 
      setEmployees(emps);
    } catch (err) { }
  };

  const fetchLeaveTypes = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/leave-types`, { headers: { Authorization: `Bearer ${token}` } });
      setLeaveTypes(res.data.data || []);
    } catch (err) { }
  };

  const updateStatus = async (id, status) => {
    if (!canEdit) return toast.error("Permission denied");
    try {
      await axios.put(`${API_URL}/api/leaves/${id}`, { status }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success(`Leave ${status} successfully`);
      fetchLeaves();
    } catch (err) { toast.error(err.response?.data?.message || "Update failed"); }
  };

  const handleAdjustSubmit = async (e) => {
    e.preventDefault();
    if (!canEdit) return toast.error("Permission denied");
    setBtnLoading(true);
    try {
      await axios.put(`${API_URL}/api/leaves/balance/adjust`, adjustForm, { headers: { Authorization: `Bearer ${token}` } });
      toast.success("Balance Adjusted Successfully!");
      setActiveModal(null);
      setAdjustForm({ ...adjustForm, days: "", reason: "" });
    } catch (err) { toast.error(err.response?.data?.message || "Adjustment Failed"); }
    finally { setBtnLoading(false); }
  };

  const handleRunAccrual = async () => {
    if (!canCreate) return toast.error("Permission denied");
    if(!window.confirm("Run monthly accrual? This credits leaves to all eligible employees.")) return;
    setBtnLoading(true);
    try {
      await axios.post(`${API_URL}/api/leaves/apply-monthly-accrual`, 
        { leaveTypeId: accrualLeaveType }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Accrual Process Completed!");
      setActiveModal(null);
    } catch (err) { toast.error(err.response?.data?.message || "Accrual Failed"); }
    finally { setBtnLoading(false); }
  };

  const handleCarryForward = async (e) => {
    e.preventDefault();
    if (!canEdit) return toast.error("Permission denied");
    if(!window.confirm(`Transfer balances from ${cfYear.oldYear} to ${cfYear.newYear}?`)) return;
    setBtnLoading(true);
    try {
      await axios.post(`${API_URL}/api/leaves/carry-forward`, cfYear, { headers: { Authorization: `Bearer ${token}` } });
      toast.success("Carry Forward Processed!");
      setActiveModal(null);
    } catch (err) { toast.error(err.response?.data?.message || "Failed"); }
    finally { setBtnLoading(false); }
  };

  const filteredLeaves = leaves.filter(l => 
    l.status === filter &&
    (l.employeeId?.name?.toLowerCase().includes(search.toLowerCase()) || 
     l.leaveType?.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="lreq-wrapper">
      
      {/* TOOLBAR */}
      <div className="lreq-toolbar">
        <div className="lreq-status-filters">
          {["Pending", "Approved", "Rejected"].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`lreq-filter-btn ${filter === status ? "active" : ""}`}
            >
              {status}
            </button>
          ))}
        </div>

        <div className="lreq-actions-bar">
          {(canEdit || canCreate) && (
             <div className="lreq-btn-group">
                {canEdit && (
                  <button onClick={() => setActiveModal('adjust')} className="lreq-btn btn-purple">
                      <BiWallet /> <span className="d-none d-sm-inline">Adjust</span>
                  </button>
                )}
                {canCreate && (
                    <button onClick={() => setActiveModal('accrual')} className="lreq-btn btn-indigo">
                        <BiPlus /> <span className="d-none d-sm-inline">Credit</span>
                    </button>
                )}
                {canEdit && (
                  <button onClick={() => setActiveModal('carryForward')} className="lreq-btn btn-orange">
                      <BiCalendar /> <span className="d-none d-sm-inline">Carry Fwd</span>
                  </button>
                )}
             </div>
          )}

          <div className="lreq-search-box">
            <BiSearch className="search-icon" />
            <input 
              type="text" 
              placeholder="Search employee..." 
              className="search-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* TABLE */}
      <div className="lreq-table-card">
        <div className="lreq-table-responsive">
          <table className="lreq-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Leave Type</th>
                <th>Duration</th>
                <th>Days</th>
                <th>Reason</th>
                <th>Status</th>
                {canEdit && filter === "Pending" && <th className="text-right">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7" className="text-center py-5"><BiLoaderAlt className="animate-spin text-3xl mx-auto text-primary" /></td></tr>
              ) : filteredLeaves.length === 0 ? (
                <tr><td colSpan="7" className="text-center py-5 text-muted">No {filter.toLowerCase()} requests found.</td></tr>
              ) : (
                filteredLeaves.map((leave) => (
                  <tr key={leave._id}>
                    <td data-label="Employee">
                      <div className="emp-name">{leave.employeeId?.name || "Self"}</div>
                      <div className="emp-email">{leave.employeeId?.email}</div>
                    </td>
                    <td data-label="Leave Type">
                        <span className="lreq-badge badge-outline">
                            {leave.leaveType}
                        </span>
                    </td>
                    <td data-label="Duration" className="fw-medium">
                      {new Date(leave.startDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} - {new Date(leave.endDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                    </td>
                    <td data-label="Days" className="fw-bold">{leave.days}</td>
                    <td data-label="Reason" className="reason-text" title={leave.reason}>
                      {leave.reason}
                    </td>
                    <td data-label="Status">
                      <span className={`lreq-status-pill ${leave.status.toLowerCase()}`}>
                        {leave.status === 'Approved' && <BiCheck/>}
                        {leave.status === 'Rejected' && <BiX/>}
                        {leave.status}
                      </span>
                    </td>
                    
                    {canEdit && filter === "Pending" && (
                        <td data-label="Actions" className="text-right mobile-action-left">
                          <div className="lreq-action-btns">
                            <button onClick={() => updateStatus(leave._id, "Approved")} className="action-btn btn-approve" title="Approve">
                                <BiCheck size={20}/>
                            </button>
                            <button onClick={() => updateStatus(leave._id, "Rejected")} className="action-btn btn-reject" title="Reject">
                                <BiX size={20}/>
                            </button>
                          </div>
                        </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= MODALS ================= */}

      {/* Adjust Balance Modal */}
      {activeModal === 'adjust' && (
        <div className="lreq-modal-overlay show" onClick={() => setActiveModal(null)}>
          <div className="lreq-modal-dialog" onClick={e => e.stopPropagation()}>
             <div className="lreq-modal-header">
                <h3 className="modal-title"><BiWallet className="text-purple"/> Adjust Balance</h3>
                <button onClick={() => setActiveModal(null)} className="btn-close-modal"><BiX /></button>
             </div>
             <form onSubmit={handleAdjustSubmit} className="lreq-modal-body">
                <div className="form-group">
                  <label className="form-label">Employee</label>
                  <select className="lreq-input form-select" value={adjustForm.employeeId} onChange={e => setAdjustForm({...adjustForm, employeeId: e.target.value})} required>
                      <option value="">Select Employee</option>
                      {employees.map(e => <option key={e._id} value={e._id}>{e.name}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Leave Type</label>
                  <select className="lreq-input form-select" value={adjustForm.leaveTypeId} onChange={e => setAdjustForm({...adjustForm, leaveTypeId: e.target.value})} required>
                      <option value="">Select Leave Type</option>
                      {leaveTypes.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
                  </select>
                </div>

                <div className="lreq-radio-group">
                    <label className="lreq-radio">
                        <input type="radio" name="adj" value="add" checked={adjustForm.adjustmentType === 'add'} onChange={() => setAdjustForm({...adjustForm, adjustmentType: 'add'})} />
                        <span className="text-success fw-bold">Credit (+)</span>
                    </label>
                    <label className="lreq-radio">
                        <input type="radio" name="adj" value="deduct" checked={adjustForm.adjustmentType === 'deduct'} onChange={() => setAdjustForm({...adjustForm, adjustmentType: 'deduct'})} />
                        <span className="text-danger fw-bold">Debit (-)</span>
                    </label>
                </div>

                <div className="form-group">
                  <label className="form-label">Days to Adjust</label>
                  <input type="number" step="0.5" placeholder="e.g. 1.5" className="lreq-input form-control" value={adjustForm.days} onChange={e => setAdjustForm({...adjustForm, days: e.target.value})} required />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Reason</label>
                  <input type="text" placeholder="Reason for adjustment" className="lreq-input form-control" value={adjustForm.reason} onChange={e => setAdjustForm({...adjustForm, reason: e.target.value})} required />
                </div>

                <button type="submit" disabled={btnLoading} className="lreq-btn-submit w-100 mt-2">
                    {btnLoading ? <BiLoaderAlt className="animate-spin"/> : "Update Balance"}
                </button>
             </form>
          </div>
        </div>
      )}

      {/* Monthly Accrual Modal */}
      {activeModal === 'accrual' && (
        <div className="lreq-modal-overlay show" onClick={() => setActiveModal(null)}>
          <div className="lreq-modal-dialog" onClick={e => e.stopPropagation()}>
             <div className="lreq-modal-header">
                <h3 className="modal-title"><BiPlus className="text-indigo"/> Run Monthly Accrual</h3>
                <button onClick={() => setActiveModal(null)} className="btn-close-modal"><BiX /></button>
             </div>
             <div className="lreq-modal-body">
                <p className="modal-info-text">
                    This action will calculate and credit leaves for the current month based on defined policies. It checks joining dates and duplication.
                </p>
                <div className="form-group">
                  <label className="form-label">Select Policy</label>
                  <select className="lreq-input form-select" value={accrualLeaveType} onChange={(e) => setAccrualLeaveType(e.target.value)}>
                      <option value="">-- All Monthly Policies --</option>
                      {leaveTypes.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
                  </select>
                </div>
                <button onClick={handleRunAccrual} disabled={btnLoading} className="lreq-btn-submit w-100 mt-2 btn-indigo">
                    {btnLoading ? <BiLoaderAlt className="animate-spin"/> : "Execute Accrual"}
                </button>
             </div>
          </div>
        </div>
      )}

      {/* Carry Forward Modal */}
      {activeModal === 'carryForward' && (
        <div className="lreq-modal-overlay show" onClick={() => setActiveModal(null)}>
          <div className="lreq-modal-dialog" onClick={e => e.stopPropagation()}>
             <div className="lreq-modal-header">
                <h3 className="modal-title"><BiCalendar className="text-orange"/> Year-End Carry Forward</h3>
                <button onClick={() => setActiveModal(null)} className="btn-close-modal"><BiX /></button>
             </div>
             <form onSubmit={handleCarryForward} className="lreq-modal-body">
                <p className="modal-info-text">Transfer lapsable leaves to the new year based on policy limits.</p>
                <div className="lreq-flex-row">
                    <div className="form-group flex-1">
                        <label className="form-label text-center">From Year</label>
                        <input type="number" className="lreq-input form-control text-center fw-bold" value={cfYear.oldYear} onChange={e => setCfYear({...cfYear, oldYear: e.target.value})} />
                    </div>
                    <span className="text-muted fw-bold mt-3">➜</span>
                    <div className="form-group flex-1">
                        <label className="form-label text-center">To Year</label>
                        <input type="number" className="lreq-input form-control text-center fw-bold" value={cfYear.newYear} onChange={e => setCfYear({...cfYear, newYear: e.target.value})} />
                    </div>
                </div>
                <button type="submit" disabled={btnLoading} className="lreq-btn-submit w-100 mt-3 btn-orange">
                    {btnLoading ? <BiLoaderAlt className="animate-spin"/> : "Process Transfer"}
                </button>
             </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default LeaveRequests;