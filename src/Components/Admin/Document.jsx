import React, { useEffect, useState } from "react";
import DynamicLayout from "../Common/DynamicLayout";
import axios from "axios";
import {
  FaEye, FaTrash, FaUser, FaEnvelope,
  FaFolderOpen, FaCloudUploadAlt, FaFileAlt, FaTimes
} from "react-icons/fa";
import Loader from "./Loader/Loader";
import Swal from "sweetalert2";
import "./Document.css";

const Document = () => {
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  
  const [documentType, setDocumentType] = useState("");
  const [customDocType, setCustomDocType] = useState(""); // ✅ NEW STATE FOR CUSTOM INPUT
  
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingEmployees, setLoadingEmployees] = useState(true);

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
        if (res.data.detailed?.document) {
          setPerms(res.data.detailed.document);
        }
      } catch (e) {
        console.error("Permission fetch failed", e);
      }
    };
    fetchPerms();
    fetchEmployees();
  }, [token, isAdmin]);

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
      setShowModal(true); 
      const res = await axiosInstance.get(`/api/documents/${emp._id}`);
      setDocuments(res.data?.data || []);
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
        Swal.fire({ title: "Deleted", text: "Successfully deleted", icon: "success", background: theme.background, color: theme.color, timer: 1500, showConfirmButton: false });
        if (selectedEmployee) fetchDocuments(selectedEmployee);
      } catch {
        Swal.fire({ title: "Error", text: "Delete Failed", icon: "error", background: theme.background, color: theme.color });
      }
    }
  };

  const handleUpload = async () => {
    const theme = getAlertTheme();
    
    // ✅ LOGIC: Determine final document type
    const finalDocType = documentType === "Others" ? customDocType.trim() : documentType;

    if (!uploadFile || !finalDocType || !selectedEmployee?._id) {
      return Swal.fire({ title: "Error", text: "All fields are required", icon: "error", background: theme.background, color: theme.color });
    }

    const formData = new FormData();
    formData.append("employeeId", selectedEmployee._id);
    formData.append("documentType", finalDocType); // ✅ USE FINAL DOC TYPE
    formData.append("file", uploadFile);

    try {
      await axiosInstance.post("/api/documents/upload", formData);
      Swal.fire({ title: "Success", text: "Document uploaded", icon: "success", background: theme.background, color: theme.color, timer: 1500, showConfirmButton: false });
      
      // ✅ RESET ALL FIELDS
      setUploadFile(null);
      setDocumentType("");
      setCustomDocType(""); 
      document.getElementById("file-upload-input").value = "";
      
      fetchDocuments(selectedEmployee);
    } catch {
      Swal.fire({ title: "Error", text: "Upload Failed", icon: "error", background: theme.background, color: theme.color });
    }
  };

  const canCreate = isAdmin || perms.create;
  const canDelete = isAdmin || perms.delete;

  const filteredEmployees = employees.filter((emp) =>
    emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ✅ HELPER: Check if button should be disabled
  const isUploadDisabled = !uploadFile || !documentType || (documentType === "Others" && !customDocType.trim());

  return (
    <DynamicLayout>
      <div className="z-doc-container">
        
        <div className="z-doc-header">
          <div className="z-doc-title-box">
            <div className="z-doc-icon-wrapper"><FaFolderOpen /></div>
            <div>
              <h2 className="z-doc-title">Document Directory</h2>
              <p className="z-doc-subtitle">Manage and securely store employee records.</p>
            </div>
          </div>
          
          <div className="z-doc-search">
            <input
              type="text"
              placeholder="Search employee name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="z-input-search"
            />
          </div>
        </div>

        {loadingEmployees ? (
          <div className="z-loader-container"><Loader /></div>
        ) : (
          <div className="z-emp-grid">
            {filteredEmployees.length === 0 ? (
              <div className="z-empty-state">No employees found in the directory.</div>
            ) : (
              filteredEmployees.map((emp) => (
                <div key={emp._id} className="z-emp-card">
                  <div className="z-emp-card-header">
                    <div className="z-emp-avatar">
                      {emp.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="z-emp-info">
                      <h4 className="z-emp-name">{emp.name}</h4>
                      <span className="z-emp-email"><FaEnvelope className="me-1"/> {emp.email}</span>
                    </div>
                  </div>
                  <div className="z-emp-card-footer">
                    <button className="z-btn-outline" onClick={() => fetchDocuments(emp)}>
                      <FaFolderOpen /> Open Folder
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

      </div>

      {showModal && (
        <div className="z-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="z-modal-content" onClick={(e) => e.stopPropagation()}>
            
            <div className="z-modal-header">
              <h3 className="z-modal-title">
                <FaFolderOpen className="text-primary me-2"/> 
                {selectedEmployee?.name}'s Vault
              </h3>
              <button className="z-modal-close" onClick={() => setShowModal(false)}>
                <FaTimes />
              </button>
            </div>

            <div className="z-modal-body">
              
              {canCreate && (
                <div className="z-upload-zone">
                  <h4 className="z-upload-title"><FaCloudUploadAlt /> Upload New File</h4>
                  <div className="z-upload-form">
                    
                    {/* ✅ MODIFIED DROPDOWN & CUSTOM INPUT AREA */}
                    <div className="z-form-group" style={{ minWidth: '280px' }}>
                      <label>Document Type</label>
                      <select 
                        value={documentType} 
                        onChange={(e) => {
                          setDocumentType(e.target.value);
                          if(e.target.value !== "Others") setCustomDocType(""); // Clear input if changed
                        }} 
                        className="z-input-control"
                      >
                        <option value="">-- Select Classification --</option>
                        <option value="Aadhaar">Aadhaar Card</option>
                        <option value="PAN">PAN Card</option>
                        <option value="Resume">Resume / CV</option>
                        <option value="Offer Letter">Offer Letter</option>
                        <option value="Experience Letter">Experience Letter</option>
                        <option value="Bank Details">Bank Passbook/Cheque</option>
                        <option value="Others">Others</option>
                      </select>

                      {/* ✅ SMOOTH FADE-IN CUSTOM INPUT BOX */}
                      {documentType === "Others" && (
                        <input 
                          type="text" 
                          placeholder="Please specify document name..."
                          value={customDocType}
                          onChange={(e) => setCustomDocType(e.target.value)}
                          className="z-input-control z-fade-in mt-2"
                          autoFocus
                        />
                      )}
                    </div>

                    <div className="z-form-group">
                      <label>Select File (PDF, JPG, PNG)</label>
                      <input 
                        id="file-upload-input"
                        type="file" 
                        accept=".pdf,.jpg,.jpeg,.png" 
                        onChange={(e) => setUploadFile(e.target.files[0])} 
                        className="z-file-input" 
                      />
                    </div>

                    <div className="z-form-action" style={{ alignSelf: documentType === 'Others' ? 'flex-end' : 'auto' }}>
                      <button 
                        className="z-btn-primary" 
                        onClick={handleUpload} 
                        disabled={isUploadDisabled} // ✅ UPDATED VALIDATION
                      >
                        <FaCloudUploadAlt /> Secure Upload
                      </button>
                    </div>

                  </div>
                </div>
              )}

              <div className="z-table-wrapper">
                {loadingDocs ? (
                  <div className="z-loader-container-small"><Loader /></div>
                ) : (
                  <table className="z-table">
                    <thead>
                      <tr>
                        <th>File Name & Type</th>
                        <th>Uploaded By</th>
                        <th>Date Added</th>
                        <th className="text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {documents.length === 0 ? (
                        <tr>
                          <td colSpan="4" className="z-empty-state border-0 py-5">
                            <FaFileAlt className="mb-2 fs-1 text-muted opacity-50"/>
                            <p>Vault is empty. No documents uploaded yet.</p>
                          </td>
                        </tr>
                      ) : (
                        documents.map((doc) => (
                          <tr key={doc._id}>
                            <td>
                              <div className="z-doc-name-cell">
                                <div className="z-doc-icon"><FaFileAlt /></div>
                                <div>
                                  <div className="z-doc-type">{doc.documentType}</div>
                                  <div className="z-doc-meta">Secure File</div>
                                </div>
                              </div>
                            </td>
                            <td>
                              <span className="z-badge-subtle">{doc.uploadedBy?.name || "System"}</span>
                            </td>
                            <td className="z-date-cell">
                              {new Date(doc.uploadedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </td>
                            <td className="text-right z-actions-cell">
                              <a 
                                href={`${import.meta.env.VITE_API_URL}/static/${doc.fileUrl}`} 
                                target="_blank" 
                                rel="noreferrer" 
                                className="z-action-btn view-btn"
                                title="View Document"
                              >
                                <FaEye />
                              </a>
                              {canDelete && (
                                <button 
                                  className="z-action-btn delete-btn" 
                                  onClick={() => handleDelete(doc._id)}
                                  title="Delete Document"
                                >
                                  <FaTrash />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                )}
              </div>

            </div>
          </div>
        </div>
      )}

    </DynamicLayout>
  );
};

export default Document;