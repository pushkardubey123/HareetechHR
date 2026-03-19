import React, { useEffect, useState } from "react";
import axios from "axios";
import { useForm } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import Swal from "sweetalert2";
import "bootstrap/dist/css/bootstrap.min.css";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaUser, FaEnvelope, FaLock, FaPhone, FaVenusMars, FaMapMarkerAlt,
  FaCalendar, FaBuilding, FaBriefcase, FaClock, FaIdCard, FaUniversity,
  FaUserShield, FaUsers, FaChartLine
} from "react-icons/fa";
import { useNavigate, Link } from "react-router-dom";
import styles from "./Register.module.css"; 

/* ================= VALIDATION SCHEMAS ================= */
const employeeSchema = yup.object({
  companyId: yup.string().required("Company required"),
  branchId: yup.string().required("Branch required"),
  departmentId: yup.string().required("Dept required"),
  designationId: yup.string().required("Designation required"),
  shiftId: yup.string().required("Shift required"),
  name: yup.string().required("Name required"),
  email: yup.string().email().required("Email required"),
  password: yup.string().min(6).required("Password required"),
  phone: yup.string().matches(/^\d{10}$/, "10 digit req").required(),
  gender: yup.string().required("Gender required"),
  dob: yup.string().required("DOB required"),
  doj: yup.string().required("Join Date required"),
  address: yup.string().required("Address required"),
  emergencyName: yup.string().required("Required"),
  emergencyPhone: yup.string().matches(/^\d{10}$/).required("Required"),
  emergencyRelation: yup.string().required("Required"),
  profilePic: yup.mixed().required("Picture required"),
  pan: yup.string().required("PAN required"),
  bankAccount: yup.string().required("Bank A/C req"),
});

const adminSchema = yup.object({
  name: yup.string().required("Name required"),
  email: yup.string().email().required("Email required"),
  password: yup.string().min(6).required("Password required"),
  phone: yup.string().matches(/^\d{10}$/, "10 digits req").required(),
});

