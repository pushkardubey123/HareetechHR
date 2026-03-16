import React, { useEffect, useState } from "react";
import axios from "axios";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import Swal from "sweetalert2";
import DynamicLayout from "../Common/DynamicLayout";
import Loader from "./Loader/Loader";
import "./DesignationManagement.css";

import { FcApproval } from "react-icons/fc";
import { BiSearch, BiEdit, BiTrash, BiPlus, BiBuilding, BiGridAlt, BiBriefcase } from "react-icons/bi";

const schema = yup.object().shape({
  departmentId: yup.string().required("Department is required"),
  name: yup.string().required("Designation name is required"),
});

const DesignationManagement = () => {
  const [designations, setDesignations] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [editId, setEditId] = useState(null);
  const [selectedBranchForForm, setSelectedBranchForForm] = useState("");

  const [search, setSearch] = useState("");
  const [filterBranch, setFilterBranch] = useState("");
  const [filterDept, setFilterDept] = useState("");

  // ✅ PERMISSION LOGIC
  const userStr = localStorage.getItem("user");
  const userObj = userStr ? JSON.parse(userStr) : null;
  const token = userObj?.token;
  const isAdmin = userObj?.role === "admin";
  const [perms, setPerms] = useState({ view: false, create: false, edit: false, delete: false });

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm({ resolver: yupResolver(schema) });

  useEffect(() => {
    const fetchPerms = async () => {
      if (isAdmin || !token) return;
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/my-modules`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.detailed?.designation) {
          setPerms(res.data.detailed.designation);
        }
      } catch (e) {
        console.error("Permission fetch failed", e);
      }
    };
    fetchPerms();
    fetchAllData();
  }, [token, isAdmin]);

  const getAlertTheme = () => {
    const isDark = document.body.getAttribute('data-theme') === 'dark';
    return { background: isDark ? '#1e293b' : '#fff', color: isDark ? '#fff' : '#000' };
  };

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [desRes, deptRes, branchRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_URL}/api/designations`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${import.meta.env.VITE_API_URL}/api/departments`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${import.meta.env.VITE_API_URL}/api/branch`, { headers: { Authorization: `Bearer ${token}` } })
      ]);

      setDesignations(desRes.data.data || []);
      setDepartments(deptRes.data.data || []);
      setBranches(branchRes.data.data || []);
    } catch (err) { console.error(err); } 
    finally { setLoading(false); }
  };

  const onSubmit = async (data) => {
    const theme = getAlertTheme();
    try {
      if (!selectedBranchForForm) {
        Swal.fire({ title: "Branch Required", text: "Please select a branch before selecting a department.", icon: "warning", ...theme });
        return;
      }
      const payload = { ...data, branchId: selectedBranchForForm };

      if (editId) {
        await axios.put(`${import.meta.env.VITE_API_URL}/api/designations/${editId}`, payload, { headers: { Authorization: `Bearer ${token}` } });
        Swal.fire({ icon: "success", title: "Updated", timer: 1500, showConfirmButton: false, ...theme });
      } else {
        await axios.post(`${import.meta.env.VITE_API_URL}/api/designations`, payload, { headers: { Authorization: `Bearer ${token}` } });
        Swal.fire({ icon: "success", title: "Created", timer: 1500, showConfirmButton: false, ...theme });
      }
      fetchAllData();
      handleCancel();
    } catch (err) {
      Swal.fire({ icon: "error", title: "Error", text: err.response?.data?.message || "Failed", ...theme });
    }
  };

  const handleDelete = async (id) => {
    const theme = getAlertTheme();
    const confirm = await Swal.fire({ title: "Delete Designation?", text: "This action cannot be undone.", icon: "warning", showCancelButton: true, confirmButtonColor: "#ef4444", confirmButtonText: "Yes, delete it", ...theme });
    if (confirm.isConfirmed) {
      try {
        await axios.delete(`${import.meta.env.VITE_API_URL}/api/designations/${id}`, { headers: { Authorization: `Bearer ${token}` } });
        fetchAllData();
        Swal.fire({ icon: "success", title: "Deleted", timer: 1000, showConfirmButton: false, ...theme });
      } catch (err) { Swal.fire("Error", "Failed to delete", "error"); }
    }
  };

  const handleEdit = (item) => {
    setEditId(item._id);
    setSelectedBranchForForm(item.branchId?._id);
    setValue("name", item.name);
    setTimeout(() => setValue("departmentId", item.departmentId?._id), 0);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancel = () => {
    reset(); setEditId(null); setSelectedBranchForForm("");
  };

  const formDepartments = selectedBranchForForm ? departments.filter(d => d.branchId?._id === selectedBranchForForm) : [];
  const filterDepartmentsList = filterBranch ? departments.filter(d => d.branchId?._id === filterBranch) : departments;

  const filteredData = designations.filter((d) => {
    const matchesSearch = d.name.toLowerCase().includes(search.toLowerCase()) || d.departmentId?.name?.toLowerCase().includes(search.toLowerCase());
    const matchesBranch = filterBranch ? d.branchId?._id === filterBranch : true;
    const matchesDept = filterDept ? d.departmentId?._id === filterDept : true;
    return matchesSearch && matchesBranch && matchesDept;
  });

  const canCreate = isAdmin || perms.create;
  const canEdit = isAdmin || perms.edit;
  const canDelete = isAdmin || perms.delete;

  return (
    <DynamicLayout>
      <div className="designation-scope">
        <div className="page-header">
          <h1 className="page-title"><FcApproval /> Designation Management</h1>
          <p className="page-subtitle">Define job roles and associate them with departments.</p>
        </div>

        {/* Change layout structure dynamically if no form permission */}
        <div className={(canCreate || canEdit) ? "content-grid" : ""}>
          
          {/* ✅ PROTECTED LEFT FORM */}
          {(canCreate || canEdit) && (
            <div className="designation-card">
              <h3 style={{fontSize:'1.1rem', fontWeight:'700', marginBottom:'1.5rem', color:'var(--text-main)', display:'flex', alignItems:'center', gap:'8px'}}>
                 {editId ? <BiEdit /> : <BiPlus />} 
                 {editId ? "Edit Designation" : "Add Designation"}
              </h3>
              <form onSubmit={handleSubmit(onSubmit)}>
                <div className="mb-3">
                  <label className="form-label">Select Branch</label>
                  <select className="form-select" value={selectedBranchForForm} onChange={(e) => { setSelectedBranchForForm(e.target.value); setValue("departmentId", ""); }}>
                    <option value="">Choose Branch...</option>
                    {branches.map((b) => <option key={b._id} value={b._id}>{b.name}</option>)}
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label">Select Department</label>
                  <select className="form-select" {...register("departmentId")} disabled={!selectedBranchForForm}>
                    <option value="">{!selectedBranchForForm ? "Select Branch First" : "Choose Department..."}</option>
                    {formDepartments.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
                  </select>
                  <small className="text-danger">{errors.departmentId?.message}</small>
                </div>
                <div className="mb-4">
                  <label className="form-label">Designation Name</label>
                  <input type="text" className="form-control" placeholder="e.g. Senior Developer" {...register("name")} />
                  <small className="text-danger">{errors.name?.message}</small>
                </div>
                <div className="d-flex">
                  {editId && <button type="button" className="btn-cancel" onClick={handleCancel}>Cancel</button>}
                  <button type="submit" className="btn-primary">{editId ? "Update Changes" : "Create Designation"}</button>
                </div>
              </form>
            </div>
          )}

          {/* --- RIGHT: TABLE --- */}
          <div className="designation-card" style={{padding: '0'}}>
            <div style={{padding: '1.5rem', borderBottom: '1px solid var(--border-color)'}}>
               <div className="filter-bar" style={{margin:0}}>
                  <div className="search-wrapper">
                    <BiSearch className="search-icon" size={18} />
                    <input className="form-control search-input" placeholder="Search roles..." value={search} onChange={(e) => setSearch(e.target.value)} />
                  </div>
                  <div style={{flex: 1, minWidth: '150px'}}>
                     <select className="form-select" value={filterBranch} onChange={(e) => { setFilterBranch(e.target.value); setFilterDept(""); }}>
                        <option value="">All Branches</option>
                        {branches.map((b) => <option key={b._id} value={b._id}>{b.name}</option>)}
                     </select>
                  </div>
                  <div style={{flex: 1, minWidth: '150px'}}>
                     <select className="form-select" value={filterDept} onChange={(e) => setFilterDept(e.target.value)}>
                        <option value="">All Departments</option>
                        {filterDepartmentsList.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
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
                      <th>#</th><th>Designation</th><th>Department & Branch</th>
                      {(canEdit || canDelete) && <th>Action</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredData.length === 0 ? (
                      <tr><td colSpan={canEdit || canDelete ? "4" : "3"} className="text-center py-5" style={{color: 'var(--text-secondary)'}}>No records found.</td></tr>
                    ) : (
                      filteredData.map((d, i) => (
                        <tr key={d._id}>
                          <td>{i + 1}</td>
                          <td>
                            <div style={{display:'flex', alignItems:'center', gap:'8px', fontWeight:'600'}}>
                              <BiBriefcase style={{color:'var(--primary-color)'}} />{d.name}
                            </div>
                          </td>
                          <td>
                            <div style={{display:'flex', flexDirection:'column', gap:'4px'}}>
                              <span className="info-tag tag-dept"><BiGridAlt size={12}/> {d.departmentId?.name || "N/A"}</span>
                              <span className="tag-branch"><BiBuilding size={12}/> {d.branchId?.name || "N/A"}</span>
                            </div>
                          </td>
                          
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

export default DesignationManagement;