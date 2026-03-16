import React, { useEffect, useState } from "react";
import { Modal, Button, Form, Badge, Table } from "react-bootstrap";
import axios from "axios";
import Swal from "sweetalert2";
import {
  FaPhoneAlt,
  FaEnvelope,
  FaStickyNote,
  FaHandshake,
  FaUserTie,
} from "react-icons/fa";

const activityIcons = {
  Call: <FaPhoneAlt />,
  Email: <FaEnvelope />,
  Note: <FaStickyNote />,
  Meeting: <FaHandshake />,
};

const LeadActivityModal = ({ show, handleClose, lead }) => {
  const [activities, setActivities] = useState([]);
  const [activityType, setActivityType] = useState("Call");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  // ✅ PERMISSION LOGIC
  const user = JSON.parse(localStorage.getItem("user"));
  const token = user?.token;
  const userId = user?.id;
  const isAdmin = user?.role === "admin";
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
        const res = await axiosInstance.get(`/api/my-modules`);
        if (res.data.detailed?.lms) {
          setPerms(res.data.detailed.lms);
        }
      } catch (e) { console.error("Permission fetch failed", e); }
    };
    fetchPerms();
  }, [token, isAdmin, axiosInstance]);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get(`/api/leads/activity/${lead._id}`);
      setActivities(res.data.data);
    } catch {
      Swal.fire("Error", "Failed to load activities", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (lead && show) fetchActivities();
  }, [lead, show]);

  const handleAddActivity = async () => {
    if (!description.trim()) return;
    try {
      await axiosInstance.post("/api/leads/activity", {
        leadId: lead._id,
        activityType,
        description,
        employeeId: userId,
      });
      setDescription("");
      fetchActivities();
    } catch {
      Swal.fire("Error", "Failed to add activity", "error");
    }
  };

  const canCreate = isAdmin || perms.create;

  return (
    <Modal size="lg" show={show} onHide={handleClose}>
      <Modal.Header closeButton>
        <Modal.Title>
          Activity Timeline – <span className="text-primary">{lead?.title}</span>
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {/* ✅ PROTECTED ADD ACTIVITY */}
        {canCreate && (
          <div className="border rounded p-3 mb-3 bg-light">
            <Form>
              <Form.Group className="mb-2">
                <Form.Label>Activity Type</Form.Label>
                <Form.Select
                  value={activityType}
                  onChange={(e) => setActivityType(e.target.value)}
                >
                  <option value="Call">📞 Call</option>
                  <option value="Email">✉️ Email</option>
                  <option value="Meeting">🤝 Meeting</option>
                  <option value="Note">📝 Note</option>
                </Form.Select>
              </Form.Group>

              <Form.Group className="mb-2">
                <Form.Label>Description</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={description}
                  placeholder="Write details of discussion / follow-up..."
                  onChange={(e) => setDescription(e.target.value)}
                />
              </Form.Group>

              <Button onClick={handleAddActivity} variant="primary">
                Add Activity
              </Button>
            </Form>
          </div>
        )}

        {/* ACTIVITY LIST */}
        <Table bordered hover responsive>
          <thead className="table-dark text-center">
            <tr>
              <th>#</th>
              <th>Type</th>
              <th>Description</th>
              <th>Employee</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody className="text-center">
            {loading ? (
              <tr><td colSpan="5">Loading...</td></tr>
            ) : activities.length === 0 ? (
              <tr><td colSpan="5" className="text-muted">No activities added yet</td></tr>
            ) : (
              activities.map((act, i) => (
                <tr key={act._id}>
                  <td>{i + 1}</td>
                  <td>
                    <Badge bg="secondary" className="d-flex gap-1 align-items-center justify-content-center">
                      {activityIcons[act.activityType]} {act.activityType}
                    </Badge>
                  </td>
                  <td className="text-start">{act.description}</td>
                  <td>
                    <span className="d-inline-flex align-items-center gap-1">
                      <FaUserTie /> {act.employeeId?.name || "System"}
                    </span>
                  </td>
                  <td>{new Date(act.activityDate).toLocaleString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose}>Close</Button>
      </Modal.Footer>
    </Modal>
  );
};

export default LeadActivityModal;