import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import axios from "axios";
import Swal from "sweetalert2";
import { Button, Form, Table, Card, Container } from "react-bootstrap";
import AdminLayout from "./AdminLayout";
import { FcDepartment } from "react-icons/fc";
import Loader from "./Loader/Loader";

const schema = yup.object().shape({
  branchId: yup.string().required("Branch is required"),
  name: yup.string().required("Department name is required"),
  description: yup.string().required("Description is required"),
});

const Department = () => {
  const [departments, setDepartments] = useState([]);
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const token = JSON.parse(localStorage.getItem("user"))?.token;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm({ resolver: yupResolver(schema) });

  /* ===================== PAYROLL STYLE CSS ===================== */
  useEffect(() => {
    const css = `
      .dept-page { background: linear-gradient(180deg,#0b1220,#dee4ec); min-height:100vh; padding:24px; }
      .dept-card { background: rgba(255,255,255,0.03); border-radius:14px; padding:18px; box-shadow:0 8px 30px rgba(0,0,0,.6); }
      .dept-title { font-size:20px; font-weight:700; color:#f5fbff; }
      .glass-input { background:rgba(255,255,255,0.08); border:1px solid rgba(255,255,255,0.15); color:black; border-radius:10px; }
      .dept-table thead th { background:#000; color:#fff; text-align:center; }
      .dept-table tbody td { text-align:center; }
    `;
    if (!document.querySelector("style[data-dept-ui]")) {
      const s = document.createElement("style");
      s.setAttribute("data-dept-ui", "1");
      s.appendChild(document.createTextNode(css));
      document.head.appendChild(s);
    }
  }, []);

  /* ===================== FETCH BRANCHES ===================== */
  const fetchBranches = async () => {
    const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/branch`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setBranches(res.data.data || []);
  };

  const fetchDepartments = async (branchId = "") => {
    setLoading(true);

    const url =`${import.meta.env.VITE_API_URL}/api/departments`;

    const res = await axios.get(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setDepartments(res.data.data || []);
    setLoading(false);
  };
  useEffect(() => {
    fetchDepartments();
    fetchBranches();
  }, []);
  useEffect(() => {
    if (selectedBranch) {
      fetchDepartments(selectedBranch);
    }
  }, [selectedBranch]);

  useEffect(() => {
    if (location.state) {
      setValue("branchId", location.state.branchId);
      setValue("name", location.state.name);
      setValue("description", location.state.description);
      setSelectedBranch(location.state.branchId);
    }
  }, [location.state, setValue]);

  /* ===================== SUBMIT ===================== */
  const onSubmit = async (data) => {
    try {
      if (id) {
        await axios.put(
          `${import.meta.env.VITE_API_URL}/api/departments/${id}`,
          data,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        await axios.post(
          `${import.meta.env.VITE_API_URL}/api/departments`,
          data,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
      Swal.fire("Success", "Department saved", "success");
      reset();
      fetchDepartments(data.branchId);
    } catch (err) {
      Swal.fire("Error", err.response?.data?.message, "error");
    }
  };

  const handleDelete = async (deptId) => {
    const confirm = await Swal.fire({
      title: "Delete?",
      icon: "warning",
      showCancelButton: true,
    });
    if (!confirm.isConfirmed) return;

    await axios.delete(
      `${import.meta.env.VITE_API_URL}/api/departments/${deptId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    fetchDepartments(selectedBranch);
  };

  /* ===================== FILTER ===================== */
  const filteredDepartments = departments.filter(
    (d) =>
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.branchId?.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="dept-page">
        <Container>
          <div className="dept-card">
            <div className="d-flex justify-content-between mb-3">
              <div className="dept-title d-flex align-item-center">
                <FcDepartment className="mt-1 me-1" /> Department Management
              </div>
              <Form.Control
                placeholder="Search department / branch"
                className="glass-input"
                style={{ maxWidth: 260 }}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* ===================== FORM ===================== */}
            <Form onSubmit={handleSubmit(onSubmit)} className="mb-4">
              <div className="row g-2">
                <div className="col-md-3">
                  <Form.Select
                    {...register("branchId")}
                    className="glass-input"
                    onChange={(e) => {
                      setSelectedBranch(e.target.value);
                    }}
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
                    placeholder="Department Name"
                    className="glass-input"
                    {...register("name")}
                  />
                </div>

                <div className="col-md-4">
                  <Form.Control
                    placeholder="Description"
                    className="glass-input"
                    {...register("description")}
                  />
                </div>

                <div className="col-md-2 d-grid">
                  <Button type="submit" variant="dark">
                    {id ? "Update" : "Add"}
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
                    <th>Branch</th>
                    <th>Department</th>
                    <th>Description</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDepartments.length === 0 ? (
                    <tr>
                      <td colSpan="5">No records found</td>
                    </tr>
                  ) : (
                    filteredDepartments.map((d, i) => (
                      <tr key={d._id}>
                        <td>{i + 1}</td>
                        <td>{d.branchId?.name}</td>
                        <td>{d.name}</td>
                        <td>{d.description}</td>
                        <td>
                          <Button
                            size="sm"
                            variant="warning"
                            className="me-2"
                            onClick={() =>
                              navigate(`/admin/department/${d._id}`, {
                                state: d,
                              })
                            }
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => handleDelete(d._id)}
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

export default Department;
