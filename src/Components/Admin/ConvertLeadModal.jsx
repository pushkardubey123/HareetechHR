import React from "react";
import { Modal, Button } from "react-bootstrap";
import axios from "axios";
import Swal from "sweetalert2";

const ConvertLeadModal = ({ show, handleClose, lead, refresh }) => {
  const user = JSON.parse(localStorage.getItem("user"));
  const token = user?.token;

  const axiosInstance = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    headers: { Authorization: `Bearer ${token}` },
  });

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

  return (
    <Modal show={show} onHide={handleClose}>
      <Modal.Header closeButton>
        <Modal.Title>Convert Lead</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        Are you sure you want to convert <b>{lead.title}</b> into a project?
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose}>
          Cancel
        </Button>
        <Button variant="success" onClick={handleConvert}>
          Convert to Project
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ConvertLeadModal;
