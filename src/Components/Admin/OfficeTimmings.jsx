import React, { useEffect, useState } from "react";
import axios from "axios";
import DynamicLayout from "../Common/DynamicLayout";
import Swal from "sweetalert2";
import { FaRegClock, FaCity, FaSave, FaHistory } from "react-icons/fa";
import "./OfficeTimmings.css";

const OfficeTiming = () => {
  const [branches, setBranches] = useState([]);
  const [branchId, setBranchId] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [timings, setTimings] = useState([]);
  const [loading, setLoading] = useState(false);

  // ✅ PERMISSION LOGIC
  const userStr = localStorage.getItem("user");
  const userObj = userStr ? JSON.parse(userStr) : null;
  const token = userObj?.token;
  const isAdmin = userObj?.role === "admin";
  const [perms, setPerms] = useState({ view: false, create: false, edit: false, delete: false });

  useEffect(() => {
    const fetchPerms = async () => {
      if (isAdmin || !token) return;
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/my-modules`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        // Assuming module is shift or attendance
        if (res.data.detailed?.shift || res.data.detailed?.attendance) {
          setPerms(res.data.detailed.shift || res.data.detailed.attendance);
        }
      } catch (e) {
        console.error("Permission fetch failed", e);
      }
    };
    fetchPerms();
    fetchBranches();
  }, [token, isAdmin]);

  const fetchBranches = async () => {
    const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/branch`, {
      headers: { Authorization: `Bearer ${token}` },            
    });
    setBranches(res.data.data || []);
  };

  const fetchTiming = async (bid) => {
    if (!bid) return;
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/officetimming/timing?branchId=${bid}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.data) {
        setStart(res.data.data.officeStart);
        setEnd(res.data.data.officeEnd);
      } else {
        setStart(""); setEnd("");
      }
    } catch {
      setStart(""); setEnd("");
    }
  };

  const saveTiming = async () => {
    if (!branchId) return Swal.fire("Error", "Please select branch", "error");
    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/officetimming/timing`,
        { branchId, officeStart: start, officeEnd: end },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      Swal.fire({ icon: "success", title: "Saved!", showConfirmButton: false, timer: 1500 });
      loadAllTimings();
    } catch (err) {
      Swal.fire("Error", "Failed to save timing", "error");
    }
  };

  const loadAllTimings = async () => {
    setLoading(true);
    const result = [];
    for (let b of branches) {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/officetimming/timing?branchId=${b._id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (res.data.data) {
          result.push({
            branch: b.name,
            start: res.data.data.officeStart,
            end: res.data.data.officeEnd,
          });
        }
      } catch {}
    }
    setTimings(result);
    setLoading(false);
  };

  useEffect(() => { if (branches.length) loadAllTimings(); }, [branches]);
  useEffect(() => { fetchTiming(branchId); }, [branchId]);

  const canEdit = isAdmin || perms.edit || perms.create;

  return (
    <DynamicLayout>
      <div className="timing-page">
        <h2 className="timing-title">Office Schedule Management</h2>

        {/* ✅ PROTECTED FORM */}
        {canEdit && (
          <div className="timing-form-card">
            <div className="row g-4">
              <div className="col-md-4">
                <label className="timing-label">Select Branch</label>
                <div className="timing-input-group">
                  <FaCity style={{color: 'var(--tm-primary)'}} />
                  <select value={branchId} onChange={(e) => setBranchId(e.target.value)}>
                    <option value="">All Branches</option>
                    {branches.map((b) => (
                      <option key={b._id} value={b._id}>{b.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="col-md-3">
                <label className="timing-label">Shift Start</label>
                <div className="timing-input-group">
                  <FaRegClock style={{color: 'var(--tm-primary)'}} />
                  <input type="time" value={start} onChange={(e) => setStart(e.target.value)} />
                </div>
              </div>

              <div className="col-md-3">
                <label className="timing-label">Shift End</label>
                <div className="timing-input-group">
                  <FaRegClock style={{color: 'var(--tm-primary)'}} />
                  <input type="time" value={end} onChange={(e) => setEnd(e.target.value)} />
                </div>
              </div>

              <div className="col-md-2 d-flex align-items-end">
                <button className="btn-save-timing" onClick={saveTiming}>
                  <FaSave /> Update
                </button>
              </div>
            </div>
          </div>
        )}

        {/* List of Timings */}
        <div className="d-flex align-items-center gap-2 mb-3 mt-4">
            <FaHistory className="text-primary" />
            <h5 className="m-0 fw-bold">Active Shift Records</h5>
        </div>
        
        <div className="timing-table-wrap">
          <table className="timing-table">
            <thead>
              <tr>
                <th>Branch Name</th>
                <th>Opening Time</th>
                <th>Closing Time</th>
              </tr>
            </thead>
            <tbody>
              {timings.length > 0 ? (
                timings.map((t, i) => (
                  <tr key={i}>
                    <td style={{fontWeight: '700'}}>{t.branch}</td>
                    <td><span className="time-badge">{t.start}</span></td>
                    <td><span className="time-badge">{t.end}</span></td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3" className="text-center py-5 text-muted">
                    No office timings configured yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DynamicLayout>
  );
};

export default OfficeTiming;