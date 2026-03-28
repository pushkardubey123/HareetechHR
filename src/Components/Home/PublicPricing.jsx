import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FiCheckCircle, FiStar } from "react-icons/fi";
import { motion } from "framer-motion";
import "./PublicPricing.css";

const PublicPricing = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const navigate = useNavigate();

  // Load Plans from API
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/superadmin/public/plans`);
        if (res.data.success) {
          // 🔥 Trial aur Paid dono plans dikhenge
          const availablePlans = res.data.data.filter(plan => plan.status === 'active');
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


  const handleSubscribeClick = (plan) => {
    // Yeh user ko checkout page par bhej dega
    navigate("/checkout", { state: { plan } });
  };

  return (
    <div className="public-pricing-wrapper" id="pricing-section">
      

      <div className="pp-container">
        
        <div className="pp-character-top-section">
          <div className="pointing-character-box-small">
            <img 
              src="https://img.freepik.com/free-psd/3d-illustration-business-man-with-glasses_23-2149436194.jpg" 
              alt="Pointer" 
              className="char-img-small" 
            />
            
            {/* Continuous Pointing Hand Animation (Neeche ki taraf 👇) */}
            <motion.div 
              className="pointing-hand-down"
              animate={{ y: [0, 15, 0], scale: [1, 1.05, 1] }}
              transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
            >
              👇
            </motion.div>
          </div>
        </div>

        {/* Text Header (Sticker ke neeche) */}
        <div className="text-center mb-5 mt-3">
          <motion.h2 
            initial={{ opacity: 0, y: -10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="pp-main-title-compact"
          >
            Simple pricing, <span className="text-gradient">powerful features.</span>
          </motion.h2>
          <p className="pp-subtitle-compact">Choose the perfect plan for your company. No hidden fees.</p>
        </div>

        {/* --- BOTTOM: Horizontal Plans Scroller --- */}
        <div className="pp-horizontal-scroll-container">
          {loading ? (
            <div className="text-center py-5 w-100"><div className="spinner-border text-primary"></div></div>
          ) : (
            plans.map((plan, index) => {
              const color1 = plan.themeColor1 || "#3b82f6";
              const color2 = plan.themeColor2 || "#8b5cf6";
              
              // Popular if it has a badge or it's the 2nd item
              const isPopular = plan.badgeText || index === 1;

              return (
                <motion.div 
                  key={plan._id}
                  initial={{ opacity: 0, x: 50 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.1 }}
                  transition={{ delay: index * 0.1 }}
                  className="pp-horizontal-item"
                >
                  <div className={`pp-card-compact ${isPopular ? 'popular-card' : ''}`} style={isPopular ? { borderColor: color1 } : {}}>
                    
                    {plan.badgeText && (
                      <div className="pp-badge-compact" style={{ background: color1 }}>
                        <FiStar className="me-1" /> {plan.badgeText}
                      </div>
                    )}

                    <div className="pp-card-header-compact" style={{ background: `linear-gradient(135deg, ${color1}15, ${color2}05)` }}>
                      <h4 className="text-white fw-bold mb-1">{plan.name}</h4>
                      <p className="text-muted small mb-3" style={{ minHeight: "35px", fontSize: '0.8rem' }}>{plan.targetAudience || plan.description}</p>
                      
                      <div className="d-flex align-items-baseline gap-2 mb-1">
                        <h2 className="fw-bold mb-0 text-white" style={{fontSize: '2.2rem'}}>₹{plan.price}</h2>
                        {plan.originalPrice > plan.price && (
                          <span className="text-muted text-decoration-line-through small">₹{plan.originalPrice}</span>
                        )}
                      </div>
                      <p className="text-muted fw-bold" style={{fontSize: '0.75rem'}}>/ {plan.durationDays === -1 ? 'Lifetime' : `${plan.durationDays} Days`}</p>
                    </div>

                    <div className="pp-card-body-compact">
                      <ul className="pp-features-list-compact">
                        <li><FiCheckCircle className="text-success me-2"/> <strong>{plan.limits?.maxEmployees === -1 ? 'Unlimited' : plan.limits?.maxEmployees}</strong> Emps</li>
                        <li><FiCheckCircle className="text-success me-2"/> <strong>{plan.limits?.maxStorageMB === -1 ? 'Unlimited' : `${plan.limits?.maxStorageMB}MB`}</strong> Storage</li>
                        
                        {plan.allowedModules?.slice(0, 3).map((mod, i) => (
                          <li key={i}><FiCheckCircle className="text-success me-2"/> {mod}</li>
                        ))}
                      </ul>
                      
                      <button 
                        className="btn w-100 py-2 mt-auto fw-bold rounded-pill text-white pp-subscribe-btn-compact"
                        style={{ background: `linear-gradient(135deg, ${color1}, ${color2})`, fontSize: '0.85rem' }}
                        onClick={() => handleSubscribeClick(plan)}
                      >
                        {plan.isTrial ? "Start Free Trial" : (plan.buttonText || "Subscribe Now")}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )
            })
          )}
        </div>

      </div>
    </div>
  );
};

export default PublicPricing;