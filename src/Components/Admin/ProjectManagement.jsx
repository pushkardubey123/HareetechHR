import React, { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { useDispatch, useSelector } from "react-redux";
import { setProjects } from "../Redux/Slices/projectSlice";
import AdminLayout from "./AdminLayout";
import Loader from "./Loader/Loader";
import TaskModal from "./TaskModal";
// Icons
import { FaProjectDiagram, FaSearch, FaPlus, FaEdit, FaTrash, FaTasks, FaCheckDouble, FaHourglassHalf } from "react-icons/fa";
// Bootstrap Components
import { Modal, Button, Form, Dropdown } from "react-bootstrap";
import { useForm } from "react-hook-form";
import "./ProjectManagement.css";

const ProjectManagement = () => {
  const dispatch = useDispatch();
  const projects = useSelector((state) => state.project.list);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);

  const { register, handleSubmit, reset } = useForm();
  const user = JSON.parse(localStorage.getItem("user"));
  const token = user?.token;
  const role = user?.role;

  useEffect(() => { fetchProjects(); }, []);

  const fetchProjects = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/projects`, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      dispatch(setProjects(res.data.data || []));
    } catch {
      Swal.fire("Error", "Failed to load projects", "error");
    } finally {
      setLoading(false);
    }
  };

  const onSave = async (data) => {
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      if (editingProject) {
        await axios.put(`${import.meta.env.VITE_API_URL}/api/projects/${editingProject._id}`, data, config);
        Swal.fire({ icon: 'success', title: 'Updated', timer: 1500, showConfirmButton: false });
      } else {
        await axios.post(`${import.meta.env.VITE_API_URL}/api/projects/projects`, data, config);
        Swal.fire({ icon: 'success', title: 'Created', timer: 1500, showConfirmButton: false });
      }
      setShowModal(false); reset(); fetchProjects();
    } catch { Swal.fire("Error", "Action failed", "error"); }
  };

  const filtered = projects.filter(p =>
      p.name.toLowerCase().includes(search.toLowerCase()) && (status ? p.status === status : true)
  );

  return (
    <AdminLayout>
      <div className="pm-container">
        
        {/* === HEADER === */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h3 className="fw-bold m-0 d-flex align-items-center gap-2">
               <FaProjectDiagram className="text-primary"/> Projects
            </h3>
            <p className="text-muted small m-0">Manage project lifecycles and tasks.</p>
          </div>
          {role === "admin" && (
            <button className="btn-primary-custom d-flex align-items-center gap-2" onClick={() => { reset(); setEditingProject(null); setShowModal(true); }}>
              <FaPlus /> Add Project
            </button>
          )}
        </div>

        {/* === STATS WIDGETS === */}
        <div className="row g-3 mb-4">
           <div className="col-md-4">
              <div className="stat-box">
                 <div className="stat-icon bg-primary bg-opacity-10 text-primary"><FaProjectDiagram /></div>
                 <div>
                    <h6 className="text-muted mb-0 small fw-bold">TOTAL</h6>
                    <h3 className="mb-0 fw-bold">{projects.length}</h3>
                 </div>
              </div>
           </div>
           <div className="col-md-4">
              <div className="stat-box">
                 <div className="stat-icon bg-warning bg-opacity-10 text-warning"><FaHourglassHalf /></div>
                 <div>
                    <h6 className="text-muted mb-0 small fw-bold">IN PROGRESS</h6>
                    <h3 className="mb-0 fw-bold">{projects.filter(p=>p.status==='in-progress').length}</h3>
                 </div>
              </div>
           </div>
           <div className="col-md-4">
              <div className="stat-box">
                 <div className="stat-icon bg-success bg-opacity-10 text-success"><FaCheckDouble /></div>
                 <div>
                    <h6 className="text-muted mb-0 small fw-bold">COMPLETED</h6>
                    <h3 className="mb-0 fw-bold">{projects.filter(p=>p.status==='completed').length}</h3>
                 </div>
              </div>
           </div>
        </div>

        {/* === MAIN CARD === */}
        <div className="structure-card p-0 overflow-hidden">
          
          {/* Filters */}
          <div className="p-3 border-bottom d-flex flex-column flex-md-row gap-3">
             <div className="input-group" style={{maxWidth: '350px'}}>
                <span className="input-group-text bg-transparent border-end-0 border-secondary"><FaSearch className="text-muted"/></span>
                <input className="form-control form-control-custom border-start-0" placeholder="Search projects..." value={search} onChange={(e) => setSearch(e.target.value)} />
             </div>
             <select className="form-select form-select-custom" style={{width: '200px'}} value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="">All Statuses</option>
                <option value="not-started">Not Started</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
             </select>
          </div>

          {/* Table */}
          <div className="table-responsive">
             <table className="custom-table">
                <thead>
                   <tr>
                      <th>#</th>
                      <th>Project Name</th>
                      <th>Description</th>
                      <th>Status</th>
                      <th>Dates</th>
                      <th className="text-end">Actions</th>
                   </tr>
                </thead>
                <tbody>
                   {loading ? (
                      <tr><td colSpan="6" className="text-center py-5"><Loader /></td></tr>
                   ) : filtered.length === 0 ? (
                      <tr><td colSpan="6" className="text-center py-5 text-muted">No projects found.</td></tr>
                   ) : (
                      filtered.map((p, i) => (
                         <tr key={p._id}>
                            <td className="text-muted">{i+1}</td>
                            <td className="fw-bold">{p.name}</td>
                            <td className="text-muted small text-truncate" style={{maxWidth: '250px'}}>{p.description || "-"}</td>
                            <td>
                               <span className={`badge-custom ${p.status}`}>
                                  {p.status.replace('-', ' ')}
                               </span>
                            </td>
                            <td className="small">
                               {p.startDate?.slice(0,10)} <span className="text-muted mx-1">to</span> {p.endDate?.slice(0,10)}
                            </td>
                            <td className="text-end">
                               <Button variant="light" size="sm" className="me-1 border" title="View Tasks" onClick={() => { setSelectedProject(p); setShowTaskModal(true); }}>
                                  <FaTasks />
                               </Button>
                               {role === 'admin' && (
                                  <Dropdown className="d-inline">
                                     <Dropdown.Toggle variant="light" size="sm" className="border btn-sm-square">⋮</Dropdown.Toggle>
                                     <Dropdown.Menu align="end">
                                        <Dropdown.Item onClick={() => { setEditingProject(p); reset(p); setShowModal(true); }}>
                                           <FaEdit className="me-2 text-warning"/> Edit
                                        </Dropdown.Item>
                                        <Dropdown.Item onClick={async () => {
                                           const res = await Swal.fire({ title: 'Delete?', icon: 'warning', showCancelButton: true });
                                           if(res.isConfirmed) {
                                              await axios.delete(`${import.meta.env.VITE_API_URL}/api/projects/${p._id}`, { headers: { Authorization: `Bearer ${token}` } });
                                              fetchProjects();
                                           }
                                        }}>
                                           <FaTrash className="me-2 text-danger"/> Delete
                                        </Dropdown.Item>
                                     </Dropdown.Menu>
                                  </Dropdown>
                               )}
                            </td>
                         </tr>
                      ))
                   )}
                </tbody>
             </table>
          </div>
        </div>

        {/* === CREATE/EDIT MODAL === */}
        <Modal show={showModal} onHide={() => setShowModal(false)} centered backdrop="static">
          <Modal.Header closeButton>
            <Modal.Title>{editingProject ? "Edit Project" : "Create New Project"}</Modal.Title>
          </Modal.Header>
          <Form onSubmit={handleSubmit(onSave)}>
            <Modal.Body>
              <Form.Group className="mb-3">
                 <Form.Label>Project Name</Form.Label>
                 <Form.Control className="form-control-custom" {...register("name")} required />
              </Form.Group>
              <Form.Group className="mb-3">
                 <Form.Label>Description</Form.Label>
                 <Form.Control className="form-control-custom" as="textarea" rows={3} {...register("description")} />
              </Form.Group>
              <div className="row">
                 <div className="col-6 mb-3">
                    <Form.Label>Start Date</Form.Label>
                    <Form.Control type="date" className="form-control-custom" {...register("startDate")} required />
                 </div>
                 <div className="col-6 mb-3">
                    <Form.Label>End Date</Form.Label>
                    <Form.Control type="date" className="form-control-custom" {...register("endDate")} required />
                 </div>
              </div>
              <Form.Group className="mb-3">
                 <Form.Label>Status</Form.Label>
                 <Form.Select className="form-select-custom" {...register("status")} required>
                    <option value="not-started">Not Started</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                 </Form.Select>
              </Form.Group>
            </Modal.Body>
            <Modal.Footer>
               <Button variant="secondary" onClick={() => setShowModal(false)}>Close</Button>
               <Button type="submit" className="btn-primary-custom">Save Changes</Button>
            </Modal.Footer>
          </Form>
        </Modal>

        {selectedProject && (
          <TaskModal show={showTaskModal} handleClose={() => setShowTaskModal(false)} project={selectedProject} />
        )}
      </div>
    </AdminLayout>
  );
};

export default ProjectManagement;