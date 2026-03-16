import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import axios from "axios";
import Swal from "sweetalert2";
import { FaTrash, FaComments, FaEllipsisV, FaClock, FaPlus, FaTimes, FaTasks } from "react-icons/fa";
import "./ProjectManagement.css";

const TaskModal = ({ show, handleClose, project }) => {
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [expandedTask, setExpandedTask] = useState(null);
  const [activeTab, setActiveTab] = useState('comments');
  const [tempInput, setTempInput] = useState("");
  
  const [openDropdownId, setOpenDropdownId] = useState(null);

  // ✅ PERMISSION LOGIC
  const userStr = localStorage.getItem("user");
  const userObj = userStr ? JSON.parse(userStr) : null;
  const token = userObj?.token;
  const role = userObj?.role;
  const userId = userObj?.id;
  const isAdmin = role === "admin";
  const [perms, setPerms] = useState({ view: false, create: false, edit: false, delete: false });

  const axiosInstance = axios.create({ baseURL: import.meta.env.VITE_API_URL });
  axiosInstance.interceptors.request.use((config) => {
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });

  const { register, handleSubmit, reset } = useForm();

  useEffect(() => {
    const fetchPerms = async () => {
      if (isAdmin || !token) return;
      try {
        const res = await axiosInstance.get(`/api/my-modules`);
        if (res.data.detailed?.project) {
          setPerms(res.data.detailed.project);
        }
      } catch (e) { console.error("Permission fetch failed", e); }
    };
    fetchPerms();
  }, [token, isAdmin, axiosInstance]);

  useEffect(() => {
    const handleGlobalClick = () => setOpenDropdownId(null);
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  useEffect(() => {
    if (project && show) {
      fetchTasks();
      fetchEmployees();
      setShowAddForm(false);
      setOpenDropdownId(null);
    }
  }, [project, show]);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(`/api/projects/${project._id}`);
      setTasks(res.data.data.tasks);
    } catch { } finally { setLoading(false); }
  };

  const fetchEmployees = async () => {
    try {
      const res = await axiosInstance.get("/user/");
      setEmployees(res.data.data.filter((e) => e.role === "employee"));
    } catch { }
  };

  const handleAddTask = async (data) => {
    try {
      const assignedToIds = selectedEmployees.map((emp) => emp._id);
      await axiosInstance.post(`/api/projects/${project._id}/tasks`, { 
        ...data, 
        assignedTo: assignedToIds.length === 1 ? assignedToIds[0] : assignedToIds 
      });
      reset(); setSelectedEmployees([]); setShowAddForm(false); fetchTasks();
    } catch { Swal.fire("Error", "Failed", "error"); }
  };

  const handleDeleteTask = async (taskId) => {
    setOpenDropdownId(null);
    if (await Swal.fire({ title: 'Delete Task?', icon: 'warning', showCancelButton: true, confirmButtonColor: '#ef4444', background: 'var(--pm-surface)', color: 'var(--pm-text-primary)' }).then(r => r.isConfirmed)) {
      await axiosInstance.delete(`/api/projects/${project._id}/tasks/${taskId}`);
      fetchTasks();
    }
  };

  const handleStatusChange = async (taskId, status) => {
    await axiosInstance.put(`/api/projects/${project._id}/tasks/${taskId}/status`, { status });
    fetchTasks();
  };

  const handleAddComment = async (taskId) => {
    if (!tempInput) return;
    await axiosInstance.post(`/api/projects/${project._id}/tasks/${taskId}/comments`, { commentText: tempInput, commentedBy: userId });
    setTempInput(""); fetchTasks();
  };

  const handleAddLog = async (taskId) => {
    if (!tempInput) return;
    await axiosInstance.post(`/api/projects/${project._id}/tasks/${taskId}/timelogs`, { employeeId: userId, hours: tempInput });
    setTempInput(""); fetchTasks();
  };

  if (!show) return null;

  const canCreate = isAdmin || perms.create;
  const canEdit = isAdmin || perms.edit;
  const canDelete = isAdmin || perms.delete;

  return (
    <div className="pm-modal-overlay" onClick={handleClose}>
      <div className="pm-modal-box modal-xl" onClick={(e) => e.stopPropagation()}>
        
        <div className="pm-modal-header">
          <h5 className="modal-title fw-bold d-flex align-items-center gap-2 m-0">
            <FaTasks className="text-primary"/> Task Manager
            <span className="text-muted fw-normal fs-6">| {project?.name}</span>
          </h5>
          <button type="button" className="btn-close" onClick={handleClose}></button>
        </div>

        <div className="pm-modal-body p-0">
          
          {/* === PROTECTED ADD TASK SECTION === */}
          {canCreate && (
            <div className="p-4 border-bottom" style={{ borderColor: 'var(--pm-border)', background: 'var(--pm-surface-hover)' }}>
              {!showAddForm ? (
                <button className="pm-btn" onClick={() => setShowAddForm(true)}>
                  <FaPlus /> Add New Task
                </button>
              ) : (
                <div className="animate__animated animate__fadeIn">
                  <div className="d-flex justify-content-between mb-3 align-items-center">
                    <h5 className="m-0 fw-bold">New Task Details</h5>
                    <button className="pm-btn-secondary py-1 px-2 h-auto" onClick={() => setShowAddForm(false)}><FaTimes/></button>
                  </div>
                  <form onSubmit={handleSubmit(handleAddTask)}>
                    <div className="row g-3">
                      <div className="col-md-6">
                        <input className="pm-input w-100" placeholder="Task Title" {...register("title")} required />
                      </div>
                      <div className="col-md-3">
                        <input type="date" className="pm-input w-100" {...register("dueDate")} required />
                      </div>
                      <div className="col-md-3">
                        <select className="pm-input w-100" onChange={(e) => {
                          const emp = employees.find(em => em._id === e.target.value);
                          if (emp && !selectedEmployees.find(s => s._id === emp._id)) setSelectedEmployees([...selectedEmployees, emp]);
                        }}>
                          <option value="">+ Assign Team</option>
                          {employees.map(e => <option key={e._id} value={e._id}>{e.name}</option>)}
                        </select>
                      </div>
                      <div className="col-12">
                        <textarea className="pm-input w-100" placeholder="Task Description..." rows={2} {...register("description")}></textarea>
                      </div>
                      
                      <div className="col-12 d-flex gap-2 flex-wrap">
                        {selectedEmployees.map(emp => (
                          <div key={emp._id} className="pm-user-badge" style={{cursor: 'pointer'}} onClick={() => setSelectedEmployees(selectedEmployees.filter(e => e._id !== emp._id))}>
                             <div className="pm-user-avatar">{emp.name.charAt(0)}</div>
                             {emp.name} <FaTimes size={10} className="ms-1"/>
                          </div>
                        ))}
                      </div>

                      <div className="col-12 text-end">
                        <button type="submit" className="pm-btn">Create Task</button>
                      </div>
                    </div>
                  </form>
                </div>
              )}
            </div>
          )}

          {/* === TASK LIST TABLE === */}
          <div className="table-responsive" style={{ overflow: 'visible' }}>
            <table className="pm-table">
              <thead>
                <tr>
                  <th style={{ paddingLeft: '24px' }}>Task</th>
                  <th>Assigned To</th>
                  <th>Due Date</th>
                  <th>Status</th>
                  <th className="text-end" style={{ paddingRight: '24px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? <tr><td colSpan="5" className="text-center py-5">Loading...</td></tr> :
                  tasks.length === 0 ? <tr><td colSpan="5" className="text-center py-5 text-muted">No tasks found.</td></tr> :
                    tasks.map(t => (
                      <React.Fragment key={t._id}>
                        <tr onClick={() => setExpandedTask(expandedTask === t._id ? null : t._id)} style={{ cursor: 'pointer', borderLeft: expandedTask === t._id ? '4px solid var(--pm-primary)' : '4px solid transparent' }}>
                          <td style={{ paddingLeft: '20px' }}>
                            <div className="fw-bold">{t.title}</div>
                            <div className="small text-muted text-truncate" style={{ maxWidth: 200 }}>{t.description}</div>
                          </td>
                          <td>
                             <div className="d-flex flex-wrap gap-1">
                                {(Array.isArray(t.assignedTo) ? t.assignedTo : [t.assignedTo]).map((emp, i) => (
                                  <div key={i} className="pm-user-badge m-0" title={emp?.name}>
                                      <div className="pm-user-avatar">{emp?.name?.charAt(0)}</div>
                                      <span className="d-none d-lg-inline">{emp?.name?.split(' ')[0]}</span>
                                  </div>
                                ))}
                             </div>
                          </td>
                          <td className="small">{t.dueDate?.slice(0, 10)}</td>
                          <td>
                            {/* Employee ya Edit permission wale status update kar sakte hain */}
                            {role === 'employee' || canEdit ? (
                              <select 
                                className="pm-input py-0 px-2" 
                                onClick={(e) => e.stopPropagation()} 
                                onChange={(e) => handleStatusChange(t._id, e.target.value)} 
                                value={t.status} 
                                style={{ width: '130px', fontSize: '12px', height: '30px' }}
                              >
                                <option value="pending">Pending</option>
                                <option value="in-progress">In Progress</option>
                                <option value="completed">Completed</option>
                              </select>
                            ) : (
                              <span className={`pm-badge ${t.status === 'pending' ? 'not-started' : t.status}`}>{t.status.replace('-', ' ')}</span>
                            )}
                          </td>
                          <td className="text-end" style={{ paddingRight: '24px' }}>
                            <div className="d-flex justify-content-end align-items-center gap-2">
                              <button className={`pm-btn-secondary ${expandedTask === t._id ? 'active' : ''}`} style={{ fontSize: '12px', padding: '4px 12px', height: '30px' }}>
                                {expandedTask === t._id ? "Close" : "View"}
                              </button>

                              {/* ✅ PROTECTED ELLIPSIS (EDIT/DELETE) */}
                              {(canEdit || canDelete) && (
                                <div className="position-relative">
                                  <button 
                                    className="btn btn-sm text-secondary border-0 p-0 d-flex align-items-center"
                                    onClick={(e) => { 
                                      e.stopPropagation(); 
                                      setOpenDropdownId(openDropdownId === t._id ? null : t._id); 
                                    }}
                                  >
                                    <div className="p-2"><FaEllipsisV /></div>
                                  </button>

                                  {openDropdownId === t._id && (
                                    <div className="dropdown-menu show position-absolute end-0 mt-1 shadow-sm border" style={{ zIndex: 1050, minWidth: '120px' }}>
                                      {canDelete && (
                                        <button 
                                          className="dropdown-item text-danger d-flex align-items-center bg-transparent border-0 w-100" 
                                          onClick={(e) => { 
                                            e.stopPropagation(); 
                                            handleDeleteTask(t._id); 
                                          }}
                                        >
                                          <FaTrash className="me-2 mt-1" /> Delete
                                        </button>
                                      )}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                        
                        {expandedTask === t._id && (
                          <tr>
                            <td colSpan="5" className="p-0 border-bottom">
                              <div className="p-4" style={{ backgroundColor: 'var(--pm-surface-hover)' }}>
                                <div className="pm-tab-container">
                                   <div className={`pm-tab ${activeTab === 'comments' ? 'active' : ''}`} onClick={() => setActiveTab('comments')}>
                                      <FaComments /> Comments
                                   </div>
                                   <div className={`pm-tab ${activeTab === 'logs' ? 'active' : ''}`} onClick={() => setActiveTab('logs')}>
                                      <FaClock /> Time Logs
                                   </div>
                                </div>

                                {activeTab === 'comments' ? (
                                  <div className="animate__animated animate__fadeIn">
                                    <div className="mb-3 p-3 rounded border" style={{ maxHeight: '250px', overflowY: 'auto', background: 'var(--pm-surface)', borderColor: 'var(--pm-border)' }}>
                                      {t.comments?.length > 0 ? t.comments.map((c, i) => (
                                        <div key={i} className="mb-3 d-flex gap-3">
                                          <div className="pm-user-avatar" style={{width: '32px', height: '32px'}}>{c.commentedBy?.name?.charAt(0)}</div>
                                          <div className="w-100">
                                              <div className="d-flex justify-content-between align-items-baseline">
                                                  <strong className="text-primary small">{c.commentedBy?.name}</strong>
                                                  <span className="text-muted" style={{ fontSize: '11px' }}>{new Date(c.date || Date.now()).toLocaleDateString()}</span>
                                              </div>
                                              <div className="mt-1 small p-2 rounded" style={{background: 'var(--pm-surface-hover)'}}>{c.commentText}</div>
                                          </div>
                                        </div>
                                      )) : <div className="text-muted small text-center py-3">No comments yet. Start the conversation!</div>}
                                    </div>
                                    <div className="d-flex gap-2">
                                      <input className="pm-input w-100" placeholder="Type a message..." value={tempInput} onChange={e => setTempInput(e.target.value)} />
                                      <button className="pm-btn" onClick={() => handleAddComment(t._id)}>Post</button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="animate__animated animate__fadeIn">
                                    <div className="mb-3">
                                      {t.timeLogs?.map((l, i) => (
                                        <div key={i} className="small mb-2 d-flex justify-content-between align-items-center p-2 rounded border" style={{ backgroundColor: 'var(--pm-surface)', borderColor: 'var(--pm-border)' }}>
                                          <div className="d-flex align-items-center gap-2">
                                              <div className="pm-user-avatar">{l.employeeId?.name?.charAt(0)}</div>
                                              <span className="fw-bold">{l.employeeId?.name}</span>
                                          </div>
                                          <span className="pm-badge in-progress d-flex align-items-center"><FaClock className="me-1 mt-1"/> {l.hours} hrs</span>
                                        </div>
                                      ))}
                                      {(!t.timeLogs || t.timeLogs.length === 0) && <div className="text-muted small text-center py-3">No time logged yet.</div>}
                                    </div>
                                    <div className="d-flex gap-2 align-items-center p-3 rounded border" style={{background: 'var(--pm-surface)', borderColor: 'var(--pm-border)'}}>
                                      <span className="small text-muted text-nowrap">Add Time:</span>
                                      <input type="number" className="pm-input" placeholder="0" style={{ width: '80px' }} value={tempInput} onChange={e => setTempInput(e.target.value)} />
                                      <span className="small text-muted">hrs</span>
                                      <button className="pm-btn ms-auto" onClick={() => handleAddLog(t._id)}>Log Time</button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="pm-modal-footer justify-content-between">
           <div className="small text-muted d-flex align-items-center">
              <FaClock className="me-2 mt-1"/> Showing {tasks.length} tasks
           </div>
          <button type="button" className="btn btn-link text-decoration-none text-muted" onClick={handleClose}>Close</button>
        </div>

      </div>
    </div>
  );
};

export default TaskModal;