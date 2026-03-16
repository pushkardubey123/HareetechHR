import { createContext, useEffect, useState } from "react";
import axios from "axios";

export const SettingsContext = createContext();

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // Added loading state

  const API = import.meta.env.VITE_API_URL;

  // 🔹 Get Auth Header
  const getAuthConfig = (token) => ({
    headers: { Authorization: `Bearer ${token}` },
  });

  // 🔹 Initialize App (Runs on Refresh)
  const initApp = async () => {
    try {
      const storedUser = JSON.parse(localStorage.getItem("user"));
      
      if (!storedUser?.token) {
        setLoading(false);
        return;
      }

      // Optimistically set user first
      setUser(storedUser);

      // Verify Token & Fetch fresh Profile
      const [settingsRes, profileRes] = await Promise.all([
        axios.get(`${API}/api/settings`, getAuthConfig(storedUser.token)).catch(err => null),
        axios.get(`${API}/user/profile`, getAuthConfig(storedUser.token)).catch(err => null),
      ]);

      // Update Settings
      if (settingsRes?.data?.success) {
        setSettings(settingsRes.data.data);
      }

      // 🔥 IMPORTANT: If profile fetch fails (token expired), logout immediately
// SettingsContext.js inside initApp function
if (profileRes?.data?.success) {
  const freshUser = {
    ...profileRes.data.data, // Isme designationId backend se aayega
    token: storedUser.token, 
    id: profileRes.data.data._id || profileRes.data.data.id // ID normalize karein
  };
  setUser(freshUser);
  localStorage.setItem("user", JSON.stringify(freshUser));
} else {
        // If profile API fails, token might be invalid
        logout();
      }

    } catch (error) {
      console.error("App Initialization Error:", error);
      logout(); 
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Login Function (Critical Fix)
  const loginUser = (userData) => {
    if (!userData?.token) return;

    // 🔥 Fix: Wipe everything first
    localStorage.removeItem("user");
    setUser(null);
    setSettings(null);
    
    // Set New Data
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
  };

  // 🔹 Update Profile After Edit
  const updateUserData = (newData) => {
    setUser((prev) => {
      if (!prev) return null;

      const updatedUser = {
        ...newData,
        token: prev.token, // token preserve
      };

      localStorage.setItem("user", JSON.stringify(updatedUser));
      return updatedUser;
    });
  };

  // 🔹 Logout
  const logout = () => {
    setUser(null);
    setSettings(null);
    localStorage.removeItem("user");
  };

  useEffect(() => {
    initApp();
  }, []);

  return (
    <SettingsContext.Provider
      value={{
        settings,
        user,
        loading, // Expose loading state
        loginUser,
        updateUserData,
        loadSettings: initApp,
        logout,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};