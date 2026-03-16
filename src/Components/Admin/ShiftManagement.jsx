import React, { useEffect, useState } from "react";
import axios from "axios";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import Swal from "sweetalert2";
import DynamicLayout from "../Common/DynamicLayout";
import Loader from "./Loader/Loader";
import "./ShiftManagement.css"; 

import { FaBusinessTime } from "react-icons/fa";
import { BiSearch, BiEdit, BiTrash, BiPlus, BiTimeFive, BiBuilding, BiReset } from "react-icons/bi";

const schema = yup.object().shape({
  name: yup.string().required("Shift name is required"),
  startTime: yup.string().required("Start time is required"),
  endTime: yup.string().required("End time is required"),
  branchId: yup.string().required("Branch is required"),
});

const ShiftManagement = () => {
  const [shifts, setShifts] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editId, setEditId] = useState(null);
  
  const [search, setSearch] = useState("");
  const [filterBranch, setFilterBranch] = useState("");

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
        if (res.data.detailed?.shift) {
          setPerms(res.data.detailed.shift);
        }
      } catch (e) { console.error("Permission fetch failed", e); }
    };
    fetchPerms();
    fetchBranches();
    fetchShifts();
  }, [token, isAdmin]);

  const fetchBranches = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/branch`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBranches(res.data.data || []);
    } catch (err) { console.error(err); }
  };

  const fetchShifts = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/shifts/admin`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setShifts(res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data) => {
    const theme = getAlertTheme();
    try {
      if (editId) {
        await axios.put(`${import.meta.env.VITE_API_URL}/api/shifts/${editId}`, data, { headers: { Authorization: `Bearer ${token}` } });
        Swal.fire({ icon: "success", title: "Updated", background: theme.background, color: theme.color, timer: 1500, showConfirmButton: false });
      } else {
        await axios.post(`${import.meta.env.VITE_API_URL}/api/shifts`, data, { headers: { Authorization: `Bearer ${token}` } });
        Swal.fire({ icon: "success", title: "Created", background: theme.background, color: theme.color, timer: 1500, showConfirmButton: false });
      }
      handleCancel();
      fetchShifts();
    } catch (err) {
      Swal.fire({ icon: "error", title: "Error", text: err.response?.data?.message || "Failed", background: theme.background, color: theme.color });
    }
  };

  const handleDelete = async (id) => {
    const theme = getAlertTheme();
    const confirm = await Swal.fire({
      title: "Delete Shift?", text: "Action cannot be undone.", icon: "warning", showCancelButton: true, confirmButtonColor: "#ef4444", confirmButtonText: "Delete", background: theme.background, color: theme.color
    });

    if (confirm.isConfirmed) {
      try {
        await axios.delete(`${import.meta.env.VITE_API_URL}/api/shifts/${id}`, { headers: { Authorization: `Bearer ${token}` } });
        fetchShifts();
        Swal.fire({ icon: "success", title: "Deleted", background: theme.background, color: theme.color, timer: 1000, showConfirmButton: false });
      } catch (err) {
        Swal.fire("Error", "Failed to delete", "error");
      }
    }
  };

  const handleEdit = (item) => {
    setEditId(item._id);
    setValue("name", item.name);
    setValue("startTime", item.startTime);
    setValue("endTime", item.endTime);
    setValue("branchId", item.branchId?._id || item.branchId);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancel = () => {
    reset(); setEditId(null);
  };

  const formatTime12h = (time24) => {
    if (!time24) return "";
    const [hours, minutes] = time24.split(':');
    const h = parseInt(hours, 10);
    const m = parseInt(minutes, 10);
    const suffix = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${m < 10 ? '0' + m : m} ${suffix}`;
  };

  const calculateDuration = (start, end) => {
    if (!start || !end) return "";
    const [sH, sM] = start.split(':').map(Number);
    const [eH, eM] = end.split(':').map(Number);
    let diffMin = (eH * 60 + eM) - (sH * 60 + sM);
    if (diffMin < 0) diffMin += 24 * 60; 
    const hrs = Math.floor(diffMin / 60);
    const mins = diffMin % 60;
    return `${hrs}h ${mins > 0 ? mins + 'm' : ''}`;
  };

  const filteredData = shifts.filter((s) => {
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase());
    const matchesBranch = filterBranch ? (s.branchId?._id === filterBranch) : true;
    return matchesSearch && matchesBranch;
  });

  const canCreate = isAdmin || perms.create;
  const canEdit = isAdmin || perms.edit;
  const canDelete = isAdmin || perms.delete;

  return (
    <DynamicLayout>
      <div className="shift-scope">
        <div className="page-header">
          <div>
            <h1 className="page-title"><FaBusinessTime /> Shift Management</h1>
            <p className="page-subtitle">Configure working hours and shift timings for employees.</p>
          </div>
        </div>

        <div className={(canCreate || canEdit) ? "content-grid" : ""}>
          
          {/* ✅ PROTECTED LEFT FORM */}
          {(canCreate || canEdit) && (
            <div className="shift-card">
              <h3 style={{fontSize:'1.1rem', fontWeight:'700', marginBottom:'1.5rem', color:'var(--text-main)', display:'flex', alignItems:'center', gap:'8px'}}>
                 {editId ? <BiEdit /> : <BiPlus />} 
                 {editId ? "Edit Shift" : "Create New Shift"}
              </h3>
              <form onSubmit={handleSubmit(onSubmit)}>
                <div className="mb-3">
                  <label className="form-label">Branch</label>
                  <select className="form-select" {...register("branchId")}>
                    <option value="">Select Branch...</option>
                    {branches.map((b) => <option key={b._id} value={b._id}>{b.name}</option>)}
                  </select>
                  <small className="text-danger">{errors.branchId?.message}</small>
                </div>
                <div className="mb-3">
                  <label className="form-label">Shift Name</label>
                  <input type="text" className="form-control" placeholder="e.g. Morning Shift" {...register("name")} />
                  <small className="text-danger">{errors.name?.message}</small>
                </div>
                <div className="row g-2 mb-4">
                  <div className="col-6">
                    <label className="form-label">Start Time</label>
                    <input type="time" className="form-control" {...register("startTime")} />
                    <small className="text-danger">{errors.startTime?.message}</small>
                  </div>
                  <div className="col-6">
                    <label className="form-label">End Time</label>
                    <input type="time" className="form-control" {...register("endTime")} />
                    <small className="text-danger">{errors.endTime?.message}</small>
                  </div>
                </div>
                <div className="d-flex">
                  {editId && <button type="button" className="btn-cancel" onClick={handleCancel}>Cancel</button>}
                  <button type="submit" className="btn-primary">{editId ? "Update Changes" : "Create Shift"}</button>
                </div>
              </form>
            </div>
          )}

          {/* --- RIGHT: TABLE --- */}
          <div className="shift-card" style={{padding: '0'}}>
            <div style={{padding: '1.5rem'}}>
               <div className="filter-bar" style={{marginBottom:0, borderBottom:'none', paddingBottom:0}}>
                  <div className="search-wrapper">
                    <BiSearch className="search-icon" size={18} />
                    <input className="form-control search-input" placeholder="Search shifts..." value={search} onChange={(e) => setSearch(e.target.value)} />
                  </div>
                  <div style={{minWidth: '180px'}}>
                     <select className="form-select" value={filterBranch} onChange={(e) => setFilterBranch(e.target.value)}>
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
                      <th>Shift Details</th>
                      <th>Branch</th>
                      <th>Timings</th>
                      {(canEdit || canDelete) && <th className="text-end">Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredData.length === 0 ? (
                      <tr><td colSpan={canEdit || canDelete ? "4" : "3"} className="text-center py-5" style={{color: 'var(--text-secondary)'}}>No shifts found matching your criteria.</td></tr>
                    ) : (
                      filteredData.map((s) => (
                        <tr key={s._id}>
                          <td>
                            <div style={{fontWeight:'600', color:'var(--text-main)'}}>{s.name}</div>
                            <span className="duration-badge">{calculateDuration(s.startTime, s.endTime)} Duration</span>
                          </td>
                          <td>
                            <div style={{display:'flex', alignItems:'center', gap:'5px', color:'var(--text-secondary)', fontSize:'0.85rem'}}>
                               <BiBuilding /> {s.branchId?.name || "N/A"}
                            </div>
                          </td>
                          <td>
                            <div className="d-flex flex-column gap-1">
                               <span className="time-badge"><BiTimeFive size={12} /> {formatTime12h(s.startTime)} - {formatTime12h(s.endTime)}</span>
                            </div>
                          </td>
                          
                          {/* ✅ PROTECTED ACTIONS */}
                          {(canEdit || canDelete) && (
                            <td className="text-end">
                              <div className="actions justify-content-end">
                                {canEdit && <button className="btn-icon btn-edit" onClick={() => handleEdit(s)} title="Edit"><BiEdit /></button>}
                                {canDelete && <button className="btn-icon btn-delete" onClick={() => handleDelete(s._id)} title="Delete"><BiTrash /></button>}
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

export default ShiftManagement;