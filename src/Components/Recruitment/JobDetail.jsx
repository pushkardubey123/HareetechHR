import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getJobById } from "./jobApi";
import { FaCalendarAlt, FaBriefcase, FaBuilding, FaMapMarkerAlt } from "react-icons/fa";
import { motion } from "framer-motion";
import "./JobDetail.css";

const JobDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);

  useEffect(() => {
    const fetchJob = async () => {
      const data = await getJobById(id);
      setJob(data);
    };
    fetchJob();
  }, [id]);

  if (!job)
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "100vh", color: "#fff" }}>
        Loading...
      </div>
    );

  return (
    <div className="job-detail-page py-5" style={{ backgroundColor: "#0b0f1a", minHeight: "100vh" }}>
      <div className="container">
        <motion.div
          className="card job-detail-card p-4 shadow-lg border-0 rounded-4"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          style={{ background: "linear-gradient(135deg, #1f1f2e, #0f1429)" }}
        >
          <div className="mb-4">
            <h2 className="text-white fw-bold mb-2">{job.title}</h2>
            <div className="d-flex flex-wrap gap-3 text-white-50">
              <div className="d-flex align-items-center gap-1">
                <FaBuilding /> {job.companyId?.name || "Company Name"}
              </div>
              <div className="d-flex align-items-center gap-1">
                <FaBriefcase /> {job.designationId?.name || "Designation"}
              </div>
              <div className="d-flex align-items-center gap-1">
                <FaMapMarkerAlt /> {job.branchId?.name || "Main Branch"}
              </div>
              <div className="d-flex align-items-center gap-1">
                <FaCalendarAlt /> {new Date(job.startDate).toLocaleDateString()} - {new Date(job.endDate).toLocaleDateString()}
              </div>
            </div>
          </div>

          <div className="job-info mb-4 text-white-50">
            <p><strong>Department:</strong> {job.departmentId?.name}</p>
            <p><strong>Positions:</strong> {job.positions}</p>
            <p><strong>Skills Required:</strong> {job.skills.join(", ")}</p>
            <p><strong>Description:</strong> {job.description}</p>
            <p><strong>Requirement:</strong> {job.requirement}</p>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            className="btn apply-btn text-white fw-bold mt-3"
            style={{
              background: "linear-gradient(135deg, #6f42c1, #6610f2)",
              padding: "10px 25px",
              borderRadius: "10px",
              border: "none",
            }}
            onClick={() => navigate(`/jobs/${job._id}/apply`)}y
          >
            Apply Now
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
};

export default JobDetail;
