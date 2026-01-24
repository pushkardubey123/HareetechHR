import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import axios from "axios";
import Swal from "sweetalert2";
import { Button, Form, Table, Card, Container } from "react-bootstrap";
import AdminLayout from "./AdminLayout";
import { FaMapMarkedAlt } from "react-icons/fa";
import Loader from "./Loader/Loader";

const schema = yup.object().shape({
  name: yup.string().required("Branch name is required"),
  address: yup.string().required("Branch address is required"),
  latitude: yup.number().required("Latitude is required"),
  longitude: yup.number().required("Longitude is required"),
  radius: yup.number().required("Radius is required"),
});

const Branch = () => {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editId, setEditId] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
  });

  const token = JSON.parse(localStorage.getItem("user"))?.token;

  // ================= FETCH BRANCHES (COMPANY BASED) =================
  const fetchBranches = async () => {
    setLoading(true);
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/branch`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setBranches(res.data.data || []);
    } catch (err) {
      Swal.fire("Error", "Failed to fetch branches", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  // ================= CREATE / UPDATE =================
  const onSubmit = async (data) => {
    try {
      if (editId) {
        const res = await axios.put(
          `${import.meta.env.VITE_API_URL}/api/branch/update/${editId}`,
          data,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        Swal.fire("Updated!", res.data.message, "success");
      } else {
        const res = await axios.post(
          `${import.meta.env.VITE_API_URL}/api/branch/create`,
          data,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        Swal.fire("Created!", res.data.message, "success");
      }

      reset();
      setEditId(null);
      fetchBranches();
    } catch (err) {
      Swal.fire(
        "Error",
        err.response?.data?.message || "Action failed",
        "error"
      );
    }
  };

  // ================= DELETE =================
  const handleDelete = async (branchId) => {
    const confirm = await Swal.fire({
      title: "Delete Branch?",
      text: "This action cannot be undone!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it!",
    });

    if (confirm.isConfirmed) {
      try {
        await axios.delete(
          `${import.meta.env.VITE_API_URL}/api/branch/delete/${branchId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        Swal.fire("Deleted!", "Branch removed successfully", "success");
        fetchBranches();
      } catch (err) {
        Swal.fire("Error", "Failed to delete branch", "error");
      }
    }
  };

  // ================= EDIT =================
  const handleEdit = (b) => {
    setEditId(b._id);
    setValue("name", b.name);
    setValue("address", b.address);
    setValue("latitude", b.latitude);
    setValue("longitude", b.longitude);
    setValue("radius", b.radius);
  };

  return (
    <AdminLayout>
      <Container className="mt-4">
        <Card className="shadow-lg rounded-4">
          <Card.Body>
            <h3 className="text-center mb-4 d-flex justify-content-center align-items-center gap-2 text-primary">
              <FaMapMarkedAlt />
              Branch Management
            </h3>

            {/* ================= FORM ================= */}
            <form onSubmit={handleSubmit(onSubmit)} className="mb-4">
              <div className="row">
                <div className="col-md-4">
                  <Form.Control
                    placeholder="Branch Name"
                    {...register("name")}
                    className="mb-2"
                  />
                  <small className="text-danger">
                    {errors.name?.message}
                  </small>
                </div>

                <div className="col-md-4">
                  <Form.Control
                    placeholder="Branch Address"
                    {...register("address")}
                    className="mb-2"
                  />
                  <small className="text-danger">
                    {errors.address?.message}
                  </small>
                </div>

                <div className="col-md-4">
                  <Form.Control
                    placeholder="Radius (meters)"
                    type="number"
                    {...register("radius")}
                    className="mb-2"
                  />
                  <small className="text-danger">
                    {errors.radius?.message}
                  </small>
                </div>

                <div className="col-md-4">
                  <Form.Control
                    placeholder="Latitude"
                    {...register("latitude")}
                    className="mb-2"
                  />
                  <small className="text-danger">
                    {errors.latitude?.message}
                  </small>
                </div>

                <div className="col-md-4">
                  <Form.Control
                    placeholder="Longitude"
                    {...register("longitude")}
                    className="mb-2"
                  />
                  <small className="text-danger">
                    {errors.longitude?.message}
                  </small>
                </div>

                <div className="col-md-4 d-grid">
                  <Button type="submit" variant={editId ? "secondary" : "dark"}>
                    {editId ? "Update Branch" : "Add Branch"}
                  </Button>
                </div>
              </div>
            </form>

            {/* ================= TABLE ================= */}
            {loading ? (
              <div className="text-center my-5">
                <Loader />
              </div>
            ) : branches.length === 0 ? (
              <p className="text-center text-muted fs-5">
                No branches available
              </p>
            ) : (
              <div className="table-responsive">
                <Table bordered hover className="text-center shadow-sm">
                  <thead className="table-primary">
                    <tr>
                      <th>#</th>
                      <th>Name</th>
                      <th>Address</th>
                      <th>Latitude</th>
                      <th>Longitude</th>
                      <th>Radius</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {branches.map((b, index) => (
                      <tr key={b._id}>
                        <td>{index + 1}</td>
                        <td>{b.name}</td>
                        <td>{b.address}</td>
                        <td>{b.latitude}</td>
                        <td>{b.longitude}</td>
                        <td>{b.radius} m</td>
                        <td>
                          <Button
                            variant="secondary"
                            size="sm"
                            className="me-2"
                            onClick={() => handleEdit(b)}
                          >
                            Edit
                          </Button>

                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleDelete(b._id)}
                          >
                            Delete
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            )}
          </Card.Body>
        </Card>
      </Container>
    </AdminLayout>
  );
};

export default Branch;
