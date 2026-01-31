import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useNavigate, Link } from "react-router-dom";
import { 
  FaPhoneAlt, FaMapMarkerAlt, FaShieldAlt, FaRocket, FaUserShield, 
  FaChevronDown, FaUserTie, FaUsers, FaCheckCircle, FaBuilding, FaCodeBranch, FaLayerGroup, FaIdBadge, FaClock
} from "react-icons/fa";
import { MdEmail } from "react-icons/md";
import { GoogleLogin } from "@react-oauth/google"; 
import { motion, AnimatePresence } from "framer-motion"; 
import "./Login.css";

// Login Schema
const schema = yup.object().shape({
  role: yup.string().required("Please select your role"),
  email: yup.string().email("Invalid email format").required("Email is required"),
  password: yup.string().required("Password is required"),
});

const LoginSection = () => {
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm({ 
    resolver: yupResolver(schema) 
  });
  
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // --- Modal States ---
  const [showModal, setShowModal] = useState(false);
  const [googleData, setGoogleData] = useState(null);
  const [modalStep, setModalStep] = useState(1); // 1 = Role Selection, 2 = Employee Details
  const [selectedRegRole, setSelectedRegRole] = useState(null);

  // --- Employee Form Data & Dynamic Lists ---
  const [empFormData, setEmpFormData] = useState({
    companyId: "", branchId: "", departmentId: "", designationId: "", shiftId: ""
  });

  const [companies, setCompanies] = useState([]);
  const [branches, setBranches] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [shifts, setShifts] = useState([]);

  // --- API LOGIC FOR DYNAMIC DROPDOWNS ---

  // 1. Fetch Companies when Modal Step 2 opens
  useEffect(() => {
    if (showModal && modalStep === 2) {
       axios.get(`${import.meta.env.VITE_API_URL}/public/companies`)
         .then(res => setCompanies(res.data.data || []))
         .catch(err => console.error("Company Fetch Error", err));
    }
  }, [showModal, modalStep]);

  // 2. Fetch Branches when Company Changes
  useEffect(() => {
    if (!empFormData.companyId) {
        setBranches([]);
        return;
    }
    // Reset downstream fields
    setEmpFormData(prev => ({ ...prev, branchId: "", departmentId: "", designationId: "", shiftId: "" }));
    
    axios.get(`${import.meta.env.VITE_API_URL}/api/public/branches/${empFormData.companyId}`)
      .then(res => setBranches(res.data.data || []))
      .catch(err => console.error("Branch Fetch Error", err));
  }, [empFormData.companyId]);

  // 3. Fetch Departments & Shifts when Branch Changes
  useEffect(() => {
    if (!empFormData.branchId) {
        setDepartments([]);
        setShifts([]);
        return;
    }
    // Reset downstream fields
    setEmpFormData(prev => ({ ...prev, departmentId: "", designationId: "", shiftId: "" }));

    // Fetch Departments
    axios.get(`${import.meta.env.VITE_API_URL}/api/departments/public?branchId=${empFormData.branchId}`)
      .then(res => setDepartments(res.data.data || []));

    // Fetch Shifts
    axios.get(`${import.meta.env.VITE_API_URL}/api/shifts?branchId=${empFormData.branchId}`)
      .then(res => setShifts(res.data.data || []));

  }, [empFormData.branchId]);

  // 4. Fetch Designations when Department Changes
  useEffect(() => {
    if (!empFormData.companyId || !empFormData.branchId || !empFormData.departmentId) {
        setDesignations([]);
        return;
    }
    // Reset designation
    setEmpFormData(prev => ({ ...prev, designationId: "" }));

    axios.get(`${import.meta.env.VITE_API_URL}/api/designations/public`, {
        params: {
            companyId: empFormData.companyId,
            branchId: empFormData.branchId,
            departmentId: empFormData.departmentId,
        }
    })
    .then(res => setDesignations(res.data.data || []));
  }, [empFormData.departmentId]);


  // --- Helper to update form state ---
  const handleEmpFormChange = (e) => {
      setEmpFormData({ ...empFormData, [e.target.name]: e.target.value });
  };

  // --- Dropdown Logic (Manual Login) ---
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const selectedRole = watch("role"); 

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownRef]);

  const handleRoleSelect = (role) => {
    setValue("role", role, { shouldValidate: true });
    setDropdownOpen(false);
  };

  // --- Auth & Register Handlers ---
  const loginSuccess = (user, token) => {
      localStorage.setItem("user", JSON.stringify({
           role: user.role, token, id: user.id, 
           username: user.name, email: user.email, profilePic: user.profilePic
      }));
      Swal.fire({ 
          icon: "success", title: "Access Granted", text: `Welcome back, ${user.name}`,
          background: "#1e293b", color: "#fff", timer: 1500, showConfirmButton: false, toast: true, position: 'top-end'
      });
      navigate(user.role === "admin" ? "/admin/dashboard" : "/employee/dashboard");
  };

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/user/login`, data);
      if (res.data.success) loginSuccess(res.data.data, res.data.token);
      else Swal.fire({ icon: "error", title: "Login Failed", text: res.data.message, background: "#1e293b", color: "#fff" });
    } catch (err) {
      Swal.fire({ icon: "error", title: "Error", text: err.response?.data?.message || "Connection failed", background: "#1e293b", color: "#fff" });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
        setLoading(true);
        const res = await axios.post(`${import.meta.env.VITE_API_URL}/user/google-auth-check`, {
            credential: credentialResponse.credential
        });

        if (res.data.success) {
            if (res.data.mode === "LOGIN") {
                loginSuccess(res.data.data, res.data.token);
            } else if (res.data.mode === "REGISTER") {
                setGoogleData(res.data.googleData);
                setShowModal(true);
                setModalStep(1);
            }
        }
    } catch (err) {
        Swal.fire({ icon: "error", title: "Auth Failed", text: err.response?.data?.message || "Google Login Failed", background: "#1e293b", color: "#fff" });
    } finally {
        setLoading(false);
    }
  };

  const handleFinalRegister = async () => {
      try {
          const payload = {
              role: selectedRegRole,
              googleData: googleData,
              employeeDetails: selectedRegRole === 'Employee' ? empFormData : null
          };

          const res = await axios.post(`${import.meta.env.VITE_API_URL}/user/google-register`, payload);

          if(res.data.success) {
              setShowModal(false);
              if(res.data.mode === "CREATED_ADMIN") {
                  loginSuccess(res.data.data, res.data.token);
              } else {
                  Swal.fire({
                      icon: "info", title: "Request Sent",
                      text: "Your account is pending Admin approval.",
                      background: "#1e293b", color: "#fff"
                  });
              }
          }
      } catch (err) {
          Swal.fire("Error", "Registration Failed", "error");
      }
  };

  return (
    <section id="login-section" className="login-section-wrapper">
      
      {/* Neon Separator */}
      <div className="section-separator-neon"></div>
      
      {/* Background */}
      <div className="blob-cont">
          <div className="blob blob-1"></div>
          <div className="blob blob-2"></div>
      </div>

      <div className="login-container">
        <div className="login-floating-card">
            
            {/* Top Glow Border */}
            <div className="card-top-glow-line"></div>

            <div className="login-card-grid">
            
            {/* Left Side */}
            <div className="card-left-text">
                <div className="brand-badge"><FaShieldAlt /> Secure Portal</div>
                <h2>Welcome to your <br/> <span className="text-gradient">Professional Workspace.</span></h2>
                <p className="login-subtext">Manage attendance, payroll, and workforce analytics with bank-grade security.</p>
                <div className="login-benefits">
                    <div className="benefit-item"><div className="chk-icon"><FaUserShield /></div> <span>Admin Control</span></div>
                    <div className="benefit-item"><div className="chk-icon"><FaRocket /></div> <span>Real-time Sync</span></div>
                </div>
            </div>

            {/* Right Side */}
            <div className="card-right-form">
                
                {/* Google Button */}
                <div className="google-section">
                    <p className="auth-label">Sign in / Register</p>
                    <div className="google-btn-wrapper">
                        <GoogleLogin onSuccess={handleGoogleSuccess} onError={() => {}} theme="filled_blue" size="large" shape="pill" width="100%" text="continue_with" />
                    </div>
                </div>

                <div className="login-divider"><span>OR LOGIN MANUALLY</span></div>

                <form onSubmit={handleSubmit(onSubmit)}>
                
                {/* Manual Login Dropdown */}
                <div className="form-group" ref={dropdownRef}>
                    <label>Select Role</label>
                    <div 
                        className={`custom-dropdown-trigger ${(!selectedRole) ? 'minimal-mode' : 'filled-mode'} ${isDropdownOpen ? 'active' : ''}`} 
                        onClick={() => setDropdownOpen(!isDropdownOpen)}
                    >
                        <span className="selected-text-container">
                            {selectedRole === "Admin" ? <span className="active-selection"><FaUserTie className="drop-icon"/> Administrator</span> : 
                             selectedRole === "Employee" ? <span className="active-selection"><FaUsers className="drop-icon"/> Employee</span> : 
                             <span className="custom-placeholder-text">Select User Role</span>}
                        </span>
                        <FaChevronDown className={`arrow-icon ${isDropdownOpen ? 'rotate' : ''}`} />
                    </div>
                    <div className={`custom-dropdown-options ${isDropdownOpen ? 'show' : ''}`}>
                        <div className="option-item" onClick={() => handleRoleSelect("Admin")}>
                            <div className="opt-icon-box admin-box"><FaUserTie /></div>
                            <div className="opt-text"><span>Administrator</span><small>Full System Access</small></div>
                        </div>
                        <div className="option-item" onClick={() => handleRoleSelect("Employee")}>
                            <div className="opt-icon-box emp-box"><FaUsers /></div>
                            <div className="opt-text"><span>Employee</span><small>Portal & Tasks</small></div>
                        </div>
                    </div>
                    <input type="hidden" {...register("role")} />
                    {errors.role && <span className="err-msg">{errors.role.message}</span>}
                </div>

                <div className="form-group">
                    <label>Email Address</label>
                    <div className="input-wrapper">
                        <input type="text" placeholder="name@company.com" {...register("email")} className="clean-input"/>
                    </div>
                    {errors.email && <span className="err-msg">{errors.email.message}</span>}
                </div>

                <div className="form-group">
                    <label>Password</label>
                    <div className="input-wrapper">
                        <input type="password" placeholder="••••••••" {...register("password")} className="clean-input"/>
                    </div>
                    {errors.password && <span className="err-msg">{errors.password.message}</span>}
                </div>

                <div className="form-actions-row">
                    <label className="rem-me"><input type="checkbox" /> Remember me</label>
                    <Link to="/forgot-password" class="forgot-lnk">Forgot Password?</Link>
                </div>

                <button type="submit" disabled={loading} className="btn-submit-login">
                    {loading ? <div className="spinner-sm"></div> : "Access Dashboard"}
                </button>

                <div className="register-redirect">
                    New Employee? <Link to="/register" className="reg-link">Create Account</Link>
                </div>

                </form>
            </div>
            </div>
        </div>
      </div>

      {/* --- REGISTRATION MODAL --- */}
      <AnimatePresence>
        {showModal && (
            <motion.div className="modal-backdrop" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
                <motion.div className="modal-glass-content" initial={{scale:0.8, opacity:0}} animate={{scale:1, opacity:1}} exit={{scale:0.8, opacity:0}}>
                    
                    {/* Header */}
                    <div className="modal-header">
                        <h3>Complete Registration</h3>
                        <p>Hello, {googleData?.name}</p>
                    </div>

                    {/* Step 1: Role Selection */}
                    {modalStep === 1 && (
                        <div className="modal-body">
                            <p className="step-title">How do you want to join?</p>
                            <div className="role-selection-grid">
                                <div className={`role-card ${selectedRegRole === 'Admin' ? 'selected' : ''}`} onClick={() => setSelectedRegRole('Admin')}>
                                    <div className="role-icon-lg admin-bg"><FaUserTie/></div>
                                    <h4>Company Admin</h4>
                                    <p>Register a new company.</p>
                                </div>
                                <div className={`role-card ${selectedRegRole === 'Employee' ? 'selected' : ''}`} onClick={() => setSelectedRegRole('Employee')}>
                                    <div className="role-icon-lg emp-bg"><FaUsers/></div>
                                    <h4>Employee</h4>
                                    <p>Join an existing team.</p>
                                </div>
                            </div>
                            <div className="modal-actions">
                                <button className="btn-cancel" onClick={() => setShowModal(false)}>Cancel</button>
                                <button 
                                    className="btn-next" 
                                    disabled={!selectedRegRole}
                                    onClick={() => {
                                        if(selectedRegRole === 'Admin') handleFinalRegister();
                                        else setModalStep(2);
                                    }}
                                >
                                    {selectedRegRole === 'Admin' ? 'Create Admin Account' : 'Next Step'}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Employee Dynamic Dropdowns */}
                    {modalStep === 2 && (
                        <div className="modal-body">
                            <p className="step-title">Join Your Organization</p>
                            <div className="emp-form-grid">
                                
                                {/* 1. Company */}
                                <div className="modal-input-grp">
                                    <label><FaBuilding/> Company</label>
                                    <select 
                                        name="companyId"
                                        className="modal-select" 
                                        value={empFormData.companyId} 
                                        onChange={handleEmpFormChange}
                                    >
                                        <option value="">Select Company</option>
                                        {companies.map(c => (
                                            <option key={c._id} value={c._id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* 2. Branch (Dependent on Company) */}
                                <div className="modal-input-grp">
                                    <label><FaCodeBranch/> Branch</label>
                                    <select 
                                        name="branchId"
                                        className="modal-select" 
                                        value={empFormData.branchId} 
                                        onChange={handleEmpFormChange}
                                        disabled={!empFormData.companyId}
                                    >
                                        <option value="">Select Branch</option>
                                        {branches.map(b => (
                                            <option key={b._id} value={b._id}>{b.name}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* 3. Department (Dependent on Branch) */}
                                <div className="modal-input-grp">
                                    <label><FaLayerGroup/> Department</label>
                                    <select 
                                        name="departmentId"
                                        className="modal-select" 
                                        value={empFormData.departmentId} 
                                        onChange={handleEmpFormChange}
                                        disabled={!empFormData.branchId}
                                    >
                                        <option value="">Select Department</option>
                                        {departments.map(d => (
                                            <option key={d._id} value={d._id}>{d.name}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* 4. Designation (Dependent on Dept) */}
                                <div className="modal-input-grp">
                                    <label><FaIdBadge/> Designation</label>
                                    <select 
                                        name="designationId"
                                        className="modal-select" 
                                        value={empFormData.designationId} 
                                        onChange={handleEmpFormChange}
                                        disabled={!empFormData.departmentId}
                                    >
                                        <option value="">Select Designation</option>
                                        {designations.map(d => (
                                            <option key={d._id} value={d._id}>{d.name}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* 5. Shift (Dependent on Branch) */}
                                <div className="modal-input-grp">
                                    <label><FaClock/> Shift</label>
                                    <select 
                                        name="shiftId"
                                        className="modal-select" 
                                        value={empFormData.shiftId} 
                                        onChange={handleEmpFormChange}
                                        disabled={!empFormData.branchId}
                                    >
                                        <option value="">Select Shift</option>
                                        {shifts.map(s => (
                                            <option key={s._id} value={s._id}>{s.name} ({s.startTime} - {s.endTime})</option>
                                        ))}
                                    </select>
                                </div>

                            </div>
                            <div className="modal-actions">
                                <button className="btn-cancel" onClick={() => setModalStep(1)}>Back</button>
                                <button className="btn-next" onClick={handleFinalRegister}>Submit Request</button>
                            </div>
                        </div>
                    )}

                </motion.div>
            </motion.div>
        )}
      </AnimatePresence>

      <footer className="page-footer">
         <div className="footer-content">
             <div className="footer-brand">
                 <div className="footer-logo"><div className="f-icon-pulse"></div> Audit365-HR</div>
                 <p className="footer-tagline">Empowering Workforces Globally.</p>
             </div>
             <div className="footer-contact">
                 <div className="contact-item"><FaPhoneAlt className="c-icon"/> <span>+91 6394181905</span></div>
                 <div className="contact-item"><MdEmail className="c-icon"/> <span>info@hareetech.com</span></div>
                 <div className="contact-item"><FaMapMarkerAlt className="c-icon"/> <span>Lucknow, India</span></div>
             </div>
         </div>
         <div className="footer-bottom">
             <span>© 2026 Audit365-HR. All rights reserved.</span>
         </div>
      </footer>
    </section>
  );
};

export default LoginSection;