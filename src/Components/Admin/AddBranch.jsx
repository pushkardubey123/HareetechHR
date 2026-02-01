import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import axios from "axios";
import Swal from "sweetalert2";
import AdminLayout from "./AdminLayout";
import Loader from "./Loader/Loader";
import "./Branch.css";

// Icons
import { 
  FaMapMarkedAlt, FaEdit, FaTrash, FaPlus, FaLayerGroup, 
  FaMapPin, FaRulerCombined, FaLocationArrow 
} from "react-icons/fa";
import { BiCurrentLocation } from "react-icons/bi";

const schema = yup.object().shape({
  name: yup.string().required("Branch name is required"),
  address: yup.string().required("Branch address is required"),
  latitude: yup.number().typeError("Must be a number").required("Latitude is required"),
  longitude: yup.number().typeError("Must be a number").required("Longitude is required"),
  radius: yup.number().typeError("Must be a number").required("Radius is required"),
});

const Branch = () => {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false); // New state for location loader
  const [editId, setEditId] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
  });

  const token = JSON.parse(localStorage.getItem("user"))?.token;

  const getAlertTheme = () => {
    const isDark = document.body.getAttribute('data-theme') === 'dark';
    return {
      background: isDark ? '#1e293b' : '#fff',
      color: isDark ? '#fff' : '#000'
    };
  };

  // --- NEW FEATURE: Get Current Location ---
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      Swal.fire("Error", "Geolocation is not supported by your browser", "error");
      return;
    }

    setLocationLoading(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        // Set values in the form
        setValue("latitude", position.coords.latitude);
        setValue("longitude", position.coords.longitude);
        setLocationLoading(false);
        
        // Optional: Show a mini toast
        const theme = getAlertTheme();
        Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'success',
            title: 'Coordinates fetched!',
            showConfirmButton: false,
            timer: 1500,
            background: theme.background,
            color: theme.color
        });
      },
      (error) => {
        setLocationLoading(false);
        let msg = "Unable to retrieve your location";
        if (error.code === 1) msg = "Location permission denied. Please allow access.";
        Swal.fire("Location Error", msg, "error");
      }
    );
  };

  const fetchBranches = async () => {
    setLoading(true);
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/branch`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setBranches(res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  const onSubmit = async (data) => {
    const theme = getAlertTheme();
    try {
      const url = editId
        ? `${import.meta.env.VITE_API_URL}/api/branch/update/${editId}`
        : `${import.meta.env.VITE_API_URL}/api/branch/create`;
      const method = editId ? "put" : "post";

      const res = await axios[method](
        url,
        data,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // --- CRITICAL FIX: Check res.data.success ---
      if (res.data.success) {
        Swal.fire({
          icon: 'success',
          title: editId ? 'Updated!' : 'Created!',
          text: res.data.message,
          background: theme.background,
          color: theme.color,
          confirmButtonColor: '#2563eb'
        });
        reset();
        setEditId(null);
        fetchBranches();
      } else {
        // Handle backend logical errors (e.g. duplicate name)
        throw new Error(res.data.message || "Operation failed");
      }

    } catch (err) {
      // Handles both axios errors (4xx/5xx) and the logical error thrown above
      const errorMsg = err.response?.data?.message || err.message || "Action failed";
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: errorMsg,
        background: theme.background,
        color: theme.color
      });
    }
  };

  const handleDelete = async (branchId) => {
    const theme = getAlertTheme();
    const confirm = await Swal.fire({
      title: "Delete Branch?",
      text: "This will remove all associated data.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      confirmButtonText: "Delete",
      background: theme.background,
      color: theme.color
    });

    if (confirm.isConfirmed) {
      try {
        const res = await axios.delete(
          `${import.meta.env.VITE_API_URL}/api/branch/delete/${branchId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        // Check success for delete as well
        if(res.data.success) {
            Swal.fire({
               icon: "success", 
               title: "Deleted!", 
               text: "Branch removed.", 
               background: theme.background, 
               color: theme.color 
            });
            fetchBranches();
        } else {
            Swal.fire("Error", res.data.message, "error");
        }
      } catch (err) {
        Swal.fire("Error", "Failed to delete branch", "error");
      }
    }
  };

  const handleEdit = (b) => {
    setEditId(b._id);
    setValue("name", b.name);
    setValue("address", b.address);
    setValue("latitude", b.latitude);
    setValue("longitude", b.longitude);
    setValue("radius", b.radius);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <AdminLayout>
      <div className="branch-scope">
        
        {/* Header */}
        <div className="page-header">
          <div>
            <h1 className="page-title">
              <FaMapMarkedAlt style={{color: 'var(--primary-color)'}} /> Branch Management
            </h1>
            <p className="page-subtitle">Configure locations and geofencing parameters.</p>
          </div>
        </div>

        {/* Form Card */}
        <div className="form-card">
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="row g-4">
              
              {/* Basic Info */}
              <div className="col-lg-6 pt-3">
                <h6 className="form-section-title d-flex align-item-center"><FaLayerGroup className="me-2 "/> Basic Information</h6>
                <div className="mb-3">
                  <label className="form-label">Branch Name</label>
                  <input type="text" className="form-control" placeholder="e.g. Head Office - NY" {...register("name")} />
                  <small className="text-danger">{errors.name?.message}</small>
                </div>
                <div className="mb-3">
                  <label className="form-label">Address</label>
                  <input type="text" className="form-control" placeholder="Full physical address" {...register("address")} />
                  <small className="text-danger">{errors.address?.message}</small>
                </div>
              </div>

              {/* Geofencing Info */}
              <div className="col-lg-6">
                <div className="d-flex justify-content-between align-items-center border-bottom mb-3 pb-2">
                    <h6 className="form-section-title mb-0 border-0 pb-0 d-flex align-items-center"><BiCurrentLocation className="me-2"/> Geofencing Settings</h6>
                    
                    {/* --- NEW BUTTON: Fetch Location --- */}
                    <button 
                        type="button" 
                        onClick={handleGetLocation} 
                        disabled={locationLoading}
                        className="btn btn-sm btn-outline-primary d-flex align-items-center gap-2"
                        style={{fontSize: '0.8rem'}}
                    >
                        {locationLoading ? (
                            <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                        ) : <FaLocationArrow />} 
                        Get Current Location
                    </button>
                </div>

                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Latitude</label>
                    <input type="text" className="form-control" placeholder="e.g. 40.7128" {...register("latitude")} />
                    <small className="text-danger">{errors.latitude?.message}</small>
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Longitude</label>
                    <input type="text" className="form-control" placeholder="e.g. -74.0060" {...register("longitude")} />
                    <small className="text-danger">{errors.longitude?.message}</small>
                  </div>
                  <div className="col-12 mb-3">
                    <label className="form-label">Radius (meters)</label>
                    <div className="input-group">
                      <span className="input-group-text"><FaRulerCombined/></span>
                      <input type="number" className="form-control" placeholder="e.g. 200" {...register("radius")} />
                    </div>
                    <small className="text-danger">{errors.radius?.message}</small>
                  </div>
                </div>
              </div>

            </div>

            <div className="d-flex justify-content-end mt-4 pt-3" style={{borderTop: '1px solid var(--border-color)'}}>
               {editId && (
                  <button type="button" className="btn btn-light me-2" onClick={() => { setEditId(null); reset(); }}>
                    Cancel
                  </button>
               )}
               <button type="submit" className="btn-primary-custom d-flex align-items-center gap-2">
                 {editId ? <FaEdit /> : <FaPlus />} 
                 {editId ? "Update Branch" : "Add Branch"}
               </button>
            </div>
          </form>
        </div>

        {/* Table Section */}
        {loading ? (
          <div className="d-flex justify-content-center py-5"><Loader /></div>
        ) : (
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>#S No.</th>
                  <th>Branch Name</th>
                  <th>Address</th>
                  <th>Coordinates</th>
                  <th>Radius</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {branches.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-4" style={{color: 'var(--text-secondary)'}}>
                      No branches found. Add one above.
                    </td>
                  </tr>
                ) : (
                  branches.map((b, index) => (
                    <tr key={b._id}>
                      <td>{index + 1}</td>
                      <td>
                        <span style={{fontWeight: '600', color: 'var(--text-main)'}}>{b.name}</span>
                      </td>
                      <td style={{maxWidth: '250px'}} className="text-truncate" title={b.address}>
                        <FaMapPin style={{color: 'var(--text-secondary)'}} className="me-1 mt-1" size={12}/> {b.address}
                      </td>
                      <td>
                        <div className="d-flex flex-column" style={{fontSize: '12px', color: 'var(--text-secondary)'}}>
                           <span>Lat: {b.latitude}</span>
                           <span>Lng: {b.longitude}</span>
                        </div>
                      </td>
                      <td>
                        <span className="badge-radius">
                          <BiCurrentLocation /> {b.radius}m
                        </span>
                      </td>
                      <td className="text-end">
                        <button className="btn-action btn-edit me-2" onClick={() => handleEdit(b)} title="Edit">
                          <FaEdit />
                        </button>
                        <button className="btn-action btn-delete" onClick={() => handleDelete(b._id)} title="Delete">
                          <FaTrash />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

      </div>
    </AdminLayout>
  );
};

export default Branch;