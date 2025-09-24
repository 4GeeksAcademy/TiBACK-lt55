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

export function SupervisorPage() {
    const navigate = useNavigate();
    const { store, logout, dispatch, connectWebSocket, disconnectWebSocket, joinRoom } = useGlobalReducer();
    const [tickets, setTickets] = useState([]);
    const [ticketsCerrados, setTicketsCerrados] = useState([]);
    const [analistas, setAnalistas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingCerrados, setLoadingCerrados] = useState(false);
    const [error, setError] = useState('');
    const [showCerrados, setShowCerrados] = useState(false);
    const [showInfoForm, setShowInfoForm] = useState(false);
    const [updatingInfo, setUpdatingInfo] = useState(false);
    const [userData, setUserData] = useState(null);
    const [infoData, setInfoData] = useState({
        nombre: '',
        apellido: '',
        email: '',
        area_responsable: '',
        password: '',
        confirmPassword: ''
    });

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

    // Función específica para manejar tickets cerrados
    const manejarTicketCerrado = (ticketId) => {
        console.log('🔒 SUPERVISOR - Manejando ticket cerrado:', ticketId);

        // Remover inmediatamente de la lista de tickets activos
        setTickets(prev => {
            const ticketRemovido = prev.find(t => t.id === ticketId);
            if (ticketRemovido) {
                console.log('🗑️ SUPERVISOR - Ticket removido de lista activa:', ticketRemovido.titulo);
            }
            return prev.filter(ticket => ticket.id !== ticketId);
        });

        // Si está viendo la lista de cerrados, actualizar inmediatamente
        if (showCerrados) {
            console.log('📋 SUPERVISOR - Actualizando lista de cerrados...');
            cargarTicketsCerrados();
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

    // Cargar datos del usuario
    useEffect(() => {
        const cargarDatosUsuario = async () => {
            try {
                const token = store.auth.token;
                const userId = tokenUtils.getUserId(token);

                if (userId) {
                    const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/supervisores/${userId}`, {
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
                            area_responsable: data.area_responsable || '',
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

            // Actualización específica para analistas eliminados
            if (lastNotification.tipo === 'analista_eliminado') {
                console.log('🗑️ SUPERVISOR - Analista eliminado detectado:', lastNotification);
                console.log('📊 SUPERVISOR - ID del analista eliminado:', lastNotification.analista_id);
                console.log('📊 SUPERVISOR - Lista actual de analistas antes:', analistas.length);

                // Remover inmediatamente de la lista local
                if (lastNotification.analista_id) {
                    setAnalistas(prev => {
                        const analistaEliminado = prev.find(a => a.id === lastNotification.analista_id);
                        if (analistaEliminado) {
                            console.log('🗑️ SUPERVISOR - Analista eliminado removido de lista:', analistaEliminado.nombre, analistaEliminado.apellido);
                        }
                        const newList = prev.filter(analista => analista.id !== lastNotification.analista_id);
                        console.log('📊 SUPERVISOR - Nueva lista de analistas después de eliminar:', newList.length);
                        return newList;
                    });
                }
                // También hacer actualización completa para asegurar consistencia
                actualizarAnalistas();
            }

            // Sincronización ULTRA RÁPIDA para eventos críticos
            if (lastNotification.tipo === 'escalado' || lastNotification.tipo === 'asignado' || lastNotification.tipo === 'solicitud_reapertura' || lastNotification.tipo === 'creado' || lastNotification.tipo === 'cerrado') {
                console.log('⚡ SUPERVISOR - SINCRONIZACIÓN INMEDIATA:', lastNotification.tipo);
                // Actualización inmediata sin debounce para eventos críticos
                actualizarTodasLasTablas();
            }

            // Manejo específico para tickets cerrados - sincronización inmediata
            if (lastNotification.tipo === 'cerrado' || lastNotification.tipo === 'ticket_cerrado') {
                console.log('🔒 SUPERVISOR - TICKET CERRADO DETECTADO:', lastNotification);

                // Usar la función específica para manejar tickets cerrados
                if (lastNotification.ticket_id) {
                    manejarTicketCerrado(lastNotification.ticket_id);
                }
            }

            // Manejo específico para tickets eliminados - sincronización inmediata
            if (lastNotification.tipo === 'eliminado' || lastNotification.tipo === 'ticket_eliminado') {
                console.log('🗑️ SUPERVISOR - TICKET ELIMINADO DETECTADO:', lastNotification);

                // Remover inmediatamente de la lista de tickets activos
                if (lastNotification.ticket_id) {
                    setTickets(prev => {
                        const ticketRemovido = prev.find(t => t.id === lastNotification.ticket_id);
                        if (ticketRemovido) {
                            console.log('🗑️ SUPERVISOR - Ticket eliminado removido de lista activa:', ticketRemovido.titulo);
                        }
                        return prev.filter(ticket => ticket.id !== lastNotification.ticket_id);
                    });

                    // También remover de la lista de cerrados si está visible
                    if (showCerrados) {
                        setTicketsCerrados(prev => {
                            const ticketRemovido = prev.find(t => t.id === lastNotification.ticket_id);
                            if (ticketRemovido) {
                                console.log('🗑️ SUPERVISOR - Ticket eliminado removido de lista cerrada:', ticketRemovido.titulo);
                            }
                            return prev.filter(ticket => ticket.id !== lastNotification.ticket_id);
                        });
                    }
                }
            }
        }
    }, [store.websocket.notifications, showCerrados]);

    const asignarTicket = async (ticketId, analistaId) => {
        try {
            console.log(`⚡ ASIGNANDO TICKET ${ticketId} A ANALISTA ${analistaId} INMEDIATAMENTE`);
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
                const errorData = await response.json();
                throw new Error(`Error al asignar ticket: ${errorData.message || 'Error desconocido'}`);
            }

            console.log('✅ TICKET ASIGNADO EXITOSAMENTE');
            // Actualización ULTRA RÁPIDA sin esperar
            actualizarTodasLasTablas();
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
                area_responsable: infoData.area_responsable
            };

            // Solo incluir contraseña si se proporciona
            if (infoData.password) {
                updateData.contraseña_hash = infoData.password;
            }

            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/supervisores/${userId}`, {
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
                area_responsable: infoData.area_responsable
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

    // Función helper para detectar si hay una solicitud de reapertura del cliente
    const tieneSolicitudReapertura = (ticket) => {
        if (!ticket.comentarios || !Array.isArray(ticket.comentarios)) {
            return false;
        }

        return ticket.comentarios.some(comentario =>
            comentario.texto === "Cliente solicita reapertura del ticket" &&
            comentario.autor?.rol === "cliente"
        );
    };

    return (
        <div className="container py-4">
            <div className="d-flex justify-content-end mb-3">
            </div>
            {/* Header con información del supervisor */}
            <div className="row mb-4">
                <div className="col-12">
                    <div className="card">
                        <div className="card-body d-flex justify-content-between align-items-center">
                            <div>
                                <h2 className="mb-1">
                                    Bienvenido, {userData?.nombre === 'Pendiente' ? 'Supervisor' : userData?.nombre} {userData?.apellido === 'Pendiente' ? '' : userData?.apellido}
                                </h2>
                                <p className="text-muted mb-0">Panel de Supervisor - Gestión de Tickets</p>
                                <div className="mt-2">
                                    <span className="badge bg-success">
                                        <i className="fas fa-wifi me-1"></i>
                                        Conectado
                                    </span>
                                </div>
                                {userData?.area_responsable && userData.area_responsable !== 'Pendiente' && (
                                    <div className="mt-2">
                                        <small className="text-info d-flex align-items-center">
                                            <i className="fas fa-building me-1"></i>
                                            <span className="fw-bold">Área:</span>
                                            <span className="ms-1">{userData.area_responsable}</span>
                                        </small>
                                    </div>
                                )}
                                {(!userData?.area_responsable || userData.area_responsable === 'Pendiente') && (
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
                                        <label htmlFor="area_responsable" className="form-label">Área Responsable *</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            id="area_responsable"
                                            name="area_responsable"
                                            value={infoData.area_responsable}
                                            onChange={handleInfoChange}
                                            placeholder="Ingresa tu área responsable"
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
                                        disabled={!infoData.nombre || !infoData.apellido || !infoData.email || !infoData.area_responsable || updatingInfo}
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

            {/* Lista de tickets */}
            <div className="row">
                <div className="col-12">
                    <div className="card">
                        <div className="card-header d-flex justify-content-between align-items-center">
                            <h5 className="mb-0">Todos los Tickets</h5>
                            <div className="d-flex align-items-center gap-3">
                                <small className="text-muted">
                                    {analistas.length} analista{analistas.length !== 1 ? 's' : ''} disponible{analistas.length !== 1 ? 's' : ''}
                                </small>
                                <button className="btn btn-primary" onClick={actualizarTickets}>
                                    <i className="fas fa-refresh"></i> Actualizar Lista
                                </button>
                            </div>
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
                                                            <Link
                                                                to={`/supervisor/ticket/${ticket.id}`}
                                                                className="btn btn-primary btn-sm"
                                                                title="Ver ticket"
                                                            >
                                                                <i className="fas fa-eye"></i>
                                                            </Link>
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
                                                            {ticket.estado.toLowerCase() === 'solucionado' && tieneSolicitudReapertura(ticket) && (
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
                                                            {ticket.estado.toLowerCase() === 'solucionado' && !tieneSolicitudReapertura(ticket) && (
                                                                <span className="badge bg-success">
                                                                    <i className="fas fa-check-circle"></i> Solucionado
                                                                </span>
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
                                                                to={`/ticket/${ticket.id}/chat-supervisor-analista`}
                                                                className="btn btn-secondary btn-sm"
                                                                title="Chat con analista"
                                                            >
                                                                <i className="fas fa-comments"></i> Chat
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

        </div>
    );
}

export default SupervisorPage;