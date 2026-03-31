import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import moment from "moment";
import { toast } from "react-toastify";
import { 
  BiBarChartSquare, BiCloudDownload, BiSearch, BiFilterAlt, 
  BiUserCheck, BiTimeFive, BiPieChartAlt, BiLoaderAlt,
  BiChevronLeft, BiChevronRight
} from "react-icons/bi";
import { FaCheckCircle, FaTimesCircle, FaClock } from "react-icons/fa";
import "./LeaveReports.css"; // Ensure this import exists

const LeaveReports = () => {
  const API_URL = import.meta.env.VITE_API_URL;

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10); 

  const [filters, setFilters] = useState({
    type: "Monthly",
    month: moment().format("YYYY-MM"),
    year: moment().format("YYYY"),
    search: ""
  });

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
        const res = await axios.get(`${API_URL}/api/my-modules`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.detailed?.leave_requests) {
          setPerms(res.data.detailed.leave_requests);
        }
      } catch (e) {}
    };
    fetchPerms();
  }, [token, isAdmin, API_URL]);

  useEffect(() => {
    if(!token) return;
    const timer = setTimeout(() => { fetchReport(); }, 500);
    return () => clearTimeout(timer);
  }, [filters.type, filters.month, filters.year, token]);

  useEffect(() => { setCurrentPage(1); }, [filters.search, filters.month, filters.year, filters.type]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const params = {
        type: filters.type,
        ...(filters.type === "Monthly" ? { month: filters.month } : { year: filters.year })
      };

      const res = await axios.get(`${API_URL}/api/leaves/report`, { 
        params, headers: { Authorization: `Bearer ${token}` } 
      });

      if (res.data && res.data.success) setData(res.data.data || []);
      else setData([]);
    } catch (err) {
      toast.error(`Error: ${err.response?.data?.message || err.message || "Failed to load report"}`);
      setData([]); 
    } finally { setLoading(false); }
  };

  const filteredData = useMemo(() => {
    if (!Array.isArray(data)) return [];
    return data.filter(item => {
      const empName = item?.employeeId?.name || "Unknown";
      const lType = item?.leaveType || "";
      const searchStr = filters.search.toLowerCase();
      return empName.toLowerCase().includes(searchStr) || lType.toLowerCase().includes(searchStr);
    });
  }, [data, filters.search]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredData.length / itemsPerPage) || 1;

  const stats = useMemo(() => {
    return {
      total: filteredData.length,
      approved: filteredData.filter(d => d.status === 'Approved').length,
      pending: filteredData.filter(d => d.status === 'Pending').length,
      rejected: filteredData.filter(d => d.status === 'Rejected').length,
    };
  }, [filteredData]);

  const handleExport = () => toast.info("Exporting data to CSV...");

  const getStatusPill = (status) => {
    switch(status) {
      case "Approved": return <span className="lr-status-pill approved"><FaCheckCircle className="me-1"/> Approved</span>;
      case "Rejected": return <span className="lr-status-pill rejected"><FaTimesCircle className="me-1"/> Rejected</span>;
      default: return <span className="lr-status-pill pending"><FaClock className="me-1"/> Pending</span>;
    }
  };

  return (
    <div className="lr-wrapper">
      <div className="lr-header-card">
        <div className="lr-header-title">
          <h2 className="lr-title">
            <span className="lr-title-icon"><BiPieChartAlt /></span> Leave Analytics
          </h2>
          <p className="lr-subtitle">Real-time insights on employee time-off patterns.</p>
        </div>
        
        <div className="lr-filters">
          <div className="lr-type-toggle">
             <button onClick={() => setFilters({...filters, type: "Monthly"})} className={`lr-toggle-btn ${filters.type === "Monthly" ? "active" : ""}`}>Monthly</button>
             <button onClick={() => setFilters({...filters, type: "Yearly"})} className={`lr-toggle-btn ${filters.type === "Yearly" ? "active" : ""}`}>Yearly</button>
          </div>
          <div className="lr-date-picker">
            {filters.type === "Monthly" ? (
              <input type="month" className="lr-input" value={filters.month} onChange={e => setFilters({...filters, month: e.target.value})} />
            ) : (
              <input type="number" className="lr-input" value={filters.year} onChange={e => setFilters({...filters, year: e.target.value})} placeholder="Year" />
            )}
          </div>
          <button onClick={handleExport} className="lr-btn-primary">
             <BiCloudDownload size={20} /> <span className="d-none d-sm-inline">Export</span>
          </button>
        </div>
      </div>

      <div className="lr-stats-grid">
          <StatCard label="Total Requests" value={stats.total} icon={<BiBarChartSquare />} colorClass="blue" />
          <StatCard label="Approved" value={stats.approved} icon={<BiUserCheck />} colorClass="green" />
          <StatCard label="Pending" value={stats.pending} icon={<BiTimeFive />} colorClass="yellow" />
          <StatCard label="Rejected" value={stats.rejected} icon={<BiFilterAlt />} colorClass="red" />
      </div>

      <div className="lr-table-card">
        <div className="lr-table-header">
            <h3 className="lr-table-title">Detailed Logs</h3>
            <div className="lr-search-box">
                <BiSearch className="lr-search-icon" />
                <input type="text" placeholder="Search employee or leave type..." className="lr-input-search" value={filters.search} onChange={e => setFilters({...filters, search: e.target.value})} />
            </div>
        </div>
        
        <div className="lr-table-responsive">
          <table className="lr-table">
            <thead>
              <tr>
                  <th>Employee</th>
                  <th>Leave Type</th>
                  <th>Duration</th>
                  <th>Applied On</th>
                  <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                  <tr><td colSpan="5" className="text-center py-5"><BiLoaderAlt className="lr-spin mx-auto"/></td></tr>
              ) : currentItems.length > 0 ? (
                  currentItems.map((row) => (
                  <tr key={row._id}>
                      <td data-label="Employee">
                          <div className="lr-emp-name">{row.employeeId?.name || "Unknown"}</div>
                          <div className="lr-emp-id">{row.employeeId?.employeeId || "N/A"}</div>
                      </td>
                      <td data-label="Leave Type"><span className="lr-type-badge">{row.leaveType || "--"}</span></td>
                      <td data-label="Duration">
                          <div className="lr-date-range">{row.startDate ? moment(row.startDate).format("MMM DD") : ""} - {row.endDate ? moment(row.endDate).format("MMM DD") : ""}</div>
                          <div className="lr-days-count">{row.days || 0} Days</div>
                      </td>
                      <td data-label="Applied On" className="lr-applied-date">{row.appliedDate ? moment(row.appliedDate).format("MMM DD, YYYY") : (row.createdAt ? moment(row.createdAt).format("MMM DD, YYYY") : "--")}</td>
                      <td data-label="Status">{getStatusPill(row.status)}</td>
                  </tr>
                  ))
              ) : (
                  <tr><td colSpan="5" className="text-center py-5 text-muted">No records found.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {filteredData.length > 0 && !loading && (
            <div className="lr-pagination">
                <div className="lr-page-info">
                    Showing <strong>{indexOfFirstItem + 1}</strong> to <strong>{Math.min(indexOfLastItem, filteredData.length)}</strong> of <strong>{filteredData.length}</strong> entries
                </div>
                <div className="lr-page-controls">
                    <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="lr-btn-page"><BiChevronLeft size={20} /></button>
                    <div className="lr-page-current">Page {currentPage} of {totalPages}</div>
                    <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="lr-btn-page"><BiChevronRight size={20} /></button>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

const StatCard = ({ label, value, icon, colorClass }) => (
    <div className={`lr-stat-card ${colorClass}`}>
        <div className="lr-stat-icon">{icon}</div>
        <div>
            <p className="lr-stat-label">{label}</p>
            <p className="lr-stat-value">{value}</p>
        </div>
    </div>
);

export default LeaveReports;