// Stagger Animation Variants
const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } }
};
const itemVariants = {
  hidden: { opacity: 0, x: 20 },
  show: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

const Register = () => {
  const navigate = useNavigate();
  const [role, setRole] = useState("employee");

  const [companies, setCompanies] = useState([]);
  const [branches, setBranches] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [shifts, setShifts] = useState([]);

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm({
    resolver: yupResolver(role === "employee" ? employeeSchema : adminSchema)
  });

  const companyId = watch("companyId");
  const branchId = watch("branchId");
  const departmentId = watch("departmentId");

  /* ================= FETCH DEPENDENCIES ================= */
  useEffect(() => {
    if (role === "employee") {
      axios.get(`${import.meta.env.VITE_API_URL}/public/companies`)
        .then(res => setCompanies(res.data.data || []));
    }
  }, [role]);

  useEffect(() => {
    if (!companyId) return setBranches([]);
    axios.get(`${import.meta.env.VITE_API_URL}/api/public/branches/${companyId}`)
      .then(res => setBranches(res.data.data || []));
  }, [companyId]);

  useEffect(() => {
    if (!branchId) { setDepartments([]); setShifts([]); return; }
    axios.get(`${import.meta.env.VITE_API_URL}/api/departments/public?branchId=${branchId}`)
      .then(res => setDepartments(res.data.data || []));
    axios.get(`${import.meta.env.VITE_API_URL}/api/shifts?branchId=${branchId}`)
      .then(res => setShifts(res.data.data || []));
  }, [branchId]);

  useEffect(() => {
    if (!companyId || !branchId || !departmentId) return setDesignations([]);
    axios.get(`${import.meta.env.VITE_API_URL}/api/designations/public`, {
      params: { companyId, branchId, departmentId },
    }).then(res => setDesignations(res.data.data || []));
  }, [companyId, branchId, departmentId]);

  /* ================= SUBMIT ================= */
  const onSubmit = async (data) => {
    try {
      const formData = new FormData();
      formData.append("role", role);

      if (role === "employee") {
        Object.keys(data).forEach((key) => {
          if (key === "profilePic") formData.append("profilePic", data.profilePic[0]);
          else formData.append(key, data[key]);
        });
        formData.append("emergencyContact", JSON.stringify({
          name: data.emergencyName, phone: data.emergencyPhone, relation: data.emergencyRelation,
        }));
      } else {
        formData.append("name", data.name);
        formData.append("email", data.email);
        formData.append("password", data.password);
        formData.append("phone", data.phone);
      }

      const res = await axios.post(`${import.meta.env.VITE_API_URL}/user/register`, formData);

      if (res.data.success) {
        Swal.fire({ icon: "success", title: "Success", text: res.data.message, background: '#0f172a', color: '#fff' });
        reset();
        navigate("/"); 
      }
    } catch (err) {
      Swal.fire({ icon: "error", title: "Error", text: err.response?.data?.message || "Registration failed", background: '#0f172a', color: '#fff' });
    }
  };

  return (
    <div className={styles.pageWrapper}>
      {/* Background FX */}
      <div className={styles.gridLines}></div>
      <div className={`${styles.bgCircle} ${styles.bgCircle1}`}></div>
      <div className={`${styles.bgCircle} ${styles.bgCircle2}`}></div>

      <motion.div 
        className={styles.mainCard}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        {/* ================= LEFT VISUAL PANEL ================= */}
        <div className={styles.leftVisual}>
          <motion.h1 
            initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className={styles.heroTitle}
          >
            Join the <span className={styles.highlight}>Network</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
            className={styles.heroDesc}
          >
            Access your intelligent workforce dashboard.
          </motion.p>

          {/* Recreated 3D Dashboard from your CSS */}
          <div className={styles.dashboard3dContainer}>
            <div className={styles.dashGlassPanel}>
              <img 
                src="https://cdni.iconscout.com/illustration/premium/thumb/user-registration-4489363-3723270.png" 
                alt="Dashboard" 
                className={styles.dashMainImg}
              />
            </div>
            {/* Floating Stats Card */}
            <div className={styles.floatCard} style={{ top: '-20px', right: '-30px' }}>
              <span className={styles.sLabel}><FaChartLine className="me-2 text-success"/>System Active</span>
              <span className={styles.sVal}>100%</span>
            </div>
            {/* Floating User Card */}
            <div className={styles.floatCard} style={{ bottom: '-30px', left: '-20px' }}>
              <span className={styles.sLabel}>Secure Access</span>
              <div className="d-flex align-items-center gap-2 mt-1">
                <div style={{width:'10px', height:'10px', background:'#22c55e', borderRadius:'50%'}}></div>
                <span className="text-white fw-bold">Verified</span>
              </div>
            </div>
          </div>
        </div>

        {/* ================= RIGHT FORM PANEL ================= */}
        <div className={styles.rightFormArea}>
          <form onSubmit={handleSubmit(onSubmit)} encType="multipart/form-data" className="h-100 d-flex flex-column m-0">
            
            <div className={styles.formHeader}>
              <div className="d-flex justify-content-between align-items-center">
                <h3 className={styles.formTitle}>Create Account</h3>
                <span className="text-muted small">Already registered? <Link to="/" className="text-primary text-decoration-none fw-bold">Login</Link></span>
              </div>
            </div>

            <div className={styles.formBody}>
              {/* Animated Role Toggle */}
              <div className={styles.badgeWrapper}>
                <div className={`${styles.toggleSlider} ${role === 'admin' ? styles.sliderAdmin : ''}`}></div>
                <div className={`${styles.roleOption} ${role === 'employee' ? styles.active : ''}`} onClick={() => { setRole('employee'); reset(); }}>
                  <FaUsers /> Employee
                </div>
                <div className={`${styles.roleOption} ${role === 'admin' ? styles.active : ''}`} onClick={() => { setRole('admin'); reset(); }}>
                  <FaUserShield /> Admin
                </div>
              </div>

              <AnimatePresence mode="wait">
                <motion.div 
                  key={role}
                  variants={containerVariants}
                  initial="hidden" animate="show" exit={{ opacity: 0, x: -20, transition: { duration: 0.2 } }}
                  className="row g-3"
                >
                  
                  {/* --- ADMIN FIELDS --- */}
                  {role === "admin" && (
                    <>
                      <motion.div variants={itemVariants} className="col-md-6">
                        <label className={styles.label}><FaUser/> Full Name</label>
                        <input type="text" className={styles.input} {...register("name")} />
                        <span className={styles.errorText}>{errors.name?.message}</span>
                      </motion.div>
                      <motion.div variants={itemVariants} className="col-md-6">
                        <label className={styles.label}><FaEnvelope/> Email Address</label>
                        <input type="email" className={styles.input} {...register("email")} />
                        <span className={styles.errorText}>{errors.email?.message}</span>
                      </motion.div>
                      <motion.div variants={itemVariants} className="col-md-6">
                        <label className={styles.label}><FaPhone/> Phone Number</label>
                        <input type="text" className={styles.input} {...register("phone")} />
                        <span className={styles.errorText}>{errors.phone?.message}</span>
                      </motion.div>
                      <motion.div variants={itemVariants} className="col-md-6">
                        <label className={styles.label}><FaLock/> Password</label>
                        <input type="password" className={styles.input} {...register("password")} />
                        <span className={styles.errorText}>{errors.password?.message}</span>
                      </motion.div>
                    </>
                  )}

                  {/* --- EMPLOYEE FIELDS --- */}
                  {role === "employee" && (
                    <>
                      <motion.div variants={itemVariants} className="col-12 mt-0">
                        <h5 className={styles.sectionTitle}>Organization Mapping</h5>
                      </motion.div>
                      <motion.div variants={itemVariants} className="col-md-4">
                        <label className={styles.label}><FaBuilding/> Company</label>
                        <select className={styles.input} {...register("companyId")}>
                          <option value="">Select Company</option>
                          {companies.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                        </select>
                        <span className={styles.errorText}>{errors.companyId?.message}</span>
                      </motion.div>
                      <motion.div variants={itemVariants} className="col-md-4">
                        <label className={styles.label}><FaMapMarkerAlt/> Branch</label>
                        <select className={styles.input} {...register("branchId")}>
                          <option value="">Select Branch</option>
                          {branches.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
                        </select>
                        <span className={styles.errorText}>{errors.branchId?.message}</span>
                      </motion.div>
                      <motion.div variants={itemVariants} className="col-md-4">
                        <label className={styles.label}><FaBuilding/> Department</label>
                        <select className={styles.input} {...register("departmentId")}>
                          <option value="">Select Dept</option>
                          {departments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                        </select>
                        <span className={styles.errorText}>{errors.departmentId?.message}</span>
                      </motion.div>
                      <motion.div variants={itemVariants} className="col-md-6">
                        <label className={styles.label}><FaBriefcase/> Designation</label>
                        <select className={styles.input} {...register("designationId")}>
                          <option value="">Select Design.</option>
                          {designations.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                        </select>
                        <span className={styles.errorText}>{errors.designationId?.message}</span>
                      </motion.div>
                      <motion.div variants={itemVariants} className="col-md-6">
                        <label className={styles.label}><FaClock/> Shift</label>
                        <select className={styles.input} {...register("shiftId")}>
                          <option value="">Select Shift</option>
                          {shifts.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                        </select>
                        <span className={styles.errorText}>{errors.shiftId?.message}</span>
                      </motion.div>

                      <motion.div variants={itemVariants} className="col-12">
                        <h5 className={styles.sectionTitle}>Personal Details</h5>
                      </motion.div>
                      <motion.div variants={itemVariants} className="col-md-4">
                        <label className={styles.label}>Full Name</label>
                        <input type="text" className={styles.input} {...register("name")} />
                        <span className={styles.errorText}>{errors.name?.message}</span>
                      </motion.div>
                      <motion.div variants={itemVariants} className="col-md-4">
                        <label className={styles.label}>Email ID</label>
                        <input type="email" className={styles.input} {...register("email")} />
                        <span className={styles.errorText}>{errors.email?.message}</span>
                      </motion.div>
                      <motion.div variants={itemVariants} className="col-md-4">
                        <label className={styles.label}>Password</label>
                        <input type="password" className={styles.input} {...register("password")} />
                        <span className={styles.errorText}>{errors.password?.message}</span>
                      </motion.div>
                      <motion.div variants={itemVariants} className="col-md-4">
                        <label className={styles.label}>Phone No.</label>
                        <input type="text" className={styles.input} {...register("phone")} />
                        <span className={styles.errorText}>{errors.phone?.message}</span>
                      </motion.div>
                      <motion.div variants={itemVariants} className="col-md-4">
                        <label className={styles.label}>Gender</label>
                        <select className={styles.input} {...register("gender")}>
                          <option value="">Select</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                        </select>
                        <span className={styles.errorText}>{errors.gender?.message}</span>
                      </motion.div>
                      <motion.div variants={itemVariants} className="col-md-4">
                        <label className={styles.label}>DOB</label>
                        <input type="date" className={styles.input} {...register("dob")} />
                        <span className={styles.errorText}>{errors.dob?.message}</span>
                      </motion.div>

                      <motion.div variants={itemVariants} className="col-12">
                        <h5 className={styles.sectionTitle}>Compliance & Emergency</h5>
                      </motion.div>
                      <motion.div variants={itemVariants} className="col-md-4">
                        <label className={styles.label}><FaIdCard/> PAN Number</label>
                        <input type="text" className={styles.input} {...register("pan")} />
                        <span className={styles.errorText}>{errors.pan?.message}</span>
                      </motion.div>
                      <motion.div variants={itemVariants} className="col-md-4">
                        <label className={styles.label}><FaUniversity/> Bank A/C</label>
                        <input type="text" className={styles.input} {...register("bankAccount")} />
                        <span className={styles.errorText}>{errors.bankAccount?.message}</span>
                      </motion.div>
                      <motion.div variants={itemVariants} className="col-md-4">
                        <label className={styles.label}><FaCalendar/> Joining Date</label>
                        <input type="date" className={styles.input} {...register("doj")} />
                        <span className={styles.errorText}>{errors.doj?.message}</span>
                      </motion.div>
                      <motion.div variants={itemVariants} className="col-md-4">
                        <label className={styles.label}>Emg Name</label>
                        <input type="text" className={styles.input} {...register("emergencyName")} />
                        <span className={styles.errorText}>{errors.emergencyName?.message}</span>
                      </motion.div>
                      <motion.div variants={itemVariants} className="col-md-4">
                        <label className={styles.label}>Emg Phone</label>
                        <input type="text" className={styles.input} {...register("emergencyPhone")} />
                        <span className={styles.errorText}>{errors.emergencyPhone?.message}</span>
                      </motion.div>
                      <motion.div variants={itemVariants} className="col-md-4">
                        <label className={styles.label}>Relation</label>
                        <input type="text" className={styles.input} {...register("emergencyRelation")} />
                        <span className={styles.errorText}>{errors.emergencyRelation?.message}</span>
                      </motion.div>
                      <motion.div variants={itemVariants} className="col-md-6">
                        <label className={styles.label}>Current Address</label>
                        <input type="text" className={styles.input} {...register("address")} />
                        <span className={styles.errorText}>{errors.address?.message}</span>
                      </motion.div>
                      <motion.div variants={itemVariants} className="col-md-6">
                        <label className={styles.label}>Profile Picture</label>
                        <input type="file" className={styles.input} {...register("profilePic")} />
                        <span className={styles.errorText}>{errors.profilePic?.message}</span>
                      </motion.div>
                    </>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            <div className={styles.formFooter}>
              <motion.button 
                whileHover={{ scale: 1.02, boxShadow: "0 10px 20px rgba(59,130,246,0.4)" }}
                whileTap={{ scale: 0.98 }}
                type="submit" 
                className={styles.btnPrimary}
              >
                {role === "admin" ? "Create Administrator" : "Register Employee"}
              </motion.button>
            </div>

          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;