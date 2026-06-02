import React, { useContext } from "react";
import { SettingsContext } from "../Redux/SettingsContext";
import "./Footer.css";

const Footer = () => {
  const { settings } = useContext(SettingsContext);
  const year = new Date().getFullYear();

  return (
    <footer className="compact-footer">
      <div className="footer-left">
        <span className="copyright">
          &copy; {year} <strong>{settings?.name || "HRMS PRO"}</strong>. 
          <span className="mobile-hide"> All Rights Reserved.</span>
        </span>
      </div>
      
      <div className="footer-right">
        <a href="#" className="f-link">Support</a>
        <span className="divider">•</span>
        <a href="#" className="f-link">Privacy Policy</a>
        <span className="divider">•</span>
        <span className="version">v2.4.0</span>
      </div>
    </footer>
  );
};

export default Footer;