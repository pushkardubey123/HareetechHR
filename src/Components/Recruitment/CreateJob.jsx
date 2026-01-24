import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import axios from "axios";
import Swal from "sweetalert2";
import AdminLayout from "../Admin/AdminLayout";
import { CgFileDocument } from "react-icons/cg";
import { useNavigate } from "react-router-dom";

/* ================= VALIDATION ================= */
const schema = yup.object().shape({
  branchId: yup.string().required("Branch is required"),
  departmentId: yup.string().required("Department is required"),
  designationId: yup.string().required("Designation is required"),
  title: yup.string().required("Job Title is required"),
  positions: yup.number().min(1).required("Positions required"),
  status: yup.string().required(),
  startDate: yup.date().required(),
  endDate: yup
    .date()
    .required()
    .min(yup.ref("startDate"), "End date must be after start date"),
  description: yup.string().required(),
  requirement: yup.string().required(),
});

const CreateJob = () => {
  const navigate = useNavigate();
  const token = JSON.parse(localStorage.getItem("user"))?.token;
  const headers = { headers: { Authorization: `Bearer ${token}` } };

  const [branches, setBranches] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm({ resolver: yupResolver(schema) });

  const branchId = watch("branchId");
  const departmentId = watch("departmentId");

  useEffect(() => {
    const css = `
      .job-page {
        background: linear-gradient(180deg,#0b1220 0%, #dee4ec 100%);
        min-height:100vh;
        padding:28px;
        font-family: Inter, system-ui;
      }
      .job-card {
        background: rgba(255,255,255,0.04);
        border:1px solid rgba(255,255,255,0.06);
        min-width:100%;
        border-radius:14px;
        padding:22px;
        box-shadow: 0 8px 30px rgba(0,0,0,0.5);
        color:#f1f7fb;
      }
      .job-title {
        font-size:20px;
        font-weight:700;
        margin-bottom:18px;
        display:flex;
        align-items:center;
        gap:8px;
      }
      .form-label {
        font-size:13px;
        font-weight:600;
        margin-bottom:4px;
        color:#d6eef3;
      }
      .glass-input, textarea, select {
        width:100%;
        padding:9px;
        border-radius:10px;
        border:1px solid rgba(255,255,255,0.08);
        background: rgba(255,255,255,0.08);
        color:black;
        font-size:14px;
      }
      textarea { min-height:90px; }
      .error-text {
        font-size:12px;
        color:#ffb4b4;
        margin-top:2px;
      }
      .section-title {
        font-weight:700;
        margin:16px 0 8px;
        color:#f4fbff;
      }
      .checkbox-group label {
        display:flex;
        align-items:center;
        gap:6px;
        font-size:14px;
        margin-bottom:6px;
      }
      .submit-btn {
        background: linear-gradient(180deg,#1f8b7a,#14705e);
        border:none;
        padding:10px 22px;
        border-radius:10px;
        color:#fff;
        font-weight:600;
        box-shadow:0 6px 18px rgba(17,78,70,0.24);
      }
    `;
    if (!document.querySelector("style[data-job-ui]")) {
      const style = document.createElement("style");
      style.setAttribute("data-job-ui", "1");
      style.appendChild(document.createTextNode(css));
      document.head.appendChild(style);
    }
  }, []);

  /* ================= FETCH DATA ================= */
  useEffect(() => {
    axios
      .get(`${import.meta.env.VITE_API_URL}/api/branch`, headers)
      .then((res) => setBranches(res.data.data || []));
  }, []);

  useEffect(() => {
    if (!branchId) return setDepartments([]);
    axios
      .get(`${import.meta.env.VITE_API_URL}/api/departments?branchId=${branchId}`, headers)
      .then((res) => setDepartments(res.data.data || []));
  }, [branchId]);

  useEffect(() => {
    if (!departmentId) return setDesignations([]);
    axios
      .get(
        `${import.meta.env.VITE_API_URL}/api/designations/?departmentId=${departmentId}`,
        headers
      )
      .then((res) => setDesignations(res.data.data || []));
  }, [departmentId]);

  const onSubmit = async (data) => {
    try {
      const payload = {
        ...data,
        skills: data.skills
          ? data.skills.split(",").map((s) => s.trim())
          : [],
      };

      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/jobs`,
        payload,
        headers
      );

      Swal.fire("Success", "Job created successfully", "success");
      reset();
      navigate("/admin/joblist");
    } catch (err) {
      Swal.fire(
        "Error",
        err.response?.data?.message || err.message,
        "error"
      );
    }
  };

  return (
    <AdminLayout>
      <div className="job-page">
        <div className="job-card">
          <div className="job-title text-light">
            <CgFileDocument /> Create Job
          </div>

          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label">Branch </label>
                <select className="glass-input" {...register("branchId")}>
                  <option value="">Select Branch</option>
                  {branches.map((b) => (
                    <option key={b._id} value={b._id}>{b.name}</option>
                  ))}
                </select>
                <div className="error-text">{errors.branchId?.message}</div>

                <label className="form-label mt-2">Department </label>
                <select className="glass-input" {...register("departmentId")} disabled={!branchId}>
                  <option value="">Select Department</option>
                  {departments.map((d) => (
                    <option key={d._id} value={d._id}>{d.name}</option>
                  ))}
                </select>

                <label className="form-label mt-2">Designation </label>
                <select className="glass-input" {...register("designationId")} disabled={!departmentId}>
                  <option value="">Select Designation</option>
                  {designations.map((d) => (
                    <option key={d._id} value={d._id}>{d.name}</option>
                  ))}
                </select>

                <label className="form-label mt-2">Job Title </label>
                <input className="glass-input" {...register("title")} />

                <label className="form-label mt-2">Positions </label>
                <input type="number" className="glass-input" {...register("positions")} />

                <label className="form-label mt-2">Status </label>
                <select className="glass-input" {...register("status")}>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>

                <label className="form-label mt-2">Start Date </label>
                <input type="date" className="glass-input" {...register("startDate")} />

                <label className="form-label mt-2">End Date </label>
                <input type="date" className="glass-input" {...register("endDate")} />
              </div>

              <div className="col-md-6">
                <label className="form-label">Description </label>
                <textarea {...register("description")} />

                <label className="form-label mt-2">Requirement </label>
                <textarea {...register("requirement")} />

                <label className="form-label mt-2">Skills (comma separated)</label>
                <input className="glass-input" {...register("skills")} />

                <div className="section-title">Need to Ask?</div>
                <div className="checkbox-group">
                  <label><input type="checkbox" {...register("askGender")} /> Gender</label>
                  <label><input type="checkbox" {...register("askDob")} /> DOB</label>
                  <label><input type="checkbox" {...register("askAddress")} /> Address</label>
                </div>

                <div className="section-title">Show Options</div>
                <div className="checkbox-group">
                  <label><input type="checkbox" {...register("showProfileImage")} /> Profile Image</label>
                  <label><input type="checkbox" {...register("showResume")} /> Resume</label>
                  <label><input type="checkbox" {...register("showCoverLetter")} /> Cover Letter</label>
                  <label><input type="checkbox" {...register("showTerms")} /> Terms</label>
                </div>
              </div>
            </div>

            <div className="text-end mt-4">
              <button type="submit" className="submit-btn">
                Create Job
              </button>
            </div>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
};

export default CreateJob;
