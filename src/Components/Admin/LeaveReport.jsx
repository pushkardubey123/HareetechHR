import React, { useEffect, useState } from "react";
import axios from "axios";
import AdminLayout from "../Admin/AdminLayout";
import { FcLeave } from "react-icons/fc";
import { FaCheckCircle, FaTimesCircle, FaClock } from "react-icons/fa";

const LeaveReport = () => {
  const user = JSON.parse(localStorage.getItem("user"));
  const [leaves, setLeaves] = useState([]);
  const [month, setMonth] = useState(new Date().toISOString().slice(0,7));
  const [type, setType] = useState("Monthly");

  useEffect(() => {
    injectCSS();
    fetchReport();
  }, [month, type]);

  const injectCSS = () => {
    if (document.getElementById("leave-report-ui")) return;
    const s = document.createElement("style");
    s.id = "leave-report-ui";
    s.innerHTML = `
      .report-page{padding:24px;background:linear-gradient(180deg,#0b1220,#edf1f7)}
      .report-card{background:rgba(255,255,255,.06);border-radius:14px;padding:20px}
      .summary{border-radius:12px;padding:16px;color:#fff}
      .approved{background:#198754}
      .rejected{background:#dc3545}
      .pending{background:#ffc107;color:#000}
    `;
    document.head.appendChild(s);
  };
const fetchReport = async () => {
  let url = `${import.meta.env.VITE_API_URL}/api/leaves/report?type=${type}`;

  if (type === "Monthly") {
    url += `&month=${month}`;
  } else {
    url += `&year=${month.split("-")[0]}`; // ✅ year only
  }

  const res = await axios.get(url, {
    headers: { Authorization: `Bearer ${user.token}` },
  });

  setLeaves(res.data.data || []);
};


  const approved = leaves.filter(l=>l.status==="Approved").length;
  const rejected = leaves.filter(l=>l.status==="Rejected").length;
  const pending = leaves.filter(l=>l.status==="Pending").length;

  return (
    <AdminLayout>
      <div className="report-page">
        <div className="report-card">
          <h4 className="text-white d-flex align-items-center gap-2">
            <FcLeave /> Leave Report
          </h4>

          <div className="row my-3">
            <div className="col-md-3">
              <select className="form-select" value={type} onChange={e=>setType(e.target.value)}>
                <option value="Monthly">Monthly</option>
                <option value="Yearly">Yearly</option>
              </select>
            </div>
            {type === "Monthly" && (
              <div className="col-md-3">
                <input type="month" className="form-control" value={month} onChange={e=>setMonth(e.target.value)} />
              </div>
            )}
          </div>

          <div className="row g-3 my-4">
            <div className="col-md-4">
              <div className="summary approved">
                <FaCheckCircle /> Approved: {approved}
              </div>
            </div>
            <div className="col-md-4">
              <div className="summary rejected">
                <FaTimesCircle /> Rejected: {rejected}
              </div>
            </div>
            <div className="col-md-4">
              <div className="summary pending">
                <FaClock /> Pending: {pending}
              </div>
            </div>
          </div>

          <div className="table-responsive">
            <table className="table table-bordered">
              <thead className="table-dark">
                <tr>
                  <th>Employee</th>
                  <th>Type</th>
                  <th>From</th>
                  <th>To</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {leaves.map((l,i)=>(
                  <tr key={i}>
                    <td>{l.employeeId?.name}</td>
                    <td>{l.leaveType}</td>
                    <td>{l.startDate?.slice(0,10)}</td>
                    <td>{l.endDate?.slice(0,10)}</td>
                    <td>{l.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      </div>
    </AdminLayout>
  );
};

export default LeaveReport;
