import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchPendingUsers, rejectUser } from "../Redux/Slices/pendingUserSlice";
import Swal from "sweetalert2";
import { Container, Table, Button, Modal, Form, Badge, Row, Col } from "react-bootstrap";
import { 
  FaUserShield, FaCheck, FaTrashAlt, FaWallet, FaInfoCircle, 
  FaMapMarkerAlt, FaPhoneAlt, FaEnvelope, FaCalendarAlt, FaBuilding, 
  FaUserTie, FaVenusMars, FaBirthdayCake, FaIdCard, FaClock
} from "react-icons/fa";
import AdminLayout from "./AdminLayout";
import Loader from "./Loader/Loader";
import axios from "axios";
import "./AdminApproveEmployees.css";

const AdminApproveEmployees = () => {
  const dispatch = useDispatch();
  const { data = [], loading = false } = useSelector((state) => state.pendingUsers);
  
  const [showModal, setShowModal] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState(null);
  const [basicSalary, setBasicSalary] = useState("");
  const token = JSON.parse(localStorage.getItem("user"))?.token;

  useEffect(() => { dispatch(fetchPendingUsers()); }, [dispatch]);

  const openApproveModal = (emp) => {
    setSelectedEmp(emp);
    setShowModal(true);
  };

  const handleApproveConfirm = async () => {
    if (!basicSalary) {
      Swal.fire({ icon: "warning", title: "Payroll Missing", text: "Please enter a basic salary.", customClass: { popup: 'premium-swal' } });
      return;
    }
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/user/approve-user/${selectedEmp._id}`, { basicSalary }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setShowModal(false);
      setBasicSalary("");
      dispatch(fetchPendingUsers());
      Swal.fire({ icon: "success", title: "Confirmed!", timer: 1500, showConfirmButton: false, customClass: { popup: 'premium-swal' } });
    } catch (err) {
      Swal.fire({ icon: "error", title: "Error", text: "Process failed.", customClass: { popup: 'premium-swal' } });
    }
  };

  const handleRejectUser = async (id) => {
    const result = await Swal.fire({
      title: "Remove Applicant?",
      text: "This registration will be permanently deleted.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      confirmButtonText: "Yes, Remove",
      customClass: { popup: 'premium-swal' }
    });
    if (result.isConfirmed) {
      await dispatch(rejectUser(id));
      dispatch(fetchPendingUsers());
    }
  };

  return (
    <AdminLayout>
      <div className="hq-extreme-wrapper">
        {/* Abstract Background Design */}
        <div className="hq-decor-lines"></div>
        
        <Container fluid className="py-4 px-md-5 hq-z-index">
          <div className="hq-premium-header mb-4 d-flex align-item-center ">
            <div className="hq-glow-badge "><FaUserShield /></div>
            <div className="ms-3">
              <h2 className="hq-title-main">Staff Verification</h2>
              <p className="hq-title-sub">Manage onboarding queue & finalize employee payroll</p>
            </div>
          </div>

          {loading ? <Loader /> : (
            <div className="hq-main-glass-card">
              <div className="table-responsive">
                <Table className="hq-extreme-table align-middle">
                  <thead>
                    <tr>
                      <th>Candidate Info</th>
                      <th>Job Parameters</th>
                      <th>Timeline</th>
                      <th className="text-center">Verification Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((emp) => (
                      <tr key={emp._id}>
                        <td>
                          <div className="hq-emp-profile-box">
                            <div className="hq-emp-img-circle">
                               {emp.profilePic ? (
                                   <img src={`${import.meta.env.VITE_API_URL}/static/${emp.profilePic}`} alt="p" />
                               ) : (
                                   <span>{emp.name.charAt(0)}</span>
                               )}
                            </div>
                            <div className="ms-3">
                              <div className="name-bold ">{emp.name}</div>
                              <div className="email-small text-dark">{emp.email}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <Badge className="badge-hq-dept">{emp.departmentId?.name || 'N/A'}</Badge>
                          <div className="text-dark">{emp.designationId?.name}</div>
                        </td>
                        <td>
                          <div className="date-text-v2 text-dark">{emp.doj?.substring(0, 10)}</div>
                          <div className="branch-text-v2 text-dark">{emp.branchId?.name}</div>
                        </td>
                        <td className="text-center">
                          <div className="btn-group-v2">
                            <Button className="btn-approve-v2" onClick={() => openApproveModal(emp)}>
                               Review & Approve
                            </Button>
                            <Button className="btn-remove-v2" onClick={() => handleRejectUser(emp._id)}>
                               <FaTrashAlt />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </div>
          )}
        </Container>
      </div>

      <Modal show={showModal} onHide={() => setShowModal(false)} size="xl" centered className="hq-extreme-modal">
        <Modal.Body className="p-0">
          <Row className="g-0">
            {/* Left Column: Full Data Visualization */}
            <Col lg={8} className="hq-modal-data-pane p-4">
              <div className="d-flex justify-content-between align-items-start mb-4">
                <div className="d-flex align-items-center">
                    <div className="hq-modal-img-wrap">
                        {selectedEmp?.profilePic ? (
                            <img src={`${import.meta.env.VITE_API_URL}/static/${selectedEmp.profilePic}`} alt="Profile" />
                        ) : (
                            <div className="hq-modal-placeholder"><FaUserTie /></div>
                        )}
                    </div>
                    <div className="ms-3">
                        <h3 className="modal-emp-name mb-0">{selectedEmp?.name}</h3>
                        <Badge className="badge-hq-status">Pending Verification</Badge>
                    </div>
                </div>
                <div className="text-end">
                    <small className="text-primary d-block uppercase ls-1">Application ID</small>
                    <span className="fw-bold text-primary">#APP-{selectedEmp?._id?.slice(-6)}</span>
                </div>
              </div>

              <Row className="gy-4">
                <Col md={6}>
                    <div className="info-block-v2">
                        <h6 className="info-heading d-flex align-item-center "><FaIdCard className="me-2"/> Professional Details</h6>
                        <div className="info-row"><span>Branch:</span> <strong>{selectedEmp?.branchId?.name || 'N/A'}</strong></div>
                        <div className="info-row"><span>Department:</span> <strong>{selectedEmp?.departmentId?.name || 'N/A'}</strong></div>
                        <div className="info-row"><span>Designation:</span> <strong>{selectedEmp?.designationId?.name || 'N/A'}</strong></div>
                        <div className="info-row"><span>Job Type:</span> <strong>{selectedEmp?.shiftId?.name || 'Standard'}</strong></div>
                    </div>
                </Col>
                <Col md={6}>
                    <div className="info-block-v2">
                        <h6 className="info-heading d-flex align-item-center "><FaPhoneAlt className="me-2"/> Contact Information</h6>
                        <div className="info-row"><span>Email:</span> <strong>{selectedEmp?.email}</strong></div>
                        <div className="info-row"><span>Phone:</span> <strong>{selectedEmp?.phone || 'N/A'}</strong></div>
                        <div className="info-row"><span>Joining Date:</span> <strong>{selectedEmp?.doj?.substring(0, 10)}</strong></div>
                    </div>
                </Col>
                <Col md={6}>
                    <div className="info-block-v2">
                        <h6 className="info-heading d-flex align-item-center "><FaBirthdayCake className="me-2"/> Personal Bio</h6>
                        <div className="info-row"><span>Date of Birth:</span> <strong>{selectedEmp?.dob?.substring(0, 10) || 'N/A'}</strong></div>
                        <div className="info-row"><span>Gender:</span> <strong>{selectedEmp?.gender || 'N/A'}</strong></div>
                        <div className="info-row"><span>Address:</span> <p className="mb-0 mt-1 small text-muted">{selectedEmp?.address || "N/A"}</p></div>
                    </div>
                </Col>
                <Col md={6}>
                    <div className="info-block-v2 highlight">
                        <h6 className="info-heading d-flex align-item-center "><FaInfoCircle className="me-2"/> Emergency Contact</h6>
                        <div className="info-row"><span>Name:</span> <strong>{selectedEmp?.emergencyContact?.name || '-'}</strong></div>
                        <div className="info-row"><span>Relation:</span> <strong>{selectedEmp?.emergencyContact?.relation || '-'}</strong></div>
                        <div className="info-row"><span>Contact No:</span> <strong className="text-primary">{selectedEmp?.emergencyContact?.phone || '-'}</strong></div>
                    </div>
                </Col>
              </Row>
            </Col>

            {/* Right Column: Approval Action */}
            <Col lg={4} className="hq-modal-action-pane p-4">
                <div className="action-sticky-container text-center">
                    <div className="hq-circle-icon-v2"><FaWallet /></div>
                    <h4 className="fw-bold mt-3">Payroll Finalization</h4>
                    <p className="small text-muted mb-4 px-3">Assign the monthly basic salary to complete the onboarding process.</p>
                    
                    <Form.Group className="mb-4 text-start">
                        <Form.Label className="hq-form-label">Monthly Basic Salary (INR)</Form.Label>
                        <div className="hq-extreme-input-wrap">
                            <span className="hq-currency-v2">₹</span>
                            <Form.Control 
                                type="number" 
                                placeholder="00,000"
                                value={basicSalary}
                                onChange={(e) => setBasicSalary(e.target.value)}
                                className="hq-extreme-input"
                            />
                        </div>
                    </Form.Group>

                    <Button className="btn-authorize-v2 w-100 d-flex align-item-center " onClick={handleApproveConfirm}>
                        Verify & Activate <FaCheck className="ms-2" />
                    </Button>
                    <button className="btn-dismiss-v2 mt-3" onClick={() => setShowModal(false)}>Close Review Panel</button>
                </div>
            </Col>
          </Row>
        </Modal.Body>
      </Modal>
    </AdminLayout>
  );
};

export default AdminApproveEmployees;