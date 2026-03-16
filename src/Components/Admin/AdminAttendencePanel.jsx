import React, { useEffect, useState, useMemo, useContext } from "react";
import axios from "axios";
import DynamicLayout from "../Common/DynamicLayout";
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
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { SettingsContext } from "../Redux/SettingsContext";
import { addCommonHeaderFooter, addCommonFooter } from "../../Utils/pdfHeaderFooter";

const AdminAttendancePanel = () => {
  const [allLogs, setAllLogs] = useState([]); 
  const [groupedData, setGroupedData] = useState([]); 
  const [filteredEmployees, setFilteredEmployees] = useState([]); 
  const [loading, setLoading] = useState(false);
  const [branches, setBranches] = useState([]);
  
  const { settings } = useContext(SettingsContext);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10); 

  const [historyPage, setHistoryPage] = useState(1);
  const [historyMonthFilter, setHistoryMonthFilter] = useState(""); 
  const historyItemsPerPage = 8; 

  const [activeModal, setActiveModal] = useState(null); 
  const [selectedRecord, setSelectedRecord] = useState(null); 
  const [selectedHistory, setSelectedHistory] = useState(null); 
  
  const [statusForm, setStatusForm] = useState("Present");
  const [actionForm, setActionForm] = useState({ mode: "MANUAL_OT", time: "", manualMinutes: 0, approveOT: false });

  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL;
  
  // ✅ USER & PERMISSION LOGIC
  const userStr = localStorage.getItem("user");
  const userObj = userStr ? JSON.parse(userStr) : null;
  const token = userObj?.token;
  const role = userObj?.role;
  const isAdmin = role === "admin"; // VIP Bypass

  const [perms, setPerms] = useState({ view: false, create: false, edit: false, delete: false });

  useEffect(() => {
    const fetchPerms = async () => {
      if (isAdmin || !token) return;
      try {
        const res = await axios.get(`${API_URL}/api/my-modules`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.detailed?.attendance) {
          setPerms(res.data.detailed.attendance);
        }
      } catch (e) {
        console.error("Permission fetch failed", e);
      }
    };
    fetchPerms();
  }, [token, isAdmin, API_URL]);

  const [filters, setFilters] = useState({ status: "", branch: "", date: "", search: "" });

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
  }, [token, API_URL]);

  useEffect(() => {
    if (!allLogs.length) return;
    const groups = {};
    allLogs.forEach(log => {
        const empId = log.employeeId?._id;
        if (!empId) return;
        if (!groups[empId]) {
            groups[empId] = { employee: log.employeeId, branch: log.branchId, logs: [], latestLog: null };
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

  useEffect(() => {
    const data = groupedData.filter(item => {
      const latest = item.latestLog;
      const name = item.employee?.name?.toLowerCase() || "";
      const statusCheck = filters.status ? latest.status.toLowerCase() === filters.status.toLowerCase() : true;
      return statusCheck && (!filters.branch || item.branch?.name === filters.branch) && name.includes(filters.search.toLowerCase());
    });
    setFilteredEmployees(data);
    setCurrentPage(1);
  }, [filters, groupedData]);

  const filteredHistoryLogs = useMemo(() => {
    if (!selectedHistory) return [];
    return selectedHistory.logs.filter(log => {
        if (!historyMonthFilter) return true; 
        const logMonth = moment(log.__date).format("YYYY-MM");
        return logMonth === historyMonthFilter;
    });
  }, [selectedHistory, historyMonthFilter]);

  const historyTotalPages = Math.ceil(filteredHistoryLogs.length / historyItemsPerPage);
  const currentHistoryLogs = filteredHistoryLogs.slice((historyPage - 1) * historyItemsPerPage, historyPage * historyItemsPerPage);

  const openHistoryModal = (employeeGroup) => {
    setSelectedHistory(employeeGroup);
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
        manualOutTime: isCheckoutFix && actionForm.time ? moment(actionForm.time, "HH:mm").format("hh:mm:ss A") : null,
        overtimeMinutes: parseInt(actionForm.manualMinutes) || 0,
        approveOT: actionForm.approveOT
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

  const exportHistoryToPDF = async () => {
    if (!selectedHistory || filteredHistoryLogs.length === 0) {
      alert("No records available to export for this month.");
      return;
    }

    const doc = new jsPDF("portrait", "mm", "a4");
    const pageWidth = doc.internal.pageSize.getWidth();

    try { await addCommonHeaderFooter(doc, settings); } catch (error) {}

    let currentY = 60;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0); 
    doc.text("ATTENDANCE HISTORY REPORT", pageWidth / 2, currentY, { align: "center" });
    currentY += 10;

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
    
    doc.text("Employee Name :", 18, currentY + 8);
    doc.text("Branch :", 18, currentY + 16);
    doc.text("Report Period :", 18, currentY + 24);
    
    doc.setFont("helvetica", "normal");
    doc.text(empName, 48, currentY + 8);
    doc.text(empBranch, 48, currentY + 16);
    doc.text(reportPeriod, 48, currentY + 24); 

    doc.setFont("helvetica", "bold");
    doc.text("Generated On :", pageWidth / 2 + 10, currentY + 8);
    doc.text("Total Records :", pageWidth / 2 + 10, currentY + 16);
    
    doc.setFont("helvetica", "normal");
    doc.text(generatedOn, pageWidth / 2 + 40, currentY + 8);
    doc.text(`${filteredHistoryLogs.length}`, pageWidth / 2 + 40, currentY + 16);

    currentY += 40;

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

    autoTable(doc, {
      startY: currentY,
      head: [["Date", "Day", "Status", "First In", "Last Out", "Overtime"]],
      body: filteredHistoryLogs.map(log => {
        const dateObj = moment(log.__date);
        const inTime = log.inOutLogs?.length > 0 && log.inOutLogs[0].inTime ? log.inOutLogs[0].inTime : "--";
        const outTime = log.inOutLogs?.length > 0 && log.inOutLogs[log.inOutLogs.length - 1].outTime ? log.inOutLogs[log.inOutLogs.length - 1].outTime : "--";
        const ot = log.overtimeMinutes > 0 ? `${log.overtimeMinutes}m` : "--";
        return [ dateObj.format("DD MMM YYYY"), dateObj.format("dddd"), log.status.toUpperCase(), inTime, outTime, ot ];
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

    try { addCommonFooter(doc, settings); } catch (error) {}

    const safeEmpName = selectedHistory.employee.name.replace(/\s+/g, "_");
    const monthName = historyMonthFilter ? moment(historyMonthFilter, "YYYY-MM").format("MMM_YYYY") : "AllTime";
    doc.save(`Attendance_${monthName}_${safeEmpName}.pdf`);
  };

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
    
    if (hasOT) {
        return (
            <div className={`ot-indicator ${item.overtimeApproved ? 'ot-approved' : 'ot-pending'}`}>
                <FaClock size={11} />
                {item.overtimeMinutes}m OT
                {item.overtimeApproved ? <FaCheckCircle style={{marginLeft:'3px'}}/> : <span style={{opacity:0.6, fontSize:'0.7rem', marginLeft:'3px'}}>(Pend)</span>}
            </div>
        );
    }
    
    return <div className="status-standard"><FaCheckCircle /> Standard Shift</div>;
  };

  const currentEmployees = filteredEmployees.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);

  // ✅ ACTION CONDITIONS
  const canEdit = isAdmin || perms.edit;
  const canDelete = isAdmin || perms.delete;

  return (
    <DynamicLayout>
      <div className="att-premium-wrapper">
        
        {/* HEADER */}
        <div className="att-header">
          <div className="att-title">
            <h2>Attendance Manager</h2>
            <span>Manage Overtime & Daily Activity</span>
          </div>
          <button className="btn btn-primary d-flex align-items-center gap-2" onClick={() => window.location.reload()}>
             <FaSyncAlt/> Refresh
          </button>
        </div>

        {/* FILTERS */}
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
                  <th>Date & Time</th>
                  <th>Current Status</th>
                  <th>Shift & Overtime</th>
                  <th className="text-center">Actions</th>
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
                        <div className="d-flex justify-content-center gap-2">
                           
                           {/* ✅ CONTROLLED ACTION BUTTONS */}
                           {canEdit && (
                             <>
                               <button className="btn-icon" title="Edit Status" onClick={() => openStatusModal(item)}><FaUserEdit /></button>
                               <button className="btn-icon" title="Manage Time/OT" onClick={() => openActionModal(item)}><FaClock /></button>
                             </>
                           )}
                           
                           {/* History is view mode, always shown */}
                           <button className="btn-icon history-btn" title="History" onClick={() => openHistoryModal(group)}><FaHistory /></button>
                        </div>
                      </td>
                    </tr>
                  )
                }) : (
                  <tr><td colSpan="5" className="text-center p-4 text-muted">No records found</td></tr>
                )}
              </tbody>
            </table>

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

        {/* =======================================
            🔥 PREMIUM HISTORY MODAL (FIXED) 🔥 
            ======================================= */}
        {activeModal === 'history' && selectedHistory && (
          <div className="custom-modal-overlay show">
            <div className="custom-modal-dialog modal-xl slide-up">
              
              <div className="custom-modal-header align-items-center bg-light-gradient">
                <div className="d-flex align-items-center gap-3">
                  <div className="modal-avatar">
                     {selectedHistory.employee.name?.charAt(0)}
                  </div>
                  <div className="d-flex flex-column">
                      <h5 className="custom-modal-title mb-0" style={{fontSize: '1.2rem'}}>{selectedHistory.employee.name}</h5>
                      <span style={{fontSize:'0.85rem', color:'var(--att-primary)', fontWeight: 600}}>
                          Attendance History
                      </span>
                  </div>
                </div>
                
                <div className="d-flex gap-3 align-items-center ms-auto me-3">
                    <div className="att-input-group m-0" style={{height: '38px', minWidth: '150px'}}>
                      <FaCalendarAlt className="text-muted ms-2"/>
                      <input 
                          type="month" 
                          style={{width: '100%', padding: '0 10px', background: 'transparent', border:'none', outline:'none', color:'var(--att-text-main)'}}
                          value={historyMonthFilter}
                          onChange={(e) => {
                              setHistoryMonthFilter(e.target.value);
                              setHistoryPage(1); 
                          }}
                      />
                    </div>
                    <button className="btn-export-premium" onClick={exportHistoryToPDF} title="Export PDF">
                        <FaFilePdf /> <span className="d-none d-sm-inline">Export</span>
                    </button>
                </div>
                <button className="btn-modal-close" onClick={closeModal}><FaTimes/></button>
              </div>

              <div className="custom-modal-body p-0">
                <div className="table-responsive" style={{maxHeight: '450px', overflowY: 'auto'}}>
                  <table className="att-table m-0">
                      <thead style={{position: 'sticky', top: 0, zIndex: 10, background: 'var(--att-bg-main)'}}>
                          <tr>
                              <th style={{paddingLeft: '1.5rem'}}>Date & Day</th>
                              <th>Status</th>
                              <th>Shift Details</th>
                              <th className="text-center" style={{paddingRight: '1.5rem'}}>Actions</th>
                          </tr>
                      </thead>
                      <tbody>
                          {currentHistoryLogs.length > 0 ? currentHistoryLogs.map(log => (
                              <tr key={log._id} className="history-row">
                                  <td style={{paddingLeft: '1.5rem'}}>
                                      <div style={{fontWeight: 600, color: 'var(--att-text-main)'}}>{moment(log.__date).format("DD MMM, YYYY")}</div>
                                      <div style={{fontSize: '0.75rem', color: 'var(--att-text-sub)'}}>{moment(log.__date).format("dddd")}</div>
                                  </td>
                                  <td>{renderStatusBadge(log.status)}</td>
                                  <td>{renderAttendanceDetails(log)}</td>
                                  <td className="text-center" style={{paddingRight: '1.5rem'}}>
                                      <div className="d-flex justify-content-center gap-2">
                                          {/* ✅ HISTORY ACTION BUTTONS CONTROLLED */}
                                          {canEdit && (
                                            <>
                                              <button className="btn-icon-sm edit" title="Edit" onClick={() => openStatusModal(log)}><FaUserEdit /></button>
                                              <button className="btn-icon-sm clock" title="Manage Time" onClick={() => openActionModal(log)}><FaClock /></button>
                                            </>
                                          )}
                                          {canDelete && (
                                            <button className="btn-icon-sm delete" title="Delete" onClick={() => handleDelete(log._id)}><FaTrash /></button>
                                          )}
                                      </div>
                                  </td>
                              </tr>
                          )) : (
                              <tr>
                                <td colSpan="4" className="text-center py-5">
                                  <div className="d-flex flex-column align-items-center opacity-50">
                                    <FaHistory size={40} className="mb-2" />
                                    <span>No history found for the selected period.</span>
                                  </div>
                                </td>
                              </tr>
                          )}
                      </tbody>
                  </table>
                </div>
              </div>

              {historyTotalPages > 1 && (
                  <div className="custom-modal-footer justify-content-between bg-light-gradient">
                     <span className="page-info">Showing {currentHistoryLogs.length} logs (Page {historyPage} of {historyTotalPages})</span>
                     <div className="pagination-wrapper m-0">
                         <button className="btn-icon" disabled={historyPage === 1} onClick={() => setHistoryPage(prev => prev - 1)}><FaChevronLeft /></button>
                         <button className="btn-icon" disabled={historyPage === historyTotalPages} onClick={() => setHistoryPage(prev => prev + 1)}><FaChevronRight /></button>
                     </div>
                  </div>
              )}
            </div>
          </div>
        )}

        {/* STATUS MODAL */}
        {activeModal === 'status' && (
          <div className="custom-modal-overlay show">
            <div className="custom-modal-dialog fade-in">
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
                  <option value="Weekly Off">Weekly Off</option>
                </select>
              </div>
              <div className="custom-modal-footer">
                <button className="btn btn-danger" onClick={closeModal}>Cancel</button>
                <button className="btn btn-primary" onClick={saveStatus}>Update Status</button>
              </div>
            </div>
          </div>
        )}

        {/* ACTION MODAL */}
        {activeModal === 'action' && (
          <div className="custom-modal-overlay show">
            <div className="custom-modal-dialog fade-in">
              <div className="custom-modal-header">
                <h5 className="custom-modal-title">
                  {actionForm.mode === "AUTO" || actionForm.mode === "MANUAL" ? "Resolve Checkout" : "Manage Overtime"}
                </h5>
                <button className="btn-icon" onClick={closeModal}><FaTimes/></button>
              </div>
              <div className="custom-modal-body">
                {(actionForm.mode === "AUTO" || actionForm.mode === "MANUAL") ? (
                  <>
                    <div className="alert-missing mb-3 p-2 rounded" style={{background: 'var(--att-bg-main)', border: '1px dashed var(--att-danger)'}}>
                        <FaExclamationTriangle size={14} /> Missing Checkout Detected
                    </div>
                    <label className="form-label fw-bold">Force Manual Checkout Time</label>
                    <input type="time" className="form-control mb-3" value={actionForm.time} onChange={e => setActionForm({...actionForm, mode: 'MANUAL', time: e.target.value})} />
                    <small className="text-muted d-block mt-1">If left blank, system will use default shift end time.</small>
                  </>
                ) : (
                  <>
                    <div className="d-flex justify-content-between mb-3 p-3 rounded" style={{background: 'var(--att-input-bg)', border: '1px solid var(--att-border)'}}>
                        <span>System Calculated OT:</span>
                        <strong className="text-primary">{selectedRecord?.overtimeMinutes || 0} Minutes</strong>
                    </div>
                    <label className="form-label fw-bold">Manual OT Minutes Override</label>
                    <input type="number" className="form-control mb-4" value={actionForm.manualMinutes} onChange={e => setActionForm({...actionForm, manualMinutes: e.target.value})} placeholder="e.g. 60" />
                    
                    <div className="d-flex align-items-center gap-3 p-3 border rounded" style={{borderColor: actionForm.approveOT ? 'var(--att-success)' : 'var(--att-border)', background: actionForm.approveOT ? 'rgba(16, 185, 129, 0.05)' : 'transparent', transition: '0.3s'}}>
                        <input type="checkbox" id="otCheck" checked={actionForm.approveOT} onChange={e => setActionForm({...actionForm, approveOT: e.target.checked})} style={{width: '20px', height: '20px', cursor: 'pointer'}} />
                        <label htmlFor="otCheck" style={{fontSize: '1rem', color: actionForm.approveOT ? 'var(--att-success)' : 'var(--att-text-main)', fontWeight: 600, cursor: 'pointer', margin: 0}}>
                            {actionForm.approveOT ? "Overtime is Approved ✓" : "Check to Approve Overtime"}
                        </label>
                    </div>
                  </>
                )}
              </div>
              <div className="custom-modal-footer">
                <button className="btn btn-danger" onClick={closeModal}>Cancel</button>
                <button className="btn btn-primary" onClick={saveAction}>Save Changes</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </DynamicLayout>
  );
};

export default AdminAttendancePanel;