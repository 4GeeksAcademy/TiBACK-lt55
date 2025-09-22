import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import useGlobalReducer from '../../hooks/useGlobalReducer';
import RecomendacionModal from '../../components/RecomendacionModal';

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

export function SupervisorPage() {
    const { store, logout, connectWebSocket, disconnectWebSocket, joinRoom } = useGlobalReducer();
    const [tickets, setTickets] = useState([]);
    const [ticketsCerrados, setTicketsCerrados] = useState([]);
    const [analistas, setAnalistas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingCerrados, setLoadingCerrados] = useState(false);
    const [error, setError] = useState('');
    const [showCerrados, setShowCerrados] = useState(false);
    const [showRecomendacionModal, setShowRecomendacionModal] = useState(false);
    const [recomendacion, setRecomendacion] = useState(null);
    const [loadingRecomendacion, setLoadingRecomendacion] = useState(false);
    const [errorRecomendacion, setErrorRecomendacion] = useState('');
    const [ticketSeleccionado, setTicketSeleccionado] = useState(null);

    // Función helper para actualizar tickets sin recargar la página
    const actualizarTickets = async () => {
        try {
            const token = store.auth.token;
            const ticketsResponse = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/tickets/supervisor`, {
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

    // Función para cargar tickets cerrados
    const cargarTicketsCerrados = async () => {
        try {
            setLoadingCerrados(true);
            const token = store.auth.token;
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/tickets/supervisor/cerrados`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            if (response.ok) {
                const ticketsData = await response.json();
                setTicketsCerrados(ticketsData);
            }
        } catch (err) {
            console.error('Error al cargar tickets cerrados:', err);
        } finally {
            setLoadingCerrados(false);
        }
    };

    // Función para actualizar la lista de analistas
    const actualizarAnalistas = async () => {
        try {
            const token = store.auth.token;
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/analistas`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            if (response.ok) {
                const analistasData = await response.json();
                setAnalistas(analistasData);
                // También actualizar el store global
                dispatch({ type: "analistas_set_list", payload: analistasData });
            }
        } catch (err) {
            console.error('Error al actualizar analistas:', err);
        }
    };

    // Función helper para actualizar tanto tickets activos como cerrados
    const actualizarTodasLasTablas = async () => {
        await actualizarTickets();
        if (showCerrados) {
            await cargarTicketsCerrados();
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

    // Cargar tickets y analistas
    useEffect(() => {
        const cargarDatos = async () => {
            try {
                setLoading(true);
                const token = store.auth.token;

                // Cargar tickets
                const ticketsResponse = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/tickets/supervisor`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    } 
                });

                if (ticketsResponse.ok) {
                    const ticketsData = await ticketsResponse.json();
                    setTickets(ticketsData);
                }

                // Cargar analistas
                const analistasResponse = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/analistas`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (analistasResponse.ok) {
                    const analistasData = await analistasResponse.json();
                    console.log('Analistas cargados:', analistasData);
                    setAnalistas(analistasData);
                } else {
                    console.error('Error al cargar analistas:', analistasResponse.status, analistasResponse.statusText);
                    setError(`Error al cargar la lista de analistas: ${analistasResponse.status} ${analistasResponse.statusText}`);
                }

            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        cargarDatos();
    }, [store.auth.token]);

    // Actualizar tickets cuando lleguen notificaciones WebSocket
    useEffect(() => {
        if (store.websocket.notifications.length > 0) {
            const lastNotification = store.websocket.notifications[store.websocket.notifications.length - 1];
            console.log('🔔 SUPERVISOR - Notificación recibida:', lastNotification);
            
            // Actualización inmediata para eventos específicos (sin esperar)
            if (lastNotification.tipo === 'asignado' || lastNotification.tipo === 'estado_cambiado' || lastNotification.tipo === 'iniciado' || lastNotification.tipo === 'escalado') {
                console.log('⚡ SUPERVISOR - Actualización inmediata por notificación:', lastNotification.tipo);
                // Los datos ya están en el store por el WebSocket - actualización instantánea
            }
            
            // Actualización específica para analistas
            if (lastNotification.tipo === 'analista_creado') {
                console.log('⚡ SUPERVISOR - Actualizando lista de analistas por notificación:', lastNotification.tipo);
                console.log('📊 SUPERVISOR - Datos del analista recibidos:', lastNotification.analista);
                console.log('📊 SUPERVISOR - Lista actual de analistas antes:', analistas.length);
                
                // Actualizar estado local inmediatamente si hay datos del analista
                if (lastNotification.analista) {
                    setAnalistas(prev => {
                        const newList = [...prev, lastNotification.analista];
                        console.log('📊 SUPERVISOR - Nueva lista de analistas:', newList.length);
                        return newList;
                    });
                }
                // También hacer actualización completa para asegurar consistencia
                actualizarAnalistas();
            }
            
            // Sincronización con servidor en segundo plano para TODOS los eventos
            console.log('🔄 SUPERVISOR - Sincronizando con servidor en segundo plano:', lastNotification.tipo);
            actualizarTodasLasTablas();
        }
    }, [store.websocket.notifications, showCerrados]);

    const asignarTicket = async (ticketId, analistaId) => {
        try {
            const token = store.auth.token;
            
            // Buscar el ticket para determinar si es una reasignación
            const ticket = tickets.find(t => t.id === ticketId);
            const esReasignacion = ticket && ticket.asignacion_actual && ticket.asignacion_actual.id_analista;
            
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/tickets/${ticketId}/asignar`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    id_analista: analistaId, 
                    es_reasignacion: esReasignacion
                })
            });

            if (!response.ok) {
                throw new Error('Error al asignar ticket');
            }

            // Actualizar tickets sin recargar la página
            await actualizarTodasLasTablas();
        } catch (err) {
            setError(err.message);
        }
    };

    const cambiarEstadoTicket = async (ticketId, nuevoEstado) => {
        try {
            const token = store.auth.token;
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/tickets/${ticketId}/estado`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ estado: nuevoEstado })
            });

            if (!response.ok) {
                throw new Error('Error al cambiar estado del ticket');
            }

            // Actualizar tickets sin recargar la página
            await actualizarTodasLasTablas();
        } catch (err) {
            setError(err.message);
        }
    };

    const agregarComentario = async (ticketId) => {
        try {
            const token = store.auth.token;
            let existentes = '';
            const resp = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/tickets/${ticketId}/comentarios`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            if (resp.ok) {
                const data = await resp.json();
                existentes = data.map(c => `${c.autor?.rol || 'Sistema'}: ${c.texto}`).join('\n');
            }
            const texto = prompt('Agregar comentario:', existentes ? existentes + '\n' : '');
            if (!texto) return;
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/comentarios`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ id_ticket: ticketId, texto })
            });
            if (!response.ok) throw new Error('Error al agregar comentario');
            
            // Actualizar tickets sin recargar la página
            await actualizarTodasLasTablas();
        } catch (err) {
            setError(err.message);
        }
    };

    const generarRecomendacion = async (ticket) => {
        try {
            setLoadingRecomendacion(true);
            setErrorRecomendacion('');
            setTicketSeleccionado(ticket);
            setShowRecomendacionModal(true);

            const token = store.auth.token;
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/tickets/${ticket.id}/recomendacion-ia`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al generar recomendación');
            }

            const data = await response.json();
            setRecomendacion(data.recomendacion);
        } catch (err) {
            setErrorRecomendacion(err.message);
        } finally {
            setLoadingRecomendacion(false);
        }
    };

    const cerrarModalRecomendacion = () => {
        setShowRecomendacionModal(false);
        setRecomendacion(null);
        setErrorRecomendacion('');
        setTicketSeleccionado(null);
    };

    const getEstadoColor = (estado) => {
        switch (estado.toLowerCase()) {
            case 'creado': return 'badge bg-secondary';
            case 'en_espera': return 'badge bg-warning';
            case 'en_proceso': return 'badge bg-primary';
            case 'solucionado': return 'badge bg-success';
            case 'cerrado': return 'badge bg-dark';
            case 'cerrado_por_supervisor': return 'badge bg-dark';
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
            {/* Header con información del supervisor */}
            <div className="row mb-4">
                <div className="col-12">
                    <div className="card">
                        <div className="card-body d-flex justify-content-between align-items-center">
                            <div>
                                <h2 className="mb-1">Panel de Supervisor</h2>
                                <p className="text-muted mb-0">Bienvenido, {store.auth.user?.nombre} {store.auth.user?.apellido}</p>
                                <small className="text-info">Área: {store.auth.user?.area_responsable}</small>
                                <div className="mt-2 d-flex align-items-center">
                                    <span className={`badge ${store.websocket.connected ? 'bg-success' : 'bg-danger'} me-2`}>
                                        <i className={`fas ${store.websocket.connected ? 'fa-wifi' : 'fa-wifi-slash'} me-1`}></i>
                                        {store.websocket.connected ? 'Conectado' : 'Desconectado'}
                                    </span>
                                    {store.websocket.notifications.length > 0 && (
                                        <span className="badge bg-info">
                                            <i className="fas fa-bell me-1"></i>
                                            {store.websocket.notifications.length} notificaciones
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="d-flex gap-2">
                                <Link to="/supervisores" className="btn btn-primary">Ir al CRUD</Link>
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

            {/* Lista de tickets */}
            <div className="row">
                <div className="col-12">
                    <div className="card">
                        <div className="card-header d-flex justify-content-between align-items-center">
                            <h5 className="mb-0">Todos los Tickets</h5>
                            <small className="text-muted">
                                {analistas.length} analista{analistas.length !== 1 ? 's' : ''} disponible{analistas.length !== 1 ? 's' : ''}
                            </small>
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
                                    <p className="text-muted">No hay tickets disponibles.</p>
                                </div>
                            ) : (
                                <div className="table-responsive">
                                    <table className="table table-hover">
                                        <thead>
                                            <tr>
                                                <th>ID</th>
                                                <th>Cliente</th>
                                                <th>Título</th>
                                                <th>Estado</th>
                                                <th>Prioridad</th>
                                                <th>Analista Asignado</th>
                                                <th>Fecha Creación</th>
                                                <th>Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {tickets.map((ticket) => (
                                                <tr key={ticket.id}>
                                                    <td>#{ticket.id}</td>
                                                    <td>
                                                        {ticket.cliente?.nombre} {ticket.cliente?.apellido}
                                                    </td>
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
                                                        {ticket.asignacion_actual?.analista ? 
                                                            `${ticket.asignacion_actual.analista.nombre} ${ticket.asignacion_actual.analista.apellido}` :
                                                            'Sin asignar'
                                                        }
                                                    </td>
                                                    <td>
                                                        {new Date(ticket.fecha_creacion).toLocaleDateString()}
                                                    </td>
                                                    <td>
                                                        <div className="btn-group" role="group">
                                                            {ticket.estado.toLowerCase() === 'creado' && (
                                                                <select
                                                                    className="form-select form-select-sm"
                                                                    onChange={(e) => {
                                                                        if (e.target.value) {
                                                                            asignarTicket(ticket.id, e.target.value);
                                                                        }
                                                                    }}
                                                                    defaultValue=""
                                                                >
                                                                    <option value="">
                                                                        {analistas.length > 0 ? 'Asignar a...' : 'No hay analistas disponibles'}
                                                                    </option>
                                                                    {analistas.map(analista => (
                                                                        <option key={analista.id} value={analista.id}>
                                                                            {analista.nombre} {analista.apellido} - {analista.especialidad}
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                            )}
                                                            {ticket.estado.toLowerCase() === 'en_espera' && !ticket.asignacion_actual && (
                                                                <span className="badge bg-warning" title="Ticket escalado por un analista">
                                                                    <i className="fas fa-arrow-up"></i> Escalado
                                                                </span>
                                                            )}
                                                            {ticket.estado.toLowerCase() === 'en_espera' && ticket.asignacion_actual && (
                                                                <span className="badge bg-success">
                                                                    <i className="fas fa-user-check"></i> Asignado
                                                                </span>
                                                            )}
                                                            {ticket.estado.toLowerCase() === 'solucionado' && (
                                                                <div className="d-flex gap-1">
                                                                    <button
                                                                        className="btn btn-success btn-sm"
                                                                        onClick={() => cambiarEstadoTicket(ticket.id, 'cerrado')}
                                                                        title="Cerrar ticket"
                                                                    >
                                                                        <i className="fas fa-check"></i> Cerrar
                                                                    </button>
                                                                    <button
                                                                        className="btn btn-danger btn-sm"
                                                                        onClick={() => cambiarEstadoTicket(ticket.id, 'reabierto')}
                                                                        title="Reabrir ticket"
                                                                    >
                                                                        <i className="fas fa-redo"></i> Reabrir
                                                                    </button>
                                                                </div>
                                                            )}
                                                            {ticket.estado.toLowerCase() === 'reabierto' && (
                                                                <select
                                                                    className="form-select form-select-sm"
                                                                    onChange={(e) => {
                                                                        if (e.target.value) {
                                                                            asignarTicket(ticket.id, e.target.value);
                                                                        }
                                                                    }}
                                                                    defaultValue=""
                                                                >
                                                                    <option value="">
                                                                        {analistas.length > 0 ? 'Reasignar a...' : 'No hay analistas disponibles'}
                                                                    </option>
                                                                    {analistas.map(analista => (
                                                                        <option key={analista.id} value={analista.id}>
                                                                            {analista.nombre} {analista.apellido} - {analista.especialidad}
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                            )}
                                                            {ticket.estado.toLowerCase() === 'en_espera' && !ticket.asignacion_actual && (
                                                                <select
                                                                    className="form-select form-select-sm"
                                                                    onChange={(e) => {
                                                                        if (e.target.value) {
                                                                            asignarTicket(ticket.id, e.target.value);
                                                                        }
                                                                    }}
                                                                    defaultValue=""
                                                                >
                                                                    <option value="">
                                                                         Reasignar a...
                                                                    </option>
                                                                    {analistas.map(analista => (
                                                                        <option key={analista.id} value={analista.id}>
                                                                            {analista.nombre} {analista.apellido} - {analista.especialidad}
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                            )}
                                                            <button
                                                                className="btn btn-info btn-sm"
                                                                onClick={() => agregarComentario(ticket.id)}
                                                                title="Agregar comentario"
                                                            >
                                                                <i className="fas fa-comment"></i> Comentar
                                                            </button>
                                                            <button
                                                                className="btn btn-warning btn-sm"
                                                                onClick={() => generarRecomendacion(ticket)}
                                                                title="Generar recomendación con IA"
                                                                disabled={loadingRecomendacion}
                                                            >
                                                                <i className="fas fa-robot"></i> IA
                                                            </button>
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

            {/* Tabla de tickets cerrados */}
            <div className="row mt-4">
                <div className="col-12">
                    <div className="card">
                        <div className="card-header d-flex justify-content-between align-items-center">
                            <div className="d-flex align-items-center">
                                <h5 className="mb-0 me-2">Tickets Cerrados</h5>
                                {loadingCerrados && (
                                    <div className="spinner-border spinner-border-sm text-primary" role="status">
                                        <span className="visually-hidden">Actualizando...</span>
                                    </div>
                                )}
                            </div>
                            <button
                                className="btn btn-outline-secondary btn-sm"
                                onClick={() => {
                                    if (!showCerrados) {
                                        cargarTicketsCerrados();
                                    }
                                    setShowCerrados(!showCerrados);
                                }}
                                disabled={loadingCerrados}
                            >
                                <i className={`fas ${showCerrados ? 'fa-eye-slash' : 'fa-eye'} me-1`}></i>
                                {showCerrados ? 'Ocultar' : 'Mostrar'} Cerrados
                                {ticketsCerrados.length > 0 && (
                                    <span className="badge bg-secondary ms-2">{ticketsCerrados.length}</span>
                                )}
                            </button>
                        </div>
                        {showCerrados && (
                            <div className="card-body">
                                {loadingCerrados ? (
                                    <div className="text-center py-4">
                                        <div className="spinner-border text-primary" role="status">
                                            <span className="visually-hidden">Cargando tickets cerrados...</span>
                                        </div>
                                    </div>
                                ) : ticketsCerrados.length === 0 ? (
                                    <div className="text-center py-4">
                                        <p className="text-muted">No hay tickets cerrados.</p>
                                    </div>
                                ) : (
                                    <div className="table-responsive">
                                        <table className="table table-hover">
                                            <thead>
                                                <tr>
                                                    <th>ID</th>
                                                    <th>Cliente</th>
                                                    <th>Título</th>
                                                    <th>Estado</th>
                                                    <th>Prioridad</th>
                                                    <th>Analista Asignado</th>
                                                    <th>Fecha Cierre</th>
                                                    <th>Calificación</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {ticketsCerrados.map((ticket) => (
                                                    <tr key={ticket.id}>
                                                        <td>#{ticket.id}</td>
                                                        <td>
                                                            {ticket.cliente?.nombre} {ticket.cliente?.apellido}
                                                        </td>
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
                                                                {ticket.estado === 'cerrado_por_supervisor' ? 'Cerrado por Supervisor' : 'Cerrado por Cliente'}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <span className={getPrioridadColor(ticket.prioridad)}>
                                                                {ticket.prioridad}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            {ticket.asignacion_actual?.analista ? 
                                                                `${ticket.asignacion_actual.analista.nombre} ${ticket.asignacion_actual.analista.apellido}` :
                                                                'Sin asignar'
                                                            }
                                                        </td>
                                                        <td>
                                                            {ticket.fecha_cierre ? new Date(ticket.fecha_cierre).toLocaleDateString() : 'N/A'}
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
                                                                    {ticket.comentario && (
                                                                        <small className="text-muted ms-2" title={ticket.comentario}>
                                                                            <i className="fas fa-comment"></i>
                                                                        </small>
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                <span className="text-muted">Sin calificar</span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modal de Recomendación IA */}
            <RecomendacionModal
                isOpen={showRecomendacionModal}
                onClose={cerrarModalRecomendacion}
                recomendacion={recomendacion}
                loading={loadingRecomendacion}
                error={errorRecomendacion}
            />
        </div>
    );
}

export default SupervisorPage;