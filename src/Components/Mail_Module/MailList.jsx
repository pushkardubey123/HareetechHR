import React, { useEffect, useState, useContext } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { 
  FiStar, FiTrash2, FiAlertOctagon, FiPaperclip, 
  FiX, FiDownload, FiFile, FiImage, FiClock, FiInbox 
} from "react-icons/fi";
import { SettingsContext } from "../Redux/SettingsContext"; // Ensure path
import "./MailList.css"; 

const API = import.meta.env.VITE_API_URL;

const MailList = () => {
  const [mails, setMails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMail, setSelectedMail] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();
  const { user, loading: contextLoading } = useContext(SettingsContext); // 🔥 Context loading

  // 1. Determine Endpoint
  const getEndpoint = () => {
    const path = location.pathname;
    if (path.includes("starred")) return "/mail/starred";
    if (path.includes("spam")) return "/mail/spam";
    if (path.includes("drafts")) return "/mail/draft";
    if (path.includes("trash")) return "/mail/trash";
    return "/mail/my-mails"; 
  };

  const fetchMails = async () => {
    if (!user || !user._id) return;

    try {
      setLoading(true);
      const token = JSON.parse(localStorage.getItem("user"))?.token;
      
      const res = await axios.get(`${API}${getEndpoint()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (res.data.success) {
        let data = res.data.data;

        // --- STRICT FILTERING LOGIC ---
        // Ensure data belongs to current user ID to prevent Admin ghosting
        const currentUserId = user._id || user.id;

        if (location.pathname.includes("sent")) {
             // Only show mails SENT BY ME
             data = data.filter(m => m.sender?._id === currentUserId && !m.isDraft);
        } else if (location.pathname.includes("inbox")) {
             // Only show mails RECEIVED BY ME (Sender is NOT me)
             data = data.filter(m => m.sender?._id !== currentUserId && !m.isDraft);
        } else if (!location.pathname.includes("spam") && !location.pathname.includes("trash")) {
             // Default All Mails (excluding drafts)
             data = data.filter(m => !m.isDraft);
        }
        
        setMails(data);
      }
    } catch (err) {
      console.error("Mail Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  };

  // 🔥 Re-fetch when User ID changes (Login Switch)
  useEffect(() => {
    if (!contextLoading && user) {
        fetchMails();
    }
  }, [location.pathname, user, contextLoading]);

  // --- Handlers ---
  const handleAction = async (e, id, action) => {
    e.stopPropagation();
    const token = JSON.parse(localStorage.getItem("user"))?.token;
    
    // UI Optimistic Update
    if (action === "star") {
      setMails(prev => prev.map(m => 
        m._id === id ? { 
          ...m, 
          starredBy: m.starredBy.includes(user._id) 
            ? m.starredBy.filter(uid => uid !== user._id) 
            : [...m.starredBy, user._id] 
        } : m
      ));
    } else {
        setMails(prev => prev.filter(m => m._id !== id));
    }

    // Backend Sync
    try {
      let endpoint = "";
      if (action === "star") endpoint = `/mail/star/${id}`;
      if (action === "spam") endpoint = `/mail/spam/${id}`;
      if (action === "trash") endpoint = `/mail/trash/${id}`;

      await axios.put(`${API}${endpoint}`, {}, { headers: { Authorization: `Bearer ${token}` } });
    } catch (err) { fetchMails(); } // Revert on fail
  };

  const handleMailClick = (mail) => {
    if (mail.isDraft) {
      navigate("/mail/compose", { state: { draftData: mail } });
    } else {
      setSelectedMail(mail);
      setShowModal(true);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedMail(null);
  };

  const getFileIcon = (filename) => {
    if (filename.match(/\.(jpg|jpeg|png|gif|webp)$/i)) return <FiImage className="icon-img" />;
    if (filename.match(/\.(pdf)$/i)) return <FiFile className="icon-pdf" />;
    return <FiPaperclip className="icon-file" />;
  };

  const isStarred = (mail) => mail.starredBy?.includes(user?._id || user?.id);

  // --- Rendering ---
  if (contextLoading || loading) return <div className="loader-container">Syncing Mailbox...</div>;

  return (
    <div className="mail-list-container">
        
        {/* Title Bar */}
        <div className="list-top-bar" style={{padding: '12px 20px', borderBottom: '1px solid var(--mail-border)', fontWeight: '700', color: 'var(--mail-text-secondary)', fontSize: '14px', letterSpacing: '0.5px', textTransform: 'uppercase'}}>
            {location.pathname.includes("sent") ? "Sent Items" : 
             location.pathname.includes("inbox") ? "Inbox" : 
             location.pathname.includes("spam") ? "Spam Folder" : 
             location.pathname.includes("trash") ? "Trash Bin" : "All Messages"}
        </div>

        {mails.length === 0 ? (
            <div className="empty-state">
                <div className="empty-icon-circle"><FiInbox size={28} /></div>
                <h3>Folder is Empty</h3>
                <p>No messages found here.</p>
            </div>
        ) : (
            <div className="mail-rows-wrapper">
                {mails.map((mail) => (
                    <div key={mail._id} className="mail-item-row fade-in" onClick={() => handleMailClick(mail)}>
                        <div className="mail-left">
                            <div className={`star-btn ${isStarred(mail) ? 'active' : ''}`} onClick={(e) => handleAction(e, mail._id, "star")}>
                                <FiStar fill={isStarred(mail) ? "#f59e0b" : "none"} />
                            </div>
                            <span className="sender-name">
                                {mail.isDraft ? <span className="draft-tag">Draft</span> : (
                                    location.pathname.includes("sent") 
                                    ? `To: ${mail.recipients?.[0] || "Unknown"}`
                                    : (mail.sender?.name || mail.sender?.email || "Unknown")
                                )}
                            </span>
                        </div>

                        <div className="mail-center">
                            <span className="subject">{mail.subject || "(No Subject)"}</span>
                            <span className="snippet"> - {mail.message?.replace(/<[^>]+>/g, '').substring(0, 50)}...</span>
                        </div>

                        <div className="mail-right">
                            {mail.attachments?.length > 0 && <FiPaperclip className="att-icon" />}
                            <span className="date">{new Date(mail.createdAt).toLocaleDateString()}</span>
                            <div className="hover-actions">
                                {!location.pathname.includes("spam") && <button title="Spam" onClick={(e) => handleAction(e, mail._id, "spam")}><FiAlertOctagon /></button>}
                                <button title="Delete" onClick={(e) => handleAction(e, mail._id, "trash")}><FiTrash2 /></button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        )}

        {/* Modal Logic (Same as before) */}
        {showModal && selectedMail && (
            <div className="custom-modal-overlay" onClick={closeModal}>
                <div className="custom-modal-content" onClick={(e) => e.stopPropagation()}>
                    <div className="modal-header">
                        <div className="header-info">
                            <h2>{selectedMail.subject}</h2>
                            <div className="sub-header">
                                <span className="badge-pill">{selectedMail.sender?._id === (user?._id || user?.id) ? "Sent" : "Inbox"}</span>
                                <span className="timestamp"><FiClock /> {new Date(selectedMail.createdAt).toLocaleString()}</span>
                            </div>
                        </div>
                        <button className="close-btn" onClick={closeModal}><FiX size={24} /></button>
                    </div>

                    <div className="modal-body">
                        <div className="sender-info-box">
                            <div className="avatar">{(selectedMail.sender?.name || "U").charAt(0).toUpperCase()}</div>
                            <div className="details">
                                <span className="name">{selectedMail.sender?.name} {selectedMail.sender?._id === (user?._id || user?.id) && "(You)"}</span>
                                <span className="email">&lt;{selectedMail.sender?.email}&gt;</span>
                                <div className="to-list">To: {selectedMail.recipients?.join(", ")}</div>
                            </div>
                        </div>

                        <div className="mail-text-content" dangerouslySetInnerHTML={{__html: selectedMail.message}} />

                        {selectedMail.attachments?.length > 0 && (
                            <div className="attachments-wrapper">
                                <div className="att-header"><FiPaperclip /> <span>Attachments ({selectedMail.attachments.length})</span></div>
                                <div className="att-grid">
                                    {selectedMail.attachments.map((file, index) => (
                                        <div key={index} className="att-card">
                                            <div className="att-icon-box">{getFileIcon(file)}</div>
                                            <div className="att-details">
                                                <span className="att-name" title={file}>{file}</span>
                                                <a href={`${API}/mail/download/${file}`} target="_blank" rel="noreferrer" className="download-link">Download <FiDownload /></a>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                    <div className="modal-footer"><button className="btn-secondary" onClick={closeModal}>Close</button></div>
                </div>
            </div>
        )}
    </div>
  );
};

export default MailList;