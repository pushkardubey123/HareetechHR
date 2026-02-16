import React, { useEffect, useState } from "react";
import axios from "axios";
import AdminLayout from "./AdminLayout";
import "./AttendencePanel.css"; 
import moment from "moment";
import {
  FaSearch, FaTrash, FaUserEdit, FaClock,
  FaFileCsv, FaFilePdf, FaCalendarAlt, FaLayerGroup,
  FaFilter, FaTimes, FaExclamationTriangle, FaSyncAlt,
  FaCheckCircle, FaBed, FaUmbrellaBeach
} from "react-icons/fa";
import TableLoader from "./Loader/Loader"; // Ensure you have this or remove it
import { useNavigate } from "react-router-dom";

const AdminAttendancePanel = () => {
  // --- STATE ---
  const [attendance, setAttendance] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [filters, setFilters] = useState({ status: "", branch: "", date: "", search: "" });
  const [loading, setLoading] = useState(false);
  const [branches, setBranches] = useState([]);
  
  // --- MODAL STATE ---
  const [activeModal, setActiveModal] = useState(null); 
  const [selectedRecord, setSelectedRecord] = useState(null);
  
  // Form States
  const [statusForm, setStatusForm] = useState("Present");
  const [actionForm, setActionForm] = useState({ 
    mode: "MANUAL_OT", 
    time: "", 
    manualMinutes: 0, 
    approveOT: false 
  });

  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL;
  const token = JSON.parse(localStorage.getItem("user"))?.token;

  // --- INITIALIZATION (AUTO SYNC & FETCH) ---
useEffect(() => {
    const initializeData = async () => {
      if (!token) return;
      setLoading(true);
      
      try {
        // 1. Clean Duplicates First (Safety Step)
        await axios.delete(`${API_URL}/api/attendance/remove-duplicates`, {
             headers: { Authorization: `Bearer ${token}` }
        });

        // 2. Sync Past Data (Fixes Absent vs Leave logic)
        await axios.post(`${API_URL}/api/attendance/sync`, {}, {
            headers: { Authorization: `Bearer ${token}` }
        });

        // 3. Fetch Fresh Data
        const res = await axios.get(`${API_URL}/api/attendance`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (res.data.success) {
          const flatData = [];
          Object.keys(res.data.data).forEach(date => {
            res.data.data[date].forEach(r => flatData.push({ ...r, __date: date }));
          });
          
          // Sort Descending
          flatData.sort((a, b) => new Date(b.__date) - new Date(a.__date));
          setAttendance(flatData);
          
          const uniqueBranches = [...new Set(flatData.map(a => a.branchId?.name).filter(Boolean))];
          setBranches(uniqueBranches);
        }
      } catch (err) {
        console.error("Data Load Error:", err);
      } finally {
        setLoading(false);
      }
    };

    initializeData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // --- FILTER LOGIC ---
  useEffect(() => {
    const data = attendance.filter(a => {
      const name = a.employeeId?.name?.toLowerCase() || "";
      // Handle "On Leave" normalization for filtering
      const statusCheck = filters.status 
        ? a.status.toLowerCase() === filters.status.toLowerCase() 
        : true;

      return statusCheck &&
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
    // Logic: Cannot manage logs for Absent/Leave/Holiday
    if(["Absent", "On Leave", "Holiday", "Weekly Off"].includes(record.status)) {
        alert(`Cannot manage logs for ${record.status} status.`);
        return;
    }

    setSelectedRecord(record);
    const lastLog = record.inOutLogs[record.inOutLogs.length - 1];
    const isMissingCheckout = lastLog && !lastLog.outTime;

    setActionForm({
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
        await axios.put(`${API_URL}/api/attendance/${selectedRecord._id}`, 
        { status: statusForm, statusType: "Manual" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Reload page content
      const res = await axios.get(`${API_URL}/api/attendance`, { headers: { Authorization: `Bearer ${token}` } });
      if(res.data.success) {
          const flatData = [];
          Object.keys(res.data.data).forEach(date => {
            res.data.data[date].forEach(r => flatData.push({ ...r, __date: date }));
          });
          flatData.sort((a, b) => new Date(b.__date) - new Date(a.__date));
          setAttendance(flatData);
      }
      closeModal();
    } catch (err) { alert("Failed to update status"); }
  };

  const saveAction = async () => {
    try {
      const isCheckoutFix = actionForm.mode === "AUTO" || actionForm.mode === "MANUAL";
      const payload = { 
        attendanceId: selectedRecord._id,
        action: isCheckoutFix ? "MANUAL_CHECKOUT" : "UPDATE_OT", // Ensure backend handles this
        manualOutTime: actionForm.mode === "MANUAL" && actionForm.time 
          ? moment(actionForm.time, "HH:mm").format("hh:mm:ss A") : null,
        overtimeMinutes: parseInt(actionForm.manualMinutes) || 0,
        approveOT: String(actionForm.approveOT) === "true"
      };

      await axios.put(`${API_URL}/api/attendance/approve-action`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      closeModal();
      // Re-fetch data logic here (same as saveStatus)
    } catch (err) { alert("Action Failed"); }
  };

  const handleDelete = async (id) => {
    if(window.confirm("Delete this record permanently?")) {
      await axios.delete(`${API_URL}/api/attendance/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAttendance(prev => prev.filter(item => item._id !== id));
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
            {/* Auto-sync happens on load, but manual refresh is here */}
            <button className="btn btn-primary d-flex align-items-center gap-2" onClick={() => window.location.reload()}>
                <FaSyncAlt/> Refresh Data
            </button>
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
                <option value="On Leave">On Leave</option>
                <option value="Absent">Absent</option>
                <option value="Late">Late</option>
                <option value="Holiday">Holiday</option>
                <option value="Weekly Off">Weekly Off</option>
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
                  
                  // Status Flags
                  const isAbsent = item.status === 'Absent';
                  const isOnLeave = item.status === 'On Leave';
                  const isHoliday = item.status === 'Holiday';
                  const isWeekend = item.status === 'Weekly Off';

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

                      {/* 3. Status Badge */}
                      <td>
                        <span className={`badge-custom badge-${item.status.toLowerCase().replace(/\s/g, '')}`}>
                          {item.status}
                        </span>
                      </td>

                      {/* 4. Attention/OT/Info */}
                      <td>
                        {isAbsent ? (
                          <div className="status-empty"><FaTimes size={10} /> No Shift Log</div>
                        ) : isOnLeave ? (
                          <div className="status-leave">
                             {/* Show Leave Type if saved in remarks/adminCheckoutTime */}
                             <FaCalendarAlt size={12} /> {item.adminCheckoutTime || "Authorized Leave"}
                          </div>
                        ) : isHoliday ? (
                            <div className="status-holiday" style={{color: '#059669', background: '#ecfdf5', padding: '5px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600}}>
                                <FaUmbrellaBeach size={12} /> Holiday
                            </div>
                        ) : isWeekend ? (
                            <div className="status-weekend" style={{color: '#6b7280', background: '#f3f4f6', padding: '5px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600}}>
                                <FaBed size={12} /> Weekly Off
                            </div>
                        ) : isMissing ? (
                          <div className="alert-missing"><FaExclamationTriangle /> Checkout Pending</div>
                        ) : hasOT ? (
                          <div className={`ot-indicator ${item.overtimeApproved ? 'ot-approved' : 'ot-pending'}`}>
                            {item.overtimeMinutes}m OT {item.overtimeApproved ? '✓' : ''}
                          </div>
                        ) : (
                          <div className="status-standard"><FaCheckCircle /> Standard Shift</div>
                        )}
                      </td>

                      {/* 5. Actions */}
                      <td className="text-center">
                        <div className="d-flex justify-content-center gap-2">
                          <button className="btn-icon" title="Edit Status" onClick={() => openStatusModal(item)}>
                            <FaUserEdit />
                          </button>
                          
                          {/* Log Button only if user was actually present */}
                          {!isAbsent && !isOnLeave && !isHoliday && !isWeekend && (
                            <button className={`btn-icon ${isMissing ? 'danger' : ''}`} title="Logs" onClick={() => openActionModal(item)}>
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

        {/* MODALS - KEEP EXISTING MODAL CODE HERE (Same as previous) */}
        {/* ... [Insert Status Modal Code Here] ... */}
        {/* ... [Insert Action Modal Code Here] ... */}
        
        {/* Simplified Status Modal for Context */}
        {activeModal === 'status' && (
          <div className="custom-modal-overlay">
            <div className="custom-modal-dialog">
              <div className="custom-modal-header">
                <h5 className="custom-modal-title">Update Status</h5>
                <button className="btn-icon" onClick={closeModal}><FaTimes/></button>
              </div>
              <div className="custom-modal-body">
                <p>Employee: <b>{selectedRecord?.employeeId?.name}</b></p>
                <select className="form-select" value={statusForm} onChange={e => setStatusForm(e.target.value)}>
                  <option value="Present">Present</option>
                  <option value="Absent">Absent</option>
                  <option value="On Leave">On Leave</option>
                  <option value="Late">Late</option>
                  <option value="Half Day">Half Day</option>
                  <option value="Holiday">Holiday</option>
                  <option value="Weekly Off">Weekly Off</option>
                </select>
              </div>
              <div className="custom-modal-footer">
                <button className="btn btn-secondary" onClick={closeModal}>Cancel</button>
                <button className="btn btn-primary" onClick={saveStatus}>Update</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </AdminLayout>
  );
};

export default AdminAttendancePanel;