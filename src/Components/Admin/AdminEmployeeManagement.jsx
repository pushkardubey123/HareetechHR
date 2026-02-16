import React, { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import AdminLayout from "./AdminLayout";
import { 
  FaEdit, FaTrash, FaUserPlus, FaEye, FaCamera, 
  FaBriefcase, FaUniversity, FaMapMarkerAlt, FaShieldAlt, FaTimes
} from "react-icons/fa";
import Loader from "./Loader/Loader";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useNavigate } from "react-router-dom";
import "./AdminEmployeeManagement.css";

// --- VALIDATION SCHEMA ---
const schema = yup.object().shape({
  companyId: yup.string().required("Company is required"),
  name: yup.string().required("Name is required"),
  email: yup.string().email().required("Email is required"),
  phone: yup.string().required("Phone is required"),
  gender: yup.string().required("Gender is required"),
  dob: yup.string().required("DOB is required"),
  address: yup.string().required("Address is required"),
  branchId: yup.string().required("Branch is required"),
  departmentId: yup.string().required("Department is required"),
  designationId: yup.string().required("Designation is required"),
  shiftId: yup.string().required("Shift is required"),
  pan: yup.string().required("PAN is required"),
  bankAccount: yup.string().required("Bank A/C is required"),
  doj: yup.string().required("DOJ is required"),
  password: yup.string().when("$isEdit", {
    is: false,
    then: (schema) => schema.required("Password is required"),
    otherwise: (schema) => schema.notRequired(),
  }),
});

