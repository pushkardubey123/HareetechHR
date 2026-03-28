import React from 'react';
import Banner from './Banner';
import Features from './Feature';
import HomeNavbar from '../Common/Navbar';
import LoginSection from '../Common/Login';
import PublicPricing from './PublicPricing';
import { FaWhatsapp } from 'react-icons/fa'; // WhatsApp Icon

const Home = () => {
  
  // WhatsApp Link Generation
  const phoneNumber = "916394181905"; // Your Number
  const message = encodeURIComponent("Hi, I want to know more about Audit365 HRMS software.");
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;

  return (
    <>
      {/* GLOBAL STYLE TO HIDE SCROLLBAR */}
      <style>
        {`
          ::-webkit-scrollbar { width: 0px; height: 0px; display: none; background: transparent; }
          * { -ms-overflow-style: none; scrollbar-width: none; }
          html, body { overflow-x: hidden; width: 100%; background-color: #020617; }
          ::placeholder { color: #6b7280 !important; opacity: 1; }
          
          /* WhatsApp Floating Button Animation */
          @keyframes pulse-whatsapp {
            0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(37, 211, 102, 0.7); }
            70% { transform: scale(1.05); box-shadow: 0 0 0 15px rgba(37, 211, 102, 0); }
            100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(37, 211, 102, 0); }
          }
          .whatsapp-float {
            position: fixed;
            bottom: 30px;
            left: 30px; /* Left me fixed */
            background-color: #25D366;
            color: #FFF;
            border-radius: 50%;
            width: 60px;
            height: 60px;
            display: flex;
            justify-content: center;
            align-items: center;
            font-size: 32px;
            box-shadow: 2px 2px 10px rgba(0,0,0,0.3);
            z-index: 1000;
            animation: pulse-whatsapp 2s infinite;
            transition: all 0.3s ease;
          }
          .whatsapp-float:hover {
            background-color: #128C7E;
            transform: scale(1.1) !important;
            color: white;
          }
          /* Hover Text Tooltip */
          .whatsapp-float::after {
            content: "Chat with us";
            position: absolute;
            left: 70px;
            background: #fff;
            color: #000;
            padding: 5px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
            opacity: 0;
            pointer-events: none;
            transition: 0.3s;
            white-space: nowrap;
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
          }
          .whatsapp-float:hover::after {
            opacity: 1;
            left: 75px;
          }
        `}
      </style>

      {/* Main Wrapper */}
      <div className="min-h-screen w-full overflow-x-hidden bg-[#020617] position-relative">
         <HomeNavbar/>
         <Banner/>
         <Features/>
         <PublicPricing/>
         
         <LoginSection/>
         {/* <Footer/> */}

         {/* 🔥 WHATSAPP FLOATING BUTTON 🔥 */}
         <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="whatsapp-float">
           <FaWhatsapp />
         </a>
      </div>
    </>
  )
}

export default Home;