import React, { useEffect, useState } from "react";
import EmployeeLayout from "../Common/DynamicLayout";
import axios from "axios";
import {
  FaCloudUploadAlt,
  FaTrash,
  FaEye,
  FaFileAlt,
  FaSyncAlt,
  FaFolderOpen,
  FaTimes
} from "react-icons/fa";
import Swal from "sweetalert2";
import Loader from "../Admin/Loader/Loader";
import "./EmployeeDocument.css"; // Nayi CSS file import karein

const EmployeeDocument = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  
  // Document Type States
  const [documentType, setDocumentType] = useState("");
  const [customDocType, setCustomDocType] = useState("");
  
  const [editingDocId, setEditingDocId] = useState(null);

  const user = JSON.parse(localStorage.getItem("user"));
  const employeeId = user?.id;
  const token = user?.token;

  const axiosInstance = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
  });

  axiosInstance.interceptors.request.use((config) => {
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get(`/api/documents/${employeeId}`);
      setDocuments(res.data?.data || []);
    } catch (err) {
      Swal.fire("Error", "Failed to fetch documents", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleUpload = async () => {
    const finalDocType = documentType === "Others" ? customDocType.trim() : documentType;

    if (!finalDocType || (!uploadFile && !editingDocId)) {
      return Swal.fire("Warning", "Document type and file are required", "warning");
    }

    const formData = new FormData();
    formData.append("employeeId", employeeId);
    formData.append("documentType", finalDocType);
    if (uploadFile) formData.append("file", uploadFile);

    try {
      if (editingDocId) {
        const res = await axiosInstance.put(`/api/documents/${editingDocId}`, formData);
        if (res.data.success) {
          Swal.fire({ title: "Updated", text: "Document updated successfully", icon: "success", timer: 1500, showConfirmButton: false });
        } else {
          Swal.fire("Failed", res.data.message || "Update failed", "error");
        }
      } else {
        const res = await axiosInstance.post("/api/documents/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        if (res.data.success) {
          Swal.fire({ title: "Uploaded", text: "Document uploaded successfully", icon: "success", timer: 1500, showConfirmButton: false });
        } else {
          Swal.fire("Failed", res.data.message || "Upload failed", "error");
        }
      }

      resetForm();
      fetchDocuments();
    } catch {
      Swal.fire("Error", "Something went wrong", "error");
    }
  };

  const handleDelete = async (id) => {
    const confirm = await Swal.fire({
      title: "Delete this document?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it!",
      confirmButtonColor: "#ef4444",
    });

    if (confirm.isConfirmed) {
      try {
        await axiosInstance.delete(`/api/documents/${id}`);
        Swal.fire({ title: "Deleted", text: "Document removed", icon: "success", timer: 1500, showConfirmButton: false });
        fetchDocuments();
      } catch {
        Swal.fire("Error", "Failed to delete", "error");
      }
    }
  };

  const handleEdit = (doc) => {
    setEditingDocId(doc._id);
    
    // Check if the doc type is in our standard list
    const standardTypes = ["Aadhaar", "PAN", "Resume", "Offer Letter", "Experience Letter", "Bank Details"];
    
    if (standardTypes.includes(doc.documentType)) {
      setDocumentType(doc.documentType);
      setCustomDocType("");
    } else {
      setDocumentType("Others");
      setCustomDocType(doc.documentType);
    }
    
    setUploadFile(null);
    document.getElementById("emp-file-upload").value = "";
    
    // Scroll smoothly to the top form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => {
    setUploadFile(null);
    setDocumentType("");
    setCustomDocType("");
    setEditingDocId(null);
    const fileInput = document.getElementById("emp-file-upload");
    if (fileInput) fileInput.value = "";
  };

  const isUploadDisabled = !documentType || (documentType === "Others" && !customDocType.trim()) || (!uploadFile && !editingDocId);

  return (
    <EmployeeLayout>
      <div className="zdoc-master-container">
        
        {/* Page Header */}
        <div className="zdoc-header">
          <div className="zdoc-title-wrapper">
            <div className="zdoc-header-icon"><FaFolderOpen /></div>
            <div>
              <h1 className="zdoc-title">My Documents</h1>
              <p className="zdoc-subtitle">Securely manage your personal and professional records.</p>
            </div>
          </div>
        </div>

        {/* Upload / Edit Zone */}
        <div className={`zdoc-upload-card ${editingDocId ? 'editing-mode' : ''}`}>
          <h4 className="zdoc-card-title">
            {editingDocId ? <><FaSyncAlt className="me-2 text-warning"/> Update Existing Document</> : <><FaCloudUploadAlt className="me-2 text-primary"/> Upload New Document</>}
          </h4>
          
          <div className="zdoc-form-grid">
            <div className="zdoc-form-group">
              <label>Document Classification</label>
              <select 
                value={documentType}
                onChange={(e) => {
                  setDocumentType(e.target.value);
                  if (e.target.value !== "Others") setCustomDocType("");
                }}
                className="zdoc-input"
              >
                <option value="">-- Select Classification --</option>
                <option value="Aadhaar">Aadhaar Card</option>
                <option value="PAN">PAN Card</option>
                <option value="Resume">Resume / CV</option>
                <option value="Offer Letter">Offer Letter</option>
                <option value="Experience Letter">Experience Letter</option>
                <option value="Bank Details">Bank Details</option>
                <option value="Others">Others / Custom</option>
              </select>

              {/* Smooth Slide-in Custom Input */}
              {documentType === "Others" && (
                <input 
                  type="text"
                  placeholder="e.g., Medical Certificate"
                  value={customDocType}
                  onChange={(e) => setCustomDocType(e.target.value)}
                  className="zdoc-input zdoc-fade-in mt-2"
                  autoFocus
                />
              )}
            </div>

            <div className="zdoc-form-group flex-grow">
              <label>{editingDocId ? "Replace File (Leave empty to keep current)" : "Select File (PDF, JPG, PNG)"}</label>
              <input 
                id="emp-file-upload"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => setUploadFile(e.target.files[0])}
                className="zdoc-file-input"
              />
            </div>

            <div className="zdoc-form-actions">
              {editingDocId && (
                <button className="zdoc-btn-cancel" onClick={resetForm}>
                  <FaTimes className="me-1"/> Cancel
                </button>
              )}
              <button 
                className={editingDocId ? "zdoc-btn-warning" : "zdoc-btn-primary"} 
                onClick={handleUpload}
                disabled={isUploadDisabled}
              >
                {editingDocId ? <FaSyncAlt className="me-2"/> : <FaCloudUploadAlt className="me-2"/>}
                {editingDocId ? "Update File" : "Secure Upload"}
              </button>
            </div>
          </div>
        </div>

        {/* Document Table */}
        <div className="zdoc-table-card">
          {loading ? (
            <div className="zdoc-loader-wrapper"><Loader /></div>
          ) : (
            <div className="zdoc-table-responsive">
              <table className="zdoc-table">
                <thead>
                  <tr>
                    <th>File Information</th>
                    <th>Upload Date</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {documents.length === 0 ? (
                    <tr>
                      <td colSpan="3" className="zdoc-empty-state">
                        <FaFileAlt className="empty-icon" />
                        <p>No documents uploaded yet. Your vault is empty.</p>
                      </td>
                    </tr>
                  ) : (
                    documents.map((doc) => (
                      <tr key={doc._id}>
                        <td>
                          <div className="zdoc-file-info">
                            <div className="zdoc-file-icon"><FaFileAlt /></div>
                            <div className="zdoc-file-details">
                              <span className="zdoc-file-type">{doc.documentType}</span>
                              <span className="zdoc-file-meta">Encrypted Record</span>
                            </div>
                          </div>
                        </td>
                        <td>{new Date(doc.uploadedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                        <td>
                          <div className="zdoc-action-group">
                            <a 
                              href={`${import.meta.env.VITE_API_URL}/static/${doc.fileUrl}`} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="zdoc-icon-btn view"
                              title="View Document"
                            >
                              <FaEye />
                            </a>
                            <button 
                              className="zdoc-icon-btn edit" 
                              onClick={() => handleEdit(doc)}
                              title="Update Document"
                            >
                              <FaSyncAlt />
                            </button>
                            <button 
                              className="zdoc-icon-btn delete" 
                              onClick={() => handleDelete(doc._id)}
                              title="Delete Document"
                            >
                              <FaTrash />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </EmployeeLayout>
  );
};

export default EmployeeDocument;