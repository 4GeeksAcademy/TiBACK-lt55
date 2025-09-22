import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useGlobalReducer from '../../hooks/useGlobalReducer';
import GoogleMapsLocation from '../../components/GoogleMapsLocation';

// Utilidades de token
const tokenUtils = {
  decodeToken: (token) => {
    try {
      if (!token) return null;
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      return JSON.parse(atob(parts[1]));
    } catch (error) {
      return null;
    }
  },
  getUserId: (token) => {
    const payload = tokenUtils.decodeToken(token);
    return payload ? payload.user_id : null;
  }
};

export function ClientePage() {
  const { store, logout } = useGlobalReducer();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userData, setUserData] = useState(null);
  const [locationData, setLocationData] = useState({ address: '', lat: null, lng: null });
  const [newTicketImages, setNewTicketImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [selectedTicketImages, setSelectedTicketImages] = useState(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showLocationForm, setShowLocationForm] = useState(false);
  const [updatingLocation, setUpdatingLocation] = useState(false);

  const navigate = useNavigate();
  const API = import.meta.env.VITE_BACKEND_URL + "/api";
  const CLOUDINARY_URL = "https://api.cloudinary.com/v1_1/dda53mpsn/upload";
  const CLOUDINARY_UPLOAD_PRESET = "Ticket-TiBACK";

  const fetchJson = async (url, options = {}) => {
    const token = store.auth.token;
    const headers = { "Content-Type": "application/json", ...options.headers };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    try {
      const res = await fetch(url, { ...options, headers });
      const data = await res.json();
      return { ok: res.ok, data };
    } catch (err) {
      return { ok: false, data: { message: err.message } };
    }
  };

  const actualizarTickets = async () => {
    const token = store.auth.token;
    try {
      const res = await fetch(`${API}/tickets/cliente`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      if (res.ok) {
        const data = await res.json();
        setTickets(data);
      } else {
        const errData = await res.json();
        setError(errData.message || 'Error al cargar tickets');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setLoading(true);
        const token = store.auth.token;
        const userId = tokenUtils.getUserId(token);

        // Datos usuario
        const userRes = await fetch(`${API}/clientes/${userId}`, {
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
        });
        if (userRes.ok) {
          const data = await userRes.json();
          setUserData(data);
          setLocationData({
            address: data.direccion || '',
            lat: data.latitude || null,
            lng: data.longitude || null
          });
        }

        await actualizarTickets();
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    cargarDatos();
  }, [store.auth.token]);

  const manejarUploadImagen = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setUploading(true);
    try {
      const urls = await Promise.all(files.map(async (file) => {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
        const res = await fetch(CLOUDINARY_URL, { method: 'POST', body: fd });
        const data = await res.json();
        return data.secure_url;
      }));
      setNewTicketImages(prev => [...prev, ...urls]);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
      e.target.value = null;
    }
  };

  const eliminarImagenNueva = (index) => {
    setNewTicketImages(prev => prev.filter((_, i) => i !== index));
  };

  const crearTicket = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const ticketData = {
      titulo: formData.get('titulo'),
      descripcion: formData.get('descripcion'),
      prioridad: formData.get('prioridad'),
      img_urls: newTicketImages
    };
    try {
      const token = store.auth.token;
      const res = await fetch(`${API}/tickets`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(ticketData)
      });
      if (!res.ok) throw new Error('Error al crear ticket');
      await actualizarTickets();
      setNewTicketImages([]);
      e.target.reset();
    } catch (err) {
      setError(err.message);
    }
  };

  const eliminarTicket = async (ticketId) => {
    try {
      const { ok, data } = await fetchJson(`${API}/tickets/${ticketId}`, { method: 'DELETE' });
      if (!ok) throw new Error(data.message);
      await actualizarTickets();
    } catch (err) {
      setError(err.message);
    }
  };

  const updateLocation = async () => {
    try {
      setUpdatingLocation(true);
      const token = store.auth.token;
      const userId = tokenUtils.getUserId(token);
      const res = await fetch(`${API}/clientes/${userId}`, {
        method:'PUT',
        headers:{ 'Authorization':`Bearer ${token}`, 'Content-Type':'application/json' },
        body: JSON.stringify({ direccion:locationData.address, latitude:locationData.lat, longitude:locationData.lng })
      });
      if(!res.ok) throw new Error('Error al actualizar ubicación');
      setUserData(prev=>({...prev, direccion:locationData.address, latitude:locationData.lat, longitude:locationData.lng}));
      alert('Ubicación actualizada exitosamente');
      setShowLocationForm(false);
    } catch(err){ setError(err.message); }
    finally{ setUpdatingLocation(false); }
  };

  const getEstadoColor = (estado) => {
    switch (estado.toLowerCase()) {
      case 'creado': return 'badge bg-secondary';
      case 'en_espera': return 'badge bg-warning';
      case 'en_proceso': return 'badge bg-primary';
      case 'solucionado': return 'badge bg-success';
      case 'cerrado': return 'badge bg-dark';
      case 'reabierto': return 'badge bg-danger';
      default: return 'badge bg-secondary';
    }
  };

  const getPrioridadColor = (prioridad) => {
    switch (prioridad.toLowerCase()) {
      case 'alta': return 'badge bg-danger';
      case 'media': return 'badge bg-warning';
      case 'baja': return 'badge bg-success';
      default: return 'badge bg-secondary';
    }
  };

  return (
    <div className="container py-4">
      {/* Header con info de usuario y sesión */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card">
            <div className="card-body d-flex justify-content-between align-items-center">
              <div>
                <h2 className="mb-1">Bienvenido, {userData?.nombre} {userData?.apellido}</h2>
                <p className="text-muted mb-0">Panel de Cliente - Gestión de Tickets</p>
                {userData?.direccion && (
                  <div className="mt-2">
                    <small className="text-info d-flex align-items-center">
                      <i className="fas fa-map-marker-alt me-1"></i>
                      <span className="fw-bold">Ubicación:</span>
                      <span className="ms-1 w-50">{userData.direccion}</span>
                    </small>
                    {userData?.latitude && userData?.longitude && (
                      <small className="text-muted d-block mt-1">
                        <i className="fas fa-globe me-1"></i>
                        Coordenadas: {userData.latitude.toFixed(6)}, {userData.longitude.toFixed(6)}
                      </small>
                    )}
                  </div>
                )}
              </div>
              <div className="d-flex gap-2">
                <button className="btn btn-info" onClick={()=>setShowLocationForm(!showLocationForm)}>
                  <i className="fas fa-map-marker-alt me-1"></i>
                  {showLocationForm?'Ocultar Ubicación':'Actualizar Ubicación'}
                </button>
                <Link to="/clientes" className="btn btn-primary">Ir al CRUD</Link>
                <button className="btn btn-outline-danger" onClick={logout}>Cerrar Sesión</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Formulario ubicación */}
      {showLocationForm && (
        <div className="row mb-4">
          <div className="col-12">
            <div className="card">
              <div className="card-header">
                <h5 className="mb-0"><i className="fas fa-map-marker-alt me-2"></i>Actualizar Mi Ubicación</h5>
              </div>
              <div className="card-body">
                <GoogleMapsLocation
                  onLocationChange={setLocationData}
                  initialAddress={locationData.address}
                  initialLat={locationData.lat}
                  initialLng={locationData.lng}
                />
                <div className="mt-3 d-flex gap-2">
                  <button className="btn btn-success" onClick={updateLocation} disabled={!locationData.address || updatingLocation}>
                    {updatingLocation?<> <span className="spinner-border spinner-border-sm me-1"></span> Actualizando...</> : <> <i className="fas fa-save me-1"></i> Guardar Ubicación</>}
                  </button>
                  <button className="btn btn-secondary" onClick={()=>setShowLocationForm(false)} disabled={updatingLocation}><i className="fas fa-times me-1"></i> Cancelar</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Crear ticket */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card">
            <div className="card-header"><h5 className="mb-0">Crear Ticket</h5></div>
            <div className="card-body">
              <form onSubmit={crearTicket}>
                <div className="mb-3">
                  <label className="form-label">Título</label>
                  <input type="text" name="titulo" className="form-control" required />
                </div>
                <div className="mb-3">
                  <label className="form-label">Descripción</label>
                  <textarea name="descripcion" className="form-control" required />
                </div>
                <div className="mb-3">
                  <label className="form-label">Prioridad</label>
                  <select name="prioridad" className="form-select" required>
                    <option value="alta">Alta</option>
                    <option value="media">Media</option>
                    <option value="baja">Baja</option>
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label">Imágenes</label>
                  <input type="file" className="form-control" multiple onChange={manejarUploadImagen} />
                  <div className="d-flex flex-wrap gap-2 mt-2">
                    {newTicketImages.map((url, i) => (
                      <div key={i} className="position-relative">
                        <img src={url} alt="preview" className="img-thumbnail" style={{ width: '75px', height: '75px', objectFit: 'cover' }} />
                        <button type="button" className="btn btn-sm btn-danger position-absolute top-0 end-0" onClick={() => eliminarImagenNueva(i)}>×</button>
                      </div>
                    ))}
                  </div>
                </div>
                <button type="submit" className="btn btn-success" disabled={uploading}>
                  {uploading ? "Subiendo..." : "Crear Ticket"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Lista tickets */}
      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-header"><h5 className="mb-0">Mis Tickets</h5></div>
            <div className="card-body">
              {loading ? (
                <div className="text-center py-4"><div className="spinner-border text-primary" role="status"></div></div>
              ) : tickets.length === 0 ? (
                <p className="text-muted text-center">No tienes tickets creados.</p>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover align-middle">
                    <thead>
                      <tr>
                        <th>ID</th><th>Título</th><th>Estado</th><th>Prioridad</th>
                        <th>Fecha Creación</th><th>Imágenes</th><th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tickets.map(ticket => (
                        <tr key={ticket.id}>
                          <td>#{ticket.id}</td>
                          <td>{ticket.titulo}</td>
                          <td><span className={getEstadoColor(ticket.estado)}>{ticket.estado}</span></td>
                          <td><span className={getPrioridadColor(ticket.prioridad)}>{ticket.prioridad}</span></td>
                          <td>{new Date(ticket.fecha_creacion).toLocaleDateString()}</td>
                          <td>
                            {ticket.img_urls && ticket.img_urls.length > 0 ? (
                              <div className="d-flex flex-wrap gap-1">
                                {ticket.img_urls.slice(0, 3).map((url, idx) => (
                                  <img
                                    key={idx}
                                    src={url}
                                    alt={`ticket-${ticket.id}-img-${idx}`}
                                    className="img-thumbnail"
                                    style={{ width: '50px', height: '50px', objectFit: 'cover', cursor: 'pointer' }}
                                    onClick={() => { setSelectedTicketImages(ticket.img_urls); setSelectedImageIndex(idx); }}
                                  />
                                ))}
                                {ticket.img_urls.length > 3 && <span className="badge bg-secondary">+{ticket.img_urls.length - 3}</span>}
                              </div>
                            ) : <span className="text-muted">Sin imágenes</span>}
                          </td>
                          <td>
                            <button className="btn btn-primary me-2" onClick={() => navigate(`/tickets/${ticket.id}`)}>
                              <i className="fas fa-eye"></i> Ver
                            </button>
                            <button className="btn btn-danger" onClick={() => eliminarTicket(ticket.id)}>
                              <i className="fas fa-trash"></i>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de imágenes */}
      {selectedTicketImages && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'transparent' }} tabIndex="-1" onClick={() => setSelectedTicketImages(null)}>
          <div className="modal-dialog modal-dialog-centered modal-md" onClick={e => e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Vista previa</h5>
                <button type="button" className="btn-close" onClick={() => setSelectedTicketImages(null)}></button>
              </div>
              <div className="modal-body text-center">
                <div className="position-relative">
                  <img src={selectedTicketImages[selectedImageIndex]} alt={`img-${selectedImageIndex}`} className="img-fluid rounded" style={{ maxHeight: '400px', objectFit: 'contain' }} />
                  {selectedTicketImages.length > 1 && (
                    <>
                      <button className="btn btn-secondary position-absolute top-50 start-0 translate-middle-y" style={{ zIndex: 2 }} onClick={() => setSelectedImageIndex((prev) => (prev - 1 + selectedTicketImages.length) % selectedTicketImages.length)}>‹</button>
                      <button className="btn btn-secondary position-absolute top-50 end-0 translate-middle-y" style={{ zIndex: 2 }} onClick={() => setSelectedImageIndex((prev) => (prev + 1) % selectedTicketImages.length)}>›</button>
                    </>
                  )}
                </div>
                <div className="mt-2">
                  {selectedTicketImages.map((_, idx) => (
                    <span key={idx} className={`mx-1 rounded-circle ${idx === selectedImageIndex ? 'bg-primary' : 'bg-secondary'}`} style={{ display: 'inline-block', width: '10px', height: '10px', cursor: 'pointer' }} onClick={() => setSelectedImageIndex(idx)}></span>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show" style={{ zIndex: 0 }} onClick={() => setSelectedTicketImages(null)}></div>
        </div>
      )}
    </div>
  );
}

export default ClientePage;
