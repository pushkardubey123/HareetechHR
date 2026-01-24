import React, { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import AdminLayout from "./AdminLayout";
import { 
  FaEdit, FaTrash, FaUserPlus, FaEye, FaIdCard, 
  FaBriefcase, FaUniversity, FaCamera, FaMapMarkerAlt, FaShieldAlt 
} from "react-icons/fa";
import { Modal, Button, Row, Col, Form } from "react-bootstrap";
import Loader from "./Loader/Loader";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import "./AdminEmployeeManagement.css";
import { useNavigate } from "react-router-dom";

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
        // --- EDIT LOGIC ---
        await axios.put(`${import.meta.env.VITE_API_URL}/employeeget/${editId}`, formDataToSend, {
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
        });
        
        Swal.fire({ icon: "success", title: "Updated!", showConfirmButton: false, timer: 1500 });
        fetchData(); // Data refresh isi page par
      } else {
        // --- NEW REGISTRATION LOGIC ---
        await axios.post(`${import.meta.env.VITE_API_URL}/user/register`, formDataToSend);
        
        Swal.fire({ icon: "success", title: "Registration Successful", showConfirmButton: false, timer: 1500 });
        
        // Naya employee hai toh verification/pending page par navigate karein
        // Aapka route name "/pending-employee" ya jo bhi ho wo yahan likhein
        navigate("/pending-employee"); 
      }

      setShowModal(false);
      setEditId(null);
      reset(); // Form clear karne ke liye
      setProfilePic(null);
      
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

  return (
    <AdminLayout>
      <div className="hq-extreme-wrapper">
        <div className="hq-container container-fluid">
          <div className="hq-mgmt-header">
            <div className="hq-header-left d-flex align-items-center">
              <div className="hq-icon-badge"><FaShieldAlt /></div>
              <div className="ms-3 mt-3">
                <h2 className="hq-main-title">Staff Management</h2>
                <p className="hq-sub-title d-none d-md-block">Manage access, roles, and profiles</p>
              </div>
            </div>
            <button className="hq-add-btn-premium" onClick={() => { reset(); setEditId(null); setProfilePic(null); if (adminCompanyId) setValue("companyId", adminCompanyId); setShowModal(true); }}>
              <FaUserPlus /> <span>Add Employee</span>
            </button>
          </div>

          <div className="hq-table-card-main">
            {loading ? <div className="loader-box"><Loader /></div> : (
              <div className="table-responsive">
                <table className="hq-premium-table">
                  <thead>
                    <tr>
                      <th>S No.</th>
                      <th>Full Name</th>
                      <th>Contact</th>
                      <th>Location</th>
                      <th>Work Role</th>
                      <th className="text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employees.map((emp, i) => (
                      <tr key={emp._id} onClick={() => navigate(`/admin/employee/${emp._id}`, { state: emp })}>
                        <td><span className="hq-td-index">{i + 1}</span></td>
                        <td className="hq-td-emp-name">{emp.name}</td>
                        <td className="hq-td-emp-email">{emp.email}</td>
                        <td>
                          <div className="hq-td-branch-text">{emp.branchId?.name || "N/A"}</div>
                          <div className="hq-td-dept-text">{emp.departmentId?.name}</div>
                        </td>
                        <td>
                          <div className="hq-badge-role">{emp.designationId?.name}</div>
                          <div className="hq-td-shift-text">{emp.shiftId?.name}</div>
                        </td>
                        <td>
                          <div className="hq-action-stack" onClick={(e) => e.stopPropagation()}>
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

        <Modal show={showModal} onHide={() => setShowModal(false)} size="xl" centered className="hq-master-modal" backdrop="static">
          <Modal.Body className="p-0">
            <Form onSubmit={handleSubmit(onSubmit)}>
              <Row className="g-0">
                <Col lg={4} className="hq-modal-identity-pane p-4">
                  <div className="hq-profile-upload-center mb-4">
                    <div className="hq-profile-frame">
                      {profilePic ? <img src={URL.createObjectURL(profilePic)} alt="p" /> : <FaCamera />}
                    </div>
                    <Form.Control type="file" id="modalPic" className="d-none" onChange={(e) => setProfilePic(e.target.files[0])} />
                    <label htmlFor="modalPic" className="hq-upload-label-v2 d-flex justify-center">Update Photo</label>
                  </div>
                  <div className="hq-identity-inputs">
                    <h6 className="hq-field-label-main mb-3">Basic Information</h6>
                    <Form.Group className="mb-3">
                      <Form.Label>Full Name</Form.Label>
                      <Form.Control {...register("name")} isInvalid={!!errors.name} />
                      <Form.Control.Feedback type="invalid">{errors.name?.message}</Form.Control.Feedback>
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>Official Email</Form.Label>
                      <Form.Control {...register("email")} isInvalid={!!errors.email} />
                      <Form.Control.Feedback type="invalid">{errors.email?.message}</Form.Control.Feedback>
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>Phone Number</Form.Label>
                      <Form.Control {...register("phone")} isInvalid={!!errors.phone} />
                      <Form.Control.Feedback type="invalid">{errors.phone?.message}</Form.Control.Feedback>
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>Date of Birth</Form.Label>
                      <Form.Control type="date" {...register("dob")} isInvalid={!!errors.dob} />
                      <Form.Control.Feedback type="invalid">{errors.dob?.message}</Form.Control.Feedback>
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>Gender</Form.Label>
                      <Form.Select {...register("gender")} isInvalid={!!errors.gender}>
                        <option value="">Select</option>
                        <option value="Men">Male</option>
                        <option value="Women">Female</option>
                      </Form.Select>
                      <Form.Control.Feedback type="invalid">{errors.gender?.message}</Form.Control.Feedback>
                    </Form.Group>
                  </div>
                </Col>
                <Col lg={8} className="hq-modal-form-pane p-4">
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <h4 className="hq-modal-header-title m-0">{editId ? "Edit Staff" : "New Onboarding"}</h4>
                    <button type="button" className="btn-close hq-btn-close" onClick={() => setShowModal(false)}></button>
                  </div>
                  <Row className="gy-3">
                    <Col md={12}><div className="hq-form-divider-v2 d-flex align-item-center"><FaBriefcase className="me-2"/> Work & Organization</div></Col>
                    <Col md={6}><Form.Label>Company</Form.Label><Form.Select {...register("companyId")} disabled className="hq-readonly-select">{companies.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}</Form.Select></Col>
                    <Col md={6}><Form.Label>Branch</Form.Label><Form.Select {...register("branchId")} isInvalid={!!errors.branchId}><option value="">Select Branch</option>{filteredBranches.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}</Form.Select></Col>
                    <Col md={4}><Form.Label>Department</Form.Label><Form.Select {...register("departmentId")} isInvalid={!!errors.departmentId}><option value="">Select Dept</option>{filteredDepartments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}</Form.Select></Col>
                    <Col md={4}><Form.Label>Designation</Form.Label><Form.Select {...register("designationId")} isInvalid={!!errors.designationId}><option value="">Select Desig</option>{filteredDesignations.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}</Form.Select></Col>
                    <Col md={4}><Form.Label>Shift</Form.Label><Form.Select {...register("shiftId")} isInvalid={!!errors.shiftId}><option value="">Select Shift</option>{filteredShifts.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}</Form.Select></Col>
                    <Col md={6}><Form.Label>Joining Date</Form.Label><Form.Control type="date" {...register("doj")} isInvalid={!!errors.doj} /></Col>
                    {!editId && <Col md={6}><Form.Label>Password</Form.Label><Form.Control type="password" {...register("password")} isInvalid={!!errors.password} /></Col>}
                    <Col md={12} className="mt-4"><div className="hq-form-divider-v2 d-flex align-item-center"><FaUniversity className="me-2"/> Banking & Identity</div></Col>
                    <Col md={4}><Form.Label>PAN Number</Form.Label><Form.Control {...register("pan")} isInvalid={!!errors.pan} /></Col>
                    <Col md={8}><Form.Label>Bank Account</Form.Label><Form.Control {...register("bankAccount")} isInvalid={!!errors.bankAccount} /></Col>
                    <Col md={12} className="mt-4"><div className="hq-form-divider-v2 d-flex align-item-center"><FaMapMarkerAlt className="me-2"/> Emergency & Address</div></Col>
                    <Col md={12}><Form.Label>Address</Form.Label><Form.Control as="textarea" rows={1} {...register("address")} isInvalid={!!errors.address} /></Col>
                    <Col md={4}><Form.Label>Contact Person</Form.Label><Form.Control {...register("emergencyContact.name")} /></Col>
                    <Col md={4}><Form.Label>Phone</Form.Label><Form.Control {...register("emergencyContact.phone")} /></Col>
                    <Col md={4}><Form.Label>Relation</Form.Label><Form.Control {...register("emergencyContact.relation")} /></Col>
                  </Row>
                  <div className="hq-modal-footer-v2 mt-4 d-flex justify-content-end gap-3">
                    <Button variant="outline-secondary" className="px-4" onClick={() => setShowModal(false)}>Cancel</Button>
                    <Button type="submit" className="hq-submit-btn-v2">{editId ? "Update Data" : "Confirm Member"}</Button>
                  </div>
                </Col>
              </Row>
            </Form>
          </Modal.Body>
        </Modal>
      </div>
    </AdminLayout>
  );
};

export default EmployeeManagement;