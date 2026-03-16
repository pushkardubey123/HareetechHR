import React, { useEffect, useState } from "react";
import { Table, Button, Modal, Form, Badge } from "react-bootstrap";
import Swal from "sweetalert2";
import { useForm } from "react-hook-form";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { setLeads } from "../Redux/Slices/leadSlice";
import DynamicLayout from "../Common/DynamicLayout";
import Loader from "./Loader/Loader";
import LeadActivityModal from "./LeadActivityModal";
import ConvertLeadModal from "./ConvertLeadModal";
import { AiOutlinePlus } from "react-icons/ai";
import { BsPersonLinesFill } from "react-icons/bs";

const LeadManagement = () => {
  const dispatch = useDispatch();
  const leads = useSelector((state) => state?.lead?.list || []);

  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [showActivity, setShowActivity] = useState(false);
  const [showConvert, setShowConvert] = useState(false);

  const { register, handleSubmit, reset } = useForm();

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
        const res = await axiosInstance.get(`/api/my-modules`);
        if (res.data.detailed?.lms) {
          setPerms(res.data.detailed.lms);
        }
      } catch (e) { console.error("Permission fetch failed", e); }
    };
    fetchPerms();
    fetchLeads();
  }, [token, isAdmin, axiosInstance]);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get("/api/leads");
      const leadsArray = Array.isArray(res.data?.data) ? res.data.data : [];
      dispatch(setLeads(leadsArray));
    } catch (error) {
      Swal.fire("Error", "Unable to load leads", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (data) => {
    try {
      await axiosInstance.post("/api/leads/create", data);
      Swal.fire("Created", "Lead added successfully", "success");
      setShowModal(false);
      reset();
      fetchLeads();
    } catch {
      Swal.fire("Error", "Failed to create lead", "error");
    }
  };

  const canCreate = isAdmin || perms.create;
  const canEdit = isAdmin || perms.edit;

  return (
    <DynamicLayout>
      <div className="container mt-4">
        <div className="d-flex justify-content-between mb-3">
          <h4 className="fw-bold text-primary">
            <BsPersonLinesFill /> Lead Management
          </h4>
          
          {/* ✅ PROTECTED ADD BUTTON */}
          {canCreate && (
            <Button variant="success" onClick={() => setShowModal(true)}>
              <AiOutlinePlus /> Add Lead
            </Button>
          )}
        </div>

        {loading ? (
          <Loader />
        ) : (
          <Table bordered hover responsive className="shadow-sm">
            <thead className="table-dark text-center">
              <tr>
                <th>#</th>
                <th>Lead</th>
                <th>Company</th>
                <th>Status</th>
                <th>Source</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody className="text-center">
              {Array.isArray(leads) && leads.length > 0 && (
                leads.map((lead, i) => (
                  <tr key={lead._id}>
                    <td>{i + 1}</td>
                    <td className="fw-semibold">{lead.title}</td>
                    <td>{lead.companyName || "-"}</td>
                    <td>
                      <Badge bg="info">
                        {lead.status?.name || "New"}
                      </Badge>
                    </td>
                    <td>{lead.source?.name || lead.source || "-"}</td>
                    <td>
                      <div className="d-flex justify-content-center gap-2">
                        {/* Activity button open to view */}
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            setSelectedLead(lead);
                            setShowActivity(true);
                          }}
                        >
                          Activity
                        </Button>

                        {/* ✅ PROTECTED CONVERT BUTTON */}
                        {(!lead.convertedToProject && canEdit) && (
                          <Button
                            size="sm"
                            variant="success"
                            onClick={() => {
                              setSelectedLead(lead);
                              setShowConvert(true);
                            }}
                          >
                            Convert
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}

              {Array.isArray(leads) && leads.length === 0 && !loading && (
                <tr>
                  <td colSpan="6" className="text-muted py-4">
                    No leads found
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        )}

        <Modal show={showModal} onHide={() => setShowModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title>Add Lead</Modal.Title>
          </Modal.Header>

          <Form onSubmit={handleSubmit(handleSave)}>
            <Modal.Body>
              <Form.Group className="mb-2">
                <Form.Label>Lead Title</Form.Label>
                <Form.Control {...register("title")} required />
              </Form.Group>

              <Form.Group className="mb-2">
                <Form.Label>Company</Form.Label>
                <Form.Control {...register("companyName")} />
              </Form.Group>

              <Form.Group className="mb-2">
                <Form.Label>Source</Form.Label>
                <Form.Control
                  {...register("source")}
                  placeholder="LinkedIn / Website / Referral"
                />
              </Form.Group>
            </Modal.Body>

            <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                Save
              </Button>
            </Modal.Footer>
          </Form>
        </Modal>

        {selectedLead && (
          <>
            <LeadActivityModal
              show={showActivity}
              lead={selectedLead}
              handleClose={() => setShowActivity(false)}
            />

            <ConvertLeadModal
              show={showConvert}
              lead={selectedLead}
              handleClose={() => setShowConvert(false)}
              refresh={fetchLeads}
            />
          </>
        )}
      </div>
    </DynamicLayout>
  );
};

export default LeadManagement;