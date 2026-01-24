import React, { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../Admin/AdminLayout";
import { FaTrash, FaEdit, FaEye, FaPlus } from "react-icons/fa";
import { CgFileDocument } from "react-icons/cg";
import moment from "moment";

const JobList = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const token = JSON.parse(localStorage.getItem("user"))?.token;
  const headers = { headers: { Authorization: `Bearer ${token}` } };

  /* ================= CSS (Payroll style) ================= */
  useEffect(() => {
    injectCSS();
    fetchJobs();
  }, []);

  const injectCSS = () => {
    if (document.getElementById("joblist-ui")) return;

    const style = document.createElement("style");
    style.id = "joblist-ui";
    style.innerHTML = `
      .joblist-page{
        padding:24px;
        min-height:100vh;
        background:linear-gradient(180deg,#0b1220,#e9edf4);
      }
      .joblist-card{
        background:rgba(255,255,255,.06);
        border-radius:14px;
        padding:20px;
        box-shadow:0 8px 30px rgba(0,0,0,.5);
      }
      .joblist-title{
        font-size:20px;
        font-weight:700;
        color:#fff;
        display:flex;
        align-items:center;
        gap:6px;
      }
      .stat-card{
        background:rgba(255,255,255,.85);
        border-radius:14px;
        box-shadow:0 6px 18px rgba(0,0,0,.15);
      }
      table{color:#000}
      thead{
        background:#0f172a;
        color:#fff;
      }
      tbody tr{
        transition:all .25s ease;
      }
      tbody tr:hover{
        background:rgba(37,99,235,.08);
      }
      .badge{
        padding:6px 12px;
        font-size:12px;
        border-radius:999px;
        font-weight:600;
      }
      @media(max-width:768px){
        .joblist-title{font-size:18px}
      }
    `;
    document.head.appendChild(style);
  };

  /* ================= API ================= */
  const fetchJobs = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/jobs`,
        headers
      );
      setJobs(res.data.data || []);
    } catch (err) {
      Swal.fire("Error", err.response?.data?.message || err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  /* ================= ACTIONS ================= */
  const handleDelete = async (id) => {
    const confirm = await Swal.fire({
      title: "Are you sure?",
      text: "This will delete the job permanently!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it!",
    });

    if (confirm.isConfirmed) {
      try {
        await axios.delete(
          `${import.meta.env.VITE_API_URL}/api/jobs/${id}`,
          headers
        );
        Swal.fire("Deleted!", "Job deleted successfully", "success");
        fetchJobs();
      } catch (err) {
        Swal.fire("Error", err.message, "error");
      }
    }
  };

  const handleView = (job) => {
    Swal.fire({
      title: `<strong>${job.title}</strong>`,
      html: `
        <p><b>Branch:</b> ${job.branchId?.name || "-"}</p>
        <p><b>Department:</b> ${job.departmentId?.name || "-"}</p>
        <p><b>Designation:</b> ${job.designationId?.name || "-"}</p>
        <p><b>Positions:</b> ${job.positions}</p>
        <p><b>Status:</b> ${job.status}</p>
        <p><b>Start:</b> ${moment(job.startDate).format("DD MMM YYYY")}</p>
        <p><b>End:</b> ${moment(job.endDate).format("DD MMM YYYY")}</p>
        <hr/>
        <p><b>Description:</b><br/>${job.description}</p>
        <p><b>Requirement:</b><br/>${job.requirement}</p>
      `,
      width: 600,
      confirmButtonColor: "#2563eb",
    });
  };

  /* ================= COUNTS ================= */
  const totalJobs = jobs.length;
  const activeJobs = jobs.filter((j) => j.status === "Active").length;
  const inactiveJobs = jobs.filter((j) => j.status === "Inactive").length;

  /* ================= UI ================= */
  return (
    <AdminLayout>
      <div className="joblist-page">
        <div className="joblist-card">

          {/* Header */}
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div className="joblist-title">
              <CgFileDocument /> Job List
            </div>

            <button
              className="btn btn-primary rounded-circle"
              onClick={() => navigate("/admin/jobcreate")}
            >
              <FaPlus />
            </button>
          </div>

          {/* Stats */}
          <div className="d-flex gap-3 mb-4 flex-wrap">
            <div className="card stat-card text-center p-3 flex-grow-1">
              <h6>Total Jobs</h6>
              <h4 className="text-primary">{totalJobs}</h4>
            </div>
            <div className="card stat-card text-center p-3 flex-grow-1">
              <h6>Active Jobs</h6>
              <h4 className="text-success">{activeJobs}</h4>
            </div>
            <div className="card stat-card text-center p-3 flex-grow-1">
              <h6>Inactive Jobs</h6>
              <h4 className="text-danger">{inactiveJobs}</h4>
            </div>
          </div>

          {/* Table */}
          <div className="table-responsive">
            <table className="table table-bordered align-middle">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Branch</th>
                  <th>Department</th>
                  <th>Designation</th>
                  <th>Positions</th>
                  <th>Status</th>
                  <th>Start</th>
                  <th>End</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="9" className="text-center">Loading...</td>
                  </tr>
                ) : jobs.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="text-center">No jobs found</td>
                  </tr>
                ) : (
                  jobs.map((job) => (
                    <tr key={job._id}>
                      <td>{job.title}</td>
                      <td>{job.branchId?.name || "-"}</td>
                      <td>{job.departmentId?.name || "-"}</td>
                      <td>{job.designationId?.name || "-"}</td>
                      <td>{job.positions}</td>
                      <td>
                        <span className={`badge ${job.status === "Active" ? "bg-success" : "bg-secondary"}`}>
                          {job.status}
                        </span>
                      </td>
                      <td>{moment(job.startDate).format("DD/MM/YYYY")}</td>
                      <td>{moment(job.endDate).format("DD/MM/YYYY")}</td>
                      <td className="d-flex gap-2 justify-content-center">
                        <button className="btn btn-sm btn-info text-white" onClick={() => handleView(job)}>
                          <FaEye />
                        </button>
                        <button className="btn btn-sm btn-warning">
                          <FaEdit />
                        </button>
                        <button className="btn btn-sm btn-danger" onClick={() => handleDelete(job._id)}>
                          <FaTrash />
                        </button>
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
