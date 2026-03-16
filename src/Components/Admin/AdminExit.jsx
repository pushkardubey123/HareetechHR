import React, { useEffect, useState } from "react";
import DynamicLayout from "../Common/DynamicLayout";
import axios from "axios";
import { Button, Card, Form, Modal, Table, Badge } from "react-bootstrap";
import { FaFileAlt, FaUser, FaEdit, FaSave, FaTrash } from "react-icons/fa";
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
      confirmButtonColor: "#d33",
      background: theme.background,
      color: theme.color
    });

    if (confirm.isConfirmed) {
      try {
        await axiosInstance.delete(`/api/exit/${id}`);
        Swal.fire({ title: "Deleted", text: "Request removed", icon: "success", background: theme.background, color: theme.color });
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
      Swal.fire({ title: "Updated", text: "Exit request updated", icon: "success", background: theme.background, color: theme.color });
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
        <Card className="p-4 border-0 shadow-lg rounded-5 exit-card">
          <h4 className="d-flex align-items-center gap-2 mb-4 exit-title">
            <FaFileAlt className="text-primary" /> Employee Exit Requests
          </h4>

          {loading ? (
            <div className="text-center py-5">
              <Loader />
            </div>
          ) : (
            <Table
              bordered
              hover
              responsive
              className="align-middle text-center rounded-4 overflow-hidden shadow-sm exit-table"
            >
              <thead>
                <tr>
                  <th>S No.</th>
                  <th>Employee</th>
                  <th>Reason</th>
                  <th>Resign Date</th>
                  <th>Status</th>
                  <th>Feedback</th>
                  <th>Settlement</th>
                  {(canEdit || canDelete) && <th>Action</th>}
                </tr>
              </thead>
              <tbody>
                {requests.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-muted">
                      No requests found
                    </td>
                  </tr>
                ) : (
                  requests.map((r, i) => (
                    <tr key={r._id}>
                      <td>{i + 1}</td>
                      <td className="text-center px-3">
                        <div className="d-flex align-items-center gap-2 justify-content-center">
                          <FaUser className="text-secondary" />
                          {r.employeeId?.name}
                        </div>
                      </td>
                      <td>{r.reason}</td>
                      <td>
                        {new Date(r.resignationDate).toLocaleDateString()}
                      </td>
                      <td>
                        <Badge
                          bg={
                            r.clearanceStatus === "cleared" ? "success"
                              : r.clearanceStatus === "on-hold" ? "warning"
                              : "secondary"
                          }
                          className="rounded-pill px-3 pt-1 shadow-sm text-uppercase"
                        >
                          {r.clearanceStatus || "Pending"}
                        </Badge>
                      </td>
                      <td>
                        {r.interviewFeedback || (
                          <span className="text-muted">--</span>
                        )}
                      </td>
                      <td>
                        {r.finalSettlement?.amount ? (
                          <>
                            <span className="fw-bold text-success">₹{r.finalSettlement.amount}</span>
                            <br />
                            <small className="text-muted">
                              {new Date(r.finalSettlement.settledOn).toLocaleDateString()}
                            </small>
                          </>
                        ) : (
                          <span className="text-muted">--</span>
                        )}
                      </td>
                      
                      {/* ✅ ACTION BUTTONS CONTROLLED */}
                      {(canEdit || canDelete) && (
                         <td className="d-flex justify-content-center gap-2">
                           {canEdit && (
                              <Button
                                size="sm"
                                onClick={() => handleEditClick(r)}
                                style={{
                                  background: "linear-gradient(to right, #00c6ff, #0072ff)",
                                  border: "none", color: "#fff", borderRadius: "12px",
                                  boxShadow: "0 4px 12px rgba(0,114,255,0.4)",
                                }}
                              >
                                <FaEdit />
                              </Button>
                           )}

                           {canDelete && (
                              <Button
                                size="sm"
                                variant="danger"
                                style={{ borderRadius: "12px" }}
                                onClick={() => handleDelete(r._id)}
                              >
                                <FaTrash />
                              </Button>
                           )}
                         </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          )}
        </Card>
      </div>

      {/* Edit Modal (Stays same, only opened if they had edit button) */}
      <Modal show={!!editing} onHide={() => setEditing(null)} centered className="exit-modal">
        <Modal.Header closeButton className="exit-modal-header">
          <Modal.Title className="fw-bold">Update Exit Details</Modal.Title>
        </Modal.Header>
        <Modal.Body className="exit-modal-body">
          <Form.Group className="mb-3">
            <Form.Label className="fw-semibold">Interview Feedback</Form.Label>
            <Form.Control
              as="textarea"
              rows={2}
              value={editData.interviewFeedback}
              onChange={(e) => setEditData({ ...editData, interviewFeedback: e.target.value }) }
              className="exit-input"
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label className="fw-semibold">Clearance Status</Form.Label>
            <Form.Select
              value={editData.clearanceStatus}
              onChange={(e) => setEditData({ ...editData, clearanceStatus: e.target.value }) }
              className="exit-select"
            >
              <option value="">-- Select --</option>
              <option value="cleared">Cleared</option>
              <option value="on-hold">On-Hold</option>
              <option value="pending">Pending</option>
            </Form.Select>
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label className="fw-semibold">Settlement Amount</Form.Label>
            <Form.Control
              type="number"
              value={editData.amount}
              onChange={(e) => setEditData({ ...editData, amount: e.target.value }) }
              className="exit-input"
            />
          </Form.Group>
          <Form.Group>
            <Form.Label className="fw-semibold">Settlement Date</Form.Label>
            <Form.Control
              type="date"
              value={editData.settledOn}
              onChange={(e) => setEditData({ ...editData, settledOn: e.target.value }) }
              className="exit-input"
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer className="exit-modal-footer">
          <Button variant="secondary" onClick={() => setEditing(null)}>Cancel</Button>
          <Button variant="success" onClick={handleSave}><FaSave className="me-1" /> Save</Button>
        </Modal.Footer>
      </Modal>
    </DynamicLayout>
  );
};

export default AdminExit;