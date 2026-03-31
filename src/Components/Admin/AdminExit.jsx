import React, { useEffect, useState } from "react";
import DynamicLayout from "../Common/DynamicLayout";
import axios from "axios";
import { FaFileAlt, FaUser, FaEdit, FaSave, FaTrash, FaTimes } from "react-icons/fa";
import Swal from "sweetalert2";
import Loader from "./Loader/Loader";
import "./AdminExit.css";

const AdminExit = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(null);
  const [editData, setEditData] = useState({
    interviewFeedback: "",
    clearanceStatus: "",
    amount: "",
    settledOn: "",
  });

  // ✅ PERMISSION LOGIC
  const userStr = localStorage.getItem("user");
  const userObj = userStr ? JSON.parse(userStr) : null;
  const token = userObj?.token;
  const isAdmin = userObj?.role === "admin";
  const [perms, setPerms] = useState({ view: false, create: false, edit: false, delete: false });

  const axiosInstance = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
  });

  axiosInstance.interceptors.request.use((config) => {
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });

  useEffect(() => {
    const fetchPerms = async () => {
      if (isAdmin || !token) return;
      try {
        const res = await axiosInstance.get("/api/my-modules");
        if (res.data.detailed?.exit) {
          setPerms(res.data.detailed.exit);
        }
      } catch (e) {
        console.error("Permission fetch failed", e);
      }
    };
    fetchPerms();
    fetchRequests();
  }, [token, isAdmin]);

  const getAlertTheme = () => {
    const isDark = document.body.getAttribute('data-theme') === 'dark';
    return {
      background: isDark ? '#1e293b' : '#fff',
      color: isDark ? '#fff' : '#000'
    };
  };

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get("/api/exit/");
      setRequests(res.data?.data || []);
    } catch {
      Swal.fire("Error", "Failed to fetch exit requests", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    const theme = getAlertTheme();
    const confirm = await Swal.fire({
      title: "Delete this exit request?",
      text: "This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it",
      confirmButtonColor: "#ef4444",
      background: theme.background,
      color: theme.color
    });

    if (confirm.isConfirmed) {
      try {
        await axiosInstance.delete(`/api/exit/${id}`);
        Swal.fire({ title: "Deleted", text: "Request removed", icon: "success", background: theme.background, color: theme.color, timer: 1500, showConfirmButton: false });
        fetchRequests();
      } catch {
        Swal.fire({ title: "Error", text: "Failed to delete", icon: "error", background: theme.background, color: theme.color });
      }
    }
  };

  const handleEditClick = (req) => {
    setEditing(req._id);
    setEditData({
      interviewFeedback: req.interviewFeedback || "",
      clearanceStatus: req.clearanceStatus || "",
      amount: req.finalSettlement?.amount || "",
      settledOn: req.finalSettlement?.settledOn?.substring(0, 10) || "",
    });
  };

  const handleSave = async () => {
    const theme = getAlertTheme();
    try {
      await axiosInstance.put(`/api/exit/${editing}`, {
        interviewFeedback: editData.interviewFeedback,
        clearanceStatus: editData.clearanceStatus,
        finalSettlement: {
          amount: editData.amount,
          settledOn: editData.settledOn,
        },
      });
      setEditing(null);
      Swal.fire({ title: "Updated", text: "Exit request updated", icon: "success", background: theme.background, color: theme.color, timer: 1500, showConfirmButton: false });
      fetchRequests();
    } catch {
      Swal.fire({ title: "Error", text: "Failed to update", icon: "error", background: theme.background, color: theme.color });
    }
  };

  // ✅ ACTION CONDITIONS
  const canEdit = isAdmin || perms.edit;
  const canDelete = isAdmin || perms.delete;

  return (
    <DynamicLayout>
      <div className="exit-wrapper">
        <div className="exit-card">
          
          <div className="exit-header">
            <h4 className="exit-title">
              <FaFileAlt className="icon-primary me-2" /> Employee Exit Requests
            </h4>
            <p className="exit-subtitle">Manage offboarding process and final settlements.</p>
          </div>

          {loading ? (
            <div className="text-center py-5">
              <Loader />
            </div>
          ) : (
            <div className="exit-table-wrapper">
              <table className="exit-table">
                <thead>
                  <tr>
                    <th>S No.</th>
                    <th>Employee</th>
                    <th>Reason</th>
                    <th>Resign Date</th>
                    <th>Status</th>
                    <th>Feedback</th>
                    <th>Settlement</th>
                    {(canEdit || canDelete) && <th className="text-end">Action</th>}
                  </tr>
                </thead>
                <tbody>
                  {requests.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="text-center text-muted py-5 fw-bold">
                        No requests found
                      </td>
                    </tr>
                  ) : (
                    requests.map((r, i) => (
                      <tr key={r._id}>
                        <td data-label="S No.">
                          <span className="fw-bold opacity-50 index-number">{i + 1}</span>
                        </td>
                        <td data-label="Employee">
                          <div className="d-flex align-items-center gap-2">
                            <div className="exit-avatar">
                              <FaUser />
                            </div>
                            <span className="fw-bold dynamic-text-color">{r.employeeId?.name}</span>
                          </div>
                        </td>
                        <td data-label="Reason">
                          <span className="text-muted fw-medium">{r.reason}</span>
                        </td>
                        <td data-label="Resign Date" className="fw-medium dynamic-text-color">
                          {new Date(r.resignationDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                        <td data-label="Status">
                          <span className={`exit-status-badge ${r.clearanceStatus || 'pending'}`}>
                            {r.clearanceStatus || "Pending"}
                          </span>
                        </td>
                        <td data-label="Feedback">
                          {r.interviewFeedback ? (
                            <span className="text-muted small">{r.interviewFeedback}</span>
                          ) : (
                            <span className="text-muted opacity-50">--</span>
                          )}
                        </td>
                        <td data-label="Settlement">
                          {r.finalSettlement?.amount ? (
                            <div className="d-flex flex-column align-items-start">
                              <span className="fw-bold text-success fs-6">₹{r.finalSettlement.amount.toLocaleString()}</span>
                              <small className="text-muted fw-medium">
                                {new Date(r.finalSettlement.settledOn).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                              </small>
                            </div>
                          ) : (
                            <span className="text-muted opacity-50">--</span>
                          )}
                        </td>
                        
                        {(canEdit || canDelete) && (
                          <td data-label="Action" className="text-end mobile-action-left">
                            <div className="d-flex justify-content-end gap-2 actions-container">
                              {canEdit && (
                                <button
                                  className="exit-btn-icon btn-edit"
                                  title="Edit Request"
                                  onClick={() => handleEditClick(r)}
                                >
                                  <FaEdit />
                                </button>
                              )}

                              {canDelete && (
                                <button
                                  className="exit-btn-icon btn-delete"
                                  title="Delete Request"
                                  onClick={() => handleDelete(r._id)}
                                >
                                  <FaTrash />
                                </button>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ✅ CUSTOM PREMIUM MODAL FOR EDITING */}
        {editing && (
          <div className="exit-modal-overlay show" onClick={() => setEditing(null)}>
            <div className="exit-modal-dialog" onClick={(e) => e.stopPropagation()}>
              <div className="exit-modal-header">
                <h5 className="exit-modal-title">Update Exit Details</h5>
                <button className="exit-btn-close" onClick={() => setEditing(null)}><FaTimes /></button>
              </div>
              <div className="exit-modal-body">
                
                <div className="exit-form-group">
                  <label className="exit-form-label">Clearance Status</label>
                  <select
                    className="exit-input form-select"
                    value={editData.clearanceStatus}
                    onChange={(e) => setEditData({ ...editData, clearanceStatus: e.target.value })}
                  >
                    <option value="">-- Select Status --</option>
                    <option value="cleared">Cleared</option>
                    <option value="on-hold">On-Hold</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>

                <div className="exit-form-group">
                  <label className="exit-form-label">Interview Feedback</label>
                  <textarea
                    rows={2}
                    className="exit-input form-control"
                    placeholder="Enter HR feedback..."
                    value={editData.interviewFeedback}
                    onChange={(e) => setEditData({ ...editData, interviewFeedback: e.target.value })}
                  ></textarea>
                </div>

                <div className="row g-3">
                  <div className="col-md-6 exit-form-group mb-0">
                    <label className="exit-form-label">Settlement Amount (₹)</label>
                    <input
                      type="number"
                      className="exit-input form-control"
                      placeholder="e.g. 50000"
                      value={editData.amount}
                      onChange={(e) => setEditData({ ...editData, amount: e.target.value })}
                    />
                  </div>
                  <div className="col-md-6 exit-form-group mb-0">
                    <label className="exit-form-label">Settlement Date</label>
                    <input
                      type="date"
                      className="exit-input form-control date-input-fix"
                      value={editData.settledOn}
                      onChange={(e) => setEditData({ ...editData, settledOn: e.target.value })}
                    />
                  </div>
                </div>

              </div>
              <div className="exit-modal-footer">
                <button className="exit-btn-cancel" onClick={() => setEditing(null)}>Cancel</button>
                <button className="exit-btn-save" onClick={handleSave}><FaSave className="me-2" /> Save Changes</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </DynamicLayout>
  );
};

export default AdminExit;