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

export function AnalistaPage() {
    const { store, logout, connectWebSocket, disconnectWebSocket, joinRoom } = useGlobalReducer();
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [userData, setUserData] = useState(null);
    const [showRecomendacionModal, setShowRecomendacionModal] = useState(false);
    const [recomendacion, setRecomendacion] = useState(null);
    const [loadingRecomendacion, setLoadingRecomendacion] = useState(false);
    const [errorRecomendacion, setErrorRecomendacion] = useState('');
    const [ticketSeleccionado, setTicketSeleccionado] = useState(null);

    // Función helper para actualizar tickets sin recargar la página
    const actualizarTickets = async () => {
        try {
            const token = store.auth.token;
            const ticketsResponse = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/tickets/analista`, {
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

    // Cargar datos del usuario
    useEffect(() => {
        const cargarDatosUsuario = async () => {
            try {
                const token = store.auth.token;
                const userId = tokenUtils.getUserId(token);
                
                if (userId) {
                    const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/analistas/${userId}`, {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    });
                    
                    if (response.ok) {
                        const data = await response.json();
                        setUserData(data);
                    }
                }
            } catch (err) {
                console.error('Error al cargar datos del usuario:', err);
            }
        };

        if (store.auth.isAuthenticated && store.auth.token) {
            cargarDatosUsuario();
        }
    }, [store.auth.isAuthenticated, store.auth.token]);

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

    // Actualizar tickets cuando lleguen notificaciones WebSocket
    useEffect(() => {
        if (store.websocket.notifications.length > 0) {
            const lastNotification = store.websocket.notifications[store.websocket.notifications.length - 1];
            console.log('🔔 ANALISTA - Notificación recibida:', lastNotification);
            
            // Actualización inmediata para eventos específicos (sin esperar)
            if (lastNotification.tipo === 'asignado' || lastNotification.tipo === 'estado_cambiado' || lastNotification.tipo === 'iniciado' || lastNotification.tipo === 'escalado') {
                console.log('⚡ ANALISTA - Actualización inmediata por notificación:', lastNotification.tipo);
                // Los datos ya están en el store por el WebSocket - actualización instantánea
            }
            
            // Sincronización con servidor en segundo plano para TODOS los eventos
            console.log('🔄 ANALISTA - Sincronizando con servidor en segundo plano:', lastNotification.tipo);
            actualizarTickets();
        }
    }, [store.websocket.notifications]);

    // Cargar tickets asignados al analista
    useEffect(() => {
        const cargarTickets = async () => {
            try {
                setLoading(true);
                const token = store.auth.token;

                const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/tickets/analista`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.ok) {
                    throw new Error('Error al cargar tickets');
                }

                const data = await response.json();
                setTickets(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        cargarTickets();
    }, [store.auth.token]);

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
            await actualizarTickets();
        } catch (err) {
            setError(err.message);
        }
    };

    const agregarComentario = async (ticketId, texto = null) => {
        try {
            const token = store.auth.token;
            let comentarioTexto = texto;
            if (!comentarioTexto) {
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
                comentarioTexto = prompt('Agregar comentario:', existentes ? existentes + '\n' : '');
                if (!comentarioTexto) return;
            }
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/comentarios`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    id_ticket: ticketId,
                    texto: comentarioTexto
                })
            });

            if (!response.ok) {
                throw new Error('Error al agregar comentario');
            }

            // Actualizar tickets sin recargar la página
            await actualizarTickets();
        } catch (err) {
            setError(err.message);
        }
    };

    const verComentarios = async (ticketId) => {
        try {
            const token = store.auth.token;
            const resp = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/tickets/${ticketId}/comentarios`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            if (resp.ok) {
                const data = await resp.json();
                const comentarios = data.map(c => `${c.autor?.rol || 'Sistema'}: ${c.texto}`).join('\n\n');
                alert(`Comentarios del ticket #${ticketId}:\n\n${comentarios || 'No hay comentarios'}`);
            } else {
                throw new Error('Error al cargar comentarios');
            }
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
            {/* Header con información del analista */}
            <div className="row mb-4">
                <div className="col-12">
                    <div className="card">
                        <div className="card-body d-flex justify-content-between align-items-center">
                            <div>
                                <h2 className="mb-1">Panel de Analista</h2>
                                <p className="text-muted mb-0">Bienvenido, {userData?.nombre} {userData?.apellido}</p>
                                <small className="text-info">Especialidad: {userData?.especialidad}</small>
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
                                <Link to="/analistas" className="btn btn-primary">Ir al CRUD</Link>
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

            {/* Lista de tickets asignados */}
            <div className="row">
                <div className="col-12">
                    <div className="card">
                        <div className="card-header">
                            <h5 className="mb-0">Mis Tickets Asignados</h5>
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
                                    <p className="text-muted">No tienes tickets asignados.</p>
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
                                                        {new Date(ticket.fecha_creacion).toLocaleDateString()}
                                                    </td>
                                                    <td>
                                                        <div className="btn-group" role="group">
                                                            {ticket.estado.toLowerCase() === 'en_espera' && (
                                                                <>
                                                                    <button
                                                                        className="btn btn-primary btn-sm"
                                                                        onClick={() => cambiarEstadoTicket(ticket.id, 'en_proceso')}
                                                                        title="Comenzar a trabajar"
                                                                    >
                                                                        <i className="fas fa-play"></i> Iniciar
                                                                    </button>
                                                                    <button
                                                                        className="btn btn-warning btn-sm"
                                                                        onClick={() => {
                                                                            const comentario = prompt('Comentario sobre la escalación:');
                                                                            if (comentario) {
                                                                                agregarComentario(ticket.id, comentario);
                                                                                cambiarEstadoTicket(ticket.id, 'en_espera');
                                                                            }
                                                                        }}
                                                                        title="Escalar al supervisor sin iniciar"
                                                                    >
                                                                        <i className="fas fa-arrow-up"></i> Escalar
                                                                    </button>
                                                                </>
                                                            )}
                                                              {ticket.estado.toLowerCase() === 'en_proceso' && (
                                                                  <>
                                                                      <button
                                                                          className="btn btn-success btn-sm"
                                                                          onClick={() => cambiarEstadoTicket(ticket.id, 'solucionado')}
                                                                          title="Marcar como solucionado"
                                                                      >
                                                                          <i className="fas fa-check"></i> Solucionar
                                                                      </button>
                                                                      <button
                                                                          className="btn btn-warning btn-sm"
                                                                          onClick={() => {
                                                                              const comentario = prompt('Comentario sobre la escalación:');
                                                                              if (comentario) {
                                                                                  agregarComentario(ticket.id, comentario);
                                                                                  cambiarEstadoTicket(ticket.id, 'en_espera');
                                                                              }
                                                                          }}
                                                                          title="Escalar al supervisor"
                                                                      >
                                                                          <i className="fas fa-arrow-up"></i> Escalar
                                                                      </button>
                                                                  </>
                                                              )}
                                                              <button
                                                                  className="btn btn-info btn-sm"
                                                                  onClick={() => agregarComentario(ticket.id)}
                                                                  title="Agregar comentario"
                                                              >
                                                                  <i className="fas fa-comment"></i> Comentar
                                                              </button>
                                                              <button
                                                                  className="btn btn-secondary btn-sm"
                                                                  onClick={() => verComentarios(ticket.id)}
                                                                  title="Ver comentarios del supervisor"
                                                              >
                                                                  <i className="fas fa-eye"></i> Ver Comentarios
                                                              </button>
                                                              <button
                                                                  className="btn btn-info btn-sm"
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

export default AnalistaPage;