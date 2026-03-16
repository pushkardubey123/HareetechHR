import React, { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { 
  FaTrash, FaEye, FaBell, FaSearch, 
  FaCheckCircle, FaExclamationTriangle, FaInfoCircle, FaBolt,
  FaChevronLeft, FaChevronRight, FaUsers, FaUser, FaFilePdf, FaImage 
} from "react-icons/fa";
import DynamicLayout from "../Common/DynamicLayout";
import moment from "moment";
import Loader from "./Loader/Loader";
import "./NotificationHistory.css";

const NotificationHistory = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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
    fetchNotifications();
  }, [token, isAdmin]);

  useEffect(() => { setCurrentPage(1); }, [searchTerm]);

  const fetchNotifications = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/notifications/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    const isDark = document.body.getAttribute('data-theme') === 'dark';
    const confirm = await Swal.fire({
      title: "Delete this alert?",
      text: "This cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Delete",
      background: isDark ? '#1e293b' : '#fff',
      color: isDark ? '#fff' : '#000'
    });

    if (confirm.isConfirmed) {
      try {
        await axios.delete(`${import.meta.env.VITE_API_URL}/api/notifications/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setNotifications((prev) => prev.filter((n) => n._id !== id));
        Swal.fire({ title: "Deleted!", icon: "success", timer: 1500, showConfirmButton: false });
      } catch (err) {
        Swal.fire("Error", "Failed to delete", "error");
      }
    }
  };

  const getFileUrl = (file) => {
    if (!file) return null;
    const cleanPath = file.startsWith("uploads/") ? file.replace("uploads/", "") : file;
    return `${import.meta.env.VITE_API_URL}/static/${cleanPath}`;
  };

  const handlePreview = (notif) => {
    const fileUrl = getFileUrl(notif.image);
    const isDark = document.body.getAttribute('data-theme') === 'dark';
    
    let mediaHtml = '';
    if (fileUrl) {
      if (fileUrl.endsWith('.pdf')) {
        mediaHtml = `<div class="mt-3"><a href="${fileUrl}" target="_blank" class="btn btn-primary btn-sm"><i class="fa fa-file-pdf"></i> View Attachment</a></div>`;
      } else {
        mediaHtml = `<div class="mt-3"><img src="${fileUrl}" style="width:100%; max-height:250px; object-fit:cover; border-radius:8px;" /></div>`;
      }
    }

    Swal.fire({
      title: `<h5 class="fw-bold">${notif.title}</h5>`,
      html: `
        <div style="text-align:left; color:${isDark ? '#cbd5e1' : '#475569'}">
          <div style="font-size:0.85rem; margin-bottom:8px;">
            <span style="font-weight:600">To:</span> ${notif.recipient === 'all' ? 'Everyone' : notif.recipient?.name || 'User'}
          </div>
          <div style="background:${isDark ? '#334155' : '#f1f5f9'}; padding:12px; border-radius:8px; line-height:1.6;">
            ${notif.message}
          </div>
          ${mediaHtml}
        </div>
      `,
      showConfirmButton: false,
      showCloseButton: true,
      background: isDark ? '#1e293b' : '#fff',
      color: isDark ? '#fff' : '#000'
    });
  };

  const getTypeIcon = (type) => {
    switch(type) {
        case 'success': return <div className="type-badge t-success"><FaCheckCircle/></div>;
        case 'warning': return <div className="type-badge t-warning"><FaBolt/></div>;
        case 'danger': return <div className="type-badge t-danger"><FaExclamationTriangle/></div>;
        default: return <div className="type-badge t-info"><FaInfoCircle/></div>;
    }
  };

  const filteredList = notifications.filter(n => 
    n.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    n.message.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredList.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredList.slice(indexOfFirstItem, indexOfLastItem);

  const canDelete = isAdmin || perms.delete;

  return (
    <DynamicLayout>
      <div className="history-container">
        <div className="history-card">
          <div className="history-header">
            <div>
              <h4 className="fw-bold mb-1 d-flex align-item-center" style={{color: 'var(--nh-text-main)'}}>
                <FaBell className="text-primary me-2" /> Notification Log
              </h4>
              <p className="small mb-0" style={{color: 'var(--nh-text-muted)'}}>
                Archive of alerts, announcements & updates
              </p>
            </div>
            
            <div className="search-wrapper">
              <FaSearch className="search-icon" />
              <input 
                type="text" className="search-input" 
                placeholder="Search by title or message..." 
                value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="history-table-wrapper">
            {loading ? (
              <div className="p-5 text-center"><Loader /></div>
            ) : filteredList.length === 0 ? (
              <div className="empty-state">
                <div className="opacity-25 fs-1 mb-3">📭</div>
                <h6>No notifications found</h6>
              </div>
            ) : (
              <table className="premium-table">
                <thead>
                  <tr>
                    <th style={{width: '70px'}}>Type</th>
                    <th>Details</th>
                    <th>Audience</th>
                    <th>Date Sent</th>
                    <th className="text-center">File</th>
                    <th className="text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.map((notif) => {
                    const iconType = notif.type === 'danger' ? 'danger' : notif.type || 'info';
                    return (
                      <tr key={notif._id}>
                        <td>{getTypeIcon(iconType)}</td>
                        <td style={{maxWidth: '300px'}}>
                          <div className="fw-bold text-truncate" style={{color: 'var(--nh-text-main)'}}>
                            {notif.title}
                          </div>
                          <div className="text-truncate small" style={{color: 'var(--nh-text-muted)'}}>
                            {notif.message}
                          </div>
                        </td>
                        <td>
                          <div className="recipient-pill">
                            {notif.recipient === "all" ? <FaUsers className="text-primary"/> : <FaUser className="text-info"/>}
                            <span>{notif.recipient === "all" ? "All Staff" : notif.recipient?.name || "Private"}</span>
                          </div>
                        </td>
                        <td>
                          <div className="d-flex flex-column small">
                            <span className="fw-bold" style={{color: 'var(--nh-text-main)'}}>
                                {moment(notif.createdAt).format("DD MMM, YYYY")}
                            </span>
                            <span style={{color: 'var(--nh-text-muted)'}}>
                                {moment(notif.createdAt).format("hh:mm A")}
                            </span>
                          </div>
                        </td>
                        <td className="text-center">
                          {notif.image ? (
                             <span className="badge bg-light text-dark border">
                               {notif.image.endsWith('.pdf') ? <><FaFilePdf className="text-danger me-1"/> PDF</> : <><FaImage className="text-primary me-1"/> IMG</>}
                             </span>
                          ) : (
                             <span className="text-muted small">-</span>
                          )}
                        </td>
                        <td>
                          <div className="d-flex justify-content-center gap-2">
                            <button className="action-btn btn-view" onClick={() => handlePreview(notif)} title="View">
                              <FaEye />
                            </button>
                            {/* ✅ PROTECTED DELETE BUTTON */}
                            {canDelete && (
                              <button className="action-btn btn-del" onClick={() => handleDelete(notif._id)} title="Delete">
                                <FaTrash />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {!loading && filteredList.length > 0 && (
            <div className="pagination-footer">
                <span className="page-info">
                    Showing <span className="fw-bold text-primary">{indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredList.length)}</span> of {filteredList.length}
                </span>
                
                <div className="d-flex gap-2">
                    <button className="pg-btn" disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)}>
                        <FaChevronLeft />
                    </button>
                    
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter(num => num === 1 || num === totalPages || (num >= currentPage - 1 && num <= currentPage + 1))
                        .map((num, idx, arr) => (
                           <React.Fragment key={num}>
                               {idx > 0 && num !== arr[idx - 1] + 1 && <span className="mx-1">...</span>}
                               <button 
                                  className={`pg-btn ${currentPage === num ? 'active' : ''}`}
                                  onClick={() => setCurrentPage(num)}
                               >
                                  {num}
                               </button>
                           </React.Fragment>
                        ))
                    }

                    <button className="pg-btn" disabled={currentPage === totalPages} onClick={() => setCurrentPage(prev => prev + 1)}>
                        <FaChevronRight />
                    </button>
                </div>
            </div>
          )}

        </div>
      </div>
    </DynamicLayout>
  );
};

export default NotificationHistory;