import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import moment from "moment";
import { 
  FiBriefcase, FiArrowRight, FiVideo, FiActivity, 
  FiClock, FiCalendar, FiPlusCircle, FiUserCheck,
  FiCheckCircle,
  FiUsers
} from "react-icons/fi";

import "./TalentMeetingsWidget.css"; 

const TalentMeetingsWidget = () => {
  const navigate = useNavigate();
  const [data, setData] = useState({ apps: [], interviews: [], meetings: [] });
  const [loading, setLoading] = useState(true);

  // --- DATABASE SYNC ---
  useEffect(() => {
    const fetchIntegratedData = async () => {
      try {
        const token = JSON.parse(localStorage.getItem("user"))?.token;
        const headers = { Authorization: `Bearer ${token}` };
        const baseUrl = import.meta.env.VITE_API_URL;

        const [appRes, intRes, meetRes] = await Promise.allSettled([
          axios.get(`${baseUrl}/api/applications`, { headers }),
          axios.get(`${baseUrl}/api/interviews`, { headers }),
          axios.get(`${baseUrl}/api/meeting/all`, { headers })
        ]);

        setData({
          apps: appRes.status === "fulfilled" ? appRes.value.data?.data : [],
          interviews: intRes.status === "fulfilled" ? intRes.value.data?.interviews : [],
          meetings: meetRes.status === "fulfilled" ? meetRes.value.data : []
        });
      } catch (error) {
        console.error("Sync error:", error);
      }
      setLoading(false);
    };
    fetchIntegratedData();
  }, []);

  // --- ANALYTICS LOGIC ---
  const today = moment().format("YYYY-MM-DD");
  const todayMeetings = data.meetings.filter(m => moment(m.date).format("YYYY-MM-DD") === today);
  const totalApps = data.apps.length;
  const shortRate = totalApps > 0 ? Math.round((data.apps.filter(a => a.status === 'shortlisted').length / totalApps) * 100) : 0;

  // --- ANIMATION VARIANTS ---
  const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 260, damping: 25 } } };

  return (
    <motion.div className="tm-widget-wrapper row g-4 mb-4" variants={container} initial="hidden" animate="show">
      
      {/* ================= LEFT: TALENT & HIRING PULSE ================= */}
      <div className="col-xl-6">
        <div className="tm-premium-card border-top-indigo">
          <motion.div variants={item} className="tm-card-head">
            <h6 className="tm-title d-flex justify-content-center align-item-center"><FiActivity className="me-2 text-indigo" /> Hiring Intelligence</h6>
            <button className="tm-action-link" onClick={() => navigate("/jobs/candidates")}>Analytics <FiArrowRight /></button>
          </motion.div>

          <div className="row g-3 mt-2 flex-grow-1">
            {/* Recruitment Funnel Nodes */}
            <motion.div variants={item} className="col-sm-5 d-flex flex-column gap-3 justify-content-center border-end-tm">
              <div className="tm-node-stat">
                <span className="label">Total Inflow</span>
                <h3 className="value">{totalApps}</h3>
                <div className="tm-mini-bar"><motion.div initial={{width:0}} animate={{width:'100%'}} className="fill indigo"></motion.div></div>
              </div>
              <div className="tm-node-stat">
                <span className="label">Shortlist Rate</span>
                <h3 className="value text-indigo">{shortRate}%</h3>
                <div className="tm-mini-bar"><motion.div initial={{width:0}} animate={{width: `${shortRate}%`}} className="fill indigo"></motion.div></div>
              </div>
              <div className="tm-node-stat">
                <span className="label">Hiring Velocity</span>
                <h3 className="value text-success">Optimal</h3>
              </div>
            </motion.div>

            {/* Application Quick Stream */}
            <motion.div variants={item} className="col-sm-7 ps-sm-4">
              <span className="tm-sub-label mb-3 d-block">RECENT CANDIDATES</span>
              <div className="tm-stream-container">
                <AnimatePresence>
                  {data.apps.slice(0, 4).map((app, i) => (
                    <motion.div key={i} className="tm-stream-row" whileHover={{ x: 5 }}>
                      <div className="dot"></div>
                      <div className="info">
                        <span className="name">{app.name}</span>
                        <span className="status">{app.status}</span>
                      </div>
                      <FiArrowRight className="arrow" />
                    </motion.div>
                  ))}
                  {data.apps.length === 0 && <div className="tm-empty">No active applications</div>}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
          
          <motion.div variants={item} className="tm-footer-actions mt-4 pt-3">
             <button className="tm-pill-btn" onClick={() => navigate("/admin/jobcreate")}><FiPlusCircle/> Post Job</button>
             <button className="tm-pill-btn outline" onClick={() => navigate("/admin/joblist")}><FiBriefcase/> Manage Openings</button>
          </motion.div>
        </div>
      </div>

      {/* ================= RIGHT: MEETING COMMAND CENTER ================= */}
      <div className="col-xl-6">
        <div className="tm-premium-card border-top-emerald">
          <motion.div variants={item} className="tm-card-head">
            <h6 className="tm-title d-flex justify-content-center align-item-center"><FiCalendar className="me-2 text-emerald" /> Meeting Hub</h6>
            <button className="tm-action-link" onClick={() => navigate("/admin/meeting-calender")}>Calendar <FiArrowRight /></button>
          </motion.div>

          <div className="row g-3 mt-2 flex-grow-1">
             {/* Today's Big Insight */}
             <motion.div variants={item} className="col-sm-5 d-flex flex-column justify-content-center text-center border-end-tm pe-sm-3">
                <div className="tm-today-circle">
                   <h2 className="m-0">{todayMeetings.length}</h2>
                   <span>Briefs Today</span>
                </div>
                <div className="mt-3">
                   <small className="text-muted fw-bold d-block mb-1">AVAILABILITY</small>
                   <span className="text-success fw-bold small m-auto"> <FiCheckCircle size={20} className="text-success opacity-50 m-auto" /> Sync Connected</span>
                </div>
             </motion.div>

             {/* Dynamic Meeting Timeline */}
             <motion.div variants={item} className="col-sm-7 ps-sm-4">
                <span className="tm-sub-label mb-3 d-block">TODAY'S TIMELINE</span>
                <div className="tm-timeline">
                  {todayMeetings.length > 0 ? todayMeetings.map((m, i) => (
                    <motion.div key={i} className="tm-timeline-item" whileHover={{ scale: 1.02 }}>
                       <div className="time-col">
                          <span className="time">{m.startTime}</span>
                          <span className="duration">HQ Room</span>
                       </div>
                       <div className="content-col">
                          <span className="subject">{m.title}</span>
                          <div className="participants">
                             {m.participants?.slice(0, 3).map((p, idx) => (
                               <div key={idx} className="p-avatar" title={p.name}>{p.name?.charAt(0)}</div>
                             ))}
                          </div>
                       </div>
                    </motion.div>
                  )) : (
                    <div className="tm-empty">No briefings for today</div>
                  )}
                </div>
             </motion.div>
          </div>

          <motion.div variants={item} className="tm-footer-actions mt-4 pt-3">
             <button className="tm-pill-btn emerald" onClick={() => navigate("/admin/meeting-form")}><FiVideo/> New Meeting</button>
             <button className="tm-pill-btn outline" onClick={() => navigate("/jobs/interview")}><FiUsers/> View Interviews</button>
          </motion.div>
        </div>
      </div>

    </motion.div>
  );
};

export default TalentMeetingsWidget;