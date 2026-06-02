import React, { useEffect, useState } from "react";
import axios from "axios";
import DynamicLayout from "../Admin/AdminLayout";
import { format, differenceInDays } from "date-fns";
import { 
  FaCalendarAlt, 
  FaFileExport, 
  FaSearch, 
  FaCheckCircle, 
  FaTimesCircle, 
  FaClock,
  FaChevronLeft, 
  FaChevronRight
} from "react-icons/fa";
import "./LeaveReport.css";

const LeaveReport = () => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // ✅ PERMISSION LOGIC
  const userStr = localStorage.getItem("user");
  const userObj = userStr ? JSON.parse(userStr) : null;
  const token = userObj?.token;
  const isAdmin = userObj?.role === "admin";
  const [perms, setPerms] = useState({ view: false, create: false, edit: false, delete: false });

  useEffect(() => {
    const fetchPerms = async () => {
      if (isAdmin || !token) return;
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/my-modules`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.detailed?.leave_requests) {
          setPerms(res.data.detailed.leave_requests);
        }
      } catch (e) { console.error("Permission fetch failed", e); }
    };
    fetchPerms();
    fetchReport();
  }, [selectedMonth, token, isAdmin]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedMonth]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const url = `${import.meta.env.VITE_API_URL}/api/leaves/report?type=Monthly&month=${selectedMonth}`;
      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) {
        setLeaves(res.data.data);
      }
    } catch (error) {
      console.error("Error fetching report:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusPill = (status) => {
    switch(status) {
      case "Approved": return <span className="status-pill status-approved"><FaCheckCircle className="me-1"/> Approved</span>;
      case "Rejected": return <span className="status-pill status-rejected"><FaTimesCircle className="me-1"/> Rejected</span>;
      default: return <span className="status-pill status-pending"><FaClock className="me-1"/> Pending</span>;
    }
  };

  const filteredLeaves = leaves.filter(l => 
    l.employeeId?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredLeaves.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredLeaves.length / itemsPerPage);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
        setCurrentPage(newPage);
    }
  };

  return (
    <DynamicLayout>
      <div className="leave-container">
        
        <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
            <div>
                <h4 className="fw-bold mb-1" style={{color: 'var(--text-main)'}}>Monthly Leave Report</h4>
                <p className="small mb-0" style={{color: 'var(--text-muted)'}}>
                    Overview for <span className="fw-bold text-primary">{format(new Date(selectedMonth), "MMMM yyyy")}</span>
                </p>
            </div>
            <button className="btn btn-primary d-flex align-items-center gap-2 shadow-sm" style={{borderRadius: '8px'}}>
                <FaFileExport /> Export CSV
            </button>
        </div>

        <div className="premium-card mb-4 p-3">
          <div className="row g-3 align-items-center">
            
            <div className="col-md-4 col-sm-6">
              <div className="input-group shadow-sm" style={{borderRadius: '8px', overflow: 'hidden'}}>
                <span className="custom-icon-box">
                  <FaCalendarAlt />
                </span>
                <input 
                  type="month" 
                  className="form-control custom-input-field" 
                  value={selectedMonth}
                  onChange={(e) => {
                    setSelectedMonth(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>
            </div>

            <div className="col-md-4 col-sm-6 ms-auto">
              <div className="search-wrapper shadow-sm">
                <FaSearch className="search-icon" />
                <input 
                  type="text" 
                  className="search-input"
                  placeholder="Search employee by name..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>
            </div>
            
          </div>
        </div>

        <div className="premium-card p-0 overflow-hidden d-flex flex-column">
            <div className="leave-table-wrapper table-responsive mb-0" style={{minHeight: '300px'}}>
                <table className="table-premium w-100">
                    <thead>
                        <tr>
                            <th className="ps-4">Employee</th>
                            <th>Leave Type</th>
                            <th>Duration</th>
                            <th>Reason</th>
                            <th>Applied On</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan="6" className="text-center py-5">
                                    <div className="spinner-border text-primary mb-2" role="status"></div>
                                    <p className="text-muted small">Loading records...</p>
                                </td>
                            </tr>
                        ) : filteredLeaves.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="text-center py-5">
                                    <div className="opacity-25 mb-3" style={{fontSize: '2.5rem'}}>📅</div>
                                    <h6 className="text-muted fw-bold">No Leave Records Found</h6>
                                </td>
                            </tr>
                        ) : (
                            currentItems.map((leave, i) => {
                                const days = differenceInDays(new Date(leave.endDate), new Date(leave.startDate)) + 1;
                                return (
                                    <tr key={i}>
                                        <td className="ps-4">
                                            <div className="emp-cell">
                                                <div className="emp-avatar shadow-sm">
                                                    {leave.employeeId?.name?.substring(0,2).toUpperCase() || "NA"}
                                                </div>
                                                <div>
                                                    <div className="fw-bold" style={{fontSize: '0.9rem'}}>
                                                        {leave.employeeId?.name || "Unknown"}
                                                    </div>
                                                    <div className="small text-muted" style={{fontSize: '0.75rem'}}>
                                                        {leave.employeeId?.email}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td><span className="fw-medium">{leave.leaveType}</span></td>
                                        <td>
                                            <div className="d-flex flex-column small">
                                                <span className="fw-bold text-dark dark:text-light">
                                                    {days} {days > 1 ? 'Days' : 'Day'}
                                                </span>
                                                <span className="text-muted" style={{fontSize: '0.7rem'}}>
                                                    {format(new Date(leave.startDate), "dd MMM")} - {format(new Date(leave.endDate), "dd MMM")}
                                                </span>
                                            </div>
                                        </td>
                                        <td style={{maxWidth: '200px'}}>
                                            <div className="text-truncate text-muted small" title={leave.reason}>
                                                {leave.reason || "--"}
                                            </div>
                                        </td>
                                        <td className="text-muted small">
                                            {format(new Date(leave.createdAt || leave.startDate), "dd MMM yyyy")}
                                        </td>
                                        <td>{getStatusPill(leave.status)}</td>
                                    </tr>
                                )
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {!loading && filteredLeaves.length > 0 && (
                <div className="pagination-wrapper">
                    <span className="page-info">
                        Showing <span className="text-dark fw-bold">{indexOfFirstItem + 1}</span> to <span className="text-dark fw-bold">{Math.min(indexOfLastItem, filteredLeaves.length)}</span> of <span className="text-dark fw-bold">{filteredLeaves.length}</span> entries
                    </span>
                    
                    <div className="pagination-controls">
                        <button 
                            className="page-btn" 
                            disabled={currentPage === 1} 
                            onClick={() => handlePageChange(currentPage - 1)}
                        >
                            <FaChevronLeft />
                        </button>
                        
                        {Array.from({ length: totalPages }, (_, i) => (
                            <button 
                                key={i + 1} 
                                className={`page-btn ${currentPage === i + 1 ? 'active' : ''}`}
                                onClick={() => handlePageChange(i + 1)}
                            >
                                {i + 1}
                            </button>
                        ))}

                        <button 
                            className="page-btn" 
                            disabled={currentPage === totalPages} 
                            onClick={() => handlePageChange(currentPage + 1)}
                        >
                            <FaChevronRight />
                        </button>
                    </div>
                </div>
            )}
        </div>
      </div>
    </DynamicLayout>
  );
};

export default LeaveReport;