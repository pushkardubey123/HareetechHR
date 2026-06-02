import React, { useEffect, useState } from "react";
import { getPublicJobs } from "./jobApi";
import { useNavigate } from "react-router-dom";
import { 
  FaInfoCircle, FaCalendarAlt, FaBriefcase, 
  FaBuilding, FaMapMarkerAlt, FaSearch 
} from "react-icons/fa";
import { BiDetail } from "react-icons/bi";
import { motion } from "framer-motion";
import "./UserJobLists.css"; // Styles Import

const UserJobLists = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const data = await getPublicJobs();
        setJobs(data || []);
        console.log(data)
      } catch (error) {
        console.error("Error fetching jobs:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, []);

  const getTag = (job) => {
    const today = new Date();
    const start = new Date(job.startDate);
    const diff = (start - today) / (1000 * 60 * 60 * 24);
    
    if (diff <= 7 && diff >= 0) return { text: "Urgent", color: "#ff4d6d", bg: "#fff0f3" };
    if (diff <= 30 && diff >= 0) return { text: "New", color: "#6f42c1", bg: "#f3f0ff" };
    return { text: "Active", color: "#10b981", bg: "#ecfdf5" };
  };

  return (
    <div className="user-job-container">
      <div className="container">
        
        {/* Header */}
        <motion.h2 
          className="section-title"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <BiDetail className="text-primary" /> Career Opportunities
        </motion.h2>

        <div className="row g-4">
          {loading ? (
            <div className="text-center w-100 py-5 text-muted">Loading openings...</div>
          ) : jobs.length > 0 ? (
            jobs.map((job, index) => {
              const tag = getTag(job);
              return (
                <div className="col-md-6 col-lg-4" key={job._id}>
                  <motion.div
                    className="job-card-wrapper"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                  >
                    <div className="job-card">
                      
                      {/* Badge */}
                      <span 
                        className="status-badge" 
                        style={{ backgroundColor: tag.color, color: '#fff' }}
                      >
                        {tag.text}
                      </span>

                      {/* Header: Icon + Title */}
                      <div className="job-header">
                        <div className="job-icon">
                          <FaBriefcase />
                        </div>
                        <h5 className="job-title">{job.title}</h5>
                      </div>

                      {/* Details */}
                      <div className="job-details">
                        <div className="detail-item">
                          <FaBuilding /> {job.companyId?.name || "Company Confidential"}
                        </div>
                        <div className="detail-item">
                          <FaMapMarkerAlt /> {job.branchId?.name || "Remote / On-site"}
                        </div>
                      </div>

                      {/* Dates */}
                      <div className="job-dates">
                        <div className="date-box">
                          Apply Start
                          <span>{new Date(job.startDate).toLocaleDateString()}</span>
                        </div>
                        <div className="date-box text-end">
                          Deadline
                          <span>{new Date(job.endDate).toLocaleDateString()}</span>
                        </div>
                      </div>

                      {/* Action */}
                      <button 
                        className="btn-view-job"
                        onClick={() => navigate(`/jobs/${job._id}`)}
                      >
                        View Details <FaInfoCircle />
                      </button>

                    </div>
                  </motion.div>
                </div>
              );
            })
          ) : (
            <div className="empty-state">
              <FaSearch className="fs-1 mb-3 opacity-25" />
              <h4>No Current Openings</h4>
              <p>Check back later for new opportunities.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserJobLists;