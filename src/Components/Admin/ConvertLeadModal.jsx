import React, { useEffect, useState } from "react";
import { Modal, Button } from "react-bootstrap";
import axios from "axios";
import Swal from "sweetalert2";

const ConvertLeadModal = ({ show, handleClose, lead, refresh }) => {
  // ✅ PERMISSION LOGIC
  const userStr = localStorage.getItem("user");
  const userObj = userStr ? JSON.parse(userStr) : null;
  const token = userObj?.token;
  const isAdmin = userObj?.role === "admin";
  const [perms, setPerms] = useState({ view: false, create: false, edit: false, delete: false });

  const axiosInstance = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    headers: { Authorization: `Bearer ${token}` },
  });

  useEffect(() => {
    const fetchPerms = async () => {
      if (isAdmin || !token) return;
      try {
        const res = await axiosInstance.get(`/api/my-modules`);
        // LMS corresponds to Lead Management System here
        if (res.data.detailed?.lms) {
          setPerms(res.data.detailed.lms);
        }
      } catch (e) { console.error("Permission fetch failed", e); }
    };
    fetchPerms();
  }, [token, isAdmin, axiosInstance]);

  const handleConvert = async () => {
    try {
      await axiosInstance.post(`/api/leads/convert/${lead._id}`);
      Swal.fire("Converted", "Project created successfully", "success");
      refresh();
      handleClose();
    } catch {
      Swal.fire("Error", "Conversion failed", "error");
    }
  };

  const canEdit = isAdmin || perms.edit;

  return (
    <Modal show={show} onHide={handleClose}>
      <Modal.Header closeButton>
        <Modal.Title>Convert Lead</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        Are you sure you want to convert <b>{lead?.title}</b> into a project?
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose}>
          Cancel
        </Button>
        {/* ✅ PROTECTED BUTTON */}
        {canEdit && (
          <Button variant="success" onClick={handleConvert}>
            Convert to Project
          </Button>
        )}
      </Modal.Footer>
    </Modal>
  );
};

export default ConvertLeadModal;