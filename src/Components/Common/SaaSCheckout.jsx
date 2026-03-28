import React, { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { FaBuilding, FaUser, FaEnvelope, FaLock, FaPhone, FaArrowLeft, FaShieldAlt } from "react-icons/fa";
import "./SaaSCheckout.css"; 

// Validation Schema
const checkoutSchema = yup.object({
  companyName: yup.string().required("Company Name is required"),
  name: yup.string().required("Admin Name is required"),
  email: yup.string().email("Invalid email format").required("Email is required"),
  phone: yup.string().matches(/^\d{10}$/, "Must be exactly 10 digits").required("Phone number is required"),
  password: yup.string().min(6, "Password must be at least 6 characters").required("Password is required"),
});

const SaaSCheckout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const selectedPlan = location.state?.plan || null; 

  const [isProcessing, setIsProcessing] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(checkoutSchema)
  });

  if (!selectedPlan) {
    navigate("/#pricing-section");
    return null;
  }

  // Check if it's a Free Trial or 0 price plan
  const isFreePlan = selectedPlan.isTrial || selectedPlan.price === 0;

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const onSubmit = async (data) => {
    setIsProcessing(true);

    try {
      const formData = new FormData();
      formData.append("role", "admin");
      formData.append("name", data.name);
      formData.append("email", data.email);
      formData.append("password", data.password);
      formData.append("phone", data.phone);
      formData.append("companyName", data.companyName);

      const registerRes = await axios.post(`${import.meta.env.VITE_API_URL}/user/register`, formData);
      
      if (!registerRes.data.success) {
        toast.error(registerRes.data.message || "Registration failed. Please try again.");
        setIsProcessing(false);
        return;
      }

      // ==========================================
      // FLOW A: FREE TRIAL (Skip Payment)
      // ==========================================
      if (isFreePlan) {
        setIsProcessing(false);
        toast.success("Account created successfully! Redirecting to your dashboard...");
        
        // Slight delay so the user can see the success message
        setTimeout(() => {
          navigate("/login"); 
        }, 1500);
        return; 
      }

      // ==========================================
      // FLOW B: PAID PLAN (Open Razorpay)
      // ==========================================
      const isRazorpayLoaded = await loadRazorpayScript();
      if (!isRazorpayLoaded) {
        toast.error("Failed to load the payment gateway. Please check your internet connection.");
        setIsProcessing(false);
        return;
      }

      const tempToken = registerRes.data.token; 
      const headers = { Authorization: `Bearer ${tempToken}` };

      // Create Order
      const orderRes = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/payment/create-order`,
        { planId: selectedPlan._id },
        { headers }
      );

      const { order } = orderRes.data;

      // Open Razorpay
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: "Audit365 HRMS",
        description: `Subscription: ${selectedPlan.name}`,
        order_id: order.id,
        handler: async function (response) {
          try {
            const verifyRes = await axios.post(
              `${import.meta.env.VITE_API_URL}/api/payment/verify`,
              {
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
                planId: selectedPlan._id
              },
              { headers }
            );

            if (verifyRes.data.success) {
              toast.success("Payment verified successfully! Welcome aboard.");
              setTimeout(() => {
                navigate("/login");
              }, 1500);
            }
          } catch (err) {
            toast.error("Payment verification failed. Please contact technical support.");
            setIsProcessing(false);
          }
        },
        prefill: {
          name: data.name,
          email: data.email,
          contact: data.phone
        },
        theme: { color: selectedPlan.themeColor1 || "#3b82f6" },
        modal: {
          ondismiss: function() {
            setIsProcessing(false);
            toast.info("Payment process interrupted. Your account was created successfully. Please log in to complete your subscription.");
            setTimeout(() => {
              navigate("/login");
            }, 2000);
          }
        }
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();

    } catch (error) {
      toast.error(error.response?.data?.message || "An unexpected error occurred. Please try again.");
      setIsProcessing(false);
    }
  };

  return (
    <div className="saas-checkout-page">
      
      {/* Background FX */}
      <div className="sc-grid-lines"></div>
      <div className="sc-bg-circle sc-bg-circle-1"></div>
      <div className="sc-bg-circle sc-bg-circle-2"></div>

      {/* TOP NAVBAR */}
      <div className="sc-topbar">
        <h2 className="sc-brand">Audit365 <span className="sc-brand-highlight">HR</span></h2>
        <Link to="/" className="sc-back-link">
          <FaArrowLeft /> Back to Website
        </Link>
      </div>

      {/* MAIN CHECKOUT CONTENT */}
      <div className="sc-main-container">
        <motion.div 
          className="sc-card-wrapper"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* LEFT VISUAL PANEL - Plan Preview */}
          <div className="sc-left-panel" style={{ background: `linear-gradient(145deg, ${selectedPlan.themeColor1 || '#3b82f6'}30, #0f172a)` }}>
            <h1 className="sc-title">
              {isFreePlan ? "Start your " : "Complete your "}
              <span className="sc-highlight">{isFreePlan ? "Free Trial" : "Setup"}</span>
            </h1>
            <p className="sc-subtitle mt-3">You have selected the <strong>{selectedPlan.name}</strong> plan.</p>

            <div className="sc-plan-summary">
              <div className="sc-summary-row border-bottom">
                <span className="text-muted">Plan Name</span>
                <span className="text-white fw-bold">{selectedPlan.name}</span>
              </div>
              <div className="sc-summary-row border-bottom">
                <span className="text-muted">Duration</span>
                <span className="text-white fw-bold">{selectedPlan.durationDays === -1 ? 'Lifetime' : `${selectedPlan.durationDays} Days`}</span>
              </div>
              <div className="sc-summary-row mt-3">
                <span className="text-muted">Total Amount</span>
                <h2 className="text-white m-0 fw-bold">{isFreePlan ? "₹0 (Free)" : `₹${selectedPlan.price}`}</h2>
              </div>
            </div>

            <div className="sc-security-badge">
              <FaShieldAlt className="text-success" /> 256-bit Secure SSL Setup
            </div>
          </div>

          {/* RIGHT FORM PANEL - Registration */}
          <div className="sc-right-panel">
            <form onSubmit={handleSubmit(onSubmit)} className="sc-form">
              
              <div className="sc-form-header">
                <h3>Company Details</h3>
                <p>Create your master administrator account</p>
              </div>

              <div className="row g-3 mt-1">
                <div className="col-12">
                  <label className="sc-label"><FaBuilding className="me-2"/> Company Name</label>
                  <input type="text" className="sc-input" placeholder="e.g. Acme Corp" {...register("companyName")} />
                  <span className="sc-error">{errors.companyName?.message}</span>
                </div>

                <div className="col-md-6">
                  <label className="sc-label"><FaUser className="me-2"/> Admin Name</label>
                  <input type="text" className="sc-input" placeholder="John Doe" {...register("name")} />
                  <span className="sc-error">{errors.name?.message}</span>
                </div>

                <div className="col-md-6">
                  <label className="sc-label"><FaPhone className="me-2"/> Phone Number</label>
                  <input type="text" className="sc-input" placeholder="9876543210" {...register("phone")} />
                  <span className="sc-error">{errors.phone?.message}</span>
                </div>

                <div className="col-12">
                  <label className="sc-label"><FaEnvelope className="me-2"/> Work Email</label>
                  <input type="email" className="sc-input" placeholder="admin@company.com" {...register("email")} />
                  <span className="sc-error">{errors.email?.message}</span>
                </div>

                <div className="col-12">
                  <label className="sc-label"><FaLock className="me-2"/> Password</label>
                  <input type="password" className="sc-input" placeholder="••••••••" {...register("password")} />
                  <span className="sc-error">{errors.password?.message}</span>
                </div>
              </div>

              <div className="sc-form-footer">
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit" 
                  className="sc-submit-btn"
                  disabled={isProcessing}
                  style={{ background: selectedPlan.themeColor1 || "#3b82f6" }}
                >
                  {isProcessing ? "Processing..." : (isFreePlan ? "Register & Start Free Trial" : `Pay ₹${selectedPlan.price} via Razorpay`)}
                </motion.button>
              </div>

            </form>
          </div>
        </motion.div>
      </div>

      {/* BOTTOM FOOTER */}
      <div className="sc-footer">
        © {new Date().getFullYear()} Audit365 HRMS. All rights reserved. | Need help? Contact Support.
      </div>

    </div>
  );
};

export default SaaSCheckout;