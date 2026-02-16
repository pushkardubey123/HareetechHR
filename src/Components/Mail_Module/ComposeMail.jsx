import React, { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import Select from "react-select";
import { useLocation, useNavigate } from "react-router-dom";
import { 
  MdAttachFile, 
  MdOutlineEmail, 
  MdSave, 
  MdClose, 
  MdDeleteOutline 
} from "react-icons/md";
import { FaPaperPlane, FaTimes } from "react-icons/fa";
import "./ComposeMail.css"; // We will create this CSS file below

const ComposeMail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const token = JSON.parse(localStorage.getItem("user"))?.token;

  const [formData, setFormData] = useState({
    to: [],
    subject: "",
    message: "",
    files: [],
  });

  const [employeeOptions, setEmployeeOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false); // For minimize effect (optional future use)

  // --- 1. Fetch Employees ---
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL}/mail/user/all`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        const loggedInEmail = JSON.parse(localStorage.getItem("user"))?.email;
        const options = res.data.data
          .filter((u) => u.email !== loggedInEmail)
          .map((u) => ({ label: u.email, value: u.email }));

        setEmployeeOptions(options);
      } catch (err) {
        console.error("Error fetching employees:", err);
      }
    };
    fetchEmployees();
  }, [token]);

  // --- 2. Load Draft Data ---
  useEffect(() => {
    if (location.state?.draftData) {
      const { recipients, subject, message } = location.state.draftData;
      const formattedRecipients = recipients.map(r => ({ label: r, value: r }));
      setFormData({
        to: formattedRecipients,
        subject: subject || "",
        message: message || "",
        files: [], 
      });
    }
  }, [location.state]);

  // --- 3. Handlers ---
  const handleFileChange = (e) => {
    setFormData({ ...formData, files: Array.from(e.target.files) });
  };

  const removeFile = (index) => {
    const updatedFiles = formData.files.filter((_, i) => i !== index);
    setFormData({ ...formData, files: updatedFiles });
  };

  const handleSubmit = async (e, isDraft = false) => {
    e.preventDefault();

    if (!isDraft && (!formData.to.length || !formData.subject)) {
      return Swal.fire("Required", "Please add a recipient and a subject.", "warning");
    }

    setLoading(true);
    const data = new FormData();
    const recipientEmails = formData.to.map((t) => t.value).join(",");
    
    data.append("to", recipientEmails);
    data.append("subject", formData.subject);
    data.append("message", formData.message);

    formData.files.forEach((file, i) => {
      data.append(`file${i}`, file);
    });

    const endpoint = isDraft ? "/mail/draft" : "/mail/send";
    
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}${endpoint}`, data, {
        headers: { 
          Authorization: `Bearer ${token}`, 
          "Content-Type": "multipart/form-data" 
        },
      });

      Swal.fire({
        icon: "success",
        title: isDraft ? "Draft Saved" : "Sent",
        text: isDraft ? "Message saved to drafts." : "Message sent successfully.",
        timer: 1500,
        showConfirmButton: false
      });
      navigate(isDraft ? "/mail/drafts" : "/mail/inbox");
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Operation failed. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  // Custom Styles for React Select to match Dark/Light Mode
  const customSelectStyles = {
    control: (base) => ({
      ...base,
      backgroundColor: 'var(--mail-input-bg)',
      borderColor: 'var(--mail-border)',
      color: 'var(--mail-text-main)',
      minHeight: '45px',
      boxShadow: 'none',
      '&:hover': { borderColor: '#3b82f6' }
    }),
    menu: (base) => ({
      ...base,
      backgroundColor: 'var(--mail-card-bg)',
      zIndex: 9999
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isFocused ? 'var(--mail-active-bg)' : 'transparent',
      color: 'var(--mail-text-main)',
      cursor: 'pointer'
    }),
    multiValue: (base) => ({
      ...base,
      backgroundColor: 'var(--mail-active-bg)',
    }),
    multiValueLabel: (base) => ({
      ...base,
      color: 'var(--mail-text-main)',
    }),
    input: (base) => ({
        ...base,
        color: 'var(--mail-text-main)',
    }),
    singleValue: (base) => ({
        ...base,
        color: 'var(--mail-text-main)',
    })
  };

  return (
    <div className="compose-container fade-in">
      <div className="compose-card">
        
        {/* --- HEADER --- */}
        <div className="compose-header">
          <div className="d-flex align-items-center gap-2">
            <h5 className="m-0 fw-bold">
              {location.state?.draftData ? "Edit Draft" : "New Message"}
            </h5>
          </div>
          <button className="btn-icon-close" onClick={() => navigate(-1)}>
            <MdClose size={20} />
          </button>
        </div>

        {/* --- BODY --- */}
        <div className="compose-body">
          
          {/* Recipient Input */}
          <div className="compose-field">
            <label>To</label>
            <div className="flex-grow-1">
              <Select
                isMulti
                options={employeeOptions}
                value={formData.to}
                onChange={(val) => setFormData({ ...formData, to: val })}
                placeholder="Recipients"
                styles={customSelectStyles}
                classNamePrefix="react-select"
              />
            </div>
          </div>

          {/* Subject Input */}
          <div className="compose-field">
            <label>Subject</label>
            <input
              type="text"
              className="compose-input"
              placeholder="Subject"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
            />
          </div>

          {/* Message Textarea */}
          <div className="compose-editor">
            <textarea
              className="compose-textarea"
              placeholder="Type your message here..."
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            ></textarea>
          </div>

          {/* Attachment List Preview */}
          {formData.files.length > 0 && (
            <div className="attachment-list">
              {formData.files.map((file, idx) => (
                <div key={idx} className="attachment-chip">
                  <span className="text-truncate" style={{maxWidth: '150px'}}>{file.name}</span>
                  <span className="text-muted ms-1">({(file.size / 1024).toFixed(0)} KB)</span>
                  <button type="button" onClick={() => removeFile(idx)}>
                    <FaTimes size={10} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* --- FOOTER --- */}
        <div className="compose-footer">
          <div className="d-flex align-items-center gap-3">
            <button
              className="btn-send"
              onClick={(e) => handleSubmit(e, false)}
              disabled={loading}
            >
              {loading ? "Sending..." : "Send"} <FaPaperPlane className="ms-2" size={12} />
            </button>

            <label className="btn-attach" title="Attach files">
              <MdAttachFile size={22} />
              <input 
                type="file" 
                multiple 
                hidden 
                onChange={handleFileChange} 
              />
            </label>
          </div>

          <button
            className="btn-draft"
            onClick={(e) => handleSubmit(e, true)}
            disabled={loading}
            title="Save as Draft"
          >
            <MdSave size={20} className="me-1"/> 
            <span className="d-none d-sm-inline">Save Draft</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ComposeMail;