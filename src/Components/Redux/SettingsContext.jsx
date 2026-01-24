import { createContext, useEffect, useState } from "react";
import axios from "axios";

export const SettingsContext = createContext();

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState({});
  const token = JSON.parse(localStorage.getItem("user"))?.token;
  const loadSettings = async () => {
    const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/settings`,{
          headers: { Authorization: `Bearer ${token}` },
        },);
    setSettings(res.data.data || {});
  };

  useEffect(() => {
    loadSettings();
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, loadSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};
