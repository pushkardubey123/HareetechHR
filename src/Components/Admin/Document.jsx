import React, { useEffect, useState } from "react";
import AdminLayout from "./AdminLayout";
import axios from "axios";
import { Button, Card, Modal, Table, Form } from "react-bootstrap";
import {
  FaEye, FaTrash, FaUser, FaEnvelope,
  FaFolderOpen, FaCloudUploadAlt,
} from "react-icons/fa";
import Loader from "./Loader/Loader";
import Swal from "sweetalert2";
// Import the CSS file
import "./Document.css";

const Document = () => {
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [documentType, setDocumentType] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingEmployees, setLoadingEmployees] = useState(true);

  const token = JSON.parse(localStorage.getItem("user"))?.token;

  const axiosInstance = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
  });

  axiosInstance.interceptors.request.use((config) => {
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });

  const getAlertTheme = () => {
    const isDark = document.body.getAttribute('data-theme') === 'dark';
    return {
      background: isDark ? '#1e293b' : '#fff',
      color: isDark ? '#fff' : '#000'
    };
  };

  const fetchEmployees = async () => {
    try {
      setLoadingEmployees(true);
      const res = await axiosInstance.get("/user");
      setEmployees(res.data?.data || []);
    } catch {
      Swal.fire("Error", "Failed to load employees", "error");
    } finally {
      setLoadingEmployees(false);
    }
  };

  const fetchDocuments = async (emp) => {
    try {
      setSelectedEmployee(emp);
      setLoadingDocs(true);
      const res = await axiosInstance.get(`/api/documents/${emp._id}`);
      setDocuments(res.data?.data || []);
      setShowModal(true);
      setLoadingDocs(false);
    } catch {
      setLoadingDocs(false);
      Swal.fire("Error", "Failed to fetch documents", "error");
    }
  };

  const handleDelete = async (id) => {
    const theme = getAlertTheme();
    const confirm = await Swal.fire({
      title: "Delete this document?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Delete",
      confirmButtonColor: "#d33",
      background: theme.background,
      color: theme.color
    });

    if (confirm.isConfirmed) {
      try {
        await axiosInstance.delete(`/api/documents/${id}`);
        Swal.fire({ title: "Deleted", text: "Successfully deleted", icon: "success", background: theme.background, color: theme.color });
        if (selectedEmployee) fetchDocuments(selectedEmployee);
      } catch {
        Swal.fire({ title: "Error", text: "Delete Failed", icon: "error", background: theme.background, color: theme.color });
      }
    }
  };

  const handleUpload = async () => {
    const theme = getAlertTheme();
    if (!uploadFile || !documentType || !selectedEmployee?._id) {
      return Swal.fire({ title: "Error", text: "All fields are required", icon: "error", background: theme.background, color: theme.color });
    }

    const formData = new FormData();
    formData.append("employeeId", selectedEmployee._id);
    formData.append("documentType", documentType);
    formData.append("file", uploadFile);

    try {
      await axiosInstance.post("/api/documents/upload", formData);
      Swal.fire({ title: "Success", text: "Document uploaded", icon: "success", background: theme.background, color: theme.color });
      setUploadFile(null);
      setDocumentType("");
      fetchDocuments(selectedEmployee);
    } catch {
      Swal.fire({ title: "Error", text: "Upload Failed", icon: "error", background: theme.background, color: theme.color });
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  return (
    <AdminLayout>
      {/* Main Container Card */}
      <Card className="p-4 shadow-sm rounded-4 doc-main-card">
        <h4 className="mb-4 d-flex align-items-center gap-2 doc-title">
          <FaFolderOpen className="text-primary" /> Employee Documents
        </h4>
        
        <Form.Group className="mb-4">
          <Form.Control
            type="text"
            placeholder="Search employee by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="rounded-pill px-4 py-2 doc-search-input"
          />
        </Form.Group>

        {loadingEmployees ? (
          <div className="text-center py-5">
            <Loader />
          </div>
        ) : (
          <div className="row g-4">
            {employees.filter(
              (emp) =>
                emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                emp.email.toLowerCase().includes(searchQuery.toLowerCase())
            ).length === 0 ? (
              <div className="text-center empty-state">No employees found</div>
            ) : (
              employees
                .filter(
                  (emp) =>
                    emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    emp.email.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map((emp) => (
                  <div key={emp._id} className="col-md-6 col-lg-4">
                    <Card className="h-100 rounded-4 employee-card">
                      <Card.Body className="d-flex flex-column justify-content-between p-4">
                        <div className="mb-3">
                          <h5 className="fw-bold d-flex align-items-center gap-2 mb-2 emp-name">
                            <FaUser /> {emp.name}
                          </h5>
                          <p className="d-flex align-items-center gap-2 mb-0 emp-email">
                            <FaEnvelope /> {emp.email}
                          </p>
                        </div>
                        <div className="mt-auto text-end">
                          <Button
                            variant="primary"
                            className="text-white d-inline-flex align-items-center gap-2"
                            onClick={() => fetchDocuments(emp)}
                          >
                            <FaEye /> View Files
                          </Button>
                        </div>
                      </Card.Body>
                    </Card>
                  </div>
                ))
            )}
          </div>
        )}
      </Card>

      {/* Document Modal */}
      <Modal
        show={showModal}
        onHide={() => setShowModal(false)}
        size="lg"
        centered
        className="doc-modal" // Applied custom class for Modal styling
      >
        <Modal.Header closeButton>
          <Modal.Title>Documents: {selectedEmployee?.name}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {/* Upload Section */}
          <Card className="p-3 shadow-sm mb-4 rounded upload-section">
            <h6 className="mb-3 d-flex align-items-center gap-2">
              <FaCloudUploadAlt /> Upload New Document
            </h6>
            <Form.Group className="mb-2">
              <Form.Label className="doc-form-label">Document Type</Form.Label>
              <Form.Select
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value)}
                className="doc-form-select"
              >
                <option value="">-- Select Type --</option>
                <option value="Aadhaar">Aadhaar</option>
                <option value="PAN">PAN</option>
                <option value="Resume">Resume</option>
                <option value="Offer Letter">Offer Letter</option>
                <option value="Experience Letter">Experience Letter</option>
                <option value="Bank Details">Bank Details</option>
                <option value="Others">Others</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="doc-form-label">Upload File</Form.Label>
              <Form.Control
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => setUploadFile(e.target.files[0])}
                className="doc-form-control"
              />
            </Form.Group>
            <Button
              variant="success"
              className="d-inline-flex align-items-center gap-1"
              onClick={handleUpload}
              disabled={!uploadFile}
            >
              <FaCloudUploadAlt className="me-2" /> Upload
            </Button>
          </Card>

          {loadingDocs ? (
            <div className="text-center py-5">
              <Loader />
            </div>
          ) : (
            <Table
              hover
              responsive
              className="align-middle text-center doc-table"
            >
              <thead>
                <tr>
                  <th>#</th>
                  <th>Type</th>
                  <th>Uploaded By</th>
                  <th>Date</th>
                  <th>File</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {documents.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="empty-state">
                      No documents found
                    </td>
                  </tr>
                ) : (
                  documents.map((doc, i) => (
                    <tr key={doc._id}>
                      <td>{i + 1}</td>
                      <td>{doc.documentType}</td>
                      <td>{doc.uploadedBy?.name || "Unknown"}</td>
                      <td>{new Date(doc.uploadedAt).toLocaleDateString()}</td>
                      <td>
                        <a
                          href={`${import.meta.env.VITE_API_URL}/static/${doc.fileUrl}`}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-sm btn-outline-primary d-flex align-items-center justify-content-center gap-2"
                        >
                          <FaEye /> View
                        </a>
                      </td>
                      <td>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleDelete(doc._id)}
                        >
                          <FaTrash />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </AdminLayout>
  );
};

export default Document;