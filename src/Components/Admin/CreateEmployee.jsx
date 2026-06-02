import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import DynamicLayout from "../Common/DynamicLayout";
import Loader from "./Loader/Loader";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useNavigate, useLocation } from "react-router-dom"; // ✅ useLocation added
import { FaUserTie, FaBuilding, FaWallet, FaArrowLeft, FaCamera, FaEdit } from "react-icons/fa";
import "./CreateEmployee.css";

// Form Validation Schema (Password becomes optional on EDIT)
const schema = yup.object().shape({
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
  basicSalary: yup.number().typeError("Salary must be a number").required("Basic Salary is required"),
  // ✅ Edit me password optional banane ki shart
  password: yup.string().when("$isEdit", (isEdit, schema) => {
    return isEdit[0] ? schema.notRequired() : schema.required("Password is required");
  }),
});

const CreateEmployee = () => {
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [branches, setBranches] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [profilePic, setProfilePic] = useState(null);
  
  const navigate = useNavigate();
  const location = useLocation(); // ✅ Check if we are in EDIT Mode
  const editData = location.state?.employeeToEdit || null; // Yahan se data milega

  const userStr = localStorage.getItem("user");
  const userObj = userStr ? JSON.parse(userStr) : null;
  const token = userObj?.token;
  const adminCompanyId = userObj?.companyId || userObj?.id;

  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
    context: { isEdit: !!editData } // Provide context to yup
  });

  const getHeaders = () => ({ headers: { Authorization: `Bearer ${token}` } });

  // ✅ 1. INITIAL LOAD (Fetch Dropdowns and Auto-fill Edit Data)
  useEffect(() => {
    const fetchDropdownData = async () => {
      setLoading(true);
      try {
        const [deptRes, desigRes, shiftRes, branchRes] = await Promise.all([
          axios.get(`${import.meta.env.VITE_API_URL}/api/departments`, getHeaders()),
          axios.get(`${import.meta.env.VITE_API_URL}/api/designations`, getHeaders()),
          axios.get(`${import.meta.env.VITE_API_URL}/api/shifts/admin`, getHeaders()),
          axios.get(`${import.meta.env.VITE_API_URL}/api/branch`, getHeaders()),
        ]);
        setDepartments(deptRes.data.data || []);
        setDesignations(desigRes.data.data || []);
        setShifts(shiftRes.data.data || []);
        setBranches(branchRes.data.data || []);

        // AGAR EDIT MODE HAI TO DATA BHAR DO!
        if (editData) {
          reset({
            name: editData.name || "",
            email: editData.email || "",
            phone: editData.phone || "",
            gender: editData.gender || "",
            dob: editData.dob ? editData.dob.substring(0, 10) : "",
            address: editData.address || "",
            branchId: editData.branchId?._id || editData.branchId || "",
            departmentId: editData.departmentId?._id || editData.departmentId || "",
            designationId: editData.designationId?._id || editData.designationId || "",
            shiftId: editData.shiftId?._id || editData.shiftId || "",
            pan: editData.pan || "",
            bankAccount: editData.bankAccount || "",
            doj: editData.doj ? editData.doj.substring(0, 10) : "",
            basicSalary: editData.basicSalary || 0,
            password: "", // Never auto-fill password
            emergencyName: editData.emergencyContact?.name || "",
            emergencyPhone: editData.emergencyContact?.phone || "",
            emergencyRelation: editData.emergencyContact?.relation || "",
          });
        }
      } catch (err) {
        toast.error("Failed to load organization data");
      } finally {
        setLoading(false);
      }
    };
    fetchDropdownData();
  }, [editData, reset]);

  // ✅ 2. DYNAMIC DROPDOWN FILTERING
  const selectedBranchId = watch("branchId");
  const selectedDepartmentId = watch("departmentId");

  const filteredDepartments = selectedBranchId ? departments.filter(d => d.branchId?._id === selectedBranchId) : [];
  const filteredDesignations = selectedDepartmentId ? designations.filter(d => d.departmentId?._id === selectedDepartmentId) : [];
  const filteredShifts = selectedBranchId ? shifts.filter(s => s.branchId?._id === selectedBranchId) : [];

  // ✅ 3. FORM SUBMIT (CREATE YA UPDATE)
  const onSubmit = async (data) => {
    const formDataToSend = new FormData();
    formDataToSend.append("companyId", adminCompanyId);

    // Prepare JSON for Emergency Contact if it exists
    if (data.emergencyName) {
      formDataToSend.append("emergencyContact", JSON.stringify({
        name: data.emergencyName,
        phone: data.emergencyPhone,
        relation: data.emergencyRelation
      }));
    }

    // Append standard fields
    Object.entries(data).forEach(([key, value]) => {
      if (value !== null && value !== "" && value !== undefined && !key.startsWith("emergency")) {
        formDataToSend.append(key, value);
      }
    });

    if (profilePic) formDataToSend.append("profilePic", profilePic);

    try {
      setLoading(true);
      
      // LOGIC: Agar editData hai to PUT request karo (Update), warna POST (Create)
      if (editData) {
        const response = await axios.put(`${import.meta.env.VITE_API_URL}/employeeget/${editData._id}`, formDataToSend, getHeaders());
        toast.success(response.data.message || "Employee details successfully updated!");
      } else {
        const response = await axios.post(`${import.meta.env.VITE_API_URL}/user/register`, formDataToSend, getHeaders());
        toast.success(response.data.message || "Employee successfully onboarded!");
      }
      
      navigate("/admin/employee-management");
    } catch (err) {
      if (err.response && err.response.status === 403) {
        toast.error(`❌ Plan Limit Reached: ${err.response.data.message}`, { position: "top-center", autoClose: 5000, theme: "colored" });
      } else if (err.response && err.response.data) {
        toast.error(`⚠️ ${err.response.data.message || "Operation failed."}`);
      } else {
        toast.error("🚨 Network error! Server is unreachable.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <DynamicLayout>
      <div className="ce-wrapper fade-in-up">
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
          <div>
            <h3 className="ce-title d-flex">
              {editData ? <FaEdit className="me-2 text-warning" /> : <FaUserTie className="me-2 text-primary" />} 
              {editData ? "Update Employee Profile" : "Onboard New Employee"}
            </h3>
            <p className="ce-subtitle">
              {editData ? "Modify existing staff details" : "Seamlessly add talent to your organization"}
            </p>
          </div>
          <button className="ce-btn-back" onClick={() => navigate("/admin/employee-management")}>
            <FaArrowLeft className="me-2" /> Back to Staff
          </button>
        </div>

        {loading && <div className="text-center py-5"><Loader /></div>}

        {!loading && (
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="row g-4">
              
              {/* LEFT COLUMN: Profile & Personal */}
              <div className="col-lg-4">
                <div className="ce-card mb-4 slide-in-left">
                  <div className="ce-card-body text-center pb-0">
                    <div className="ce-avatar-upload">
                      {profilePic ? (
                        <img src={URL.createObjectURL(profilePic)} alt="profile" />
                      ) : editData?.profilePic ? (
                        <img src={`${import.meta.env.VITE_API_URL}/static/${editData.profilePic}`} alt="profile" />
                      ) : (
                        <div className="ce-avatar-placeholder">
                          <FaCamera size={28} className="mb-2 text-muted" />
                          <span>Upload Photo</span>
                        </div>
                      )}
                      <input type="file" onChange={(e) => setProfilePic(e.target.files[0])} accept="image/*" />
                    </div>
                    <h5 className="fw-bold mt-3 text-color-main">Personal Details</h5>
                  </div>
                  
                  <div className="ce-card-body pt-2">
                    <div className="ce-input-group">
                      <input className="ce-input" placeholder=" " {...register("name")} />
                      <label className="ce-floating-label">Full Name</label>
                      <small className="ce-error">{errors.name?.message}</small>
                    </div>
                    <div className="ce-input-group">
                      <input className="ce-input" type="email" placeholder=" " {...register("email")} />
                      <label className="ce-floating-label">Official Email</label>
                      <small className="ce-error">{errors.email?.message}</small>
                    </div>
                    <div className="ce-input-group">
                      <input className="ce-input" placeholder=" " {...register("phone")} />
                      <label className="ce-floating-label">Phone Number</label>
                      <small className="ce-error">{errors.phone?.message}</small>
                    </div>
                    
                    <div className="row g-3 mb-3">
                      <div className="col-6">
                         <div className="ce-input-group mb-0">
                          <input type="date" className="ce-input" placeholder=" " {...register("dob")} />
                          <label className="ce-floating-label static">Date of Birth</label>
                          <small className="ce-error">{errors.dob?.message}</small>
                        </div>
                      </div>
                      <div className="col-6">
                        <div className="ce-input-group mb-0">
                          <select className="ce-input" {...register("gender")}>
                            <option value="">Select...</option>
                            <option value="Men">Male</option>
                            <option value="Women">Female</option>
                          </select>
                          <label className="ce-floating-label static">Gender</label>
                          <small className="ce-error">{errors.gender?.message}</small>
                        </div>
                      </div>
                    </div>
                    
                    <div className="ce-input-group">
                      <textarea className="ce-input" rows="2" placeholder=" " {...register("address")}></textarea>
                      <label className="ce-floating-label">Full Address</label>
                      <small className="ce-error">{errors.address?.message}</small>
                    </div>

                    {!editData && (
                      <div className="ce-input-group mb-0">
                        <input type="password" className="ce-input" placeholder=" " {...register("password")} />
                        <label className="ce-floating-label">Portal Password</label>
                        <small className="ce-error">{errors.password?.message}</small>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN: Organization & Banking */}
              <div className="col-lg-8">
                
                <div className="ce-card mb-4 slide-in-right">
                  <div className="ce-card-header">
                    <FaBuilding className="text-primary me-2"/> Organization Assignment
                  </div>
                  <div className="ce-card-body">
                    <div className="row g-4">
                      <div className="col-md-6">
                        <div className="ce-input-group mb-0">
                          <select className="ce-input" {...register("branchId")}>
                            <option value="">Select Branch</option>
                            {branches.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
                          </select>
                          <label className="ce-floating-label static">Branch Location</label>
                          <small className="ce-error">{errors.branchId?.message}</small>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="ce-input-group mb-0">
                          <select className="ce-input" {...register("departmentId")}>
                            <option value="">Select Department</option>
                            {filteredDepartments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                          </select>
                          <label className="ce-floating-label static">Department</label>
                          <small className="ce-error">{errors.departmentId?.message}</small>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="ce-input-group mb-0">
                          <select className="ce-input" {...register("designationId")}>
                             <option value="">Select Designation</option>
                             {filteredDesignations.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                          </select>
                          <label className="ce-floating-label static">Designation / Role</label>
                          <small className="ce-error">{errors.designationId?.message}</small>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="ce-input-group mb-0">
                          <select className="ce-input" {...register("shiftId")}>
                             <option value="">Select Shift</option>
                             {filteredShifts.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                          </select>
                          <label className="ce-floating-label static">Work Shift</label>
                          <small className="ce-error">{errors.shiftId?.message}</small>
                        </div>
                      </div>
                      <div className="col-md-12">
                        <div className="ce-input-group mb-0">
                          <input type="date" className="ce-input" placeholder=" " {...register("doj")} />
                          <label className="ce-floating-label static">Date of Joining (DOJ)</label>
                          <small className="ce-error">{errors.doj?.message}</small>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="ce-card slide-in-right" style={{animationDelay: '0.1s'}}>
                  <div className="ce-card-header">
                    <FaWallet className="text-primary me-2"/> Compensation & Banking
                  </div>
                  <div className="ce-card-body">
                    <div className="ce-salary-box mb-4">
                       <label className="fw-bold text-color-main mb-2 d-block">Monthly Basic Salary</label>
                       <div className="ce-currency-wrapper">
                          <span className="ce-currency-symbol">₹</span>
                          <input type="number" className="ce-currency-input" placeholder="0.00" {...register("basicSalary")} />
                       </div>
                       <small className="ce-error">{errors.basicSalary?.message}</small>
                    </div>

                    <div className="row g-4">
                      <div className="col-md-6">
                        <div className="ce-input-group mb-0">
                          <input className="ce-input text-uppercase fw-bold text-primary" placeholder=" " {...register("pan")} />
                          <label className="ce-floating-label">PAN Number</label>
                          <small className="ce-error">{errors.pan?.message}</small>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="ce-input-group mb-0">
                          <input className="ce-input fw-bold" placeholder=" " {...register("bankAccount")} />
                          <label className="ce-floating-label">Bank A/C Number</label>
                          <small className="ce-error">{errors.bankAccount?.message}</small>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Emergency Contact */}
                <div className="ce-card slide-in-right mt-4" style={{animationDelay: '0.2s'}}>
                  <div className="ce-card-header text-danger">
                    Emergency Contact
                  </div>
                  <div className="ce-card-body pb-0">
                     <div className="row g-3">
                        <div className="col-md-4">
                           <div className="ce-input-group">
                              <input className="ce-input" placeholder=" " {...register("emergencyName")} />
                              <label className="ce-floating-label">Name</label>
                           </div>
                        </div>
                        <div className="col-md-4">
                           <div className="ce-input-group">
                              <input className="ce-input" placeholder=" " {...register("emergencyPhone")} />
                              <label className="ce-floating-label">Phone</label>
                           </div>
                        </div>
                        <div className="col-md-4">
                           <div className="ce-input-group">
                              <input className="ce-input" placeholder=" " {...register("emergencyRelation")} />
                              <label className="ce-floating-label">Relation</label>
                           </div>
                        </div>
                     </div>
                  </div>
                </div>

                <div className="ce-action-footer">
                  <button type="submit" className="ce-submit-btn" style={{background: editData ? "linear-gradient(135deg, #ca8a04, #eab308)" : undefined}}>
                    {editData ? "Update Employee Records" : "Confirm Onboarding"}
                  </button>
                </div>

              </div>
            </div>
          </form>
        )}
      </div>
    </DynamicLayout>
  );
};

export default CreateEmployee;