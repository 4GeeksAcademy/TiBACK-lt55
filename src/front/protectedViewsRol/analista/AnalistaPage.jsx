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
    const { store, logout, connectWebSocket, disconnectWebSocket, joinRoom, joinTicketRoom, joinCriticalRooms, joinAllCriticalRooms, emitCriticalTicketAction, joinChatAnalistaCliente, joinChatSupervisorAnalista } = useGlobalReducer();

    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [ticketsSolicitudReapertura, setTicketsSolicitudReapertura] = useState(new Set());
    const [expandedTickets, setExpandedTickets] = useState(new Set());
    const [modalTicketId, setModalTicketId] = useState(null);
    const [sidebarHidden, setSidebarHidden] = useState(false);
    const [activeView, setActiveView] = useState('tickets');

    const toggleTicketExpansion = (ticketId) => {
        setExpandedTickets(prev => {
            const copy = new Set(prev);
            if (copy.has(ticketId)) copy.delete(ticketId);
            else copy.add(ticketId);
            return copy;
        });
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
                        <div>
                            <button className="hyper-sidebar-toggle btn btn-link p-2" onClick={() => setSidebarHidden(!sidebarHidden)}><i className="fas fa-bars"></i></button>
                            <span className="fw-semibold">{store.auth.user?.nombre || 'Analista'}</span>
                        </div>
                        <div className="d-flex align-items-center gap-2">
                            <button
                                className="btn btn-link"
                                onClick={() => navigate('/')}
                                title="Ir al inicio"
                            >
                                <i className="fas fa-home"></i>
                            </button>
                            <button className="btn btn-link text-danger" onClick={logout}><i className="fas fa-sign-out-alt"></i></button>
                        </div>
                    </div>
                </header>

                <div className="p-4">
                    <h1>Mis Tickets</h1>
                    <div className="hyper-widget card border-0 shadow-sm">
                        <div className="hyper-widget-body">
                            <div className="table-responsive">
                                <table className="table table-hover mb-0">
                                    <thead className="table-light">
                                        <tr>
                                            <th>ID</th>
                                            <th>Título</th>
                                            <th>Estado</th>
                                            <th>Prioridad</th>
                                            <th>Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {tickets.map(ticket => {
                                            const isExpanded = expandedTickets.has(ticket.id);
                                            return (
                                                <React.Fragment key={ticket.id}>
                                                    <tr data-ticket-id={ticket.id} className={ticketsSolicitudReapertura.has(ticket.id) ? 'table-warning' : ''}>
                                                        <td>#{ticket.id}</td>
                                                        <td>{ticket.titulo}</td>
                                                        <td>
                                                            <span className={getEstadoColor(ticket.estado)}>{ticket.estado}</span>
                                                            {ticketsSolicitudReapertura.has(ticket.id) && <span className="badge bg-warning ms-2">Solicitud enviada</span>}
                                                        </td>
                                                        <td>{ticket.prioridad || 'Normal'}</td>
                                                        <td>
                                                            <div className="d-flex flex-wrap gap-1 justify-content-center">
                                                                {/* Ver detalles */}
                                                                <button
                                                                    className="btn btn-sidebar-teal btn-sm"
                                                                    title="Ver detalles"
                                                                    onClick={() => openVerHD(ticket.id)}
                                                                >
                                                                    <i className="fas fa-eye"></i>
                                                                </button>

                                                                {/* Comentarios */}
                                                                <button
                                                                    className="btn btn-sidebar-accent btn-sm"
                                                                    title="Ver y agregar comentarios"
                                                                    onClick={() => openComments(ticket.id)}
                                                                >
                                                                    <i className="fas fa-users"></i>
                                                                </button>

                                                                {/* Chat */}
                                                                <button
                                                                    className="btn btn-sidebar-secondary btn-sm"
                                                                    title="Chat con cliente"
                                                                    onClick={() => openChat(ticket.id)}
                                                                >
                                                                    <i className="fas fa-comments"></i>
                                                                </button>

                                                                {/* Acciones de estado (mantener texto para claridad) */}
                                                                {!ticketsSolicitudReapertura.has(ticket.id) && ticket.estado === 'en_espera' && (
                                                                    <button className="btn btn-success btn-sm" onClick={() => iniciarTrabajo(ticket.id)}>Iniciar</button>
                                                                )}

                                                                {!ticketsSolicitudReapertura.has(ticket.id) && ticket.estado === 'en_proceso' && (
                                                                    <button className="btn btn-outline-success btn-sm" onClick={() => marcarComoResuelto(ticket.id)}>Resolver</button>
                                                                )}

                                                                <button className="btn btn-outline-warning btn-sm" onClick={() => escalarTicket(ticket.id)}>Escalar</button>

                                                                <button
                                                                    className="btn btn-outline-secondary btn-sm"
                                                                    onClick={() => toggleTicketExpansion(ticket.id)}
                                                                    title={isExpanded ? 'Colapsar' : 'Expandir'}
                                                                >
                                                                    <i className={`fas ${isExpanded ? 'fa-arrow-down' : 'fa-arrow-up'}`}></i>
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>

                                                    {isExpanded && (
                                                        <tr className={ticketsSolicitudReapertura.has(ticket.id) ? 'table-warning' : ''}>
                                                            <td colSpan="5" className="px-0 py-0">
                                                                <div className={`w-100 border-top ${ticketsSolicitudReapertura.has(ticket.id) ? 'bg-warning bg-opacity-25' : 'bg-light'}`}>
                                                                    <div className="px-4 py-3">
                                                                        <div className="d-flex gap-2 flex-wrap justify-content-center">
                                                                            <button className="btn btn-sidebar-teal flex-fill" style={{ minWidth: '140px' }} onClick={() => navigate(`/ticket/${ticket.id}`)}>
                                                                                <i className="fas fa-eye me-2"></i> Ver Detalles
                                                                            </button>

                                                                            <button className="btn btn-sidebar-accent flex-fill" style={{ minWidth: '140px' }} onClick={() => openComments(ticket.id)}>
                                                                                <i className="fas fa-comments me-2"></i> Comentarios
                                                                            </button>

                                                                            <button className="btn btn-sidebar-secondary flex-fill" style={{ minWidth: '140px' }} onClick={() => openChat(ticket.id)}>
                                                                                <i className="fas fa-comments me-2"></i> Chat
                                                                            </button>

                                                                            {ticketsSolicitudReapertura.has(ticket.id) ? (
                                                                                <div className="text-center p-2">
                                                                                    <small className="text-muted">Solicitud de reapertura enviada. Esperando resolución del supervisor.</small>
                                                                                </div>
                                                                            ) : (
                                                                                <>
                                                                                    {ticket.estado === 'en_espera' && (
                                                                                        <button className="btn btn-success flex-fill" style={{ minWidth: '140px' }} onClick={() => iniciarTrabajo(ticket.id)}>
                                                                                            <i className="fas fa-play me-2"></i> Iniciar
                                                                                        </button>
                                                                                    )}

                                                                                    {ticket.estado === 'en_proceso' && (
                                                                                        <button className="btn btn-outline-success flex-fill" style={{ minWidth: '140px' }} onClick={() => marcarComoResuelto(ticket.id)}>
                                                                                            <i className="fas fa-check me-2"></i> Resolver
                                                                                        </button>
                                                                                    )}

                                                                                    <button className="btn btn-outline-warning flex-fill" style={{ minWidth: '140px' }} onClick={() => escalarTicket(ticket.id)}>
                                                                                        <i className="fas fa-arrow-up me-2"></i> Escalar
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
                        </div>
                    </div>
                </div>
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
