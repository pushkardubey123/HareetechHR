import React, { useContext, useEffect, useState } from "react";
import axios from "axios";
import { FiSettings, FiBriefcase, FiUser, FiSave } from "react-icons/fi";
import { HiOutlineBuildingOffice2 } from "react-icons/hi2";
import Swal from "sweetalert2";
import AdminLayout from "./AdminLayout";
import "./AdminSettings.css";
import { SettingsContext } from "../Redux/SettingsContext";

const AdminSettings = () => {
  const API = import.meta.env.VITE_API_URL;
  const userString = localStorage.getItem("user");
  const userObj = userString ? JSON.parse(userString) : null;
  const token = userObj?.token;

  // --- States ---
  const [basic, setBasic] = useState({ name: "", email: "", phone: "", address: "", website: "", logo: "" });
  const [legal, setLegal] = useState({ companyType: "", registrationNumber: "", gstNumber: "", panNumber: "", cinNumber: "" });
  const [attendance, setAttendance] = useState({ gpsRequired: true, faceRequired: false, lateMarkTime: "09:30", earlyLeaveTime: "17:30" });
  const [authorizedPersons, setAuthorizedPersons] = useState([]);

  // Files State
  const [logoFile, setLogoFile] = useState(null);
  const [adminPicFile, setAdminPicFile] = useState(null);

  // Admin Profile State
  const [adminProfile, setAdminProfile] = useState({
    name: "", email: "", phone: "", designation: "Administrator", profilePic: ""
  });

  // Cache Keys
  const [logoCacheKey, setLogoCacheKey] = useState(Date.now());
  const [profileCacheKey, setProfileCacheKey] = useState(Date.now());
  const { updateUserData } = useContext(SettingsContext);

  useEffect(() => {
    if (token) {
      fetchCompanySettings();
      fetchAdminProfile();
    }
  }, [token]);

  // --- API FUNCTIONS ---

  // 1. Profile Logic
  const fetchAdminProfile = async () => {
    try {
      const res = await axios.get(`${API}/user/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) {
        const u = res.data.data;
        setAdminProfile({
          name: u.name || "",
          email: u.email || "",
          phone: u.phone || "",
          designation: "Administrator",
          profilePic: u.profilePic || ""
        });
        setProfileCacheKey(Date.now());
      }
    } catch (error) { console.error("Error fetching profile:", error); }
  };

  const handleAdminUpdate = async (e) => {
    if (e) e.preventDefault();
    
    // Create FormData for profile update
    const form = new FormData();
    form.append("name", adminProfile.name);
    form.append("email", adminProfile.email);
    form.append("phone", adminProfile.phone);
    if (adminPicFile) {
        form.append("profilePic", adminPicFile); 
    }

    const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data"
    };

    try {
      const res = await axios.put(`${API}/user/profile`, form, { headers });
      if (res.data.success) {
        Swal.fire("Success", "Admin Profile Updated!", "success");
        
        // Live Update Context
        updateUserData(res.data.data); 
        
        setAdminPicFile(null);
        setProfileCacheKey(Date.now()); // Refresh image cache
      }
    } catch (error) { 
        Swal.fire("Error", "Failed to update profile", "error");
        console.error(error);
    }
  };

  // 2. Company Settings Logic
  const fetchCompanySettings = async () => {
    try {
      const res = await axios.get(`${API}/api/settings`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const s = res.data.data;
      if (!s) return;

      setBasic({
        name: s.name || "", email: s.email || "", phone: s.phone || "",
        address: s.address || "", website: s.website || "", logo: s.logo || "",
      });
      setLegal({
        companyType: s.companyType || "", registrationNumber: s.registrationNumber || "",
        gstNumber: s.gstNumber || "", panNumber: s.panNumber || "", cinNumber: s.cinNumber || "",
      });
      setAttendance({
        gpsRequired: s.attendance?.gpsRequired ?? true,
        faceRequired: s.attendance?.faceRequired ?? false,
        lateMarkTime: s.attendance?.lateMarkTime || "09:30",
        earlyLeaveTime: s.attendance?.earlyLeaveTime || "17:30",
      });
      setAuthorizedPersons(s.authorizedPersons || []);
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
    if (logoFile) form.append("logo", logoFile);

    try {
      const res = await axios.put(`${API}/api/settings`, form, {
        headers: { Authorization: `Bearer ${token}` },
      });
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

  return (
    <AdminLayout>
      <div className="settings-wrap">
        <div className="settings-card">
          <div className="settings-head">
            <FiSettings className="spin-icon"/> <h2>System Settings</h2>
          </div>

          {/* ADMIN PROFILE */}
          <Section title="My Admin Profile" icon={<FiUser />}>
            <Grid cols={3}>
              <Input label="Admin Name" value={adminProfile.name} onChange={(v) => setAdminProfile({ ...adminProfile, name: v })} />
              <Input label="Email" value={adminProfile.email} onChange={(v) => setAdminProfile({ ...adminProfile, email: v })} />
              <Input label="Phone" value={adminProfile.phone} onChange={(v) => setAdminProfile({ ...adminProfile, phone: v })} />
            </Grid>
            <div className="profile-action-row">
              <ImageUpload 
                imagePath={adminProfile.profilePic} 
                API={API} 
                setFile={setAdminPicFile} 
                label="Profile Picture"
                cacheKey={profileCacheKey}
                isProfile={true}
              />
              <button type="button" className="btn-primary-small" onClick={handleAdminUpdate}>
                <FiSave /> Update Profile
              </button>
            </div>
          </Section>

          <hr className="divider" />

          {/* COMPANY SETTINGS FORM */}
          <form onSubmit={handleCompanyUpdate}>
            <Section title="Company Information" icon={<HiOutlineBuildingOffice2 />}>
              <Grid cols={3}>
                <Input label="Company Name" value={basic.name} onChange={(v) => setBasic({ ...basic, name: v })} />
                <Input label="Email" value={basic.email} onChange={(v) => setBasic({ ...basic, email: v })} />
                <Input label="Phone" value={basic.phone} onChange={(v) => setBasic({ ...basic, phone: v })} />
                <Input label="Address" value={basic.address} onChange={(v) => setBasic({ ...basic, address: v })} />
                <Input label="Website" value={basic.website} onChange={(v) => setBasic({ ...basic, website: v })} />
              </Grid>
              <ImageUpload 
                imagePath={basic.logo} 
                API={API} 
                setFile={setLogoFile} 
                label="Company Logo"
                cacheKey={logoCacheKey}
                isProfile={false}
              />
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
                <button type="button" className="add-btn" onClick={addAuthorizedPerson}>+ Add Person</button>
            </Section>

            <button type="submit" className="save-btn-large">Save Company Settings</button>
          </form>
        </div>
      </div>
    </AdminLayout>
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

const ImageUpload = ({
  imagePath,
  API,
  setFile,
  label = "Upload Image",
  cacheKey,
  isProfile
}) => {

const getImageUrl = () => {
  if (!imagePath) return null;
  if (imagePath.startsWith("http") || imagePath.startsWith("blob:")) {
    return imagePath;
  }
  if (imagePath.startsWith("/static/")) {
    return `${API}${imagePath}?t=${cacheKey}`;
  }
  return `${API}/static/${imagePath}?t=${cacheKey}`;
};

  return (
    <div className="input-box logo-box">
      <label>{label}</label>
      <div className={`logo-upload-wrapper ${isProfile ? "profile-shape" : ""}`}>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setFile(e.target.files[0])}
          className="logo-file-input"
        />
        {imagePath ? (
          <img
            src={getImageUrl()}
            className="logo-preview"
            alt="Preview"
            onError={(e) => {
              console.warn("Image load failed:", e.target.src);
              e.target.onerror = null; // Prevents infinite loops!
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