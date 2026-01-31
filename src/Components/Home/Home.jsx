import React, { useEffect } from 'react'
import Banner from './Banner'
import Features from './Feature';
import HomeNavbar from '../Common/Navbar';
import LoginSection from '../Common/Login';
// import Footer from './Footer' 

const Home = () => {
  useEffect(() => {
    fetch("https://hr-backend-m6c4.onrender.com");
  }, []);

  return (
    <>
      {/* GLOBAL STYLE TO HIDE SCROLLBAR EVERYWHERE */}
      <style>
        {`
          /* Chrome, Safari, Opera */
          ::-webkit-scrollbar {
            width: 0px;
            height: 0px;
            display: none;
            background: transparent; 
          }
          
          /* Firefox, IE, Edge */
          * {
            -ms-overflow-style: none;  /* IE and Edge */
            scrollbar-width: none;  /* Firefox */
          }

          /* Body specific fix */
          html, body {
            overflow-x: hidden; /* Side scrolling band */
            width: 100%;
            background-color: #020617; /* Dark background taaki white line na dikhe */
          }
        `}
      </style>

      {/* Main Wrapper */}
      <div className="min-h-screen w-full overflow-x-hidden bg-[#020617]">
         <HomeNavbar/>
         <Banner/>
         <Features/>
         <LoginSection/>
         {/* <Footer/> */}
      </div>
    </>
  )
}

export default Home;