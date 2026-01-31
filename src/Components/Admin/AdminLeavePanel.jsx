import React, { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import AdminLayout from "./AdminLayout";
import "./AdminLeavePanel.css";
// Icons
import { 
  BiCheck, BiX, BiTimeFive, BiSearch, BiFilter, BiCalendar, 
  BiUserCheck, BiUserX, BiFileBlank 
} from "react-icons/bi";
import { BsCheckCircleFill, BsXCircleFill, BsClockFill } from "react-icons/bs";

const AdminLeavePanel = () => {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const token = JSON.parse(localStorage.getItem("user"))?.token;

  useEffect(() => {
    fetchLeaves();
  }, []);

  const fetchLeaves = async () => {
    setLoading(true);
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/leaves`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setLeaves(res.data.data || []);
    } catch {
      Swal.fire("Error", "Failed to load leave requests", "error");
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, newStatus) => {
    const isDark = document.body.getAttribute('data-theme') === 'dark';
    
    Swal.fire({
      title: `Confirm ${newStatus}?`,
      text: `Are you sure you want to ${newStatus.toLowerCase()} this request?`,
      icon: newStatus === 'Approved' ? 'question' : 'warning',
      background: isDark ? '#1e293b' : '#fff',
      color: isDark ? '#fff' : '#000',
      showCancelButton: true,
      confirmButtonColor: newStatus === 'Approved' ? '#10b981' : '#ef4444',
      confirmButtonText: `Yes, ${newStatus}`,
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await axios.put(
            `${import.meta.env.VITE_API_URL}/api/leaves/${id}`,
            { status: newStatus },
            { headers: { Authorization: `Bearer ${token}` } }
          );
          
          Swal.fire({
            title: "Success", 
            text: `Leave request ${newStatus}`, 
            icon: "success",
            background: isDark ? '#1e293b' : '#fff',
            color: isDark ? '#fff' : '#000'
          });
          fetchLeaves();
        } catch (error) {
          Swal.fire("Error", "Something went wrong", "error");
        }
      }
    });
  };

  // --- Calculating Stats ---
  const pendingCount = leaves.filter(l => l.status === 'Pending').length;
  const approvedCount = leaves.filter(l => l.status === 'Approved').length;
  const rejectedCount = leaves.filter(l => l.status === 'Rejected').length;

  // --- Filtering Logic ---
  const filteredLeaves = leaves.filter(l =>
    (l.employeeId?.name?.toLowerCase().includes(search.toLowerCase()) || 
     l.leaveType.toLowerCase().includes(search.toLowerCase())) &&
    (statusFilter ? l.status === statusFilter : true)
  );

  // Helper for Date Format
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric', month: 'short', year: 'numeric'
    });
  };

  // Helper for Duration
  const getDuration = (start, end) => {
    const s = new Date(start);
    const e = new Date(end);
    const diffTime = Math.abs(e - s);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; 
    return `${diffDays} Days`;
  };

  return (
    <AdminLayout>
      <div className="leave-container">
        
        {/* --- STATS CARDS --- */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon" style={{background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b'}}>
               <BiTimeFive />
            </div>
            <div className="stat-info">
              <h4>{pendingCount}</h4>
              <p>Pending Requests</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{background: 'rgba(16, 185, 129, 0.15)', color: '#10b981'}}>
               <BiUserCheck />
            </div>
            <div className="stat-info">
              <h4>{approvedCount}</h4>
              <p>Approved Leaves</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon" style={{background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444'}}>
               <BiUserX />
            </div>
            <div className="stat-info">
              <h4>{rejectedCount}</h4>
              <p>Rejected Requests</p>
            </div>
          </div>
        </div>

        {/* --- MAIN PANEL --- */}
        <div className="panel-header">
          <div className="panel-title">
            <h2><BiFileBlank className="text-primary"/> Leave Management</h2>
          </div>
          <div className="filter-bar">
            <div style={{position:'relative'}}>
               <BiSearch style={{position:'absolute', left:'10px', top:'10px', color:'var(--text-secondary)'}}/>
               <input 
                 className="search-input" 
                 placeholder="Search Employee..." 
                 value={search}
                 onChange={(e) => setSearch(e.target.value)}
                 style={{paddingLeft: '32px'}}
               />
            </div>
            <div style={{position:'relative'}}>
               <BiFilter style={{position:'absolute', left:'10px', top:'10px', color:'var(--text-secondary)'}}/>
               <select 
                 className="filter-select"
                 value={statusFilter}
                 onChange={(e) => setStatusFilter(e.target.value)}
                 style={{paddingLeft: '30px'}}
               >
                 <option value="">All Status</option>
                 <option value="Pending">Pending</option>
                 <option value="Approved">Approved</option>
                 <option value="Rejected">Rejected</option>
               </select>
            </div>
          </div>
        </div>

        <div className="table-wrapper">
          <table className="leave-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Leave Type</th>
                <th>Duration</th>
                <th>Dates</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center py-5">
                    <div className="spinner-border text-primary" role="status"></div>
                  </td>
                </tr>
              ) : filteredLeaves.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-5 text-muted">
                    No leave requests found.
                  </td>
                </tr>
              ) : (
                filteredLeaves.map((leave) => (
                  <tr key={leave._id}>
                    <td>
                      <div className="employee-cell">
                        <div className="avatar-circle">
                          {leave.employeeId?.name?.charAt(0).toUpperCase()}
                        </div>
                        <div className="emp-details">
                          <h5>{leave.employeeId?.name}</h5>
                          <span>{leave.employeeId?.email}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span style={{fontWeight:'500'}}>{leave.leaveType}</span>
                    </td>
                    <td>
                      <div className="d-flex align-items-center gap-1">
                        <span style={{background: 'var(--bg-page)', padding: '2px 8px', borderRadius:'4px', fontSize:'12px'}}>
                          {getDuration(leave.startDate, leave.endDate)}
                        </span>
                      </div>
                    </td>
                    <td>
                       <div className="d-flex align-items-center gap-1 text-secondary" style={{fontSize:'13px'}}>
                          <BiCalendar /> {formatDate(leave.startDate)} - {formatDate(leave.endDate)}
                       </div>
                    </td>
                    <td>
                      {leave.status === 'Pending' && (
                        <span className="status-badge pending"><BsClockFill size={10}/> Pending</span>
                      )}
                      {leave.status === 'Approved' && (
                        <span className="status-badge approved"><BsCheckCircleFill size={10}/> Approved</span>
                      )}
                      {leave.status === 'Rejected' && (
                        <span className="status-badge rejected"><BsXCircleFill size={10}/> Rejected</span>
                      )}
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button 
                          className="btn-icon btn-approve" 
                          title="Approve"
                          disabled={leave.status !== 'Pending'}
                          onClick={() => updateStatus(leave._id, 'Approved')}
                        >
                          <BiCheck />
                        </button>
                        <button 
                          className="btn-icon btn-reject" 
                          title="Reject"
                          disabled={leave.status !== 'Pending'}
                          onClick={() => updateStatus(leave._id, 'Rejected')}
                        >
                          <BiX />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>
    </AdminLayout>
  );
};

export default AdminLeavePanel;