import { useEffect, useState } from "react";
import axios from "axios";
import { useForm } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import Swal from "sweetalert2";
import "bootstrap/dist/css/bootstrap.min.css";
import {
  FaUser, FaEnvelope, FaLock, FaPhone, FaVenusMars, FaMapMarkerAlt,
  FaCalendar, FaBuilding, FaBriefcase, FaClock, FaUserPlus,
  FaPhoneAlt, FaUsers, FaImage, FaUniversity, FaIdCard
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";

/* ================= VALIDATION ================= */
const schema = yup.object({
  companyId: yup.string().required("Company is required"),
  branchId: yup.string().required("Branch is required"),
  departmentId: yup.string().required("Department is required"),
  designationId: yup.string().required("Designation is required"),
  shiftId: yup.string().required("Shift is required"),
  name: yup.string().required("Name is required"),
  email: yup.string().email().required("Email is required"),
  password: yup.string().min(6).required("Password is required"),
  phone: yup.string().matches(/^\d{10}$/, "10 digit phone required").required(),
  gender: yup.string().required("Gender is required"),
  dob: yup.string().required("Date of Birth is required"),
  doj: yup.string().required("Date of Joining is required"),
  address: yup.string().required("Address is required"),
  emergencyName: yup.string().required(),
  emergencyPhone: yup.string().matches(/^\d{10}$/).required(),
  emergencyRelation: yup.string().required(),
  profilePic: yup.mixed().required("Profile picture is required"),
  pan: yup.string().required("PAN is required"),
  bankAccount: yup.string().required("Bank A/C is required"),
});

const EmployeeRegister = () => {
  const navigate = useNavigate();

  const [companies, setCompanies] = useState([]);
  const [branches, setBranches] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [shifts, setShifts] = useState([]);

  const genderOptions = ["Male", "Female", "Other"];
  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm({
    resolver: yupResolver(schema)
  });

  const companyId = watch("companyId");
  const branchId = watch("branchId");
  const departmentId = watch("departmentId");

  /* ================= FETCH COMPANIES ================= */
  useEffect(() => {
    axios.get(`${import.meta.env.VITE_API_URL}/public/companies`)
      .then(res => setCompanies(res.data.data || []))
      .catch(() => Swal.fire("Error", "Company fetch failed", "error"));
  }, []);

  /* ================= FETCH BRANCHES (COMPANY BASED) ================= */
  useEffect(() => {
    if (!companyId) {
      setBranches([]);
      return;
    }

    axios.get(`${import.meta.env.VITE_API_URL}/api/public/branches/${companyId}`)
      .then(res => setBranches(res.data.data || []))
      .catch(() => Swal.fire("Error", "Branch fetch failed", "error"));
  }, [companyId]);

  /* ================= FETCH DEPARTMENTS & SHIFTS (BRANCH BASED) ================= */
  useEffect(() => {
    if (!branchId) {
      setDepartments([]);
      setShifts([]);
      return;
    }

    axios.get(`${import.meta.env.VITE_API_URL}/api/departments/public?branchId=${branchId}`)
      .then(res => setDepartments(res.data.data || []))
      .catch(() => Swal.fire("Error", "Department fetch failed", "error"));

    axios.get(`${import.meta.env.VITE_API_URL}/api/shifts?branchId=${branchId}`)
      .then(res => setShifts(res.data.data || []))
      .catch(() => Swal.fire("Error", "Shift fetch failed", "error"));
  }, [branchId]);

useEffect(() => {
  if (!companyId || !branchId || !departmentId) {
    setDesignations([]);
    return;
  }

  axios.get(
    `${import.meta.env.VITE_API_URL}/api/designations/public`,
    {
      params: {
        companyId,
        branchId,
        departmentId,
      },
    }
  )
  .then(res => setDesignations(res.data.data || []))
  .catch(() =>
    Swal.fire("Error", "Designation fetch failed", "error")
  );
}, [companyId, branchId, departmentId]);


  /* ================= SUBMIT ================= */
  const onSubmit = async (data) => {
    try {
      const formData = new FormData();

      Object.keys(data).forEach((key) => {
        if (key === "profilePic") formData.append("profilePic", data.profilePic[0]);
        else formData.append(key, data[key]);
      });

      formData.append("emergencyContact", JSON.stringify({
        name: data.emergencyName,
        phone: data.emergencyPhone,
        relation: data.emergencyRelation,
      }));

      const res = await axios.post(`${import.meta.env.VITE_API_URL}/user/register`, formData);

      if (res.data.success) {
        Swal.fire("Success", res.data.message, "success");
        reset();
        navigate("/");
      }
    } catch (err) {
      Swal.fire("Error", err.response?.data?.message || "Registration failed", "error");
    }
  };

  /* ================= FIELDS ================= */
  const fields = [
    { label: "Company", icon: <FaBuilding style={{marginTop:"2px"}}/>, name: "companyId", type: "select", options: companies },
    { label: "Branch", icon: <FaMapMarkerAlt style={{marginTop:"2px"}} />, name: "branchId", type: "select", options: branches },
    { label: "Department", icon: <FaBuilding style={{marginTop:"2px"}} />, name: "departmentId", type: "select", options: departments },
    { label: "Designation", icon: <FaBriefcase style={{marginTop:"2px"}} />, name: "designationId", type: "select", options: designations },
    { label: "Shift", icon: <FaClock style={{marginTop:"2px"}} />, name: "shiftId", type: "select", options: shifts },
    { label: "Name", icon: <FaUser style={{marginTop:"2px"}} />, name: "name" },
    { label: "Email", icon: <FaEnvelope style={{marginTop:"2px"}} />, name: "email" },
    { label: "Password", icon: <FaLock style={{marginTop:"2px"}} />, name: "password", type: "password" },
    { label: "Phone", icon: <FaPhone style={{marginTop:"2px"}} />, name: "phone" },
    { label: "Gender", icon: <FaVenusMars style={{marginTop:"2px"}} />, name: "gender", type: "select", options: genderOptions },
    { label: "Date of Birth", icon: <FaCalendar style={{marginTop:"2px"}} />, name: "dob", type: "date" },
    { label: "Date of Joining", icon: <FaCalendar style={{marginTop:"2px"}} />, name: "doj", type: "date" },
    { label: "PAN Number", icon: <FaIdCard style={{marginTop:"2px"}} />, name: "pan" },
    { label: "Bank A/C Number", icon: <FaUniversity style={{marginTop:"2px"}} />, name: "bankAccount" },
    { label: "Address", icon: <FaMapMarkerAlt style={{marginTop:"2px"}} />, name: "address" },
    { label: "Emergency Name", icon: <FaUserPlus style={{marginTop:"2px"}} />, name: "emergencyName" },
    { label: "Emergency Phone", icon: <FaPhoneAlt style={{marginTop:"2px"}} />, name: "emergencyPhone" },
    { label: "Emergency Relation", icon: <FaUsers style={{marginTop:"2px"}} />, name: "emergencyRelation" },
    { label: "Profile Picture", icon: <FaImage style={{marginTop:"2px"}} />, name: "profilePic", type: "file" },
  ];

  return (
    <div className="animated-bg" style={{ minHeight: "100vh", paddingTop: 40 }}>
      <div className="container">
        <div className="row bg-white rounded shadow-lg overflow-hidden">
          <div className="col-md-4 d-none d-md-block text-white p-4" style={{ background: "#007bff" }}>
            <h2 className="fw-bold">Welcome</h2>
            <p>Join the team and grow together</p>
            <img
              src="https://static.vecteezy.com/system/resources/previews/003/689/228/non_2x/online-registration-or-sign-up-login-for-account-on-smartphone-app-user-interface-with-secure-password-mobile-application-for-ui-web-banner-access-cartoon-people-illustration-vector.jpg"
              className="img-fluid rounded"
            />
          </div>
          <div className="col-md-8 p-4">
            <h4 className="text-center text-primary fw-bold mb-4">Employee Registration</h4>
            <form onSubmit={handleSubmit(onSubmit)} encType="multipart/form-data">
              <div className="row g-3">
                {fields.map((f, i) => (
                  <div className="col-md-4" key={i}>
                    <label className="form-label d-flex align-item-center gap-2">{f.icon} {f.label}</label>
                    {f.type === "select" ? (
                      <select className="form-control" {...register(f.name)}>
                        <option value="">Select {f.label}</option>
                        {f.options.map(opt =>
                          typeof opt === "string" ? (
                            <option key={opt} value={opt}>{opt}</option>
                          ) : (
                            <option key={opt._id} value={opt._id}>{opt.name}</option>
                          )
                        )}
                      </select>
                    ) : (
                      <input type={f.type || "text"} className="form-control" {...register(f.name)} />
                    )}
                    <small className="text-danger">{errors[f.name]?.message}</small>
                  </div>
                ))}
              </div>
              <div className="text-center mt-4">
                <button className="btn btn-primary btn-lg fw-bold">Register</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeRegister;
