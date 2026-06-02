import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import DynamicLayout from "../Common/DynamicLayout";
import axios from "axios";
import Swal from "sweetalert2";
import { 
    FaCalendarAlt, FaTasks, FaMoneyBillWave, FaFileInvoice, 
    FaArrowLeft, FaDownload, FaCloudUploadAlt, FaEye, FaHome, FaShieldAlt, 
    FaClock, FaUniversity, FaBriefcase, FaTimes, FaPhoneAlt, FaEnvelope, 
    FaMapMarkerAlt, FaBirthdayCake, FaIdBadge, FaFolderOpen
} from "react-icons/fa";
import { generateSalarySlipPDF } from "./generateSalarySlipPDF"; 
import TableLoader from "./Loader/Loader"; 
import "./EmployeeProfile.css";

const EmployeeProfile = () => {
    const navigate = useNavigate();
    const { state: initialEmployee } = useLocation(); 
    
    // --- STATE ---
    const [employee, setEmployee] = useState(initialEmployee || null); 
    const [loading, setLoading] = useState(true); 
    const [data, setData] = useState({
        leaves: [], attendance: [], tasks: [], payrolls: [], documents: [], wfh: []
    });

    const [activeTab, setActiveTab] = useState("attendance"); 

    // Document Upload States
    const [docType, setDocType] = useState("");
    const [customDocType, setCustomDocType] = useState("");
    const [uploadFile, setUploadFile] = useState(null);

    // ✅ PERMISSION LOGIC
    const userStr = localStorage.getItem("user");
    const userObj = userStr ? JSON.parse(userStr) : null;
    const token = userObj?.token;
    const isAdmin = userObj?.role === "admin";
    const [perms, setPerms] = useState({ view: false, create: false, edit: false, delete: false });

    const api = axios.create({
        baseURL: import.meta.env.VITE_API_URL,
        headers: { Authorization: `Bearer ${token}` }
    });

    useEffect(() => {
      const fetchPerms = async () => {
        if (isAdmin || !token) return;
        try {
          const res = await api.get(`/api/my-modules`);
          if (res.data.detailed?.staff) {
            setPerms(res.data.detailed.staff);
          }
        } catch (e) {
          console.error("Permission fetch failed", e);
        }
      };
      fetchPerms();
    }, [token, isAdmin]);

    const fetchFullProfile = async () => {
        const empId = initialEmployee?._id || window.location.pathname.split("/").pop();
        if (!empId) {
            setLoading(false);
            return;
        }
        try {
            setLoading(true); 
            const empRes = await api.get(`/employeeget/${empId}`);
            if (empRes.data.success) setEmployee(empRes.data.data);

            const [leavesRes, attRes, projRes, payrollRes, docsRes, wfhRes] = await Promise.all([
                api.get(`/api/leaves/employee/${empId}`).catch(() => ({ data: { data: [] } })),
                api.get(`/api/attendance/employee/${empId}`).catch(() => ({ data: { data: [] } })),
                api.get(`/api/projects`).catch(() => ({ data: { data: [] } })),
                api.get(`/api/payrolls/employee/${empId}`).catch(() => ({ data: { data: [] } })),
                api.get(`/api/documents/${empId}`).catch(() => ({ data: { data: [] } })),
                api.get(`/api/wfh/all`).catch(() => ({ data: { data: [] } }))
            ]);

            const employeeWFH = (wfhRes.data.data || []).filter(item => 
                (item.userId?._id || item.userId) === empId
            );

            setData({
                leaves: leavesRes.data.data || [],
                attendance: attRes.data.data || [],
                payrolls: payrollRes.data.data || [],
                documents: docsRes.data.data || [],
                wfh: employeeWFH
            });
        } catch (error) { 
            console.error("Error fetching data:", error); 
        } finally {
            setLoading(false); 
        }
    };

    useEffect(() => { 
        fetchFullProfile(); 
    }, [initialEmployee?._id]);

    const handleUpload = async () => {
        const finalDocType = docType === "Others" ? customDocType.trim() : docType;

        if (!uploadFile || !finalDocType) return Swal.fire("Error", "Select file & type", "error");
        
        const formData = new FormData();
        formData.append("employeeId", employee?._id);
        formData.append("documentType", finalDocType);
        formData.append("file", uploadFile);
        
        try {
            await api.post("/api/documents/upload", formData);
            Swal.fire({ title: "Success", text: "Uploaded successfully!", icon: "success", timer: 1500, showConfirmButton: false });
            
            setDocType("");
            setCustomDocType("");
            setUploadFile(null);
            document.getElementById("hr-file-upload").value = "";

            fetchFullProfile();
        } catch { Swal.fire("Error", "Upload failed", "error"); }
    };

    if (loading) {
        return (
            <DynamicLayout>
                <div className="hr-loader-wrapper"><TableLoader /></div>
            </DynamicLayout>
        );
    }

    if (!employee) {
        return (
            <DynamicLayout>
                <div className="hr-empty-box"><h3>Employee Record Unavailable</h3></div>
            </DynamicLayout>
        );
    }

    const emergency = typeof employee.emergencyContact === 'string' 
        ? JSON.parse(employee.emergencyContact || '{}') 
        : (employee.emergencyContact || {});

    const canEdit = isAdmin || perms.edit;
    const isUploadDisabled = !uploadFile || !docType || (docType === "Others" && !customDocType.trim());

    return (
        <DynamicLayout>
            <div className="hr-profile-master">
                
                {/* Header / Actions */}
                <div className="hr-page-header">
                    <button className="hr-btn-text" onClick={() => navigate(-1)}>
                        <FaArrowLeft className="me-2"/> Directory
                    </button>
                    <div className="hr-page-actions">
                        {/* Space for future buttons like Edit Profile, Disable User etc. */}
                    </div>
                </div>

                {/* Cover & Top Banner */}
                <div className="hr-cover-card">
                    <div className="hr-cover-bg"></div>
                    <div className="hr-cover-content">
                        <img 
                            src={employee.profilePic ? `${import.meta.env.VITE_API_URL}/static/${employee.profilePic}` : "https://ui-avatars.com/api/?name=" + employee.name} 
                            className="hr-avatar-main" alt="Employee"
                        />
                        <div className="hr-basic-info">
                            <div className="d-flex align-items-center gap-3">
                                <h1 className="hr-emp-name">{employee.name}</h1>
                                <span className="hr-status-badge active">Active</span>
                            </div>
                            <p className="hr-emp-designation">
                                <FaBriefcase className="me-2 opacity-75"/>
                                {employee.designationId?.name || "N/A"} • {employee.departmentId?.name || "N/A"}
                            </p>
                            <p className="hr-emp-id">
                                <FaIdBadge className="me-2 opacity-75"/> EMP-{employee._id?.slice(-6).toUpperCase() || "---"}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Main Content Grid (Sidebar + Tabs) */}
                <div className="hr-layout-grid">
                    
                    {/* Left Sidebar - Quick Info & Accent Cards */}
                    <div className="hr-sidebar-col">
                        
                        <div className="hr-card hr-info-card">
                            <h3 className="hr-card-title">Personal Information</h3>
                            <ul className="hr-info-list">
                                <li><FaEnvelope className="hr-info-icon"/> <span>{employee.email}</span></li>
                                <li><FaPhoneAlt className="hr-info-icon"/> <span>{employee.phone || "---"}</span></li>
                                <li><FaBirthdayCake className="hr-info-icon"/> <span>{employee.dob ? new Date(employee.dob).toLocaleDateString('en-GB') : "---"}</span></li>
                                <li><FaMapMarkerAlt className="hr-info-icon"/> <span>{employee.address || "---"}</span></li>
                                <li><FaCalendarAlt className="hr-info-icon"/> <span>Joined: {employee.doj ? new Date(employee.doj).toLocaleDateString('en-GB') : "---"}</span></li>
                            </ul>
                        </div>

                        <div className="hr-card hr-accent-danger">
                            <div className="hr-accent-header">
                                <div className="hr-accent-icon"><FaShieldAlt/></div>
                                <h3 className="hr-card-title m-0">Emergency Contact</h3>
                            </div>
                            <div className="hr-accent-body">
                                <DataPair label="Contact Name" value={emergency.name} />
                                <DataPair label="Relationship" value={emergency.relation} />
                                <DataPair label="Phone Number" value={emergency.phone} />
                            </div>
                        </div>

                        <div className="hr-card hr-accent-success">
                            <div className="hr-accent-header">
                                <div className="hr-accent-icon"><FaUniversity/></div>
                                <h3 className="hr-card-title m-0">Financial Records</h3>
                            </div>
                            <div className="hr-accent-body">
                                <DataPair label="Base Salary" value={`₹ ${employee.basicSalary || 0}`} />
                                <DataPair label="PAN Number" value={employee.pan} />
                                <DataPair label="Bank A/C" value={employee.bankAccount} />
                            </div>
                        </div>

                    </div>

                    {/* Right Content - Enterprise Tabs */}
                    <div className="hr-content-col">
                        <div className="hr-card hr-tabs-card">
                            
                            <div className="hr-tab-header">
                                <button className={`hr-tab-btn ${activeTab === 'attendance' ? 'active' : ''}`} onClick={() => setActiveTab('attendance')}>
                                    <FaClock className="me-2"/> Attendance
                                </button>
                                <button className={`hr-tab-btn ${activeTab === 'wfh' ? 'active' : ''}`} onClick={() => setActiveTab('wfh')}>
                                    <FaHome className="me-2"/> WFH Logs
                                </button>
                                <button className={`hr-tab-btn ${activeTab === 'leaves' ? 'active' : ''}`} onClick={() => setActiveTab('leaves')}>
                                    <FaFileInvoice className="me-2"/> Leaves
                                </button>
                                <button className={`hr-tab-btn ${activeTab === 'payroll' ? 'active' : ''}`} onClick={() => setActiveTab('payroll')}>
                                    <FaMoneyBillWave className="me-2"/> Payroll
                                </button>
                                <button className={`hr-tab-btn ${activeTab === 'docs' ? 'active' : ''}`} onClick={() => setActiveTab('docs')}>
                                    <FaFolderOpen className="me-2"/> Documents
                                </button>
                            </div>

                            <div className="hr-tab-body">
                                
                                {/* 1. ATTENDANCE */}
                                {activeTab === 'attendance' && (
                                    <div className="hr-table-responsive">
                                        <table className="hr-table"> 
                                            <thead><tr><th>Date</th><th>Clock-In</th><th>Status</th></tr></thead>
                                            <tbody>
                                                {data.attendance.length > 0 ? data.attendance.slice(0, 10).map((a, i) => (
                                                    <tr key={i}>
                                                        <td>{new Date(a.date).toLocaleDateString('en-GB', {day: '2-digit', month: 'short', year:'numeric'})}</td>
                                                        <td className="fw-medium">{a.inTime || '--:--'}</td>
                                                        <td>
                                                            <span className={`hr-status-pill ${a.status === 'Present' ? 'success' : 'danger'}`}>
                                                                {a.status}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                )) : <tr><td colSpan="3" className="hr-empty-table">No attendance records found.</td></tr>}
                                            </tbody>
                                        </table>
                                    </div>
                                )}

                                {/* 2. WFH */}
                                {activeTab === 'wfh' && (
                                    <div className="hr-table-responsive">
                                        <table className="hr-table">
                                            <thead><tr><th>Period</th><th>Reason</th><th>Status</th></tr></thead>
                                            <tbody>
                                                {data.wfh.length > 0 ? data.wfh.map((w, i) => (
                                                    <tr key={i}>
                                                        <td>{new Date(w.fromDate).toLocaleDateString('en-GB')} - {new Date(w.toDate).toLocaleDateString('en-GB')}</td>
                                                        <td>{w.reason}</td>
                                                        <td>
                                                            <span className={`hr-status-pill ${w.status === 'approved' ? 'success' : 'warning'}`}>
                                                                {w.status.charAt(0).toUpperCase() + w.status.slice(1)}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                )) : <tr><td colSpan="3" className="hr-empty-table">No remote work logs available.</td></tr>}
                                            </tbody>
                                        </table>
                                    </div>
                                )}

                                {/* 3. LEAVES */}
                                {activeTab === 'leaves' && (
                                    <div className="hr-table-responsive">
                                         <table className="hr-table">
                                            <thead><tr><th>Leave Type</th><th>Duration</th><th>Status</th></tr></thead>
                                            <tbody>
                                                {data.leaves.length > 0 ? data.leaves.map((l, i) => (
                                                    <tr key={i}>
                                                        <td className="fw-medium text-dark">{l.leaveType}</td>
                                                        <td>{l.startDate?.slice(0,10)} <span className="text-muted mx-1">to</span> {l.endDate?.slice(0,10)}</td>
                                                        <td>
                                                            <span className={`hr-status-pill ${l.status === 'Approved' ? 'success' : 'warning'}`}>
                                                                {l.status}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                )) : <tr><td colSpan="3" className="hr-empty-table">No leave applications found.</td></tr>}
                                            </tbody>
                                        </table>
                                    </div>
                                )}

                                {/* 4. PAYROLL */}
                                {activeTab === 'payroll' && (
                                    <div className="hr-table-responsive">
                                        <table className="hr-table">
                                            <thead><tr><th>Month & Year</th><th>Net Salary</th><th className="text-right">Action</th></tr></thead>
                                            <tbody>
                                                {data.payrolls.length > 0 ? data.payrolls.map((p, i) => (
                                                    <tr key={i}>
                                                        <td className="fw-medium">{p.month}</td>
                                                        <td className="hr-text-success fw-bold">₹{p.netSalary}</td>
                                                        <td className="text-right">
                                                            <button className="hr-btn-icon" onClick={() => generateSalarySlipPDF(p)} title="Download Payslip">
                                                                <FaDownload/>
                                                            </button>
                                                        </td>
                                                    </tr>
                                                )) : <tr><td colSpan="3" className="hr-empty-table">No payroll processing data found.</td></tr>}
                                            </tbody>
                                        </table>
                                    </div>
                                )}

                                {/* 5. DOCUMENTS */}
                                {activeTab === 'docs' && (
                                    <div className="hr-docs-wrapper">
                                        
                                        {/* Upload Form - Enterprise Style */}
                                        {canEdit && (
                                            <div className="hr-upload-box">
                                                <h4 className="hr-upload-title"><FaCloudUploadAlt className="me-2"/> Secure Vault Upload</h4>
                                                
                                                <div className="hr-form-grid">
                                                    <div className="hr-form-group">
                                                        <label>Document Classification</label>
                                                        <select 
                                                            className="hr-input-field" 
                                                            value={docType} 
                                                            onChange={(e) => {
                                                                setDocType(e.target.value);
                                                                if(e.target.value !== "Others") setCustomDocType("");
                                                            }}
                                                        >
                                                            <option value="">Select Document Type</option>
                                                            <option value="Aadhaar Card">Aadhaar Card</option>
                                                            <option value="PAN Card">PAN Card</option>
                                                            <option value="Offer Letter">Offer Letter</option>
                                                            <option value="Experience Letter">Experience Letter</option>
                                                            <option value="Others">Custom / Others</option>
                                                        </select>

                                                        {docType === "Others" && (
                                                            <input 
                                                                type="text" 
                                                                placeholder="e.g., Relieving Letter"
                                                                value={customDocType}
                                                                onChange={(e) => setCustomDocType(e.target.value)}
                                                                className="hr-input-field hr-slide-down mt-2"
                                                                autoFocus
                                                            />
                                                        )}
                                                    </div>

                                                    <div className="hr-form-group flex-grow">
                                                        <label>Select File</label>
                                                        <input 
                                                            id="hr-file-upload"
                                                            type="file" 
                                                            className="hr-file-input" 
                                                            onChange={(e)=>setUploadFile(e.target.files[0])} 
                                                        />
                                                    </div>

                                                    <div className="hr-form-action">
                                                        <button className="hr-btn-primary" onClick={handleUpload} disabled={isUploadDisabled}>
                                                            <FaCloudUploadAlt className="me-2"/> Upload
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Document Grid */}
                                        <div className="hr-doc-grid">
                                            {data.documents.length > 0 ? data.documents.map((doc, index) => (
                                                <div className="hr-doc-item" key={index}>
                                                    <div className="hr-doc-info">
                                                        <div className="hr-doc-icon"><FaFolderOpen/></div>
                                                        <div>
                                                            <p className="hr-doc-name">{doc.documentType}</p>
                                                            <span className="hr-doc-meta">Added: {new Date(doc.uploadedAt || Date.now()).toLocaleDateString('en-GB')}</span>
                                                        </div>
                                                    </div>
                                                    <a href={`${import.meta.env.VITE_API_URL}/static/${doc.fileUrl}`} target="_blank" rel="noreferrer" className="hr-btn-icon outline" title="View Document">
                                                        <FaEye />
                                                    </a>
                                                </div>
                                            )) : <div className="hr-empty-box border w-100">No documents in the vault yet.</div>}
                                        </div>

                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </DynamicLayout>
    );
};

// Reusable Label-Value component
const DataPair = ({ label, value }) => (
    <div className="hr-data-pair">
        <span className="hr-data-label">{label}</span>
        <span className="hr-data-value">{value || "---"}</span>
    </div>
);

export default EmployeeProfile;