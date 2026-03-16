import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import {
  FaEye, FaCheckCircle, FaTimesCircle, FaSearch, FaFilter, FaBriefcase, FaUserTie
} from "react-icons/fa";
import DynamicLayout from "../Admin/AdminLayout";
import "./AdminApplications.css"; // Ensure CSS is imported

const API_URL = import.meta.env.VITE_API_URL;

const AdminApplications = () => {
  const [allApplications, setAllApplications] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [jobFilter, setJobFilter] = useState("all");
  
  // Pagination
  const [page, setPage] = useState(1);
  const PER_PAGE = 10;

  const token = JSON.parse(localStorage.getItem("user"))?.token;
  const headers = { headers: { Authorization: `Bearer ${token}` } };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/api/applications`, headers);
      const data = res?.data?.data || [];
      setAllApplications(data);
      setApplications(data);
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Failed to load applications", "error");
    } finally {
      setLoading(false);
    }
  };

  const getFileUrl = (filePath) => {
    if (!filePath) return null;
    return `${API_URL}/static/${filePath.replace(/\\/g, "/").replace("uploads/", "")}`;
  };

  /* --- VIEW MODAL --- */
  const handleView = (app) => {
    const isDark = document.body.getAttribute('data-theme') === 'dark';
    const profile = app.profileImage
      ? `<img src="${getFileUrl(app.profileImage)}" style="width:80px; height:80px; border-radius:12px; object-fit:cover; border:2px solid #e2e8f0;">`
      : `<div style="width:80px; height:80px; border-radius:12px; background:#e0e7ff; color:#4f46e5; display:flex; align-items:center; justify-content:center; font-size:32px; font-weight:bold;">${(app.name || "?").slice(0, 1).toUpperCase()}</div>`;

    Swal.fire({
      title: `<h5 style="color:${isDark ? '#fff' : '#1e293b'}; margin:0;">Applicant Details</h5>`,
      html: `
        <div style="display:flex; gap:20px; text-align:left; font-family:'Inter', sans-serif; color:${isDark ? '#cbd5e1' : '#475569'};">
          <div>${profile}</div>
          <div style="flex:1;">
            <h4 style="margin:0 0 5px 0; color:${isDark ? '#fff' : '#1e293b'};">${app.name}</h4>
            <div style="font-size:0.9rem; margin-bottom:10px;">${app.jobId?.title || "Unknown Job"}</div>
            
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; font-size:0.85rem;">
               <div><strong>Email:</strong><br/>${app.email}</div>
               <div><strong>Phone:</strong><br/>${app.phone || "N/A"}</div>
               <div><strong>Status:</strong><br/>${app.status}</div>
            </div>

            <div style="margin-top:15px; display:flex; gap:10px;">
               ${app.resume ? `<a href="${getFileUrl(app.resume)}" target="_blank" class="swal2-confirm swal2-styled" style="background:#4f46e5; margin:0; padding:8px 16px; font-size:0.8rem;">View Resume</a>` : ''}
               ${app.coverLetter ? `<a href="${getFileUrl(app.coverLetter)}" target="_blank" class="swal2-cancel swal2-styled" style="background:#64748b; margin:0; padding:8px 16px; font-size:0.8rem;">Cover Letter</a>` : ''}
            </div>
          </div>
        </div>
      `,
      width: 600,
      showConfirmButton: false,
      showCloseButton: true,
      background: isDark ? '#1e293b' : '#fff'
    });
  };

  /* --- ACTIONS --- */
  const handleAction = async (id, type, currentStatus) => {
    if (type === 'shortlist' && (currentStatus === 'shortlisted' || currentStatus === 'interview_scheduled')) return;
    if (type === 'reject' && currentStatus === 'rejected') return;

    const isDark = document.body.getAttribute('data-theme') === 'dark';
    const actionText = type === 'shortlist' ? 'Shortlist Candidate' : 'Reject Application';
    const confirmBtnColor = type === 'shortlist' ? '#10b981' : '#ef4444';

    const ok = await Swal.fire({
      title: `${actionText}?`,
      text: "You can update the status later if needed.",
      icon: type === 'shortlist' ? 'question' : 'warning',
      showCancelButton: true,
      confirmButtonText: `Yes, ${type}`,
      confirmButtonColor: confirmBtnColor,
      background: isDark ? '#1e293b' : '#fff',
      color: isDark ? '#fff' : '#000'
    });

    if (!ok.isConfirmed) return;

    try {
      await axios.put(`${API_URL}/api/applications/${id}/${type}`, {}, headers);
      Swal.fire({ title: "Updated!", icon: "success", timer: 1500, showConfirmButton: false });
      fetchData();
    } catch (err) {
      Swal.fire("Error", "Action failed", "error");
    }
  };

  /* --- FILTERS & PAGINATION --- */
  const jobOptions = useMemo(() => {
    const set = new Set();
    allApplications.forEach((a) => a?.jobId?.title && set.add(a.jobId.title));
    return ["all", ...Array.from(set)];
  }, [allApplications]);

  useEffect(() => {
    const qLower = q.trim().toLowerCase();
    let list = [...allApplications];

    if (qLower) {
      list = list.filter(
        (a) => a.name?.toLowerCase().includes(qLower) || a.email?.toLowerCase().includes(qLower) || a.jobId?.title?.toLowerCase().includes(qLower)
      );
    }
    if (statusFilter !== "all") list = list.filter((a) => a.status === statusFilter);
    if (jobFilter !== "all") list = list.filter((a) => a.jobId?.title === jobFilter);
    
    setApplications(list);
    setPage(1);
  }, [q, statusFilter, jobFilter, allApplications]);

  const total = applications.length;
  const pages = Math.max(1, Math.ceil(total / PER_PAGE));
  const start = (page - 1) * PER_PAGE;
  const current = applications.slice(start, start + PER_PAGE);

  /* --- RENDER HELPERS --- */
  const getStatusBadge = (status) => {
    const map = {
      applied: 'status-applied',
      shortlisted: 'status-shortlisted',
      rejected: 'status-rejected',
      interview_scheduled: 'status-interview'
    };
    return <span className={`status-pill ${map[status] || ''}`}>{status.replace('_', ' ')}</span>;
  };

  return (
    <DynamicLayout>
      <div className="apps-container">
        
        {/* Header */}
        <div className="page-header">
          <div className="page-title">
            <FaUserTie className="text-primary" /> Application Tracker
          </div>
          
          <div className="filters-wrapper">
            {/* Search */}
            <div className="search-box">
              <FaSearch className="input-icon" />
              <input 
                type="text" className="custom-input" 
                placeholder="Search candidate..." 
                value={q} onChange={(e) => setQ(e.target.value)}
              />
            </div>

            {/* Status Filter */}
            <div className="search-box" style={{width: '180px'}}>
              <FaFilter className="input-icon" />
              <select className="custom-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="all">All Status</option>
                <option value="applied">Applied</option>
                <option value="shortlisted">Shortlisted</option>
                <option value="interview_scheduled">Interview</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            {/* Job Filter */}
            <div className="search-box" style={{width: '200px'}}>
              <FaBriefcase className="input-icon" />
              <select className="custom-select" value={jobFilter} onChange={(e) => setJobFilter(e.target.value)}>
                {jobOptions.map(opt => <option key={opt} value={opt}>{opt === 'all' ? 'All Jobs' : opt}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Table Card */}
        <div className="table-card">
          <div className="table-responsive">
            {loading ? (
              <div style={{padding:'20px'}}>
                 {[1,2,3,4,5].map(i => <div key={i} className="skeleton-row"></div>)}
              </div>
            ) : current.length === 0 ? (
              <div className="empty-state">
                <FaUserTie style={{fontSize:'40px', opacity:0.3, marginBottom:'10px'}}/>
                <p>No applications match your criteria.</p>
              </div>
            ) : (
              <table className="premium-table">
                <thead>
                  <tr>
                    <th>Candidate</th>
                    <th>Email / Phone</th>
                    <th>Applying For</th>
                    <th>Applied Date</th>
                    <th>Status</th>
                    <th style={{textAlign:'right'}}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {current.map((app) => (
                    <tr key={app._id}>
                      <td>
                        <div className="user-info">
                          {app.profileImage ? (
                            <img src={getFileUrl(app.profileImage)} className="avatar" alt="pic" />
                          ) : (
                            <div className="avatar-initial">{(app.name || "?").charAt(0).toUpperCase()}</div>
                          )}
                          <div className="user-meta">
                            <h6>{app.name || "Unknown"}</h6>
                            <span>{app.gender || "N/A"}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{display:'flex', flexDirection:'column', fontSize:'0.85rem'}}>
                           <span style={{fontWeight:500}}>{app.email}</span>
                           <span style={{color:'var(--aa-text-muted)'}}>{app.phone || "-"}</span>
                        </div>
                      </td>
                      <td>{app.jobId?.title || "—"}</td>
                      <td style={{color:'var(--aa-text-muted)'}}>
                        {app.createdAt ? new Date(app.createdAt).toLocaleDateString() : "-"}
                      </td>
                      <td>{getStatusBadge(app.status)}</td>
                      <td style={{textAlign:'right'}}>
                        <div style={{display:'flex', justifyContent:'flex-end', gap:'8px'}}>
                          <button className="action-btn btn-view" onClick={() => handleView(app)} title="View Details">
                            <FaEye />
                          </button>
                          
                          <button 
                            className={`action-btn btn-check ${app.status === 'shortlisted' ? 'disabled-btn' : ''}`}
                            onClick={() => handleAction(app._id, 'shortlist', app.status)}
                            title="Shortlist"
                          >
                            <FaCheckCircle />
                          </button>

                          <button 
                            className={`action-btn btn-x ${app.status === 'rejected' ? 'disabled-btn' : ''}`}
                            onClick={() => handleAction(app._id, 'reject', app.status)}
                            title="Reject"
                          >
                            <FaTimesCircle />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          {!loading && total > PER_PAGE && (
            <div className="pagination-footer">
              <span style={{fontSize:'0.85rem', color:'var(--aa-text-muted)', marginRight:'auto'}}>
                 Showing {start + 1}-{Math.min(start + PER_PAGE, total)} of {total}
              </span>
              <button className="pg-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Prev</button>
              <button className="pg-btn" disabled={page === pages} onClick={() => setPage(p => p + 1)}>Next</button>
            </div>
          )}
        </div>

      </div>
    </DynamicLayout>
  );
};

export default AdminApplications;