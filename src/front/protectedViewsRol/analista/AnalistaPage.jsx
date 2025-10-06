import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useGlobalReducer from '../../hooks/useGlobalReducer';
import { SideBarCentral } from '../../components/SideBarCentral';
import VerTicketHDanalista from './verTicketHDanalista';
import { tokenUtils } from '../../store';
import ComentariosTicketEmbedded from '../../components/ComentariosTicketEmbedded';
import ChatAnalistaClienteEmbedded from '../../components/ChatAnalistaClienteEmbedded';
import RecomendacionVistaEmbedded from '../../components/RecomendacionVistaEmbedded';
import IdentificarImagenEmbedded from '../../components/IdentificarImagenEmbedded';

function AnalistaPage() {
    const navigate = useNavigate();
    const { store, dispatch, logout, connectWebSocket, disconnectWebSocket, joinRoom, joinTicketRoom, joinCriticalRooms, joinAllCriticalRooms, emitCriticalTicketAction, joinChatAnalistaCliente, joinChatSupervisorAnalista } = useGlobalReducer();

    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [ticketsSolicitudReapertura, setTicketsSolicitudReapertura] = useState(new Set());
    const [expandedTickets, setExpandedTickets] = useState(new Set());
    const [modalTicketId, setModalTicketId] = useState(null);
    const [sidebarHidden, setSidebarHidden] = useState(false);
    const [activeView, setActiveView] = useState('dashboard');

    // Estados para búsqueda y dropdown
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [showSearchResults, setShowSearchResults] = useState(false);
    const [showUserDropdown, setShowUserDropdown] = useState(false);
    const [userData, setUserData] = useState(null);

    // Estados para perfil del analista
    const [showInfoForm, setShowInfoForm] = useState(false);
    const [updatingInfo, setUpdatingInfo] = useState(false);
    const [infoData, setInfoData] = useState({
        nombre: '',
        apellido: '',
        email: '',
        especialidad: '',
        password: '',
        confirmPassword: ''
    });

    const toggleTicketExpansion = (ticketId) => {
        setExpandedTickets(prev => {
            const copy = new Set(prev);
            if (copy.has(ticketId)) copy.delete(ticketId);
            else copy.add(ticketId);
            return copy;
        });
    };

    // Funciones para búsqueda
    const handleSearch = (query) => {
        setSearchQuery(query);
        if (query.trim() === '') {
            setSearchResults([]);
            setShowSearchResults(false);
            return;
        }

        const filtered = tickets.filter(ticket =>
            ticket.titulo.toLowerCase().includes(query.toLowerCase()) ||
            ticket.descripcion.toLowerCase().includes(query.toLowerCase())
        );
        setSearchResults(filtered);
        setShowSearchResults(filtered.length > 0);
    };

    const closeSearchResults = () => {
        setShowSearchResults(false);
    };

    const selectTicketFromSearch = (ticket) => {
        setActiveView(`ticket-${ticket.id}`);
        closeSearchResults();
    };

    const toggleSidebar = () => {
        setSidebarHidden(!sidebarHidden);
    };

    // Función para manejar cambios en el formulario de información
    const handleInfoChange = (e) => {
        const { name, value } = e.target;
        setInfoData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Función para actualizar información del analista
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
                updateData.password = infoData.password;
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
            const updatedUserData = {
                ...userData,
                nombre: infoData.nombre,
                apellido: infoData.apellido,
                email: infoData.email,
                especialidad: infoData.especialidad
            };
            setUserData(updatedUserData);

            // Actualizar el store global para que se refleje en el SideBarCentral
            dispatch({ type: 'SET_USER', payload: updatedUserData });

            alert('Información actualizada exitosamente');
            setShowInfoForm(false);
            setError('');

            // Limpiar contraseñas del formulario
            setInfoData(prev => ({
                ...prev,
                password: '',
                confirmPassword: ''
            }));

        } catch (err) {
            setError(err.message);
        } finally {
            setUpdatingInfo(false);
        }
    };

    const openComments = (ticketId) => {
        try {
            const socket = store.websocket.socket;
            if (socket && joinTicketRoom) {
                joinTicketRoom(socket, ticketId);
            }
        } catch (e) {
            /* Silently ignore */
        }
        setModalTicketId(ticketId);
        setActiveView(`comentarios-${ticketId}`);
    };

    const openChat = (ticketId) => {
        try {
            const socket = store.websocket.socket;
            if (socket && joinChatAnalistaCliente) {
                joinChatAnalistaCliente(socket, ticketId);
            }
            if (socket && joinTicketRoom) {
                joinTicketRoom(socket, ticketId);
            }
        } catch (e) {
            /* Silently ignore */
        }
        setModalTicketId(ticketId);
        setActiveView(`chat-${ticketId}`);
    };

    const openVerHD = (ticketId) => {
        try {
            const socket = store.websocket.socket;
            if (socket && joinTicketRoom) joinTicketRoom(socket, ticketId);
        } catch (e) {
            /* Silently ignore */
        }
        setModalTicketId(ticketId);
    };

    const actualizarTickets = async () => {
        try {
            const token = store.auth.token;
            if (!token) return;
            const resp = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/tickets/analista`, {
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
            });
            if (!resp.ok) {
                const text = await resp.text().catch(() => null);
                setError(`Error cargando tickets: ${resp.status} ${resp.statusText}`);
                return;
            }
            const data = await resp.json();
            setTickets(data);
        } catch (e) {
            /* Silently ignore */
        }
    };

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            await actualizarTickets();
            setLoading(false);
        };
        load();
    }, [store.auth.token]);

    // Cargar datos del usuario
    useEffect(() => {
        const cargarDatosUsuario = async () => {
            try {
                const token = store.auth.token;
                const userId = tokenUtils.getUserId(token);

                if (userId) {
                    const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/usuarios/${userId}`, {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    });

                    if (response.ok) {
                        const userData = await response.json();
                        setUserData(userData);

                        // Actualizar el formulario de información
                        setInfoData({
                            nombre: userData.nombre === 'Pendiente' ? '' : userData.nombre || '',
                            apellido: userData.apellido === 'Pendiente' ? '' : userData.apellido || '',
                            email: userData.email || '',
                            especialidad: userData.especialidad || '',
                            password: '',
                            confirmPassword: ''
                        });
                    }
                }
            } catch (error) {
                console.error('Error cargando datos del usuario:', error);
            }
        };

        if (store.auth.isAuthenticated && store.auth.token) {
            cargarDatosUsuario();
        }
    }, [store.auth.isAuthenticated, store.auth.token]);

    // Cerrar dropdown al hacer clic fuera
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (showUserDropdown && !event.target.closest('.dropdown')) {
                setShowUserDropdown(false);
            }
            if (showSearchResults && !event.target.closest('.hyper-search')) {
                setShowSearchResults(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showUserDropdown, showSearchResults]);

    // WebSocket connect + join rooms
    useEffect(() => {
        if (store.auth.isAuthenticated && store.auth.token && !store.websocket.connected && !store.websocket.connecting) {
            const socket = connectWebSocket(store.auth.token);
            if (socket) {
                // Obtener userId/role desde token (fallback si store.auth.user no está poblado)
                const decoded = tokenUtils.decodeToken(store.auth.token) || {};
                const userId = store.auth.user?.id || decoded.user_id;
                const role = store.auth.user?.role || decoded.role;

                // Join role room y rooms globales
                if (joinRoom) {
                    try {
                        joinRoom(socket, role, userId);
                        // Unirse a rooms globales
                        socket.emit('join_room', 'global_system_room');
                        socket.emit('join_room', 'global_tickets');
                        socket.emit('join_room', 'ticket_status_changes');
                    } catch (e) {
                        /* Silently ignore */
                    }
                }

                // Unirse también a las rooms críticas globales usando user object si es posible
                const userData = store.auth.user || (decoded.user_id ? { id: decoded.user_id, role: decoded.role } : null);
                if (userData && joinAllCriticalRooms) {
                    try { joinAllCriticalRooms(socket, userData, store.auth.token); } catch (e) { /* Silently ignore */ }
                }
            }
        }

        return () => {
            if (store.websocket.socket) disconnectWebSocket(store.websocket.socket);
        };
    }, [store.auth.isAuthenticated, store.auth.token, store.websocket.connected, store.websocket.connecting]);

    // Setup listeners and join ticket rooms (purified)
    useEffect(() => {
        // Allow joining even if store.auth.user is not yet populated by using token decode as fallback
        const tokenDecoded = store.auth.token ? tokenUtils.decodeToken(store.auth.token) : null;
        if (!((store.auth.user || tokenDecoded) && store.websocket.connected && store.websocket.socket)) return;
        const socket = store.websocket.socket;

        // Build a userData object from store.auth.user or decoded token
        const userData = store.auth.user || (tokenDecoded ? { id: tokenDecoded.user_id, role: tokenDecoded.role } : null);

        // Join all critical rooms for this user (defensivo)
        try {
            joinAllCriticalRooms && joinAllCriticalRooms(socket, userData, store.auth.token);
        } catch (e) {
            /* Silently ignore */
        }

        const ticketIds = tickets.map(t => t.id);
        if (ticketIds.length && joinCriticalRooms) {
            try { joinCriticalRooms(socket, ticketIds, store.auth.user, store.auth.token); } catch (e) { /* Silently ignore */ }
        }

        // Also ensure we join per-ticket rooms so events are scoped and everyone listens in the same room
        if (ticketIds.length) {
            ticketIds.forEach(id => {
                if (joinTicketRoom) {
                    try {
                        joinTicketRoom(socket, id);
                        return;
                    } catch (err) {
                        /* Silently ignore */
                    }
                }

                // fallback to emit using canonical 'join_ticket' event used in store.js
                try {
                    socket.emit('join_ticket', { ticket_id: id, user_id: userData?.id, role: userData?.role });
                } catch (e) {
                    /* Silently ignore */
                }
            });
        }

        // Handlers
        const onSolicitudReapertura = (data) => {
            if (!data || !data.ticket_id) return;
            setTicketsSolicitudReapertura(prev => { const copy = new Set(prev); copy.add(data.ticket_id); return copy; });
            setTickets(prev => prev.map(t => t.id === data.ticket_id ? { ...t, estado: 'solucionado' } : t));
        };

        const onTicketReabierto = (data) => {
            if (!data || !data.ticket_id) return;
            setTicketsSolicitudReapertura(prev => { const copy = new Set(prev); copy.delete(data.ticket_id); return copy; });
            setTickets(prev => prev.map(t => t.id === data.ticket_id ? { ...t, estado: data.estado || 'en_espera' } : t));
            if (data.assigned_analista_id === store.auth.user?.id) actualizarTickets();
        };

        const onTicketCerrado = (data) => {
            if (!data || !data.ticket_id) return;
            setTickets(prev => prev.filter(t => t.id !== data.ticket_id));
        };

        const onTicketAsignado = (data) => {
            if (!data || !data.ticket_id) return;
            if (data.analista_id === store.auth.user?.id) actualizarTickets();
        };

        const onGenericUpdate = () => actualizarTickets();

        const onCritical = (data) => {
            /* Removed debug log */
            // Validar si el evento afecta a alguno de nuestros tickets
            if (data && data.ticket_id && tickets.some(t => t.id === data.ticket_id)) {
                actualizarTickets();
            }
        };

        socket.on('solicitud_reapertura', onSolicitudReapertura);
        socket.on('ticket_reabierto', onTicketReabierto);
        socket.on('ticket_cerrado', onTicketCerrado);
        socket.on('ticket_asignado', onTicketAsignado);
        socket.on('ticket_actualizado', onGenericUpdate);
        socket.on('nuevo_comentario', onGenericUpdate);
        socket.on('critical_ticket_update', onCritical);
        socket.on('critical_ticket_action', onCritical);
        socket.on('global_ticket_update', onGenericUpdate);
        socket.on('ticket_estado_changed', onGenericUpdate);
        // Removed debug log for join_ticket_success
        socket.on('join_ticket_success', () => { });

        return () => {
            socket.off('solicitud_reapertura', onSolicitudReapertura);
            socket.off('ticket_reabierto', onTicketReabierto);
            socket.off('ticket_cerrado', onTicketCerrado);
            socket.off('ticket_asignado', onTicketAsignado);
            socket.off('ticket_actualizado', onGenericUpdate);
            socket.off('nuevo_comentario', onGenericUpdate);
            socket.off('critical_ticket_update', onCritical);
            socket.off('critical_ticket_action', onCritical);
            socket.off('global_ticket_update', onGenericUpdate);
            socket.off('ticket_estado_changed', onGenericUpdate);
        };
    }, [store.auth.user, store.websocket.connected, tickets, joinTicketRoom, joinCriticalRooms, joinAllCriticalRooms]);

    const iniciarTrabajo = async (ticketId) => {
        try {
            const resp = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/tickets/${ticketId}/estado`, {
                method: 'PUT', headers: { 'Authorization': `Bearer ${store.auth.token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ estado: 'en_proceso' })
            });
            if (!resp.ok) throw new Error('Error iniciar trabajo');
            if (store.websocket.socket) {
                // Emitir a la room del ticket y a la global
                emitCriticalTicketAction && emitCriticalTicketAction(store.websocket.socket, ticketId, 'ticket_iniciado', store.auth.user);
                store.websocket.socket.emit('ticket_iniciado', { ticket_id: ticketId, analista_id: store.auth.user.id });
                store.websocket.socket.emit('global_ticket_update', { type: 'estado_changed', ticket_id: ticketId, estado: 'en_proceso' });
            }
            await actualizarTickets();
        } catch (e) { setError(e.message); }
    };

    const marcarComoResuelto = async (ticketId) => {
        try {
            const resp = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/tickets/${ticketId}/estado`, {
                method: 'PUT', headers: { 'Authorization': `Bearer ${store.auth.token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ estado: 'solucionado' })
            });
            if (!resp.ok) throw new Error('Error marcar resuelto');
            if (store.websocket.socket) {
                // Emitir a la room del ticket y a la global
                emitCriticalTicketAction && emitCriticalTicketAction(store.websocket.socket, ticketId, 'ticket_solucionado', store.auth.user);
                store.websocket.socket.emit('ticket_solucionado', { ticket_id: ticketId, analista_id: store.auth.user.id });
                store.websocket.socket.emit('global_ticket_update', { type: 'estado_changed', ticket_id: ticketId, estado: 'solucionado' });
                store.websocket.socket.emit('ticket_estado_changed', { ticket_id: ticketId, estado: 'solucionado' });
            }
            await actualizarTickets();
        } catch (e) { setError(e.message); }
    };

    const escalarTicket = async (ticketId) => {
        try {
            const resp = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/tickets/${ticketId}/estado`, {
                method: 'PUT', headers: { 'Authorization': `Bearer ${store.auth.token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ estado: 'en_espera' })
            });
            if (!resp.ok) throw new Error('Error escalar');
            if (store.websocket.socket) {
                // Emitir a la room del ticket y a la global
                emitCriticalTicketAction && emitCriticalTicketAction(store.websocket.socket, ticketId, 'ticket_escalado', store.auth.user);
                store.websocket.socket.emit('ticket_escalado', { ticket_id: ticketId, analista_id: store.auth.user.id, motivo: 'Escalado por analista' });
                store.websocket.socket.emit('global_ticket_update', { type: 'estado_changed', ticket_id: ticketId, estado: 'en_espera' });
                store.websocket.socket.emit('ticket_estado_changed', { ticket_id: ticketId, estado: 'en_espera', was_escalated: true });
            }
            await actualizarTickets();
        } catch (e) { setError(e.message); }
    };

    const getEstadoColor = (estado) => {
        switch ((estado || '').toLowerCase()) {
            case 'en_espera': return 'badge bg-warning';
            case 'en_proceso': return 'badge bg-primary';
            case 'solucionado': return 'badge bg-success';
            case 'cerrado': return 'badge bg-dark';
            default: return 'badge bg-secondary';
        }
    };

    if (loading) return (<div className="d-flex justify-content-center align-items-center full-height"><div className="spinner-border text-primary" role="status"><span className="visually-hidden">Cargando...</span></div></div>);

    return (
        <div className="hyper-layout d-flex">
            <SideBarCentral sidebarHidden={sidebarHidden} activeView={activeView} changeView={setActiveView} />
            <div className={`hyper-main-content flex-grow-1 ${sidebarHidden ? 'sidebar-hidden' : ''}`}>
                <header className="hyper-header bg-white border-bottom p-3">
                    <div className="d-flex align-items-center justify-content-between w-100">
                        <div className="d-flex align-items-center gap-3">
                            <button
                                className="hyper-sidebar-toggle btn btn-link p-2"
                                onClick={toggleSidebar}
                                title={sidebarHidden ? "Mostrar menú" : "Ocultar menú"}
                            >
                                <i className="fas fa-bars"></i>
                            </button>

                            {/* Barra de búsqueda */}
                            <div className="hyper-search position-relative">
                                <i className="fas fa-search position-absolute top-50 start-0 translate-middle-y ms-3 text-muted"></i>
                                <input
                                    type="text"
                                    className="form-control pe-5"
                                    placeholder="Buscar tickets por título..."
                                    value={searchQuery}
                                    onChange={(e) => handleSearch(e.target.value)}
                                    onFocus={() => {
                                        if (searchResults.length > 0) {
                                            setShowSearchResults(true);
                                        }
                                    }}
                                />
                                {searchQuery && (
                                    <button
                                        className="btn btn-link position-absolute top-50 end-0 translate-middle-y me-3 p-0 z-index-10"
                                        onClick={() => {
                                            setSearchQuery('');
                                            setSearchResults([]);
                                            setShowSearchResults(false);
                                        }}
                                        title="Limpiar búsqueda"
                                    >
                                        <i className="fas fa-times text-muted"></i>
                                    </button>
                                )}

                                {/* Resultados de búsqueda */}
                                {showSearchResults && searchResults.length > 0 && (
                                    <div className="position-absolute w-100 bg-white border border-top-0 rounded-bottom shadow-lg dropdown-menu-custom">
                                        <div className="p-3">
                                            <div className="d-flex justify-content-between align-items-center mb-3 w-100">
                                                <small className="text-muted fw-semibold">
                                                    Tickets encontrados ({searchResults.length})
                                                </small>
                                                <button
                                                    className="btn btn-sm btn-outline-secondary ms-3"
                                                    onClick={closeSearchResults}
                                                    title="Cerrar resultados"
                                                >
                                                    <span>X</span>
                                                </button>
                                            </div>
                                            {searchResults.map((ticket) => (
                                                <div
                                                    key={ticket.id}
                                                    className="search-result-item p-2 border-bottom cursor-pointer"
                                                    onClick={() => selectTicketFromSearch(ticket)}
                                                >
                                                    <div className="fw-semibold">#{ticket.id} - {ticket.titulo}</div>
                                                    <small className="text-muted">
                                                        {ticket.estado} • {ticket.prioridad}
                                                    </small>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="d-flex align-items-center gap-3">
                            {/* Botón de sincronizar */}
                            <button
                                className="btn btn-outline-primary d-flex align-items-center gap-2"
                                onClick={async () => {
                                    try {
                                        console.log('🔄 Iniciando sincronización desde AnalistaPage...');
                                        await actualizarTickets();
                                        console.log('✅ Sincronización completada desde AnalistaPage');
                                    } catch (error) {
                                        console.error('❌ Error en sincronización desde AnalistaPage:', error);
                                    }
                                }}
                                title="Sincronizar datos"
                                style={{
                                    borderColor: 'var(--ct-primary)',
                                    color: 'var(--ct-primary)',
                                    fontSize: '0.9rem',
                                    fontWeight: '500',
                                    padding: '0.5rem 1rem',
                                    borderRadius: '0.5rem',
                                    transition: 'all 0.2s ease'
                                }}
                                onMouseEnter={(e) => {
                                    e.target.style.backgroundColor = 'var(--ct-primary)';
                                    e.target.style.color = 'white';
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.backgroundColor = 'transparent';
                                    e.target.style.color = 'var(--ct-primary)';
                                }}
                            >
                                <i className="fas fa-sync-alt"></i>
                                <span>Sincronizar</span>
                            </button>

                            {/* Dropdown del usuario */}
                            <div className="position-relative dropdown">
                                <button
                                    className="btn btn-link d-flex align-items-center gap-2 text-decoration-none"
                                    onClick={() => setShowUserDropdown(!showUserDropdown)}
                                >
                                    {userData?.url_imagen ? (
                                        <img
                                            src={userData.url_imagen}
                                            alt="Avatar"
                                            className="avatar-header-normal rounded-circle"
                                        />
                                    ) : (
                                        <div className="avatar-header-normal bg-primary d-flex align-content-center rounded-circle">
                                            <i className="fa-solid fa-user fa-xl text-white text-center"></i>
                                        </div>
                                    )}
                                    <span className="fw-semibold">
                                        {userData?.nombre || store.auth.user?.nombre || 'Analista'}
                                    </span>
                                    <i className="fas fa-chevron-down"></i>
                                </button>

                                {showUserDropdown && (
                                    <div className="position-absolute end-0 mt-2 bg-white border rounded shadow-lg dropdown-menu-min-width">
                                        <div className="p-3 border-bottom">
                                            <div className="fw-semibold">
                                                {userData?.nombre || store.auth.user?.nombre || 'Analista'}
                                            </div>
                                            <small className="text-muted">Analista</small>
                                        </div>
                                        <div className="p-2">
                                            <button
                                                className="btn btn-link w-100 text-start d-flex align-items-center gap-2"
                                                style={{ textDecoration: 'none' }}
                                                onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
                                                onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
                                                onClick={() => {
                                                    setActiveView('profile');
                                                    setShowUserDropdown(false);
                                                }}
                                            >
                                                <i className="fas fa-user-edit"></i>
                                                <span>Mi Perfil</span>
                                            </button>
                                            <button
                                                className="btn btn-link w-100 text-start d-flex align-items-center gap-2"
                                                style={{ textDecoration: 'none' }}
                                                onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
                                                onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
                                                onClick={() => {
                                                    setShowUserDropdown(false);
                                                    navigate('/');
                                                }}
                                            >
                                                <i className="fas fa-home"></i>
                                                <span>Ir al inicio</span>
                                            </button>
                                            <button
                                                className="btn btn-link w-100 text-start d-flex align-items-center gap-2 text-danger"
                                                style={{ textDecoration: 'none' }}
                                                onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
                                                onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
                                                onClick={() => {
                                                    setShowUserDropdown(false);
                                                    logout();
                                                }}
                                            >
                                                <i className="fas fa-sign-out-alt"></i>
                                                <span>Cerrar sesión</span>
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </header>

                <div className="p-4">
                    {error && (
                        <div className="alert alert-danger" role="alert">
                            {error}
                        </div>
                    )}

                    {/* Dashboard View */}
                    {activeView === 'dashboard' && (
                        <>
                            <h1 className="hyper-page-title">Dashboard Analista</h1>

                            {/* Métricas principales */}
                            <div className="row mb-4 g-3">
                                <div className="col-xl-3 col-lg-4 col-md-6 mb-3">
                                    <div className="hyper-widget card border-0 shadow-sm h-100">
                                        <div className="card-body">
                                            <div className="text-center">
                                                <h6 className="card-title text-muted mb-2">Total Tickets</h6>
                                                <div className="d-flex align-items-center justify-content-center mb-2">
                                                    <h3 className="mb-0 text-primary me-2">{tickets.length}</h3>
                                                    <div className="bg-primary bg-opacity-10 rounded-circle p-2">
                                                        <i className="fas fa-ticket-alt text-primary"></i>
                                                    </div>
                                                </div>
                                                <small className="text-muted">Asignados a mí</small>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="col-xl-3 col-lg-4 col-md-6 mb-3">
                                    <div className="hyper-widget card border-0 shadow-sm h-100">
                                        <div className="card-body">
                                            <div className="text-center">
                                                <h6 className="card-title text-muted mb-2">En Espera</h6>
                                                <div className="d-flex align-items-center justify-content-center mb-2">
                                                    <h3 className="mb-0 text-warning me-2">
                                                        {tickets.filter(t => t.estado.toLowerCase() === 'en_espera').length}
                                                    </h3>
                                                    <div className="bg-warning bg-opacity-10 rounded-circle p-2">
                                                        <i className="fas fa-clock text-warning"></i>
                                                    </div>
                                                </div>
                                                <small className="text-muted">Pendientes de iniciar</small>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="col-xl-3 col-lg-4 col-md-6 mb-3">
                                    <div className="hyper-widget card border-0 shadow-sm h-100">
                                        <div className="card-body">
                                            <div className="text-center">
                                                <h6 className="card-title text-muted mb-2">En Proceso</h6>
                                                <div className="d-flex align-items-center justify-content-center mb-2">
                                                    <h3 className="mb-0 text-info me-2">
                                                        {tickets.filter(t => t.estado.toLowerCase() === 'en_proceso').length}
                                                    </h3>
                                                    <div className="bg-info bg-opacity-10 rounded-circle p-2">
                                                        <i className="fas fa-cog text-info"></i>
                                                    </div>
                                                </div>
                                                <small className="text-muted">Trabajando actualmente</small>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="col-xl-3 col-lg-4 col-md-6 mb-3">
                                    <div className="hyper-widget card border-0 shadow-sm h-100">
                                        <div className="card-body">
                                            <div className="text-center">
                                                <h6 className="card-title text-muted mb-2">Resueltos</h6>
                                                <div className="d-flex align-items-center justify-content-center mb-2">
                                                    <h3 className="mb-0 text-success me-2">
                                                        {tickets.filter(t => ['solucionado', 'cerrado'].includes(t.estado.toLowerCase())).length}
                                                    </h3>
                                                    <div className="bg-success bg-opacity-10 rounded-circle p-2">
                                                        <i className="fas fa-check-circle text-success"></i>
                                                    </div>
                                                </div>
                                                <small className="text-muted">Completados</small>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Estadísticas por prioridad */}
                            <div className="row mb-4 g-3">
                                <div className="col-12">
                                    <div className="hyper-widget card border-0 shadow-sm">
                                        <div className="hyper-widget-header">
                                            <h3 className="hyper-widget-title">Distribución por Prioridad</h3>
                                        </div>
                                        <div className="hyper-widget-body">
                                            <div className="row g-3">
                                                <div className="col-md-4">
                                                    <div className="text-center p-3 border rounded">
                                                        <div className="mb-2">
                                                            <i className="fas fa-exclamation-triangle fa-2x text-danger"></i>
                                                        </div>
                                                        <h4 className="text-danger mb-1">
                                                            {tickets.filter(t => t.prioridad === 'alta').length}
                                                        </h4>
                                                        <p className="text-muted mb-0 small">Alta Prioridad</p>
                                                    </div>
                                                </div>
                                                <div className="col-md-4">
                                                    <div className="text-center p-3 border rounded">
                                                        <div className="mb-2">
                                                            <i className="fas fa-exclamation-circle fa-2x text-warning"></i>
                                                        </div>
                                                        <h4 className="text-warning mb-1">
                                                            {tickets.filter(t => t.prioridad === 'media').length}
                                                        </h4>
                                                        <p className="text-muted mb-0 small">Media Prioridad</p>
                                                    </div>
                                                </div>
                                                <div className="col-md-4">
                                                    <div className="text-center p-3 border rounded">
                                                        <div className="mb-2">
                                                            <i className="fas fa-info-circle fa-2x text-info"></i>
                                                        </div>
                                                        <h4 className="text-info mb-1">
                                                            {tickets.filter(t => t.prioridad === 'baja' || !t.prioridad).length}
                                                        </h4>
                                                        <p className="text-muted mb-0 small">Baja Prioridad</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Tickets recientes */}
                            <div className="row g-4">
                                <div className="col-12">
                                    <div className="hyper-widget card border-0 shadow-sm">
                                        <div className="hyper-widget-header">
                                            <h3 className="hyper-widget-title">Tickets Recientes</h3>
                                        </div>
                                        <div className="hyper-widget-body">
                                            {tickets.length === 0 ? (
                                                <div className="text-center py-4">
                                                    <i className="fas fa-ticket-alt fa-3x text-muted mb-3"></i>
                                                    <p className="text-muted">No tienes tickets asignados</p>
                                                </div>
                                            ) : (
                                                <div className="table-responsive">
                                                    <table className="table table-hover mb-0">
                                                        <thead className="table-light">
                                                            <tr>
                                                                <th>ID</th>
                                                                <th>Título</th>
                                                                <th>Estado</th>
                                                                <th>Prioridad</th>
                                                                <th>Cliente</th>
                                                                <th>Fecha</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {tickets.slice(0, 5).map((ticket) => (
                                                                <tr key={ticket.id}>
                                                                    <td>
                                                                        <span className="badge bg-secondary">#{ticket.id}</span>
                                                                    </td>
                                                                    <td>
                                                                        <div className="fw-semibold">{ticket.titulo}</div>
                                                                        <small className="text-muted">
                                                                            {ticket.descripcion.length > 50
                                                                                ? `${ticket.descripcion.substring(0, 50)}...`
                                                                                : ticket.descripcion
                                                                            }
                                                                        </small>
                                                                    </td>
                                                                    <td>
                                                                        <span className={`badge ${ticket.estado.toLowerCase() === 'solucionado' ? 'bg-success' :
                                                                            ticket.estado.toLowerCase() === 'en_proceso' ? 'bg-info' :
                                                                                ticket.estado.toLowerCase() === 'en_espera' ? 'bg-warning' :
                                                                                    'bg-secondary'
                                                                            }`}>
                                                                            {ticket.estado}
                                                                        </span>
                                                                    </td>
                                                                    <td>
                                                                        <span className={`badge ${ticket.prioridad === 'alta' ? 'bg-danger' :
                                                                            ticket.prioridad === 'media' ? 'bg-warning' :
                                                                                'bg-info'
                                                                            }`}>
                                                                            {ticket.prioridad || 'Normal'}
                                                                        </span>
                                                                    </td>
                                                                    <td>{ticket.cliente?.nombre || 'Sin cliente'}</td>
                                                                    <td>
                                                                        <small>
                                                                            {new Date(ticket.fecha_creacion).toLocaleDateString('es-ES', {
                                                                                year: 'numeric',
                                                                                month: 'short',
                                                                                day: 'numeric'
                                                                            })}
                                                                        </small>
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

                            {/* Sección de acción profesional */}
                            <div className="row g-4 mt-4">
                                <div className="col-12">
                                    <div className="hyper-widget card border-0 shadow-sm" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                                        <div className="card-body text-center text-white py-5">
                                            <div className="mb-4">
                                                <i className="fas fa-ticket-alt fa-4x mb-3" style={{ opacity: 0.8 }}></i>
                                                <h3 className="mb-3 fw-bold">Gestiona todos tus tickets</h3>
                                                <p className="mb-4 fs-5" style={{ opacity: 0.9 }}>
                                                    Accede a la vista completa de tickets para gestionar, resolver y escalar tus tareas asignadas
                                                </p>
                                            </div>
                                            <button
                                                className="btn btn-light btn-lg px-5 py-3 fw-semibold"
                                                onClick={() => setActiveView('tickets')}
                                                style={{
                                                    borderRadius: '50px',
                                                    boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
                                                    transition: 'all 0.3s ease'
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.target.style.transform = 'translateY(-2px)';
                                                    e.target.style.boxShadow = '0 6px 20px rgba(0,0,0,0.3)';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.target.style.transform = 'translateY(0)';
                                                    e.target.style.boxShadow = '0 4px 15px rgba(0,0,0,0.2)';
                                                }}
                                            >
                                                <i className="fas fa-arrow-right me-2"></i>
                                                Ir a Todos los Tickets
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {/* Tickets View */}
                    {activeView === 'tickets' && (
                        <>
                            <h1 className="hyper-page-title">Mis Tickets</h1>

                            <div className="card border-0 shadow-sm">
                                <div className="card-header bg-white border-0 d-flex justify-content-between align-items-center">
                                    <h5 className="card-title mb-0">Mis Tickets</h5>
                                </div>
                                <div className="card-body p-0">
                                    {tickets.length === 0 ? (
                                        <div className="text-center py-5">
                                            <div className="mb-3">
                                                <i className="fas fa-ticket-alt fa-3x text-muted"></i>
                                            </div>
                                            <h5 className="text-muted">No tienes tickets asignados</h5>
                                            <p className="text-muted">
                                                Los tickets aparecerán aquí cuando te sean asignados por un supervisor.
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="table-responsive">
                                            <table className="table table-hover mb-0">
                                                <thead className="table-light">
                                                    <tr>
                                                        <th className="text-center px-3">ID</th>
                                                        <th className="text-center px-4">Título</th>
                                                        <th className="text-center px-3">Estado</th>
                                                        <th className="text-center px-3">Prioridad</th>
                                                        <th className="text-center px-3">Cliente</th>
                                                        <th className="text-center px-3">Fecha</th>
                                                        <th className="text-center px-4">Acciones</th>
                                                        <th className="text-center px-2" style={{ width: '50px' }}>Expandir</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {tickets.map((ticket) => {
                                                        const isExpanded = expandedTickets.has(ticket.id);
                                                        return (
                                                            <React.Fragment key={ticket.id}>
                                                                <tr
                                                                    data-ticket-id={ticket.id}
                                                                    className={ticketsSolicitudReapertura.has(ticket.id) ? 'table-warning' : ''}
                                                                >
                                                                    <td className="text-center px-3">
                                                                        <div className="d-flex align-items-center justify-content-center">
                                                                            <span className="me-2">#{ticket.id}</span>
                                                                            {ticket.url_imagen ? (
                                                                                <img
                                                                                    src={ticket.url_imagen}
                                                                                    alt="Imagen del ticket"
                                                                                    className="img-thumbnail thumbnail-small"
                                                                                />
                                                                            ) : (
                                                                                <span className="text-muted">
                                                                                    <i className="fas fa-image icon-tiny"></i>
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    </td>
                                                                    <td className="px-4">
                                                                        <div className="d-flex align-items-start gap-2">
                                                                            <span
                                                                                className="rounded-circle d-inline-block mt-1"
                                                                                style={{
                                                                                    width: '8px',
                                                                                    height: '8px',
                                                                                    backgroundColor: '#6f42c1'
                                                                                }}
                                                                            ></span>
                                                                            <div>
                                                                                <div className="fw-semibold mb-1 text-dark dark-theme:text-white">{ticket.titulo}</div>
                                                                                <small className="text-muted dark-theme:text-white">
                                                                                    {ticket.descripcion.length > 50
                                                                                        ? `${ticket.descripcion.substring(0, 50)}...`
                                                                                        : ticket.descripcion
                                                                                    }
                                                                                </small>
                                                                            </div>
                                                                        </div>
                                                                    </td>
                                                                    <td className="text-center px-3">
                                                                        <span className="d-flex align-items-center justify-content-center gap-2">
                                                                            <span
                                                                                className={`rounded-circle d-inline-block ${ticket.estado.toLowerCase() === 'solucionado' ? 'dot-estado-solucionado' :
                                                                                    ticket.estado.toLowerCase() === 'en_proceso' ? 'dot-estado-en-proceso' :
                                                                                        ticket.estado.toLowerCase() === 'en_espera' ? 'dot-estado-en-espera' :
                                                                                            'dot-ct-blue'
                                                                                    }`}
                                                                            ></span>
                                                                            <span className="text-dark dark-theme:text-white">
                                                                                {ticket.estado}
                                                                            </span>
                                                                        </span>
                                                                        {/* Mostrar mensaje de solicitud enviada */}
                                                                        {ticketsSolicitudReapertura.has(ticket.id) && (
                                                                            <div className="mt-1">
                                                                                <small className="badge bg-warning text-dark">
                                                                                    <i className="fas fa-clock me-1"></i>
                                                                                    Solicitud enviada
                                                                                </small>
                                                                            </div>
                                                                        )}
                                                                    </td>
                                                                    <td className="text-center px-3">
                                                                        <span className="d-flex align-items-center justify-content-center gap-2">
                                                                            <span
                                                                                className={`rounded-circle d-inline-block ${ticket.prioridad === 'alta' ? 'dot-prioridad-alta' :
                                                                                    ticket.prioridad === 'media' ? 'dot-prioridad-media' :
                                                                                        'dot-prioridad-baja'
                                                                                    }`}
                                                                            ></span>
                                                                            <span className="text-dark dark-theme:text-white">
                                                                                {ticket.prioridad || 'Normal'}
                                                                            </span>
                                                                        </span>
                                                                    </td>
                                                                    <td className="text-center px-3">
                                                                        <span className="d-flex align-items-center justify-content-center gap-2">
                                                                            <span
                                                                                className="rounded-circle d-inline-block"
                                                                                style={{
                                                                                    width: '8px',
                                                                                    height: '8px',
                                                                                    backgroundColor: '#17a2b8'
                                                                                }}
                                                                            ></span>
                                                                            <span className="text-dark dark-theme:text-white">
                                                                                {ticket.cliente?.nombre || 'Sin cliente'}
                                                                            </span>
                                                                        </span>
                                                                    </td>
                                                                    <td className="text-center px-3">
                                                                        <span className="d-flex align-items-center justify-content-center gap-2">
                                                                            <span
                                                                                className="rounded-circle d-inline-block"
                                                                                style={{
                                                                                    width: '8px',
                                                                                    height: '8px',
                                                                                    backgroundColor: '#17a2b8'
                                                                                }}
                                                                            ></span>
                                                                            <small className="text-dark dark-theme:text-white">
                                                                                {new Date(ticket.fecha_creacion).toLocaleDateString('es-ES', {
                                                                                    year: 'numeric',
                                                                                    month: 'short',
                                                                                    day: 'numeric',
                                                                                    hour: '2-digit',
                                                                                    minute: '2-digit',
                                                                                    hour12: true
                                                                                })}
                                                                            </small>
                                                                        </span>
                                                                    </td>
                                                                    <td className="text-center px-4">
                                                                        <div className="d-flex flex-column gap-2">
                                                                            {/* Fila superior: Ver detalles, Comentarios, Chat */}
                                                                            <div className="d-flex gap-1">
                                                                                <button
                                                                                    className="btn btn-sidebar-teal btn-sm"
                                                                                    title="Ver detalles"
                                                                                    onClick={() => openVerHD(ticket.id)}
                                                                                >
                                                                                    <i className="fas fa-eye"></i>
                                                                                </button>
                                                                                <button
                                                                                    className="btn btn-sidebar-accent btn-sm"
                                                                                    title="Ver y agregar comentarios"
                                                                                    onClick={() => openComments(ticket.id)}
                                                                                >
                                                                                    <i className="fas fa-users"></i>
                                                                                </button>
                                                                                <button
                                                                                    className="btn btn-sidebar-secondary btn-sm"
                                                                                    title="Chat con cliente"
                                                                                    onClick={() => openChat(ticket.id)}
                                                                                >
                                                                                    <i className="fas fa-comments"></i>
                                                                                </button>
                                                                            </div>

                                                                            {/* Fila inferior: Acciones de estado específicas del analista */}
                                                                            <div className="d-flex gap-1">
                                                                                {!ticketsSolicitudReapertura.has(ticket.id) && ticket.estado === 'en_espera' && (
                                                                                    <button
                                                                                        className="btn btn-success btn-sm"
                                                                                        title="Iniciar trabajo en el ticket"
                                                                                        onClick={() => iniciarTrabajo(ticket.id)}
                                                                                    >
                                                                                        <i className="fas fa-play"></i>
                                                                                    </button>
                                                                                )}

                                                                                {!ticketsSolicitudReapertura.has(ticket.id) && ticket.estado === 'en_proceso' && (
                                                                                    <button
                                                                                        className="btn btn-outline-success btn-sm"
                                                                                        title="Marcar como resuelto"
                                                                                        onClick={() => marcarComoResuelto(ticket.id)}
                                                                                    >
                                                                                        <i className="fas fa-check"></i>
                                                                                    </button>
                                                                                )}

                                                                                <button
                                                                                    className="btn btn-outline-warning btn-sm"
                                                                                    title="Escalar ticket al supervisor"
                                                                                    onClick={() => escalarTicket(ticket.id)}
                                                                                >
                                                                                    <i className="fas fa-arrow-up"></i>
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    </td>
                                                                    <td className="text-center px-2">
                                                                        <button
                                                                            className="btn btn-outline-secondary btn-sm"
                                                                            style={{
                                                                                height: '100%',
                                                                                minHeight: '60px',
                                                                                width: '40px',
                                                                                display: 'flex',
                                                                                alignItems: 'center',
                                                                                justifyContent: 'center'
                                                                            }}
                                                                            onClick={() => toggleTicketExpansion(ticket.id)}
                                                                            title={isExpanded ? "Colapsar acciones" : "Expandir acciones"}
                                                                        >
                                                                            <i className={`fas ${isExpanded ? 'fa-arrow-down' : 'fa-arrow-up'}`}></i>
                                                                        </button>
                                                                    </td>
                                                                </tr>

                                                                {/* Fila expandida con acciones grandes - solo se muestra si está expandido */}
                                                                {isExpanded && (
                                                                    <tr className={ticketsSolicitudReapertura.has(ticket.id) ? 'table-warning' : ''}>
                                                                        <td colSpan="8" className="px-0 py-0">
                                                                            <div className={`w-100 border-top ${ticketsSolicitudReapertura.has(ticket.id) ? 'bg-warning bg-opacity-25' : 'bg-light'}`}>
                                                                                {/* Área de acciones expandida - solo botones */}
                                                                                <div className="px-4 py-3">
                                                                                    <div className="d-flex gap-2 flex-wrap justify-content-center">
                                                                                        <button
                                                                                            className="btn btn-sidebar-teal flex-fill"
                                                                                            style={{ minWidth: '120px' }}
                                                                                            title="Ver detalles del ticket"
                                                                                            onClick={() => openVerHD(ticket.id)}
                                                                                        >
                                                                                            <i className="fas fa-eye me-2"></i>
                                                                                            Ver Detalles
                                                                                        </button>
                                                                                        <button
                                                                                            className="btn btn-sidebar-accent flex-fill"
                                                                                            style={{ minWidth: '120px' }}
                                                                                            title="Ver y agregar comentarios"
                                                                                            onClick={() => openComments(ticket.id)}
                                                                                        >
                                                                                            <i className="fas fa-comments me-2"></i>
                                                                                            Comentarios
                                                                                        </button>
                                                                                        <button
                                                                                            className="btn btn-sidebar-secondary flex-fill"
                                                                                            style={{ minWidth: '120px' }}
                                                                                            title="Chat con cliente"
                                                                                            onClick={() => openChat(ticket.id)}
                                                                                        >
                                                                                            <i className="fas fa-comments me-2"></i>
                                                                                            Chat
                                                                                        </button>

                                                                                        {ticketsSolicitudReapertura.has(ticket.id) ? (
                                                                                            <div className="text-center p-2">
                                                                                                <small className="text-muted">Solicitud de reapertura enviada. Esperando resolución del supervisor.</small>
                                                                                            </div>
                                                                                        ) : (
                                                                                            <>
                                                                                                {ticket.estado === 'en_espera' && (
                                                                                                    <button
                                                                                                        className="btn btn-success flex-fill"
                                                                                                        style={{ minWidth: '120px' }}
                                                                                                        onClick={() => iniciarTrabajo(ticket.id)}
                                                                                                    >
                                                                                                        <i className="fas fa-play me-2"></i>
                                                                                                        Iniciar
                                                                                                    </button>
                                                                                                )}

                                                                                                {ticket.estado === 'en_proceso' && (
                                                                                                    <button
                                                                                                        className="btn btn-outline-success flex-fill"
                                                                                                        style={{ minWidth: '120px' }}
                                                                                                        onClick={() => marcarComoResuelto(ticket.id)}
                                                                                                    >
                                                                                                        <i className="fas fa-check me-2"></i>
                                                                                                        Resolver
                                                                                                    </button>
                                                                                                )}

                                                                                                <button
                                                                                                    className="btn btn-outline-warning flex-fill"
                                                                                                    style={{ minWidth: '120px' }}
                                                                                                    onClick={() => escalarTicket(ticket.id)}
                                                                                                >
                                                                                                    <i className="fas fa-arrow-up me-2"></i>
                                                                                                    Escalar
                                                                                                </button>
                                                                                            </>
                                                                                        )}
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        </td>
                                                                    </tr>
                                                                )}
                                                            </React.Fragment>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Profile View */}
                {activeView === 'profile' && (
                    <>
                        {console.log('AnalistaPage - Rendering profile view, activeView:', activeView)}
                        <div className="px-3">
                            <h1 className="hyper-page-title">Mi Perfil</h1>

                            <div className="hyper-widget">
                                <div className="hyper-widget-header">
                                    <h3 className="hyper-widget-title">Información Personal</h3>
                                </div>

                                <div className="px-3">
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
                                                placeholder="Dejar vacío para no cambiar"
                                            />
                                        </div>
                                        <div className="col-md-6">
                                            <label htmlFor="confirmPassword" className="form-label">Confirmar Contraseña</label>
                                            <input
                                                type="password"
                                                className="form-control"
                                                id="confirmPassword"
                                                name="confirmPassword"
                                                value={infoData.confirmPassword}
                                                onChange={handleInfoChange}
                                                placeholder="Confirmar nueva contraseña"
                                            />
                                        </div>
                                    </div>

                                    {error && (
                                        <div className="alert alert-danger mt-3" role="alert">
                                            {error}
                                        </div>
                                    )}

                                    <div className="mt-3 d-flex gap-2">
                                        <button
                                            type="button"
                                            className="btn btn-outline-secondary"
                                            onClick={() => {
                                                setActiveView('tickets');
                                                setError('');
                                                setInfoData(prev => ({
                                                    ...prev,
                                                    password: '',
                                                    confirmPassword: ''
                                                }));
                                            }}
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            type="button"
                                            className="btn btn-primary"
                                            onClick={updateInfo}
                                            disabled={updatingInfo}
                                        >
                                            {updatingInfo ? (
                                                <>
                                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                                    Actualizando...
                                                </>
                                            ) : (
                                                'Actualizar Información'
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
            {modalTicketId && (
                <div className="analista-modal-overlay">
                    <div className="analista-modal-content">
                        <button className="btn btn-sm btn-outline-secondary mb-2" onClick={() => setModalTicketId(null)}>Cerrar</button>
                        <VerTicketHDanalista ticketId={modalTicketId} tickets={tickets} onBack={() => setModalTicketId(null)} />
                    </div>
                </div>
            )}

            {/* Comentarios View */}
            {
                activeView.startsWith('comentarios-') && modalTicketId && (
                    <div className="analista-modal-overlay">
                        <div className="analista-modal-content">
                            <button className="btn btn-sm btn-outline-secondary mb-2" onClick={() => setModalTicketId(null)}>Cerrar</button>
                            <ComentariosTicketEmbedded
                                ticketId={modalTicketId}
                                onBack={() => setModalTicketId(null)}
                            />
                        </div>
                    </div>
                )
            }

            {/* Chat View */}
            {
                activeView.startsWith('chat-') && modalTicketId && (
                    <div className="analista-modal-overlay">
                        <div className="analista-modal-content">
                            <button className="btn btn-sm btn-outline-secondary mb-2" onClick={() => setModalTicketId(null)}>Cerrar</button>
                            <ChatAnalistaClienteEmbedded
                                ticketId={modalTicketId}
                                onBack={() => setModalTicketId(null)}
                            />
                        </div>
                    </div>
                )
            }

            {/* Recomendación IA View */}
            {
                activeView.startsWith('recomendacion-') && modalTicketId && (
                    <div className="analista-modal-overlay">
                        <div className="analista-modal-content">
                            <button className="btn btn-sm btn-outline-secondary mb-2" onClick={() => setModalTicketId(null)}>Cerrar</button>
                            <RecomendacionVistaEmbedded
                                ticketId={modalTicketId}
                                onBack={() => setModalTicketId(null)}
                            />
                        </div>
                    </div>
                )
            }

            {/* Identificar Imagen View */}
            {
                activeView.startsWith('identificar-') && modalTicketId && (
                    <div className="analista-modal-overlay">
                        <div className="analista-modal-content">
                            <button className="btn btn-sm btn-outline-secondary mb-2" onClick={() => setModalTicketId(null)}>Cerrar</button>
                            <IdentificarImagenEmbedded
                                ticketId={modalTicketId}
                                onBack={() => setModalTicketId(null)}
                            />
                        </div>
                    </div>
                )
            }
        </div>
    );
}

export default AnalistaPage;

