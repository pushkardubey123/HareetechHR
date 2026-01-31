import React, { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../Admin/AdminLayout";
import { FaTrash, FaEdit, FaEye, FaPlus, FaBriefcase, FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import { CgFileDocument } from "react-icons/cg";
import moment from "moment";
import "./JobList.css"; // Ensure CSS is imported

const JobList = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const token = JSON.parse(localStorage.getItem("user"))?.token;
  const headers = { headers: { Authorization: `Bearer ${token}` } };

  /* ================= FETCH DATA ================= */
  const fetchJobs = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/jobs`, headers);
      setJobs(res.data.data || []);
    } catch (err) {
      Swal.fire("Error", err.response?.data?.message || err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  /* ================= ACTIONS ================= */
  const handleDelete = async (id) => {
    const isDark = document.body.getAttribute('data-theme') === 'dark';
    const confirm = await Swal.fire({
      title: "Delete Job?",
      text: "This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Delete",
      background: isDark ? '#1e293b' : '#fff',
      color: isDark ? '#fff' : '#000'
    });

    if (confirm.isConfirmed) {
      try {
        await axios.delete(`${import.meta.env.VITE_API_URL}/api/jobs/${id}`, headers);
        Swal.fire({ title: "Deleted!", icon: "success", timer: 1500, showConfirmButton: false });
        fetchJobs();
      } catch (err) {
        Swal.fire("Error", err.message, "error");
      }
    }
  };

const handleView = (job) => {
    // Check Theme for Colors
    const isDark = document.body.getAttribute('data-theme') === 'dark';
    
    // Dynamic Colors based on theme
    const textColor = isDark ? '#e2e8f0' : '#334155';
    const labelColor = isDark ? '#94a3b8' : '#64748b';
    const bgBox = isDark ? '#1e293b' : '#f8fafc';
    const borderColor = isDark ? '#334155' : '#e2e8f0';
    const headingColor = isDark ? '#f8fafc' : '#0f172a';

    Swal.fire({
      title: `<div style="display:flex; align-items:center; gap:10px; justify-content:center;">
                <span style="background:${isDark ? 'rgba(99,102,241,0.2)' : '#e0e7ff'}; color:#4f46e5; padding:8px; border-radius:8px; font-size:1.2rem;">
                  <i class="fa-solid fa-briefcase"></i>
                </span>
                <span style="color:${headingColor}; font-weight:700;">${job.title}</span>
              </div>`,
      html: `
        <div style="text-align: left; font-family: 'Inter', sans-serif; color: ${textColor}; padding: 0 10px;">
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px;">
            
            <div style="background:${bgBox}; padding:10px; border-radius:8px; border:1px solid ${borderColor};">
              <small style="color:${labelColor}; font-size:0.7rem; text-transform:uppercase; letter-spacing:0.5px; font-weight:600;">Branch</small>
              <div style="font-weight:600; font-size:0.95rem; margin-top:2px;">${job.branchId?.name || "N/A"}</div>
            </div>

            <div style="background:${bgBox}; padding:10px; border-radius:8px; border:1px solid ${borderColor};">
              <small style="color:${labelColor}; font-size:0.7rem; text-transform:uppercase; letter-spacing:0.5px; font-weight:600;">Department</small>
              <div style="font-weight:600; font-size:0.95rem; margin-top:2px;">${job.departmentId?.name || "N/A"}</div>
            </div>

            <div style="background:${bgBox}; padding:10px; border-radius:8px; border:1px solid ${borderColor};">
              <small style="color:${labelColor}; font-size:0.7rem; text-transform:uppercase; letter-spacing:0.5px; font-weight:600;">Designation</small>
              <div style="font-weight:600; font-size:0.95rem; margin-top:2px;">${job.designationId?.name || "N/A"}</div>
            </div>

            <div style="background:${bgBox}; padding:10px; border-radius:8px; border:1px solid ${borderColor};">
              <small style="color:${labelColor}; font-size:0.7rem; text-transform:uppercase; letter-spacing:0.5px; font-weight:600;">Positions</small>
              <div style="font-weight:600; font-size:0.95rem; margin-top:2px;">${job.positions} Openings</div>
            </div>

          </div>

          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding: 12px; border-radius: 8px; border: 1px dashed ${borderColor}; background: ${isDark ? 'rgba(255,255,255,0.02)' : '#fff'};">
             <div>
                <span style="padding: 5px 12px; border-radius: 20px; font-size: 0.75rem; font-weight: 700; background: ${job.status === 'Active' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)'}; color: ${job.status === 'Active' ? '#10b981' : '#ef4444'}; border: 1px solid ${job.status === 'Active' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'};">
                  ${job.status.toUpperCase()}
                </span>
             </div>
             <div style="text-align: right; font-size: 0.8rem; line-height: 1.4;">
                <div style="color:${labelColor}">Start: <span style="color:${headingColor}; font-weight:600;">${moment(job.startDate).format("DD MMM, YYYY")}</span></div>
                <div style="color:${labelColor}">End: <span style="color:${headingColor}; font-weight:600;">${moment(job.endDate).format("DD MMM, YYYY")}</span></div>
             </div>
          </div>

          <div style="margin-bottom: 15px;">
            <div style="display:flex; align-items:center; gap:6px; margin-bottom:8px;">
               <div style="width:4px; height:16px; background:#4f46e5; border-radius:2px;"></div>
               <h6 style="margin:0; font-weight:700; font-size:0.9rem; color:${headingColor};">Job Description</h6>
            </div>
            <p style="font-size: 0.9rem; line-height: 1.6; opacity: 0.9; margin: 0; white-space: pre-wrap;">${job.description}</p>
          </div>

          <div>
            <div style="display:flex; align-items:center; gap:6px; margin-bottom:8px;">
               <div style="width:4px; height:16px; background:#f59e0b; border-radius:2px;"></div>
               <h6 style="margin:0; font-weight:700; font-size:0.9rem; color:${headingColor};">Requirements</h6>
            </div>
            <p style="font-size: 0.9rem; line-height: 1.6; opacity: 0.9; margin: 0; white-space: pre-wrap;">${job.requirement}</p>
          </div>

        </div>
      `,
      width: 550,
      showCloseButton: true,
      showConfirmButton: false,
      background: isDark ? '#0f172a' : '#ffffff', // Matches card theme
      color: isDark ? '#f1f5f9' : '#1e293b',
      customClass: {
        popup: 'premium-modal-popup' // Optional: if you want to add external css
      }
    });
  };
  /* ================= COUNTS ================= */
  const totalJobs = jobs.length;
  const activeJobs = jobs.filter((j) => j.status === "Active").length;
  const inactiveJobs = jobs.filter((j) => j.status === "Inactive").length;

  return (
    <AdminLayout>
      <div className="joblist-container">
        
        {/* --- Header --- */}
        <div className="page-header d-flex justify-content-between align-items-center">
          <div>
            <div className="page-title">
              <span className="p-2 rounded bg-primary bg-opacity-10 text-primary me-2"><CgFileDocument /></span>
              Job Listings
            </div>
            <p className="page-subtitle mt-1 mb-0">Manage all job openings and applications.</p>
          </div>
          <button className="btn-add-job" onClick={() => navigate("/admin/jobcreate")}>
            <FaPlus /> Post New Job
          </button>
        </div>

        {/* --- Stats Cards --- */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon bg-primary bg-opacity-10 text-primary"><FaBriefcase /></div>
            <div className="stat-content">
              <h4>{totalJobs}</h4>
              <p>Total Jobs</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon bg-success bg-opacity-10 text-success"><FaCheckCircle /></div>
            <div className="stat-content">
              <h4>{activeJobs}</h4>
              <p>Active Openings</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon bg-danger bg-opacity-10 text-danger"><FaTimesCircle /></div>
            <div className="stat-content">
              <h4>{inactiveJobs}</h4>
              <p>Closed / Inactive</p>
            </div>
          </div>
        </div>

        {/* --- Table Card --- */}
        <div className="table-card">
          <div className="table-responsive">
            <table className="premium-table">
              <thead>
                <tr>
                  <th>Job Title</th>
                  <th>Branch</th>
                  <th>Department</th>
                  <th>Positions</th>
                  <th>Status</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="8" className="text-center py-5">Loading jobs...</td></tr>
                ) : jobs.length === 0 ? (
                  <tr>
                    <td colSpan="8">
                      <div className="empty-state">
                        <FaBriefcase className="fs-1 mb-3 opacity-25"/>
                        <h6>No jobs found</h6>
                        <p className="small">Get started by posting a new job opening.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  jobs.map((job) => (
                    <tr key={job._id}>
                      <td className="fw-bold">{job.title}</td>
                      <td>{job.branchId?.name || "-"}</td>
                      <td>{job.departmentId?.name || "-"}</td>
                      <td><span className="badge bg-light text-dark border px-3">{job.positions}</span></td>
                      <td>
                        <span className={`status-badge ${job.status === "Active" ? "status-active" : "status-inactive"}`}>
                          {job.status}
                        </span>
                      </td>
                      <td className="text-muted small">{moment(job.startDate).format("DD MMM, YYYY")}</td>
                      <td className="text-muted small">{moment(job.endDate).format("DD MMM, YYYY")}</td>
                      <td>
                        <div className="d-flex justify-content-center gap-2">
                          <button className="action-btn btn-view" onClick={() => handleView(job)} title="View Details">
                            <FaEye />
                          </button>
                          <button className="action-btn btn-edit" title="Edit Job">
                            <FaEdit />
                          </button>
                          <button className="action-btn btn-del" onClick={() => handleDelete(job._id)} title="Delete Job">
                            <FaTrash />
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

      </div>
    </AdminLayout>
  );
};

export default JobList;