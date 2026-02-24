import React, { useEffect, useState, useMemo, useContext } from "react";
import axios from "axios";
import AdminLayout from "./AdminLayout";
import "./AttendencePanel.css"; 
import moment from "moment";
import {
  FaSearch, FaTrash, FaUserEdit, FaClock,
  FaCalendarAlt, FaLayerGroup,
  FaFilter, FaTimes, FaExclamationTriangle, FaSyncAlt,
  FaCheckCircle, FaBed, FaUmbrellaBeach, FaHistory, FaChevronLeft, FaChevronRight, FaFilePdf
} from "react-icons/fa";
import TableLoader from "./Loader/Loader"; 
import { useNavigate } from "react-router-dom";

// --- PDF IMPORTS ---
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { SettingsContext } from "../Redux/SettingsContext";
import { addCommonHeaderFooter, addCommonFooter } from "../../Utils/pdfHeaderFooter";

const AdminAttendancePanel = () => {
  // --- STATE ---
  const [allLogs, setAllLogs] = useState([]); 
  const [groupedData, setGroupedData] = useState([]); 
  const [filteredEmployees, setFilteredEmployees] = useState([]); 
  const [loading, setLoading] = useState(false);
  const [branches, setBranches] = useState([]);
  
  // Settings Context for PDF
  const { settings } = useContext(SettingsContext);

  // --- MAIN TABLE PAGINATION ---
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10); 

// --- HISTORY MODAL STATE ---
  const [historyPage, setHistoryPage] = useState(1);
  const [historyMonthFilter, setHistoryMonthFilter] = useState(""); // Format: YYYY-MM
  const historyItemsPerPage = 5; 

  // --- MODAL STATE ---
  const [activeModal, setActiveModal] = useState(null); 
  const [selectedRecord, setSelectedRecord] = useState(null); 
  const [selectedHistory, setSelectedHistory] = useState(null); 
  
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
  
  const [filters, setFilters] = useState({ status: "", branch: "", date: "", search: "" });

  // --- INITIALIZATION ---
  useEffect(() => {
    const initializeData = async () => {
      if (!token) return;
      setLoading(true);
      try {
        await axios.delete(`${API_URL}/api/attendance/remove-duplicates`, { headers: { Authorization: `Bearer ${token}` } });
        await axios.post(`${API_URL}/api/attendance/sync`, {}, { headers: { Authorization: `Bearer ${token}` } });
        const res = await axios.get(`${API_URL}/api/attendance`, { headers: { Authorization: `Bearer ${token}` } });

        if (res.data.success) {
          const flatData = [];
          Object.keys(res.data.data).forEach(date => {
            res.data.data[date].forEach(r => flatData.push({ ...r, __date: date }));
          });
          flatData.sort((a, b) => new Date(b.__date) - new Date(a.__date));
          setAllLogs(flatData);
          const uniqueBranches = [...new Set(flatData.map(a => a.branchId?.name).filter(Boolean))];
          setBranches(uniqueBranches);
        }
      } catch (err) { console.error("Error:", err); } 
      finally { setLoading(false); }
    };
    initializeData();
  }, [token]);

  // --- GROUPING LOGIC ---
  useEffect(() => {
    if (!allLogs.length) return;
    const groups = {};
    allLogs.forEach(log => {
        const empId = log.employeeId?._id;
        if (!empId) return;
        if (!groups[empId]) {
            groups[empId] = {
                employee: log.employeeId,
                branch: log.branchId,
                logs: [],
                latestLog: null
            };
        }
        groups[empId].logs.push(log);
    });
    const processedGroups = Object.values(groups).map(group => {
        group.logs.sort((a, b) => new Date(b.__date) - new Date(a.__date));
        group.latestLog = group.logs[0];
        return group;
    });
    setGroupedData(processedGroups);
  }, [allLogs]);

  // --- FILTER LOGIC (MAIN TABLE) ---
  useEffect(() => {
    const data = groupedData.filter(item => {
      const latest = item.latestLog;
      const name = item.employee?.name?.toLowerCase() || "";
      const statusCheck = filters.status ? latest.status.toLowerCase() === filters.status.toLowerCase() : true;
      return statusCheck &&
             (!filters.branch || item.branch?.name === filters.branch) &&
             (!filters.date || latest.__date === filters.date) &&
             name.includes(filters.search.toLowerCase());
    });
    setFilteredEmployees(data);
    setCurrentPage(1);
  }, [filters, groupedData]);

