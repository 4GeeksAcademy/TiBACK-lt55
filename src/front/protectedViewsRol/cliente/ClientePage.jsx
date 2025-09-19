import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import useGlobalReducer from '../../hooks/useGlobalReducer';
import GoogleMapsLocation from '../../components/GoogleMapsLocation';

// Utilidades de token seguras
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
  const { store, logout, dispatch } = useGlobalReducer();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showLocationForm, setShowLocationForm] = useState(false);
  const [updatingLocation, setUpdatingLocation] = useState(false);
  const [userData, setUserData] = useState(null);
  const [locationData, setLocationData] = useState({ address:'', lat:null, lng:null });

  // Cloudinary
  const CLOUDINARY_URL = "https://api.cloudinary.com/v1_1/dda53mpsn/upload";
  const CLOUDINARY_UPLOAD_PRESET = "Ticket-TiBACK";

  const [newTicket, setNewTicket] = useState({ titulo:'', descripcion:'', prioridad:'', img_urls: [] });
  const [uploading, setUploading] = useState(false);

  // --- Helpers ---
  const actualizarTickets = async () => {
    try {
      const token = store.auth.token;
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/tickets/cliente`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      if (res.ok) {
        const data = await res.json();
        setTickets(data);
      }
    } catch (err) { console.error('Error al actualizar tickets:', err); }
  };

  const fetchJson = async (url, options={}) => {
    const token = store.auth.token;
    const headers = { "Content-Type": "application/json", ...options.headers };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const res = await fetch(url, { ...options, headers });
    const data = await res.json();
    return { ok: res.ok, data };
  };

  // Cargar datos usuario y tickets
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setLoading(true);
        const token = store.auth.token;
        const userId = tokenUtils.getUserId(token);

        // Datos usuario
        const userRes = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/clientes/${userId}`, {
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
        });
        if (userRes.ok) {
          const userData = await userRes.json();
          setUserData(userData);
          setLocationData({
            address: userData.direccion || '',
            lat: userData.latitude || null,
            lng: userData.longitude || null
          });
        }

        // Tickets
        await actualizarTickets();
      } catch (err) { setError(err.message); }
      finally { setLoading(false); }
    };
    cargarDatos();
  }, [store.auth.token]);

  // --- Tickets ---
  const manejarUploadImagen = async (e, ticketStateSetter) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    setUploading(true);
    try {
      const uploadPromises = files.map(async file => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
        const res = await fetch(CLOUDINARY_URL, { method: "POST", body: formData });
        const data = await res.json();
        return data.secure_url;
      });
      const urls = await Promise.all(uploadPromises);
      ticketStateSetter(prev => ({ ...prev, img_urls: [...(prev.img_urls||[]), ...urls] }));
    } catch (err) { setError(err.message); }
    finally { setUploading(false); e.target.value = ''; }
  };

  const eliminarImagen = (index, ticketStateSetter) => {
    ticketStateSetter(prev => ({
      ...prev,
      img_urls: prev.img_urls.filter((_,i)=>i!==index)
    }));
  };

  const crearTicket = async e => {
    e.preventDefault();
    try {
      const token = store.auth.token;
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/tickets`, {
        method:'POST',
        headers:{ 'Authorization':`Bearer ${token}`, 'Content-Type':'application/json' },
        body: JSON.stringify(newTicket)
      });
      if(!response.ok) throw new Error('Error al crear ticket');
      setNewTicket({ titulo:'', descripcion:'', prioridad:'', img_urls: [] });
      await actualizarTickets();
    } catch(err){ setError(err.message); }
  };

  const actualizarTicket = async (ticketId, updatedTicket) => {
    try {
      const { ok, data } = await fetchJson(`${import.meta.env.VITE_BACKEND_URL}/api/tickets/${ticketId}`, {
        method:'PUT', body:JSON.stringify(updatedTicket)
      });
      if(!ok) throw new Error(data.message);
      await actualizarTickets();
    } catch(err){ setError(err.message); }
  };

  const eliminarTicket = async ticketId => {
    try {
      const { ok, data } = await fetchJson(`${import.meta.env.VITE_BACKEND_URL}/api/tickets/${ticketId}`, { method:'DELETE' });
      if(!ok) throw new Error(data.message);
      await actualizarTickets();
    } catch(err){ setError(err.message); }
  };

  const reabrirTicket = async ticketId => {
    try {
      const { ok, data } = await fetchJson(`${import.meta.env.VITE_BACKEND_URL}/api/tickets/${ticketId}/estado`, {
        method:'PUT', body: JSON.stringify({ estado:'reabierto' })
      });
      if(!ok) throw new Error(data.message);
      await actualizarTickets();
    } catch(err){ setError(err.message); }
  };

  const cerrarTicket = async ticketId => {
    try {
      const { ok, data } = await fetchJson(`${import.meta.env.VITE_BACKEND_URL}/api/tickets/${ticketId}/estado`, {
        method:'PUT', body: JSON.stringify({ estado:'cerrado' })
      });
      if(!ok) throw new Error(data.message);
      await actualizarTickets();
    } catch(err){ setError(err.message); }
  };

  const evaluarTicket = async (ticketId, calificacion, comentario) => {
    try {
      const { ok, data } = await fetchJson(`${import.meta.env.VITE_BACKEND_URL}/api/tickets/${ticketId}/evaluar`, {
        method:'POST', body: JSON.stringify({ calificacion, comentario })
      });
      if(!ok) throw new Error(data.message);
      await actualizarTickets();
    } catch(err){ setError(err.message); }
  };

  const getEstadoColor = estado => {
    switch(estado.toLowerCase()){
      case 'creado': return 'badge bg-secondary';
      case 'en_espera': return 'badge bg-warning';
      case 'en_proceso': return 'badge bg-primary';
      case 'solucionado': return 'badge bg-success';
      case 'cerrado': return 'badge bg-dark';
      case 'reabierto': return 'badge bg-danger';
      default: return 'badge bg-secondary';
    }
  };

  const getPrioridadColor = prioridad => {
    switch(prioridad.toLowerCase()){
      case 'alta': return 'badge bg-danger';
      case 'media': return 'badge bg-warning';
      case 'baja': return 'badge bg-success';
      default: return 'badge bg-secondary';
    }
  };

  const handleLocationChange = location => setLocationData(location);

  const updateLocation = async () => {
    try{
      setUpdatingLocation(true);
      const token = store.auth.token;
      const userId = tokenUtils.getUserId(token);
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/clientes/${userId}`, {
        method:'PUT',
        headers:{ 'Authorization':`Bearer ${token}`, 'Content-Type':'application/json' },
        body: JSON.stringify({ direccion:locationData.address, latitude:locationData.lat, longitude:locationData.lng })
      });
      if(!res.ok) throw new Error('Error al actualizar ubicación');
      setUserData(prev=>({...prev, direccion:locationData.address, latitude:locationData.lat, longitude:locationData.lng}));
      alert('Ubicación actualizada exitosamente');
      setShowLocationForm(false);
    }catch(err){ setError(err.message); }
    finally{ setUpdatingLocation(false); }
  };

  return (
    <div className="container py-4">
      {/* Header con info de usuario */}
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
                  onLocationChange={handleLocationChange}
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
            <div className="card-header"><h5 className="mb-0">Crear Nuevo Ticket</h5></div>
            <div className="card-body">
              <form onSubmit={crearTicket}>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label">Título *</label>
                    <input type="text" className="form-control" value={newTicket.titulo} onChange={e=>setNewTicket({...newTicket,titulo:e.target.value})} required />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Prioridad *</label>
                    <select className="form-select" value={newTicket.prioridad} onChange={e=>setNewTicket({...newTicket,prioridad:e.target.value})} required>
                      <option value="">Seleccionar...</option>
                      <option value="baja">Baja</option>
                      <option value="media">Media</option>
                      <option value="alta">Alta</option>
                    </select>
                  </div>
                  <div className="col-12">
                    <label className="form-label">Descripción *</label>
                    <textarea className="form-control" rows="4" value={newTicket.descripcion} onChange={e=>setNewTicket({...newTicket,descripcion:e.target.value})} required></textarea>
                  </div>
                  <div className="col-12">
                    <label className="form-label">Imágenes</label>
                    <input type="file" accept="image/*" multiple onChange={e=>manejarUploadImagen(e,setNewTicket)} disabled={uploading} className="form-control" />
                    {uploading && <p className="text-muted">Subiendo imágenes...</p>}
                    <div className="d-flex flex-wrap gap-3 mt-2">
                      {newTicket.img_urls.map((url,idx)=>(
                        <div key={idx} className="position-relative" style={{width:120,height:120}}>
                          <img src={url} alt={`Imagen ${idx+1}`} style={{width:'100%',height:'100%',objectFit:'cover',borderRadius:'8px'}} />
                          <button type="button" className="btn btn-sm btn-danger position-absolute top-0 end-0" style={{borderRadius:'50%'}}
                            onClick={()=>eliminarImagen(idx,setNewTicket)}>×</button>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="col-12"><button type="submit" className="btn btn-primary">Crear Ticket</button></div>
                </div>
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
              {loading?(
                <div className="text-center py-4"><div className="spinner-border text-primary" role="status"></div></div>
              ):tickets.length===0?(
                <div className="text-center py-4"><p className="text-muted">No tienes tickets creados aún.</p></div>
              ):(
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Título</th>
                        <th>Estado</th>
                        <th>Prioridad</th>
                        <th>Fecha Creación</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tickets.map(ticket=>(
                        <tr key={ticket.id}>
                          <td>#{ticket.id}</td>
                          <td>{ticket.titulo}</td>
                          <td><span className={getEstadoColor(ticket.estado)}>{ticket.estado}</span></td>
                          <td><span className={getPrioridadColor(ticket.prioridad)}>{ticket.prioridad}</span></td>
                          <td>{new Date(ticket.fecha_creacion).toLocaleDateString()}</td>
                          <td>
                            <div className="btn-group" role="group">
                              <button className="btn btn-warning btn-sm" onClick={()=>{
                                const titulo = prompt("Nuevo título",ticket.titulo);
                                const descripcion = prompt("Nueva descripción",ticket.descripcion);
                                if(titulo!==null && descripcion!==null) actualizarTicket(ticket.id,{...ticket,titulo,descripcion});
                              }}>Modificar</button>
                              <button className="btn btn-danger btn-sm" onClick={()=>{if(window.confirm("¿Eliminar ticket?")) eliminarTicket(ticket.id)}}>Eliminar</button>
                              {ticket.estado.toLowerCase()==='solucionado' && <button className="btn btn-success btn-sm" onClick={()=>cerrarTicket(ticket.id)}>Cerrar</button>}
                              {ticket.estado.toLowerCase()==='cerrado' && !ticket.calificacion && <button className="btn btn-warning btn-sm" onClick={()=>{
                                const cal = prompt("Califica (1-5)");
                                const com = prompt("Comentario (opcional)");
                                if(cal) evaluarTicket(ticket.id,parseInt(cal),com||'');
                              }}>Evaluar</button>}
                              {ticket.estado.toLowerCase()==='cerrado' && ticket.calificacion && <button className="btn btn-danger btn-sm" onClick={()=>reabrirTicket(ticket.id)}>Reabrir</button>}
                            </div>
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
    </div>
  );
}

export default ClientePage;