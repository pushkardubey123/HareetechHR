import React, { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import AdminLayout from "./AdminLayout";
import Loader from "./Loader/Loader";
import { FcLeave } from "react-icons/fc";

const AdminLeavePanel = () => {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  const token = JSON.parse(localStorage.getItem("user"))?.token;

  useEffect(() => {
    injectCSS();
    fetchLeaves();
  }, []);

  const injectCSS = () => {
    if (document.getElementById("leave-ui")) return;
    const style = document.createElement("style");
    style.id = "leave-ui";
    style.innerHTML = `
      .leave-page{padding:24px;min-height:100vh;background:linear-gradient(180deg,#0b1220,#e9edf4)}
      .leave-card{background:rgba(255,255,255,.05);border-radius:14px;padding:20px;box-shadow:0 8px 30px rgba(0,0,0,.5)}
      .leave-title{font-size:20px;font-weight:700;color:#fff}
      .chip{padding:6px 12px;border-radius:999px;font-weight:600;font-size:12px}
      .chip.pending{background:#ffc107;color:#000}
      .chip.approved{background:#198754;color:#fff}
      .chip.rejected{background:#dc3545;color:#fff}
      table{color:black}
      @media(max-width:768px){.leave-title{font-size:18px}}
    `;
    document.head.appendChild(style);
  };

  const fetchLeaves = async () => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/leaves`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setLeaves(res.data.data || []);
    } catch {
      Swal.fire("Error", "Failed to load leaves", "error");
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, status) => {
    await axios.put(
      `${import.meta.env.VITE_API_URL}/api/leaves/${id}`,
      { status },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    Swal.fire("Updated", `Leave ${status}`, "success");
    fetchLeaves();
  };

  const filtered = leaves.filter(l =>
    l.employeeId?.name?.toLowerCase().includes(search.toLowerCase()) &&
    (status ? l.status === status : true)
  );

  return (
    <AdminLayout>
      <div className="leave-page">
        <div className="leave-card">
          <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap">
            <div className="leave-title d-flex align-items-center gap-2">
              <FcLeave /> Employee Leave Requests
            </div>

            <div className="d-flex gap-2 mt-2">
              <input
                className="form-control"
                placeholder="Search employee"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <select
                className="form-select"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="">All</option>
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
          </div>

          <div className="table-responsive">
            <table className="table table-bordered align-middle">
              <thead className="table-dark">
                <tr>
                  <th>#</th>
                  <th>Employee</th>
                  <th>Type</th>
                  <th>From</th>
                  <th>To</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="7" className="text-center"><Loader /></td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan="7" className="text-center">No records</td></tr>
                ) : (
                  filtered.map((l, i) => (
                    <tr key={l._id}>
                      <td>{i + 1}</td>
                      <td>{l.employeeId?.name}</td>
                      <td>{l.leaveType}</td>
                      <td>{l.startDate?.slice(0,10)}</td>
                      <td>{l.endDate?.slice(0,10)}</td>
                      <td>
                        <span className={`chip ${l.status.toLowerCase()}`}>
                          {l.status}
                        </span>
                      </td>
                      <td>
                        <button
                          className="btn btn-sm btn-success me-1"
                          disabled={l.status !== "Pending"}
                          onClick={() => updateStatus(l._id,"Approved")}
                        >
                          Approve
                        </button>
                        <button
                          className="btn btn-sm btn-danger"
                          disabled={l.status !== "Pending"}
                          onClick={() => updateStatus(l._id,"Rejected")}
                        >
                          Reject
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminLeavePanel;
