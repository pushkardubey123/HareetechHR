import React, { useState, useEffect } from "react";
import axios from "axios";
import moment from "moment";
import EmployeeLayout from "../Common/DynamicLayout"; 
import "./MyProfile.css";
import { 
  FaUser, FaEnvelope, FaPhoneAlt, FaMapMarkerAlt, 
  FaBirthdayCake, FaTransgender, FaBuilding, 
  FaBriefcase, FaCalendarCheck, FaClock, 
  FaMoneyBillWave, FaIdCard, FaUniversity, 
  FaAmbulance, FaHeart, FaCircle, FaShieldAlt
} from "react-icons/fa";

const EmployeeProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const API_URL = import.meta.env.VITE_API_URL;
  const token = JSON.parse(localStorage.getItem("user"))?.token;

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await axios.get(`${API_URL}/user/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.data.success) {
          setProfile(response.data.data);
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setLoading(false);
      }
    };

    if (token) fetchProfile();
  }, [token, API_URL]);

  if (loading) {
    return (
      <EmployeeLayout>
        <div className="ep-loader-container">
          <div className="ep-spinner"></div>
          <p>Loading your profile...</p>
        </div>
      </EmployeeLayout>
    );
  }

  if (!profile) return <EmployeeLayout><div className="ep-error">Profile data not found.</div></EmployeeLayout>;

  const profilePicUrl = profile.profilePic 
    ? `${API_URL}/static/${profile.profilePic}` 
    : "https://ui-avatars.com/api/?name=" + profile.name + "&background=random";

  // Calculate Tenure
  const tenure = profile.doj ? moment(profile.doj).fromNow(true) : "New Joiner";

  return (
    <EmployeeLayout>
      <div className="ep-main-wrapper">
        
        {/* Animated Background Blobs */}
        <div className="ep-bg-shape ep-shape1"></div>
        <div className="ep-bg-shape ep-shape2"></div>
        <div className="ep-bg-shape ep-shape3"></div>

        <div className="ep-glass-container animate-fade-in">
          
          {/* COVER & AVATAR SECTION */}
          <div className="ep-cover-section animate-slide-up">
            <div className="ep-cover-photo"></div>
            <div className="ep-avatar-wrapper">
              <img src={profilePicUrl} alt="Profile" className="ep-avatar" />
              <div className={`ep-status-badge ${profile.status === 'active' ? 'active' : 'inactive'}`}>
                <FaCircle size={10} /> {profile.status || "Active"}
              </div>
            </div>
          </div>

          {/* HEADER INFO SECTION */}
          <div className="ep-header-info animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <h1 className="ep-name">{profile.name}</h1>
            <div className="ep-badges-row">
              <span className="ep-badge ep-badge-role">
                <FaBriefcase /> {profile.designationId?.name || "Employee"}
              </span>
              <span className="ep-badge ep-badge-dept">
                <FaBuilding /> {profile.departmentId?.name || "General"}
              </span>
              <span className="ep-badge ep-badge-tenure">
                <FaShieldAlt /> {tenure}
              </span>
            </div>
          </div>

          <div className="ep-divider"></div>

          {/* GRID DATA SECTION */}
          <div className="ep-data-grid">
            
            {/* CARD 1: Personal Details */}
            <div className="ep-glass-card animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <div className="ep-card-header">
                <div className="ep-icon-box ep-icon-blue"><FaUser /></div>
                <h4>Personal Details</h4>
              </div>
              <div className="ep-card-body">
                <div className="ep-data-row"><FaEnvelope/> <span>{profile.email}</span></div>
                <div className="ep-data-row"><FaPhoneAlt/> <span>{profile.phone || "Not Provided"}</span></div>
                <div className="ep-data-row"><FaBirthdayCake/> <span>{profile.dob ? moment(profile.dob).format("DD MMM, YYYY") : "Not Provided"}</span></div>
                <div className="ep-data-row"><FaTransgender/> <span className="capitalize">{profile.gender || "Not Provided"}</span></div>
                <div className="ep-data-row align-start"><FaMapMarkerAlt/> <span>{profile.address || "Not Provided"}</span></div>
              </div>
            </div>

            {/* CARD 2: Employment Details */}
            <div className="ep-glass-card animate-slide-up" style={{ animationDelay: '0.3s' }}>
              <div className="ep-card-header">
                <div className="ep-icon-box ep-icon-purple"><FaBuilding /></div>
                <h4>Employment Info</h4>
              </div>
              <div className="ep-card-body">
                <div className="ep-data-row"><FaCalendarCheck/> <strong>DOJ:</strong> <span>{profile.doj ? moment(profile.doj).format("DD MMM, YYYY") : "N/A"}</span></div>
                <div className="ep-data-row"><FaMapMarkerAlt/> <strong>Branch:</strong> <span>{profile.branchId?.name || "Main Branch"}</span></div>
                <div className="ep-data-row"><FaClock/> <strong>Shift:</strong> <span>{profile.shiftId?.name || "Standard Shift"}</span></div>
                <div className="ep-data-row"><FaBriefcase/> <strong>Role Type:</strong> <span className="capitalize">{profile.role}</span></div>
              </div>
            </div>

            {/* CARD 3: Financial Details */}
            <div className="ep-glass-card animate-slide-up" style={{ animationDelay: '0.4s' }}>
              <div className="ep-card-header">
                <div className="ep-icon-box ep-icon-green"><FaMoneyBillWave /></div>
                <h4>Financial Info</h4>
              </div>
              <div className="ep-card-body">
                <div className="ep-data-row"><FaMoneyBillWave/> <strong>Basic Salary:</strong> <span className="ep-highlight-text">₹{profile.basicSalary?.toLocaleString() || "0"}</span></div>
                <div className="ep-data-row"><FaIdCard/> <strong>PAN No:</strong> <span className="uppercase">{profile.pan || "Not Provided"}</span></div>
                <div className="ep-data-row"><FaUniversity/> <strong>Bank A/C:</strong> <span>{profile.bankAccount ? `XXXX-XXXX-${profile.bankAccount.slice(-4)}` : "Not Provided"}</span></div>
              </div>
            </div>

            {/* CARD 4: Emergency Contact */}
            <div className="ep-glass-card animate-slide-up" style={{ animationDelay: '0.5s' }}>
              <div className="ep-card-header">
                <div className="ep-icon-box ep-icon-red"><FaAmbulance /></div>
                <h4>Emergency Contact</h4>
              </div>
              <div className="ep-card-body">
                <div className="ep-data-row"><FaUser/> <strong>Name:</strong> <span>{profile.emergencyContact?.name || "Not Provided"}</span></div>
                <div className="ep-data-row"><FaHeart/> <strong>Relation:</strong> <span className="capitalize">{profile.emergencyContact?.relation || "N/A"}</span></div>
                <div className="ep-data-row"><FaPhoneAlt/> <strong>Phone:</strong> <span>{profile.emergencyContact?.phone || "N/A"}</span></div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </EmployeeLayout>
  );
};

export default EmployeeProfile;