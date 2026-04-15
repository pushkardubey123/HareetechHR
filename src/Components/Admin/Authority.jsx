import React, { useState, useEffect } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import { FaShieldAlt, FaSave, FaArrowLeft, FaUserLock } from "react-icons/fa";
import { toast } from "react-toastify";
import DynamicLayout from "../Common/DynamicLayout";
import "./AdminEmployeeManagement.css";

const Authority = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const employee = location.state?.employee || null;

  const [permissions, setPermissions] = useState({});
  const [adminPlanModules, setAdminPlanModules] = useState([]);
  const [loading, setLoading] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL;
  const token = JSON.parse(localStorage.getItem("user"))?.token;

  // ✅ ADDED "helpdesk" AT THE END
  const allModulesList = [
    "staff_verification", "employee_management", "attendance", "payroll", "project", 
    "recruitment", "meeting", "document", "event", "exit", "notification", "wfh", 
    "department", "branch", "designation", "shift", "reports", "bday", "lms", "settings",
    "leave_requests", "asset_management", "leave_types", "leave_policies", "holidays", "helpdesk"
  ];

  const moduleMapping = {
    "staff_verification": "Always", "employee_management": "Always", "department": "Always",
    "branch": "Always", "designation": "Always", "settings": "Always",
    "attendance": "Attendance", "shift": "Attendance",
    "payroll": "Payroll", "reports": "Payroll", 
    "leave_requests": "Leave Management", "leave_types": "Leave Management", 
    "leave_policies": "Leave Management", "holidays": "Leave Management",
    "recruitment": "Recruitment (ATS)",
    "asset_management": "Asset Management",
    "project": "Project Management",
    "meeting": "Meeting",
    "event": "Events", 
    "bday": "Birthdays & Anniversaries", 
    "notification": "Notification",
    "lms": "LMS (KPIs)",
    "document": "Documents",
    "wfh": "WFH Requests",
    "exit": "Exit Management",
    "helpdesk": "helpdesk" // 🔥 MAPPED TO SAAS PLAN NAME
  };

  useEffect(() => {
    if (!employee) {
      toast.error("Please select an employee first!");
      navigate("/admin/employee-management");
    }
  }, [employee, navigate]);

  useEffect(() => {
    if (!token || !employee) return;

    const fetchInitialData = async () => {
      try {
        const subRes = await axios.get(`${API_URL}/user/my-subscription`, { headers: { Authorization: `Bearer ${token}` } });
        if (subRes.data.success && subRes.data.data?.planId) {
          setAdminPlanModules(subRes.data.data.planId.allowedModules || []);
        }
      } catch (error) { console.error(error); }
    };
    fetchInitialData();
  }, [token, API_URL, employee]);

  useEffect(() => {
    if (!employee?._id) return;
    const fetchPermissions = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/permission/${employee._id}`, { headers: { Authorization: `Bearer ${token}` } });
        const permState = {};
        allModulesList.forEach(mod => {
          permState[mod] = { view: false, create: false, edit: false, delete: false };
        });
        if (res.data.success && res.data.data) {
          res.data.data.forEach(p => { 
             permState[p.module] = { ...permState[p.module], ...p.permissions }; 
          });
        }
        setPermissions(permState);
      } catch (error) { console.error("Error fetching permissions:", error); }
    };
    fetchPermissions();
  }, [employee, token, API_URL]);

  const handleCheckboxChange = (module, action) => {
    setPermissions(prev => ({
      ...prev,
      [module]: {
        ...prev[module],
        [action]: !prev[module][action]
      }
    }));
  };

  const visibleModules = allModulesList.filter(mod => {
    const requiredPlanModule = moduleMapping[mod];
    if (requiredPlanModule === "Always") return true;
    return adminPlanModules.includes(requiredPlanModule);
  });

  const savePermissions = async (mod) => {
    try {
      const payload = { employeeId: employee._id, module: mod, permissions: permissions[mod] };
      await axios.post(`${API_URL}/api/permission/set`, payload, { headers: { Authorization: `Bearer ${token}` } });
    } catch (error) { console.error(`Error saving permission for ${mod}`); }
  };

  const saveAllPermissions = async () => {
    if (!employee?._id) return;
    setLoading(true);
    try {
      const savePromises = visibleModules.map(mod => savePermissions(mod));
      await Promise.all(savePromises);
      toast.success(`Permissions assigned successfully for ${employee.name}!`);
      navigate(-1); 
    } catch (error) {
      toast.error("Something went wrong while saving permissions.");
    } finally {
      setLoading(false);
    }
  };

  if (!employee) return null;

  return (
    <DynamicLayout>
      <div className="hq-extreme-wrapper">
        <div className="container-fluid p-0">
          
          <div className="hq-mgmt-header fade-in-down">
            <div className="hq-header-left">
              <button className="hq-secondary-btn-premium hover-lift me-3" onClick={() => navigate(-1)}>
                <FaArrowLeft />
              </button>
              <div className="hq-icon-badge glass-icon" style={{ background: '#f59e0b' }}>
                <FaUserLock />
              </div>
              <div>
                <h2 className="hq-main-title dynamic-text-color">Authority Assignment</h2>
                <p className="hq-sub-title">Configure module access for <strong className="text-primary">{employee.name}</strong></p>
              </div>
            </div>

            <div className="hq-header-actions">
               <button 
                type="button" 
                className="hq-add-btn-premium hover-lift glow-effect d-flex align-items-center" 
                onClick={saveAllPermissions} 
                disabled={loading}
              >
                <FaSave className="me-2" /> {loading ? "Saving..." : "Save Configuration"}
              </button>
            </div>
          </div>

          <div className="hq-table-card-main fade-in-up p-4">
            <h5 className="mb-4 dynamic-text-color d-flex align-items-center">
               <FaShieldAlt className="me-2 text-primary" /> Active Plan Modules
            </h5>
            
            <div className="hq-table-responsive-box" style={{ border: '1px solid var(--e-border)', borderRadius: '12px' }}>
              <table className="table hq-premium-table m-0">
                <thead>
                  <tr>
                    <th>Module Identity</th>
                    <th className="text-center">View Access</th>
                    <th className="text-center">Create Access</th>
                    <th className="text-center">Edit Access</th>
                    <th className="text-center">Delete Access</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleModules.map((mod) => (
                    <tr key={mod} className="row-hover">
                      <td className="fw-bold text-capitalize" style={{ color: "var(--e-text)" }}>
                        {mod.replace(/_/g, ' ')}
                      </td>
                      {['view', 'create', 'edit', 'delete'].map((action) => {
                        if (mod === "staff_verification" && action === "create") {
                            return <td key={action} className="text-center text-muted" style={{fontSize: '12px'}}>-</td>;
                        }
                        return (
                          <td key={action} className="text-center">
                            <label className="d-flex justify-content-center align-items-center w-100 h-100 m-0" style={{cursor: 'pointer'}}>
                                <input 
                                  type="checkbox" 
                                  style={{ width: "20px", height: "20px", accentColor: "var(--e-primary)", cursor: "pointer" }}
                                  checked={permissions[mod]?.[action] || false}
                                  onChange={() => handleCheckboxChange(mod, action)}
                                />
                            </label>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </DynamicLayout>
  );
};

export default Authority;