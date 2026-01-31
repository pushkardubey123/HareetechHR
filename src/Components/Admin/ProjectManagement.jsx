import React, { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { useDispatch, useSelector } from "react-redux";
import { setProjects } from "../Redux/Slices/projectSlice";
import AdminLayout from "./AdminLayout";
import Loader from "./Loader/Loader";
import TaskModal from "./TaskModal";
// Icons
import { FaLayerGroup, FaSearch, FaPlus, FaEdit, FaTrash, FaTasks, FaCheckCircle, FaClock, FaEllipsisV, FaCalendarAlt } from "react-icons/fa";
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
        Swal.fire({ icon: 'success', title: 'Updated Successfully', timer: 1500, showConfirmButton: false });
      } else {
        await axios.post(`${import.meta.env.VITE_API_URL}/api/projects/projects`, data, config);
        Swal.fire({ icon: 'success', title: 'Project Created', timer: 1500, showConfirmButton: false });
      }
      setShowModal(false); reset(); fetchProjects();
    } catch { Swal.fire("Error", "Action failed", "error"); }
  };

  const filtered = projects.filter(p =>
      p.name.toLowerCase().includes(search.toLowerCase()) && (status ? p.status === status : true)
  );

  const CustomToggle = React.forwardRef(({ children, onClick }, ref) => (
    <button
      ref={ref}
      onClick={(e) => { e.preventDefault(); onClick(e); }}
      className="btn btn-sm btn-link text-decoration-none"
      style={{ color: 'var(--pm-text-secondary)' }}
    >
      {children}
    </button>
  ));

  return (
    <AdminLayout>
      {/* Wrapper Class ensures scoped CSS application */}
      <div className="pm-dashboard">
        
        {/* === HEADER === */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h3>Project Board</h3>
            <p>Track your team's progress and manage workflows.</p>
          </div>
          {role === "admin" && (
            <button className="pm-btn" onClick={() => { reset(); setEditingProject(null); setShowModal(true); }}>
              <FaPlus /> New Project
            </button>
          )}
        </div>

        {/* === STATS WIDGETS === */}
        <div className="pm-stats-grid">
           <div className="pm-stat-card">
              <div className="pm-icon-box blue"><FaLayerGroup /></div>
              <div>
                 <p>Total Projects</p>
                 <h3>{projects.length}</h3>
              </div>
           </div>
           <div className="pm-stat-card">
              <div className="pm-icon-box orange"><FaClock /></div>
              <div>
                 <p>In Progress</p>
                 <h3>{projects.filter(p=>p.status==='in-progress').length}</h3>
              </div>
           </div>
           <div className="pm-stat-card">
              <div className="pm-icon-box green"><FaCheckCircle /></div>
              <div>
                 <p>Completed</p>
                 <h3>{projects.filter(p=>p.status==='completed').length}</h3>
              </div>
           </div>
        </div>

        {/* === MAIN TABLE CARD === */}
        <div className="pm-surface-card">
          
          {/* Filters Bar */}
          <div className="p-3 border-bottom d-flex gap-3 flex-wrap" style={{borderColor: 'var(--pm-border)'}}>
             <div className="position-relative" style={{minWidth: '250px'}}>
                <FaSearch className="position-absolute" style={{top: '12px', left: '12px', color: 'var(--pm-text-secondary)'}}/>
                <input 
                    className="form-control ps-5" 
                    placeholder="Search projects..." 
                    value={search} 
                    onChange={(e) => setSearch(e.target.value)} 
                />
             </div>
             <select className="form-select" style={{width: '200px'}} value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="">All Statuses</option>
                <option value="not-started">Not Started</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
             </select>
          </div>

          {/* Table */}
          <div className="table-responsive">
             <table className="pm-table">
                <thead>
                   <tr>
                      <th>#</th>
                      <th>Project Name</th>
                      <th>Status</th>
                      <th>Timeline</th>
                      <th className="text-end">Actions</th>
                   </tr>
                </thead>
                <tbody>
                   {loading ? (
                      <tr><td colSpan="5" className="text-center py-5"><Loader /></td></tr>
                   ) : filtered.length === 0 ? (
                      <tr><td colSpan="5" className="text-center py-5 text-muted">No projects found.</td></tr>
                   ) : (
                      filtered.map((p, i) => (
                         <tr key={p._id}>
                            <td className="text-muted fw-bold">{i+1}</td>
                            <td>
                               <div className="fw-bold fs-6">{p.name}</div>
                               <div className="text-muted small text-truncate" style={{maxWidth: '250px'}}>{p.description || "No description"}</div>
                            </td>
                            <td>
                               <span className={`pm-badge ${p.status}`}>
                                  {p.status.replace('-', ' ')}
                               </span>
                            </td>
                            <td>
                               <div className="d-flex align-items-center gap-2 text-muted small fw-semibold">
                                  <FaCalendarAlt /> {p.startDate?.slice(0,10)} - {p.endDate?.slice(0,10)}
                               </div>
                            </td>
                            <td className="text-end">
                               <div className="d-flex justify-content-end align-items-center gap-2">
                                  <button className="d-flex justify-content-end align-items-center pm-btn-outline px-3 py-1 rounded-pill" onClick={() => { setSelectedProject(p); setShowTaskModal(true); }} style={{fontSize: '12px'}}>
                                     <FaTasks className="me-1" /> Tasks
                                  </button>
                                  
                                  {role === 'admin' && (
                                     <Dropdown align="end">
                                        <Dropdown.Toggle as={CustomToggle}>
                                           <FaEllipsisV />
                                        </Dropdown.Toggle>
                                        
                                        <Dropdown.Menu popperConfig={{ strategy: "fixed" }}>
                                           <Dropdown.Item className="d-flex align-item-center" onClick={() => { setEditingProject(p); reset(p); setShowModal(true); }}>
                                              <FaEdit className="me-2 mt-1 text-warning"/> Edit
                                           </Dropdown.Item>
                                           <Dropdown.Item className="text-danger d-flex align-item-center" onClick={async () => {
                                              const res = await Swal.fire({ 
                                                  title: 'Delete Project?', 
                                                  text: "This action cannot be undone.", 
                                                  icon: 'warning', 
                                                  showCancelButton: true,
                                                  confirmButtonColor: '#ef4444',
                                                  background: 'var(--pm-surface)',
                                                  color: 'var(--pm-text-primary)'
                                              });
                                              if(res.isConfirmed) {
                                                 await axios.delete(`${import.meta.env.VITE_API_URL}/api/projects/${p._id}`, { headers: { Authorization: `Bearer ${token}` } });
                                                 fetchProjects();
                                              }
                                           }}>
                                              <FaTrash className="me-2 mt-1"/> Delete
                                           </Dropdown.Item>
                                        </Dropdown.Menu>
                                     </Dropdown>
                                  )}
                               </div>
                            </td>
                         </tr>
                      ))
                   )}
                </tbody>
             </table>
          </div>
        </div>

        {/* === CREATE/EDIT MODAL === */}
        <Modal show={showModal} onHide={() => setShowModal(false)} centered backdrop="static" className="pm-modal">
          <Modal.Header closeButton>
            <Modal.Title className="fw-bold">{editingProject ? "Edit Project" : "Create Project"}</Modal.Title>
          </Modal.Header>
          <Form onSubmit={handleSubmit(onSave)}>
            <Modal.Body className="p-4">
              <Form.Group className="mb-3">
                 <Form.Label>Project Name</Form.Label>
                 <Form.Control {...register("name")} required placeholder="e.g. Website Redesign" />
              </Form.Group>
              <Form.Group className="mb-3">
                 <Form.Label>Description</Form.Label>
                 <Form.Control as="textarea" rows={3} {...register("description")} placeholder="Project goals and details..." />
              </Form.Group>
              <div className="row">
                 <div className="col-6 mb-3">
                    <Form.Label>Start Date</Form.Label>
                    <Form.Control type="date" {...register("startDate")} required />
                 </div>
                 <div className="col-6 mb-3">
                    <Form.Label>End Date</Form.Label>
                    <Form.Control type="date" {...register("endDate")} required />
                 </div>
              </div>
              <Form.Group className="mb-3">
                 <Form.Label>Status</Form.Label>
                 <Form.Select {...register("status")} required>
                    <option value="not-started">Not Started</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                 </Form.Select>
              </Form.Group>
            </Modal.Body>
            <Modal.Footer>
               <Button variant="link" className="text-decoration-none text-muted" onClick={() => setShowModal(false)}>Cancel</Button>
               <Button type="submit" className="pm-btn">Save Project</Button>
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