import React, { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import EmployeeLayout from "../Common/DynamicLayout"; 
import "./MyProfile.css";
import { 
  FaUser, FaEnvelope, FaPhoneAlt, FaMapMarkerAlt, 
  FaBirthdayCake, FaTransgender, FaBuilding, 
  FaBriefcase, FaAmbulance, FaEdit, FaSave, FaTimes, 
  FaCamera, FaLock, FaShieldAlt, FaKey, FaCheckCircle,
  FaFolderOpen, FaCloudUploadAlt, FaSyncAlt, FaTrash, FaEye, FaFileAlt
} from "react-icons/fa";

const MyProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview"); // 'overview' or 'documents'
  
  // --- Edit Mode States ---
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [profilePicFile, setProfilePicFile] = useState(null);
  const [previewPic, setPreviewPic] = useState(null);

  // --- Password OTP Flow States ---
  const [pwdModal, setPwdModal] = useState(false);
  const [pwdStep, setPwdStep] = useState(1); 
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [btnLoading, setBtnLoading] = useState(false);

  // --- Document States ---
  const [documents, setDocuments] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [docUploadFile, setDocUploadFile] = useState(null);
  const [docType, setDocType] = useState("");
  const [customDocType, setCustomDocType] = useState("");
  const [editingDocId, setEditingDocId] = useState(null);

  const API_URL = import.meta.env.VITE_API_URL;
  const token = JSON.parse(localStorage.getItem("user"))?.token;

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/user/profile`, { headers: { Authorization: `Bearer ${token}` } });
      if (response.data.success) {
        const data = response.data.data;
        setProfile(data);
        setFormData({
          name: data.name || "", email: data.email || "", phone: data.phone || "",
          dob: data.dob ? data.dob.split('T')[0] : "", gender: data.gender || "", address: data.address || "",
          emergencyContact: data.emergencyContact || { name: "", phone: "", relation: "" }
        });
      }
    } catch (error) { console.error("Error fetching profile:", error); } 
    finally { setLoading(false); }
  };

  const fetchDocuments = async () => {
    try {
      setLoadingDocs(true);
      const res = await axios.get(`${API_URL}/api/documents/${profile?._id}`, { headers: { Authorization: `Bearer ${token}` } });
      setDocuments(res.data?.data || []);
    } catch (err) { console.error("Docs error", err); } 
    finally { setLoadingDocs(false); }
  };

  useEffect(() => { if (token) fetchProfile(); }, [token, API_URL]);
  useEffect(() => { if (activeTab === "documents" && profile) fetchDocuments(); }, [activeTab, profile]);

  // --- Profile Edit Handlers ---
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith("em_")) {
      const emField = name.split("em_")[1];
      setFormData(prev => ({ ...prev, emergencyContact: { ...prev.emergencyContact, [emField]: value } }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleProfilePicChange = (e) => {
    const file = e.target.files[0];
    if (file) { setProfilePicFile(file); setPreviewPic(URL.createObjectURL(file)); }
  };

  const handleSaveProfile = async () => {
    try {
      const submitData = new FormData();
      submitData.append("name", formData.name); submitData.append("email", formData.email);
      submitData.append("phone", formData.phone); submitData.append("dob", formData.dob);
      submitData.append("gender", formData.gender); submitData.append("address", formData.address);
      submitData.append("emergencyContact", JSON.stringify(formData.emergencyContact));
      if (profilePicFile) submitData.append("profilePic", profilePicFile);

      const res = await axios.put(`${API_URL}/user/profile`, submitData, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data.success) {
        Swal.fire({ icon: "success", title: "Profile Updated", timer: 1500, showConfirmButton: false });
        setIsEditing(false); setProfilePicFile(null); fetchProfile(); 
      }
    } catch (error) { Swal.fire("Error", "Failed to update profile", "error"); }
  };

  // --- Document Handlers ---
  const handleUploadDoc = async () => {
    const finalDocType = docType === "Others" ? customDocType.trim() : docType;
    if (!finalDocType || (!docUploadFile && !editingDocId)) return Swal.fire("Warning", "Type and file required", "warning");

    const formData = new FormData();
    formData.append("employeeId", profile._id);
    formData.append("documentType", finalDocType);
    if (docUploadFile) formData.append("file", docUploadFile);

    try {
      if (editingDocId) {
        await axios.put(`${API_URL}/api/documents/${editingDocId}`, formData, { headers: { Authorization: `Bearer ${token}` } });
        Swal.fire({ title: "Updated", icon: "success", timer: 1500, showConfirmButton: false });
      } else {
        await axios.post(`${API_URL}/api/documents/upload`, formData, { headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" } });
        Swal.fire({ title: "Uploaded", icon: "success", timer: 1500, showConfirmButton: false });
      }
      resetDocForm(); fetchDocuments();
    } catch { Swal.fire("Error", "Upload failed", "error"); }
  };

  const handleDeleteDoc = async (id) => {
    const confirm = await Swal.fire({ title: "Delete Document?", icon: "warning", showCancelButton: true, confirmButtonText: "Yes, delete", confirmButtonColor: "#ef4444" });
    if (confirm.isConfirmed) {
      try {
        await axios.delete(`${API_URL}/api/documents/${id}`, { headers: { Authorization: `Bearer ${token}` } });
        fetchDocuments();
      } catch { Swal.fire("Error", "Failed to delete", "error"); }
    }
  };

  const handleEditDoc = (doc) => {
    setEditingDocId(doc._id);
    const standardTypes = ["Aadhaar", "PAN", "Resume", "Offer Letter", "Experience Letter", "Bank Details"];
    if (standardTypes.includes(doc.documentType)) { setDocType(doc.documentType); setCustomDocType(""); } 
    else { setDocType("Others"); setCustomDocType(doc.documentType); }
    setDocUploadFile(null);
    document.getElementById("vault-file-upload").value = "";
  };

  const resetDocForm = () => {
    setDocUploadFile(null); setDocType(""); setCustomDocType(""); setEditingDocId(null);
    const fileInput = document.getElementById("vault-file-upload");
    if (fileInput) fileInput.value = "";
  };

  // --- Password Handlers ---
  const closePwdModal = () => { setPwdModal(false); setPwdStep(1); setOtp(""); setNewPassword(""); };
  const handleSendOtp = async () => { /* Same as previous */ setPwdStep(2); };
  const handleVerifyOtp = async () => { /* Same as previous */ setPwdStep(3); };
  const handleResetPassword = async () => { /* Same as previous */ closePwdModal(); };

  if (loading) return <EmployeeLayout><div className="zpro-loader"><div className="zpro-spinner"></div></div></EmployeeLayout>;
  if (!profile) return <EmployeeLayout><div className="zpro-empty">Profile data not found.</div></EmployeeLayout>;

  const profilePicUrl = previewPic || (profile.profilePic ? `${API_URL}/static/${profile.profilePic}` : `https://ui-avatars.com/api/?name=${profile.name}&background=random`);
  const isDocUploadDisabled = !docType || (docType === "Others" && !customDocType.trim()) || (!docUploadFile && !editingDocId);

  return (
    <EmployeeLayout>
      <div className="zpro-container">
        
        {/* Header */}
        <div className="zpro-header">
          <div>
            <h1 className="zpro-page-title">My Profile</h1>
            <p className="zpro-page-subtitle">Manage your personal records and secure documents</p>
          </div>
          <div className="zpro-actions">
            {!isEditing && activeTab === 'overview' && (
              <button className="zpro-btn-outline" onClick={() => setIsEditing(true)}>
                <FaEdit className="me-2" /> Edit Details
              </button>
            )}
            {isEditing && activeTab === 'overview' && (
              <>
                <button className="zpro-btn-text" onClick={() => { setIsEditing(false); setPreviewPic(null); setProfilePicFile(null); }}>Cancel</button>
                <button className="zpro-btn-primary" onClick={handleSaveProfile}><FaSave className="me-2" /> Save Profile</button>
              </>
            )}
          </div>
        </div>

        {/* Top Profile Card */}
        <div className="zpro-card zpro-profile-card">
          <div className="zpro-avatar-box">
            <img src={profilePicUrl} alt="Profile" className="zpro-avatar" />
            {isEditing && activeTab === 'overview' && (
              <label className="zpro-avatar-upload">
                <FaCamera />
                <input type="file" hidden accept="image/*" onChange={handleProfilePicChange} />
              </label>
            )}
          </div>
          <div className="zpro-basic-info">
            {isEditing && activeTab === 'overview' ? (
              <input type="text" name="name" value={formData.name} onChange={handleInputChange} className="zpro-input zpro-name-input" placeholder="Full Name" />
            ) : (
              <h2 className="zpro-name">{profile.name} <span className="zpro-badge">Active</span></h2>
            )}
            <div className="zpro-designation">
              <FaBriefcase className="me-2" /> {profile.designationId?.name || "Employee"} • {profile.departmentId?.name || "General"}
            </div>
          </div>
        </div>

        {/* --- CUSTOM TABS --- */}
        <div className="zpro-tabs">
          <button className={`zpro-tab-btn ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
            <FaUser className="me-2"/> Overview
          </button>
          <button className={`zpro-tab-btn ${activeTab === 'documents' ? 'active' : ''}`} onClick={() => setActiveTab('documents')}>
            <FaFolderOpen className="me-2"/> Documents Vault
          </button>
        </div>

        {/* --- TAB CONTENT: OVERVIEW --- */}
        {activeTab === 'overview' && (
          <div className="zpro-grid animate-fade-in">
            <div className="zpro-card">
              <h3 className="zpro-card-title"><FaUser className="me-2 text-primary" /> Personal Information</h3>
              <div className="zpro-form">
                <div className="zpro-form-group">
                  <label>Email Address</label>
                  {isEditing ? <input type="email" name="email" value={formData.email} onChange={handleInputChange} className="zpro-input" /> : <div className="zpro-value">{profile.email}</div>}
                </div>
                <div className="zpro-form-group">
                  <label>Phone Number</label>
                  {isEditing ? <input type="text" name="phone" value={formData.phone} onChange={handleInputChange} className="zpro-input" /> : <div className="zpro-value">{profile.phone || "---"}</div>}
                </div>
                <div className="zpro-form-group">
                  <label>Date of Birth</label>
                  {isEditing ? <input type="date" name="dob" value={formData.dob} onChange={handleInputChange} className="zpro-input" /> : <div className="zpro-value">{profile.dob ? new Date(profile.dob).toLocaleDateString('en-GB') : "---"}</div>}
                </div>
                <div className="zpro-form-group">
                  <label>Gender</label>
                  {isEditing ? (
                    <select name="gender" value={formData.gender} onChange={handleInputChange} className="zpro-input">
                      <option value="">Select</option><option value="Male">Male</option><option value="Female">Female</option><option value="Other">Other</option>
                    </select>
                  ) : <div className="zpro-value" style={{textTransform:'capitalize'}}>{profile.gender || "---"}</div>}
                </div>
                <div className="zpro-form-group full-width">
                  <label>Current Address</label>
                  {isEditing ? <textarea name="address" value={formData.address} onChange={handleInputChange} className="zpro-input" rows="2"></textarea> : <div className="zpro-value">{profile.address || "---"}</div>}
                </div>
              </div>
            </div>

            <div className="zpro-stack">
              <div className="zpro-card">
                <h3 className="zpro-card-title"><FaShieldAlt className="me-2 text-success" /> Account Security</h3>
                <p className="zpro-help-text">Secure your account with a strong password.</p>
                <div className="zpro-security-box">
                  <div className="d-flex align-items-center">
                    <div className="zpro-icon-circle"><FaLock /></div>
                    <div className="ms-3">
                      <h5 className="m-0 fw-bold fs-6">Password</h5>
                      <small className="text-muted">Managed via OTP</small>
                    </div>
                  </div>
                  <button className="zpro-btn-outline" onClick={() => setPwdModal(true)}>Change Password</button>
                </div>
              </div>

              <div className="zpro-card accent-danger">
                <h3 className="zpro-card-title text-danger"><FaAmbulance className="me-2" /> Emergency Contact</h3>
                <div className="zpro-form">
                  <div className="zpro-form-group full-width">
                    <label>Contact Name</label>
                    {isEditing ? <input type="text" name="em_name" value={formData.emergencyContact.name} onChange={handleInputChange} className="zpro-input" /> : <div className="zpro-value">{profile.emergencyContact?.name || "---"}</div>}
                  </div>
                  <div className="zpro-form-group">
                    <label>Relationship</label>
                    {isEditing ? <input type="text" name="em_relation" value={formData.emergencyContact.relation} onChange={handleInputChange} className="zpro-input" /> : <div className="zpro-value capitalize">{profile.emergencyContact?.relation || "---"}</div>}
                  </div>
                  <div className="zpro-form-group">
                    <label>Phone Number</label>
                    {isEditing ? <input type="text" name="em_phone" value={formData.emergencyContact.phone} onChange={handleInputChange} className="zpro-input" /> : <div className="zpro-value">{profile.emergencyContact?.phone || "---"}</div>}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- TAB CONTENT: DOCUMENTS --- */}
        {activeTab === 'documents' && (
          <div className="zpro-docs-section animate-fade-in">
            
            <div className={`zpro-card zpro-upload-card ${editingDocId ? 'editing-mode' : ''}`}>
              <h3 className="zpro-card-title">
                {editingDocId ? <><FaSyncAlt className="me-2 text-warning"/> Update Document</> : <><FaCloudUploadAlt className="me-2 text-primary"/> Secure File Upload</>}
              </h3>
              
              <div className="zpro-form-row">
                <div className="zpro-form-group" style={{ minWidth: '250px' }}>
                  <label>Document Classification</label>
                  <select value={docType} onChange={(e) => { setDocType(e.target.value); if(e.target.value !== "Others") setCustomDocType(""); }} className="zpro-input">
                    <option value="">-- Select Type --</option>
                    <option value="Aadhaar">Aadhaar Card</option>
                    <option value="PAN">PAN Card</option>
                    <option value="Resume">Resume / CV</option>
                    <option value="Offer Letter">Offer Letter</option>
                    <option value="Bank Details">Bank Details</option>
                    <option value="Others">Others / Custom</option>
                  </select>
                  {docType === "Others" && (
                    <input type="text" placeholder="Specify document name..." value={customDocType} onChange={(e) => setCustomDocType(e.target.value)} className="zpro-input mt-2 fade-in" autoFocus />
                  )}
                </div>

                <div className="zpro-form-group flex-grow-1">
                  <label>{editingDocId ? "Replace File (Optional)" : "Select File (PDF, JPG, PNG)"}</label>
                  <input id="vault-file-upload" type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => setDocUploadFile(e.target.files[0])} className="zpro-input" style={{padding: '7px 12px'}} />
                </div>

                <div className="zpro-form-actions" style={{ alignSelf: docType === 'Others' ? 'flex-end' : 'flex-end', paddingBottom: '2px' }}>
                  {editingDocId && <button className="zpro-btn-text" onClick={resetDocForm}>Cancel</button>}
                  <button className={editingDocId ? "zpro-btn-warning" : "zpro-btn-primary"} onClick={handleUploadDoc} disabled={isDocUploadDisabled}>
                    {editingDocId ? <FaSyncAlt className="me-2"/> : <FaCloudUploadAlt className="me-2"/>}
                    {editingDocId ? "Update" : "Upload"}
                  </button>
                </div>
              </div>
            </div>

            <div className="zpro-card p-0 overflow-hidden">
              {loadingDocs ? <div className="zpro-loader"><div className="zpro-spinner"></div></div> : (
                <table className="zpro-table">
                  <thead>
                    <tr><th>File Information</th><th>Upload Date</th><th className="text-right">Actions</th></tr>
                  </thead>
                  <tbody>
                    {documents.length === 0 ? (
                      <tr><td colSpan="3" className="zpro-empty border-0"><FaFileAlt size={40} className="mb-2 opacity-50"/><br/>Your vault is empty.</td></tr>
                    ) : (
                      documents.map(doc => (
                        <tr key={doc._id}>
                          <td>
                            <div className="d-flex align-items-center gap-3">
                              <div className="zpro-icon-circle" style={{background: 'rgba(37,99,235,0.1)', color: '#2563eb'}}><FaFileAlt /></div>
                              <div><div className="fw-bold">{doc.documentType}</div><small className="text-muted">Encrypted Record</small></div>
                            </div>
                          </td>
                          <td>{new Date(doc.uploadedAt).toLocaleDateString('en-GB')}</td>
                          <td>
                            <div className="d-flex gap-2 justify-content-end">
                              <a href={`${API_URL}/static/${doc.fileUrl}`} target="_blank" rel="noreferrer" className="zpro-icon-btn view" title="View"><FaEye /></a>
                              <button className="zpro-icon-btn edit" onClick={() => handleEditDoc(doc)} title="Edit"><FaSyncAlt /></button>
                              <button className="zpro-icon-btn delete" onClick={() => handleDeleteDoc(doc._id)} title="Delete"><FaTrash /></button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}
            </div>

          </div>
        )}
      </div>
    </EmployeeLayout>
  );
};

export default MyProfile;