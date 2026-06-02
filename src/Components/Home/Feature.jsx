import React from "react";
import { 
  FaChartLine, FaUsers, FaRegCalendarCheck, FaMoneyCheckAlt, 
  FaFileInvoiceDollar, FaFileAlt, FaCogs, FaShieldAlt, FaBell,
  FaMapMarkedAlt, FaNetworkWired, FaFingerprint
} from "react-icons/fa";
import "./Feature.css";

const Features = () => {
  
  const featureList = [
    { id: 1, icon: <FaChartLine />, title: "Executive Dashboard", desc: "360° view of workforce metrics, attrition rates, and daily attendance heatmaps." },
    { id: 2, icon: <FaFingerprint />, title: "Biometric Integration", desc: "Seamless API sync with Matrix, Essl, and other biometric hardware devices." },
    { id: 3, icon: <FaMapMarkedAlt />, title: "Geo-Fencing Attendance", desc: "GPS-based attendance marking for field sales employees with spoof-proof logging." },
    { id: 4, icon: <FaMoneyCheckAlt />, title: "Automated Payroll Engine", desc: "One-click salary processing with auto-calculation of PF, ESIC, PT, and TDS." },
    { id: 5, icon: <FaNetworkWired />, title: "Shift Rostering", desc: "Complex shift rotation management, night shift allowances, and swap requests." },
    { id: 6, icon: <FaFileInvoiceDollar />, title: "Expense Management", desc: "Paperless reimbursement claims workflow with OCR receipt scanning." },
    { id: 7, icon: <FaShieldAlt />, title: "Enterprise Security", desc: "Role-Based Access Control (RBAC), 2FA, and Audit Logs for data security." },
    { id: 8, icon: <FaFileAlt />, title: "Compliance & Reports", desc: "Auto-generated government compliance forms (Form 16, PF Challans) and MIS reports." },
    { id: 9, icon: <FaUsers />, title: "Employee Lifecycle", desc: "End-to-end management from Onboarding to Exit interviews and F&F settlement." }
  ];

  return (
    <div className="features-wrapper">
      <div className="decor-line"></div>
      
      <div className="features-container ">
        
        {/* --- LEFT SIDE: Sticky Visual --- */}
        <div className="feat-col-left">
          <div className="sticky-frame">
             <div className="glow-backdrop"></div>
             
             <div className="feature-showcase-glass">
                <div className="glass-header">
                    <div className="dots">
                        <span></span><span></span><span></span>
                    </div>
                    <div className="address-bar">audit365-hr.com/dashboard</div>
                </div>
                
                {/* Main Image */}
                <img 
                  src="/images/Payroll.png" 
                  alt="Payroll Interface" 
                  className="feat-main-img"
                  onError={(e) => {e.target.src = "https://audit365-hr.hareetech.com/dash.png"}} 
                />
                
                {/* --- FLOATING 3D BADGES (Sabse Upar) --- */}
                <div className="float-card card-attendance">
                   <div className="icon-circle"><FaRegCalendarCheck /></div>
                   <div className="card-text">
                      <span className="tiny-label">Attendance</span>
                      <span className="bold-val">98.2%</span>
                   </div>
                </div>

                <div className="float-card card-payroll">
                   <div className="icon-circle pay-icon"><FaMoneyCheckAlt /></div>
                   <div className="card-text">
                      <span className="tiny-label">Payroll Status</span>
                      <span className="text-warning">Processed</span>
                   </div>
                </div>
                {/* --------------------------------------- */}

             </div>

             <div className="left-text-block">
                <h2>Unified HR Experience</h2>
                <p>Stop juggling spreadsheets. Manage recruitment, attendance, payroll, and compliance in one ecosystem.</p>
             </div>
          </div>
        </div>

        {/* --- RIGHT SIDE: Premium Scroller --- */}
        <div className="feat-col-right">
            <div className="section-header">
                <span className="premium-pill">ENTERPRISE MODULES</span>
                <h2>Scalable Technology for <br/> <span className="gradient-text">Modern Workforces.</span></h2>
            </div>

            <div className="marquee-wrapper-box">
                <div className="marquee-track-vertical">
                    {[...featureList, ...featureList].map((item, index) => (
                        <div className="premium-feature-card" key={index}>
                            <div className="card-glow-border"></div>
                            <div className="card-content">
                                <div className="feat-icon-gradient">
                                    {item.icon}
                                </div>
                                <div className="feat-text-content">
                                    <h3>{item.title}</h3>
                                    <p>{item.desc}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>

      </div>
    </div>
  );
};

export default Features;