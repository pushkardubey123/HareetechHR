import React, { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { FaBell, FaPaperPlane, FaImage, FaMagic, FaInfoCircle, FaCheckCircle, FaExclamationTriangle, FaEraser, FaBolt } from "react-icons/fa";
import DynamicLayout from "../Common/DynamicLayout";
import "./SendNotification.css";

const templates = {
  "Announcement": { icon: <FaBell />, color: "#4f46e5", message: "📢 Announcement: {title} for {branch} from {start} to {end}", placeholders: ["title", "branch", "start", "end"] },
  "Meeting": { icon: <FaInfoCircle />, color: "#0ea5e9", message: "📅 Meeting Alert: Join us on {date} at {time} for {topic}", placeholders: ["date", "time", "topic"] },
  "Award": { icon: <FaCheckCircle />, color: "#10b981", message: "🏆 Congratulations {name}! You have been awarded {award_name}", placeholders: ["name", "award_name"] },
  "Urgent": { icon: <FaExclamationTriangle />, color: "#ef4444", message: "🚨 Urgent Action Required: {action} by {deadline}", placeholders: ["action", "deadline"] },
};

const SendNotification = () => {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [recipient, setRecipient] = useState("");
  const [type, setType] = useState("info");
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [template, setTemplate] = useState("");
  const [templateValues, setTemplateValues] = useState({});
  const [loading, setLoading] = useState(false);

  // ✅ PERMISSION LOGIC
  const userStr = localStorage.getItem("user");
  const userObj = userStr ? JSON.parse(userStr) : null;
  const token = userObj?.token;
  const isAdmin = userObj?.role === "admin";
  const [perms, setPerms] = useState({ view: false, create: false, edit: false, delete: false });

  useEffect(() => {
    const fetchPerms = async () => {
      if (isAdmin || !token) return;
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/my-modules`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.detailed?.notification) {
          setPerms(res.data.detailed.notification);
        }
      } catch (e) { console.error("Permission fetch failed", e); }
    };
    fetchPerms();
    
    const fetchEmployees = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/user`, { headers: { Authorization: `Bearer ${token}` } });
        setEmployees(res.data.data || []);
      } catch (err) { console.error(err); }
    };
    fetchEmployees();
  }, [token, isAdmin]);

  const handleTemplateClick = (key) => {
    if (template === key) {
      setTemplate(""); setMessage(""); setTemplateValues({});
    } else {
      setTemplate(key); setTemplateValues({}); setMessage(templates[key].message);
      if(key === 'Award') setType('success');
      else if(key === 'Urgent') setType('warning');
      else setType('info');
    }
  };

  const handlePlaceholderChange = (key, value) => {
    const updatedValues = { ...templateValues, [key]: value };
    setTemplateValues(updatedValues);
    let newMessage = templates[template]?.message || "";
    for (let k in updatedValues) {
      newMessage = newMessage.replaceAll(`{${k}}`, updatedValues[k]);
    }
    setMessage(newMessage);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) { setImage(file); setPreview(URL.createObjectURL(file)); }
  };

  const resetForm = () => {
    setTitle(""); setMessage(""); setRecipient(""); setImage(null);
    setPreview(null); setTemplate(""); setTemplateValues({}); setType("info");
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!title || !message) return Swal.fire("Missing Data", "Title and Message are required", "error");

    setLoading(true);
    const formData = new FormData();
    formData.append("title", title);
    formData.append("message", message);
    formData.append("recipient", recipient || "all");
    formData.append("type", type);
    if (image) formData.append("image", image);

    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/notifications/send`, formData, { headers: { Authorization: `Bearer ${token}` } });
      Swal.fire("Sent!", res.data.message, "success");
      resetForm();
    } catch (err) { Swal.fire("Error", "Failed to send notification", "error"); } 
    finally { setLoading(false); }
  };

  const getTypeColor = () => {
    switch(type) {
      case 'success': return '#10b981';
      case 'warning': return '#ef4444'; 
      default: return '#4f46e5';
    }
  };

  const canCreate = isAdmin || perms.create;

  return (
    <DynamicLayout>
      <div className="sn-container">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h3 className="fw-bold mb-1" style={{color: 'var(--sn-text-main)'}}><FaBolt className="text-warning me-2"/> Notification Hub</h3>
            <p className="small mb-0" style={{color: 'var(--sn-text-muted)'}}>Create and broadcast updates to your organization</p>
          </div>
          <button className="sn-btn-reset d-flex align-items-center gap-2" onClick={resetForm}><FaEraser /> Clear Form</button>
        </div>

        <div className="row g-4">
          <div className="col-lg-7 col-xl-8">
            <div className="sn-card h-100">
              
              <div className="mb-4">
                <label className="sn-label d-flex align-item-center"><FaMagic className="me-2 mt-1"/> Quick Templates</label>
                <div className="sn-chip-container">
                  {Object.keys(templates).map((temp) => (
                    <div key={temp} className={`sn-chip ${template === temp ? 'active' : ''}`} onClick={() => handleTemplateClick(temp)}>
                        {templates[temp].icon} {temp}
                    </div>
                  ))}
                </div>

                {template && (
                  <div className="sn-template-box">
                    <label className="sn-label d-flex align-item-center"><FaMagic className="me-1" /> Auto-Fill Details</label>
                    <div className="row g-2">
                      {templates[template]?.placeholders.map(ph => (
                        <div className="col-md-6" key={ph}>
                          <input type="text" className="sn-input w-100 form-control-sm" placeholder={`Enter ${ph}...`} value={templateValues[ph] || ""} onChange={(e) => handlePlaceholderChange(ph, e.target.value)} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <form onSubmit={handleSend}>
                <div className="row g-3">
                    <div className="col-md-8">
                        <div className="mb-3">
                            <label className="sn-label">Title</label>
                            <input type="text" className="sn-input w-100" placeholder="e.g. System Update" value={title} onChange={e => setTitle(e.target.value)} />
                        </div>
                    </div>
                    <div className="col-md-4">
                        <div className="mb-3">
                            <label className="sn-label">Priority Type</label>
                            <select className="sn-input w-100 form-select" value={type} onChange={e => setType(e.target.value)}>
                                <option value="info">🔵 Info</option>
                                <option value="success">🟢 Success</option>
                                <option value="warning">🔴 Urgent</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="mb-3">
                    <label className="sn-label">Message Content</label>
                    <textarea rows="4" className="sn-input w-100" placeholder="Type your notification message here..." value={message} onChange={e => setMessage(e.target.value)}></textarea>
                </div>

                <div className="row g-3 mb-4">
                    <div className="col-md-6">
                        <label className="sn-label">Target Audience</label>
                        <select className="sn-input w-100 form-select" value={recipient} onChange={e => setRecipient(e.target.value)}>
                            <option value="">Select Recipient</option>
                            <option value="all">📢 All Employees</option>
                            {employees.map(emp => <option key={emp._id} value={emp._id}>{emp.name}</option>)}
                        </select>
                    </div>
                    <div className="col-md-6">
                        <label className="sn-label">Attachment (Optional)</label>
                        <input type="file" className="sn-input w-100" onChange={handleImageChange} accept="image/*"/>
                    </div>
                </div>

                {/* ✅ PROTECTED SEND BUTTON */}
                {canCreate ? (
                  <button type="submit" className="sn-btn-primary" disabled={loading}>
                      {loading ? <div className="spinner-border spinner-border-sm" /> : <><FaPaperPlane /> <span>Send Notification</span></>}
                  </button>
                ) : (
                  <div className="alert alert-secondary mt-3">You do not have permission to send notifications.</div>
                )}
              </form>

            </div>
          </div>

          {/* Right Mobile Preview */}
          <div className="col-lg-5 col-xl-4 d-none d-lg-block">
             <div className="sn-mobile-wrapper">
                <div className="sn-phone-frame">
                    <div className="sn-phone-notch"></div>
                    <div className="sn-screen">
                        <div className="text-center text-muted small mb-4 mt-2" style={{opacity: 0.6}}>
                            {new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long'})}
                        </div>
                        <div className="sn-notif-card" style={{borderLeftColor: getTypeColor()}}>
                            <div className="sn-notif-header">
                                <div className="d-flex align-items-center gap-2">
                                    <div className="rounded p-1 text-white" style={{background: getTypeColor(), fontSize: '10px'}}>
                                        {type === 'success' ? <FaCheckCircle/> : <FaBell/>}
                                    </div>
                                    <span className="sn-app-name">Admin App</span>
                                </div>
                                <span className="sn-time">Now</span>
                            </div>
                            <div className="sn-notif-title">{title || "Notification Title"}</div>
                            <div className="sn-notif-body">{message || "Your message will appear here. Try selecting a template or typing in the box."}</div>
                            {preview && <img src={preview} alt="Preview" className="sn-notif-img"/>}
                        </div>

                        {[1, 2].map(i => (
                            <div key={i} className="sn-notif-card" style={{opacity: 0.4, transform: 'scale(0.98)', marginTop: '-5px'}}>
                                <div className="sn-notif-header">
                                    <span className="sn-app-name">System</span><span className="sn-time">2h ago</span>
                                </div>
                                <div className="sn-notif-body">Previous notification content...</div>
                            </div>
                        ))}
                    </div>
                </div>
             </div>
             <div className="text-center mt-3 text-muted fst-italic small">Live User Preview</div>
          </div>
        </div>
      </div>
    </DynamicLayout>
  );
};

export default SendNotification;