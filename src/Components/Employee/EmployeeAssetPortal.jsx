import React, { useEffect, useState } from "react";
import DynamicLayout from "../Common/DynamicLayout";
import axios from "axios";
import { FaLaptop, FaPlus, FaClock, FaCheckCircle, FaExclamationCircle, FaKeyboard, FaTimes } from "react-icons/fa";
import Swal from "sweetalert2";
import Loader from "../Admin/Loader/Loader"; 
import "./EmployeeAssetPortal.css";

const EmployeeAssetPortal = () => {
  const [myAssets, setMyAssets] = useState([]);
  const [availableItems, setAvailableItems] = useState([]); // 🔥 Dynamic Dropdown data
  const [loading, setLoading] = useState(false);
  
  const [showModal, setShowModal] = useState(false);
  
  // 🔥 Updated Form State
  const [requestData, setRequestData] = useState({ 
    selection: "", 
    isCustom: false, 
    requestedAssetName: "", 
    requestedAssetType: "Unique", 
    requestedCategory: "Hardware", 
    notes: "" 
  });

  const token = JSON.parse(localStorage.getItem("user"))?.token;
  const axiosInstance = axios.create({ baseURL: import.meta.env.VITE_API_URL });
  
  axiosInstance.interceptors.request.use((config) => {
    if (token) config.headers.Authorization = `Bearer ${token}`; return config;
  });

  useEffect(() => {
    fetchMyAssets();
    fetchAvailableItems();
  }, []);

  const fetchMyAssets = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get("/api/assets/my-assets");
      setMyAssets(res.data?.data || []);
    } catch (err) { } 
    finally { setLoading(false); }
  };

  // 🔥 Fetch dynamic items for dropdown
  const fetchAvailableItems = async () => {
    try {
      const res = await axiosInstance.get("/api/assets/available-names");
      setAvailableItems(res.data?.data || []);
    } catch (err) { console.error(err); }
  };

  const handleDropdownChange = (e) => {
    const val = e.target.value;
    if (val === "Custom") {
      setRequestData({ ...requestData, selection: val, isCustom: true, requestedAssetName: "", requestedAssetType: "Unique", requestedCategory: "Other" });
    } else {
      const selectedObj = availableItems.find(a => a.assetName === val);
      if (selectedObj) {
        setRequestData({
          ...requestData,
          selection: val,
          isCustom: false,
          requestedAssetName: selectedObj.assetName,
          requestedAssetType: selectedObj.assetType,
          requestedCategory: selectedObj.category
        });
      } else {
        setRequestData({ ...requestData, selection: "", isCustom: false, requestedAssetName: "" });
      }
    }
  };

  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    if (!requestData.requestedAssetName) return Swal.fire("Required", "Please provide an Asset Name", "warning");

    try {
      await axiosInstance.post("/api/assets/request", requestData);
      setShowModal(false);
      setRequestData({ selection: "", isCustom: false, requestedAssetName: "", requestedAssetType: "Unique", requestedCategory: "Hardware", notes: "" });
      Swal.fire("Requested!", "Your asset request has been sent to the IT Department.", "success");
      fetchMyAssets();
    } catch (err) {
      Swal.fire("Error", "Failed to submit request", "error");
    }
  };

  const getBadgeClass = (status) => {
    if (status === "Assigned") return "eap-badge-success";
    if (status === "Requested") return "eap-badge-warning";
    if (status === "Returned") return "eap-badge-secondary";
    return "eap-badge-info";
  };

  const getStatusIcon = (status) => {
    if (status === "Assigned") return <FaCheckCircle />;
    if (status === "Requested") return <FaClock />;
    return null;
  };

  return (
    <DynamicLayout>
      <div className="eap-wrapper">
        <div className="eap-header-container">
          <div>
            <h4 className="eap-title">
              <FaLaptop className="eap-icon-primary" /> My Assets
            </h4>
            <p className="eap-subtitle">Manage your company-provided devices and software</p>
          </div>
          <button className="eap-btn eap-btn-primary" onClick={() => setShowModal(true)}>
            <FaPlus /> Request New Asset
          </button>
        </div>

        {loading ? (
          <div className="eap-loader"><Loader /></div>
        ) : myAssets.length === 0 ? (
          <div className="eap-empty-state">
            <FaExclamationCircle className="eap-empty-icon" />
            <h5>No Assets Found</h5>
            <p>You do not have any active assets or pending requests.</p>
          </div>
        ) : (
          <div className="eap-grid">
            {myAssets.map((item) => (
              <div className="eap-card" key={item._id}>
                <div className="eap-card-body">
                  <div className="eap-card-top">
                    <div className="eap-asset-icon">
                      {item.assetId?.category === "Software" ? <FaLaptop /> : <FaKeyboard />}
                    </div>
                    <span className={`eap-badge ${getBadgeClass(item.status)}`}>
                      {getStatusIcon(item.status)} {item.status === "Requested" ? "Pending Approval" : item.status}
                    </span>
                  </div>
                  
                  <h5 className="eap-asset-name">
                    {item.assetId ? item.assetId.assetName : item.requestedAssetName}
                  </h5>
                  
                  <div className="eap-asset-details">
                    {item.assetId ? (
                      <>
                        <span className="eap-label">Details:</span> 
                        <strong>
                          {item.assetId.assetType === "Unique" ? `SN: ${item.assetId.serialNumber}` : "Bulk Item Assigned"}
                        </strong>
                      </>
                    ) : (
                      <span className="eap-italic">Waiting for IT assignment</span>
                    )}
                  </div>

                  <hr className="eap-divider" />

                  <div className="eap-card-footer">
                    <span><strong>Date:</strong> {new Date(item.issueDate).toLocaleDateString()}</span>
                    {item.status === "Assigned" && (
                      <span><strong>Condition:</strong> <span className="eap-text-success">{item.conditionOnIssue}</span></span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ASSET REQUEST MODAL */}
      {showModal && (
        <div className="eap-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="eap-modal" onClick={(e) => e.stopPropagation()}>
            <div className="eap-modal-header">
              <h4>Request IT Asset</h4>
              <button className="eap-close-btn" onClick={() => setShowModal(false)}>
                <FaTimes />
              </button>
            </div>
            <form onSubmit={handleRequestSubmit}>
              <div className="eap-modal-body">
                
                {/* 🔥 DYNAMIC DROPDOWN */}
                <div className="eap-form-group">
                  <label className="eap-form-label">Select Needed Asset</label>
                  <select 
                    className="eap-form-control" 
                    value={requestData.selection} 
                    onChange={handleDropdownChange}
                    required
                  >
                    <option value="">-- Choose Asset from Inventory --</option>
                    {availableItems.map(item => (
                      <option key={item.assetName} value={item.assetName}>
                        {item.assetName} ({item.category})
                      </option>
                    ))}
                    <option value="Custom" className="fw-bold text-primary">➕ Other / Custom Item</option>
                  </select>
                </div>

                {/* 🔥 CUSTOM ITEM INPUT (Visible only if Custom selected) */}
                {requestData.isCustom && (
                  <div className="eap-form-group" style={{background: "#f8fafc", padding: "15px", borderRadius: "8px"}}>
                    <label className="eap-form-label text-primary">Specify Item Name</label>
                    <input 
                      type="text" 
                      className="eap-form-control" 
                      placeholder="e.g. Ergonomic Office Chair"
                      value={requestData.requestedAssetName}
                      onChange={(e) => setRequestData({...requestData, requestedAssetName: e.target.value})}
                      required
                    />
                    <label className="eap-form-label mt-3">Item Category</label>
                    <select 
                      className="eap-form-control" 
                      value={requestData.requestedCategory} 
                      onChange={(e) => setRequestData({...requestData, requestedCategory: e.target.value})}
                    >
                      <option value="Hardware">Hardware</option>
                      <option value="Software">Software</option>
                      <option value="Consumable">Consumable / Merch</option>
                      <option value="Access">Access / ID</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                )}
                
                <div className="eap-form-group mt-3">
                  <label className="eap-form-label">Request Reason / Details</label>
                  <textarea 
                    className="eap-form-control" 
                    rows={3} 
                    placeholder="Why do you need this? e.g., My current mouse is broken."
                    value={requestData.notes}
                    onChange={(e) => setRequestData({ ...requestData, notes: e.target.value })}
                  ></textarea>
                </div>
              </div>
              <div className="eap-modal-footer">
                <button type="button" className="eap-btn eap-btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="eap-btn eap-btn-primary">Submit Request</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DynamicLayout>
  );
};

export default EmployeeAssetPortal;