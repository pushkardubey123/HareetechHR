// (Previous TaskModal code is good, just ensure you utilize the new CSS file)
// Note: Bootstrap Modal automatically uses the z-index we defined in CSS. 
// No extra JS needed for z-index, the CSS fix handles it.
import React, { useEffect, useState } from "react";
import { Modal, Button, Form, Badge, Table } from "react-bootstrap";
import { useForm } from "react-hook-form";
import axios from "axios";
import Swal from "sweetalert2";
import { FaTrash, FaPlus, FaComments, FaClock } from "react-icons/fa";
import "./ProjectManagement.css";

const TaskModal = ({ show, handleClose, project }) => {
  // ... (Keep existing state logic) ...
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [expandedTask, setExpandedTask] = useState(null); 
  const [activeTab, setActiveTab] = useState('comments'); 
  const [tempInput, setTempInput] = useState("");

  const user = JSON.parse(localStorage.getItem("user"));
  const token = user?.token;
  const role = user?.role;
  const userId = user?.id;

  const axiosInstance = axios.create({ baseURL: import.meta.env.VITE_API_URL });
  axiosInstance.interceptors.request.use((config) => {
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });

  const { register, handleSubmit, reset } = useForm();

  useEffect(() => {
    if (project && show) {
      fetchTasks();
      fetchEmployees();
      setShowAddForm(false);
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
    } catch {}
  };

  const handleAddTask = async (data) => {
    try {
      const assignedToIds = selectedEmployees.map((emp) => emp._id);
      await axiosInstance.post(`/api/projects/${project._id}/tasks`, { ...data, assignedTo: assignedToIds.length === 1 ? assignedToIds[0] : assignedToIds });
      Swal.fire({ toast: true, icon: 'success', title: 'Task Added', timer: 1500, showConfirmButton: false });
      reset(); setSelectedEmployees([]); setShowAddForm(false); fetchTasks();
    } catch { Swal.fire("Error", "Failed", "error"); }
  };

  // ... (Other handlers like handleDeleteTask, handleStatusChange, etc. remain the same) ...
  const handleDeleteTask = async (taskId) => {
      if(await Swal.fire({ title: 'Delete?', icon: 'warning', showCancelButton: true }).then(r=>r.isConfirmed)){
          await axiosInstance.delete(`/api/projects/${project._id}/tasks/${taskId}`);
          fetchTasks();
      }
  };

  const handleStatusChange = async (taskId, status) => {
    await axiosInstance.put(`/api/projects/${project._id}/tasks/${taskId}/status`, { status });
    fetchTasks();
  };

  const handleAddComment = async (taskId) => {
      if(!tempInput) return;
      await axiosInstance.post(`/api/projects/${project._id}/tasks/${taskId}/comments`, { commentText: tempInput, commentedBy: userId });
      setTempInput(""); fetchTasks();
  };

  const handleAddLog = async (taskId) => {
      if(!tempInput) return;
      await axiosInstance.post(`/api/projects/${project._id}/tasks/${taskId}/timelogs`, { employeeId: userId, hours: tempInput });
      setTempInput(""); fetchTasks();
  };

  return (
    <Modal size="xl" show={show} onHide={handleClose} centered scrollable>
      <Modal.Header closeButton>
        <Modal.Title>Project Tasks</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {role === 'admin' && (
           <div className="mb-3">
              <Button variant={showAddForm ? "secondary" : "primary"} onClick={() => setShowAddForm(!showAddForm)}>
                 {showAddForm ? "Cancel" : "+ Add New Task"}
              </Button>
              {showAddForm && (
                 <div className="structure-card p-3 mt-3">
                    <Form onSubmit={handleSubmit(handleAddTask)}>
                       <div className="row g-3">
                          <div className="col-md-6">
                             <Form.Control className="form-control-custom" placeholder="Task Title" {...register("title")} required />
                          </div>
                          <div className="col-md-3">
                             <Form.Control type="date" className="form-control-custom" {...register("dueDate")} required />
                          </div>
                          <div className="col-md-3">
                             <Form.Select className="form-select-custom" onChange={(e)=>{
                                 const emp = employees.find(em=>em._id === e.target.value);
                                 if(emp && !selectedEmployees.find(s=>s._id===emp._id)) setSelectedEmployees([...selectedEmployees, emp]);
                             }}>
                                <option value="">Assign Employee</option>
                                {employees.map(e=><option key={e._id} value={e._id}>{e.name}</option>)}
                             </Form.Select>
                          </div>
                          <div className="col-12">
                             <Form.Control className="form-control-custom" as="textarea" placeholder="Description" rows={2} {...register("description")} />
                          </div>
                          <div className="col-12 d-flex gap-2">
                             {selectedEmployees.map(emp => (
                                <Badge key={emp._id} bg="info" className="p-2" style={{cursor:'pointer'}} onClick={()=>setSelectedEmployees(selectedEmployees.filter(e=>e._id!==emp._id))}>
                                   {emp.name} ✕
                                </Badge>
                             ))}
                          </div>
                          <div className="col-12 text-end">
                             <Button type="submit" variant="success">Save Task</Button>
                          </div>
                       </div>
                    </Form>
                 </div>
              )}
           </div>
        )}

        <div className="table-responsive">
            <table className="custom-table">
                <thead>
                    <tr>
                        <th>Task</th>
                        <th>Assigned</th>
                        <th>Due Date</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {loading ? <tr><td colSpan="5" className="text-center">Loading...</td></tr> : 
                     tasks.map(t => (
                        <React.Fragment key={t._id}>
                            <tr onClick={() => setExpandedTask(expandedTask === t._id ? null : t._id)} style={{cursor: 'pointer'}}>
                                <td>
                                    <div className="fw-bold">{t.title}</div>
                                    <div className="small text-muted text-truncate" style={{maxWidth: 200}}>{t.description}</div>
                                </td>
                                <td>
                                    {(Array.isArray(t.assignedTo) ? t.assignedTo : [t.assignedTo]).map((emp, i) => (
                                        <Badge key={i} bg="secondary" className="me-1">{emp?.name}</Badge>
                                    ))}
                                </td>
                                <td>{t.dueDate?.slice(0,10)}</td>
                                <td>
                                    {role === 'employee' ? (
                                        <Form.Select size="sm" className="form-select-custom py-0" value={t.status} onClick={(e)=>e.stopPropagation()} onChange={(e)=>handleStatusChange(t._id, e.target.value)}>
                                            <option value="pending">Pending</option>
                                            <option value="in-progress">In Progress</option>
                                            <option value="completed">Completed</option>
                                        </Form.Select>
                                    ) : (
                                        <span className={`badge-custom ${t.status === 'pending' ? 'not-started' : t.status}`}>{t.status}</span>
                                    )}
                                </td>
                                <td>
                                    <Button size="sm" variant="light" className="border">Details</Button>
                                    {role === 'admin' && <Button size="sm" variant="danger" className="ms-2" onClick={(e)=>{e.stopPropagation(); handleDeleteTask(t._id)}}><FaTrash/></Button>}
                                </td>
                            </tr>
                            {expandedTask === t._id && (
                                <tr>
                                    <td colSpan="5" className="p-3 bg-light text-dark">
                                        <div className="d-flex gap-3 mb-2">
                                            <strong className={`cursor-pointer ${activeTab==='comments'?'text-primary':''}`} onClick={()=>setActiveTab('comments')}>Comments</strong>
                                            <strong className={`cursor-pointer ${activeTab==='logs'?'text-primary':''}`} onClick={()=>setActiveTab('logs')}>Time Logs</strong>
                                        </div>
                                        {activeTab === 'comments' ? (
                                            <div>
                                                {t.comments?.map((c,i)=><div key={i} className="small mb-1"><b>{c.commentedBy?.name}:</b> {c.commentText}</div>)}
                                                <div className="d-flex gap-2 mt-2">
                                                    <Form.Control size="sm" placeholder="Comment..." value={tempInput} onChange={e=>setTempInput(e.target.value)}/>
                                                    <Button size="sm" onClick={()=>handleAddComment(t._id)}>Post</Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div>
                                                {t.timeLogs?.map((l,i)=><div key={i} className="small mb-1">{l.employeeId?.name}: {l.hours} hrs on {l.logDate?.slice(0,10)}</div>)}
                                                <div className="d-flex gap-2 mt-2 align-items-center">
                                                    <Form.Control type="number" size="sm" placeholder="Hrs" style={{width:80}} value={tempInput} onChange={e=>setTempInput(e.target.value)}/>
                                                    <Button size="sm" onClick={()=>handleAddLog(t._id)}>Log</Button>
                                                </div>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            )}
                        </React.Fragment>
                    ))}
                </tbody>
            </table>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose}>Close</Button>
      </Modal.Footer>
    </Modal>
  );
};

export default TaskModal;