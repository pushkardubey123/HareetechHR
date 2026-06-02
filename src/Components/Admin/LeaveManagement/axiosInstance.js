import axios from "axios";

const axiosInstance = axios.create({
  baseURL: "http://localhost:3003/api", // Your Backend Port
});

// Attach Token to every request
axiosInstance.interceptors.request.use(
  (config) => {
    const token = JSON.parse(localStorage.getItem("user"))?.token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default axiosInstance;