import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import DynamicLayout from "../Common/DynamicLayout";
import AuthorityModal from "./Authority";
import {
  FaTrash,
  FaUserPlus,
  FaEye,
  FaShieldAlt,
  FaUsers,
  FaEdit,
} from "react-icons/fa";
import Loader from "./Loader/Loader";
import { useNavigate } from "react-router-dom";
import "./AdminEmployeeManagement.css";

const EmployeeManagement = () => {
  const [employees, setEmployees] = useState([]);
  const [showAuthorityModal, setShowAuthorityModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // ✅ USER & PERMISSION LOGIC
  const userStr = localStorage.getItem("user");
  const userObj = userStr ? JSON.parse(userStr) : null;
  const token = userObj?.token;
  const role = userObj?.role;
  const isAdmin = role === "admin";

  const [perms, setPerms] = useState({
    view: false,
    create: false,
    edit: false,
    delete: false,
  });

  useEffect(() => {
    const fetchPerms = async () => {
      if (isAdmin || !token) return;
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/my-modules`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (res.data.detailed?.employee_management) {
          setPerms(res.data.detailed.employee_management);
        }
      } catch (e) {
        console.error("Permission fetch failed", e);
      }
    };
    fetchPerms();
  }, [token, isAdmin]);

  const getHeaders = () => ({ headers: { Authorization: `Bearer ${token}` } });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const empRes = await axios.get(
        `${import.meta.env.VITE_API_URL}/user`,
        getHeaders()
      );
      setEmployees((empRes.data.data || []).reverse());
    } catch (err) {
      toast.error("Failed to fetch employee data");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (window.confirm("Delete Employee? This action cannot be undone.")) {
      try {
        await axios.delete(
          `${import.meta.env.VITE_API_URL}/employeedelete/${id}`,
          getHeaders()
        );
        fetchData();
        toast.success("Employee has been removed.");
      } catch (err) {
        toast.error("Delete failed. Please try again.");
      }
    }
  };

  const canCreate = isAdmin || perms.create;
  const canDelete = isAdmin || perms.delete;
  const canManageAuthority = isAdmin;

  return (
    <DynamicLayout>
      <div className="hq-extreme-wrapper">
        <div className="container-fluid p-0">
          
          {/* HEADER SECTION */}
          <div className="hq-mgmt-header fade-in-down">
            <div className="hq-header-left">
              <div className="hq-icon-badge glass-icon">
                <FaUsers />
              </div>
              <div>
                <h2 className="hq-main-title dynamic-text-color">Staff Directory</h2>
                <p className="hq-sub-title">
                  Manage access, roles, and profiles of your organization
                </p>
              </div>
            </div>

            {/* BUTTONS FIXED FOR DESKTOP RIGHT ALIGNMENT */}
            <div className="hq-header-actions">
              {canManageAuthority && (
                <button
                  className="hq-secondary-btn-premium hover-lift"
                  onClick={() => setShowAuthorityModal(true)}
                >
                  <FaShieldAlt /> <span>Manage Authority</span>
                </button>
              )}
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

          {/* TABLE SECTION */}
          <div className="hq-table-card-main fade-in-up">
            {loading ? (
              <div className="p-5">
                <Loader />
              </div>
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
                    {employees.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="text-center py-5 text-muted fw-bold">
                          No employees found. Start onboarding!
                        </td>
                      </tr>
                    ) : (
                      employees.map((emp) => (
                        <tr
                          key={emp._id}
                          onClick={() =>
                            navigate(`/admin/employee/${emp._id}`, {
                              state: emp,
                            })
                          }
                          className="cursor-pointer row-hover"
                        >
                          {/* Col 1 */}
                          <td data-label="Employee Info">
                            <div className="d-flex align-items-center gap-3">
                              {/* PROFILE PICTURE LOGIC */}
                              <div 
                                className="hq-avatar-mini d-flex align-items-center justify-content-center flex-shrink-0" 
                                style={{ 
                                  width: "42px", 
                                  height: "42px", 
                                  minWidth: "42px",
                                  borderRadius: "50%", 
                                  overflow: "hidden",
                                  border: "2px solid var(--e-border)",
                                  backgroundColor: "rgba(99, 102, 241, 0.1)"
                                }}
                              >
                                {emp.profilePic ? (
                                  <img 
                                    src={`${import.meta.env.VITE_API_URL}/static/${emp.profilePic}`} 
                                    alt={emp.name} 
                                    style={{ width: "42px", height: "42px", objectFit: "cover", borderRadius: "50%" }}
                                    onError={(e) => { 
                                      e.target.style.display = 'none'; 
                                      e.target.parentNode.innerHTML = `<span style="font-weight: 700; color: var(--e-primary); font-size: 16px;">${emp.name?.charAt(0).toUpperCase()}</span>`; 
                                    }}
                                  />
                                ) : (
                                  <span style={{ fontWeight: "700", color: "var(--e-primary)", fontSize: "16px" }}>
                                    {emp.name?.charAt(0).toUpperCase()}
                                  </span>
                                )}
                              </div>
                              <div>
                                <div className="hq-td-emp-name dynamic-text-color fw-bold">{emp.name}</div>
                                <div className="small text-muted">
                                  {emp.email}
                                </div>
                              </div>
                            </div>
                          </td>
                          
                          {/* Col 2 */}
                          <td data-label="Location / Dept">
                            <div className="fw-bold dynamic-text-color">
                              {emp.branchId?.name || "N/A"}
                            </div>
                            <div className="small text-muted mt-1">
                              {emp.departmentId?.name || "N/A"}
                            </div>
                          </td>

                          {/* Col 3 */}
                          <td data-label="Role & Shift">
                            <div className="badge bg-light text-primary border border-primary-subtle px-2 py-1 mb-1 fw-bold hq-badge-custom">
                              {emp.designationId?.name || "N/A"}
                            </div>
                            <div className="small text-muted d-block mt-1">
                              {emp.shiftId?.name || "N/A"}
                            </div>
                          </td>

                          {/* Col 4 */}
                          <td data-label="Actions" className="text-end pe-lg-4 mobile-action-left">
                            <div
                              className="hq-action-stack justify-content-end"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                className="hq-action-btn view tooltip-wrap"
                                title="View Profile"
                                onClick={() =>
                                  navigate(`/admin/employee/${emp._id}`, {
                                    state: emp,
                                  })
                                }
                              >
                                <FaEye />
                              </button>
                              <button
                                className="hq-action-btn edit tooltip-wrap"
                                title="Edit Profile"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/admin/create-employee`, {
                                    state: { employeeToEdit: emp },
                                  });
                                }}
                              >
                                <FaEdit />
                              </button>
                              {canDelete && (
                                <button
                                  className="hq-action-btn delete tooltip-wrap"
                                  title="Remove"
                                  onClick={(e) => handleDelete(e, emp._id)}
                                >
                                  <FaTrash />
                                </button>
                              )}
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

        <AuthorityModal
          show={showAuthorityModal}
          onClose={() => setShowAuthorityModal(false)}
        />
      </div>
    </DynamicLayout>
  );
};

export default EmployeeManagement;