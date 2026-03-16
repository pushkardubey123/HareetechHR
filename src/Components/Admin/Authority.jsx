import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaTimes, FaShieldAlt, FaSave } from "react-icons/fa";

const AuthorityModal = ({ show, onClose }) => {
  // --- DROPDOWN STATES ---
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState("");

  const [departments, setDepartments] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState("");

  const [designations, setDesignations] = useState([]);
  const [selectedDesignation, setSelectedDesignation] = useState("");

  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState("");

  // --- PERMISSION STATES ---
  const [permissions, setPermissions] = useState({});
  const [loading, setLoading] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL;
  const token = JSON.parse(localStorage.getItem("user"))?.token;

  const modulesList = [
    "staff_verification", 
    "employee_management", 
    "attendance", "payroll", "project", 
    "recruitment", "meeting", "document", "event", 
    "exit", "notification", "wfh", "department", 
    "branch", "designation", "shift", "reports", 
    "bday", "lms", "settings",
    "leave_requests",
    "asset_management",
    "leave_types", 
    "leave_policies", 
    "holidays"
  ];

  // 1. Fetch Branches
  useEffect(() => {
    if (!show || !token) return;
    const fetchBranches = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/branch`, { headers: { Authorization: `Bearer ${token}` } });
        if (res.data.success) setBranches(res.data.data);
      } catch (error) { console.error(error); }
    };
    fetchBranches();
  }, [show, token, API_URL]);

  // 2. Fetch Departments
  useEffect(() => {
    setDepartments([]); setSelectedDepartment("");
    setDesignations([]); setSelectedDesignation("");
    setEmployees([]); setSelectedEmployee("");
    setPermissions({}); 

    if (!selectedBranch) return;
    const fetchDepartments = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/departments?branchId=${selectedBranch}`, { headers: { Authorization: `Bearer ${token}` } });
        if (res.data.success) setDepartments(res.data.data);
      } catch (error) {}
    };
    fetchDepartments();
  }, [selectedBranch, token, API_URL]);

  // 3. Fetch Designations
  useEffect(() => {
    setDesignations([]); setSelectedDesignation("");
    setEmployees([]); setSelectedEmployee("");
    setPermissions({});

    if (!selectedDepartment) return;
    const fetchDesignations = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/designations?branchId=${selectedBranch}&departmentId=${selectedDepartment}`, { headers: { Authorization: `Bearer ${token}` } });
        if (res.data.success) setDesignations(res.data.data);
      } catch (error) {}
    };
    fetchDesignations();
  }, [selectedDepartment, selectedBranch, token, API_URL]);

  // 4. Fetch Employees
  useEffect(() => {
    setEmployees([]); setSelectedEmployee("");
    setPermissions({});

    if (!selectedDesignation) return;
    const fetchEmployees = async () => {
      try {
        const res = await axios.get(`${API_URL}/user?branchId=${selectedBranch}&designationId=${selectedDesignation}`, { headers: { Authorization: `Bearer ${token}` } });
        if (res.data.success) setEmployees(res.data.data);
      } catch (error) {}
    };
    fetchEmployees();
  }, [selectedDesignation, selectedBranch, token, API_URL]);

  // 5. Fetch Permissions for Employee
  useEffect(() => {
    if (!selectedEmployee) return;
    
    const fetchPermissions = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/permission/${selectedEmployee}`, { headers: { Authorization: `Bearer ${token}` } });
        const permState = {};
        modulesList.forEach(mod => {
          permState[mod] = { view: false, create: false, edit: false, delete: false };
        });

        if (res.data.success && res.data.data) {
          res.data.data.forEach(p => { 
             permState[p.module] = { ...permState[p.module], ...p.permissions }; 
          });
        }
        setPermissions(permState);
      } catch (error) {
        console.error("Error fetching permissions:", error);
      }
    };
    fetchPermissions();
  }, [selectedEmployee, token, API_URL]);

  const handleCheckboxChange = (module, action) => {
    setPermissions(prev => ({
      ...prev,
      [module]: {
        ...prev[module],
        [action]: !prev[module][action]
      }
    }));
  };

  const savePermissions = async (mod) => {
    if (!selectedEmployee) return;
    try {
      const payload = {
        employeeId: selectedEmployee,
        module: mod,
        permissions: permissions[mod]
      };
      await axios.post(`${API_URL}/api/permission/set`, payload, { headers: { Authorization: `Bearer ${token}` } });
    } catch (error) {
      console.error(`Error saving permission for ${mod}`);
    }
  };

  const saveAllPermissions = async () => {
    if (!selectedEmployee) return alert("Please select an Employee first!");
    setLoading(true);
    try {
      const savePromises = modulesList.map(mod => savePermissions(mod));
      await Promise.all(savePromises);
      alert("Permissions saved successfully!");
      onClose();
    } catch (error) {
      alert("Something went wrong while saving permissions.");
    } finally {
      setLoading(false);
    }
  };

  if (!show) return null;

  return (
    <div className="hq-modal-overlay" onClick={onClose}>
      <div className="hq-modal-container" style={{ maxWidth: '900px', height: 'auto', maxHeight: '90vh', flexDirection: 'column' }} onClick={(e) => e.stopPropagation()}>
        
        <div className="hq-modal-header-row" style={{ padding: '20px 24px', borderBottom: '1px solid var(--e-border)', margin: 0, background: 'var(--e-modal-side)' }}>
          <h4 className="hq-main-title d-flex align-items-center">
            <FaShieldAlt className="me-2 text-primary" /> Authority Management
          </h4>
          <button type="button" className="hq-close-btn" onClick={onClose}><FaTimes /></button>
        </div>

        <div style={{ padding: '24px', overflowY: 'auto' }}>
          <div className="hq-row">
            <div className="hq-col-6">
              <label className="hq-label">1. Branch</label>
              <select className="hq-select" value={selectedBranch} onChange={(e) => setSelectedBranch(e.target.value)}>
                <option value="">-- Select Branch --</option>
                {branches.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
              </select>
            </div>
            <div className="hq-col-6">
              <label className="hq-label">2. Department</label>
              <select className="hq-select" value={selectedDepartment} onChange={(e) => setSelectedDepartment(e.target.value)} disabled={!selectedBranch}>
                <option value="">-- Select Department --</option>
                {departments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
              </select>
            </div>
            <div className="hq-col-6 mt-3">
              <label className="hq-label">3. Designation</label>
              <select className="hq-select" value={selectedDesignation} onChange={(e) => setSelectedDesignation(e.target.value)} disabled={!selectedDepartment}>
                <option value="">-- Select Designation --</option>
                {designations.map(desig => <option key={desig._id} value={desig._id}>{desig.name}</option>)}
              </select>
            </div>
            <div className="hq-col-6 mt-3">
              <label className="hq-label text-primary">4. Target Employee</label>
              <select className="hq-select" style={{ borderColor: 'var(--e-primary)' }} value={selectedEmployee} onChange={(e) => setSelectedEmployee(e.target.value)} disabled={!selectedDesignation}>
                <option value="">-- Select Employee --</option>
                {employees.map(emp => <option key={emp._id} value={emp._id}>{emp.name}</option>)}
              </select>
            </div>
          </div>

          {selectedEmployee && (
            <div className="mt-4 animate__animated animate__fadeIn">
              <div className="hq-form-divider"><FaShieldAlt /> Modules & Permissions</div>
              <div className="hq-table-responsive" style={{ border: '1px solid var(--e-border)', borderRadius: '12px' }}>
                <table className="hq-premium-table">
                  <thead>
                    <tr>
                      <th>Module Name</th>
                      <th className="text-center">View</th>
                      <th className="text-center">Create</th>
                      <th className="text-center">Edit </th>
                      <th className="text-center">Delete</th>
                    </tr>
                  </thead>
                  <tbody>
                    {modulesList.map((mod) => (
                      <tr key={mod}>
                        <td className="fw-bold text-capitalize">{mod.replace(/_/g, ' ')}</td>
                        {['view', 'create', 'edit', 'delete'].map((action) => {
                          
                          // ✅ staff_verification mein sirf "Create" hide hoga. 
                          // Edit checkbox rahega taaki Admin "Approve" ki power de sake.
                          if (mod === "staff_verification" && action === "create") {
                              return <td key={action} className="text-center text-muted" style={{fontSize: '10px'}}>-</td>;
                          }

                          return (
                            <td key={action} className="text-center">
                              <input 
                                type="checkbox" 
                                style={{ width: "16px", height: "16px", cursor: "pointer" }}
                                checked={permissions[mod]?.[action] || false}
                                onChange={() => handleCheckboxChange(mod, action)}
                              />
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="hq-modal-footer" style={{ padding: '20px 24px', marginTop: 0 }}>
          <button type="button" className="hq-btn-cancel" onClick={onClose}>Cancel</button>
          <button type="button" className="hq-submit-btn-v2 d-flex align-items-center" onClick={saveAllPermissions} disabled={loading || !selectedEmployee}>
            <FaSave className="me-2" /> {loading ? "Saving..." : "Save Permissions"}
          </button>
        </div>

      </div>
    </div>
  );
};

export default AuthorityModal;