const EmployeeManagement = () => {
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [branches, setBranches] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profilePic, setProfilePic] = useState(null);
  const navigate = useNavigate();

  const token = JSON.parse(localStorage.getItem("user"))?.token;
  const getHeaders = () => ({ headers: { Authorization: `Bearer ${token}` } });

  // --- API CALLS ---
  useEffect(() => {
    axios.get(`${import.meta.env.VITE_API_URL}/public/companies`, getHeaders())
      .then((res) => setCompanies(res.data.data || []))
      .catch(() => {});
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [empRes, deptRes, desigRes, shiftRes, branchRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_URL}/user`, getHeaders()),
        axios.get(`${import.meta.env.VITE_API_URL}/api/departments`, getHeaders()),
        axios.get(`${import.meta.env.VITE_API_URL}/api/designations`, getHeaders()),
        axios.get(`${import.meta.env.VITE_API_URL}/api/shifts/admin`, getHeaders()),
        axios.get(`${import.meta.env.VITE_API_URL}/api/branch`, getHeaders()),
      ]);
      setEmployees((empRes.data.data || []).reverse());
      setDepartments(deptRes.data.data || []);
      setDesignations(desigRes.data.data || []);
      setShifts(shiftRes.data.data || []);
      setBranches(branchRes.data.data || []);
    } catch (err) {
      Swal.fire("Error", "Failed to fetch data", "error");
    } finally {
      setLoading(false);
    }
  };

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
    context: { isEdit: !!editId },
  });

  const selectedCompanyId = watch("companyId");
  const selectedBranchId = watch("branchId");
  const selectedDepartmentId = watch("departmentId");
  const adminCompanyId = JSON.parse(localStorage.getItem("user"))?.id;

  const filteredBranches = selectedCompanyId ? branches.filter(b => b.companyId === selectedCompanyId || b.companyId?._id === selectedCompanyId) : [];
  const filteredDepartments = selectedBranchId ? departments.filter(d => d.branchId?._id === selectedBranchId) : [];
  const filteredDesignations = selectedDepartmentId ? designations.filter(d => d.departmentId?._id === selectedDepartmentId) : [];
  const filteredShifts = selectedBranchId ? shifts.filter(s => s.branchId?._id === selectedBranchId) : [];

  const onSubmit = async (data) => {
    const formDataToSend = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (key === "emergencyContact" && value) {
        formDataToSend.append(key, JSON.stringify(value));
      } else if (value !== null && value !== undefined) {
        formDataToSend.append(key, value);
      }
    });

    if (profilePic) formDataToSend.append("profilePic", profilePic);

    try {
      if (editId) {
        await axios.put(`${import.meta.env.VITE_API_URL}/employeeget/${editId}`, formDataToSend, {
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
        });
        Swal.fire({ icon: "success", title: "Updated!", showConfirmButton: false, timer: 1500 });
        fetchData();
      } else {
        await axios.post(`${import.meta.env.VITE_API_URL}/user/register`, formDataToSend);
        Swal.fire({ icon: "success", title: "Registration Successful", showConfirmButton: false, timer: 1500 });
        navigate("/pending-employee"); 
      }
      closeModal();
    } catch (err) {
      console.error("Backend Error:", err.response?.data);
      Swal.fire("Error", err.response?.data?.message || "Operation failed", "error");
    }
  };

  const handleEdit = (e, emp) => {
    e.stopPropagation();
    setEditId(emp._id);
    const fields = ["name", "email", "phone", "gender", "dob", "address", "branchId", "departmentId", "designationId", "shiftId", "pan", "bankAccount", "doj", "emergencyContact"];
    fields.forEach(k => setValue(k, emp[k]?._id || emp[k] || ""));
    setValue("companyId", adminCompanyId);
    setShowModal(true);
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    const result = await Swal.fire({ title: "Delete Employee?", icon: "warning", showCancelButton: true, confirmButtonColor: "#ef4444" });
    if (result.isConfirmed) {
      try {
        await axios.delete(`${import.meta.env.VITE_API_URL}/employeedelete/${id}`, getHeaders());
        fetchData();
        Swal.fire("Deleted", "", "success");
      } catch (err) { Swal.fire("Error", "Delete failed", "error"); }
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditId(null);
    reset();
    setProfilePic(null);
  };

  return (
    <AdminLayout>
      <div className="hq-extreme-wrapper">
        <div className="container-fluid">
          {/* HEADER */}
          <div className="hq-mgmt-header">
            <div className="hq-header-left">
              <div className="hq-icon-badge"><FaShieldAlt /></div>
              <div>
                <h2 className="hq-main-title">Staff Management</h2>
                <p className="hq-sub-title">Manage access, roles, and profiles</p>
              </div>
            </div>
            <button className="hq-add-btn-premium" onClick={() => { reset(); setEditId(null); setProfilePic(null); if (adminCompanyId) setValue("companyId", adminCompanyId); setShowModal(true); }}>
              <FaUserPlus /> <span>Add Employee</span>
            </button>
          </div>

          {/* TABLE CARD */}
          <div className="hq-table-card-main">
            {loading ? <div className="p-5"><Loader /></div> : (
              <div className="hq-table-responsive">
                <table className="hq-premium-table">
                  <thead>
                    <tr>
                      <th>S No.</th><th>Full Name</th><th>Contact</th><th>Location</th><th>Work Role</th><th className="text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employees.map((emp, i) => (
                      <tr key={emp._id} onClick={() => navigate(`/admin/employee/${emp._id}`, { state: emp })}>
                        <td>{i + 1}</td>
                        <td className="hq-td-emp-name">{emp.name}</td>
                        <td>{emp.email}</td>
                        <td>
                          <div>{emp.branchId?.name || "N/A"}</div>
                          <div className="text-muted small">{emp.departmentId?.name}</div>
                        </td>
                        <td>
                          <div className="fw-bold">{emp.designationId?.name}</div>
                          <div className="text-muted small">{emp.shiftId?.name}</div>
                        </td>
                        <td>
                          <div className="hq-action-stack justify-content-center" onClick={(e) => e.stopPropagation()}>
                            <button className="hq-action-btn view" onClick={() => navigate(`/admin/employee/${emp._id}`, { state: emp })}><FaEye /></button>
                            <button className="hq-action-btn edit" onClick={(e) => handleEdit(e, emp)}><FaEdit /></button>
                            <button className="hq-action-btn delete" onClick={(e) => handleDelete(e, emp._id)}><FaTrash /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* --- CUSTOM MODAL --- */}
        {showModal && (
          <div className="hq-modal-overlay" onClick={closeModal}>
            <div className="hq-modal-container" onClick={(e) => e.stopPropagation()}>
              <form onSubmit={handleSubmit(onSubmit)} className="hq-modal-form-wrapper">
                
                {/* LEFT SIDE: Identity & Basic */}
                <div className="hq-modal-left">
                  <div className="hq-profile-upload-center mb-4">
                    <div className="hq-profile-frame">
                      {profilePic ? <img src={URL.createObjectURL(profilePic)} alt="p" /> : <FaCamera />}
                    </div>
                    <input type="file" id="modalPic" className="d-none" onChange={(e) => setProfilePic(e.target.files[0])} />
                    <label htmlFor="modalPic" className="hq-upload-label-v2">Update Photo</label>
                  </div>
                  
                  <div className="hq-form-group">
                    <label className="hq-label">Full Name</label>
                    <input className="hq-input" {...register("name")} />
                    <small className="hq-error-text">{errors.name?.message}</small>
                  </div>
                  <div className="hq-form-group">
                    <label className="hq-label">Official Email</label>
                    <input className="hq-input" {...register("email")} />
                    <small className="hq-error-text">{errors.email?.message}</small>
                  </div>
                  <div className="hq-form-group">
                    <label className="hq-label">Phone</label>
                    <input className="hq-input" {...register("phone")} />
                    <small className="hq-error-text">{errors.phone?.message}</small>
                  </div>
                  <div className="hq-form-group">
                    <label className="hq-label">Date of Birth</label>
                    <input type="date" className="hq-input" {...register("dob")} />
                    <small className="hq-error-text">{errors.dob?.message}</small>
                  </div>
                  <div className="hq-form-group">
                    <label className="hq-label">Gender</label>
                    <select className="hq-select" {...register("gender")}>
                      <option value="">Select</option>
                      <option value="Men">Male</option>
                      <option value="Women">Female</option>
                    </select>
                    <small className="hq-error-text">{errors.gender?.message}</small>
                  </div>
                </div>

                {/* RIGHT SIDE: Details Form */}
                <div className="hq-modal-right">
                  <div className="hq-modal-header-row">
                    <h4 className="hq-main-title">{editId ? "Edit Staff" : "New Onboarding"}</h4>
                    <button type="button" className="hq-close-btn" onClick={closeModal}><FaTimes /></button>
                  </div>

                  {/* Section 1: Work */}
                  <div className="hq-form-divider"><FaBriefcase /> Work & Organization</div>
                  
                  <div className="hq-row">
                    <div className="hq-col-6">
                      <label className="hq-label">Company</label>
                      <select className="hq-select" {...register("companyId")} disabled>
                        {companies.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                      </select>
                    </div>
                    <div className="hq-col-6">
                      <label className="hq-label">Branch</label>
                      <select className="hq-select" {...register("branchId")}>
                        <option value="">Select Branch</option>
                        {filteredBranches.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
                      </select>
                      <small className="hq-error-text">{errors.branchId?.message}</small>
                    </div>
                    <div className="hq-col-4">
                      <label className="hq-label">Department</label>
                      <select className="hq-select" {...register("departmentId")}>
                        <option value="">Select Dept</option>
                        {filteredDepartments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                      </select>
                      <small className="hq-error-text">{errors.departmentId?.message}</small>
                    </div>
                    <div className="hq-col-4">
                      <label className="hq-label">Designation</label>
                      <select className="hq-select" {...register("designationId")}>
                         <option value="">Select Desig</option>
                         {filteredDesignations.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                      </select>
                      <small className="hq-error-text">{errors.designationId?.message}</small>
                    </div>
                    <div className="hq-col-4">
                      <label className="hq-label">Shift</label>
                      <select className="hq-select" {...register("shiftId")}>
                         <option value="">Select Shift</option>
                         {filteredShifts.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                      </select>
                      <small className="hq-error-text">{errors.shiftId?.message}</small>
                    </div>
                    <div className="hq-col-6">
                      <label className="hq-label">Joining Date</label>
                      <input type="date" className="hq-input" {...register("doj")} />
                      <small className="hq-error-text">{errors.doj?.message}</small>
                    </div>
                    {!editId && (
                      <div className="hq-col-6">
                        <label className="hq-label">Password</label>
                        <input type="password" className="hq-input" {...register("password")} />
                        <small className="hq-error-text">{errors.password?.message}</small>
                      </div>
                    )}
                  </div>

                  {/* Section 2: Bank */}
                  <div className="hq-form-divider"><FaUniversity /> Banking & Identity</div>
                  <div className="hq-row">
                    <div className="hq-col-4">
                      <label className="hq-label">PAN Number</label>
                      <input className="hq-input" {...register("pan")} />
                      <small className="hq-error-text">{errors.pan?.message}</small>
                    </div>
                    <div className="hq-col-8">
                      <label className="hq-label">Bank Account</label>
                      <input className="hq-input" {...register("bankAccount")} />
                      <small className="hq-error-text">{errors.bankAccount?.message}</small>
                    </div>
                  </div>

                  {/* Section 3: Address & Emergency */}
                  <div className="hq-form-divider"><FaMapMarkerAlt /> Address & Emergency</div>
                  <div className="hq-row">
                    <div className="hq-col-12">
                      <label className="hq-label">Address</label>
                      <textarea className="hq-textarea" rows="2" {...register("address")}></textarea>
                      <small className="hq-error-text">{errors.address?.message}</small>
                    </div>
                    <div className="hq-col-4">
                       <label className="hq-label">Contact Person</label>
                       <input className="hq-input" {...register("emergencyContact.name")} />
                    </div>
                    <div className="hq-col-4">
                       <label className="hq-label">Person Phone</label>
                       <input className="hq-input" {...register("emergencyContact.phone")} />
                    </div>
                    <div className="hq-col-4">
                       <label className="hq-label">Relation</label>
                       <input className="hq-input" {...register("emergencyContact.relation")} />
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="hq-modal-footer">
                    <button type="button" className="hq-btn-cancel" onClick={closeModal}>Cancel</button>
                    <button type="submit" className="hq-submit-btn-v2">{editId ? "Update Data" : "Confirm Member"}</button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default EmployeeManagement;