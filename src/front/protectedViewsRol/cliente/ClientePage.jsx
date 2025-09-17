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
    const [locationData, setLocationData] = useState({
        address: '',
        lat: null,
        lng: null
    });

    // Función helper para actualizar tickets sin recargar la página
    const actualizarTickets = async () => {
        try {
            const token = store.auth.token;
            const ticketsResponse = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/tickets/cliente`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            if (ticketsResponse.ok) {
                const ticketsData = await ticketsResponse.json();
                setTickets(ticketsData);
            }
        } catch (err) {
            console.error('Error al actualizar tickets:', err);
        }
    };

    // Cargar datos del usuario y tickets
    useEffect(() => {
        const cargarDatos = async () => {
            try {
                setLoading(true);
                const token = store.auth.token;
                const userId = tokenUtils.getUserId(token);

                // Cargar datos del usuario
                const userResponse = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/clientes/${userId}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (userResponse.ok) {
                    const userData = await userResponse.json();
                    setUserData(userData);
                    setLocationData({
                        address: userData.direccion || '',
                        lat: userData.latitude || null,
                        lng: userData.longitude || null
                    });
                }

                // Cargar tickets del cliente
                const ticketsResponse = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/tickets/cliente`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (!ticketsResponse.ok) {
                    throw new Error('Error al cargar tickets');
                }

                const ticketsData = await ticketsResponse.json();
                setTickets(ticketsData);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        cargarDatos();
    }, [store.auth.token]);

    const crearTicket = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const ticketData = {
            titulo: formData.get('titulo'),
            descripcion: formData.get('descripcion'),
            prioridad: formData.get('prioridad')
        };

        try {
            const token = store.auth.token;

            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/tickets`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(ticketData)
            });

            if (!response.ok) {
                throw new Error('Error al crear ticket');
            }

            // Actualizar tickets sin recargar la página
            await actualizarTickets();
        } catch (err) {
            setError(err.message);
        }
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

    const evaluarTicket = async (ticketId, calificacion, comentario) => {
        try {
            const token = store.auth.token;
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/tickets/${ticketId}/evaluar`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ calificacion, comentario })
            });

            if (!response.ok) {
                throw new Error('Error al evaluar ticket');
            }

            // Actualizar tickets sin recargar la página
            await actualizarTickets();
        } catch (err) {
            setError(err.message);
        }
    };

    const reabrirTicket = async (ticketId) => {
        try {
            const token = store.auth.token;
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/tickets/${ticketId}/estado`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ estado: 'reabierto' })
            });

            if (!response.ok) {
                throw new Error('Error al reabrir ticket');
            }

            // Actualizar tickets sin recargar la página
            await actualizarTickets();
        } catch (err) {
            setError(err.message);
        }
    };

    const cerrarTicket = async (ticketId) => {
        try {
            const token = store.auth.token;
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/tickets/${ticketId}/estado`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ estado: 'cerrado' })
            });

            if (!response.ok) {
                throw new Error('Error al cerrar ticket');
            }

            // Actualizar tickets sin recargar la página
            await actualizarTickets();
        } catch (err) {
            setError(err.message);
        }
    };

    const handleLocationChange = (location) => {
        setLocationData(location);
    };

    const updateLocation = async () => {
        try {
            setUpdatingLocation(true);
            const token = store.auth.token;
            const userId = tokenUtils.getUserId(token);
            
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/clientes/${userId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    direccion: locationData.address,
                    latitude: locationData.lat,
                    longitude: locationData.lng
                })
            });

            if (!response.ok) {
                throw new Error('Error al actualizar ubicación');
            }

            // Actualizar los datos locales
            setUserData(prev => ({
                ...prev,
                direccion: locationData.address,
                latitude: locationData.lat,
                longitude: locationData.lng
            }));
            
            alert('Ubicación actualizada exitosamente');
            setShowLocationForm(false);
        } catch (err) {
            setError(err.message);
        } finally {
            setUpdatingLocation(false);
        }
    };

    return (
        <div className="container py-4">
            {/* Header con información del usuario */}
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
                                            <span className="ms-1 w-50 ">{userData.direccion}</span>
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
                                <button
                                    className="btn btn-info"
                                    onClick={() => setShowLocationForm(!showLocationForm)}
                                >
                                    <i className="fas fa-map-marker-alt me-1"></i>
                                    {showLocationForm ? 'Ocultar Ubicación' : 'Actualizar Ubicación'}
                                </button>
                                <Link to="/clientes" className="btn btn-primary">Ir al CRUD</Link>
                                <button
                                    className="btn btn-outline-danger"
                                    onClick={logout}
                                >
                                    Cerrar Sesión
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {error && (
                <div className="alert alert-danger" role="alert">
                    {error}
                </div>
            )}

            {/* Formulario de ubicación */}
            {showLocationForm && (
                <div className="row mb-4">
                    <div className="col-12">
                        <div className="card">
                            <div className="card-header">
                                <h5 className="mb-0">
                                    <i className="fas fa-map-marker-alt me-2"></i>
                                    Actualizar Mi Ubicación
                                </h5>
                            </div>
                            <div className="card-body">
                                <GoogleMapsLocation
                                    onLocationChange={handleLocationChange}
                                    initialAddress={locationData.address}
                                    initialLat={locationData.lat}
                                    initialLng={locationData.lng}
                                />
                                <div className="mt-3 d-flex gap-2">
                                    <button
                                        className="btn btn-success"
                                        onClick={updateLocation}
                                        disabled={!locationData.address || updatingLocation}
                                    >
                                        {updatingLocation ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                                                Actualizando...
                                            </>
                                        ) : (
                                            <>
                                                <i className="fas fa-save me-1"></i>
                                                Guardar Ubicación
                                            </>
                                        )}
                                    </button>
                                    <button
                                        className="btn btn-secondary"
                                        onClick={() => setShowLocationForm(false)}
                                        disabled={updatingLocation}
                                    >
                                        <i className="fas fa-times me-1"></i>
                                        Cancelar
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Formulario para crear nuevo ticket */}
            <div className="row mb-4">
                <div className="col-12">
                    <div className="card">
                        <div className="card-header">
                            <h5 className="mb-0">Crear Nuevo Ticket</h5>
                        </div>
                        <div className="card-body">
                            <form onSubmit={crearTicket}>
                                <div className="row g-3">
                                    <div className="col-md-8">
                                        <label htmlFor="titulo" className="form-label">Título del Ticket *</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            id="titulo"
                                            name="titulo"
                                            required
                                            placeholder="Describe brevemente el problema"
                                        />
                                    </div>
                                    <div className="col-md-4">
                                        <label htmlFor="prioridad" className="form-label">Prioridad *</label>
                                        <select className="form-select" id="prioridad" name="prioridad" required>
                                            <option value="">Seleccionar...</option>
                                            <option value="baja">Baja</option>
                                            <option value="media">Media</option>
                                            <option value="alta">Alta</option>
                                        </select>
                                    </div>
                                    <div className="col-12">
                                        <label htmlFor="descripcion" className="form-label">Descripción Detallada *</label>
                                        <textarea
                                            className="form-control"
                                            id="descripcion"
                                            name="descripcion"
                                            rows="4"
                                            required
                                            placeholder="Describe detalladamente el problema que necesitas resolver"
                                        ></textarea>
                                    </div>
                                    <div className="col-12">
                                        <button type="submit" className="btn btn-primary">
                                            Crear Ticket
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>

            {/* Lista de tickets */}
            <div className="row">
                <div className="col-12">
                    <div className="card">
                        <div className="card-header">
                            <h5 className="mb-0">Mis Tickets</h5>
                        </div>
                        <div className="card-body">
                            {loading ? (
                                <div className="text-center py-4">
                                    <div className="spinner-border text-primary" role="status">
                                        <span className="visually-hidden">Cargando tickets...</span>
                                    </div>
                                </div>
                            ) : tickets.length === 0 ? (
                                <div className="text-center py-4">
                                    <p className="text-muted">No tienes tickets creados aún.</p>
                                </div>
                            ) : (
                                <div className="table-responsive">
                                    <table className="table table-hover">
                                        <thead>
                                            <tr>
                                                <th>ID</th>
                                                <th>Título</th>
                                                <th>Estado</th>
                                                <th>Prioridad</th>
                                                <th>Fecha Creación</th>
                                                <th>Calificación</th>
                                                <th>Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {tickets.map((ticket) => (
                                                <tr key={ticket.id}>
                                                    <td>#{ticket.id}</td>
                                                    <td>
                                                        <div>
                                                            <strong>{ticket.titulo}</strong>
                                                            <br />
                                                            <small className="text-muted">
                                                                {ticket.descripcion.length > 50
                                                                    ? `${ticket.descripcion.substring(0, 50)}...`
                                                                    : ticket.descripcion
                                                                }
                                                            </small>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <span className={getEstadoColor(ticket.estado)}>
                                                            {ticket.estado}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <span className={getPrioridadColor(ticket.prioridad)}>
                                                            {ticket.prioridad}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        {new Date(ticket.fecha_creacion).toLocaleDateString()}
                                                    </td>
                                                    <td>
                                                        {ticket.calificacion ? (
                                                            <div className="d-flex align-items-center">
                                                                {[...Array(5)].map((_, i) => (
                                                                    <i
                                                                        key={i}
                                                                        className={`fas fa-star ${i < ticket.calificacion ? 'text-warning' : 'text-muted'
                                                                            }`}
                                                                    ></i>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <span className="text-muted">Sin calificar</span>
                                                        )}
                                                    </td>
                                                    <td>
                                                        <div className="btn-group" role="group">
                                                            {ticket.estado.toLowerCase() === 'solucionado' && (
                                                                <button
                                                                    className="btn btn-success btn-sm"
                                                                    onClick={() => cerrarTicket(ticket.id)}
                                                                    title="Cerrar ticket"
                                                                >
                                                                    <i className="fas fa-check"></i> Cerrar
                                                                </button>
                                                            )}
                                                            {ticket.estado.toLowerCase() === 'cerrado' && !ticket.calificacion && (
                                                                <button
                                                                    className="btn btn-warning btn-sm"
                                                                    onClick={() => {
                                                                        const calificacion = prompt('Califica el servicio (1-5):');
                                                                        const comentario = prompt('Comentario (opcional):');
                                                                        if (calificacion && calificacion >= 1 && calificacion <= 5) {
                                                                            evaluarTicket(ticket.id, parseInt(calificacion), comentario || '');
                                                                        }
                                                                    }}
                                                                    title="Evaluar ticket"
                                                                >
                                                                    <i className="fas fa-star"></i> Evaluar
                                                                </button>
                                                            )}
                                                            {ticket.estado.toLowerCase() === 'cerrado' && ticket.calificacion && (
                                                                <button
                                                                    className="btn btn-danger btn-sm"
                                                                    onClick={() => reabrirTicket(ticket.id)}
                                                                    title="Reabrir ticket"
                                                                >
                                                                    <i className="fas fa-redo"></i> Reabrir
                                                                </button>
                                                            )}
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
