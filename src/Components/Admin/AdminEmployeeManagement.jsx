import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import DynamicLayout from "../Common/DynamicLayout";
import {
  FaTrash,
  FaUserPlus,
  FaEye,
  FaShieldAlt,
  FaUsers,
  FaEdit,
  FaFilter,
} from "react-icons/fa";
import Loader from "./Loader/Loader";
import { useNavigate } from "react-router-dom";
import "./AdminEmployeeManagement.css";

const EmployeeManagement = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // --- FILTER STATES ---
  const [branches, setBranches] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);

  const [selectedBranch, setSelectedBranch] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedDesignation, setSelectedDesignation] = useState("");

  // --- USER & PERMISSION LOGIC ---
  const userStr = localStorage.getItem("user");
  const userObj = userStr ? JSON.parse(userStr) : null;
  const token = userObj?.token;
  const role = userObj?.role;
  const isAdmin = role === "admin";

  const [perms, setPerms] = useState({ view: false, create: false, edit: false, delete: false });
  const getHeaders = () => ({ headers: { Authorization: `Bearer ${token}` } });
  const API_URL = import.meta.env.VITE_API_URL;

  // 1. Fetch Permissions & Branches & All Employees initially
  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      try {
        // Permissions
        if (!isAdmin && token) {
          const res = await axios.get(`${API_URL}/api/my-modules`, getHeaders());
          if (res.data.detailed?.employee_management) {
            setPerms(res.data.detailed.employee_management);
          }
        }
        // Branches
        const branchRes = await axios.get(`${API_URL}/api/branch`, getHeaders());
        if (branchRes.data.success) setBranches(branchRes.data.data);

        // All Employees
        const empRes = await axios.get(`${API_URL}/user`, getHeaders());
        setEmployees((empRes.data.data || []).reverse());
      } catch (err) {
        toast.error("Failed to load initial data");
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, [token, isAdmin]);

  // 2. Fetch Departments when Branch changes
  useEffect(() => {
    setDepartments([]); setSelectedDepartment("");
    setDesignations([]); setSelectedDesignation("");
    if (!selectedBranch) return;
    axios.get(`${API_URL}/api/departments?branchId=${selectedBranch}`, getHeaders())
      .then(res => { if (res.data.success) setDepartments(res.data.data); })
      .catch(() => {});
  }, [selectedBranch]);

  // 3. Fetch Designations when Department changes
  useEffect(() => {
    setDesignations([]); setSelectedDesignation("");
    if (!selectedDepartment) return;
    axios.get(`${API_URL}/api/designations?branchId=${selectedBranch}&departmentId=${selectedDepartment}`, getHeaders())
      .then(res => { if (res.data.success) setDesignations(res.data.data); })
      .catch(() => {});
  }, [selectedDepartment, selectedBranch]);

  // --- DELETE HANDLER ---
  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (window.confirm("Delete Employee? This action cannot be undone.")) {
      try {
        await axios.delete(`${API_URL}/employeedelete/${id}`, getHeaders());
        setEmployees(prev => prev.filter(emp => emp._id !== id));
        toast.success("Employee has been removed.");
      } catch (err) {
        toast.error("Delete failed. Please try again.");
      }
    }
  };

  // --- FILTER LOGIC ---
  const filteredEmployees = employees.filter(emp => {
    let match = true;
    if (selectedBranch && emp.branchId?._id !== selectedBranch) match = false;
    if (selectedDepartment && emp.departmentId?._id !== selectedDepartment) match = false;
    if (selectedDesignation && emp.designationId?._id !== selectedDesignation) match = false;
    return match;
  });

  const canCreate = isAdmin || perms.create;
  const canDelete = isAdmin || perms.delete;
  const canManageAuthority = isAdmin; // Adjust if HR can manage

  return (
    <DynamicLayout>
      <div className="hq-extreme-wrapper">
        <div className="container-fluid p-0">
          
          {/* HEADER SECTION */}
          <div className="hq-mgmt-header fade-in-down">
            <div className="hq-header-left">
              <div className="hq-icon-badge glass-icon"><FaUsers /></div>
              <div>
                <h2 className="hq-main-title dynamic-text-color">Staff Directory</h2>
                <p className="hq-sub-title">Manage access, roles, and profiles</p>
              </div>
            </div>

            <div className="hq-header-actions">
              {canCreate && (
                <button
                  className="hq-add-btn-premium hover-lift glow-effect"
                  onClick={() => navigate("/admin/create-employee")}
                >
                  <FaUserPlus /> <span>Onboard Employee</span>
                </button>
              )}
            </div>
          </div>

          {/* FILTER SECTION */}
          <div className="hq-filter-bar mb-4 fade-in-up">
            <div className="d-flex align-items-center gap-2 mb-3">
              <FaFilter className="text-primary" /> <span className="fw-bold dynamic-text-color">Filter Directory</span>
            </div>
            <div className="row g-3">
              <div className="col-md-4">
                <select className="form-select hq-custom-select" value={selectedBranch} onChange={(e) => setSelectedBranch(e.target.value)}>
                  <option value="">All Branches</option>
                  {branches.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
                </select>
              </div>
              <div className="col-md-4">
                <select className="form-select hq-custom-select" value={selectedDepartment} onChange={(e) => setSelectedDepartment(e.target.value)} disabled={!selectedBranch}>
                  <option value="">All Departments</option>
                  {departments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                </select>
              </div>
              <div className="col-md-4">
                <select className="form-select hq-custom-select" value={selectedDesignation} onChange={(e) => setSelectedDesignation(e.target.value)} disabled={!selectedDepartment}>
                  <option value="">All Designations</option>
                  {designations.map(des => <option key={des._id} value={des._id}>{des.name}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* TABLE SECTION */}
          <div className="hq-table-card-main fade-in-up">
            {loading ? (
              <div className="p-5"><Loader /></div>
            ) : (
              <div className="hq-table-responsive-box">
                <table className="table hq-premium-table m-0">
                  <thead>
                    <tr>
                      <th style={{ width: '35%' }}>Employee Info</th>
                      <th style={{ width: '25%' }}>Location / Dept</th>
                      <th style={{ width: '25%' }}>Role & Shift</th>
                      <th className="text-end pe-4" style={{ width: '15%' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEmployees.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="text-center py-5 text-muted fw-bold">
                          No employees match your filters.
                        </td>
                      </tr>
                    ) : (
                      filteredEmployees.map((emp) => (
                        <tr key={emp._id} onClick={() => navigate(`/admin/employee/${emp._id}`, { state: emp })} className="cursor-pointer row-hover">
                          <td data-label="Employee Info">
                            <div className="d-flex align-items-center gap-3">
                              <div className="hq-avatar-mini" style={{ width: "42px", height: "42px", borderRadius: "50%", overflow: "hidden", border: "2px solid var(--e-border)", backgroundColor: "rgba(99, 102, 241, 0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                {emp.profilePic ? (
                                  <img src={`${import.meta.env.VITE_API_URL}/static/${emp.profilePic}`} alt={emp.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                ) : (
                                  <span style={{ fontWeight: "700", color: "var(--e-primary)" }}>{emp.name?.charAt(0).toUpperCase()}</span>
                                )}
                              </div>
                              <div>
                                <div className="hq-td-emp-name dynamic-text-color fw-bold">{emp.name}</div>
                                <div className="small text-muted">{emp.email}</div>
                              </div>
                            </div>
                          </td>
                          <td data-label="Location / Dept">
                            <div className="fw-bold dynamic-text-color">{emp.branchId?.name || "N/A"}</div>
                            <div className="small text-muted mt-1">{emp.departmentId?.name || "N/A"}</div>
                          </td>
                          <td data-label="Role & Shift">
                            <div className="badge bg-light text-primary border border-primary-subtle px-2 py-1 mb-1 fw-bold hq-badge-custom">{emp.designationId?.name || "N/A"}</div>
                            <div className="small text-muted d-block mt-1">{emp.shiftId?.name || "N/A"}</div>
                          </td>
                          <td data-label="Actions" className="text-end pe-lg-4 mobile-action-left">
                            <div className="hq-action-stack justify-content-end" onClick={(e) => e.stopPropagation()}>
                              {canManageAuthority && (
                                <button
                                  className="hq-action-btn authority tooltip-wrap"
                                  title="Manage Permissions"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    // ✅ DIRECT NAVIGATE TO NEW AUTHORITY PAGE WITH EMPLOYEE DATA
                                    navigate(`/admin/authority`, { state: { employee: emp } });
                                  }}
                                >
                                  <FaShieldAlt />
                                </button>
                              )}
                              <button className="hq-action-btn view" title="View Profile" onClick={() => navigate(`/admin/employee/${emp._id}`, { state: emp })}><FaEye /></button>
                              <button className="hq-action-btn edit" title="Edit Profile" onClick={(e) => { e.stopPropagation(); navigate(`/admin/create-employee`, { state: { employeeToEdit: emp } }); }}><FaEdit /></button>
                              {canDelete && <button className="hq-action-btn delete" title="Remove" onClick={(e) => handleDelete(e, emp._id)}><FaTrash /></button>}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </DynamicLayout>
  );
};

export default EmployeeManagement;