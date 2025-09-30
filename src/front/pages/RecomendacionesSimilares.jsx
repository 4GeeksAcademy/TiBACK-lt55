import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import useGlobalReducer from '../hooks/useGlobalReducer';

const RecomendacionesSimilares = () => {
    const { ticketId } = useParams();
    const navigate = useNavigate();
    const { store } = useGlobalReducer();
    const [ticketsSimilares, setTicketsSimilares] = useState([]);
    const [ticketActual, setTicketActual] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [comentariosPorTicket, setComentariosPorTicket] = useState({});

    useEffect(() => {
        const cargarRecomendaciones = async () => {
            try {
                setLoading(true);
                const token = store.auth.token;
                const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/tickets/${ticketId}/recomendaciones-similares`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.ok) {
                    throw new Error('Error al cargar recomendaciones');
                }

                const data = await response.json();
                setTicketsSimilares(data.tickets_similares);
                setTicketActual(data.ticket_actual);

                // Cargar comentarios para cada ticket
                if (data.tickets_similares.length > 0) {
                    await cargarComentariosTickets(data.tickets_similares);
                }
            } catch (err) {
                console.error('Error cargando recomendaciones:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        cargarRecomendaciones();
    }, [ticketId, store.auth.token]);

    const cargarComentariosTickets = async (tickets) => {
        try {
            const comentariosPromises = tickets.map(async (ticket) => {
                const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/tickets/${ticket.id}/comentarios`, {
                    headers: {
                        'Authorization': `Bearer ${store.auth.token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (response.ok) {
                    const comentarios = await response.json();

                    // Filtrar comentarios: solo mostrar comentarios de usuarios y recomendaciones de IA
                    // NO mostrar historial del ticket (transacciones automáticas)
                    const comentariosFiltrados = comentarios.filter(comentario => {
                        const texto = comentario.texto.toLowerCase();

                        // Excluir transacciones automáticas del historial del ticket
                        const esTransaccionAutomatica =
                            texto.includes('ticket asignado') ||
                            texto.includes('ticket reasignado') ||
                            texto.includes('ticket solucionado') ||
                            texto.includes('ticket escalado') ||
                            texto.includes('ticket iniciado') ||
                            texto.includes('ticket reabierto') ||
                            texto.includes('cliente solicita reapertura') ||
                            texto.includes('ticket cerrado por cliente') ||
                            texto.includes('ticket cerrado por supervisor') ||
                            texto.includes('ticket reabierto por cliente') ||
                            texto.includes('ticket reabierto por supervisor');

                        // Incluir solo comentarios de usuarios y recomendaciones de IA
                        const esComentarioUsuario = comentario.autor &&
                            (comentario.autor.rol === 'cliente' ||
                                comentario.autor.rol === 'analista' ||
                                comentario.autor.rol === 'supervisor');

                        const esRecomendacionIA = texto.includes('recomendación') ||
                            texto.includes('diagnóstico') ||
                            texto.includes('pasos de solución') ||
                            texto.includes('🤖 recomendación de ia generada') ||
                            texto.includes('🤖 análisis de imagen con ia:');

                        return !esTransaccionAutomatica && (esComentarioUsuario || esRecomendacionIA);
                    });

                    return { ticketId: ticket.id, comentarios: comentariosFiltrados };
                }
                return { ticketId: ticket.id, comentarios: [] };
            });

            const resultados = await Promise.all(comentariosPromises);
            const comentariosMap = {};
            resultados.forEach(({ ticketId, comentarios }) => {
                comentariosMap[ticketId] = comentarios;
            });
            setComentariosPorTicket(comentariosMap);
        } catch (error) {
            console.error('Error cargando comentarios:', error);
        }
    };

    const getRoleColor = (rol) => {
        switch (rol) {
            case 'cliente': return 'text-primary';
            case 'analista': return 'text-success';
            case 'supervisor': return 'text-warning';
            case 'administrador': return 'text-danger';
            default: return 'text-muted';
        }
    };

    const getRoleIcon = (rol) => {
        switch (rol) {
            case 'cliente': return 'fas fa-user';
            case 'analista': return 'fas fa-user-tie';
            case 'supervisor': return 'fas fa-user-shield';
            case 'administrador': return 'fas fa-crown';
            default: return 'fas fa-user';
        }
    };

    const formatFecha = (fecha) => {
        return new Date(fecha).toLocaleString();
    };

    if (loading) {
        return (
            <div className="container mt-4">
                <div className="d-flex justify-content-center">
                    <div className="spinner-border" role="status">
                        <span className="visually-hidden">Cargando recomendaciones...</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="container mt-4">
            <div className="row">
                <div className="col-12">
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <div>
                            <h2>
                                <i className="fas fa-lightbulb me-2 text-warning"></i>
                                Recomendaciones de Tickets Similares
                            </h2>
                            <p className="text-muted mb-0">
                                Tickets resueltos con problemas similares al ticket #{ticketId}
                            </p>
                        </div>
                        <button
                            className="btn btn-outline-secondary"
                            onClick={() => navigate(`/ticket/${ticketId}/comentarios`)}
                        >
                            <i className="fas fa-arrow-left me-1"></i>
                            Volver a Comentarios
                        </button>
                    </div>

                    {error && (
                        <div className="alert alert-danger" role="alert">
                            <i className="fas fa-exclamation-triangle me-2"></i>
                            {error}
                        </div>
                    )}

                    {ticketActual && (
                        <div className="card mb-4">
                            <div className="card-header bg-primary text-white">
                                <h5 className="mb-0">
                                    <i className="fas fa-ticket-alt me-2"></i>
                                    Tu Ticket Actual
                                </h5>
                            </div>
                            <div className="card-body">
                                <h6 className="card-title">{ticketActual.titulo}</h6>
                                <p className="card-text">{ticketActual.descripcion}</p>
                                <div className="d-flex justify-content-between align-items-center">
                                    <span className={`badge ${ticketActual.estado === 'cerrado' ? 'bg-success' : 'bg-warning'}`}>
                                        {ticketActual.estado}
                                    </span>
                                    <small className="text-muted">
                                        Prioridad: {ticketActual.prioridad}
                                    </small>
                                </div>
                            </div>
                        </div>
                    )}

                    {ticketsSimilares.length === 0 ? (
                        <div className="text-center py-5">
                            <i className="fas fa-search fa-3x text-muted mb-3"></i>
                            <h5 className="text-muted">No se encontraron tickets similares</h5>
                            <p className="text-muted">
                                No hay tickets resueltos con problemas similares al tuyo.
                            </p>
                        </div>
                    ) : (
                        <div className="row">
                            {ticketsSimilares.map((ticket) => (
                                <div key={ticket.id} className="col-md-6 mb-4">
                                    <div className="card h-100">
                                        <div className="card-header d-flex justify-content-between align-items-center">
                                            <div>
                                                <h6 className="mb-0">
                                                    <i className="fas fa-ticket-alt me-2"></i>
                                                    Ticket #{ticket.id}
                                                </h6>
                                                <small className="text-muted">
                                                    Similitud: {(ticket.similitud * 100).toFixed(1)}%
                                                </small>
                                            </div>
                                            <span className="badge bg-success">
                                                <i className="fas fa-check me-1"></i>
                                                Resuelto
                                            </span>
                                        </div>
                                        <div className="card-body">
                                            <h6 className="card-title">{ticket.titulo}</h6>
                                            <p className="card-text text-muted">{ticket.descripcion}</p>

                                            <div className="mb-3">
                                                <small className="text-muted">
                                                    <i className="fas fa-user me-1"></i>
                                                    Cliente: {ticket.cliente?.nombre} {ticket.cliente?.apellido}
                                                </small>
                                            </div>

                                            <div className="mb-3">
                                                <small className="text-muted">
                                                    <i className="fas fa-calendar me-1"></i>
                                                    Creado: {formatFecha(ticket.fecha_creacion)}
                                                </small>
                                            </div>

                                            {ticket.fecha_cierre && (
                                                <div className="mb-3">
                                                    <small className="text-muted">
                                                        <i className="fas fa-calendar-check me-1"></i>
                                                        Cerrado: {formatFecha(ticket.fecha_cierre)}
                                                    </small>
                                                </div>
                                            )}

                                            {ticket.calificacion && (
                                                <div className="mb-3">
                                                    <small className="text-muted">
                                                        <i className="fas fa-star me-1"></i>
                                                        Calificación: {ticket.calificacion}/5
                                                    </small>
                                                </div>
                                            )}
                                        </div>

                                        <div className="card-footer">
                                            <div className="d-flex justify-content-between align-items-center">
                                                <div className="flex-grow-1 me-3">
                                                    {comentariosPorTicket[ticket.id] && comentariosPorTicket[ticket.id].length > 0 ? (
                                                        <div className="accordion" id={`accordion-${ticket.id}`}>
                                                            <div className="accordion-item">
                                                                <h2 className="accordion-header" id={`heading-${ticket.id}`}>
                                                                    <button
                                                                        className="accordion-button collapsed"
                                                                        type="button"
                                                                        data-bs-toggle="collapse"
                                                                        data-bs-target={`#collapse-${ticket.id}`}
                                                                        aria-expanded="false"
                                                                        aria-controls={`collapse-${ticket.id}`}
                                                                    >
                                                                        <i className="fas fa-comments me-2"></i>
                                                                        Ver Comentarios ({comentariosPorTicket[ticket.id].length})
                                                                    </button>
                                                                </h2>
                                                                <div
                                                                    id={`collapse-${ticket.id}`}
                                                                    className="accordion-collapse collapse"
                                                                    aria-labelledby={`heading-${ticket.id}`}
                                                                >
                                                                    <div className="accordion-body">
                                                                        <div className="comentarios-container" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                                                            {comentariosPorTicket[ticket.id].map((comentario, index) => {
                                                                                const esRecomendacionIA = comentario.texto.toLowerCase().includes('recomendación') ||
                                                                                    comentario.texto.toLowerCase().includes('diagnóstico') ||
                                                                                    comentario.texto.toLowerCase().includes('pasos de solución');

                                                                                return (
                                                                                    <div key={index} className="mb-3">
                                                                                        <div className="d-flex align-items-start">
                                                                                            <div className="flex-shrink-0 me-3">
                                                                                                {esRecomendacionIA ? (
                                                                                                    <i className="fas fa-robot text-warning"></i>
                                                                                                ) : (
                                                                                                    <i className={`${getRoleIcon(comentario.autor?.rol)} ${getRoleColor(comentario.autor?.rol)}`}></i>
                                                                                                )}
                                                                                            </div>
                                                                                            <div className="flex-grow-1">
                                                                                                <div className={`card ${esRecomendacionIA ? 'border-warning' : ''}`}>
                                                                                                    <div className={`card-header d-flex justify-content-between align-items-center py-2 ${esRecomendacionIA ? 'bg-warning bg-opacity-10' : ''}`}>
                                                                                                        <div>
                                                                                                            {esRecomendacionIA ? (
                                                                                                                <div>
                                                                                                                    <strong className="text-warning">
                                                                                                                        <i className="fas fa-robot me-1"></i>
                                                                                                                        Recomendación de IA
                                                                                                                    </strong>
                                                                                                                </div>
                                                                                                            ) : (
                                                                                                                <div>
                                                                                                                    <strong className={getRoleColor(comentario.autor?.rol)}>
                                                                                                                        {comentario.autor?.nombre || 'Sistema'}
                                                                                                                    </strong>
                                                                                                                    <small className="text-muted ms-2">
                                                                                                                        ({comentario.autor?.rol || 'sistema'})
                                                                                                                    </small>
                                                                                                                </div>
                                                                                                            )}
                                                                                                        </div>
                                                                                                        <small className="text-muted">
                                                                                                            {formatFecha(comentario.fecha_comentario)}
                                                                                                        </small>
                                                                                                    </div>
                                                                                                    <div className="card-body py-2">
                                                                                                        <p className="mb-0">{comentario.texto}</p>
                                                                                                    </div>
                                                                                                </div>
                                                                                            </div>
                                                                                        </div>
                                                                                    </div>
                                                                                );
                                                                            })}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="d-flex align-items-center">
                                                            <span className="text-muted">
                                                                <i className="fas fa-comments me-2"></i>
                                                                Sin comentarios disponibles
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>

                                                <Link
                                                    to={`/ticket/${ticket.id}/recomendaciones-ia`}
                                                    className="btn btn-warning btn-sm"
                                                    style={{ minWidth: '140px', flexShrink: 0 }}
                                                    title="Ver recomendaciones guardadas de IA"
                                                >
                                                    <i className="fas fa-robot me-1"></i>
                                                    Recomendaciones IA
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RecomendacionesSimilares;