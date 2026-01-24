import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  FiSettings,
  FiBriefcase,
} from "react-icons/fi";
import { HiOutlineBuildingOffice2 } from "react-icons/hi2";
import AdminLayout from "./AdminLayout";
import "./AdminSettings.css";

const AdminSettings = () => {
  const API = import.meta.env.VITE_API_URL;
  const token = JSON.parse(localStorage.getItem("user"))?.token;

  const [basic, setBasic] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    website: "",
    logo: "",
  });

  const [legal, setLegal] = useState({
    companyType: "",
    registrationNumber: "",
    gstNumber: "",
    panNumber: "",
    cinNumber: "",
  });

  const [attendance, setAttendance] = useState({
    gpsRequired: true,
    faceRequired: false,
    lateMarkTime: "09:30",
    earlyLeaveTime: "17:30",
  });

  const [authorizedPersons, setAuthorizedPersons] = useState([]);
  const [logoFile, setLogoFile] = useState(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await axios.get(`${API}/api/settings`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const s = res.data.data;
      if (!s) return;

      setBasic({
        name: s.name || "",
        email: s.email || "",
        phone: s.phone || "",
        address: s.address || "",
        website: s.website || "",
        logo: s.logo || "",
      });
      setLegal({
        companyType: s.companyType || "",
        registrationNumber: s.registrationNumber || "",
        gstNumber: s.gstNumber || "",
        panNumber: s.panNumber || "",
        cinNumber: s.cinNumber || "",
      });
      // Correctly nested attendance state
      setAttendance({
        gpsRequired: s.attendance?.gpsRequired ?? true,
        faceRequired: s.attendance?.faceRequired ?? false,
        lateMarkTime: s.attendance?.lateMarkTime || "09:30",
        earlyLeaveTime: s.attendance?.earlyLeaveTime || "17:30",
      });
      setAuthorizedPersons(s.authorizedPersons || []);
    } catch (error) {
      console.error("Error fetching settings:", error);
    }
  };

  // --- FIXED: Added updateAuth Function ---
  const updateAuth = (index, field, value) => {
    const updated = [...authorizedPersons];
    updated[index][field] = value;
    setAuthorizedPersons(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const form = new FormData();

    // BASIC INFO
    form.append("name", basic.name);
    form.append("email", basic.email);
    form.append("phone", basic.phone);
    form.append("address", basic.address);
    form.append("website", basic.website);

    // LEGAL INFO
    form.append("companyType", legal.companyType);
    form.append("registrationNumber", legal.registrationNumber);
    form.append("gstNumber", legal.gstNumber);
    form.append("panNumber", legal.panNumber);
    form.append("cinNumber", legal.cinNumber);

    // ATTENDANCE (Sending as strings for Multer/FormData compatibility)
    form.append("gpsRequired", attendance.gpsRequired);
    form.append("faceRequired", attendance.faceRequired);
    form.append("lateMarkTime", attendance.lateMarkTime);
    form.append("earlyLeaveTime", attendance.earlyLeaveTime);

    // AUTHORIZED PERSONS
    form.append("authorizedPersons", JSON.stringify(authorizedPersons));

    // LOGO FILE
    if (logoFile) form.append("logo", logoFile);

    try {
      const res = await axios.put(`${API}/api/settings`, form, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data.success) {
        alert("Settings Updated Successfully");
        fetchSettings();
      } else {
        alert("Update failed: " + res.data.message);
      }
    } catch (err) {
      console.error(err);
      alert("Server error while updating settings");
    }
  };

  return (
    <AdminLayout>
      <div className="settings-wrap">
        <form className="settings-card" onSubmit={handleSubmit}>
          <Header />

          <Section title="Basic Information" icon={<HiOutlineBuildingOffice2 />}>
            <Grid cols={3}>
              <Input label="Company Name" value={basic.name} onChange={(v) => setBasic({ ...basic, name: v })} />
              <Input label="Email" value={basic.email} onChange={(v) => setBasic({ ...basic, email: v })} />
              <Input label="Phone" value={basic.phone} onChange={(v) => setBasic({ ...basic, phone: v })} />
              <Input label="Address" value={basic.address} onChange={(v) => setBasic({ ...basic, address: v })} />
              <Input label="Website" value={basic.website} onChange={(v) => setBasic({ ...basic, website: v })} />
            </Grid>
            <LogoUpload logo={basic.logo} API={API} setLogoFile={setLogoFile} />
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
                <Input placeholder="Name" value={p.name} onChange={(v) => updateAuth(i, "name", v)} />
                <Input placeholder="Email" value={p.email} onChange={(v) => updateAuth(i, "email", v)} />
                <Select value={p.role} onChange={(v) => updateAuth(i, "role", v)} />
              </Grid>
            ))}

            <button type="button" className="add-btn" onClick={() => setAuthorizedPersons([...authorizedPersons, { name: "", email: "", role: "HR Manager" }])}>
              + Add Authorized Person
            </button>
          </Section>

          <button className="save-btn">Save Company Settings</button>
        </form>
      </div>
    </AdminLayout>
  );
};

/* ---------- SMALL COMPONENTS ---------- */

const Header = () => (
  <div className="settings-head">
    <FiSettings />
    <h2>Company Settings</h2>
  </div>
);

const Section = ({ title, icon, children }) => (
  <div className="section">
    <h3>{icon} {title}</h3>
    {children}
  </div>
);

const Grid = ({ cols, children }) => (
  <div className={`grid grid-${cols}`}>{children}</div>
);

const Input = ({ label, value, onChange, type = "text", placeholder }) => (
  <div className="input-box">
    {label && <label>{label}</label>}
    <input type={type} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
  </div>
);

const Toggle = ({ label, checked, onChange }) => (
  <div className="toggle-box">
    <span>{label}</span>
    <div className={`toggle ${checked ? "on" : ""}`} onClick={() => onChange(!checked)} />
  </div>
);

const Select = ({ value, onChange }) => (
  <select value={value} onChange={(e) => onChange(e.target.value)}>
    <option value="HR Manager">HR Manager</option>
    <option value="Reporting Manager">Reporting Manager</option>
    <option value="Admin">Admin</option>
    <option value="Compliance Officer">Compliance Officer</option>
  </select>
);

const LogoUpload = ({ logo, API, setLogoFile }) => (
  <div className="input-box logo-box">
    <label>Company Logo</label>
    <div className="logo-upload-wrapper">
      <input
        type="file"
        accept="image/*"
        onChange={(e) => setLogoFile(e.target.files[0])}
        className="logo-file-input"
      />
      {logo && (
        <img
          src={API + logo}
          alt="logo"
          className="logo-preview"
        />
      )}
    </div>
  </div>
);

export default AdminSettings;