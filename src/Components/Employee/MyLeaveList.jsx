import React, { useEffect, useState } from "react";
import axios from "axios";
import EmployeeLayout from "./EmployeeLayout";
import { FaPlus, FaCalendarCheck, FaHourglassHalf, FaCheckCircle, FaTimesCircle, FaFileAlt } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import moment from "moment";
import TableLoader from "../Admin/Loader/Loader"; // Using your existing loader
import "./MyLeaveList.css"; // Importing new CSS

const MyLeaveList = () => {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const navigate = useNavigate();

  const fetchLeaves = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      const token = user?.token;
      const employeeId = user?._id || user?.id;

      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/leaves/employee/${employeeId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        const data = res.data.data || [];
        setLeaves(data.reverse()); // Show latest first

        // Calculate Stats
        setStats({
          total: data.length,
          pending: data.filter(l => l.status === "Pending").length,
          approved: data.filter(l => l.status === "Approved").length,
          rejected: data.filter(l => l.status === "Rejected").length,
        });
      }
    } catch (error) {
      console.error("Failed to fetch leaves", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLeaves(); }, []);

  const statCards = [
    { label: "Total Applications", value: stats.total, icon: <FaFileAlt />, color: "blue" },
    { label: "Pending Approval", value: stats.pending, icon: <FaHourglassHalf />, color: "orange" },
    { label: "Leaves Approved", value: stats.approved, icon: <FaCheckCircle />, color: "green" },
    { label: "Leaves Rejected", value: stats.rejected, icon: <FaTimesCircle />, color: "red" },
  ];

  return (
    <EmployeeLayout>
      <div className="leave-list-wrapper">
        
        {/* --- HEADER --- */}
        <div className="ll-header animate__animated animate__fadeInDown">
          <div className="ll-title">
            <h3>My Leave History</h3>
            <p>View your past applications and their current status.</p>
          </div>
          <button className="btn-apply-leave" onClick={() => navigate("/employee/apply-leave")}>
            <FaPlus /> Apply New Leave
          </button>
        </div>

        {/* --- STATS GRID (BOOTSTRAP) --- */}
        <div className="row g-4 mb-4">
          {statCards.map((stat, i) => (
            <div className="col-12 col-md-6 col-xl-3" key={i}>
              <div className={`ll-stat-card ${stat.color} animate__animated animate__zoomIn`} style={{animationDelay: `${i*0.1}s`}}>
                <div className="ll-icon-circle">{stat.icon}</div>
                <div className="ll-stat-info">
                  <h4>{stat.value}</h4>
                  <span>{stat.label}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* --- TABLE SECTION --- */}
        <div className="ll-table-card animate__animated animate__fadeInUp">
          <div className="ll-table-header">
            <h5>Detailed Log</h5>
          </div>
          
          <div className="table-responsive">
            {loading ? (
              <div className="p-5"><TableLoader /></div>
            ) : leaves.length === 0 ? (
              <div className="text-center p-5 text-muted">
                <FaCalendarCheck size={40} className="mb-3 opacity-25" />
                <p>No leave records found. Apply for one!</p>
              </div>
            ) : (
              <table className="ll-table">
                <thead>
                  <tr>
                    <th>Leave Type</th>
                    <th>Duration</th>
                    <th>Reason</th>
                    <th>Applied On</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {leaves.map((leave) => (
                    <tr key={leave._id}>
                      <td>
                        <span className="leave-type-box">{leave.leaveType}</span>
                      </td>
                      <td>
                        <div className="fw-bold">{moment(leave.startDate).format("MMM DD, YYYY")}</div>
                        <small className="text-muted">To {moment(leave.endDate).format("MMM DD, YYYY")}</small>
                      </td>
                      <td style={{maxWidth: '300px'}}>
                        <span className="text-truncate d-block" title={leave.reason}>{leave.reason}</span>
                      </td>
                      <td className="text-muted">{moment(leave.createdAt).format("MMM DD, HH:mm")}</td>
                      <td>
                        <span className={`ll-badge ${leave.status.toLowerCase()}`}>
                          {leave.status === 'Approved' && <FaCheckCircle size={12}/>}
                          {leave.status === 'Rejected' && <FaTimesCircle size={12}/>}
                          {leave.status === 'Pending' && <FaHourglassHalf size={12}/>}
                          {leave.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

      </div>
    </EmployeeLayout>
  );
};

export default MyLeaveList;