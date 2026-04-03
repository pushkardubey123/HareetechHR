import React, { useContext, useEffect, useState } from "react";
import axios from "axios";
import { FiSettings, FiBriefcase, FiUser, FiSave, FiCalendar, FiStar, FiArrowRight } from "react-icons/fi";
import { HiOutlineBuildingOffice2 } from "react-icons/hi2";
import { useNavigate } from "react-router-dom"; // 🔥 Added for navigation
import Swal from "sweetalert2";
import DynamicLayout from "../Common/DynamicLayout";
import "./AdminSettings.css";
import { SettingsContext } from "../Redux/SettingsContext";
import moment from "moment"; // 🔥 Added for formatting dates

const AdminSettings = () => {
  const API = import.meta.env.VITE_API_URL;
  const navigate = useNavigate(); // 🔥 Define navigate
  
  // ✅ PERMISSION LOGIC
  const userString = localStorage.getItem("user");
  const userObj = userString ? JSON.parse(userString) : null;
  const token = userObj?.token;
  const isAdmin = userObj?.role === "admin";
  const [perms, setPerms] = useState({ view: false, create: false, edit: false, delete: false });

  // --- States ---
  const [basic, setBasic] = useState({ name: "", email: "", phone: "", address: "", website: "", logo: "" });
  const [legal, setLegal] = useState({ companyType: "", registrationNumber: "", gstNumber: "", panNumber: "", cinNumber: "" });
  const [attendance, setAttendance] = useState({ gpsRequired: true, faceRequired: false, lateMarkTime: "09:30", earlyLeaveTime: "17:30" });
  const [authorizedPersons, setAuthorizedPersons] = useState([]);
  
  // ✅ PAYROLL DATE
  const [payrollGenerationDate, setPayrollGenerationDate] = useState(1);

  // 🔥 NAYA STATE SUBSCRIPTION KE LIYE
  const [subscriptionInfo, setSubscriptionInfo] = useState(null);

  const [logoFile, setLogoFile] = useState(null);
  const [adminPicFile, setAdminPicFile] = useState(null);

  const [adminProfile, setAdminProfile] = useState({
    name: "", email: "", phone: "", designation: "Administrator", profilePic: "", password: "", confirmPassword: ""
  });

  const [logoCacheKey, setLogoCacheKey] = useState(Date.now());
  const [profileCacheKey, setProfileCacheKey] = useState(Date.now());
  const { updateUserData } = useContext(SettingsContext);

  useEffect(() => {
    const fetchPerms = async () => {
      if (isAdmin || !token) return;
      try {
        const res = await axios.get(`${API}/api/my-modules`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.detailed?.settings) {
          setPerms(res.data.detailed.settings);
        }
      } catch (e) {
        console.error("Permission fetch failed", e);
      }
    };
    fetchPerms();
    if (token) {
      fetchCompanySettings();
      fetchAdminProfile();
      fetchMySubscription(); // 🔥 Fetch Subscription Data
    }
  }, [token, isAdmin, API]);

  // 🔥 SUBSCRIPTION FETCH FUNCTION 🔥
  const fetchMySubscription = async () => {
    try {
      const res = await axios.get(`${API}/user/my-subscription`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data.success) {
        setSubscriptionInfo(res.data.data);
      }
    } catch (error) { console.error("Error fetching subscription:", error); }
  };

  const fetchAdminProfile = async () => {
    try {
      const res = await axios.get(`${API}/user/profile`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data.success) {
        const u = res.data.data;
        setAdminProfile({
          name: u.name || "", email: u.email || "", phone: u.phone || "",
          designation: "Administrator", profilePic: u.profilePic || "",
          password: "", confirmPassword: ""
        });
        setProfileCacheKey(Date.now());
      }
    } catch (error) { console.error("Error fetching profile:", error); }
  };

  const handleAdminUpdate = async (e) => {
    if (e) e.preventDefault();
    if (adminProfile.password || adminProfile.confirmPassword) {
      if (adminProfile.password !== adminProfile.confirmPassword) return Swal.fire("Error", "Passwords do not match!", "error");
      if (adminProfile.password.length < 6) return Swal.fire("Error", "Password must be at least 6 characters long.", "error");
    }
    
    const form = new FormData();
    form.append("name", adminProfile.name);
    form.append("email", adminProfile.email);
    form.append("phone", adminProfile.phone);
    if (adminProfile.password) form.append("password", adminProfile.password);
    if (adminPicFile) form.append("profilePic", adminPicFile); 

    try {
      const res = await axios.put(`${API}/user/profile`, form, { headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" }});
      if (res.data.success) {
        Swal.fire("Success", "Admin Profile Updated!", "success");
        updateUserData(res.data.data); 
        setAdminProfile(prev => ({ ...prev, password: "", confirmPassword: "" }));
        setAdminPicFile(null);
        setProfileCacheKey(Date.now()); 
      }
    } catch (error) { 
        Swal.fire("Error", error.response?.data?.message || "Failed to update profile", "error");
    }
  };

  const fetchCompanySettings = async () => {
    try {
      const res = await axios.get(`${API}/api/settings`, { headers: { Authorization: `Bearer ${token}` } });
      const s = res.data.data;
      if (!s) return;
      setBasic({ name: s.name || "", email: s.email || "", phone: s.phone || "", address: s.address || "", website: s.website || "", logo: s.logo || "" });
      setLegal({ companyType: s.companyType || "", registrationNumber: s.registrationNumber || "", gstNumber: s.gstNumber || "", panNumber: s.panNumber || "", cinNumber: s.cinNumber || "" });
      setAttendance({ gpsRequired: s.attendance?.gpsRequired ?? true, faceRequired: s.attendance?.faceRequired ?? false, lateMarkTime: s.attendance?.lateMarkTime || "09:30", earlyLeaveTime: s.attendance?.earlyLeaveTime || "17:30" });
      setAuthorizedPersons(s.authorizedPersons || []);
      setPayrollGenerationDate(s.payrollGenerationDate || 1);
      setLogoCacheKey(Date.now());
    } catch (error) { console.error(error); }
  };

  const handleCompanyUpdate = async (e) => {
    e.preventDefault();
    const form = new FormData();
    Object.keys(basic).forEach(k => k !== 'logo' && form.append(k, basic[k]));
    Object.keys(legal).forEach(k => form.append(k, legal[k]));
    form.append("gpsRequired", attendance.gpsRequired);
    form.append("faceRequired", attendance.faceRequired);
    form.append("lateMarkTime", attendance.lateMarkTime);
    form.append("earlyLeaveTime", attendance.earlyLeaveTime);
    form.append("authorizedPersons", JSON.stringify(authorizedPersons));
    form.append("payrollGenerationDate", payrollGenerationDate);

    if (logoFile) form.append("logo", logoFile);

    try {
      const res = await axios.put(`${API}/api/settings`, form, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data.success) {
        Swal.fire("Success", "Company Settings Updated", "success");
        fetchCompanySettings();
        setLogoFile(null);
      }
    } catch (err) { Swal.fire("Error", "Error updating settings", "error"); }
  };

  const addAuthorizedPerson = () => setAuthorizedPersons([...authorizedPersons, { name: "", email: "", role: "HR Manager" }]);
  const updateAuthPerson = (i, f, v) => {
    const updated = [...authorizedPersons];
    updated[i][f] = v;
    setAuthorizedPersons(updated);
  };

  const canEdit = isAdmin || perms.edit;

  return (
    <DynamicLayout>
      <div className="settings-wrap">
        <div className="settings-card">
          
          <div className="settings-head d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
            <div className="d-flex align-items-center gap-3">
                <FiSettings className="spin-icon fs-3 text-primary"/> 
                <h2 className="m-0">System Settings</h2>
            </div>
          </div>

          {/* 🔥 CURRENT SUBSCRIPTION DETAILS SECTION 🔥 */}
          {isAdmin && subscriptionInfo && (
              <div className="mb-4 p-4 rounded-4" style={{ background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.05), rgba(79, 70, 229, 0.1))', border: '1px solid rgba(79, 70, 229, 0.2)' }}>
                  <div className="d-flex justify-content-between align-items-start flex-wrap gap-3 mb-3">
                      <div>
                          <h4 className="fw-bold m-0" style={{ color: subscriptionInfo.planId?.themeColor1 || 'var(--primary-color)' }}>
                              Current Plan: {subscriptionInfo.planId?.name || "Unknown"}
                          </h4>
                          <p className="text-muted small m-0 mt-1">
                              {subscriptionInfo.isTrial ? (
                                  <span className="badge bg-warning text-dark">Free Trial Active</span>
                              ) : (
                                  <span className="badge bg-success">Premium Active</span>
                              )}
                          </p>
                      </div>
                      <button 
                          className="btn btn-sm btn-outline-primary rounded-pill px-3 d-flex align-item-center"
                          onClick={() => navigate('/subscription')}
                      >
                          View All Plans <FiArrowRight className="ms-1"/>
                      </button>
                  </div>

                  <div className="row g-3">
                      <div className="col-md-4">
                          <div className="p-3 bg-white rounded-3 shadow-sm" style={{ border: '1px solid var(--border-color)' }}>
                              <div className="text-muted small fw-bold text-uppercase mb-1">Status</div>
                              <div className={`fw-bold ${subscriptionInfo.status === 'active' ? 'text-success' : 'text-danger'}`}>
                                  {subscriptionInfo.status.toUpperCase()}
                              </div>
                          </div>
                      </div>
                      <div className="col-md-4">
                          <div className="p-3 bg-white rounded-3 shadow-sm" style={{ border: '1px solid var(--border-color)' }}>
                              <div className="text-muted small fw-bold text-uppercase mb-1">Valid Upto</div>
                              <div className="fw-bold text-dark">
                                  {moment(subscriptionInfo.validUpto).format('DD MMM YYYY, hh:mm A')}
                              </div>
                          </div>
                      </div>
                      <div className="col-md-4">
                          <div className="p-3 bg-white rounded-3 shadow-sm" style={{ border: '1px solid var(--border-color)' }}>
                              <div className="text-muted small fw-bold text-uppercase mb-1">Storage Used</div>
                              <div className="fw-bold text-dark">
                                  {subscriptionInfo.usage?.storageUsedMB?.toFixed(2)} MB 
                                  <span className="text-muted fw-normal ms-1">
                                      / {subscriptionInfo.planId?.limits?.maxStorageMB === -1 ? 'Unlimited' : `${subscriptionInfo.planId?.limits?.maxStorageMB} MB`}
                                  </span>
                              </div>
                          </div>
                      </div>
                  </div>
              </div>
          )}

          <Section title="My Admin Profile" icon={<FiUser />}>
            <Grid cols={3}>
              <Input label="Admin Name" value={adminProfile.name} onChange={(v) => setAdminProfile({ ...adminProfile, name: v })} />
              <Input label="Email" value={adminProfile.email} onChange={(v) => setAdminProfile({ ...adminProfile, email: v })} />
              <Input label="Phone" value={adminProfile.phone} onChange={(v) => setAdminProfile({ ...adminProfile, phone: v })} />
              <Input type="password" label="New Password" value={adminProfile.password} onChange={(v) => setAdminProfile({ ...adminProfile, password: v })} placeholder="Leave blank to keep current" />
              <Input type="password" label="Confirm Password" value={adminProfile.confirmPassword} onChange={(v) => setAdminProfile({ ...adminProfile, confirmPassword: v })} placeholder="Confirm new password" />
            </Grid>
            <div className="profile-action-row">
              <ImageUpload imagePath={adminProfile.profilePic} API={API} setFile={setAdminPicFile} label="Profile Picture" cacheKey={profileCacheKey} isProfile={true} />
              <button type="button" className="btn-primary-small" onClick={handleAdminUpdate}>
                <FiSave /> Update Profile
              </button>
            </div>
          </Section>

          <hr className="divider" />

          <form onSubmit={handleCompanyUpdate}>
            
            {/* PAYROLL AUTOMATION SECTION */}
            <Section title="Payroll Automation" icon={<FiCalendar />}>
              <div style={{ background: "rgba(99, 102, 241, 0.05)", border: "1px solid rgba(99, 102, 241, 0.2)", padding: "15px", borderRadius: "10px", marginBottom: "20px" }}>
                <Grid cols={2}>
                  <Input 
                    type="number" 
                    label="Auto-Generate Salary Date (1-31)" 
                    value={payrollGenerationDate} 
                    onChange={(v) => {
                      let val = parseInt(v);
                      if (val < 1) val = 1;
                      if (val > 31) val = 31;
                      setPayrollGenerationDate(val);
                    }} 
                    placeholder="e.g., 1" 
                  />
                </Grid>
                <p className="text-muted" style={{ fontSize: '13px', margin: '8px 0 0 0' }}>
                  The system will automatically calculate and generate "Pending" salaries for all employees on this date every month.
                </p>
              </div>
            </Section>

            <Section title="Company Information" icon={<HiOutlineBuildingOffice2 />}>
              <Grid cols={3}>
                <Input label="Company Name" value={basic.name} onChange={(v) => setBasic({ ...basic, name: v })} />
                <Input label="Email" value={basic.email} onChange={(v) => setBasic({ ...basic, email: v })} />
                <Input label="Phone" value={basic.phone} onChange={(v) => setBasic({ ...basic, phone: v })} />
                <Input label="Address" value={basic.address} onChange={(v) => setBasic({ ...basic, address: v })} />
                <Input label="Website" value={basic.website} onChange={(v) => setBasic({ ...basic, website: v })} />
              </Grid>
              <ImageUpload imagePath={basic.logo} API={API} setFile={setLogoFile} label="Company Logo" cacheKey={logoCacheKey} isProfile={false} />
            </Section>

            <Section title="Legal & Compliance" icon={<FiBriefcase />}>
              <Grid cols={3}>
                <Input label="Company Type" value={legal.companyType} onChange={(v) => setLegal({ ...legal, companyType: v })} />
                <Input label="GST Number" value={legal.gstNumber} onChange={(v) => setLegal({ ...legal, gstNumber: v })} />
                <Input label="PAN Number" value={legal.panNumber} onChange={(v) => setLegal({ ...legal, panNumber: v })} />
                <Input label="Registration No" value={legal.registrationNumber} onChange={(v) => setLegal({ ...legal, registrationNumber: v })} />
                <Input label="CIN Number" value={legal.cinNumber} onChange={(v) => setLegal({ ...legal, cinNumber: v })} />
              </Grid>
            </Section>

            <Section title="Attendance Settings">
              <Grid cols={2}>
                <Toggle label="GPS Required" checked={attendance.gpsRequired} onChange={(v) => setAttendance({ ...attendance, gpsRequired: v })} />
                <Toggle label="Face Recognition" checked={attendance.faceRequired} onChange={(v) => setAttendance({ ...attendance, faceRequired: v })} />
                <Input type="time" label="Late Mark Time" value={attendance.lateMarkTime} onChange={(v) => setAttendance({ ...attendance, lateMarkTime: v })} />
                <Input type="time" label="Early Leave Time" value={attendance.earlyLeaveTime} onChange={(v) => setAttendance({ ...attendance, earlyLeaveTime: v })} />
              </Grid>
            </Section>

            <Section title="Authorized Persons">
                {authorizedPersons.map((p, i) => (
                  <Grid cols={3} key={i}>
                    <Input placeholder="Name" value={p.name} onChange={(v) => updateAuthPerson(i, "name", v)} />
                    <Input placeholder="Email" value={p.email} onChange={(v) => updateAuthPerson(i, "email", v)} />
                    <Select value={p.role} onChange={(v) => updateAuthPerson(i, "role", v)} />
                  </Grid>
                ))}
                {canEdit && <button type="button" className="add-btn" onClick={addAuthorizedPerson}>+ Add Person</button>}
            </Section>

            {canEdit ? (
               <button type="submit" className="save-btn-large">Save Company Settings</button>
            ) : (
               <p className="text-muted mt-3">You do not have permission to modify company settings.</p>
            )}
          </form>
        </div>
      </div>
    </DynamicLayout>
  );
};

/* --- COMPONENTS --- */
const Section = ({ title, icon, children }) => (<div className="section"><h3>{icon} {title}</h3>{children}</div>);
const Grid = ({ cols, children }) => <div className={`grid grid-${cols}`}>{children}</div>;
const Input = ({ label, value, onChange, type = "text", placeholder }) => (
  <div className="input-box">
    {label && <label>{label}</label>}
    <input type={type} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
  </div>
);
const Toggle = ({ label, checked, onChange }) => (
  <div className="toggle-box"><span>{label}</span><div className={`toggle ${checked ? "on" : ""}`} onClick={() => onChange(!checked)} /></div>
);
const Select = ({ value, onChange }) => (
  <div className="input-box">
    <select value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="HR Manager">HR Manager</option>
      <option value="Reporting Manager">Reporting Manager</option>
      <option value="Admin">Admin</option>
      <option value="Compliance Officer">Compliance Officer</option>
    </select>
  </div>
);

const ImageUpload = ({ imagePath, API, setFile, label = "Upload Image", cacheKey, isProfile }) => {
const getImageUrl = () => {
  if (!imagePath) return null;
  if (imagePath.startsWith("http") || imagePath.startsWith("blob:")) return imagePath;
  if (imagePath.startsWith("/static/")) return `${API}${imagePath}?t=${cacheKey}`;
  return `${API}/static/${imagePath}?t=${cacheKey}`;
};

  return (
    <div className="input-box logo-box">
      <label>{label}</label>
      <div className={`logo-upload-wrapper ${isProfile ? "profile-shape" : ""}`}>
        <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files[0])} className="logo-file-input" />
        {imagePath ? (
          <img
            src={getImageUrl()}
            className="logo-preview"
            alt="Preview"
            onError={(e) => {
              e.target.onerror = null; 
              e.target.src = `https://ui-avatars.com/api/?name=${isProfile ? 'User' : 'Logo'}&background=random`;
            }}
          />
        ) : (
          <span className="upload-placeholder">Click to Upload</span>
        )}
      </div>
    </div>
  );
};

export default AdminSettings;