import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import axios from "axios";
import Swal from "sweetalert2";
import DynamicLayout from "../Common/DynamicLayout";
import Loader from "./Loader/Loader";
import "./Department.css"; 
import { FcDepartment } from "react-icons/fc";
import { BiSearch, BiBuildingHouse, BiEdit, BiTrash, BiPlus } from "react-icons/bi";

const schema = yup.object().shape({
  branchId: yup.string().required("Branch selection is required"),
  name: yup.string().required("Department name is required"),
  description: yup.string().required("Description is required"),
});

const Department = () => {
  const [departments, setDepartments] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editId, setEditId] = useState(null);
  
  const [search, setSearch] = useState("");
  const [branchFilter, setBranchFilter] = useState("");

  // ✅ PERMISSION LOGIC
  const userStr = localStorage.getItem("user");
  const userObj = userStr ? JSON.parse(userStr) : null;
  const token = userObj?.token;
  const isAdmin = userObj?.role === "admin";
  const [perms, setPerms] = useState({ view: false, create: false, edit: false, delete: false });

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm({ resolver: yupResolver(schema) });

  const getAlertTheme = () => {
    const isDark = document.body.getAttribute('data-theme') === 'dark';
    return { background: isDark ? '#1e293b' : '#fff', color: isDark ? '#fff' : '#000' };
  };

  useEffect(() => {
    const fetchPerms = async () => {
      if (isAdmin || !token) return;
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/my-modules`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.detailed?.department) {
          setPerms(res.data.detailed.department);
        }
      } catch (e) { console.error("Permission fetch failed", e); }
    };
    fetchPerms();
    fetchBranches();
    fetchDepartments();
  }, [token, isAdmin]);

  const fetchBranches = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/branch`, { headers: { Authorization: `Bearer ${token}` } });
      setBranches(res.data.data || []);
    } catch (err) { console.error(err); }
  };

  const fetchDepartments = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/departments`, { headers: { Authorization: `Bearer ${token}` } });
      setDepartments(res.data.data || []);
    } catch (err) { console.error(err); } 
    finally { setLoading(false); }
  };

  const onSubmit = async (data) => {
    const theme = getAlertTheme();
    try {
      if (editId) {
        await axios.put(`${import.meta.env.VITE_API_URL}/api/departments/${editId}`, data, { headers: { Authorization: `Bearer ${token}` } });
        Swal.fire({ icon: "success", title: "Updated", text: "Department updated successfully", timer: 1500, showConfirmButton: false, ...theme });
      } else {
        await axios.post(`${import.meta.env.VITE_API_URL}/api/departments`, data, { headers: { Authorization: `Bearer ${token}` } });
        Swal.fire({ icon: "success", title: "Created", text: "New department added", timer: 1500, showConfirmButton: false, ...theme });
      }
      reset(); setEditId(null); fetchDepartments();
    } catch (err) {
      Swal.fire({ icon: "error", title: "Error", text: err.response?.data?.message || "Something went wrong", ...theme });
    }
  };

  const handleDelete = async (deptId) => {
    const theme = getAlertTheme();
    const confirm = await Swal.fire({ title: "Delete Department?", text: "This action cannot be undone.", icon: "warning", showCancelButton: true, confirmButtonColor: "#ef4444", confirmButtonText: "Yes, delete it", ...theme });
    if (confirm.isConfirmed) {
      try {
        await axios.delete(`${import.meta.env.VITE_API_URL}/api/departments/${deptId}`, { headers: { Authorization: `Bearer ${token}` } });
        fetchDepartments();
        Swal.fire({ icon: "success", title: "Deleted!", timer: 1000, showConfirmButton: false, ...theme });
      } catch (err) { Swal.fire("Error", "Failed to delete", "error"); }
    }
  };

  const handleEdit = (dept) => {
    setEditId(dept._id);
    setValue("branchId", dept.branchId?._id || dept.branchId);
    setValue("name", dept.name);
    setValue("description", dept.description);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancel = () => { reset(); setEditId(null); };

  const filteredData = departments.filter((d) => {
    const matchesSearch = d.name.toLowerCase().includes(search.toLowerCase());
    const matchesBranch = branchFilter ? (d.branchId?._id === branchFilter || d.branchId === branchFilter) : true;
    return matchesSearch && matchesBranch;
  });

  const canCreate = isAdmin || perms.create;
  const canEdit = isAdmin || perms.edit;
  const canDelete = isAdmin || perms.delete;

  return (
    <DynamicLayout>
      <div className="dept-scope">
        <div className="page-header">
          <h1 className="page-title"><FcDepartment /> Department Management</h1>
          <p className="page-subtitle">Organize organizational structure and departments.</p>
        </div>

        {/* Change layout structure dynamically if no form permission */}
        <div className={(canCreate || canEdit) ? "content-grid" : ""}>
          
          {/* ✅ PROTECTED LEFT FORM */}
          {(canCreate || canEdit) && (
            <div className="dept-card">
              <h3 style={{fontSize:'1.1rem', fontWeight:'700', marginBottom:'1.5rem', color:'var(--text-main)', display:'flex', alignItems:'center', gap:'8px'}}>
                 {editId ? <BiEdit /> : <BiPlus />} 
                 {editId ? "Edit Department" : "Add New Department"}
              </h3>
              <form onSubmit={handleSubmit(onSubmit)}>
                <div className="mb-3">
                  <label className="form-label">Select Branch</label>
                  <select className="form-select" {...register("branchId")}>
                    <option value="">Choose Branch...</option>
                    {branches.map((b) => <option key={b._id} value={b._id}>{b.name}</option>)}
                  </select>
                  <small className="text-danger">{errors.branchId?.message}</small>
                </div>
                <div className="mb-3">
                  <label className="form-label">Department Name</label>
                  <input type="text" className="form-control" placeholder="e.g. Human Resources" {...register("name")} />
                  <small className="text-danger">{errors.name?.message}</small>
                </div>
                <div className="mb-4">
                  <label className="form-label">Description</label>
                  <textarea rows="3" className="form-control" placeholder="Brief description of responsibilities..." {...register("description")} />
                  <small className="text-danger">{errors.description?.message}</small>
                </div>
                <div className="d-flex">
                  {editId && <button type="button" className="btn-cancel" onClick={handleCancel}>Cancel</button>}
                  <button type="submit" className="btn-primary">{editId ? "Update Changes" : "Create Department"}</button>
                </div>
              </form>
            </div>
          )}

          {/* --- RIGHT: DATA TABLE --- */}
          <div className="dept-card" style={{padding: '0'}}>
            <div style={{padding: '1.5rem', borderBottom: '1px solid var(--border-color)'}}>
               <div className="filter-bar" style={{margin:0}}>
                  <div className="search-wrapper">
                    <BiSearch className="search-icon" size={18} />
                    <input className="form-control search-input" placeholder="Search departments..." value={search} onChange={(e) => setSearch(e.target.value)} />
                  </div>
                  <div style={{minWidth: '200px'}}>
                     <select className="form-select" value={branchFilter} onChange={(e) => setBranchFilter(e.target.value)}>
                        <option value="">All Branches</option>
                        {branches.map((b) => <option key={b._id} value={b._id}>{b.name}</option>)}
                     </select>
                  </div>
               </div>
            </div>

            {loading ? (
              <div className="text-center py-5"><Loader /></div>
            ) : (
              <div className="table-wrapper">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>S No.</th><th>Department Name</th><th>Branch</th><th>Description</th>
                      {(canEdit || canDelete) && <th>Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredData.length === 0 ? (
                      <tr><td colSpan={canEdit || canDelete ? "5" : "4"} className="text-center py-5" style={{color: 'var(--text-secondary)'}}>No departments found matching your filters.</td></tr>
                    ) : (
                      filteredData.map((d, i) => (
                        <tr key={d._id}>
                          <td>{i + 1}</td>
                          <td><span style={{fontWeight: '600', color:'var(--text-main)'}}>{d.name}</span></td>
                          <td><span className="dept-branch-tag"><BiBuildingHouse /> {d.branchId?.name || "N/A"}</span></td>
                          <td style={{maxWidth:'250px', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', color:'var(--text-secondary)'}}>{d.description}</td>
                          
                          {/* ✅ PROTECTED ACTIONS */}
                          {(canEdit || canDelete) && (
                            <td>
                              <div className="actions">
                                {canEdit && <button className="btn-icon btn-edit" onClick={() => handleEdit(d)} title="Edit"><BiEdit /></button>}
                                {canDelete && <button className="btn-icon btn-delete" onClick={() => handleDelete(d._id)} title="Delete"><BiTrash /></button>}
                              </div>
                            </td>
                          )}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      </div>
    </DynamicLayout>
  );
};

export default Department;