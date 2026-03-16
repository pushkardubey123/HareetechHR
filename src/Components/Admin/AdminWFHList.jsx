import React, { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Papa from "papaparse";
import DynamicLayout from "../Common/DynamicLayout";
import {
  FaHome, FaCheck, FaTimes, FaDownload, 
  FaFileCsv, FaPlus, FaFilter, FaSearch
} from "react-icons/fa";
import { MdPendingActions, MdCheckCircle, MdCancel } from "react-icons/md";
import "./AdminWFHList.css";

const ITEMS_PER_PAGE = 8;

const AdminWFHList = () => {
  const [list, setList] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [showAssign, setShowAssign] = useState(false);
  const [assignData, setAssignData] = useState({
    employeeId: "", fromDate: "", toDate: "", reason: "",
  });

  // ✅ PERMISSION LOGIC
  const userStr = localStorage.getItem("user");
  const userObj = userStr ? JSON.parse(userStr) : null;
  const token = userObj?.token;
  const isAdmin = userObj?.role === "admin";
  const [perms, setPerms] = useState({ view: false, create: false, edit: false, delete: false });

  const headers = { headers: { Authorization: `Bearer ${token}` } };

  useEffect(() => {
    const fetchPerms = async () => {
      if (isAdmin || !token) return;
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/my-modules`, headers);
        if (res.data.detailed?.wfh) {
          setPerms(res.data.detailed.wfh);
        }
      } catch (e) {
        console.error("Permission fetch failed", e);
      }
    };
    fetchPerms();
    fetchWFH();
    fetchEmployees();
  }, [token, isAdmin]);

  const fetchWFH = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/wfh/all`, headers);
      setList(res.data.data || []);
    } catch (err) { console.error(err); } 
    finally { setLoading(false); }
  };

  const fetchEmployees = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/user`, headers);
      setEmployees(res.data.data || []);
    } catch (err) { console.error(err); }
  };

  const changeStatus = async (id, status) => {
    const isDark = document.body.getAttribute('data-theme') === 'dark';
    const { value: remark } = await Swal.fire({
      title: `Confirm ${status}?`,
      input: "text",
      inputPlaceholder: "Admin remarks (optional)",
      showCancelButton: true,
      confirmButtonText: `Yes, ${status}`,
      confirmButtonColor: status === 'approved' ? '#10b981' : '#ef4444',
      background: isDark ? '#1e293b' : '#fff',
      color: isDark ? '#fff' : '#000'
    });

    if (remark !== undefined) {
      await axios.put(
        `${import.meta.env.VITE_API_URL}/api/wfh/status/${id}`,
        { status, adminRemarks: remark }, headers
      );
      fetchWFH();
      Swal.fire({ icon: 'success', title: 'Updated!', timer: 1500, showConfirmButton: false });
    }
  };

  const submitAssignWFH = async () => {
    if (!assignData.employeeId || !assignData.fromDate || !assignData.toDate) {
      return Swal.fire("Error", "All fields required", "error");
    }
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/admin/assign-wfh`, assignData, headers);
      Swal.fire("Success", "WFH Assigned Successfully", "success");
      setShowAssign(false);
      setAssignData({ employeeId: "", fromDate: "", toDate: "", reason: "" });
      fetchWFH();
    } catch (err) { Swal.fire("Error", "Failed to assign", "error"); }
  };

  const exportCSV = () => {
    const rows = list.map(w => ({
      Employee: w.userId?.name, Branch: w.branchId?.name || "-",
      From: new Date(w.fromDate).toLocaleDateString(), To: new Date(w.toDate).toLocaleDateString(),
      Status: w.status, Remarks: w.adminRemarks || "-"
    }));
    const csv = Papa.unparse(rows);
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    link.download = "WFH_Requests.csv";
    link.click();
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("Work From Home Requests", 14, 16);
    autoTable(doc, {
      startY: 26,
      head: [["Employee", "Branch", "From", "To", "Status", "Remarks"]],
      body: list.map(w => [
        w.userId?.name, w.branchId?.name || "-",
        new Date(w.fromDate).toLocaleDateString(), new Date(w.toDate).toLocaleDateString(),
        w.status, w.adminRemarks || "-"
      ]),
    });
    doc.save("WFH_Requests.pdf");
  };

  const filteredList = list.filter(item => {
    const matchesSearch = item.userId?.name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredList.length / ITEMS_PER_PAGE);
  const paginatedData = filteredList.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const canEdit = isAdmin || perms.edit;
  const canCreate = isAdmin || perms.create;

  return (
    <DynamicLayout>
      <div className="container p-3">
        <div className="wfh-header">
          <div className="title-section">
            <h3><FaHome className="text-primary" /> WFH Management</h3>
            <p>Manage and track work from home requests.</p>
          </div>
          <div className="action-bar">
            <button className="btn-action" onClick={exportPDF}><FaDownload /> PDF</button>
            <button className="btn-action" onClick={exportCSV}><FaFileCsv /> CSV</button>
            
            {/* ✅ CREATE PERMISSION REQUIRED TO ASSIGN */}
            {canCreate && (
              <button className="btn-action btn-primary" onClick={() => setShowAssign(!showAssign)}>
                <FaPlus /> Assign WFH
              </button>
            )}
          </div>
        </div>

        {canCreate && showAssign && (
          <div className="assign-card">
            <h5 className="mb-3 fw-bold" style={{color: 'var(--wfh-text-main)'}}>Assign New WFH</h5>
            <div className="form-grid">
              <select className="custom-select" value={assignData.employeeId} onChange={e => setAssignData({ ...assignData, employeeId: e.target.value })}>
                <option value="">Select Employee</option>
                {employees.map(e => <option key={e._id} value={e._id}>{e.name}</option>)}
              </select>
              <input type="date" className="custom-input" value={assignData.fromDate} onChange={e => setAssignData({ ...assignData, fromDate: e.target.value })} />
              <input type="date" className="custom-input" value={assignData.toDate} onChange={e => setAssignData({ ...assignData, toDate: e.target.value })} />
              <input placeholder="Reason (Optional)" className="custom-input" value={assignData.reason} onChange={e => setAssignData({ ...assignData, reason: e.target.value })} />
            </div>
            <div className="form-actions">
              <button className="btn-action" onClick={() => setShowAssign(false)}>Cancel</button>
              <button className="btn-action btn-primary" onClick={submitAssignWFH}>Confirm Assign</button>
            </div>
          </div>
        )}

        <div className="wfh-header" style={{marginBottom: '15px'}}>
           <div className="d-flex gap-2 w-100 flex-wrap">
              <div style={{position: 'relative', flex: 1, minWidth: '200px'}}>
                 <FaSearch style={{position:'absolute', left:'12px', top:'50%', transform:'translateY(-50%)', color:'var(--wfh-text-muted)'}}/>
                 <input className="custom-input" style={{paddingLeft:'35px'}} placeholder="Search employee..." value={search} onChange={e => setSearch(e.target.value)}/>
              </div>
              <div style={{position: 'relative', width: '200px'}}>
                 <FaFilter style={{position:'absolute', left:'12px', top:'50%', transform:'translateY(-50%)', color:'var(--wfh-text-muted)'}}/>
                 <select className="custom-select" style={{paddingLeft:'35px'}} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                 </select>
              </div>
           </div>
        </div>

        <div className="table-card">
          <div className="table-responsive">
            <table className="wfh-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Branch</th>
                  <th>Duration</th>
                  <th>Dates</th>
                  <th className="text-center">Status</th>
                  {canEdit && <th className="text-center">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="6" className="text-center py-5">Loading requests...</td></tr>
                ) : paginatedData.length === 0 ? (
                  <tr><td colSpan="6" className="text-center py-5 text-muted">No records found.</td></tr>
                ) : (
                  paginatedData.map((w) => (
                    <tr key={w._id}>
                      <td className="fw-bold">{w.userId?.name}</td>
                      <td>{w.branchId?.name || "-"}</td>
                      <td>
                         {Math.ceil((new Date(w.toDate) - new Date(w.fromDate)) / (1000 * 60 * 60 * 24)) + 1} Days
                      </td>
                      <td>
                        <div className="small text-muted">
                           {new Date(w.fromDate).toLocaleDateString()} — {new Date(w.toDate).toLocaleDateString()}
                        </div>
                      </td>
                      <td>
                        <span className={`d-flex align-item-center justify-content-center text-center status-pill status-${w.status}`}>
                          {w.status === 'pending' && <MdPendingActions/>}
                          {w.status === 'approved' && <MdCheckCircle/>}
                          {w.status === 'rejected' && <MdCancel/>}
                          {w.status}
                        </span>
                      </td>
                      
                      {/* ✅ EDIT PERMISSION REQUIRED TO APPROVE/REJECT */}
                      {canEdit && (
                        <td>
                          {w.status === "pending" ? (
                            <div className="d-flex justify-content-center gap-2">
                              <button className="icon-btn btn-approve" onClick={() => changeStatus(w._id, "approved")} title="Approve">
                                <FaCheck />
                              </button>
                              <button className="icon-btn btn-reject" onClick={() => changeStatus(w._id, "rejected")} title="Reject">
                                <FaTimes />
                              </button>
                            </div>
                          ) : (
                            <div className="text-center text-muted small">—</div>
                          )}
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="pagination-container">
              <button className="pg-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Prev</button>
              <span className="d-flex align-items-center px-2 text-muted small">Page {page} / {totalPages}</span>
              <button className="pg-btn" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next</button>
            </div>
          )}
        </div>
      </div>
    </DynamicLayout>
  );
};

export default AdminWFHList;