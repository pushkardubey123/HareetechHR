import React, { useEffect, useState } from "react";
import axios from "axios";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import Swal from "sweetalert2";
import { Button, Form, Table, Container } from "react-bootstrap";
import AdminLayout from "./AdminLayout";
import { FcApproval } from "react-icons/fc";
import Loader from "./Loader/Loader";

const schema = yup.object().shape({
  departmentId: yup.string().required("Department is required"),
  name: yup.string().required("Designation name is required"),
});

const DesignationManagement = () => {
  const [designations, setDesignations] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState("");
  const [loading, setLoading] = useState(false);
  const [editId, setEditId] = useState(null);
  const [search, setSearch] = useState("");

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
    if (!document.querySelector("style[data-designation-ui]")) {
      const s = document.createElement("style");
      s.setAttribute("data-designation-ui", "1");
      s.appendChild(document.createTextNode(css));
      document.head.appendChild(s);
    }
  }, []);

  /* ===================== FETCH ===================== */
  const fetchDesignations = async () => {
    setLoading(true);
    const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/designations`, {
  headers: { Authorization: `Bearer ${token}` }
});

    setDesignations(res.data.data || []);
    console.log(res.data.data)
    setLoading(false);
  };

  const fetchDepartments = async () => {
    const res = await axios.get(
      `${import.meta.env.VITE_API_URL}/api/departments`,{
  headers: { Authorization: `Bearer ${token}` }
}
    );
    setDepartments(res.data.data || []);
  };

  const fetchBranches = async () => {
  const res = await axios.get(
    `${import.meta.env.VITE_API_URL}/api/branch`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  setBranches(res.data.data || []);
console.log(res)
};
useEffect(() => {
  fetchDesignations();
  fetchDepartments();
  fetchBranches();
}, []);

  /* ===================== SUBMIT ===================== */
const onSubmit = async (data) => {
  try {
    if (!selectedBranch) {
      Swal.fire("Error", "Please select branch", "error");
      return;
    }

    const payload = {
      ...data,
      branchId: selectedBranch, // 🔥 REQUIRED
    };

    if (editId) {
      await axios.put(
        `${import.meta.env.VITE_API_URL}/api/designations/${editId}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setEditId(null);
    } else {
      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/designations`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );
    }

    Swal.fire("Success", "Designation saved", "success");
    reset();
    fetchDesignations();
  } catch (err) {
    Swal.fire(
      "Error",
      err.response?.data?.message || "Failed to save designation",
      "error"
    );
  }
};


const handleEdit = (item) => {
  setValue("name", item.name);
  setValue("departmentId", item.departmentId?._id);
  setSelectedBranch(item.branchId?._id); // 🔥 REQUIRED
  setEditId(item._id);
};


  const handleDelete = async (id) => {
    const confirm = await Swal.fire({
      title: "Delete?",
      icon: "warning",
      showCancelButton: true,
    });
    if (!confirm.isConfirmed) return;

    await axios.delete(
      `${import.meta.env.VITE_API_URL}/api/designations/${id}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    fetchDesignations();
  };
const filteredDepartments = selectedBranch
  ? departments.filter(d => d.branchId?._id === selectedBranch)
  : [];
  /* ===================== FILTER ===================== */
  const filteredDesignations = designations.filter(
    (d) =>
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.departmentId?.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="dept-page">
        <Container>
          <div className="dept-card">
            <div className="d-flex justify-content-between mb-3">
              <div className="dept-title d-flex align-items-center">
                <FcApproval className="me-1" /> Designation Management
              </div>
              <Form.Control
                placeholder="Search designation / department"
                className="glass-input"
                style={{ maxWidth: 260 }}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* ===================== FORM ===================== */}
            <Form onSubmit={handleSubmit(onSubmit)} className="mb-4">
              <div className="row g-2">
                <div className="col-md-4">
  <Form.Select
    className="glass-input"
    value={selectedBranch}
    onChange={(e) => setSelectedBranch(e.target.value)}
  >
    <option value="">Select Branch</option>
    {branches.map((b) => (
      <option key={b._id} value={b._id}>
        {b.name}
      </option>
    ))}
  </Form.Select>
</div>
                <div className="col-md-4">
                  <Form.Select {...register("departmentId")} className="glass-input">
                    <option value="">Select Department</option>
                    {filteredDepartments.map((d) => (
  <option key={d._id} value={d._id}>{d.name}</option>
))}
                  </Form.Select>
                  {errors.departmentId && (
                    <small className="text-danger">{errors.departmentId.message}</small>
                  )}
                </div>

                <div className="col-md-4">
                  <Form.Control
                    placeholder="Designation Name"
                    className="glass-input"
                    {...register("name")}
                  />
                  {errors.name && (
                    <small className="text-danger">{errors.name.message}</small>
                  )}
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
                    <th>S No.</th>
                    <th>Designation</th>
                    <th>Department</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDesignations.length === 0 ? (
                    <tr>
                      <td colSpan="4">No records found</td>
                    </tr>
                  ) : (
                    filteredDesignations.map((d, i) => (
                      <tr key={d._id}>
                        <td>{i + 1}</td>
                        <td>{d.name}</td>
                        <td>{d.departmentId?.name}</td>
                        <td>
                          <Button
                            size="sm"
                            variant="warning"
                            className="me-2"
                            onClick={() => handleEdit(d)}
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

export default DesignationManagement;
