import React, { useEffect, useState } from "react";
import axios from "axios";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import Swal from "sweetalert2";
import { Button, Form, Table, Container } from "react-bootstrap";
import AdminLayout from "./AdminLayout";
import { FaBusinessTime } from "react-icons/fa";
import Loader from "./Loader/Loader";

/* ===================== VALIDATION ===================== */
const schema = yup.object().shape({
  name: yup.string().required("Shift name is required"),
  startTime: yup.string().required("Start time is required"),
  endTime: yup.string().required("End time is required"),
});

const ShiftManagement = () => {
  const [shifts, setShifts] = useState([]);
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState("");
  const [loading, setLoading] = useState(false);
  const [editId, setEditId] = useState(null);

  const token = JSON.parse(localStorage.getItem("user"))?.token;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm({ resolver: yupResolver(schema) });

  /* ===================== SAME CSS AS DEPARTMENT ===================== */
  useEffect(() => {
    const css = `
      .dept-page { background: linear-gradient(180deg,#0b1220,#dee4ec); min-height:100vh; padding:24px; }
      .dept-card { background: rgba(255,255,255,0.03); border-radius:14px; padding:18px; box-shadow:0 8px 30px rgba(0,0,0,.6); }
      .dept-title { font-size:20px; font-weight:700; color:#f5fbff; }
      .glass-input { background:rgba(255,255,255,0.08); border:1px solid rgba(255,255,255,0.15); color:black; border-radius:10px; }
      .dept-table thead th { background:#000; color:#fff; text-align:center; }
      .dept-table tbody td { text-align:center; }
    `;
    if (!document.querySelector("style[data-shift-ui]")) {
      const s = document.createElement("style");
      s.setAttribute("data-shift-ui", "1");
      s.appendChild(document.createTextNode(css));
      document.head.appendChild(s);
    }
  }, []);

  const authHeader = {
    headers: { Authorization: `Bearer ${token}` },
  };

  /* ===================== FETCH BRANCHES ===================== */
  const fetchBranches = async () => {
    const res = await axios.get(
      `${import.meta.env.VITE_API_URL}/api/branch`,
      authHeader
    );
    setBranches(res.data.data || []);
  };

  /* ===================== FETCH SHIFTS ===================== */
const fetchShifts = async (branch = "") => {
  setLoading(true);
  try {
    const url = branch
      ? `${import.meta.env.VITE_API_URL}/api/shifts/admin?branchId=${branch}`
      : `${import.meta.env.VITE_API_URL}/api/shifts/admin`;

    const res = await axios.get(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    setShifts(res.data.data || []);
  } finally {
    setLoading(false);
  }
};



  useEffect(() => {
    fetchBranches();
    fetchShifts();
  }, []);
  /* ===================== SUBMIT ===================== */
  const onSubmit = async (data) => {
    if (!selectedBranch) {
      Swal.fire("Error", "Please select branch", "error");
      return;
    }

    const payload = {
      ...data,
      branchId: selectedBranch,
    };

    try {
      if (editId) {
        await axios.put(
          `${import.meta.env.VITE_API_URL}/api/shifts/${editId}`,
          payload,
          authHeader
        );
        Swal.fire("Updated", "Shift updated successfully", "success");
      } else {
        await axios.post(
          `${import.meta.env.VITE_API_URL}/api/shifts`,
          payload,
          authHeader
        );
        Swal.fire("Created", "Shift created successfully", "success");
      }

      reset();
      setEditId(null);
      fetchShifts();
    } catch (err) {
      Swal.fire(
        "Error",
        err.response?.data?.message || "Something went wrong",
        "error"
      );
    }
  };

  const handleEdit = (item) => {
    setEditId(item._id);
    setValue("name", item.name);
    setValue("startTime", item.startTime);
    setValue("endTime", item.endTime);
  };

  const handleDelete = async (id) => {
    const confirm = await Swal.fire({
      title: "Delete Shift?",
      icon: "warning",
      showCancelButton: true,
    });
    if (!confirm.isConfirmed) return;

    await axios.delete(
      `${import.meta.env.VITE_API_URL}/api/shifts/${id}`,
      authHeader
    );
    fetchShifts();
  };

  return (
    <AdminLayout>
      <div className="dept-page">
        <Container>
          <div className="dept-card">
            <div className="dept-title mb-3 d-flex align-items-center gap-2">
              <FaBusinessTime /> Shift Management
            </div>

            {/* ===================== FORM ===================== */}
            <Form onSubmit={handleSubmit(onSubmit)} className="mb-4">
              <div className="row g-2">
                <div className="col-md-3">
<Form.Select
  className="glass-input"
  value={selectedBranch}
  onChange={(e) => {
    setSelectedBranch(e.target.value);
    fetchShifts(e.target.value);
  }}
  disabled={!!editId}
>

                    <option value="">Select Branch</option>
                    {branches.map((b) => (
                      <option key={b._id} value={b._id}>
                        {b.name}
                      </option>
                    ))}
                  </Form.Select>
                </div>

                <div className="col-md-3">
                  <Form.Control
                    placeholder="Shift Name"
                    className="glass-input"
                    {...register("name")}
                  />
                  {errors.name && (
                    <small className="text-danger">{errors.name.message}</small>
                  )}
                </div>

                <div className="col-md-2">
                  <Form.Control
                    type="time"
                    className="glass-input"
                    {...register("startTime")}
                  />
                </div>

                <div className="col-md-2">
                  <Form.Control
                    type="time"
                    className="glass-input"
                    {...register("endTime")}
                  />
                </div>

                <div className="col-md-2 d-grid">
                  <Button type="submit" variant="dark">
                    {editId ? "Update" : "Add"}
                  </Button>
                </div>
              </div>
            </Form>

            {/* ===================== TABLE ===================== */}
            {loading ? (
              <Loader />
            ) : (
              <Table bordered hover responsive className="dept-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Shift</th>
                    <th>Branch</th>
                    <th>Start</th>
                    <th>End</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {shifts.length === 0 ? (
                    <tr>
                      <td colSpan="5">No records found</td>
                    </tr>
                  ) : (
                    shifts.map((s, i) => (
                      <tr key={s._id}>
                        <td>{i + 1}</td>
                        <td>{s.name}</td>
                        <td>{s.branchId?.name || "-"}</td>
                        <td>{s.startTime}</td>
                        <td>{s.endTime}</td>
                        <td>
                          <Button
                            size="sm"
                            variant="warning"
                            className="me-2"
                            onClick={() => handleEdit(s)}
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => handleDelete(s._id)}
                          >
                            Delete
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </Table>
            )}
          </div>
        </Container>
      </div>
    </AdminLayout>
  );
};

export default ShiftManagement;
