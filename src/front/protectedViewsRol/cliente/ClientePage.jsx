import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  },
  getRole: (token) => {
    const payload = tokenUtils.decodeToken(token);
    return payload ? payload.role : null;
  }
};

export function ClientePage() {
    const navigate = useNavigate();
    const { store, logout, dispatch, connectWebSocket, disconnectWebSocket, joinRoom, joinTicketRoom } = useGlobalReducer();
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showInfoForm, setShowInfoForm] = useState(false);
    const [updatingInfo, setUpdatingInfo] = useState(false);
    const [userData, setUserData] = useState(null);
    const [solicitudesReapertura, setSolicitudesReapertura] = useState(new Set());
    const [infoData, setInfoData] = useState({
        nombre: '',
        apellido: '',
        email: '',
        telefono: '',
        direccion: '',
        lat: null,
        lng: null,
        password: '',
        confirmPassword: ''
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
                
                // Limpiar solicitudes de reapertura para tickets que ya no están en estado 'solucionado'
                setSolicitudesReapertura(prev => {
                    const newSet = new Set();
                    ticketsData.forEach(ticket => {
                        if (ticket.estado.toLowerCase() === 'solucionado' && prev.has(ticket.id)) {
                            newSet.add(ticket.id);
                        }
                    });
                    return newSet;
                });
            }
        } catch (err) {
            console.error('Error al actualizar tickets:', err);
        }
    };

    // Conectar WebSocket cuando el usuario esté autenticado
    useEffect(() => {
        if (store.auth.isAuthenticated && store.auth.token && !store.websocket.connected) {
            const socket = connectWebSocket(store.auth.token);
            if (socket) {
                const userId = tokenUtils.getUserId(store.auth.token);
                const role = tokenUtils.getRole(store.auth.token);
                joinRoom(socket, role, userId);
            }
        }

        // Cleanup al desmontar
        return () => {
            if (store.websocket.socket) {
                disconnectWebSocket(store.websocket.socket);
            }
        };
    }, [store.auth.isAuthenticated, store.auth.token]);

    // Unirse automáticamente a los rooms de tickets del cliente
    useEffect(() => {
        if (store.websocket.socket && tickets.length > 0) {
            tickets.forEach(ticket => {
                joinTicketRoom(store.websocket.socket, ticket.id);
            });
        }
    }, [store.websocket.socket, tickets]);

    // Actualizar tickets cuando lleguen notificaciones WebSocket
    useEffect(() => {
        if (store.websocket.notifications.length > 0) {
            const lastNotification = store.websocket.notifications[store.websocket.notifications.length - 1];
            console.log('🔔 CLIENTE - Notificación recibida:', lastNotification);
            
            // Manejo específico para tickets eliminados - sincronización inmediata
            if (lastNotification.tipo === 'eliminado' || lastNotification.tipo === 'ticket_eliminado') {
                console.log('🗑️ CLIENTE - TICKET ELIMINADO DETECTADO:', lastNotification);
                
                // Remover inmediatamente de la lista de tickets
                if (lastNotification.ticket_id) {
                    setTickets(prev => {
                        const ticketRemovido = prev.find(t => t.id === lastNotification.ticket_id);
                        if (ticketRemovido) {
                            console.log('🗑️ CLIENTE - Ticket eliminado removido de lista:', ticketRemovido.titulo);
                        }
                        return prev.filter(ticket => ticket.id !== lastNotification.ticket_id);
                    });
                    
                    // También remover de las solicitudes de reapertura si existe
                    setSolicitudesReapertura(prev => {
                        const newSet = new Set(prev);
                        newSet.delete(lastNotification.ticket_id);
                        return newSet;
                    });
                }
                return; // No continuar con el resto de la lógica
            }
            
            // Actualización ULTRA RÁPIDA para todos los eventos críticos
            if (lastNotification.tipo === 'asignado' || lastNotification.tipo === 'estado_cambiado' || lastNotification.tipo === 'iniciado' || lastNotification.tipo === 'escalado' || lastNotification.tipo === 'creado') {
                console.log('⚡ CLIENTE - ACTUALIZACIÓN INMEDIATA:', lastNotification.tipo);
                // Los datos ya están en el store por el WebSocket - actualización instantánea
            }
            
            // Sincronización ULTRA RÁPIDA con servidor para TODOS los eventos
            console.log('⚡ CLIENTE - SINCRONIZACIÓN INMEDIATA:', lastNotification.tipo);
            actualizarTickets();
        }
    }, [store.websocket.notifications]);

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
                    setInfoData({
                        nombre: userData.nombre === 'Pendiente' ? '' : userData.nombre || '',
                        apellido: userData.apellido === 'Pendiente' ? '' : userData.apellido || '',
                        email: userData.email || '',
                        telefono: userData.telefono === '0000000000' ? '' : userData.telefono || '',
                        direccion: userData.direccion === 'Pendiente' ? '' : userData.direccion || '',
                        lat: userData.latitude || null,
                        lng: userData.longitude || null,
                        password: '',
                        confirmPassword: ''
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

             // Limpiar el formulario después de crear el ticket exitosamente
            e.target.reset();

            // Actualizar tickets sin recargar la página
            await actualizarTickets();
            
            // Unirse al room del nuevo ticket
            if (store.websocket.socket) {
                const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/tickets/cliente`, {
                    headers: {
                        'Authorization': `Bearer ${store.auth.token}`,
                        'Content-Type': 'application/json'
                    }
                });
                if (response.ok) {
                    const ticketsData = await response.json();
                    const nuevoTicket = ticketsData[ticketsData.length - 1]; // El último ticket creado
                    if (nuevoTicket) {
                        joinTicketRoom(store.websocket.socket, nuevoTicket.id);
                    }
                }
            }
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

    const evaluarTicket = async (ticketId, calificacion) => {
        try {
            const token = store.auth.token;
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/tickets/${ticketId}/evaluar`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ calificacion })
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

    const solicitarReapertura = async (ticketId) => {
        try {
            const token = store.auth.token;
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/tickets/${ticketId}/estado`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ estado: 'solicitar_reapertura' })
            });

            if (!response.ok) {
                throw new Error('Error al solicitar reapertura');
            }

            // Agregar el ticket a las solicitudes de reapertura pendientes
            setSolicitudesReapertura(prev => new Set([...prev, ticketId]));

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
            // Solicitar calificación antes de cerrar
            const calificacion = prompt('Califica el servicio (1-5):');
            if (!calificacion || calificacion < 1 || calificacion > 5) {
                alert('Debes proporcionar una calificación válida entre 1 y 5');
                return;
            }

            const token = store.auth.token;
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/tickets/${ticketId}/estado`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    estado: 'cerrado',
                    calificacion: parseInt(calificacion)
                })
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

    const handleInfoChange = (e) => {
        const { name, value } = e.target;
        setInfoData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleLocationChange = (location) => {
        setInfoData(prev => ({
            ...prev,
            direccion: location.address,
            lat: location.lat,
            lng: location.lng
        }));
    };

    const updateInfo = async () => {
        try {
            // Validar contraseñas si se proporcionan
            if (infoData.password && infoData.password !== infoData.confirmPassword) {
                setError('Las contraseñas no coinciden');
                return;
            }

            if (infoData.password && infoData.password.length < 6) {
                setError('La contraseña debe tener al menos 6 caracteres');
                return;
            }

            setUpdatingInfo(true);
            const token = store.auth.token;
            const userId = tokenUtils.getUserId(token);
            
            // Preparar datos para actualizar
            const updateData = {
                nombre: infoData.nombre,
                apellido: infoData.apellido,
                email: infoData.email,
                telefono: infoData.telefono,
                direccion: infoData.direccion,
                latitude: infoData.lat,
                longitude: infoData.lng
            };

            // Solo incluir contraseña si se proporciona
            if (infoData.password) {
                updateData.contraseña_hash = infoData.password;
            }
            
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/clientes/${userId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updateData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al actualizar información');
            }

            // Actualizar los datos locales
            setUserData(prev => ({
                ...prev,
                nombre: infoData.nombre,
                apellido: infoData.apellido,
                email: infoData.email,
                telefono: infoData.telefono,
                direccion: infoData.direccion,
                latitude: infoData.lat,
                longitude: infoData.lng
            }));
            
            alert('Información actualizada exitosamente');
            setShowInfoForm(false);
            setError('');
        } catch (err) {
            setError(err.message);
        } finally {
            setUpdatingInfo(false);
        }
    };

    const generarRecomendacion = (ticket) => {
        // Redirigir a la vista de recomendación IA
        navigate(`/ticket/${ticket.id}/recomendacion-ia`);
    };

    // Función para verificar si un ticket tiene analista asignado
    const tieneAnalistaAsignado = (ticket) => {
        return ticket.asignacion_actual && ticket.asignacion_actual.analista;
    };

    // Función para obtener el nombre del analista asignado
    const getAnalistaAsignado = (ticket) => {
        if (tieneAnalistaAsignado(ticket)) {
            const analista = ticket.asignacion_actual.analista;
            return `${analista.nombre} ${analista.apellido}`;
        }
        return null;
    };

    // Función para obtener la fecha de asignación
    const getFechaAsignacion = (ticket) => {
        if (tieneAnalistaAsignado(ticket)) {
            const fecha = ticket.asignacion_actual.fecha_asignacion;
            return new Date(fecha).toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        }
        return null;
    };


    return (
        <div className="container py-4">
            {/* Header con información del usuario */}
            <div className="row mb-4">
                <div className="col-12">
                    <div className="card">
                        <div className="card-body d-flex justify-content-between align-items-center">
                            <div>
                                <h2 className="mb-1">
                                    Bienvenido, {userData?.nombre === 'Pendiente' ? 'Cliente' : userData?.nombre} {userData?.apellido === 'Pendiente' ? '' : userData?.apellido}
                                </h2>
                                <p className="text-muted mb-0">Panel de Cliente - Gestión de Tickets</p>
                                <div className="mt-2">
                                    <span className="badge bg-success">
                                        <i className="fas fa-wifi me-1"></i>
                                        Conectado
                                    </span>
                                </div>
                                {userData?.direccion && userData.direccion !== 'Pendiente' && (
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
                                {(!userData?.direccion || userData.direccion === 'Pendiente') && (
                                    <div className="mt-2">
                                        <small className="text-warning d-flex align-items-center">
                                            <i className="fas fa-exclamation-triangle me-1"></i>
                                            <span>Completa tu información personal para una mejor experiencia</span>
                                        </small>
                                    </div>
                                )}
                            </div>
                            <div className="d-flex gap-2">
                                <button
                                    className="btn btn-info"
                                    onClick={() => setShowInfoForm(!showInfoForm)}
                                >
                                    <i className="fas fa-user-edit me-1"></i>
                                    {showInfoForm ? 'Ocultar Información' : 'Actualizar Información'}
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

            {/* Formulario de información personal */}
            {showInfoForm && (
                <div className="row mb-4">
                    <div className="col-12">
                        <div className="card">
                            <div className="card-header">
                                <h5 className="mb-0">
                                    <i className="fas fa-user-edit me-2"></i>
                                    Actualizar Mi Información
                                </h5>
                            </div>
                            <div className="card-body">
                                <div className="row g-3">
                                    <div className="col-md-6">
                                        <label htmlFor="nombre" className="form-label">Nombre *</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            id="nombre"
                                            name="nombre"
                                            value={infoData.nombre}
                                            onChange={handleInfoChange}
                                            placeholder="Ingresa tu nombre"
                                            required
                                        />
                                    </div>
                                    <div className="col-md-6">
                                        <label htmlFor="apellido" className="form-label">Apellido *</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            id="apellido"
                                            name="apellido"
                                            value={infoData.apellido}
                                            onChange={handleInfoChange}
                                            placeholder="Ingresa tu apellido"
                                            required
                                        />
                                    </div>
                                    <div className="col-md-6">
                                        <label htmlFor="email" className="form-label">Email *</label>
                                        <input
                                            type="email"
                                            className="form-control"
                                            id="email"
                                            name="email"
                                            value={infoData.email}
                                            onChange={handleInfoChange}
                                            required
                                        />
                                    </div>
                                    <div className="col-md-6">
                                        <label htmlFor="telefono" className="form-label">Teléfono *</label>
                                        <input
                                            type="tel"
                                            className="form-control"
                                            id="telefono"
                                            name="telefono"
                                            value={infoData.telefono}
                                            onChange={handleInfoChange}
                                            placeholder="Ingresa tu teléfono"
                                            required
                                        />
                                    </div>
                                    <div className="col-12">
                                        <label className="form-label">Ubicación *</label>
                                        <GoogleMapsLocation
                                            onLocationChange={handleLocationChange}
                                            initialAddress={infoData.direccion}
                                            initialLat={infoData.lat}
                                            initialLng={infoData.lng}
                                        />
                                    </div>
                                    <div className="col-md-6">
                                        <label htmlFor="password" className="form-label">Nueva Contraseña (opcional)</label>
                                        <input
                                            type="password"
                                            className="form-control"
                                            id="password"
                                            name="password"
                                            value={infoData.password}
                                            onChange={handleInfoChange}
                                            minLength="6"
                                            placeholder="Dejar vacío para mantener la actual"
                                        />
                                    </div>
                                    <div className="col-md-6">
                                        <label htmlFor="confirmPassword" className="form-label">Confirmar Nueva Contraseña</label>
                                        <input
                                            type="password"
                                            className="form-control"
                                            id="confirmPassword"
                                            name="confirmPassword"
                                            value={infoData.confirmPassword}
                                            onChange={handleInfoChange}
                                            minLength="6"
                                            placeholder="Solo si cambias la contraseña"
                                        />
                                    </div>
                                </div>
                                <div className="mt-3 d-flex gap-2">
                                    <button
                                        className="btn btn-success"
                                        onClick={updateInfo}
                                        disabled={!infoData.nombre || !infoData.apellido || !infoData.email || !infoData.telefono || !infoData.direccion || updatingInfo}
                                    >
                                        {updatingInfo ? (
                                            <>
                                                <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                                                Actualizando...
                                            </>
                                        ) : (
                                            <>
                                                <i className="fas fa-save me-1"></i>
                                                Guardar Información
                                            </>
                                        )}
                                    </button>
                                    <button
                                        className="btn btn-secondary"
                                        onClick={() => setShowInfoForm(false)}
                                        disabled={updatingInfo}
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
                                                <th>Asignado a</th>
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
                                                        <div className="d-flex align-items-center gap-2">
                                                            <span className={getEstadoColor(ticket.estado)}>
                                                                {ticket.estado}
                                                            </span>
                                                            {tieneAnalistaAsignado(ticket) && (
                                                                <span 
                                                                    className="badge bg-success" 
                                                                    title={`Asignado a ${getAnalistaAsignado(ticket)}`}
                                                                >
                                                                    <i className="fas fa-user-tie me-1"></i>
                                                                    Analista
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <span className={getPrioridadColor(ticket.prioridad)}>
                                                            {ticket.prioridad}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        {tieneAnalistaAsignado(ticket) ? (
                                                            <div className="d-flex align-items-center gap-2">
                                                                <span className="badge bg-success">
                                                                    <i className="fas fa-user-tie me-1"></i>
                                                                    {getAnalistaAsignado(ticket)}
                                                                </span>
                                                                <small className="text-muted">
                                                                    {getFechaAsignacion(ticket)}
                                                                </small>
                                                            </div>
                                                        ) : (
                                                            <span className="text-muted">
                                                                <i className="fas fa-clock me-1"></i>
                                                                Sin asignar
                                                            </span>
                                                        )}
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
                                                            {ticket.estado.toLowerCase() === 'solucionado' && !solicitudesReapertura.has(ticket.id) && (
                                                                <>
                                                                    <button
                                                                        className="btn btn-success btn-sm"
                                                                        onClick={() => cerrarTicket(ticket.id)}
                                                                        title="Cerrar ticket y calificar"
                                                                    >
                                                                        <i className="fas fa-check"></i> Cerrar
                                                                    </button>
                                                                    <button
                                                                        className="btn btn-info btn-sm"
                                                                        onClick={() => solicitarReapertura(ticket.id)}
                                                                        title="Solicitar reapertura al supervisor"
                                                                    >
                                                                        <i className="fas fa-redo"></i> Reabrir
                                                                    </button>
                                                                </>
                                                            )}
                                                            {ticket.estado.toLowerCase() === 'solucionado' && solicitudesReapertura.has(ticket.id) && (
                                                                <div className="alert alert-warning py-2 px-3 mb-0" role="alert">
                                                                    <i className="fas fa-clock me-1"></i>
                                                                    <strong>Solicitud enviada</strong>
                                                                </div>
                                                            )}
                                                            {ticket.estado.toLowerCase() === 'cerrado' && !ticket.calificacion && (
                                                                <button
                                                                    className="btn btn-warning btn-sm"
                                                                    onClick={() => {
                                                                        const calificacion = prompt('Califica el servicio (1-5):');
                                                                        if (calificacion && calificacion >= 1 && calificacion <= 5) {
                                                                            evaluarTicket(ticket.id, parseInt(calificacion));
                                                                        }
                                                                    }}
                                                                    title="Evaluar ticket"
                                                                >
                                                                    <i className="fas fa-star"></i> Evaluar
                                                                </button>
                                                            )}
                                                            <Link
                                                                to={`/ticket/${ticket.id}/comentarios`}
                                                                className="btn btn-info btn-sm"
                                                                title="Ver y agregar comentarios"
                                                            >
                                                                <i className="fas fa-comments"></i> Comentar
                                                            </Link>
                                                            <button
                                                                className="btn btn-warning btn-sm"
                                                                onClick={() => generarRecomendacion(ticket)}
                                                                title="Generar recomendación con IA"
                                                            >
                                                                <i className="fas fa-robot"></i> IA
                                                            </button>
                                                            <Link
                                                                to={`/ticket/${ticket.id}/chat-analista-cliente`}
                                                                className={`btn btn-sm ${
                                                                    tieneAnalistaAsignado(ticket) 
                                                                        ? 'btn-success' 
                                                                        : 'btn-primary'
                                                                }`}
                                                                title={
                                                                    tieneAnalistaAsignado(ticket) 
                                                                        ? `Chat con ${getAnalistaAsignado(ticket)} - Asignado el ${getFechaAsignacion(ticket)}` 
                                                                        : "Chat con analista - Sin asignar"
                                                                }
                                                            >
                                                                <i className={`fas ${
                                                                    tieneAnalistaAsignado(ticket) 
                                                                        ? 'fa-signal' 
                                                                        : 'fa-comments'
                                                                }`}></i> 
                                                                {tieneAnalistaAsignado(ticket) ? ' Conectado' : ' Chat'}
                                                            </Link>
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
