import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useGlobalReducer from '../../hooks/useGlobalReducer';

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
    const navigate = useNavigate();
    const { store, logout, connectWebSocket, disconnectWebSocket, joinRoom } = useGlobalReducer();
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showInfoForm, setShowInfoForm] = useState(false);
    const [updatingInfo, setUpdatingInfo] = useState(false);
    const [userData, setUserData] = useState(null);
    const [infoData, setInfoData] = useState({
        nombre: '',
        apellido: '',
        email: '',
        especialidad: '',
        password: '',
        confirmPassword: ''
    });

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
                        setInfoData({
                            nombre: data.nombre === 'Pendiente' ? '' : data.nombre || '',
                            apellido: data.apellido === 'Pendiente' ? '' : data.apellido || '',
                            email: data.email || '',
                            especialidad: data.especialidad || '',
                            password: '',
                            confirmPassword: ''
                        });
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

    // Actualizar tickets cuando lleguen notificaciones WebSocket (optimizado)
    useEffect(() => {
        if (store.websocket.notifications.length > 0) {
            const lastNotification = store.websocket.notifications[store.websocket.notifications.length - 1];
            
            // Manejo específico para tickets eliminados - sincronización inmediata
            if (lastNotification.tipo === 'eliminado' || lastNotification.tipo === 'ticket_eliminado') {
                console.log('🗑️ ANALISTA - TICKET ELIMINADO DETECTADO:', lastNotification);
                
                // Remover inmediatamente de la lista de tickets
                if (lastNotification.ticket_id) {
                    setTickets(prev => {
                        const ticketRemovido = prev.find(t => t.id === lastNotification.ticket_id);
                        if (ticketRemovido) {
                            console.log('🗑️ ANALISTA - Ticket eliminado removido de lista:', ticketRemovido.titulo);
                        }
                        return prev.filter(ticket => ticket.id !== lastNotification.ticket_id);
                    });
                }
                return; // No continuar con el resto de la lógica
            }
            
            // Solo actualizar para eventos relevantes para analistas
            const eventosRelevantes = ['asignado', 'estado_cambiado', 'iniciado', 'escalado', 'ticket_actualizado'];
            if (eventosRelevantes.includes(lastNotification.tipo)) {
                // Para escalaciones, actualizar inmediatamente
                if (lastNotification.tipo === 'escalado' || lastNotification.tipo === 'asignado' || lastNotification.tipo === 'iniciado') {
                    console.log('⚡ ANALISTA - ACTUALIZACIÓN INMEDIATA:', lastNotification.tipo);
                    actualizarTickets();
                } else {
                    // Debounce mínimo para otros eventos
                    const timeoutId = setTimeout(() => {
                        console.log('🔄 ANALISTA - Actualización con debounce mínimo');
                        actualizarTickets();
                    }, 500); // 0.5 segundos de debounce mínimo
                    
                    return () => clearTimeout(timeoutId);
                }
            }
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

    const generarRecomendacion = (ticket) => {
        // Redirigir a la vista de recomendación IA
        navigate(`/ticket/${ticket.id}/recomendacion-ia`);
    };

    const handleInfoChange = (e) => {
        const { name, value } = e.target;
        setInfoData(prev => ({
            ...prev,
            [name]: value
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
                especialidad: infoData.especialidad
            };

            // Solo incluir contraseña si se proporciona
            if (infoData.password) {
                updateData.contraseña_hash = infoData.password;
            }
            
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/analistas/${userId}`, {
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
                especialidad: infoData.especialidad
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
                                <h2 className="mb-1">
                                    Bienvenido, {userData?.nombre === 'Pendiente' ? 'Analista' : userData?.nombre} {userData?.apellido === 'Pendiente' ? '' : userData?.apellido}
                                </h2>
                                <p className="text-muted mb-0">Panel de Analista - Gestión de Tickets</p>
                                <div className="mt-2">
                                    <span className="badge bg-success">
                                        <i className="fas fa-wifi me-1"></i>
                                        Conectado
                                    </span>
                                </div>
                                {userData?.especialidad && userData.especialidad !== 'Pendiente' && (
                                    <div className="mt-2">
                                        <small className="text-info d-flex align-items-center">
                                            <i className="fas fa-cog me-1"></i>
                                            <span className="fw-bold">Especialidad:</span>
                                            <span className="ms-1">{userData.especialidad}</span>
                                        </small>
                                    </div>
                                )}
                                {(!userData?.especialidad || userData.especialidad === 'Pendiente') && (
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
                                        <label htmlFor="especialidad" className="form-label">Especialidad *</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            id="especialidad"
                                            name="especialidad"
                                            value={infoData.especialidad}
                                            onChange={handleInfoChange}
                                            placeholder="Ingresa tu especialidad"
                                            required
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
                                        disabled={!infoData.nombre || !infoData.apellido || !infoData.email || !infoData.especialidad || updatingInfo}
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
                                                    <td>
                                                        <div className="d-flex align-items-center">
                                                            <span className="me-2">#{ticket.id}</span>
                                                            {ticket.url_imagen ? (
                                                                <img 
                                                                    src={ticket.url_imagen} 
                                                                    alt="Imagen del ticket" 
                                                                    className="img-thumbnail"
                                                                    style={{ width: '40px', height: '40px', objectFit: 'cover' }}
                                                                />
                                                            ) : (
                                                                <span className="text-muted">
                                                                    <i className="fas fa-image" style={{ fontSize: '12px' }}></i>
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
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
                                                                        onClick={() => cambiarEstadoTicket(ticket.id, 'en_espera')}
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
                                                                          onClick={() => cambiarEstadoTicket(ticket.id, 'en_espera')}
                                                                          title="Escalar al supervisor"
                                                                      >
                                                                          <i className="fas fa-arrow-up"></i> Escalar
                                                                      </button>
                                                                  </>
                                                              )}
                                                              <Link
                                                                  to={`/ticket/${ticket.id}/comentarios`}
                                                                  className="btn btn-info btn-sm"
                                                                  title="Ver y agregar comentarios"
                                                              >
                                                                  <i className="fas fa-comments"></i> Comentar
                                                              </Link>
                                                              <button
                                                                  className="btn btn-info btn-sm"
                                                                  onClick={() => generarRecomendacion(ticket)}
                                                                  title="Generar recomendación con IA"
                                                              >
                                                                  <i className="fas fa-robot"></i> IA
                                                              </button>
                                                              <Link
                                                                  to={`/ticket/${ticket.id}/chat-supervisor-analista`}
                                                                  className="btn btn-secondary btn-sm"
                                                                  title="Chat con supervisor"
                                                              >
                                                                  <i className="fas fa-user-shield"></i> Chat Sup
                                                              </Link>
                                                              <Link
                                                                  to={`/ticket/${ticket.id}/chat-analista-cliente`}
                                                                  className="btn btn-success btn-sm"
                                                                  title="Chat con cliente"
                                                              >
                                                                  <i className="fas fa-user"></i> Chat Cliente
                                                              </Link>
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

export default AnalistaPage;