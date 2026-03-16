import React, { useEffect, useState } from "react";
import DynamicLayout from "../Common/DynamicLayout";
import axios from "axios";
import { Button, Card, Form, Modal, Badge, Row, Col } from "react-bootstrap";
import { FaLaptop, FaPlus, FaClock, FaCheckCircle, FaExclamationCircle, FaKeyboard } from "react-icons/fa";
import Swal from "sweetalert2";
import Loader from "../Admin/Loader/Loader"; // Adjust path according to your structure
import "./EmployeeAssetPortal.css";

const EmployeeAssetPortal = () => {
  const [myAssets, setMyAssets] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [requestData, setRequestData] = useState({ category: "Hardware", notes: "" });

  const token = JSON.parse(localStorage.getItem("user"))?.token;

  const axiosInstance = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
  });

  axiosInstance.interceptors.request.use((config) => {
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });

  useEffect(() => {
    fetchMyAssets();
  }, []);

  const fetchMyAssets = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get("/api/assets/my-assets");
      setMyAssets(res.data?.data || []);
    } catch (err) {
      Swal.fire("Error", "Failed to load your assets", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    if (!requestData.notes) {
      return Swal.fire("Required", "Please provide a reason or details for the request.", "warning");
    }

    try {
      await axiosInstance.post("/api/assets/request", requestData);
      setShowModal(false);
      setRequestData({ category: "Hardware", notes: "" });
      Swal.fire("Requested!", "Your asset request has been sent to the IT Department.", "success");
      fetchMyAssets(); // Refresh list
    } catch (err) {
      Swal.fire("Error", "Failed to submit request", "error");
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "Assigned":
        return <Badge bg="success" className="asset-badge"><FaCheckCircle className="me-1"/> Assigned</Badge>;
      case "Requested":
        return <Badge bg="warning" text="dark" className="asset-badge"><FaClock className="me-1"/> Pending Approval</Badge>;
      case "Returned":
        return <Badge bg="secondary" className="asset-badge">Returned</Badge>;
      default:
        return <Badge bg="info" className="asset-badge">{status}</Badge>;
    }
  };

  return (
    <DynamicLayout>
      <div className="emp-asset-wrapper">
        <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
          <div>
            <h4 className="d-flex align-items-center gap-2 mb-1 fw-bold emp-asset-title">
              <FaLaptop className="text-primary" /> My Assets
            </h4>
            <p className="text-muted mb-0 small">Manage your company-provided devices and software</p>
          </div>
          <Button className="btn-request-asset" onClick={() => setShowModal(true)}>
            <FaPlus className="me-2" /> Request New Asset
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-5"><Loader /></div>
        ) : myAssets.length === 0 ? (
          <Card className="empty-asset-card text-center p-5 border-0 shadow-sm rounded-4">
            <FaExclamationCircle className="text-muted mb-3" size={40} />
            <h5>No Assets Found</h5>
            <p className="text-muted">You do not have any active assets or pending requests.</p>
          </Card>
        ) : (
          <Row className="g-4">
            {myAssets.map((item) => (
              <Col lg={4} md={6} sm={12} key={item._id}>
                <Card className="emp-asset-card border-0 shadow-sm rounded-4 h-100">
                  <Card.Body className="p-4">
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <div className="asset-icon-box">
                        {item.assetId?.category === "Software" ? <FaLaptop /> : <FaKeyboard />}
                      </div>
                      {getStatusBadge(item.status)}
                    </div>
                    
                    <h5 className="fw-bold mb-1 asset-name-text">
                      {item.assetId ? item.assetId.assetName : `Requested: ${item.notes.split(" ")[0]}...`}
                    </h5>
                    
                    <div className="text-muted small mb-3">
                      {item.assetId ? (
                        <>Serial No: <strong>{item.assetId.serialNumber}</strong></>
                      ) : (
                        <span className="fst-italic">Waiting for IT assignment</span>
                      )}
                    </div>

                    <hr className="asset-divider" />

                    <div className="d-flex justify-content-between align-items-center small text-muted">
                      <span><strong>Date:</strong> {new Date(item.issueDate).toLocaleDateString()}</span>
                      {item.status === "Assigned" && (
                        <span><strong>Condition:</strong> <span className="text-success">{item.conditionOnIssue}</span></span>
                      )}
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </div>

      {/* Asset Request Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered className="asset-request-modal">
        <Modal.Header closeButton>
          <Modal.Title className="fw-bold"><FaPlus className="me-2 text-primary" /> Request IT Asset</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleRequestSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">Asset Category</Form.Label>
              <Form.Select 
                value={requestData.category} 
                onChange={(e) => setRequestData({ ...requestData, category: e.target.value })}
                className="custom-input"
              >
                <option value="Hardware">Hardware (Mouse, Keyboard, Monitor)</option>
                <option value="Software">Software / License</option>
                <option value="Access">Access (ID Card, Badge)</option>
                <option value="Other">Other</option>
              </Form.Select>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label className="fw-semibold">Request Details / Reason</Form.Label>
              <Form.Control 
                as="textarea" 
                rows={3} 
                placeholder="e.g., I need a new wireless mouse because my current one is broken."
                value={requestData.notes}
                onChange={(e) => setRequestData({ ...requestData, notes: e.target.value })}
                required
                className="custom-input"
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer className="border-0 bg-light">
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button variant="primary" type="submit" className="px-4">Submit Request</Button>
          </Modal.Footer>
        </Form>
      </Modal>

    </DynamicLayout>
  );
};

export default EmployeeAssetPortal;