import React, { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import AdminLayout from "./AdminLayout";
import { FaCheckCircle, FaCalendarAlt, FaUserCheck, FaSearch, FaUsers, FaFilter, FaHistory } from "react-icons/fa";
import "./BulkAttendence.css";

const BulkAttendancePanel = () => {
  const [employees, setEmployees] = useState([]);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [allAttendance, setAllAttendance] = useState([]); 
  const [markedEmployees, setMarkedEmployees] = useState([]); 
  const [filterDate, setFilterDate] = useState("");
  const [filterEmp, setFilterEmp] = useState("");
  const [empSearch, setEmpSearch] = useState("");

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
    if (!selectedDate || selectedEmployees.length === 0) {
      return Swal.fire("Error", "Required fields missing", "info");
    }
    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/attendance/bulk`,
        { employeeIds: selectedEmployees, date: selectedDate },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      Swal.fire({ icon: 'success', title: 'Records Processed', showConfirmButton: false, timer: 1500 });
      fetchData();
      setSelectedEmployees([]);
      setSelectedDate("");
    } catch (err) { Swal.fire("Error", "Submission failed", "error"); }
  };

  const applyFilter = () => {
    let filtered = [...allAttendance];
    if (filterDate) filtered = filtered.filter((item) => item.date.split("T")[0] === filterDate);
    if (filterEmp) filtered = filtered.filter((item) => item.employeeId?._id === filterEmp);
    setMarkedEmployees(filtered);
  };
  
  const toggleEmployee = (id) => {
    setSelectedEmployees((prev) =>
      prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id]
    );
  };

  return (
    <AdminLayout>
      <div className="bulk-at-page">
        <div className="ts-header mb-4">
          <h2 className="ba-title">Bulk Attendance System</h2>
          <p className="m-0" style={{ color: "var(--ba-muted)", fontSize: "0.95rem" }}>
            Efficiently manage mass attendance entries for your staff members.
          </p>
        </div>

        {/* Action Card */}
        <div className="ba-glass-card">
          <div className="row g-4 align-items-end">
            <div className="col-lg-4 col-md-6">
              <label className="timing-label">Target Date</label>
              <div className="ba-input-group">
                <FaCalendarAlt className="text-primary" />
                <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
              </div>
            </div>

            <div className="col-lg-5 col-md-6">
              <label className="timing-label">Staff Members</label>
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

            <div className="col-lg-3 col-md-12">
              <button onClick={handleSubmit} className="btn-save-timing w-100">
                <FaCheckCircle /> Process Records
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

          <div className="ba-table-container">
            <table className="ba-modern-table">
              <thead>
                <tr>
                  <th style={{ width: '80px', textAlign: 'center' }}>S No</th>
                  <th>Employee Profile</th>
                  <th style={{ textAlign: 'center' }}>Marked Date</th>
                  <th style={{ textAlign: 'center' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {markedEmployees.length > 0 ? (
                  markedEmployees.map((att, idx) => (
                    <tr key={att._id || idx}>
                      <td><div className="index-circle m-auto">{idx + 1}</div></td>
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
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default BulkAttendancePanel;