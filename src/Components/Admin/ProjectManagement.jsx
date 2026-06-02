import React, { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { useDispatch, useSelector } from "react-redux";
import { setProjects } from "../Redux/Slices/projectSlice";
import DynamicLayout from "../Common/DynamicLayout";
import Loader from "./Loader/Loader";
import TaskModal from "./TaskModal";
import { FaLayerGroup, FaSearch, FaPlus, FaEdit, FaTrash, FaTasks, FaCheckCircle, FaClock, FaEllipsisV, FaCalendarAlt } from "react-icons/fa";
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
  const [openDropdownId, setOpenDropdownId] = useState(null);

  const { register, handleSubmit, reset } = useForm();
  
  // ✅ PERMISSION LOGIC
  const userStr = localStorage.getItem("user");
  const userObj = userStr ? JSON.parse(userStr) : null;
  const token = userObj?.token;
  const isAdmin = userObj?.role === "admin";
  const [perms, setPerms] = useState({ view: false, create: false, edit: false, delete: false });

  useEffect(() => {
    const fetchPerms = async () => {
      if (isAdmin || !token) return;
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/my-modules`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.detailed?.project) {
          setPerms(res.data.detailed.project);
        }
      } catch (e) { console.error("Permission fetch failed", e); }
    };
    fetchPerms();
    fetchProjects();
  }, [token, isAdmin]);

  useEffect(() => {
    const handleGlobalClick = () => setOpenDropdownId(null);
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

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

  const handleDeleteProject = async (projectId) => {
    setOpenDropdownId(null);
    const result = await Swal.fire({ 
      title: 'Delete Project?', text: "This action cannot be undone.", icon: 'warning', 
      showCancelButton: true, confirmButtonColor: '#ef4444', background: 'var(--pm-surface)', color: 'var(--pm-text-primary)'
    });
    
    if(result.isConfirmed) {
       await axios.delete(`${import.meta.env.VITE_API_URL}/api/projects/${projectId}`, { headers: { Authorization: `Bearer ${token}` } });
       fetchProjects();
    }
  };

  const filtered = projects.filter(p =>
      p.name.toLowerCase().includes(search.toLowerCase()) && (status ? p.status === status : true)
  );

  const canCreate = isAdmin || perms.create;
  const canEdit = isAdmin || perms.edit;
  const canDelete = isAdmin || perms.delete;

  return (
    <DynamicLayout>
      <div className="pm-dashboard">
        
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h3>Project Board</h3>
            <p>Track your team's progress and manage workflows.</p>
          </div>
          {/* ✅ PROTECTED CREATE PROJECT BUTTON */}
          {canCreate && (
            <button className="pm-btn" onClick={() => { reset(); setEditingProject(null); setShowModal(true); }}>
              <FaPlus /> New Project
            </button>
          )}
        </div>

        <div className="pm-stats-grid">
           <div className="pm-stat-card">
              <div className="pm-icon-box blue"><FaLayerGroup /></div>
              <div><p>Total Projects</p><h3>{projects.length}</h3></div>
           </div>
           <div className="pm-stat-card">
              <div className="pm-icon-box orange"><FaClock /></div>
              <div><p>In Progress</p><h3>{projects.filter(p=>p.status==='in-progress').length}</h3></div>
           </div>
           <div className="pm-stat-card">
              <div className="pm-icon-box green"><FaCheckCircle /></div>
              <div><p>Completed</p><h3>{projects.filter(p=>p.status==='completed').length}</h3></div>
           </div>
        </div>

        <div className="pm-surface-card" style={{ overflow: 'visible' }}>
          <div className="p-3 border-bottom d-flex gap-3 flex-wrap" style={{borderColor: 'var(--pm-border)'}}>
             <div className="position-relative" style={{minWidth: '250px'}}>
                <FaSearch className="position-absolute" style={{top: '12px', left: '12px', color: 'var(--pm-text-secondary)'}}/>
                <input className="pm-input w-100 ps-5" placeholder="Search projects..." value={search} onChange={(e) => setSearch(e.target.value)} />
             </div>
             <select className="pm-input" style={{width: '200px'}} value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="">All Statuses</option>
                <option value="not-started">Not Started</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
             </select>
          </div>

          <div className="table-responsive" style={{ overflow: 'visible' }}>
             <table className="pm-table">
                <thead>
                   <tr><th>#</th><th>Project Name</th><th>Status</th><th>Timeline</th><th className="text-end">Actions</th></tr>
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
                            <td><span className={`pm-badge ${p.status}`}>{p.status.replace('-', ' ')}</span></td>
                            <td>
                               <div className="d-flex align-items-center gap-2 text-muted small fw-semibold">
                                  <FaCalendarAlt /> {p.startDate?.slice(0,10)} - {p.endDate?.slice(0,10)}
                               </div>
                            </td>
                            <td className="text-end">
                               <div className="d-flex justify-content-end align-items-center gap-2">
                                  <button className="pm-btn-secondary py-1 rounded-pill" onClick={() => { setSelectedProject(p); setShowTaskModal(true); }}>
                                     <FaTasks /> Tasks
                                  </button>
                                  
                                  {/* ✅ PROTECTED EDIT/DELETE DOTS MENU */}
                                  {(canEdit || canDelete) && (
                                    <div className="position-relative">
                                      <button 
                                        className="btn btn-sm text-secondary border-0 p-0 d-flex align-items-center" 
                                        onClick={(e) => { 
                                          e.stopPropagation(); 
                                          setOpenDropdownId(openDropdownId === p._id ? null : p._id); 
                                        }}
                                      >
                                        <div className="p-2"><FaEllipsisV /></div>
                                      </button>

                                      {openDropdownId === p._id && (
                                        <div 
                                          className="dropdown-menu show position-absolute shadow-sm border pm-dropdown-float" 
                                          style={{ zIndex: 9999, minWidth: '150px', right: '25px', top: '25px', backgroundColor: 'var(--pm-surface)' }}
                                        >
                                          {canEdit && (
                                            <button 
                                              className="dropdown-item d-flex align-items-center bg-transparent border-0 w-100" 
                                              onClick={(e) => { 
                                                e.stopPropagation(); setEditingProject(p); reset(p); setShowModal(true); setOpenDropdownId(null); 
                                              }}
                                            >
                                              <FaEdit className="me-2 text-warning"/> Edit Project
                                            </button>
                                          )}
                                          {canDelete && (
                                            <button 
                                              className="dropdown-item text-danger d-flex align-items-center bg-transparent border-0 w-100 mt-1" 
                                              onClick={(e) => { 
                                                e.stopPropagation(); handleDeleteProject(p._id); 
                                              }}
                                            >
                                              <FaTrash className="me-2 mt-1" /> Delete Project
                                            </button>
                                          )}
                                        </div>
                                      )}
                                    </div> 
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

        {showModal && (
          <div className="pm-modal-overlay" onClick={() => setShowModal(false)}>
            <div className="pm-modal-box" onClick={(e) => e.stopPropagation()}>
              <div className="pm-modal-header">
                <h5 className="modal-title fw-bold">{editingProject ? "Edit Project" : "Create Project"}</h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <form onSubmit={handleSubmit(onSave)}>
                <div className="pm-modal-body">
                  <div className="mb-3">
                     <label className="fw-bold mb-1 small text-secondary">Project Name</label>
                     <input className="pm-input w-100" {...register("name")} required placeholder="e.g. Website Redesign" />
                  </div>
                  <div className="mb-3">
                     <label className="fw-bold mb-1 small text-secondary">Description</label>
                     <textarea className="pm-input w-100" rows={3} {...register("description")} placeholder="Project goals and details..."></textarea>
                  </div>
                  <div className="row">
                     <div className="col-6 mb-3">
                        <label className="fw-bold mb-1 small text-secondary">Start Date</label>
                        <input type="date" className="pm-input w-100" {...register("startDate")} required />
                     </div>
                     <div className="col-6 mb-3">
                        <label className="fw-bold mb-1 small text-secondary">End Date</label>
                        <input type="date" className="pm-input w-100" {...register("endDate")} required />
                     </div>
                  </div>
                  <div className="mb-3">
                     <label className="fw-bold mb-1 small text-secondary">Status</label>
                     <select className="pm-input w-100" {...register("status")} required>
                        <option value="not-started">Not Started</option>
                        <option value="in-progress">In Progress</option>
                        <option value="completed">Completed</option>
                     </select>
                  </div>
                </div>
                <div className="pm-modal-footer">
                   <button type="button" className="btn btn-link text-decoration-none text-muted" onClick={() => setShowModal(false)}>Cancel</button>
                   <button type="submit" className="pm-btn"><FaCheckCircle/> Save Project</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {selectedProject && (
          <TaskModal show={showTaskModal} handleClose={() => setShowTaskModal(false)} project={selectedProject} />
        )}
      </div>
    </DynamicLayout>
  );
};

export default ProjectManagement;