import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom"; 
import { useDispatch, useSelector } from "react-redux";
import { fetchPendingUsers, rejectUser } from "../Redux/Slices/pendingUserSlice";
import { toast } from "react-toastify"; // ✅ Only Toastify
import { Container, Table, Button, Form, Badge, Row, Col } from "react-bootstrap"; 
import { 
  FaUserShield, FaCheck, FaTrashAlt, FaWallet, FaInfoCircle, 
  FaMapMarkerAlt, FaPhoneAlt, FaIdCard, FaUserTie, FaBirthdayCake
} from "react-icons/fa";
import DynamicLayout from "../Common/DynamicLayout";
import Loader from "./Loader/Loader";
import axios from "axios";
import "./AdminApproveEmployees.css";

const AdminApproveEmployees = () => {
  const dispatch = useDispatch();
  const { data = [], loading = false } = useSelector((state) => state.pendingUsers);
  
  const [showModal, setShowModal] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState(null);
  const [basicSalary, setBasicSalary] = useState("");
  
  // ✅ USER & PERMISSION LOGIC (Mapped to 'staff_verification')
  const userStr = localStorage.getItem("user");
  const userObj = userStr ? JSON.parse(userStr) : null;
  const token = userObj?.token;
  const role = userObj?.role;
  const isAdmin = role === "admin"; 

  const [perms, setPerms] = useState({ view: false, edit: false, delete: false });

  useEffect(() => {
    const fetchPerms = async () => {
      if (isAdmin || !token) return; 
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/my-modules`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.detailed?.staff_verification) {
          setPerms(res.data.detailed.staff_verification);
        }
      } catch (e) {
        console.error("Permission fetch failed", e);
      }
    };
    fetchPerms();
  }, [token, isAdmin]);

  useEffect(() => { dispatch(fetchPendingUsers()); }, [dispatch]);

  const openApproveModal = (emp) => {
    setSelectedEmp(emp);
    setShowModal(true);
  };

  const handleApproveConfirm = async () => {
    if (!basicSalary) {
      toast.warning("Please enter a basic salary.", { position: "top-left" }); // ✅ Top-Left Toast
      return;
    }
    
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/user/approve-user/${selectedEmp._id}`, { basicSalary }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setShowModal(false);
      setBasicSalary("");
      dispatch(fetchPendingUsers());
      
      toast.success("Employee verified and added to the system.", { position: "top-right" }); // ✅ Top-Left Toast
      
    } catch (err) {
      if (err.response?.status === 403) {
        // Plan Limit Reached Error
        toast.error(`Plan Limit Reached: ${err.response.data.message}`, { position: "top-right" });
      } else {
        // General error
        toast.error(err.response?.data?.message || "An unexpected error occurred.", { position: "top-right" });
      }
    }
  };

  const handleRejectUser = async (id) => {
    // ✅ Replaced Swal with standard window.confirm for fast action
    if (window.confirm("Remove Applicant? This registration will be permanently deleted.")) {
      await dispatch(rejectUser(id));
      dispatch(fetchPendingUsers());
      toast.success("Applicant has been removed.", { position: "top-right" }); 
    }
  };

  // ✅ ACTION CONDITIONS
  const canEdit = isAdmin || perms.edit; // Edit permission allows Approving
  const canDelete = isAdmin || perms.delete; // Delete permission allows Rejecting

  return (
    <DynamicLayout>
      <div className="hq-extreme-wrapper">
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
                      {(canEdit || canDelete) && (
                         <th className="text-center">Verification Action</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {data.length === 0 ? (
                      <tr><td colSpan="4" className="text-center py-5 text-muted">No pending verifications at the moment.</td></tr>
                    ) : (
                      data.map((emp) => (
                        <tr key={emp._id}>
                          <td>
                            <div className="hq-emp-profile-box">
                              <div className="hq-emp-img-circle">
                                 {emp.profilePic ? (
                                     <img src={`${import.meta.env.VITE_API_URL}/static/${emp.profilePic}`} alt="p" />
                                 ) : (
                                     <span>{emp.name.charAt(0).toUpperCase()}</span>
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

                          {(canEdit || canDelete) && (
                            <td className="text-center">
                              <div className="btn-group-v2">
                                {canEdit && (
                                  <Button className="btn-approve-v2" onClick={() => openApproveModal(emp)}>
                                    Review & Approve
                                  </Button>
                                )}
                                {canDelete && (
                                  <Button className="btn-remove-v2" onClick={() => handleRejectUser(emp._id)}>
                                    <FaTrashAlt />
                                  </Button>
                                )}
                              </div>
                            </td>
                          )}
                        </tr>
                      ))
                    )}
                  </tbody>
                </Table>
              </div>
            </div>
          )}
        </Container>
      </div>

      {showModal && createPortal(
        <div className="hq-custom-modal-overlay hq-extreme-modal" onClick={() => setShowModal(false)}>
          <div className="hq-custom-modal-dialog-xl" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-body p-0">
                <Row className="g-0">
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

                          <Button className="btn-authorize-v2 w-100 d-flex align-item-center justify-content-center" onClick={handleApproveConfirm}>
                              Verify & Activate <FaCheck className="ms-2" />
                          </Button>
                          <button className="btn-dismiss-v2 mt-3" onClick={() => setShowModal(false)}>Close Review Panel</button>
                      </div>
                  </Col>
                </Row>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </DynamicLayout>
  );
};

export default AdminApproveEmployees;