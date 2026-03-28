import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { FiCheckCircle, FiLogOut, FiStar } from "react-icons/fi";
import { motion } from "framer-motion";
import AdminLayout from "../Admin/AdminLayout"; // 🔥 Aapka Admin Layout Import
import "./Subscription.css";

const Subscription = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const navigate = useNavigate();

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/superadmin/public/plans`);
        if (res.data.success) {
          const availablePlans = res.data.data.filter(plan => plan.status === 'active' && !plan.isTrial);
          setPlans(availablePlans);
        }
      } catch (error) {
        console.error("Error fetching plans", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPlans();
  }, []);

  const handleSubscribe = async (plan) => {
    setProcessingId(plan._id);
    
    const res = await loadRazorpayScript();
    if (!res) {
      Swal.fire("Error", "Razorpay SDK failed to load. Are you online?", "error");
      setProcessingId(null);
      return;
    }

    try {
      const token = localStorage.getItem("token") || JSON.parse(localStorage.getItem("user"))?.token;
      const headers = { Authorization: `Bearer ${token}` };

      const orderResponse = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/payment/create-order`,
        { planId: plan._id },
        { headers }
      );

      if (!orderResponse.data.success) {
        Swal.fire("Error", "Failed to create order", "error");
        setProcessingId(null);
        return;
      }

      const { order } = orderResponse.data;

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: "Audit365 HRMS",
        description: `Upgrade to ${plan.name} Plan`,
        order_id: order.id,
        handler: async function (response) {
          try {
            const verifyRes = await axios.post(
              `${import.meta.env.VITE_API_URL}/api/payment/verify`,
              {
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
                planId: plan._id
              },
              { headers }
            );

            if (verifyRes.data.success) {
              Swal.fire({
                icon: "success",
                title: "Payment Successful!",
                text: "Your subscription has been upgraded. Please login again.",
                confirmButtonColor: "#10b981"
              }).then(() => {
                localStorage.clear();
                navigate("/login"); 
              });
            }
          } catch (err) {
            Swal.fire("Error", "Payment verification failed. Contact support.", "error");
          }
        },
        prefill: {
          name: JSON.parse(localStorage.getItem("user"))?.name || "HR Admin",
          email: JSON.parse(localStorage.getItem("user"))?.email || "",
        },
        theme: {
          color: plan.themeColor1 || "#4f46e5", // Match razorpay theme to plan theme
        },
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();

      paymentObject.on('payment.failed', function (response){
        Swal.fire("Payment Failed", response.error.description, "error");
      });

    } catch (error) {
      console.error(error);
      Swal.fire("Error", "Something went wrong with the payment system.", "error");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <AdminLayout> {/* 🔥 Wrapped in AdminLayout */}
      <div className="subscription-wrapper py-4 px-2 px-md-4 rounded-4 shadow-sm my-3 mx-2" style={{minHeight: "85vh"}}>
        <div className="max-w-7xl mx-auto text-center mb-5 mt-2">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="fw-bold text-heading mb-2 display-6"
          >
            Upgrade Your Plan
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-subheading max-w-2xl mx-auto"
          >
            Scale your workforce effortlessly. Select a plan tailored for your team.
          </motion.p>
        </div>

        <div className="container-fluid max-w-7xl mx-auto">
          {loading ? (
            <div className="d-flex justify-content-center py-5">
              <div className="spinner-border text-primary" style={{ width: '3rem', height: '3rem' }}></div>
            </div>
          ) : (
            <div className="row justify-content-center g-4">
              {plans.map((plan, index) => (
                <PricingCard 
                  key={plan._id} 
                  plan={plan} 
                  index={index} 
                  onSubscribe={() => handleSubscribe(plan)}
                  isProcessing={processingId === plan._id}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

// Pricing Card Component
function PricingCard({ plan, index, onSubscribe, isProcessing }) {
  
  // 🔥 Fetch custom colors from database
  const color1 = plan.themeColor1 || "#4f46e5";
  const color2 = plan.themeColor2 || "#7c3aed";
  const background = `linear-gradient(135deg, ${color1}, ${color2})`;

  const cardVariants = {
    offscreen: { y: 60, opacity: 0, scale: 0.95 },
    onscreen: {
      y: 0, opacity: 1, scale: 1,
      transition: { type: "spring", bounce: 0.4, duration: 0.8, delay: index * 0.15 },
    },
  };

  return (
    <div className="col-xl-4 col-lg-5 col-md-6 d-flex">
      <motion.div
        initial="offscreen"
        whileInView="onscreen"
        viewport={{ once: true, amount: 0.1 }}
        variants={cardVariants}
        className="glass-card w-100 position-relative d-flex flex-column"
        style={plan.badgeText ? { border: `2px solid ${color1}` } : { border: '1px solid rgba(150,150,150, 0.2)' }}
      >
        {/* 🔥 Custom Badge */}
        {plan.badgeText && (
          <div 
            className="position-absolute top-0 end-0 text-white px-3 py-1 rounded-bottom-start fw-bold z-3 shadow-sm" 
            style={{ fontSize: '12px', background: color1 }}
          >
            <FiStar className="me-1 mb-1 inline" /> {plan.badgeText}
          </div>
        )}

        <div className="card-splash" style={{ background }}>
          <h3 className="text-white fw-bold mb-0 z-1">{plan.name}</h3>
          <svg viewBox="0 0 400 150" preserveAspectRatio="none">
            <path d="M0,50 C150,150 250,0 400,50 L400,150 L0,150 Z" fill="currentColor" />
          </svg>
        </div>

        <div className="p-4 d-flex flex-column flex-grow-1 text-heading bg-transparent">
          {/* 🔥 Target Audience */}
          <p className="text-subheading mb-4 small fw-medium" style={{ minHeight: "40px" }}>
            {plan.targetAudience || plan.description || "Everything you need to grow your workforce."}
          </p>
          
          <div className="mb-4">
            <div className="d-flex align-items-baseline gap-2">
              <h2 className="display-6 fw-extrabold mb-0">₹{plan.price}</h2>
              
              {/* 🔥 Original Price Strikethrough */}
              {plan.originalPrice > plan.price && (
                <span className="text-muted text-decoration-line-through fs-6">₹{plan.originalPrice}</span>
              )}
            </div>
            <p className="text-subheading small mt-1 fw-bold">
              {plan.durationDays === -1 ? "Lifetime Access" : `Billed for ${plan.durationDays} Days`}
            </p>
          </div>

          <div className="mb-4 flex-grow-1">
            <h6 className="fw-bold mb-3 text-heading">Plan Includes:</h6>
            <ul className="list-unstyled mb-0">
              <li className="mb-2 text-subheading d-flex align-items-start small">
                <FiCheckCircle className="me-2 mt-1 flex-shrink-0" style={{ color: color1 }}/> 
                <span><strong>{plan.limits?.maxEmployees === -1 ? 'Unlimited' : plan.limits?.maxEmployees}</strong> Employees</span>
              </li>
              <li className="mb-2 text-subheading d-flex align-items-start small">
                <FiCheckCircle className="me-2 mt-1 flex-shrink-0" style={{ color: color1 }}/> 
                <span><strong>{plan.limits?.maxStorageMB === -1 ? 'Unlimited' : `${plan.limits?.maxStorageMB}MB`}</strong> Storage</span>
              </li>
              <li className="mb-2 text-subheading d-flex align-items-start small">
                <FiCheckCircle className="me-2 mt-1 flex-shrink-0" style={{ color: color1 }}/> 
                <span><strong>{plan.limits?.maxBranches === -1 ? 'Unlimited' : plan.limits?.maxBranches}</strong> Branches</span>
              </li>
              
              {plan.allowedModules?.slice(0, 5).map((mod, i) => (
                <li key={i} className="mb-2 text-subheading d-flex align-items-start small">
                  <FiCheckCircle className="me-2 mt-1 flex-shrink-0" style={{ color: color1 }}/> 
                  <span>{mod}</span>
                </li>
              ))}
              {plan.allowedModules?.length > 5 && (
                <li className="mb-2 fw-bold small mt-3" style={{ color: color1 }}>
                  + {plan.allowedModules.length - 5} more modules
                </li>
              )}
            </ul>
          </div>

          <button 
            className="btn w-100 py-2 fw-bold rounded-pill mt-auto shadow-sm text-white border-0"
            onClick={onSubscribe}
            disabled={isProcessing}
            style={{ 
              background: plan.badgeText ? color1 : `linear-gradient(135deg, ${color1}, ${color2})`, 
              transition: "transform 0.2s ease, box-shadow 0.2s ease" 
            }}
            onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 10px 20px rgba(0,0,0,0.1)'; }}
            onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
          >
            {isProcessing ? (
              <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
            ) : (
              plan.buttonText || "Subscribe Now"
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default Subscription;