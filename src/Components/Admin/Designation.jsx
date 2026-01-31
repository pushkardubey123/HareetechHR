import React, { useEffect, useState } from "react";
import axios from "axios";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import Swal from "sweetalert2";
import AdminLayout from "./AdminLayout";
import Loader from "./Loader/Loader";
import "./DesignationManagement.css"; // Import Scoped CSS

// Icons
import { FcApproval } from "react-icons/fc";
import { BiSearch, BiEdit, BiTrash, BiPlus, BiBuilding, BiGridAlt, BiBriefcase } from "react-icons/bi";

const schema = yup.object().shape({
  departmentId: yup.string().required("Department is required"),
  name: yup.string().required("Designation name is required"),
});

const DesignationManagement = () => {
  // Data State
  const [designations, setDesignations] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Form State
  const [editId, setEditId] = useState(null);
  const [selectedBranchForForm, setSelectedBranchForForm] = useState("");

  // Filter State
  const [search, setSearch] = useState("");
  const [filterBranch, setFilterBranch] = useState("");
  const [filterDept, setFilterDept] = useState("");

  const token = JSON.parse(localStorage.getItem("user"))?.token;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm({ resolver: yupResolver(schema) });

  // --- Helpers ---
  const getAlertTheme = () => {
    const isDark = document.body.getAttribute('data-theme') === 'dark';
    return {
      background: isDark ? '#1e293b' : '#fff',
      color: isDark ? '#fff' : '#000'
    };
  };

  // --- Fetch API ---
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
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // --- Form Handlers ---
  const onSubmit = async (data) => {
    const theme = getAlertTheme();
    try {
      if (!selectedBranchForForm) {
        Swal.fire({
          title: "Branch Required",
          text: "Please select a branch before selecting a department.",
          icon: "warning",
          background: theme.background,
          color: theme.color
        });
        return;
      }

      const payload = { ...data, branchId: selectedBranchForForm };

      if (editId) {
        await axios.put(
          `${import.meta.env.VITE_API_URL}/api/designations/${editId}`,
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        Swal.fire({ icon: "success", title: "Updated", background: theme.background, color: theme.color, timer: 1500, showConfirmButton: false });
      } else {
        await axios.post(
          `${import.meta.env.VITE_API_URL}/api/designations`,
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        Swal.fire({ icon: "success", title: "Created", background: theme.background, color: theme.color, timer: 1500, showConfirmButton: false });
      }

      // Refresh Data
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/designations`, { headers: { Authorization: `Bearer ${token}` } });
      setDesignations(res.data.data || []);
      handleCancel();
      
    } catch (err) {
      Swal.fire({ icon: "error", title: "Error", text: err.response?.data?.message || "Failed", background: theme.background, color: theme.color });
    }
  };

  const handleDelete = async (id) => {
    const theme = getAlertTheme();
    const confirm = await Swal.fire({
      title: "Delete Designation?",
      text: "This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      confirmButtonText: "Yes, delete it",
      background: theme.background,
      color: theme.color
    });

    if (confirm.isConfirmed) {
      try {
        await axios.delete(
          `${import.meta.env.VITE_API_URL}/api/designations/${id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/designations`, { headers: { Authorization: `Bearer ${token}` } });
        setDesignations(res.data.data || []);
        Swal.fire({ icon: "success", title: "Deleted", background: theme.background, color: theme.color, timer: 1000, showConfirmButton: false });
      } catch (err) {
        Swal.fire("Error", "Failed to delete", "error");
      }
    }
  };

  const handleEdit = (item) => {
    setEditId(item._id);
    setSelectedBranchForForm(item.branchId?._id);
    setValue("name", item.name);
    // Needs slight timeout to allow branch change to trigger department filter logic visually if needed
    setTimeout(() => setValue("departmentId", item.departmentId?._id), 0);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancel = () => {
    reset();
    setEditId(null);
    setSelectedBranchForForm("");
  };

  // --- Derived Data ---
  
  // 1. Departments available in FORM based on Selected Branch
  const formDepartments = selectedBranchForForm
    ? departments.filter(d => d.branchId?._id === selectedBranchForForm)
    : [];

  // 2. Departments available in FILTER based on Filter Branch
  const filterDepartmentsList = filterBranch
    ? departments.filter(d => d.branchId?._id === filterBranch)
    : departments;

  // 3. Filtered Designations for TABLE
  const filteredData = designations.filter((d) => {
    const matchesSearch = d.name.toLowerCase().includes(search.toLowerCase()) || 
                          d.departmentId?.name?.toLowerCase().includes(search.toLowerCase());
    const matchesBranch = filterBranch ? d.branchId?._id === filterBranch : true;
    const matchesDept = filterDept ? d.departmentId?._id === filterDept : true;

    return matchesSearch && matchesBranch && matchesDept;
  });

  return (
    <AdminLayout>
      <div className="designation-scope">
        
        {/* Header */}
        <div className="page-header">
          <h1 className="page-title">
            <FcApproval /> Designation Management
          </h1>
          <p className="page-subtitle">Define job roles and associate them with departments.</p>
        </div>

        {/* Content Layout */}
        <div className="content-grid">
          
          {/* --- LEFT: FORM --- */}
          <div className="designation-card">
            <h3 style={{fontSize:'1.1rem', fontWeight:'700', marginBottom:'1.5rem', color:'var(--text-main)', display:'flex', alignItems:'center', gap:'8px'}}>
               {editId ? <BiEdit /> : <BiPlus />} 
               {editId ? "Edit Designation" : "Add Designation"}
            </h3>

            <form onSubmit={handleSubmit(onSubmit)}>
              
              <div className="mb-3">
                <label className="form-label">Select Branch</label>
                <select 
                  className="form-select"
                  value={selectedBranchForForm}
                  onChange={(e) => {
                    setSelectedBranchForForm(e.target.value);
                    setValue("departmentId", ""); // Reset dept when branch changes
                  }}
                >
                  <option value="">Choose Branch...</option>
                  {branches.map((b) => (
                    <option key={b._id} value={b._id}>{b.name}</option>
                  ))}
                </select>
              </div>

              <div className="mb-3">
                <label className="form-label">Select Department</label>
                <select 
                  className="form-select" 
                  {...register("departmentId")}
                  disabled={!selectedBranchForForm}
                >
                  <option value="">
                    {!selectedBranchForForm ? "Select Branch First" : "Choose Department..."}
                  </option>
                  {formDepartments.map((d) => (
                    <option key={d._id} value={d._id}>{d.name}</option>
                  ))}
                </select>
                <small className="text-danger">{errors.departmentId?.message}</small>
              </div>

              <div className="mb-4">
                <label className="form-label">Designation Name</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="e.g. Senior Developer" 
                  {...register("name")} 
                />
                <small className="text-danger">{errors.name?.message}</small>
              </div>

              <div className="d-flex">
                {editId && (
                  <button type="button" className="btn-cancel" onClick={handleCancel}>
                    Cancel
                  </button>
                )}
                <button type="submit" className="btn-primary">
                  {editId ? "Update Changes" : "Create Designation"}
                </button>
              </div>
            </form>
          </div>

          {/* --- RIGHT: TABLE --- */}
          <div className="designation-card" style={{padding: '0'}}>
            
            {/* Filter Bar */}
            <div style={{padding: '1.5rem', borderBottom: '1px solid var(--border-color)'}}>
               <div className="filter-bar" style={{margin:0}}>
                  <div className="search-wrapper">
                    <BiSearch className="search-icon" size={18} />
                    <input 
                      className="form-control search-input" 
                      placeholder="Search roles..." 
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                  
                  {/* Branch Filter */}
                  <div style={{flex: 1, minWidth: '150px'}}>
                     <select 
                        className="form-select" 
                        value={filterBranch} 
                        onChange={(e) => {
                          setFilterBranch(e.target.value);
                          setFilterDept(""); // Reset dept filter
                        }}
                     >
                        <option value="">All Branches</option>
                        {branches.map((b) => (
                           <option key={b._id} value={b._id}>{b.name}</option>
                        ))}
                     </select>
                  </div>

                  {/* Dept Filter */}
                  <div style={{flex: 1, minWidth: '150px'}}>
                     <select 
                        className="form-select" 
                        value={filterDept} 
                        onChange={(e) => setFilterDept(e.target.value)}
                     >
                        <option value="">All Departments</option>
                        {filterDepartmentsList.map((d) => (
                           <option key={d._id} value={d._id}>{d.name}</option>
                        ))}
                     </select>
                  </div>
               </div>
            </div>

            {/* Table */}
            {loading ? (
              <div className="text-center py-5"><Loader /></div>
            ) : (
              <div className="table-wrapper">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Designation</th>
                      <th>Department & Branch</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredData.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="text-center py-5" style={{color: 'var(--text-secondary)'}}>
                          No records found.
                        </td>
                      </tr>
                    ) : (
                      filteredData.map((d, i) => (
                        <tr key={d._id}>
                          <td>{i + 1}</td>
                          <td>
                            <div style={{display:'flex', alignItems:'center', gap:'8px', fontWeight:'600'}}>
                              <BiBriefcase style={{color:'var(--primary-color)'}} />
                              {d.name}
                            </div>
                          </td>
                          <td>
                            <div style={{display:'flex', flexDirection:'column', gap:'4px'}}>
                              <span className="info-tag tag-dept">
                                <BiGridAlt size={12}/> {d.departmentId?.name || "N/A"}
                              </span>
                              <span className="tag-branch">
                                <BiBuilding size={12}/> {d.branchId?.name || "N/A"}
                              </span>
                            </div>
                          </td>
                          <td>
                            <div className="actions">
                              <button className="btn-icon btn-edit" onClick={() => handleEdit(d)} title="Edit">
                                <BiEdit />
                              </button>
                              <button className="btn-icon btn-delete" onClick={() => handleDelete(d._id)} title="Delete">
                                <BiTrash />
                              </button>
                            </div>
                          </td>
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
    </AdminLayout>
  );
};

export default DesignationManagement;