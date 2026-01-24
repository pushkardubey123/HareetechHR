import React, { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Papa from "papaparse";
import ReactPaginate from "react-paginate";
import AdminLayout from "./AdminLayout";
import {
  FaHome,
  FaCheck,
  FaTimes,
  FaDownload,
  FaFileCsv,
  FaPlus,
} from "react-icons/fa";
import { MdPendingActions } from "react-icons/md";
import "./AttendencePanel.css"; // SAME CSS AS ADMIN ATTENDANCE

const ITEMS_PER_PAGE = 8;

const AdminWFHList = () => {
  const [list, setList] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);

  const [showAssign, setShowAssign] = useState(false);
  const [assignData, setAssignData] = useState({
    employeeId: "",
    fromDate: "",
    toDate: "",
    reason: "",
  });

  const token = JSON.parse(localStorage.getItem("user"))?.token;

  /* ---------------- FETCH WFH ---------------- */
  const fetchWFH = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/wfh/all`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setList(res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

 
  const fetchEmployees = async () => {
    try {
      const token = JSON.parse(localStorage.getItem("user"))?.token;
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/user`, {
        headers: { Authorization: `Bearer ${token}`},
      });
      console.log(res)
      setEmployees(res.data.data || []);
    } catch (err) {
      console.error("Error fetching employees", err);
    }
  };
  useEffect(() => {
    fetchWFH();
    fetchEmployees();
  }, []);

  /* ---------------- STATUS UPDATE ---------------- */
  const changeStatus = async (id, status) => {
    const { value: remark } = await Swal.fire({
      title: `Confirm ${status}`,
      input: "text",
      inputPlaceholder: "Admin remarks (optional)",
      showCancelButton: true,
    });

    if (remark !== undefined) {
      await axios.put(
        `${import.meta.env.VITE_API_URL}/api/wfh/status/${id}`,
        { status, adminRemarks: remark },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchWFH();
    }
  };

  /* ---------------- ASSIGN WFH ---------------- */
  const submitAssignWFH = async () => {
    if (!assignData.employeeId || !assignData.fromDate || !assignData.toDate) {
      return Swal.fire("Error", "All fields required", "error");
    }

    await axios.post(
      `${import.meta.env.VITE_API_URL}/api/admin/assign-wfh`,
      assignData,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    Swal.fire("Success", "WFH Assigned Successfully", "success");
    setShowAssign(false);
    setAssignData({
      employeeId: "",
      fromDate: "",
      toDate: "",
      reason: "",
    });
    fetchWFH();
  };

  /* ---------------- PAGINATION ---------------- */
  const pageCount = Math.ceil(list.length / ITEMS_PER_PAGE);
  const paginatedData = list.slice(
    page * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE + ITEMS_PER_PAGE
  );

  /* ---------------- EXPORT CSV ---------------- */
  const exportCSV = () => {
    const rows = list.map((w) => ({
      Employee: w.userId?.name,
      Branch: w.branchId?.name || "-",
      From: new Date(w.fromDate).toLocaleDateString(),
      To: new Date(w.toDate).toLocaleDateString(),
      Status: w.status,
      Remarks: w.adminRemarks || "-",
    }));

    const csv = Papa.unparse(rows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "WFH_Requests.csv";
    link.click();
  };

  /* ---------------- EXPORT PDF ---------------- */
  const exportPDF = () => {
    const doc = new jsPDF("p", "mm", "a4");
    doc.setFontSize(16);
    doc.text("Work From Home Requests", 14, 16);

    autoTable(doc, {
      startY: 26,
      head: [["Employee", "Branch", "From", "To", "Status", "Remarks"]],
      body: list.map((w) => [
        w.userId?.name,
        w.branchId?.name || "-",
        new Date(w.fromDate).toLocaleDateString(),
        new Date(w.toDate).toLocaleDateString(),
        w.status,
        w.adminRemarks || "-",
      ]),
      styles: { fontSize: 9 },
      theme: "grid",
    });

    doc.save("WFH_Requests.pdf");
  };

  return (
    <AdminLayout>
      <div className="glass-page wfh-gradient">
        {/* HEADER */}
        <div className="glass-header">
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div className="branch-icon">
              <FaHome color="#bdeceb" />
            </div>
            <div className="glass-title">Work From Home Management</div>
          </div>

          <div style={{ marginLeft: "auto", display: "flex", gap: 10 }}>
            <button className="btn-glass" onClick={exportPDF}>
              <FaDownload /> PDF
            </button>
            <button className="btn-glass" onClick={exportCSV}>
              <FaFileCsv /> CSV
            </button>
            <button className="btn-glass" onClick={() => setShowAssign(!showAssign)}>
              <FaPlus /> Assign WFH
            </button>
          </div>
        </div>

        {/* ASSIGN WFH */}
        {showAssign && (
          <div className="glass-table-wrap" style={{ marginBottom: 18 }}>
            <h5 style={{ color: "#f4fbff", marginBottom: 12 }}>
              Assign Work From Home
            </h5>

            <div className="filters">
              <div className="glass-input">
                <select
                  value={assignData.employeeId}
                  onChange={(e) =>
                    setAssignData({ ...assignData, employeeId: e.target.value })
                  }
                >
                  <option value="">Select Employee</option>
                  {employees.map((e) => (
                    <option key={e._id} value={e._id}>
                      {e.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="glass-input">
                <input
                  type="date"
                  value={assignData.fromDate}
                  onChange={(e) =>
                    setAssignData({ ...assignData, fromDate: e.target.value })
                  }
                />
              </div>

              <div className="glass-input">
                <input
                  type="date"
                  value={assignData.toDate}
                  onChange={(e) =>
                    setAssignData({ ...assignData, toDate: e.target.value })
                  }
                />
              </div>
               
              <div className="glass-input">
                <input
                  placeholder="Reason (optional)"
                  value={assignData.reason}
                  onChange={(e) =>
                    setAssignData({ ...assignData, reason: e.target.value })
                  }
                />
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
              <button className="btn-glass present" onClick={submitAssignWFH}>
                Assign
              </button>
              <button className="btn-glass" onClick={() => setShowAssign(false)}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* TABLE */}
        <div className="glass-table-wrap">
          {loading ? (
            <div style={{ textAlign: "center", color: "#bcd9df" }}>
              Loading...
            </div>
          ) : (
            <>
              <div style={{ overflowX: "auto" }}>
                <table className="glass-table">
                  <thead>
                    <tr>
                      <th>S No.</th>
                      <th>Employee</th>
                      <th>Branch</th>
                      <th>From</th>
                      <th>To</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedData.map((w, i) => (
                      <tr key={w._id}>
                        <td>{page * ITEMS_PER_PAGE + i + 1}</td>
                        <td>{w.userId?.name}</td>
                        <td>{w.branchId?.name || "-"}</td>
                        <td>{new Date(w.fromDate).toLocaleDateString()}</td>
                        <td>{new Date(w.toDate).toLocaleDateString()}</td>
                        <td>
                          <span
                            className={`status-badge ${
                              w.status === "approved"
                                ? "present"
                                : w.status === "pending"
                                ? "late"
                                : "absent"
                            }`}
                          >
                            {w.status === "pending" && <MdPendingActions />}{" "}
                            {w.status}
                          </span>
                        </td>
                        <td>
                          {w.status === "pending" && (
                            <div style={{ display: "flex", gap: 8 }}>
                              <button
                                className="btn-glass"
                                onClick={() => changeStatus(w._id, "approved")}
                              >
                                <FaCheck />
                              </button>
                              <button
                                className="btn-glass"
                                onClick={() => changeStatus(w._id, "rejected")}
                              >
                                <FaTimes />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* PAGINATION */}
              {pageCount > 1 && (
                <div style={{ marginTop: 18 }}>
                  <ReactPaginate
                    pageCount={pageCount}
                    onPageChange={({ selected }) => setPage(selected)}
                    containerClassName="flex gap-2 justify-center"
                    pageLinkClassName="btn-glass"
                    activeLinkClassName="present"
                    previousLabel="←"
                    nextLabel="→"
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminWFHList;
