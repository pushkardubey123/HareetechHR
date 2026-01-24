import React, { useEffect, useState } from "react";
import axios from "axios";
import AdminLayout from "./AdminLayout";
import "./AttendencePanel.css"; // Ensure this matches the CSS file name
import moment from "moment";
import {
  FaSearch, FaTrash, FaUserEdit, FaClock,
  FaFileCsv, FaFilePdf, FaCalendarAlt, FaLayerGroup,
  FaFilter, FaTimes, FaExclamationTriangle, FaSyncAlt,
  FaCheckCircle
} from "react-icons/fa";
import TableLoader from "./Loader/Loader";
import { useNavigate } from "react-router-dom";

const AdminAttendancePanel = () => {
  // --- STATE ---
  const [attendance, setAttendance] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [filters, setFilters] = useState({ status: "", branch: "", date: "", search: "" });
  const [loading, setLoading] = useState(false);
  const [branches, setBranches] = useState([]);
  
  // --- MODAL STATE ---
  const [activeModal, setActiveModal] = useState(null); // 'status', 'action', or null
  const [selectedRecord, setSelectedRecord] = useState(null);
  
  // Form States
  const [statusForm, setStatusForm] = useState("Present");
  const [actionForm, setActionForm] = useState({ 
    mode: "MANUAL_OT", // 'AUTO', 'MANUAL', 'MANUAL_OT'
    time: "", 
    manualMinutes: 0,
    approveOT: false 
  });

  const navigate = useNavigate();
  const token = JSON.parse(localStorage.getItem("user"))?.token;

  // --- FETCH DATA ---
  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/attendance`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        const flatData = [];
        Object.keys(res.data.data).forEach(date => {
          res.data.data[date].forEach(r => flatData.push({ ...r, __date: date }));
        });
        setAttendance(flatData);
        const uniqueBranches = [...new Set(flatData.map(a => a.branchId?.name).filter(Boolean))];
        setBranches(uniqueBranches);
      }
    } catch (err) { console.error(err); } 
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  // --- FILTER LOGIC ---
  useEffect(() => {
    const data = attendance.filter(a => {
      const name = a.employeeId?.name?.toLowerCase() || "";
      return (!filters.status || a.status === filters.status) &&
             (!filters.branch || a.branchId?.name === filters.branch) &&
             (!filters.date || a.__date === filters.date) &&
             name.includes(filters.search.toLowerCase());
    });
    setFiltered(data);
  }, [filters, attendance]);

  // --- HANDLERS ---
  const openStatusModal = (record) => {
    setSelectedRecord(record);
    setStatusForm(record.status);
    setActiveModal("status");
  };

  const openActionModal = (record) => {
    if(record.status === 'Absent') return; // Cannot manage log for absent
    setSelectedRecord(record);
    
    // Determine context: Is checkout missing?
    const lastLog = record.inOutLogs[record.inOutLogs.length - 1];
    const isMissingCheckout = lastLog && !lastLog.outTime;

    setActionForm({
      // If checkout is missing, prioritize fixing it (AUTO), otherwise default to Manual OT
      mode: isMissingCheckout ? "AUTO" : "MANUAL_OT",
      time: "",
      manualMinutes: record.overtimeMinutes || 0,
      approveOT: record.overtimeApproved || false
    });
    setActiveModal("action");
  };

  const closeModal = () => { setActiveModal(null); setSelectedRecord(null); };

  // --- API ACTIONS ---
  const saveStatus = async () => {
    try {
        await axios.put(`${import.meta.env.VITE_API_URL}/api/attendance/${selectedRecord._id}`, 
        { status: statusForm, statusType: "Manual" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchData(); closeModal();
    } catch (err) { alert("Failed to update status"); }
  };

  const saveAction = async () => {
    try {
      // Logic: If mode is AUTO/MANUAL -> It's a Checkout Fix. If MANUAL_OT -> It's OT Update
      const isCheckoutFix = actionForm.mode === "AUTO" || actionForm.mode === "MANUAL";
      
      const payload = { 
        attendanceId: selectedRecord._id,
        action: isCheckoutFix ? "MANUAL_CHECKOUT" : "UPDATE_OT", // Backend must handle 'UPDATE_OT'
        
        // Payload for Checkout Fix
        manualOutTime: actionForm.mode === "MANUAL" && actionForm.time 
          ? moment(actionForm.time, "HH:mm").format("hh:mm:ss A") : null,
        
        // Payload for OT Update
        overtimeMinutes: parseInt(actionForm.manualMinutes) || 0,
        approveOT: actionForm.approveOT === "true" || actionForm.approveOT === true
      };

      await axios.put(`${import.meta.env.VITE_API_URL}/api/attendance/approve-action`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchData(); closeModal();
    } catch (err) { alert("Action Failed"); }
  };

  const handleDelete = async (id) => {
    if(window.confirm("Delete this record permanently?")) {
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/attendance/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchData();
    }
  };

  // --- RENDER ---
  return (
    <AdminLayout>
      <div className="att-premium-wrapper">
        
        {/* HEADER */}
        <div className="att-header">
          <div className="att-title">
            <h2>Attendance Manager</h2>
            <span>Track daily logs, resolve issues, and manage overtime.</span>
          </div>
          <div className="d-flex gap-2">
            <button className="btn btn-secondary d-flex align-items-center gap-2"><FaFilePdf/> PDF</button>
            <button className="btn btn-secondary d-flex align-items-center gap-2"><FaFileCsv/> CSV</button>
            <button className="btn btn-primary d-flex align-items-center gap-2" onClick={fetchData}><FaSyncAlt/> Refresh</button>
          </div>
        </div>

        {/* FILTERS */}
        <div className="att-card">
          <div className="att-filters">
            <div className="att-input-group">
              <FaSearch />
              <input placeholder="Search name..." value={filters.search} onChange={e => setFilters({...filters, search: e.target.value})} />
            </div>
            <div className="att-input-group">
              <FaLayerGroup />
              <select value={filters.branch} onChange={e => setFilters({...filters, branch: e.target.value})}>
                <option value="">All Branches</option>
                {branches.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div className="att-input-group">
              <FaCalendarAlt className="me-3" />
              <input type="date" className="border-none" value={filters.date} onChange={e => setFilters({...filters, date: e.target.value})} />
            </div>
            <div className="att-input-group">
              <FaFilter />
              <select value={filters.status} onChange={e => setFilters({...filters, status: e.target.value})}>
                <option value="">All Status</option>
                <option value="Present">Present</option>
                <option value="Late">Late</option>
                <option value="Absent">Absent</option>
              </select>
            </div>
          </div>
        </div>

        {/* TABLE */}
        <div className="att-table-wrapper">
          {loading ? <TableLoader /> : (
            <table className="att-table">
              <thead>
                <tr>
                  <th>Employee Profile</th>
                  <th>Date & Branch</th>
                  <th>Status</th>
                  <th>Attention & Overtime</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
<tbody>
  {filtered.length > 0 ? filtered.map(item => {
    const lastLog = item.inOutLogs[item.inOutLogs.length - 1];
    const isMissing = lastLog && !lastLog.outTime;
    const hasOT = item.overtimeMinutes > 0;
    const isAbsent = item.status === 'Absent';

    return (
      <tr key={item._id}>
        {/* 1. Employee Profile */}
        <td>
          <div className="user-cell" onClick={() => navigate(`/admin/employee/${item.employeeId?._id}`)}>
            <div className="user-avatar">{item.employeeId?.name?.charAt(0)}</div>
            <div className="user-details">
              <h6>{item.employeeId?.name}</h6>
              <span>{item.branchId?.name || "Main Branch"}</span>
            </div>
          </div>
        </td>

        {/* 2. Date */}
        <td>
          <div style={{fontWeight:600}}>{moment(item.__date).format("DD MMM, YYYY")}</div>
          <div style={{fontSize:'0.75rem', color:'var(--att-text-sub)'}}>{moment(item.__date).format("dddd")}</div>
        </td>

        {/* 3. Attendance Status */}
        <td>
          <span className={`badge-custom badge-${item.status.toLowerCase().replace(' ', '')}`}>
            {item.status}
          </span>
        </td>

        {/* 4. Attention & OT (UPDATED LOGIC) */}
        <td>
          {isAbsent ? (
            /* CASE: Absent -> "No Log" badge */
            <div className="status-empty">
               <FaTimes size={10} /> No Shift Log
            </div>
          ) : isMissing ? (
            /* CASE: Checkout Pending -> RED Alert */
            <div className="alert-missing">
              <FaExclamationTriangle /> Checkout Pending
            </div>
          ) : hasOT ? (
            /* CASE: Overtime -> OT Badge */
            <div className={`ot-indicator ${item.overtimeApproved ? 'ot-approved' : 'ot-pending'}`}>
              {item.overtimeMinutes}m OT {item.overtimeApproved ? '✓' : ''}
            </div>
          ) : (
            /* CASE: Normal Shift -> Standard Badge (Bhara hua look) */
            <div className="status-standard">
              <FaCheckCircle /> Standard Shift
            </div>
          )}
        </td>

        {/* 5. Actions */}
        <td className="text-center">
          <div className="d-flex justify-content-center gap-2">
            <button className="btn-icon" title="Edit Status" onClick={() => openStatusModal(item)}>
              <FaUserEdit />
            </button>
            
            {/* Log Management Button (Always Visible unless Absent) */}
            {!isAbsent && (
              <button 
                className={`btn-icon ${isMissing ? 'danger' : ''}`} 
                title="Manage Logs / OT" 
                onClick={() => openActionModal(item)}
              >
                {isMissing ? <FaExclamationTriangle /> : <FaClock />}
              </button>
            )}

            <button className="btn-icon danger" title="Delete" onClick={() => handleDelete(item._id)}>
              <FaTrash />
            </button>
          </div>
        </td>
      </tr>
    )
  }) : (
    <tr><td colSpan="5" className="text-center p-4 text-muted">No records found</td></tr>
  )}
</tbody>
            </table>
          )}
        </div>

        {/* --- STATUS UPDATE MODAL --- */}
        {activeModal === 'status' && (
          <div className="custom-modal-overlay">
            <div className="custom-modal-dialog">
              <div className="custom-modal-header">
                <h5 className="custom-modal-title">Update Status</h5>
                <button className="btn-icon" onClick={closeModal}><FaTimes/></button>
              </div>
              <div className="custom-modal-body">
                <p>Employee: <b>{selectedRecord?.employeeId?.name}</b></p>
                <label className="form-label">Mark Attendance As</label>
                <select className="form-select" value={statusForm} onChange={e => setStatusForm(e.target.value)}>
                  <option value="Present">Present</option>
                  <option value="Late">Late</option>
                  <option value="Absent">Absent</option>
                  <option value="Half Day">Half Day</option>
                </select>
              </div>
              <div className="custom-modal-footer">
                <button className="btn btn-secondary" onClick={closeModal}>Cancel</button>
                <button className="btn btn-primary" onClick={saveStatus}>Update Status</button>
              </div>
            </div>
          </div>
        )}

        {/* --- LOG & OT MANAGEMENT MODAL --- */}
        {activeModal === 'action' && (
          <div className="custom-modal-overlay">
            <div className="custom-modal-dialog">
              <div className="custom-modal-header">
                <h5 className="custom-modal-title">Log & OT Management</h5>
                <button className="btn-icon" onClick={closeModal}><FaTimes/></button>
              </div>
              <div className="custom-modal-body">
                <p className="mb-3">Managing: <b>{selectedRecord?.employeeId?.name}</b></p>
                
                <label className="form-label">Action Type</label>
                <select className="form-select mb-3" value={actionForm.mode} onChange={e => setActionForm({...actionForm, mode: e.target.value})}>
                  <option value="MANUAL_OT">Manage Overtime (Minutes)</option>
                  <option value="AUTO">Fix Missing Checkout (Auto-Fill)</option>
                  <option value="MANUAL">Fix Missing Checkout (Manual Time)</option>
                </select>

                {/* --- CASE 1: MANUAL OT INPUT --- */}
                {actionForm.mode === "MANUAL_OT" && (
                  <div className="p-3 bg-light rounded border mb-2" style={{background:'var(--att-input-bg)'}}>
                    <label className="form-label">Overtime Duration (Minutes)</label>
                    <input 
                      type="number" 
                      className="form-control mb-3" 
                      placeholder="e.g. 60"
                      value={actionForm.manualMinutes}
                      onChange={e => setActionForm({...actionForm, manualMinutes: e.target.value})}
                    />
                    
                    <label className="form-label">Approval Status</label>
                    <select className="form-select" value={actionForm.approveOT} onChange={e => setActionForm({...actionForm, approveOT: e.target.value})}>
                      <option value="false">Pending</option>
                      <option value="true">Approved</option>
                    </select>
                  </div>
                )}

                {/* --- CASE 2: MANUAL CHECKOUT TIME --- */}
                {actionForm.mode === "MANUAL" && (
                  <div className="p-3 bg-light rounded border" style={{background:'var(--att-input-bg)'}}>
                     <label className="form-label">Select Checkout Time</label>
                     <input type="time" className="form-control" value={actionForm.time} onChange={e => setActionForm({...actionForm, time: e.target.value})} />
                  </div>
                )}

                {/* --- CASE 3: AUTO CHECKOUT --- */}
                {actionForm.mode === "AUTO" && (
                   <p className="small text-muted">System will automatically set the shift end time based on the shift policy.</p>
                )}

              </div>
              <div className="custom-modal-footer">
                <button className="btn btn-secondary" onClick={closeModal}>Close</button>
                <button className="btn btn-primary" onClick={saveAction}>Apply Changes</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </AdminLayout>
  );
};

export default AdminAttendancePanel;