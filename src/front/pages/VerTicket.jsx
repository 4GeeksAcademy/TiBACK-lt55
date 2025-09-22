import React, { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import useGlobalReducer from "../hooks/useGlobalReducer";

export const VerTicket = () => {
    const { store, dispatch, joinTicketRoom, leaveTicketRoom } = useGlobalReducer();
    const { id } = useParams();
    const navigate = useNavigate();
    const API = import.meta.env.VITE_BACKEND_URL + "/api";

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

    const cargarTicket = () => {
        setLoading(true);
        fetchJson(`${API}/tickets/${id}`)
            .then(({ ok, data }) => {
                if (!ok) throw new Error(data.message);
                dispatch({ type: "ticket_set_detail", payload: data });
            })
            .catch(setError)
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        if (id && (!store.ticketDetail || store.ticketDetail.id !== parseInt(id))) {
            cargarTicket();
        }
    }, [id]);

    // Efecto para unirse al room del ticket cuando se carga
    useEffect(() => {
        if (id && store.websocket.socket && store.websocket.connected) {
            // Unirse al room del ticket
            joinTicketRoom(store.websocket.socket, parseInt(id));
            
            // Cleanup: salir del room cuando el componente se desmonte
            return () => {
                leaveTicketRoom(store.websocket.socket, parseInt(id));
            };
        }
    }, [id, store.websocket.socket, store.websocket.connected, joinTicketRoom, leaveTicketRoom]);

    const getEstadoClase = (estado) => {
        switch (estado?.toLowerCase()) {
            case "creado":
                return "badge bg-secondary";
            case "recibido":
                return "badge bg-info";
            case "en_espera":
                return "badge bg-warning";
            case "en_proceso":
                return "badge bg-primary";
            case "solucionado":
                return "badge bg-success";
            case "cerrado":
                return "badge bg-dark";
            case "reabierto":
                return "badge bg-danger";
            default:
                return "badge bg-light text-dark";
        }
    };

    const getPrioridadClase = (prioridad) => {
        switch (prioridad?.toLowerCase()) {
            case "alta":
                return "badge bg-danger";
            case "media":
                return "badge bg-warning";
            case "baja":
                return "badge bg-success";
            default:
                return "badge bg-light text-dark";
        }
    };

    const ticket = store.ticketDetail;


    if (store.api.error) return <div className="alert alert-danger">{store.api.error}</div>;
    if (!ticket) return <div className="alert alert-warning">Ticket no encontrado.</div>;

    return (
        <div className="container py-4">
            <h2>Detalles del Ticket #{ticket.id}</h2>
            <hr />
            <div className="row">
                <div className="col-md-6">
                    <p><strong>Cliente:</strong> {ticket.cliente ? `${ticket.cliente.nombre} ${ticket.cliente.apellido}` : ticket.id_cliente}</p>
                    <p><strong>Estado:</strong> <span className={getEstadoClase(ticket.estado)}>{ticket.estado}</span></p>
                    <p><strong>Prioridad:</strong> <span className={getPrioridadClase(ticket.prioridad)}>{ticket.prioridad}</span></p>
                </div>
                <div className="col-md-6">
                    <p><strong>Título:</strong> {ticket.titulo}</p>
                    <p><strong>Fecha Creación:</strong> {ticket.fecha_creacion ? new Date(ticket.fecha_creacion).toLocaleString() : ''}</p>
                    <p><strong>Fecha Cierre:</strong> {ticket.fecha_cierre ? new Date(ticket.fecha_cierre).toLocaleString() : "No cerrado"}</p>
                </div>
                <div className="col-12">
                    <p><strong>Descripción:</strong> {ticket.descripcion}</p>
                    <p><strong>Comentario:</strong> {ticket.comentario || "Sin comentarios"}</p>
                </div>
                <div className="col-12 mb-3">
                    <p><strong>Imágenes:</strong></p>
                {ticket.img_urls && ticket.img_urls.length > 0 ? (
                    <div className="d-flex flex-wrap gap-3 mt-2">
                        {ticket.img_urls.map((url, idx) => (
                            <img
                                key={idx}
                                src={url}
                                alt={`Imagen ${idx + 1}`}
                                style={{
                                    width: "200px",
                                    height: "200px",
                                    objectFit: "cover",
                                    borderRadius: "8px",
                                    boxShadow: "0 2px 6px rgba(0,0,0,0.2)"
                                }}
                            />
                         ))}
                    </div>
                ) : (
                    <p className="text-muted">No hay imágenes adjuntas</p>
                )}
                </div>
                </div>
            <div className="mt-3">
                <button className="btn btn-secondary me-2" onClick={() => navigate("/tickets")}>
                    <i className="fas fa-arrow-left"></i> Volver
                </button>
                <button className="btn btn-warning" onClick={() => navigate(`/actualizar-ticket/${ticket.id}`)}>
                    <i className="fas fa-edit"></i> Editar
                </button>
            </div>
        </div>
    );
};