// --- HISTORY PAGINATION & FILTER LOGIC ---
// --- HISTORY PAGINATION & FILTER LOGIC ---
  const filteredHistoryLogs = useMemo(() => {
    if (!selectedHistory) return [];
    return selectedHistory.logs.filter(log => {
        if (!historyMonthFilter) return true; // Agar filter khali hai, toh sab dikhao
        
        // Moment se date ko strictly YYYY-MM me convert karke compare karenge
        const logMonth = moment(log.__date).format("YYYY-MM");
        return logMonth === historyMonthFilter;
    });
  }, [selectedHistory, historyMonthFilter]);

  const historyTotalPages = Math.ceil(filteredHistoryLogs.length / historyItemsPerPage);
  const currentHistoryLogs = filteredHistoryLogs.slice(
    (historyPage - 1) * historyItemsPerPage,
    historyPage * historyItemsPerPage
  );

  // --- HANDLERS ---
 const openHistoryModal = (employeeGroup) => {
    setSelectedHistory(employeeGroup);
    // Modal khulte hi filter ko blank kar diya, taaki pehle sara data dikhe
    setHistoryMonthFilter(""); 
    setHistoryPage(1);        
    setActiveModal("history");
  };

  const openStatusModal = (record) => {
    setSelectedRecord(record);
    setStatusForm(record.status);
    setActiveModal("status");
  };

  const openActionModal = (record) => {
    if(["Absent", "On Leave", "Holiday", "Weekly Off"].includes(record.status)) {
        alert(`Cannot manage logs for ${record.status} status.`);
        return;
    }
    setSelectedRecord(record);
    const lastLog = record.inOutLogs[record.inOutLogs.length - 1];
    setActionForm({
      mode: (lastLog && !lastLog.outTime) ? "AUTO" : "MANUAL_OT",
      time: "",
      manualMinutes: record.overtimeMinutes || 0,
      approveOT: record.overtimeApproved || false
    });
    setActiveModal("action");
  };

  const closeModal = () => { 
      setActiveModal(null); 
      setSelectedRecord(null); 
      setSelectedHistory(null);
  };

  const saveStatus = async () => {
    try {
        await axios.put(`${API_URL}/api/attendance/${selectedRecord._id}`, 
        { status: statusForm, statusType: "Manual" }, { headers: { Authorization: `Bearer ${token}` } });
      window.location.reload();
    } catch (err) { alert("Failed to update status"); }
  };

  const saveAction = async () => {
    try {
      const isCheckoutFix = actionForm.mode === "AUTO" || actionForm.mode === "MANUAL";
      const payload = { 
        attendanceId: selectedRecord._id,
        action: isCheckoutFix ? "MANUAL_CHECKOUT" : "UPDATE_OT", 
        manualOutTime: actionForm.mode === "MANUAL" && actionForm.time ? moment(actionForm.time, "HH:mm").format("hh:mm:ss A") : null,
        overtimeMinutes: parseInt(actionForm.manualMinutes) || 0,
        approveOT: String(actionForm.approveOT) === "true"
      };
      await axios.put(`${API_URL}/api/attendance/approve-action`, payload, { headers: { Authorization: `Bearer ${token}` } });
      window.location.reload();
    } catch (err) { alert("Action Failed"); }
  };

  const handleDelete = async (id) => {
    if(window.confirm("Delete record?")) {
      await axios.delete(`${API_URL}/api/attendance/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      window.location.reload();
    }
  };

// 🔥 PREMIUM BLACK & WHITE PDF EXPORT LOGIC FOR HISTORY 🔥
  const exportHistoryToPDF = async () => {
    if (!selectedHistory || filteredHistoryLogs.length === 0) {
      alert("No records available to export for this month.");
      return;
    }

    const doc = new jsPDF("portrait", "mm", "a4");
    const pageWidth = doc.internal.pageSize.getWidth();

    // 1. Common Company Header
    try {
      await addCommonHeaderFooter(doc, settings);
    } catch (error) {
      console.warn("Could not load header/footer images.");
    }

    let currentY = 45;

    // 2. Report Main Title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0); 
    doc.text("ATTENDANCE HISTORY REPORT", pageWidth / 2, currentY, { align: "center" });
    currentY += 10;

    // 3. Employee Info Block (Light Gray Box) - INCREASED HEIGHT FOR MONTH
    const empName = selectedHistory.employee.name || "N/A";
    const empBranch = selectedHistory.branch?.name || "Main Branch";
    const generatedOn = moment().format("DD MMM YYYY, hh:mm A");
    const reportPeriod = historyMonthFilter ? moment(historyMonthFilter, "YYYY-MM").format("MMMM YYYY") : "All Time";

    doc.setDrawColor(180, 180, 180);
    doc.setFillColor(248, 248, 248);
    doc.roundedRect(14, currentY, pageWidth - 28, 30, 2, 2, "FD");

    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 30, 30);
    
    // Left Column Info
    doc.text("Employee Name :", 18, currentY + 8);
    doc.text("Branch :", 18, currentY + 16);
    doc.text("Report Period :", 18, currentY + 24); // NEW ADDITION
    
    doc.setFont("helvetica", "normal");
    doc.text(empName, 48, currentY + 8);
    doc.text(empBranch, 48, currentY + 16);
    doc.text(reportPeriod, 48, currentY + 24); // NEW ADDITION

    // Right Column Info
    doc.setFont("helvetica", "bold");
    doc.text("Generated On :", pageWidth / 2 + 10, currentY + 8);
    doc.text("Total Records :", pageWidth / 2 + 10, currentY + 16);
    
    doc.setFont("helvetica", "normal");
    doc.text(generatedOn, pageWidth / 2 + 40, currentY + 8);
    doc.text(`${filteredHistoryLogs.length}`, pageWidth / 2 + 40, currentY + 16);

    currentY += 40;

    // 4. Calculate Summary Statistics using FILTERED data
    let totalPresent = 0, totalAbsent = 0, totalLeave = 0, totalOT = 0;
    filteredHistoryLogs.forEach(log => {
      const stat = log.status || "";
      if(stat === "Present" || stat === "Late") totalPresent++;
      else if(stat === "Absent") totalAbsent++;
      else if(stat.includes("Leave") || stat.includes("Holiday") || stat.includes("Off")) totalLeave++;
      
      if(log.overtimeMinutes) totalOT += log.overtimeMinutes;
    });
    
    const otHours = Math.floor(totalOT / 60);
    const otMins = totalOT % 60;
    const otString = otHours > 0 ? `${otHours}h ${otMins}m` : `${otMins}m`;

    // 5. Summary Stats Table
    autoTable(doc, {
      startY: currentY,
      head: [["Total Present", "Total Absent", "Leaves/Offs", "Total Overtime"]],
      body: [[`${totalPresent} Days`, `${totalAbsent} Days`, `${totalLeave} Days`, otString]],
      theme: "plain",
      headStyles: { fillColor: [235, 235, 235], textColor: [0, 0, 0], fontStyle: 'bold', lineWidth: 0.1, lineColor: [100, 100, 100], halign: 'center' },
      bodyStyles: { textColor: [0, 0, 0], fontStyle: 'bold', lineWidth: 0.1, lineColor: [100, 100, 100], halign: 'center' },
      styles: { fontSize: 10, cellPadding: 6 },
      margin: { left: 14, right: 14 }
    });

    currentY = doc.lastAutoTable.finalY + 12;

    // 6. Main Detailed Table (Strictly Black & White Grid)
    autoTable(doc, {
      startY: currentY,
      head: [["Date", "Day", "Status", "First In", "Last Out", "Overtime"]],
      body: filteredHistoryLogs.map(log => {
        const dateObj = moment(log.__date);
        const inTime = log.inOutLogs?.length > 0 && log.inOutLogs[0].inTime ? log.inOutLogs[0].inTime : "--";
        const outTime = log.inOutLogs?.length > 0 && log.inOutLogs[log.inOutLogs.length - 1].outTime ? log.inOutLogs[log.inOutLogs.length - 1].outTime : "--";
        const ot = log.overtimeMinutes > 0 ? `${log.overtimeMinutes}m` : "--";
        
        return [
          dateObj.format("DD MMM YYYY"),
          dateObj.format("dddd"),
          log.status.toUpperCase(),
          inTime,
          outTime,
          ot
        ];
      }),
      theme: "grid",
      headStyles: { fillColor: [30, 30, 30], textColor: [255, 255, 255], fontStyle: "bold", halign: "center" },
      bodyStyles: { textColor: [20, 20, 20], lineColor: [180, 180, 180] },
      alternateRowStyles: { fillColor: [248, 248, 248] },
      columnStyles: {
        0: { halign: "left" }, 1: { halign: "left" }, 2: { halign: "center", fontStyle: "bold" },
        3: { halign: "center" }, 4: { halign: "center" }, 5: { halign: "center" }
      },
      styles: { fontSize: 9, cellPadding: 5 },
      margin: { left: 14, right: 14 }
    });

    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(100, 100, 100);
    doc.text("*** End of Report ***", pageWidth / 2, finalY, { align: "center" });

    try { addCommonFooter(doc, settings); } catch (error) { console.warn("Could not load footer."); }

    const safeEmpName = selectedHistory.employee.name.replace(/\s+/g, "_");
    const monthName = historyMonthFilter ? moment(historyMonthFilter, "YYYY-MM").format("MMM_YYYY") : "AllTime";
    doc.save(`Attendance_${monthName}_${safeEmpName}.pdf`);
  };
  // Helper Renderers
  const renderStatusBadge = (status) => (
    <span className={`badge-custom badge-${status.toLowerCase().replace(/\s/g, '')}`}>{status}</span>
  );

  const renderAttendanceDetails = (item) => {
    const isMissing = item.inOutLogs[item.inOutLogs.length - 1] && !item.inOutLogs[item.inOutLogs.length - 1].outTime;
    const hasOT = item.overtimeMinutes > 0;
    if (item.status === 'Absent') return <div className="status-empty align-item-center"><FaTimes className=" mt-1 me-1" size={10} /> No Log</div>;
    if (item.status === 'On Leave') return <div className="status-leave"><FaCalendarAlt size={12} /> {item.adminCheckoutTime || "Leave"}</div>;
    if (item.status === 'Holiday') return <div className="status-holiday"><FaUmbrellaBeach size={12} /> Holiday</div>;
    if (item.status === 'Weekly Off') return <div className="status-weekend"><FaBed size={12} /> Off</div>;
    if (isMissing) return <div className="alert-missing"><FaExclamationTriangle /> Checkout Pending</div>;
    if (hasOT) return <div className={`ot-indicator ${item.overtimeApproved ? 'ot-approved' : 'ot-pending'}`}>{item.overtimeMinutes}m OT {item.overtimeApproved ? '✓' : ''}</div>;
    return <div className="status-standard"><FaCheckCircle /> Standard</div>;
  };

  // --- RENDER ---
  const currentEmployees = filteredEmployees.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);

  return (
    <AdminLayout>
      <div className="att-premium-wrapper">
        
        {/* HEADER */}
        <div className="att-header">
          <div className="att-title">
            <h2>Attendance Manager</h2>
            <span>Employees grouped by latest activity.</span>
          </div>
          <button className="btn btn-primary d-flex align-items-center gap-2" onClick={() => window.location.reload()}>
             <FaSyncAlt/> Refresh
          </button>
        </div>

        {/* FILTERS (HORIZONTAL LAYOUT) */}
        <div className="att-card">
          <div className="att-filters">
            <div className="att-input-group flex-grow-1">
              <FaSearch />
              <input placeholder="Search employee..." value={filters.search} onChange={e => setFilters({...filters, search: e.target.value})} />
            </div>
            <div className="att-input-group">
              <FaLayerGroup />
              <select value={filters.branch} onChange={e => setFilters({...filters, branch: e.target.value})}>
                <option value="">All Branches</option>
                {branches.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div className="att-input-group">
              <FaFilter />
              <select value={filters.status} onChange={e => setFilters({...filters, status: e.target.value})}>
                <option value="">All Status (Latest)</option>
                <option value="Present">Present</option>
                <option value="On Leave">On Leave</option>
                <option value="Absent">Absent</option>
                <option value="Late">Late</option>
              </select>
            </div>
          </div>
        </div>

        {/* MAIN TABLE */}
        <div className="att-table-wrapper">
          {loading ? <TableLoader /> : (
            <>
            <table className="att-table">
              <thead>
                <tr>
                  <th>Employee Profile</th>
                  <th>Recent Activity</th>
                  <th>Current Status</th>
                  <th>Shift Info</th>
                  <th className="text-center">History</th>
                </tr>
              </thead>
              <tbody>
                {currentEmployees.length > 0 ? currentEmployees.map(group => {
                  const item = group.latestLog;
                  return (
                    <tr key={group.employee._id}>
                      <td>
                        <div className="user-cell" onClick={() => navigate(`/admin/employee/${group.employee._id}`)}>
                          <div className="user-avatar">{group.employee.name?.charAt(0)}</div>
                          <div className="user-details">
                            <h6>{group.employee.name}</h6>
                            <span>{group.branch?.name || "Main Branch"}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{fontWeight:600}}>{moment(item.__date).format("DD MMM, YYYY")}</div>
                        <div style={{fontSize:'0.75rem', color:'var(--att-text-sub)'}}>{moment(item.__date).fromNow()}</div>
                      </td>
                      <td>{renderStatusBadge(item.status)}</td>
                      <td>{renderAttendanceDetails(item)}</td>
                      <td className="text-center">
                        <button className="btn-icon" style={{width:'auto', padding:'0 10px', gap:'5px'}} onClick={() => openHistoryModal(group)}>
                           <FaHistory /> View History
                        </button>
                      </td>
                    </tr>
                  )
                }) : (
                  <tr><td colSpan="5" className="text-center p-4 text-muted">No records found</td></tr>
                )}
              </tbody>
            </table>

            {/* MAIN PAGINATION */}
            {filteredEmployees.length > 0 && (
                <div className="pagination-wrapper">
                    <button className="btn-icon" disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)}><FaChevronLeft /></button>
                    <span className="page-info">Page {currentPage} of {totalPages}</span>
                    <button className="btn-icon" disabled={currentPage === totalPages} onClick={() => setCurrentPage(prev => prev + 1)}><FaChevronRight /></button>
                </div>
            )}
            </>
          )}
        </div>

        {/* --- HISTORY MODAL (UPDATED) --- */}
        {activeModal === 'history' && selectedHistory && (
          <div className="custom-modal-overlay">
            <div className="custom-modal-dialog modal-lg">
              <div className="custom-modal-header align-items-center">
                <div className="d-flex flex-column">
                    <h5 className="custom-modal-title">Attendance History</h5>
                    <span style={{fontSize:'0.85rem', color:'var(--att-text-sub)'}}>
                        {selectedHistory.employee.name}
                    </span>
                </div>
                
{/* History Filter & PDF Export (Inside Header) */}
                <div className="d-flex gap-2 align-items-center ms-auto me-3">
                    {/* Changed type to month and state to historyMonthFilter */}
                    <input 
                        type="month" 
                        className="form-control" 
                        style={{width: '160px', padding: '0.4rem'}}
                        value={historyMonthFilter}
                        onChange={(e) => {
                            setHistoryMonthFilter(e.target.value);
                            setHistoryPage(1); // Reset page on filter change
                        }}
                    />
                    <button 
                        className="btn-primary d-flex align-items-center gap-2" 
                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', border: 'none', borderRadius: '8px' }}
                        onClick={exportHistoryToPDF}
                        title="Export PDF"
                    >
                        <FaFilePdf /> <span className="d-none d-sm-inline">Export</span>
                    </button>
                </div>

                <button className="btn-icon" onClick={closeModal}><FaTimes/></button>
              </div>

              <div className="custom-modal-body" style={{minHeight: '300px'}}>
                <table className="att-table" style={{borderSpacing: '0 4px'}}>
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Status</th>
                            <th>Details</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentHistoryLogs.length > 0 ? currentHistoryLogs.map(log => (
                            <tr key={log._id}>
                                <td>{moment(log.__date).format("DD MMM, YYYY")}</td>
                                <td>{renderStatusBadge(log.status)}</td>
                                <td>{renderAttendanceDetails(log)}</td>
                                <td>
                                    <div className="d-flex gap-2">
                                        <button className="btn-icon" title="Edit" onClick={() => openStatusModal(log)}><FaUserEdit /></button>
                                        <button className="btn-icon" title="Log" onClick={() => openActionModal(log)}><FaClock /></button>
                                        <button className="btn-icon danger" onClick={() => handleDelete(log._id)}><FaTrash /></button>
                                    </div>
                                </td>
                            </tr>
                        )) : (
                            <tr><td colSpan="4" className="text-center p-3 text-muted">No history found for this date.</td></tr>
                        )}
                    </tbody>
                </table>

                {/* HISTORY PAGINATION */}
                {historyTotalPages > 1 && (
                     <div className="pagination-wrapper pt-3">
                        <button className="btn-icon" disabled={historyPage === 1} onClick={() => setHistoryPage(prev => prev - 1)}><FaChevronLeft /></button>
                        <span className="page-info">Page {historyPage} of {historyTotalPages}</span>
                        <button className="btn-icon" disabled={historyPage === historyTotalPages} onClick={() => setHistoryPage(prev => prev + 1)}><FaChevronRight /></button>
                    </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* STATUS & ACTION MODALS (SAME AS BEFORE) */}
        {activeModal === 'status' && (
          <div className="custom-modal-overlay">
            <div className="custom-modal-dialog">
              <div className="custom-modal-header">
                <h5 className="custom-modal-title">Update Status</h5>
                <button className="btn-icon" onClick={closeModal}><FaTimes/></button>
              </div>
              <div className="custom-modal-body">
                <p style={{color: 'var(--att-text-main)'}}>Employee: <b>{selectedRecord?.employeeId?.name}</b></p>
                <select className="form-select" value={statusForm} onChange={e => setStatusForm(e.target.value)}>
                  <option value="Present">Present</option>
                  <option value="Absent">Absent</option>
                  <option value="On Leave">On Leave</option>
                  <option value="Late">Late</option>
                  <option value="Holiday">Holiday</option>
                </select>
              </div>
              <div className="custom-modal-footer">
                <button className="btn btn-secondary" onClick={closeModal}>Cancel</button>
                <button className="btn btn-primary" onClick={saveStatus}>Update</button>
              </div>
            </div>
          </div>
        )}

        {activeModal === 'action' && (
             <div className="custom-modal-overlay">
             <div className="custom-modal-dialog">
               <div className="custom-modal-header">
                 <h5 className="custom-modal-title">Manage Shift</h5>
                 <button className="btn-icon" onClick={closeModal}><FaTimes/></button>
               </div>
               <div className="custom-modal-body">
                 {actionForm.mode === "AUTO" && <div className="alert-missing mb-3">System detected missing checkout. Auto-fix?</div>}
                 <label className="form-label">Manual Out Time</label>
                 <input type="time" className="form-control mb-3" value={actionForm.time} onChange={e => setActionForm({...actionForm, mode: 'MANUAL', time: e.target.value})} />
                 <label className="form-label">Overtime (Minutes)</label>
                 <input type="number" className="form-control mb-3" value={actionForm.manualMinutes} onChange={e => setActionForm({...actionForm, manualMinutes: e.target.value})} />
                 <div className="d-flex align-items-center gap-2">
                     <input type="checkbox" id="otCheck" checked={actionForm.approveOT} onChange={e => setActionForm({...actionForm, approveOT: e.target.checked})} />
                     <label htmlFor="otCheck" style={{fontSize: '0.9rem', color: 'var(--att-text-main)'}}>Approve Overtime?</label>
                 </div>
               </div>
               <div className="custom-modal-footer">
                 <button className="btn btn-secondary" onClick={closeModal}>Cancel</button>
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