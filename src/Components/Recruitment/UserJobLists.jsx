import React, { useEffect, useState } from "react";
import { getPublicJobs } from "./jobApi";
import { useNavigate } from "react-router-dom";
import { FaInfoCircle, FaCalendarAlt, FaBriefcase, FaBuilding, FaMapMarkerAlt } from "react-icons/fa";
import { BiDetail } from "react-icons/bi";
import { motion } from "framer-motion";

const UserJobLists = () => {
  const [jobs, setJobs] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchJobs = async () => {
      const data = await getPublicJobs();
      setJobs(data || []);
    };
    fetchJobs();
  }, []);

  const getTag = (job) => {
    const today = new Date();
    const start = new Date(job.startDate);
    const diff = (start - today) / (1000 * 60 * 60 * 24);
    if (diff <= 7) return { text: "Urgent", color: "#ff4d6d" };
    if (diff <= 30) return { text: "New", color: "#6f42c1" };
    return { text: "Open", color: "#00d084" };
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#0b0f1a" }} className="py-5">
      <div className="container">
        <h2 className="text-center text-white mb-5 d-flex justify-content-center align-items-center gap-2">
          <BiDetail className="text-info" /> Job Openings
        </h2>

        <div className="row g-4">
          {jobs.length > 0 ? (
            jobs.map((job) => {
              const tag = getTag(job);
              return (
                <div className="col-md-6 col-lg-4" key={job._id}>
                  <motion.div
                    className="position-relative h-100"
                    whileHover={{ scale: 1.03 }}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    {/* Gradient border card */}
                    <div
                      className="rounded-4 p-1"
                      style={{
                        background: `linear-gradient(135deg, ${tag.color} 0%, #6610f2 100%)`,
                      }}
                    >
                      <div className="card bg-dark text-white border-0 rounded-4 shadow-lg h-100">
                        <div
                          className="position-absolute px-3 py-1 rounded-pill"
                          style={{
                            top: "15px",
                            right: "15px",
                            backgroundColor: tag.color,
                            color: "#fff",
                            fontWeight: "600",
                            fontSize: "0.8rem",
                          }}
                        >
                          {tag.text}
                        </div>

                        <div className="card-body d-flex flex-column">
                          {/* Job Title */}
                          <div className="d-flex align-items-center mb-3">
                            <div
                              className="p-3 rounded-circle d-flex justify-content-center align-items-center me-3"
                              style={{
                                background: "linear-gradient(135deg, #6f42c1, #6610f2)",
                              }}
                            >
                              <FaBriefcase className="text-white" />
                            </div>
                            <h5 className="mb-0 fw-bold">{job.title}</h5>
                          </div>

                          {/* Company */}
                          <p className="mb-2 d-flex align-items-center gap-2 text-white-50">
                            <FaBuilding className="text-info" /> {job.companyId?.name || "Company Name"}
                          </p>

                          {/* Branch */}
                          <p className="mb-3 d-flex align-items-center gap-2 text-white-50">
                            <FaMapMarkerAlt className="text-danger" /> {job.branchId?.name || "Main Branch"}
                          </p>

                          {/* Dates */}
                          <div className="d-flex justify-content-between mb-4">
                            <small className="text-white-50 d-flex align-items-center gap-1">
                              <FaCalendarAlt className="text-success" /> {new Date(job.startDate).toLocaleDateString()}
                            </small>
                            <small className="text-white-50 d-flex align-items-center gap-1">
                              <FaCalendarAlt className="text-danger" /> {new Date(job.endDate).toLocaleDateString()}
                            </small>
                          </div>

                          {/* View Details Button */}
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            className="btn text-white mt-auto d-flex align-item-center"
                            style={{
                              background: "linear-gradient(135deg, #6f42c1, #6610f2)",
                            }}
                            onClick={() => navigate(`/jobs/${job._id}`)}
                          >
                            <FaInfoCircle className="me-1" /> View Details
                          </motion.button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </div>
              );
            })
          ) : (
            <div className="col-12 text-center text-white py-5">
              No job openings available
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserJobLists;
