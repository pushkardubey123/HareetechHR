import React, { useEffect, useState } from "react";
import axios from "axios";
import AdminLayout from "./AdminLayout";
import "./AttendencePanel.css"; 
import moment from "moment";
import {
  FaSearch, FaTrash, FaUserEdit, FaClock,
  FaCalendarAlt, FaLayerGroup,
  FaFilter, FaTimes, FaExclamationTriangle, FaSyncAlt,
  FaCheckCircle, FaBed, FaUmbrellaBeach,
  FaChevronLeft, FaChevronRight, FaEye
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
  const [activeModal, setActiveModal] = useState(null); 
  const [selectedRecord, setSelectedRecord] = useState(null);
  
  // --- HISTORY / DETAIL MODAL STATE (New) ---
  const [historyData, setHistoryData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5; // Pagination limit per page inside modal

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
        // 1. Clean Duplicates
        await axios.delete(`${API_URL}/api/attendance/remove-duplicates`, {
             headers: { Authorization: `Bearer ${token}` }
        });

        // 2. Sync Past Data
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
  
  // 1. Open Detailed History Modal (New Feature)
  const openHistoryModal = (record) => {
    // Filter all records for this specific employee from the main state
    const employeeHistory = attendance.filter(
        item => item.employeeId?._id === record.employeeId?._id
    );
    // Sort by date descending
    employeeHistory.sort((a, b) => new Date(b.__date) - new Date(a.__date));
    
    setHistoryData(employeeHistory);
    setSelectedRecord(record); // Just for name reference
    setCurrentPage(1); // Reset to page 1
    setActiveModal("history");
  };

  // Pagination Logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentHistoryItems = historyData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(historyData.length / itemsPerPage);

  const openStatusModal = (record, e) => {
    e.stopPropagation(); // Stop row click
    setSelectedRecord(record);
    setStatusForm(record.status);
    setActiveModal("status");
  };

  const openActionModal = (record, e) => {
    e.stopPropagation(); // Stop row click
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
      // Reload logic...
      window.location.reload(); // Simple reload for now to refresh data
    } catch (err) { alert("Failed to update status"); }
  };

  const saveAction = async () => {
    try {
      const isCheckoutFix = actionForm.mode === "AUTO" || actionForm.mode === "MANUAL";
      const payload = { 
        attendanceId: selectedRecord._id,
        action: isCheckoutFix ? "MANUAL_CHECKOUT" : "UPDATE_OT",
        manualOutTime: actionForm.mode === "MANUAL" && actionForm.time 
          ? moment(actionForm.time, "HH:mm").format("hh:mm:ss A") : null,
        overtimeMinutes: parseInt(actionForm.manualMinutes) || 0,
        approveOT: String(actionForm.approveOT) === "true"
      };

      await axios.put(`${API_URL}/api/attendance/approve-action`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      window.location.reload(); 
    } catch (err) { alert("Action Failed"); }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
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
            <span>Click on any row to view full employee history & logs.</span>
          </div>
          <div className="d-flex gap-2">
            <button className="btn btn-primary d-flex align-items-center gap-2" onClick={() => window.location.reload()}>
                <FaSyncAlt/> Refresh
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
                </select>
            </div>
          </div>
        </div>

        {/* MAIN TABLE (Summarized View) */}
        <div className="att-table-wrapper">
          {loading ? <TableLoader /> : (
            <table className="att-table">
              <thead>
                <tr>
                  <th>Employee Profile</th>
                  <th>Date</th>
                  <th>Current Status</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length > 0 ? filtered.map(item => {
                   const isAbsent = item.status === 'Absent';
                   const isOnLeave = item.status === 'On Leave';
                   const isHoliday = item.status === 'Holiday';
                   const isWeekend = item.status === 'Weekly Off';
                   const lastLog = item.inOutLogs[item.inOutLogs.length - 1];
                   const isMissing = lastLog && !lastLog.outTime;

                  return (
                    // ROW CLICK EVENT ADDED HERE
                    <tr key={item._id} onClick={() => openHistoryModal(item)} style={{cursor: 'pointer'}}>
                      
                      {/* 1. Employee Profile */}
                      <td>
                        <div className="user-cell">
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

                      {/* 3. Status Badge (Simplified) */}
                      <td>
                        <span className={`badge-custom badge-${item.status.toLowerCase().replace(/\s/g, '')}`}>
                          {item.status}
                        </span>
                        {/* Mini indicator if action needed */}
                        {isMissing && <span className="ms-2 text-danger" style={{fontSize:'10px'}}>● Checkout Pending</span>}
                      </td>

                      {/* 4. Actions (Stop Propagation to prevent modal opening) */}
                      <td className="text-center">
                        <div className="d-flex justify-content-center gap-2">
                          <button className="btn-icon" title="View Details">
                             <FaEye /> {/* Visual Cue for Click */}
                          </button>
                          <button className="btn-icon" title="Edit Status" onClick={(e) => openStatusModal(item, e)}>
                            <FaUserEdit />
                          </button>
                          {!isAbsent && !isOnLeave && !isHoliday && !isWeekend && (
                            <button className={`btn-icon ${isMissing ? 'danger' : ''}`} title="Logs" onClick={(e) => openActionModal(item, e)}>
                              {isMissing ? <FaExclamationTriangle /> : <FaClock />}
                            </button>
                          )}
                          <button className="btn-icon danger" title="Delete" onClick={(e) => handleDelete(item._id, e)}>
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                }) : (
                  <tr><td colSpan="4" className="text-center p-4 text-muted">No records found</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* --- MODALS --- */}

        {/* 1. HISTORY / DETAILS MODAL (WITH PAGINATION) */}
        {activeModal === 'history' && (
             <div className="custom-modal-overlay">
             <div className="custom-modal-dialog modal-lg"> {/* modal-lg class for wider width */}
               <div className="custom-modal-header">
                 <div>
                    <h5 className="custom-modal-title">{selectedRecord?.employeeId?.name}</h5>
                    <span style={{fontSize:'0.8rem', color:'var(--att-text-sub)'}}>Full Attendance History</span>
                 </div>
                 <button className="btn-icon" onClick={closeModal}><FaTimes/></button>
               </div>
               
               <div className="custom-modal-body">
                  <div className="table-responsive">
                    <table className="table table-bordered table-sm" style={{fontSize:'0.85rem'}}>
                        <thead className="table-light">
                            <tr>
                                <th>Date</th>
                                <th>Status</th>
                                <th>In Time</th>
                                <th>Out Time</th>
                                <th>Total Hrs</th>
                                <th>OT</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentHistoryItems.map((hist) => {
                                const firstLog = hist.inOutLogs[0];
                                const lastLog = hist.inOutLogs[hist.inOutLogs.length - 1];
                                return (
                                    <tr key={hist._id}>
                                        <td>{moment(hist.__date).format("DD MMM YYYY")}</td>
                                        <td>
                                            <span className={`badge-custom badge-${hist.status.toLowerCase().replace(/\s/g, '')}`} style={{fontSize:'0.7rem', padding:'2px 6px'}}>
                                                {hist.status}
                                            </span>
                                        </td>
                                        <td>{firstLog?.inTime || '-'}</td>
                                        <td>{lastLog?.outTime || '-'}</td>
                                        <td>{hist.totalHours ? `${hist.totalHours}h` : '-'}</td>
                                        <td>{hist.overtimeMinutes > 0 ? `${hist.overtimeMinutes}m` : '-'}</td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                  </div>

                  {/* Pagination Controls */}
                  <div className="d-flex justify-content-between align-items-center mt-3">
                      <button 
                        className="btn btn-sm btn-secondary" 
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(prev => prev - 1)}
                      >
                          <FaChevronLeft /> Prev
                      </button>
                      
                      <span style={{fontSize:'0.9rem', fontWeight:'600'}}>
                          Page {currentPage} of {totalPages}
                      </span>

                      <button 
                        className="btn btn-sm btn-secondary" 
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(prev => prev + 1)}
                      >
                          Next <FaChevronRight />
                      </button>
                  </div>
               </div>
             </div>
           </div>
        )}

        {/* 2. STATUS UPDATE MODAL (Existing) */}
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

        {/* 3. ACTION MODAL (Existing - keeping it hidden for brevity but logic is there above) */}
        {activeModal === 'action' && (
           <div className="custom-modal-overlay">
              <div className="custom-modal-dialog">
                <div className="custom-modal-header">
                    <h5 className="custom-modal-title">Fix Logs / Overtime</h5>
                    <button className="btn-icon" onClick={closeModal}><FaTimes/></button>
                </div>
                <div className="custom-modal-body">
                     {/* Your existing Action Form Inputs go here (omitted for brevity, keep your original form code) */}
                     <p>Time Adjustment Logic Here...</p>
                </div>
                <div className="custom-modal-footer">
                    <button className="btn btn-secondary" onClick={closeModal}>Close</button>
                    <button className="btn btn-primary" onClick={saveAction}>Save</button>
                </div>
              </div>
           </div>
        )}

      </div>
    </AdminLayout>
  );
};

export default AdminAttendancePanel;