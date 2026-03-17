import React, { useEffect, useState } from "react";
import DynamicLayout from "../Common/DynamicLayout";
import axios from "axios";
import { FaLaptop, FaPlus, FaCheck, FaUndo, FaUserTie, FaBoxOpen, FaCog, FaTrash, FaExclamationTriangle, FaEdit, FaTimes, FaShieldAlt } from "react-icons/fa";
import Swal from "sweetalert2";
import Loader from "./Loader/Loader"; 
import "./AdminAssetManagement.css";

const AdminAssetManagement = () => {
  const [activeTab, setActiveTab] = useState("assignments");
  const [assets, setAssets] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(false);

  // --- PERMISSION STATES ---
  const user = JSON.parse(localStorage.getItem("user"));
  const token = user?.token;
  const currentUserId = user?._id || user?.id || user?.user?._id; 
  const isAdmin = user?.role === "admin" || user?.user?.role === "admin";

  const [permissions, setPermissions] = useState({
    view: isAdmin,
    create: isAdmin,
    edit: isAdmin,
    delete: isAdmin
  });
  const [accessDenied, setAccessDenied] = useState(false);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  
  const [selectedRequest, setSelectedRequest] = useState(null);

  // Forms
  const [newAsset, setNewAsset] = useState({ assetName: "", category: "Hardware", assetType: "Unique", quantity: 1, serialNumber: "" });
  const [editAssetData, setEditAssetData] = useState({ _id: "", assetName: "", quantity: 1, status: "", category: "", assetType: "", serialNumber: "" });
  const [assignData, setAssignData] = useState({ assetId: "", conditionOnIssue: "Good", notes: "" });
  const [returnData, setReturnData] = useState({ conditionOnReturn: "Good", returnNotes: "" });
  const [newRule, setNewRule] = useState({ assetName: "", assetType: "Unique" });

  const axiosInstance = axios.create({ baseURL: import.meta.env.VITE_API_URL });
  axiosInstance.interceptors.request.use((config) => {
    if (token) config.headers.Authorization = `Bearer ${token}`; return config;
  });

  // --- FETCH PERMISSIONS ---
  useEffect(() => {
    if (isAdmin) return; // Admin bypass
    
    const fetchPermissions = async () => {
      try {
        const res = await axiosInstance.get(`/api/permission/${currentUserId}`);
        if (res.data?.success) {
          const assetPerm = res.data.data.find(p => p.module === "asset_management");
          if (assetPerm && assetPerm.permissions) {
            setPermissions(assetPerm.permissions);
            if (!assetPerm.permissions.view) setAccessDenied(true);
          } else {
            setAccessDenied(true); // Permission entry not found
          }
        }
      } catch (err) {
        setAccessDenied(true);
      }
    };
    if (currentUserId) fetchPermissions();
  }, [currentUserId, isAdmin]);

  // Fetch Data Effects
  useEffect(() => {
    if (accessDenied) return;
    if (activeTab === "inventory") fetchAssets();
    else if (activeTab === "assignments") fetchAssignments();
    else if (activeTab === "settings") { fetchRules(); fetchAssets(); }
  }, [activeTab, accessDenied]);

  const fetchAssets = async () => {
    setLoading(true);
    try { const res = await axiosInstance.get("/api/assets/inventory");
      console.log(res)
    setAssets(res.data?.data || []); } 
    catch { } finally { setLoading(false); }
  };

  const fetchAssignments = async () => {
    setLoading(true);
    try { const res = await axiosInstance.get("/api/assets/assignments"); setAssignments(res.data?.data || []); } 
    catch { } finally { setLoading(false); }
  };

  const fetchRules = async () => {
    setLoading(true);
    try { const res = await axiosInstance.get("/api/assets/rules"); setRules(res.data?.data || []); } 
    catch { } finally { setLoading(false); }
  };

  const handleAddRule = async (e) => {
    e.preventDefault();
    if(!newRule.assetName) return Swal.fire("Warning", "Please select an asset from inventory", "warning");
    try {
      await axiosInstance.post("/api/assets/rules", newRule);
      setNewRule({ assetName: "", assetType: "Unique" });
      fetchRules();
      Swal.fire("Added", "Auto-assign rule created", "success");
    } catch { Swal.fire("Error", "Failed to add rule", "error"); }
  };

  const handleDeleteRule = async (id) => {
    try { await axiosInstance.delete(`/api/assets/rules/${id}`); fetchRules(); } catch { }
  };

  const handleAddAsset = async () => {
    try {
      await axiosInstance.post("/api/assets/inventory", newAsset);
      setShowAddModal(false);
      fetchAssets();
      Swal.fire("Added!", "Asset added to inventory", "success");
    } catch (err) { Swal.fire("Error", err.response?.data?.message, "error"); }
  };

  const handleUpdateAsset = async () => {
    try {
      await axiosInstance.put(`/api/assets/inventory/${editAssetData._id}`, editAssetData);
      setShowEditModal(false);
      fetchAssets();
      Swal.fire("Updated!", "Asset details updated", "success");
    } catch (err) { Swal.fire("Error", err.response?.data?.message, "error"); }
  };

  const handleDeleteAsset = async (id) => {
    const confirm = await Swal.fire({
      title: "Delete this item?",
      text: "It will be removed from your inventory permanently.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!"
    });
    if (confirm.isConfirmed) {
      try { await axiosInstance.delete(`/api/assets/inventory/${id}`); fetchAssets(); Swal.fire("Deleted!", "Item removed.", "success"); } 
      catch (err) { Swal.fire("Error", "Failed to delete item", "error"); }
    }
  };

  const handleAssignAsset = async () => {
    if (!assignData.assetId) return Swal.fire("Warning", "Please select an asset to assign.", "warning");
    try {
      await axiosInstance.post("/api/assets/assign", { assignmentId: selectedRequest._id, ...assignData });
      setShowAssignModal(false);
      Swal.fire("Approved!", "Asset successfully assigned", "success");
      fetchAssignments();
      fetchAssets(); 
    } catch (err) { Swal.fire("Error", err.response?.data?.message, "error"); }
  };

  const handleReturnAsset = async () => {
    try {
      await axiosInstance.post("/api/assets/return", { assignmentId: selectedRequest._id, ...returnData });
      setShowReturnModal(false);
      setReturnData({ conditionOnReturn: "Good", returnNotes: "" });
      Swal.fire("Returned!", "Asset returned successfully", "success");
      fetchAssignments();
      fetchAssets(); 
    } catch (err) { Swal.fire("Error", err.response?.data?.message || "Failed to return", "error"); }
  };

  const exactMatchingAssets = assets.filter(a => 
    a.assetName === selectedRequest?.requestedAssetName && 
    ((a.assetType === "Unique" && a.status === "Available") || (a.assetType === "Bulk" && a.quantity > 0))
  );
  const isOutOfStock = exactMatchingAssets.length === 0;
  const isBulkRequest = selectedRequest?.requestedAssetType === "Bulk";

  useEffect(() => {
    if (showAssignModal && isBulkRequest && !isOutOfStock) {
      setAssignData(prev => ({ ...prev, assetId: exactMatchingAssets[0]._id }));
    }
  }, [showAssignModal, isBulkRequest, isOutOfStock]);

  const uniqueInventoryItems = Array.from(new Set(assets.map(a => a.assetName)))
    .map(name => assets.find(a => a.assetName === name));

  const getBadgeClass = (type, status) => {
    const s = status?.toLowerCase();
    if (s === 'available' || s === 'success' || s === 'cleared') return 'am-badge-success';
    if (s === 'requested' || s === 'warning' || s === 'under maintenance') return 'am-badge-warning';
    if (s === 'out of stock' || s === 'danger' || s === 'rejected') return 'am-badge-danger';
    if (s === 'assigned') return 'am-badge-primary';
    if (type === 'Unique') return 'am-badge-info';
    if (type === 'Bulk') return 'am-badge-secondary';
    return 'am-badge-secondary';
  };

  // --- ACCESS DENIED SCREEN ---
  if (accessDenied) {
    return (
      <DynamicLayout>
        <div className="am-wrapper" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div className="am-alert am-alert-warning" style={{ textAlign: 'center', padding: '3rem', borderRadius: '12px' }}>
            <FaShieldAlt size={50} style={{ marginBottom: '1rem', color: 'var(--am-warning)' }} />
            <h3>Access Denied</h3>
            <p className="am-text-muted">You do not have permission to view or manage Assets.</p>
          </div>
        </div>
      </DynamicLayout>
    );
  }

  return (
    <DynamicLayout>
      <div className="am-wrapper">
        <div className="am-card">
          <div className="am-header">
            <h4 className="am-title"><FaLaptop className="am-icon-primary" /> Asset Management</h4>
            
            {/* ADD ASSET PERMISSION CHECK */}
            {activeTab === "inventory" && permissions.create && (
              <button className="am-btn am-btn-primary" onClick={() => { setNewAsset({ assetName: "", category: "Hardware", assetType: "Unique", quantity: 1, serialNumber: "" }); setShowAddModal(true); }}>
                <FaPlus /> Add New Asset
              </button>
            )}
          </div>

          <div className="am-tabs">
            <button className={`am-tab ${activeTab === "assignments" ? "active" : ""}`} onClick={() => setActiveTab("assignments")}>
              <FaUserTie /> Requests / Tickets
            </button>
            <button className={`am-tab ${activeTab === "inventory" ? "active" : ""}`} onClick={() => setActiveTab("inventory")}>
              <FaBoxOpen /> IT Inventory
            </button>
            <button className={`am-tab ${activeTab === "settings" ? "active" : ""}`} onClick={() => setActiveTab("settings")}>
              <FaCog /> Onboarding Rules
            </button>
          </div>

          {loading ? <div className="am-loader-container"><Loader /></div> : (
            <div className="am-content-area">
              {/* ASSIGNMENTS TAB */}
              {activeTab === "assignments" && (
                <div className="am-table-responsive">
                  <table className="am-table">
                     <thead><tr><th>Employee</th><th>Requested Item</th><th>Date</th><th>Status</th><th>Action</th></tr></thead>
                     <tbody>
                       {assignments.map((req) => (
                         <tr key={req._id}>
                           <td><strong>{req.employeeId?.name}</strong></td>
                           <td>
                             {req.assetId ? (
                               <div><span className="am-text-success"><strong>{req.assetId.assetName}</strong></span><br/><small>{req.assetId.assetType === "Unique" ? `SN: ${req.assetId.serialNumber}` : "Bulk Assigned"}</small></div>
                             ) : (
                               <div><strong>{req.requestedAssetName}</strong> <br/><span className={`am-badge ${getBadgeClass(req.requestedAssetType)}`}>{req.requestedAssetType}</span></div>
                             )}
                           </td>
                           <td>{new Date(req.issueDate).toLocaleDateString()}</td>
                           <td><span className={`am-badge ${getBadgeClass(null, req.status)}`}>{req.status}</span></td>
                           <td>
                             
                             {/* PROCESS PERMISSION CHECK */}
                             {req.status === "Requested" && permissions.edit && (
                               <button className="am-btn am-btn-success am-btn-sm" onClick={() => {
                                 setSelectedRequest(req); setAssignData({ assetId: "", conditionOnIssue: "Good", notes: "" }); fetchAssets(); setShowAssignModal(true);
                               }}><FaCheck /> Process</button>
                             )}
                             
                             {/* RETURN PERMISSION CHECK */}
                             {req.status === "Assigned" && req.assetId?.category !== "Consumable" && permissions.edit && (
                               <button className="am-btn am-btn-outline-danger am-btn-sm" onClick={() => { setSelectedRequest(req); setShowReturnModal(true); }}>
                                 <FaUndo /> Return
                               </button>
                             )}
                             
                             {req.status === "Assigned" && req.assetId?.category === "Consumable" && (
                               <span className="am-text-muted am-text-sm d-flex align-item-center"><FaCheck className="mt-1 me-1" /> Given</span>
                             )}
                           </td>
                         </tr>
                       ))}
                       {assignments.length === 0 && <tr><td colSpan="5" className="am-text-center am-text-muted">No requests found.</td></tr>}
                     </tbody>
                  </table>
                </div>
              )}

              {/* INVENTORY TAB */}
              {activeTab === "inventory" && (
                <div className="am-table-responsive">
                  <table className="am-table">
                    <thead><tr><th>Type</th><th>Asset Name</th><th>Serial / Stock</th><th>Status</th><th>Action</th></tr></thead>
                    <tbody>
                      {assets.map((a) => (
                        <tr key={a._id}>
                          <td><span className={`am-badge ${getBadgeClass(a.assetType)}`}>{a.assetType}</span></td>
                          <td><strong>{a.assetName}</strong></td>
                          <td className="am-text-muted">{a.assetType === "Unique" ? a.serialNumber : <span className={`am-badge ${a.quantity > 0 ? 'am-badge-primary' : 'am-badge-danger'}`}>Stock: {a.quantity}</span>}</td>
                          <td><span className={`am-badge ${getBadgeClass(null, a.status)}`}>{a.status}</span></td>
                          <td>
                            
                            {/* EDIT INVENTORY PERMISSION CHECK */}
                            {permissions.edit && (
                              <button className="am-btn am-btn-outline-primary am-btn-sm am-mr-2" onClick={() => {
                                setEditAssetData({ _id: a._id, assetName: a.assetName, quantity: a.quantity, status: a.status, category: a.category, assetType: a.assetType, serialNumber: a.serialNumber || "" });
                                setShowEditModal(true);
                              }}><FaEdit /></button>
                            )}

                            {/* DELETE INVENTORY PERMISSION CHECK */}
                            {permissions.delete && (
                              <button className="am-btn am-btn-outline-danger am-btn-sm" onClick={() => handleDeleteAsset(a._id)}><FaTrash /></button>
                            )}
                          </td>
                        </tr>
                      ))}
                      {assets.length === 0 && <tr><td colSpan="5" className="am-text-center am-text-muted">No assets found in inventory.</td></tr>}
                    </tbody>
                  </table>
                </div>
              )}

              {/* SETTINGS TAB */}
              {activeTab === "settings" && (
                <div className="am-grid">
                  <div className="am-col-4">
                    <div className="am-sub-card">
                      <h5>Add Auto-Assign Rule</h5>
                      <p className="am-text-muted am-text-sm">Select an item from the current inventory to assign to new hires.</p>
                      
                      {/* CREATE RULE PERMISSION CHECK */}
                      {permissions.create ? (
                        <form onSubmit={handleAddRule}>
                          <div className="am-form-group">
                            <label className="am-form-label">Select Item from Inventory</label>
                            <select className="am-form-control" required value={newRule.assetName} onChange={(e) => {
                              const selected = uniqueInventoryItems.find(item => item.assetName === e.target.value);
                              if(selected) setNewRule({ assetName: selected.assetName, assetType: selected.assetType });
                              else setNewRule({ assetName: "", assetType: "Unique" });
                            }}>
                              <option value="">-- Choose Asset --</option>
                              {uniqueInventoryItems.map(item => (
                                <option key={item.assetName} value={item.assetName}>{item.assetName} ({item.assetType})</option>
                              ))}
                            </select>
                          </div>
                          <button type="submit" className="am-btn am-btn-primary am-w-100">Add Rule</button>
                        </form>
                      ) : (
                        <div className="am-alert am-alert-info am-text-sm mt-3">
                          You do not have permission to create rules.
                        </div>
                      )}

                    </div>
                  </div>
                  <div className="am-col-8">
                    <div className="am-sub-card">
                      <h5>Active Rules</h5>
                      <div className="am-table-responsive">
                        <table className="am-table">
                          <thead><tr><th>Asset Name</th><th>Type</th><th>Action</th></tr></thead>
                          <tbody>
                            {rules.map(r => (
                              <tr key={r._id}>
                                <td><strong>{r.assetName}</strong></td>
                                <td><span className={`am-badge ${getBadgeClass(r.assetType)}`}>{r.assetType}</span></td>
                                <td>
                                  {/* DELETE RULE PERMISSION CHECK */}
                                  {permissions.delete && (
                                    <button className="am-btn am-btn-outline-danger am-btn-sm" onClick={() => handleDeleteRule(r._id)}><FaTrash/></button>
                                  )}
                                </td>
                              </tr>
                            ))}
                            {rules.length === 0 && <tr><td colSpan="3" className="am-text-center am-text-muted">No rules configured.</td></tr>}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* --- MODALS --- (No changes needed inside modals as they open only via permitted buttons) */}
      
      {/* SMART ASSIGN MODAL */}
      {showAssignModal && (
        <div className="am-modal-overlay" onClick={() => setShowAssignModal(false)}>
          <div className="am-modal" onClick={e => e.stopPropagation()}>
            <div className="am-modal-header">
              <h4>Process Request</h4>
              <button className="am-close-btn" onClick={() => setShowAssignModal(false)}><FaTimes /></button>
            </div>
            <div className="am-modal-body">
              <div className="am-alert am-alert-info">
                Requesting: <strong>{selectedRequest?.requestedAssetName}</strong> <br/>
                <span className="am-text-sm">Employee: {selectedRequest?.employeeId?.name}</span>
              </div>

              {isOutOfStock ? (
                <div className="am-text-center am-py-3">
                  <FaExclamationTriangle size={40} className="am-text-danger" />
                  <h5 className="am-text-danger am-mt-2">Out of Stock!</h5>
                  <p className="am-text-muted am-text-sm">No available <b>{selectedRequest?.requestedAssetName}</b> in inventory.</p>
                </div>
              ) : isBulkRequest ? (
                <div className="am-text-center am-py-3">
                  <h5 className="am-text-success">Ready to Dispense</h5>
                  <span className="am-badge am-badge-success">Current Stock: {exactMatchingAssets[0].quantity}</span>
                  <p className="am-text-muted am-text-sm am-mt-2">Click Approve below to minus 1 from inventory.</p>
                </div>
              ) : (
                <div className="am-form-group">
                  <label className="am-form-label">Select Serial Number</label>
                  <select className="am-form-control" value={assignData.assetId} onChange={e => setAssignData({...assignData, assetId: e.target.value})}>
                    <option value="">-- Select {selectedRequest?.requestedAssetName} SN --</option>
                    {exactMatchingAssets.map(a => <option key={a._id} value={a._id}>SN: {a.serialNumber}</option>)}
                  </select>
                </div>
              )}
            </div>
            <div className="am-modal-footer">
              <button className="am-btn am-btn-secondary" onClick={() => setShowAssignModal(false)}>Cancel</button>
              <button className="am-btn am-btn-success" onClick={handleAssignAsset} disabled={isOutOfStock}>
                {isBulkRequest ? "Approve & Dispense" : "Assign & Link"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD ASSET MODAL */}
      {showAddModal && (
        <div className="am-modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="am-modal" onClick={e => e.stopPropagation()}>
            <div className="am-modal-header">
              <h4>Add Item to Inventory</h4>
              <button className="am-close-btn" onClick={() => setShowAddModal(false)}><FaTimes /></button>
            </div>
            <div className="am-modal-body">
              <div className="am-form-group">
                <label className="am-form-label">Asset Type</label>
                <select className="am-form-control" value={newAsset.assetType} onChange={e => setNewAsset({...newAsset, assetType: e.target.value})}>
                  <option value="Unique">Unique (Mobiles/Laptops)</option>
                  <option value="Bulk">Bulk (T-Shirts/ID Cards)</option>
                </select>
              </div>
              <div className="am-form-group">
                <label className="am-form-label">Asset Name (e.g. iPhone 15)</label>
                <input className="am-form-control" type="text" value={newAsset.assetName} onChange={e => setNewAsset({...newAsset, assetName: e.target.value})} />
              </div>
              <div className="am-form-group">
                <label className="am-form-label">Category</label>
                <select className="am-form-control" value={newAsset.category} onChange={e => setNewAsset({...newAsset, category: e.target.value})}>
                  <option value="Hardware">Hardware</option>
                  <option value="Consumable">Consumable / Merch</option>
                  <option value="Access">Access / ID</option>
                </select>
              </div>
              {newAsset.assetType === "Unique" ? (
                <div className="am-form-group">
                  <label className="am-form-label">Serial Number</label>
                  <input className="am-form-control" type="text" value={newAsset.serialNumber} onChange={e => setNewAsset({...newAsset, serialNumber: e.target.value})} />
                </div>
              ) : (
                <div className="am-form-group">
                  <label className="am-form-label">Total Stock</label>
                  <input className="am-form-control" type="number" min="1" value={newAsset.quantity} onChange={e => setNewAsset({...newAsset, quantity: Number(e.target.value)})} />
                </div>
              )}
            </div>
            <div className="am-modal-footer">
              <button className="am-btn am-btn-primary" onClick={handleAddAsset}>Add to Inventory</button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT ASSET MODAL */}
      {showEditModal && (
        <div className="am-modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="am-modal" onClick={e => e.stopPropagation()}>
            <div className="am-modal-header">
              <h4>Update Asset</h4>
              <button className="am-close-btn" onClick={() => setShowEditModal(false)}><FaTimes /></button>
            </div>
            <div className="am-modal-body">
              <div className="am-form-group">
                <label className="am-form-label">Asset Name</label>
                <input className="am-form-control" type="text" value={editAssetData.assetName} onChange={e => setEditAssetData({...editAssetData, assetName: e.target.value})} />
              </div>
              {editAssetData.assetType === "Unique" ? (
                <div className="am-form-group">
                  <label className="am-form-label">Serial Number</label>
                  <input className="am-form-control" type="text" value={editAssetData.serialNumber} onChange={e => setEditAssetData({...editAssetData, serialNumber: e.target.value})} />
                </div>
              ) : (
                <div className="am-form-group">
                  <label className="am-form-label">Stock Quantity</label>
                  <input className="am-form-control" type="number" value={editAssetData.quantity} onChange={e => setEditAssetData({...editAssetData, quantity: Number(e.target.value)})} />
                </div>
              )}
              <div className="am-form-group">
                <label className="am-form-label">Status</label>
                <select className="am-form-control" value={editAssetData.status} onChange={e => setEditAssetData({...editAssetData, status: e.target.value})}>
                  <option value="Available">Available</option>
                  {editAssetData.assetType === "Unique" && <option value="Assigned">Assigned</option>}
                  {editAssetData.assetType === "Unique" && <option value="Under Maintenance">Under Maintenance</option>}
                  <option value="Out of Stock">Out of Stock</option>
                </select>
              </div>
            </div>
            <div className="am-modal-footer">
              <button className="am-btn am-btn-success" onClick={handleUpdateAsset}>Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* RETURN ASSET MODAL */}
      {showReturnModal && (
        <div className="am-modal-overlay" onClick={() => setShowReturnModal(false)}>
          <div className="am-modal" onClick={e => e.stopPropagation()}>
            <div className="am-modal-header">
              <h4>Process Asset Return</h4>
              <button className="am-close-btn" onClick={() => setShowReturnModal(false)}><FaTimes /></button>
            </div>
            <div className="am-modal-body">
              <div className="am-alert am-alert-warning">
                Confirming return of <strong>{selectedRequest?.assetId?.assetName}</strong> <br/>
                <span className="am-text-sm am-text-muted">
                  {selectedRequest?.assetId?.assetType === "Unique" ? `SN: ${selectedRequest?.assetId?.serialNumber}` : "Bulk Item Restock"}
                </span> <br/>
                <span className="am-text-sm">From: <strong>{selectedRequest?.employeeId?.name}</strong></span>
              </div>
              <div className="am-form-group">
                <label className="am-form-label">Condition on Return</label>
                <select className="am-form-control" value={returnData.conditionOnReturn} onChange={e => setReturnData({...returnData, conditionOnReturn: e.target.value})}>
                  <option value="Good">Good</option>
                  <option value="Damaged">Damaged</option>
                </select>
              </div>
              <div className="am-form-group">
                <label className="am-form-label">Notes</label>
                <textarea className="am-form-control" rows={2} value={returnData.returnNotes} onChange={e => setReturnData({...returnData, returnNotes: e.target.value})}></textarea>
              </div>
            </div>
            <div className="am-modal-footer">
              <button className="am-btn am-btn-secondary" onClick={() => setShowReturnModal(false)}>Cancel</button>
              <button className="am-btn am-btn-danger" onClick={handleReturnAsset}>Confirm Return</button>
            </div>
          </div>
        </div>
      )}
    </DynamicLayout>
  );
};

export default AdminAssetManagement;