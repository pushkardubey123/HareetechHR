import React, { useContext, useState, useEffect } from "react";
import { FaBriefcase, FaChevronRight, FaPaperPlane, FaTimes } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { SettingsContext } from "../Redux/SettingsContext";
import axios from 'axios';
import Swal from 'sweetalert2';
import "bootstrap/dist/css/bootstrap.min.css";
import "./HomeNavbar.css"; // Make sure this is imported!

const HomeNavbar = () => {
  const navigate = useNavigate();
  const { settings } = useContext(SettingsContext);
  const [scrolled, setScrolled] = useState(false);
  const [showDemoModal, setShowDemoModal] = useState(false);

  const [formData, setFormData] = useState({ name: '', mobileNo: '', email: '', message: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToLogin = () => {
    const section = document.getElementById("login-section");
    if (section) section.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/superadmin/public/enquiries`, formData);
      if (res.data.success) {
        setShowDemoModal(false);
        Swal.fire({
          icon: 'success', title: 'Request Sent!', text: 'Our team will contact you shortly.',
          background: '#0f172a', color: '#fff', confirmButtonColor: '#3b82f6'
        });
        setFormData({ name: '', mobileNo: '', email: '', message: '' });
      }
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'Failed', text: 'Please try again later.', background: '#0f172a', color: '#fff' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <nav className={`navbar fixed-top transition-all ${scrolled ? "navbar-scrolled" : "navbar-transparent"}`}>
        <div className="container-fluid px-4 px-lg-5 flex-nowrap"> 
          
          {/* --- Logo Section --- */}
          <div className="navbar-brand d-flex align-items-center gap-3" onClick={() => navigate("/")} style={{ cursor: "pointer" }}>
            <div className="logo-text">
              <span className="logo-icon-box"><span className="logo-dot"></span></span>
              <span className="logo-font text-white">
                Hareetech<span className="text-primary fw-bold">HR</span>
              </span>
            </div>
          </div>

          {/* 🔥 NEW: Center Navigation Links with Hover Line 🔥 */}
          <div className="d-none d-lg-flex align-items-center justify-content-end me-4 flex-grow-1 gap-4">
            <a href="#pricing-section" className="nav-hover-line text-white text-decoration-none fw-medium">Pricing</a>
            <div className="nav-hover-line text-white fw-medium d-flex align-items-center" onClick={() => navigate("/jobs")} style={{cursor: 'pointer'}}>
              <FaBriefcase className="me-2 text-primary" /> Career
            </div>
          </div>

          {/* --- Actions Section --- */}
<div className="d-flex align-items-center gap-3 ms-auto nav-actions">
            
            <button 
              className="nav-btn-demo d-none d-md-flex" 
              onClick={() => setShowDemoModal(true)}
            >
              Request Demo
            </button>

            <button className="nav-btn-login" onClick={scrollToLogin}>
              <span>Login</span>
              <FaChevronRight className="nav-btn-icon" />
            </button>
            
          </div>
        </div>
      </nav>

      {/* --- Demo Modal (Same as before) --- */}
      {showDemoModal && (
        <div className="fixed-top w-100 h-100 d-flex justify-content-center align-items-center" style={{ background: 'rgba(2, 6, 23, 0.85)', backdropFilter: 'blur(10px)', zIndex: 9999 }}>
          <div className="card shadow-lg border-0 position-relative" style={{ maxWidth: '500px', width: '90%', backgroundColor: '#0f172a', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <button onClick={() => setShowDemoModal(false)} className="btn btn-sm position-absolute top-0 end-0 mt-3 me-3 text-white rounded-circle" style={{ background: 'rgba(255,255,255,0.1)', width: '35px', height: '35px' }}>
              <FaTimes />
            </button>
            <div className="card-body p-4 p-md-5">
              <div className="text-center mb-4">
                <div className="bg-primary text-white rounded-circle d-inline-flex justify-content-center align-items-center mb-3 shadow" style={{width: '60px', height: '60px', fontSize: '1.5rem'}}><FaPaperPlane /></div>
                <h3 className="text-white fw-bold">Get a Live Demo</h3>
                <p className="text-muted small">Leave your details and our product expert will contact you.</p>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="mb-3"><input type="text" name="name" className="form-control bg-dark border-secondary text-light py-2" placeholder="Full Name" value={formData.name} onChange={handleChange} required /></div>
                <div className="row">
                  <div className="col-md-6 mb-3"><input type="text" name="mobileNo" className="form-control bg-dark border-secondary text-light py-2" placeholder="Mobile Number" value={formData.mobileNo} onChange={handleChange} required /></div>
                  <div className="col-md-6 mb-3"><input type="email" name="email" className="form-control bg-dark border-secondary text-light py-2" placeholder="Work Email" value={formData.email} onChange={handleChange} required /></div>
                </div>
                <button type="submit" className="btn btn-primary w-100 fw-bold py-3 rounded-pill shadow-lg mt-3" disabled={loading}>
                  {loading ? 'Submitting...' : 'Book My Free Demo'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default HomeNavbar;