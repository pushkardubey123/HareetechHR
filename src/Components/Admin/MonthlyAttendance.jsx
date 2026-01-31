import React, { useEffect, useState } from "react";
import axios from "axios";
import AdminLayout from "../Admin/AdminLayout";
import { format } from "date-fns";
import { Form, Spinner, Tooltip, OverlayTrigger } from "react-bootstrap";
import { BiSolidCalendar } from "react-icons/bi";
import { FaFileExcel, FaFilePdf, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import "./MonthlyAttendance.css";

const MonthlyAttendance = () => {
  const user = JSON.parse(localStorage.getItem("user"));
  
  // --- States ---
  const [month, setMonth] = useState(format(new Date(), "yyyy-MM"));
  const [attendanceData, setAttendanceData] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [loading, setLoading] = useState(false);

  // --- Pagination States ---
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15; // Set limit

  // Date Logic
  const year = parseInt(month.split("-")[0]);
  const monthIndex = parseInt(month.split("-")[1]) - 1;
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const monthName = new Date(year, monthIndex).toLocaleString('default', { month: 'long', year: 'numeric' });

  const isWeekend = (day) => {
    const date = new Date(year, monthIndex, day);
    const d = date.getDay();
    return d === 0;
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [attRes, empRes] = await Promise.all([
          axios.get(`${import.meta.env.VITE_API_URL}/api/attendance/monthly?month=${month}`, { headers: { Authorization: `Bearer ${user.token}` } }),
          axios.get(`${import.meta.env.VITE_API_URL}/user`, { headers: { Authorization: `Bearer ${user.token}` } })
        ]);
        setAttendanceData(attRes.data.data);
        setEmployees(empRes.data.data);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchData();
  }, [month, user.token]);

  // Reset Page when Filter Changes
  useEffect(() => {
    setCurrentPage(1);
  }, [month, selectedEmployee]);

  // --- Data Processing ---
  const getEmployeeList = () => {
    const empMap = {};
    Object.values(attendanceData).flat().forEach((record) => {
      const emp = record.employeeId;
      if (!emp || (selectedEmployee && selectedEmployee !== emp._id)) return;
      if (!empMap[emp._id]) empMap[emp._id] = { name: emp.name, role: emp.role || "Employee", attendance: {}, present: 0, absent: 0, late: 0 };
      const day = new Date(record.date).getDate();
      const status = record.status || "-";
      empMap[emp._id].attendance[day] = status;
      if (status === "Present") empMap[emp._id].present++;
      if (status === "Absent") empMap[emp._id].absent++;
      if (status === "Late") empMap[emp._id].late++;
    });

    if(!selectedEmployee) {
        employees.forEach(emp => {
            if(!empMap[emp._id]) empMap[emp._id] = { name: emp.name, role: emp.role || "Employee", attendance: {}, present: 0, absent: 0, late: 0 };
        });
    }
    return Object.values(empMap).sort((a,b) => a.name.localeCompare(b.name));
  };

  // Full List
  const fullList = getEmployeeList();

  // --- Pagination Logic ---
  const totalPages = Math.ceil(fullList.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentEmployees = fullList.slice(indexOfFirstItem, indexOfLastItem);

  // Render Status
  const renderStatusCell = (status) => {
    if (!status) return <span className="status-off">-</span>;
    const s = status.charAt(0).toUpperCase();
    let badgeClass = "status-off";
    if (s === 'P') badgeClass = "status-p";
    if (s === 'A') badgeClass = "status-a";
    if (s === 'L') badgeClass = "status-l";
    return (
        <OverlayTrigger placement="top" overlay={<Tooltip>{status}</Tooltip>}>
             <div className={`status-badge ${badgeClass}`}>{s}</div>
        </OverlayTrigger>
    );
  };

  return (
    <AdminLayout>
      <div className="container-fluid p-3 h-100 d-flex flex-column">
        
        {/* Toolbar */}
        <div className="custom-toolbar p-3 rounded-3 shadow-sm mb-3 d-flex flex-wrap justify-content-between align-items-center gap-3">
             <div className="d-flex align-items-center">
                <div className="bg-primary bg-opacity-10 p-2 rounded text-primary me-3">
                    <BiSolidCalendar size={24} />
                </div>
                <div>
                    <h5 className="mb-0 fw-bold">Attendance Sheet</h5>
                    <small style={{color: 'var(--text-muted)'}}>{monthName}</small>
                </div>
             </div>
             <div className="d-flex gap-2 align-items-center flex-wrap">
                <div className="d-flex align-items-center gap-2">
                    <input type="month" className="form-control form-control-sm w-auto" 
                           value={month} onChange={(e) => setMonth(e.target.value)} />
                    <Form.Select size="sm" className="w-auto" 
                        value={selectedEmployee} onChange={(e) => setSelectedEmployee(e.target.value)}>
                        <option value="">All Employees</option>
                        {employees.map(e => <option key={e._id} value={e._id}>{e.name}</option>)}
                    </Form.Select>
                </div>
                <div className="vr mx-2 h-auto" style={{borderColor: 'var(--border-color)'}}></div>
                <button className="btn btn-sm btn-outline-success"><FaFileExcel /> Excel</button>
                <button className="btn btn-sm btn-outline-danger"><FaFilePdf /> PDF</button>
             </div>
        </div>

        {/* --- Table Wrapper (Flex Container) --- */}
        <div className="attendance-ui-wrapper">
          
          {/* 1. Scrollable Table Area */}
          <div className="table-responsive-box">
            {loading ? (
              <div className="d-flex flex-column justify-content-center align-items-center h-100">
                  <Spinner animation="border" variant="primary" />
                  <p className="mt-2" style={{color: 'var(--text-muted)'}}>Loading data...</p>
              </div>
            ) : (
              <table className="report-table">
                <thead>
                  <tr>
                    <th className="name-sticky">Employee</th>
                    {[...Array(daysInMonth)].map((_, i) => (
                        <th key={i} style={{color: isWeekend(i+1) ? '#6366f1' : 'inherit'}}>{i + 1}</th>
                    ))}
                    <th className="text-success bg-success bg-opacity-10">P</th>
                    <th className="text-danger bg-danger bg-opacity-10">A</th>
                    <th className="text-warning bg-warning bg-opacity-10">L</th>
                  </tr>
                </thead>
                <tbody>
                  {currentEmployees.map((emp, idx) => (
                    <tr key={idx}>
                      <td className="name-sticky">
                         <div className="d-flex align-items-center gap-2">
                            <div className="rounded-circle d-flex align-items-center justify-content-center fw-bold shadow-sm" 
                                 style={{
                                    width:'32px', height:'32px', fontSize:'12px',
                                    background: 'linear-gradient(135deg, #4f46e5, #818cf8)', color: '#fff'
                                 }}>
                                {emp.name.substring(0,2).toUpperCase()}
                            </div>
                            <div className="d-flex flex-column">
                                <span className="fw-semibold" style={{fontSize: '0.85rem'}}>{emp.name}</span>
                                <span style={{fontSize: '0.7rem', color: 'var(--text-muted)'}}>{emp.role}</span>
                            </div>
                         </div>
                      </td>
                      {[...Array(daysInMonth)].map((_, i) => (
                        <td key={i} className={`text-center ${isWeekend(i+1) ? 'weekend-cell' : ''}`}>
                             {renderStatusCell(emp.attendance[i + 1])}
                        </td>
                      ))}
                      <td className="fw-bold text-success text-center bg-success bg-opacity-10">{emp.present}</td>
                      <td className="fw-bold text-danger text-center bg-danger bg-opacity-10">{emp.absent}</td>
                      <td className="fw-bold text-warning text-center bg-warning bg-opacity-10">{emp.late}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* 2. Fixed Pagination Footer */}
          {!loading && fullList.length > 0 && (
            <div className="pagination-footer">
                <span className="page-info">
                    Showing <span className="fw-bold text-primary">{indexOfFirstItem + 1}-{Math.min(indexOfLastItem, fullList.length)}</span> of {fullList.length}
                </span>
                
                <div className="pagination-btn-group">
                    <button className="pg-btn" disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)}>
                        <FaChevronLeft />
                    </button>
                    
                    {/* Page Numbers */}
                    {Array.from({ length: totalPages }, (_, i) => (
                       <button 
                          key={i} 
                          className={`pg-btn ${currentPage === i + 1 ? 'active' : ''}`}
                          onClick={() => setCurrentPage(i + 1)}
                       >
                          {i + 1}
                       </button>
                    ))}

                    <button className="pg-btn" disabled={currentPage === totalPages} onClick={() => setCurrentPage(prev => prev + 1)}>
                        <FaChevronRight />
                    </button>
                </div>
            </div>
          )}

        </div>

      </div>
    </AdminLayout>
  );
};

export default MonthlyAttendance;