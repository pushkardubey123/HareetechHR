import React, { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import AdminLayout from "./AdminLayout";
import { FaCheckCircle, FaCalendarAlt, FaUserCheck, FaSearch, FaUsers, FaFilter, FaHistory, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import "./BulkAttendence.css";

const BulkAttendancePanel = () => {
  const [employees, setEmployees] = useState([]);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  
  // Date States
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  
  // Audit States
  const [allAttendance, setAllAttendance] = useState([]); 
  const [markedEmployees, setMarkedEmployees] = useState([]); 
  const [filterDate, setFilterDate] = useState("");
  const [filterEmp, setFilterEmp] = useState("");
  const [empSearch, setEmpSearch] = useState("");

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; // Ek page pe 10 records dikhenge

  const user = JSON.parse(localStorage.getItem("user"));

  const fetchData = async () => {
    try {
      const [empRes, attRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_URL}/user`, {
          headers: { Authorization: `Bearer ${user.token}` },
        }),
        axios.get(`${import.meta.env.VITE_API_URL}/api/attendance`, {
          headers: { Authorization: `Bearer ${user.token}` },
        })
      ]);
      setEmployees(empRes.data?.data || []);
      const all = Object.values(attRes.data?.data || {}).flat();
      setAllAttendance(all);
      setMarkedEmployees(all);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async () => {
    // Single Day Handle Logic: Agar endDate nahi hai, toh startDate ko hi endDate maan lo
    if (!startDate || selectedEmployees.length === 0) {
      return Swal.fire("Error", "Start Date and Staff Members are required", "warning");
    }

    const finalEndDate = endDate || startDate; 

    if (new Date(finalEndDate) < new Date(startDate)) {
       return Swal.fire("Invalid Date", "End Date cannot be before Start Date", "warning");
    }

    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/attendance/bulk`,
        { employeeIds: selectedEmployees, startDate, endDate: finalEndDate },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      
      Swal.fire({ 
        icon: 'success', 
        title: 'Records Processed', 
        text: res.data.message,
        showConfirmButton: true 
      });
      
      fetchData();
      setSelectedEmployees([]);
      setStartDate("");
      setEndDate("");
      setCurrentPage(1); // Reset to first page after new entry
    } catch (err) { 
      Swal.fire("Error", err.response?.data?.message || "Submission failed", "error"); 
    }
  };

  const applyFilter = () => {
    let filtered = [...allAttendance];
    if (filterDate) filtered = filtered.filter((item) => item.date.split("T")[0] === filterDate);
    if (filterEmp) filtered = filtered.filter((item) => item.employeeId?._id === filterEmp);
    setMarkedEmployees(filtered);
    setCurrentPage(1); // Filter lagane par page 1 par wapas aao
  };
  
  const toggleEmployee = (id) => {
    setSelectedEmployees((prev) =>
      prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id]
    );
  };

  // --- PAGINATION LOGIC ---
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = markedEmployees.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(markedEmployees.length / itemsPerPage);

  const paginatePrev = () => setCurrentPage(prev => Math.max(prev - 1, 1));
  const paginateNext = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));

  return (
    <AdminLayout>
      <div className="bulk-at-page">
        <div className="ts-header mb-4">
          <h2 className="ba-title">Bulk Attendance System</h2>
          <p className="m-0" style={{ color: "var(--ba-muted)", fontSize: "0.95rem" }}>
            Efficiently manage mass attendance entries. Leave "End Date" blank for a single day.
          </p>
        </div>

        {/* Action Card */}
        <div className="ba-glass-card">
          <div className="row g-4 align-items-end">
            
            <div className="col-lg-3 col-md-6">
              <label className="timing-label">Start Date <span className="text-danger">*</span></label>
              <div className="ba-input-group">
                <FaCalendarAlt className="text-primary" />
                <input 
                  type="date" 
                  value={startDate} 
                  onChange={(e) => setStartDate(e.target.value)} 
                  max={endDate || undefined} 
                />
              </div>
            </div>

            <div className="col-lg-3 col-md-6">
              <label className="timing-label">End Date (Optional)</label>
              <div className="ba-input-group">
                <FaCalendarAlt className="text-muted" />
                <input 
                  type="date" 
                  value={endDate} 
                  onChange={(e) => setEndDate(e.target.value)} 
                  min={startDate || undefined} 
                />
              </div>
            </div>

            <div className="col-lg-4 col-md-12">
              <label className="timing-label">Staff Members <span className="text-danger">*</span></label>
              <div className="dropdown w-100">
                <button className="ba-dropdown-btn dropdown-toggle d-flex justify-content-between align-items-center" type="button" data-bs-toggle="dropdown">
                  <span className="d-flex align-items-center gap-2">
                    <FaUsers className="text-primary" />
                    {selectedEmployees.length === 0 ? "Select Personnel" : `${selectedEmployees.length} Members Chosen`}
                  </span>
                </button>
                <ul className="dropdown-menu p-3">
                  <div className="ba-input-group mb-3" onClick={(e) => e.stopPropagation()}>
                    <FaSearch className="text-muted" />
                    <input type="text" placeholder="Search staff..." value={empSearch} onChange={(e) => setEmpSearch(e.target.value)} />
                  </div>
                  <div style={{ maxHeight: "220px", overflowY: "auto" }}>
                    {employees.filter(e => e.name.toLowerCase().includes(empSearch.toLowerCase())).map((emp) => (
                      <li key={emp._id} className="dropdown-item rounded-3 d-flex justify-content-between align-items-center py-2" onClick={(e) => { e.stopPropagation(); toggleEmployee(emp._id); }}>
                        <span style={{color: 'var(--ba-text)', fontWeight: '500'}}>{emp.name}</span>
                        {selectedEmployees.includes(emp._id) && <FaUserCheck className="text-success" />}
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

        {/* --- AUDIT SECTION --- */}
        <div className="ba-audit-section">
          <div className="ba-audit-header">
            <div className="d-flex align-items-center gap-3">
              <FaHistory className="text-primary" size={20} />
              <h5 className="m-0 fw-bold">Attendance Records Audit</h5>
              <span className="audit-tag">Live Feed</span>
            </div>
          </div>

          <div className="audit-filter-bar">
            <div>
              <label className="timing-label">Filter Date</label>
              <div className="ba-input-group">
                <FaCalendarAlt className="text-primary" />
                <input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} />
              </div>
            </div>
            <div>
              <label className="timing-label">Staff Identity</label>
              <div className="ba-input-group">
                <FaUsers className="text-primary" />
                <select value={filterEmp} onChange={(e) => setFilterEmp(e.target.value)}>
                  <option value="">All Personnel</option>
                  {employees.map((emp) => <option key={emp._id} value={emp._id}>{emp.name}</option>)}
                </select>
              </div>
            </div>
            <button onClick={applyFilter} className="btn-save-timing" style={{ height: '45px', background: '#334155' }}>
              <FaFilter size={14} /> Apply Filters
            </button>
          </div>

          <div className="ba-table-container pb-3">
            <table className="ba-modern-table mb-3">
              <thead>
                <tr>
                  <th style={{ width: '80px', textAlign: 'center' }}>S No</th>
                  <th>Employee Profile</th>
                  <th style={{ textAlign: 'center' }}>Marked Date</th>
                  <th style={{ textAlign: 'center' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.length > 0 ? (
                  currentItems.map((att, idx) => (
                    <tr key={att._id || idx}>
                      {/* Accurate serial number based on pagination */}
                      <td><div className="index-circle m-auto">{indexOfFirstItem + idx + 1}</div></td>
                      <td>
                        <div style={{ fontWeight: '700', color: 'var(--ba-primary)' }}>{att?.employeeId?.name || "Unknown"}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--ba-muted)' }}>{att?.employeeId?.email || "No Email"}</div>
                      </td>
                      <td style={{ textAlign: 'center', fontWeight: '500' }}>
                        {new Date(att.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span className="status-pill status-present">
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

            {/* Pagination Controls */}
            {markedEmployees.length > 0 && (
              <div className="d-flex justify-content-between align-items-center px-4 pt-2">
                <span style={{ color: 'var(--ba-muted)', fontSize: '0.85rem', fontWeight: '500' }}>
                  Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, markedEmployees.length)} of {markedEmployees.length} entries
                </span>
                <div className="ba-pagination-controls d-flex gap-2">
                  <button onClick={paginatePrev} disabled={currentPage === 1} className="ba-page-btn">
                    <FaChevronLeft size={12} /> Prev
                  </button>
                  <div className="ba-page-indicator">
                    {currentPage} / {totalPages}
                  </div>
                  <button onClick={paginateNext} disabled={currentPage === totalPages} className="ba-page-btn">
                    Next <FaChevronRight size={12} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default BulkAttendancePanel;