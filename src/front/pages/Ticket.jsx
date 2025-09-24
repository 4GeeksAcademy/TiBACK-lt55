import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import useGlobalReducer from "../hooks/useGlobalReducer";

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

export const Ticket = () => {
    const { store, dispatch, connectWebSocket, disconnectWebSocket, joinRoom } = useGlobalReducer();
    const API = import.meta.env.VITE_BACKEND_URL + "/api";
    const navigate = useNavigate();
    const [showModal, setShowModal] = useState(false);
    const [modalImages, setModalImages] = useState([]);
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);

    const setLoading = (v) => dispatch({ type: "api_loading", payload: v });
    const setError = (e) => dispatch({ type: "api_error", payload: e?.message || e });

    const fetchJson = (url, options = {}) => {
        const token = store.auth.token;
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        return fetch(url, {
            ...options,
            headers
        })
            .then(res => res.json().then(data => ({ ok: res.ok, data })))
            .catch(err => ({ ok: false, data: { message: err.message } }));
    };

    const listarTodosLosTickets = () => {
        setLoading(true);
        fetchJson(`${API}/tickets`)
            .then(({ ok, data }) => {
                if (!ok) throw new Error(data.message);
                dispatch({ type: "tickets_set_list", payload: data });
            })
            .catch(setError)
            .finally(() => setLoading(false));
    };

    const eliminarTicket = (id) => {
        if (!window.confirm("¿Estás seguro de que quieres eliminar este ticket?")) return;

        setLoading(true);
        fetchJson(`${API}/tickets/${id}`, { method: "DELETE" })
            .then(({ ok, data }) => {
                if (!ok) throw new Error(data.message);
                dispatch({ type: "tickets_remove", payload: parseInt(id) });
            })
            .catch(setError)
            .finally(() => setLoading(false));
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

    // Actualizar lista de tickets cuando lleguen notificaciones WebSocket
    useEffect(() => {
        if (store.websocket.notifications.length > 0) {
            const lastNotification = store.websocket.notifications[store.websocket.notifications.length - 1];
            console.log('🔔 TICKETS - Notificación recibida:', lastNotification);

            // Si es un evento relacionado con tickets, recargar la lista
            if (lastNotification.tipo === 'creado' ||
                lastNotification.tipo === 'actualizado' ||
                lastNotification.tipo === 'asignado' ||
                lastNotification.tipo === 'eliminado' ||
                lastNotification.tipo === 'ticket_creado') {
                console.log('⚡ TICKETS - Recargando lista por notificación:', lastNotification.tipo);
                listarTodosLosTickets();
            }
        }
    }, [store.websocket.notifications]);

    useEffect(() => {
        if (!store.tickets || store.tickets.length === 0) {
            listarTodosLosTickets();
        }
    }, []);

    const getEstadoBadgeClass = (estado) => {
        switch (estado?.toLowerCase()) {
            case 'creado': return 'badge bg-secondary';
            case 'recibido': return 'badge bg-info';
            case 'en_espera': return 'badge bg-warning';
            case 'en_proceso': return 'badge bg-primary';
            case 'solucionado': return 'badge bg-success';
            case 'cerrado': return 'badge bg-dark';
            case 'reabierto': return 'badge bg-danger';
            default: return 'badge bg-light text-dark';
        }
    };

    const getPrioridadBadgeClass = (prioridad) => {
        switch (prioridad?.toLowerCase()) {
            case 'alta': return 'badge bg-danger';
            case 'media': return 'badge bg-warning';
            case 'baja': return 'badge bg-success';
            default: return 'badge bg-light text-dark';
        }
    };

    return (
        <div className="container py-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                    <h2 className="mb-0">Gestión de Tickets</h2>
                    {store.websocket.connected && (
                        <div className="d-flex align-items-center mt-1">
                            <span className="badge bg-success me-2">
                                <i className="fas fa-wifi me-1"></i>
                                Conectado
                            </span>
                        </div>
                    )}
                </div>
                <button className="btn btn-secondary" onClick={() => navigate(`/administrador`)}>Volver</button>
            </div>

            {store?.api?.error && (
                <div className="alert alert-danger py-2">{String(store.api.error)}</div>
            )}
            <div className="d-flex justify-content-end mb-3">
                <button
                    className="btn btn-primary"
                    onClick={() => navigate("/tickets/nuevo")}
                >
                    <i className="fas fa-plus"></i> Nuevo Ticket
                </button>
            </div>

            <div className="card">
                <div className="card-header d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">Lista de Tickets</h5>
                    <button className="btn btn-primary" onClick={listarTodosLosTickets}>
                        <i className="fas fa-refresh"></i> Actualizar Lista
                    </button>
                </div>
                <div className="card-body">
                    {Array.isArray(store.tickets) && store.tickets.length > 0 ? (
                        <div className="table-responsive">
                            <table className="table table-striped">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Cliente</th>
                                        <th>Imagen</th>
                                        <th>Estado</th>
                                        <th>Título</th>
                                        <th>Prioridad</th>
                                        <th>Fecha Creación</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {store.tickets.map((ticket) => (
                                        <tr key={ticket.id}>
                                            <td>{ticket.id}</td>
                                            <td>
                                                {ticket.cliente ? `${ticket.cliente.nombre} ${ticket.cliente.apellido}` : ticket.id_cliente}
                                            </td>
                                            <td>
                                                {Array.isArray(ticket.img_urls) && ticket.img_urls.length > 0 ? (
                                                    <img
                                                        src={ticket.img_urls[0]}
                                                        alt={`ticket-${ticket.id}-img`}
                                                        style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 6, border: '1px solid #ccc', cursor: 'pointer' }}
                                                        onClick={() => {
                                                            setModalImages(ticket.img_urls);
                                                            setSelectedImageIndex(0);
                                                            setShowModal(true);
                                                        }}
                                                    />
                                                ) : (
                                                    <span className="text-muted">Sin imagen</span>
                                                )}
                                            </td>
                                            <td>
                                                <span className={getEstadoBadgeClass(ticket.estado)}>{ticket.estado}</span>
                                            </td>
                                            <td style={{
                                                maxWidth: '200px',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap'
                                            }}>
                                                {ticket.titulo}
                                            </td>
                                            <td>
                                                <span className={getPrioridadBadgeClass(ticket.prioridad)}>{ticket.prioridad}</span>
                                            </td>
                                            <td>{ticket.fecha_creacion ? new Date(ticket.fecha_creacion).toLocaleString() : ''}</td>
                                            <td>
                                                <button
                                                    className="btn btn-info mx-1"
                                                    title="Ver Ticket"
                                                    onClick={() => navigate(`/ver-ticket/${ticket.id}`)}
                                                >
                                                    <i className="fas fa-eye"></i>
                                                </button>
                                                <button
                                                    className="btn btn-danger mx-1"
                                                    title="Eliminar Ticket"
                                                    onClick={() => eliminarTicket(ticket.id)}
                                                >
                                                    <i className="fas fa-trash"></i>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-4">
                            <p className="text-muted">No hay tickets registrados.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal de imágenes con carrusel */}
            {showModal && Array.isArray(modalImages) && modalImages.length > 0 && (
                <div className="modal fade show" style={{ display: 'block', background: 'rgba(0,0,0,0.7)' }} tabIndex="-1" role="dialog">
                    <div className="modal-dialog modal-dialog-centered" role="document">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Imagen {selectedImageIndex + 1} de {modalImages.length}</h5>
                                <button type="button" className="btn-close" aria-label="Close" onClick={() => setShowModal(false)}></button>
                            </div>
                            <div className="modal-body d-flex flex-column align-items-center">
                                <img
                                    src={modalImages[selectedImageIndex]}
                                    alt={`ticket-img-${selectedImageIndex}`}
                                    style={{ maxWidth: 500, maxHeight: 400, borderRadius: 8, border: '1px solid #ccc' }}
                                />
                                {modalImages.length > 1 && (
                                    <div className="mt-3">
                                        <button className="btn btn-secondary btn-sm me-2" onClick={() => setSelectedImageIndex((selectedImageIndex - 1 + modalImages.length) % modalImages.length)}>&lt;</button>
                                        <button className="btn btn-secondary btn-sm" onClick={() => setSelectedImageIndex((selectedImageIndex + 1) % modalImages.length)}>&gt;</button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
