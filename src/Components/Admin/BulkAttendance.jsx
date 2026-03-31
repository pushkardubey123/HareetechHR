import React, { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import DynamicLayout from "../Common/DynamicLayout";
import { FaCheckCircle, FaCalendarAlt, FaUserCheck, FaSearch, FaUsers, FaFilter, FaHistory, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import "./BulkAttendence.css";

const BulkAttendancePanel = () => {
  const [employees, setEmployees] = useState([]);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  
  const [allAttendance, setAllAttendance] = useState([]); 
  const [markedEmployees, setMarkedEmployees] = useState([]); 
  const [filterDate, setFilterDate] = useState("");
  const [filterEmp, setFilterEmp] = useState("");
  const [empSearch, setEmpSearch] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; 

  // ✅ PERMISSION LOGIC
  const userStr = localStorage.getItem("user");
  const userObj = userStr ? JSON.parse(userStr) : null;
  const token = userObj?.token;
  const isAdmin = userObj?.role === "admin";
  const [perms, setPerms] = useState({ view: false, create: false, edit: false, delete: false });

  const fetchData = async () => {
    try {
      const [empRes, attRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_URL}/user`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${import.meta.env.VITE_API_URL}/api/attendance`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setEmployees(empRes.data?.data || []);
      const all = Object.values(attRes.data?.data || {}).flat();
      setAllAttendance(all);
      setMarkedEmployees(all);
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    const fetchPerms = async () => {
      if (isAdmin || !token) return;
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/my-modules`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.detailed?.attendance) {
          setPerms(res.data.detailed.attendance);
        }
      } catch (e) { console.error("Permission fetch failed", e); }
    };
    fetchPerms();
    fetchData(); 
  }, [token, isAdmin]);

  const handleSubmit = async () => {
    if (!startDate || selectedEmployees.length === 0) return Swal.fire("Error", "Start Date and Staff Members are required", "warning");

    const finalEndDate = endDate || startDate; 
    if (new Date(finalEndDate) < new Date(startDate)) return Swal.fire("Invalid Date", "End Date cannot be before Start Date", "warning");

    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/attendance/bulk`,
        { employeeIds: selectedEmployees, startDate, endDate: finalEndDate },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      Swal.fire({ icon: 'success', title: 'Records Processed', text: res.data.message });
      fetchData(); setSelectedEmployees([]); setStartDate(""); setEndDate(""); setCurrentPage(1); 
    } catch (err) { Swal.fire("Error", err.response?.data?.message || "Submission failed", "error"); }
  };

  const applyFilter = () => {
    let filtered = [...allAttendance];
    if (filterDate) filtered = filtered.filter((item) => item.date.split("T")[0] === filterDate);
    if (filterEmp) filtered = filtered.filter((item) => item.employeeId?._id === filterEmp);
    setMarkedEmployees(filtered);
    setCurrentPage(1); 
  };
  
  const toggleEmployee = (id) => setSelectedEmployees((prev) => prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = markedEmployees.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(markedEmployees.length / itemsPerPage) || 1;

  const paginatePrev = () => setCurrentPage(prev => Math.max(prev - 1, 1));
  const paginateNext = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));

  const canCreate = isAdmin || perms.create;

  return (
    <DynamicLayout>
      <div className="bulk-at-page">
        
        {/* HEADER SECTION */}
        <div className="ts-header mb-4">
          <h2 className="ba-title m-0 pb-1">Bulk Attendance System</h2>
          <p className="m-0 page-subtitle">
            Efficiently manage mass attendance entries. Leave "End Date" blank for a single day.
          </p>
        </div>

        {/* ✅ PROTECTED ACTION CARD */}
        {canCreate && (
          <div className="ba-glass-card">
            <div className="row g-4 align-items-end">
              <div className="col-lg-3 col-md-6">
                <label className="timing-label">Start Date <span className="text-danger">*</span></label>
                <div className="ba-input-group">
                  <FaCalendarAlt className="icon-primary" />
                  <input type="date" className="date-input" value={startDate} onChange={(e) => setStartDate(e.target.value)} max={endDate || undefined} />
                </div>
              </div>
              <div className="col-lg-3 col-md-6">
                <label className="timing-label">End Date (Optional)</label>
                <div className="ba-input-group">
                  <FaCalendarAlt className="icon-muted" />
                  <input type="date" className="date-input" value={endDate} onChange={(e) => setEndDate(e.target.value)} min={startDate || undefined} />
                </div>
              </div>
              <div className="col-lg-4 col-md-12">
                <label className="timing-label">Staff Members <span className="text-danger">*</span></label>
                <div className="dropdown w-100">
                  <button className="ba-dropdown-btn dropdown-toggle d-flex justify-content-between align-items-center" type="button" data-bs-toggle="dropdown">
                    <span className="d-flex align-items-center gap-2 text-truncate">
                      <FaUsers className="icon-primary" />
                      {selectedEmployees.length === 0 ? "Select Personnel" : `${selectedEmployees.length} Members Chosen`}
                    </span>
                  </button>
                  <ul className="dropdown-menu p-3 custom-dropdown-menu">
                    <div className="ba-input-group mb-3" onClick={(e) => e.stopPropagation()}>
                      <FaSearch className="icon-muted" />
                      <input type="text" placeholder="Search staff..." value={empSearch} onChange={(e) => setEmpSearch(e.target.value)} />
                    </div>
                    <div style={{ maxHeight: "220px", overflowY: "auto" }}>
                      {employees.filter(e => e.name.toLowerCase().includes(empSearch.toLowerCase())).map((emp) => (
                        <li key={emp._id} className="dropdown-item rounded-3 d-flex justify-content-between align-items-center py-2" onClick={(e) => { e.stopPropagation(); toggleEmployee(emp._id); }}>
                          <span className="dropdown-emp-name text-truncate pe-2">{emp.name}</span>
                          {selectedEmployees.includes(emp._id) && <FaUserCheck className="text-success flex-shrink-0" />}
                        </li>
                      ))}
                    </div>
                  </ul>
                </div>
              </div>
              <div className="col-lg-2 col-md-12">
                <button onClick={handleSubmit} className="btn-save-timing w-100">
                  <FaCheckCircle className="me-2"/> Process
                </button>
              </div>
            </div>
          </div>
        )}

        {/* --- AUDIT SECTION --- */}
        <div className="ba-audit-section">
          <div className="ba-audit-header">
            <div className="d-flex align-items-center gap-3">
              <FaHistory className="icon-primary" size={20} />
              <h5 className="m-0 fw-bold section-title-text">Attendance Records Audit</h5>
              <span className="audit-tag d-none d-sm-inline-block">Live Feed</span>
            </div>
          </div>

          <div className="audit-filter-bar">
            <div className="filter-col">
              <label className="timing-label">Filter Date</label>
              <div className="ba-input-group">
                <FaCalendarAlt className="icon-primary" />
                <input type="date" className="date-input" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} />
              </div>
            </div>
            <div className="filter-col">
              <label className="timing-label">Staff Identity</label>
              <div className="ba-input-group">
                <FaUsers className="icon-primary" />
                <select value={filterEmp} onChange={(e) => setFilterEmp(e.target.value)}>
                  <option value="">All Personnel</option>
                  {employees.map((emp) => <option key={emp._id} value={emp._id}>{emp.name}</option>)}
                </select>
              </div>
            </div>
            <div className="filter-col-btn">
              <button onClick={applyFilter} className="btn-apply-filter w-100">
                <FaFilter size={14} /> Apply Filters
              </button>
            </div>
          </div>

          {/* RESPONSIVE TABLE CONTAINER */}
          <div className="ba-table-container pb-3">
            <div className="table-responsive-wrapper">
              <table className="ba-premium-table m-0">
                <thead>
                  <tr>
                    <th width="10%" className="text-center">S No</th>
                    <th width="40%">Employee Profile</th>
                    <th width="25%">Marked Date</th>
                    <th width="25%">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.length > 0 ? (
                    currentItems.map((att, idx) => (
                      <tr key={att._id || idx}>
                        <td data-label="S No" className="text-md-center">
                           <div className="index-circle mx-md-auto">{indexOfFirstItem + idx + 1}</div>
                        </td>
                        <td data-label="Employee Profile">
                          <div className="fw-bold emp-name-highlight">{att?.employeeId?.name || "Unknown"}</div>
                          <div className="emp-email-text">{att?.employeeId?.email || "No Email"}</div>
                        </td>
                        <td data-label="Marked Date" className="fw-medium">
                          {new Date(att.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                        <td data-label="Status">
                          <span className={`status-pill ${att.status === 'Absent' ? 'status-absent' : 'status-present'}`}>
                            <FaCheckCircle size={12} /> {att.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="py-5 text-center text-muted">
                        <div className="opacity-50 mb-2"><FaSearch size={30} /></div>
                        No matching records found in audit logs.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* PAGINATION */}
            {markedEmployees.length > 0 && (
              <div className="pagination-footer px-4 pt-3 mt-1 border-top-subtle">
                <span className="pagination-info text-muted">
                  Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, markedEmployees.length)} of {markedEmployees.length} entries
                </span>
                <div className="ba-pagination-controls d-flex gap-2 mt-2 mt-sm-0">
                  <button onClick={paginatePrev} disabled={currentPage === 1} className="ba-page-btn">
                    <FaChevronLeft size={12} /> Prev
                  </button>
                  <div className="ba-page-indicator">{currentPage} / {totalPages}</div>
                  <button onClick={paginateNext} disabled={currentPage === totalPages} className="ba-page-btn">
                    Next <FaChevronRight size={12} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DynamicLayout>
  );
};

export default BulkAttendancePanel;