import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import DynamicLayout from "../Common/DynamicLayout";
import axios from "axios";
import Swal from "sweetalert2";
import { Tabs, Tab, Badge, Table, Button, Form, Row, Col } from "react-bootstrap";
import { 
    FaUser, FaCalendarAlt, FaTasks, FaMoneyBillWave, FaFileInvoice, 
    FaArrowLeft, FaDownload, FaCloudUploadAlt, FaEye, FaHome, FaShieldAlt, 
    FaClock, FaUniversity, FaBriefcase
} from "react-icons/fa";
import { generateSalarySlipPDF } from "./generateSalarySlipPDF"; 
import TableLoader from "./Loader/Loader"; 
import "./EmployeeProfile.css";

const EmployeeProfile = () => {
    const navigate = useNavigate();
    const { state: initialEmployee } = useLocation(); 
    
    // --- STATE ---
    const [employee, setEmployee] = useState(initialEmployee || null); 
    const [loading, setLoading] = useState(true); 
    const [data, setData] = useState({
        leaves: [], attendance: [], tasks: [], payrolls: [], documents: [], wfh: []
    });

    const [docType, setDocType] = useState("");
    const [uploadFile, setUploadFile] = useState(null);

    // ✅ PERMISSION LOGIC
    const userStr = localStorage.getItem("user");
    const userObj = userStr ? JSON.parse(userStr) : null;
    const token = userObj?.token;
    const isAdmin = userObj?.role === "admin";
    const [perms, setPerms] = useState({ view: false, create: false, edit: false, delete: false });

    const api = axios.create({
        baseURL: import.meta.env.VITE_API_URL,
        headers: { Authorization: `Bearer ${token}` }
    });

    useEffect(() => {
      const fetchPerms = async () => {
        if (isAdmin || !token) return;
        try {
          const res = await api.get(`/api/my-modules`);
          if (res.data.detailed?.staff) {
            setPerms(res.data.detailed.staff);
          }
        } catch (e) {
          console.error("Permission fetch failed", e);
        }
      };
      fetchPerms();
    }, [token, isAdmin]);

    const fetchFullProfile = async () => {
        const empId = initialEmployee?._id || window.location.pathname.split("/").pop();
        if (!empId) {
            setLoading(false);
            return;
        }
        try {
            setLoading(true); 
            const empRes = await api.get(`/employeeget/${empId}`);
            if (empRes.data.success) {
                setEmployee(empRes.data.data);
            }

            const [leavesRes, attRes, projRes, payrollRes, docsRes, wfhRes] = await Promise.all([
                api.get(`/api/leaves/employee/${empId}`).catch(() => ({ data: { data: [] } })),
                api.get(`/api/attendance/employee/${empId}`).catch(() => ({ data: { data: [] } })),
                api.get(`/api/projects`).catch(() => ({ data: { data: [] } })),
                api.get(`/api/payrolls/employee/${empId}`).catch(() => ({ data: { data: [] } })),
                api.get(`/api/documents/${empId}`).catch(() => ({ data: { data: [] } })),
                api.get(`/api/wfh/all`).catch(() => ({ data: { data: [] } }))
            ]);

            const employeeWFH = (wfhRes.data.data || []).filter(item => 
                (item.userId?._id || item.userId) === empId
            );

            const allTasks = (projRes.data.data || []).flatMap(p => 
                (p.tasks || []).filter(t => {
                    const assigned = t.assignedTo;
                    return Array.isArray(assigned) 
                        ? assigned.some(a => (a._id || a).toString() === empId)
                        : (assigned?._id || assigned)?.toString() === empId;
                }).map(t => ({ ...t, projectName: p.name }))
            );

            setData({
                leaves: leavesRes.data.data || [],
                attendance: attRes.data.data || [],
                tasks: allTasks,
                payrolls: payrollRes.data.data || [],
                documents: docsRes.data.data || [],
                wfh: employeeWFH
            });
        } catch (error) { 
            console.error("Error fetching data:", error); 
        } finally {
            setLoading(false); 
        }
    };

    useEffect(() => { 
        fetchFullProfile(); 
    }, [initialEmployee?._id]);

    const handleUpload = async () => {
        if (!uploadFile || !docType) return Swal.fire("Error", "Select file & type", "error");
        const formData = new FormData();
        formData.append("employeeId", employee?._id);
        formData.append("documentType", docType);
        formData.append("file", uploadFile);
        try {
            await api.post("/api/documents/upload", formData);
            Swal.fire("Success", "Uploaded!", "success");
            fetchFullProfile();
        } catch { Swal.fire("Error", "Upload failed", "error"); }
    };

    if (loading) {
        return (
            <DynamicLayout>
                <div className="profile-wrapper-horizontal d-flex justify-content-center pt-5">
                   <div style={{width: '100%', maxWidth:'800px'}}><TableLoader /></div>
                </div>
            </DynamicLayout>
        );
    }

    if (!employee) {
        return (
            <DynamicLayout>
                <div className="text-center mt-5 text-muted"><h3>Employee Not Found</h3></div>
            </DynamicLayout>
        );
    }

    const emergency = typeof employee.emergencyContact === 'string' 
        ? JSON.parse(employee.emergencyContact || '{}') 
        : (employee.emergencyContact || {});

    // ✅ ACTIONS
    const canEdit = isAdmin || perms.edit;

    return (
        <DynamicLayout>
            <div className="profile-wrapper-horizontal">
                <Button variant="outline-secondary" className="rounded-pill px-4 mb-4 d-flex align-items-center bg-white border-0 shadow-sm text-dark" onClick={() => navigate(-1)}>
                    <FaArrowLeft className="me-2"/> Back to Directory
                </Button>

                <div className="horizontal-header-card animate__animated animate__fadeIn">
                    <img 
                        src={employee.profilePic ? `${import.meta.env.VITE_API_URL}/static/${employee.profilePic}` : "https://via.placeholder.com/150"} 
                        className="squircle-avatar-large" alt="User"
                    />
                    <div className="header-meta">
                        <Badge bg="success" className="mb-2 px-3 py-2 rounded-pill shadow-sm">ACTIVE</Badge>
                        <h2>{employee.name}</h2>
                        <p className="d-flex align-items-center">
                            <FaBriefcase className="me-2"/>
                            {employee.designationId?.name || "N/A"} | {employee.departmentId?.name || "N/A"}
                        </p>
                        <span className="text-muted small">ID: {employee._id?.slice(-6).toUpperCase() || "---"}</span>
                    </div>
                </div>

                <div className="horizontal-info-row">
                    <InfoField label="Email" value={employee.email} />
                    <InfoField label="Phone" value={employee.phone} />
                    <InfoField label="Gender" value={employee.gender} />
                    <InfoField label="DOB" value={employee.dob?.slice(0,10)} />
                    <InfoField label="Join Date" value={employee.doj?.slice(0,10)} />
                    <InfoField label="Address" value={employee.address} />
                </div>

                <Row className="g-4 mb-4">
                    <Col xl={6}>
                        <div className="accent-card emergency-theme">
                            <h6 className="text-danger fw-bold mb-4 d-flex align-items-center"><FaShieldAlt className="me-2"/> EMERGENCY CONTACT</h6>
                            <div className="d-flex justify-content-between flex-wrap gap-3">
                                <InfoField label="Name" value={emergency.name} />
                                <InfoField label="Relation" value={emergency.relation} />
                                <InfoField label="Phone" value={emergency.phone} />
                            </div>
                        </div>
                    </Col>
                    <Col xl={6}>
                        <div className="accent-card finance-theme">
                            <h6 className="text-success fw-bold mb-4 d-flex align-items-center"><FaUniversity className="me-2"/> FINANCIAL RECORDS</h6>
                            <div className="d-flex justify-content-between flex-wrap gap-3">
                                <InfoField label="Salary" value={`₹ ${employee.basicSalary || 0}`} />
                                <InfoField label="PAN" value={employee.pan} />
                                <InfoField label="Account No" value={employee.bankAccount} />
                            </div>
                        </div>
                    </Col>
                </Row>

                <div className="custom-tabs-panel">
                    <Tabs defaultActiveKey="attendance" className="nav-pills border-0 mb-4 overflow-auto flex-nowrap">
                        <Tab eventKey="attendance" title={<span className="d-flex align-items-center"><FaClock className="me-2"/> Attendance</span>}>
                            <Table borderless className="table-custom"> 
                                <thead><tr><th>Date</th><th>Clock-In</th><th>Status</th></tr></thead>
                                <tbody>
                                    {data.attendance.length > 0 ? data.attendance.slice(0, 10).map((a, i) => (
                                        <tr key={i}>
                                            <td>{new Date(a.date).toLocaleDateString()}</td>
                                            <td>{a.inTime || '--:--'}</td>
                                            <td><Badge bg={a.status === 'Present' ? 'success' : 'danger'}>{a.status}</Badge></td>
                                        </tr>
                                    )) : <tr><td colSpan="3" className="text-center text-muted">No Logs Found</td></tr>}
                                </tbody>
                            </Table>
                        </Tab>

                        <Tab eventKey="wfh" title={<span className="d-flex align-items-center"><FaHome className="me-2"/> WFH Logs</span>}>
                            <Table responsive className="table-custom">
                                <thead><tr><th>Period</th><th>Reason</th><th>Status</th></tr></thead>
                                <tbody>
                                    {data.wfh.map((w, i) => (
                                        <tr key={i}>
                                            <td>{new Date(w.fromDate).toLocaleDateString()} - {new Date(w.toDate).toLocaleDateString()}</td>
                                            <td>{w.reason}</td>
                                            <td><Badge bg={w.status==='approved'?'success':'warning'}>{w.status}</Badge></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </Tab>

                        <Tab eventKey="leaves" title={<span className="d-flex align-items-center"><FaFileInvoice className="me-2"/> Leaves</span>}>
                             <Table responsive className="table-custom">
                                <thead><tr><th>Type</th><th>Duration</th><th>Status</th></tr></thead>
                                <tbody>
                                    {data.leaves.map((l, i) => (
                                        <tr key={i}>
                                            <td>{l.leaveType}</td>
                                            <td>{l.startDate?.slice(0,10)} - {l.endDate?.slice(0,10)}</td>
                                            <td><Badge bg={l.status==='Approved'?'success':'warning'}>{l.status}</Badge></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </Tab>

                        <Tab eventKey="payroll" title={<span className="d-flex align-items-center"><FaMoneyBillWave className="me-2"/> Payroll</span>}>
                            <Table responsive className="table-custom">
                                <thead><tr><th>Month</th><th>Amount</th><th>Action</th></tr></thead>
                                <tbody>
                                    {data.payrolls.map((p, i) => (
                                        <tr key={i}>
                                            <td>{p.month}</td>
                                            <td className="text-success fw-bold">₹{p.netSalary}</td>
                                            <td><Button size="sm" variant="outline-info" onClick={() => generateSalarySlipPDF(p)}><FaDownload/></Button></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </Tab>

                        <Tab eventKey="docs" title={<span className="d-flex align-items-center"><FaCloudUploadAlt className="me-2"/> Documents</span>}>
                            {/* ✅ PROTECTED UPLOAD SECTION */}
                            {canEdit && (
                              <div className="doc-upload-container mb-4">
                                  <Row className="g-3">
                                      <Col lg={4} md={12}>
                                          <Form.Select className="doc-input-dark shadow-none" onChange={(e)=>setDocType(e.target.value)}>
                                              <option value="">Select Document Type</option>
                                              <option value="Aadhaar Card">Aadhaar Card</option>
                                              <option value="PAN Card">PAN Card</option>
                                              <option value="Offer Letter">Offer Letter</option>
                                          </Form.Select>
                                      </Col>
                                      <Col lg={6} md={8}>
                                          <input type="file" className="form-control doc-input-dark shadow-none" onChange={(e)=>setUploadFile(e.target.files[0])} />
                                      </Col>
                                      <Col lg={2} md={4}>
                                          <Button className="w-100 fw-bold text-dark btn btn-primary" onClick={handleUpload}>Upload</Button>
                                      </Col>
                                  </Row>
                              </div>
                            )}

                            <Row className="g-3">
                                {data.documents.map((doc, index) => (
                                    <Col xl={4} md={6} key={index}>
                                        <div className="doc-card-premium d-flex justify-content-between align-items-center">
                                            <div>
                                                <small className="text-primary d-block fw-bold" style={{fontSize: '0.7rem'}}>DOC</small>
                                                <strong className="small">{doc.documentType}</strong>
                                            </div>
                                            <a href={`${import.meta.env.VITE_API_URL}/static/${doc.fileUrl}`} target="_blank" rel="noreferrer" className="btn btn-outline-primary btn-sm rounded-circle p-2">
                                                <FaEye size={16}/>
                                            </a>
                                        </div>
                                    </Col>
                                ))}
                            </Row>
                        </Tab>
                    </Tabs>
                </div>
            </div>
        </DynamicLayout>
    );
};

const InfoField = ({ label, value }) => (
    <div className="info-field">
        <span className="h-label">{label}</span>
        <p className="h-value">{value || "---"}</p>
    </div>
);

export default EmployeeProfile;