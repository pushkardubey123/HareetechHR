import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import axios from "axios";
import Swal from "sweetalert2";
import AdminLayout from "../Admin/AdminLayout";
import { CgFileDocument } from "react-icons/cg";
import { FaBriefcase, FaCog, FaCheckCircle } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import "./CreateJob.css"; 

const schema = yup.object().shape({
  branchId: yup.string().required("Branch is required"),
  departmentId: yup.string().required("Department is required"),
  designationId: yup.string().required("Designation is required"),
  title: yup.string().required("Job Title is required"),
  positions: yup.number().min(1, "At least 1 position").required("Positions required"),
  status: yup.string().required(),
  startDate: yup.date().required("Start Date is required"),
  endDate: yup.date().required("End Date is required").min(yup.ref("startDate"), "End date must be after start date"),
  description: yup.string().required("Description is required"),
  requirement: yup.string().required("Requirements are required"),
});

const CreateJob = () => {
  const navigate = useNavigate();
  const token = JSON.parse(localStorage.getItem("user"))?.token;
  const headers = { headers: { Authorization: `Bearer ${token}` } };

  const [branches, setBranches] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);

  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm({ resolver: yupResolver(schema) });

  const branchId = watch("branchId");
  const departmentId = watch("departmentId");

  useEffect(() => {
    axios.get(`${import.meta.env.VITE_API_URL}/api/branch`, headers).then((res) => setBranches(res.data.data || []));
  }, []);

  useEffect(() => {
    if (!branchId) return setDepartments([]);
    axios.get(`${import.meta.env.VITE_API_URL}/api/departments?branchId=${branchId}`, headers).then((res) => setDepartments(res.data.data || []));
  }, [branchId]);

  useEffect(() => {
    if (!departmentId) return setDesignations([]);
    axios.get(`${import.meta.env.VITE_API_URL}/api/designations/?departmentId=${departmentId}`, headers).then((res) => setDesignations(res.data.data || []));
  }, [departmentId]);

  const onSubmit = async (data) => {
    try {
      const payload = { ...data, skills: data.skills ? data.skills.split(",").map((s) => s.trim()) : [] };
      await axios.post(`${import.meta.env.VITE_API_URL}/api/jobs`, payload, headers);
      Swal.fire({
        icon: "success", title: "Job Created!", text: "The job opening has been published successfully.",
        background: document.body.getAttribute('data-theme') === 'dark' ? '#1e293b' : '#fff',
        color: document.body.getAttribute('data-theme') === 'dark' ? '#fff' : '#000'
      });
      reset();
      navigate("/admin/joblist");
    } catch (err) {
      Swal.fire("Error", err.response?.data?.message || err.message, "error");
    }
  };

  return (
    <AdminLayout>
      <div className="job-page-container">
        
        {/* Header */}
        <div className="page-header d-flex justify-content-between align-items-center">
          <div>
            <div className="page-title">
              <span className="p-2 rounded bg-primary bg-opacity-10 text-primary me-2"><CgFileDocument /></span>
              Create New Job
            </div>
            <p className="page-subtitle mt-1 mb-0">Fill in the details to post a new job opening.</p>
          </div>
          <button type="button" className="btn-cancel" onClick={() => navigate(-1)}>Cancel</button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="row g-4">
            
            {/* Left Column */}
            <div className="col-lg-8">
              <div className="premium-card h-100">
                <div className="card-heading d-flex align-item-center"><FaBriefcase className="me-2 mt-1 text-primary" /> Job Details</div>
                <div className="row g-3">
                  <div className="col-12">
                    <label className="form-label">Job Title <span className="text-danger">*</span></label>
                    <input type="text" className="custom-input" placeholder="e.g. Senior React Developer" {...register("title")} />
                    {errors.title && <div className="error-msg">{errors.title.message}</div>}
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Branch <span className="text-danger">*</span></label>
                    <select className="custom-select" {...register("branchId")}>
                      <option value="">Select Branch</option>
                      {branches.map((b) => <option key={b._id} value={b._id}>{b.name}</option>)}
                    </select>
                    {errors.branchId && <div className="error-msg">{errors.branchId.message}</div>}
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Department <span className="text-danger">*</span></label>
                    <select className="custom-select" {...register("departmentId")} disabled={!branchId}>
                      <option value="">Select Department</option>
                      {departments.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
                    </select>
                    {errors.departmentId && <div className="error-msg">{errors.departmentId.message}</div>}
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Designation <span className="text-danger">*</span></label>
                    <select className="custom-select" {...register("designationId")} disabled={!departmentId}>
                      <option value="">Select Designation</option>
                      {designations.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
                    </select>
                    {errors.designationId && <div className="error-msg">{errors.designationId.message}</div>}
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Start Date <span className="text-danger">*</span></label>
                    <input type="date" className="custom-input" {...register("startDate")} />
                    {errors.startDate && <div className="error-msg">{errors.startDate.message}</div>}
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">End Date <span className="text-danger">*</span></label>
                    <input type="date" className="custom-input" {...register("endDate")} />
                    {errors.endDate && <div className="error-msg">{errors.endDate.message}</div>}
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Status</label>
                    <select className="custom-select" {...register("status")}>
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Positions <span className="text-danger">*</span></label>
                    <input type="number" className="custom-input" placeholder="e.g. 5" {...register("positions")} />
                    {errors.positions && <div className="error-msg">{errors.positions.message}</div>}
                  </div>
                  <div className="col-12 mt-4">
                    <div className="card-heading border-0 pb-0 mb-3 d-flex align-item-center"><CgFileDocument className="me-2 mt-1 text-warning" /> Content</div>
                    <div className="mb-3">
                      <label className="form-label">Job Description</label>
                      <textarea className="custom-textarea" rows="4" placeholder="Describe the role..." {...register("description")} />
                      {errors.description && <div className="error-msg">{errors.description.message}</div>}
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Requirements</label>
                      <textarea className="custom-textarea" rows="4" placeholder="Key responsibilities..." {...register("requirement")} />
                      {errors.requirement && <div className="error-msg">{errors.requirement.message}</div>}
                    </div>
                    <div>
                      <label className="form-label">Skills</label>
                      <input type="text" className="custom-input" placeholder="Java, React, SQL (Comma separated)" {...register("skills")} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="col-lg-4">
              <div className="premium-card">
                <div className="card-heading d-flex align-item-center"><FaCog className="me-2 mt-1 text-secondary" /> Application Settings</div>
                
                <div className="toggle-group">
                  <div className="toggle-heading">Applicant Fields</div>
                  <div className="d-flex flex-column gap-3">
                    <div className="form-check form-switch">
                      <input className="form-check-input" type="checkbox" id="askGender" {...register("askGender")} />
                      <label className="form-check-label" htmlFor="askGender">Ask Gender</label>
                    </div>
                    <div className="form-check form-switch">
                      <input className="form-check-input" type="checkbox" id="askDob" {...register("askDob")} />
                      <label className="form-check-label" htmlFor="askDob">Ask DOB</label>
                    </div>
                    <div className="form-check form-switch">
                      <input className="form-check-input" type="checkbox" id="askAddress" {...register("askAddress")} />
                      <label className="form-check-label" htmlFor="askAddress">Ask Address</label>
                    </div>
                  </div>
                </div>

                <div className="toggle-group">
                  <div className="toggle-heading">Requirements</div>
                  <div className="d-flex flex-column gap-3">
                    <div className="form-check form-switch">
                      <input className="form-check-input" type="checkbox" id="showProfile" {...register("showProfileImage")} />
                      <label className="form-check-label" htmlFor="showProfile">Profile Image</label>
                    </div>
                    <div className="form-check form-switch">
                      <input className="form-check-input" type="checkbox" id="showResume" {...register("showResume")} />
                      <label className="form-check-label" htmlFor="showResume">Resume</label>
                    </div>
                    <div className="form-check form-switch">
                      <input className="form-check-input" type="checkbox" id="showCover" {...register("showCoverLetter")} />
                      <label className="form-check-label" htmlFor="showCover">Cover Letter</label>
                    </div>
                    <div className="form-check form-switch">
                      <input className="form-check-input" type="checkbox" id="showTerms" {...register("showTerms")} />
                      <label className="form-check-label" htmlFor="showTerms">Terms</label>
                    </div>
                  </div>
                </div>

                <button type="submit" className="btn-submit w-100 d-flex align-items-center justify-content-center gap-2 mt-3">
                  <FaCheckCircle /> Publish Job
                </button>
              </div>
            </div>

          </div>
        </form>
      </div>
    </AdminLayout>
  );
};

export default CreateJob;