import React, { useState, useEffect } from 'react';
import * as storeUtils from '../../store';
import useGlobalReducer from '../../hooks/useGlobalReducer';

export const VerTicketHDCliente = ({ ticketId, tickets, ticketsConRecomendaciones, onBack }) => {
    const { store } = useGlobalReducer();
    const [ticket, setTicket] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [solicitudesReapertura, setSolicitudesReapertura] = useState(new Set());

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

    // Función para cerrar ticket
    const cerrarTicket = async (ticketId) => {
        try {
            const token = store.auth.token;
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/tickets/${ticketId}/cerrar`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                // Actualizar el ticket local
                setTicket(prev => ({ ...prev, estado: 'cerrado' }));
                alert('Ticket cerrado exitosamente');
            } else {
                alert('Error al cerrar el ticket');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error al cerrar el ticket');
        }
    };

    // Función para solicitar reapertura
    const solicitarReapertura = async (ticketId) => {
        try {
            const token = store.auth.token;
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/tickets/${ticketId}/estado`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ estado: 'solicitud_reapertura' })
            });

            if (response.ok) {
                setSolicitudesReapertura(prev => new Set([...prev, ticketId]));
                alert('Solicitud de reapertura enviada al supervisor');
            } else {
                alert('Error al solicitar reapertura');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error al solicitar reapertura');
        }
    };

    useEffect(() => {
        const fetchTicket = async () => {
            try {
                setLoading(true);
                console.log('VerTicketHDCliente - Buscando ticket:', {
                    ticketId,
                    tickets: tickets,
                    ticketsLength: tickets?.length
                });

                // Usar los tickets pasados como prop desde ClientePage
                const ticketsArray = tickets || [];
                console.log('VerTicketHDCliente - Tickets disponibles:', ticketsArray);

                const foundTicket = ticketsArray.find(t => t.id === ticketId);
                console.log('VerTicketHDCliente - Ticket encontrado:', foundTicket);

                if (foundTicket) {
                    setTicket(foundTicket);
                } else {
                    console.log('VerTicketHDCliente - Ticket no encontrado, IDs disponibles:', ticketsArray.map(t => t.id));
                    setError('Ticket no encontrado');
                }
            } catch (err) {
                setError('Error al cargar el ticket');
                console.error('Error:', err);
            } finally {
                setLoading(false);
            }
        };

        if (ticketId && tickets) {
            fetchTicket();
        }
    }, [ticketId, tickets]);

    const getEstadoColor = (estado) => {
        switch (estado?.toLowerCase()) {
            case 'solucionado':
                return 'success';
            case 'en_proceso':
                return 'warning';
            case 'en_espera':
                return 'info';
            default:
                return 'primary';
        }
    };

    const getPrioridadColor = (prioridad) => {
        switch (prioridad?.toLowerCase()) {
            case 'alta':
                return 'danger';
            case 'media':
                return 'warning';
            default:
                return 'success';
        }
    };



    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center loading-container">
                <div className="text-center">
                    <div className="spinner-border text-primary mb-3 spinner-large" role="status">
                        <span className="visually-hidden">Cargando ticket...</span>
                    </div>
                    <h5 className="text-muted">Cargando ticket...</h5>
                </div>
            </div>
        );
    }

    if (error || !ticket) {
        return (
            <div className="d-flex justify-content-center align-items-center loading-container">
                <div className="text-center">
                    <i className="fas fa-exclamation-triangle fa-4x text-warning mb-3"></i>
                    <h4 className="text-muted">{error || 'Ticket no encontrado'}</h4>
                    <button
                        className="btn btn-primary mt-3"
                        onClick={onBack}
                    >
                        <i className="fas fa-arrow-left me-2"></i>
                        Volver
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="container-fluid py-4">
            {/* Header del Ticket */}
            <div className="row mb-4">
                <div className="col-12">
                    <div className="d-flex align-items-center justify-content-between mb-3">
                        <div className="d-flex align-items-center gap-3">
                            <button
                                className="btn btn-outline-secondary"
                                onClick={onBack}
                            >
                                <i className="fas fa-arrow-left me-2"></i>
                                Volver
                            </button>
                            <div>
                                <h1 className="mb-0 fw-bold">Ticket #{ticket.id}</h1>
                                <p className="text-muted mb-0">Vista detallada del ticket</p>
                            </div>
                        </div>
                        <div className="d-flex gap-4">
                            <div className="d-flex flex-column align-items-center">
                                <small className="text-muted mb-1 fw-semibold">ESTADO</small>
                                <span className={`badge bg-${getEstadoColor(ticket.estado)} fs-6 px-3 py-2`}>
                                    {ticket.estado}
                                </span>
                            </div>
                            <div className="d-flex flex-column align-items-center">
                                <small className="text-muted mb-1 fw-semibold">PRIORIDAD</small>
                                <span className={`badge bg-${getPrioridadColor(ticket.prioridad)} fs-6 px-3 py-2`}>
                                    {ticket.prioridad || 'Normal'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="row g-4">
                {/* Información Principal */}
                <div className="col-lg-8">
                    <div className="card border-0 shadow-sm h-100">
                        <div className="card-header bg-white border-0">
                            <h4 className="card-title mb-0">
                                <i className="fas fa-ticket-alt text-primary me-2"></i>
                                {ticket.titulo}
                            </h4>
                        </div>
                        <div className="card-body">
                            <div className="mb-4">
                                <h6 className="fw-semibold mb-2">Descripción</h6>
                                <div className="bg-light p-3 rounded">
                                    <p className="mb-0">{ticket.descripcion}</p>
                                </div>
                            </div>

                            {ticket.url_imagen && (
                                <div className="mb-4">
                                    <h6 className="fw-semibold mb-2">Imagen Adjunta</h6>
                                    <div className="text-center">
                                        <img
                                            src={ticket.url_imagen}
                                            alt="Imagen del ticket"
                                            className="img-fluid rounded shadow-sm image-responsive"
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="row g-3">
                                <div className="col-md-6">
                                    <h6 className="fw-semibold mb-2">Categoría</h6>
                                    <span className="badge bg-secondary fs-6 px-3 py-2">
                                        {ticket.categoria || 'Sin categoría'}
                                    </span>
                                </div>
                                <div className="col-md-6">
                                    <h6 className="fw-semibold mb-2">Fecha de Creación</h6>
                                    <p className="mb-0 text-muted">
                                        <i className="fas fa-calendar-alt me-2"></i>
                                        {new Date(ticket.fecha_creacion).toLocaleString()}
                                    </p>
                                </div>
                            </div>

                            {ticket.fecha_solucion && (
                                <div className="row g-3 mt-3">
                                    <div className="col-md-6">
                                        <h6 className="fw-semibold mb-2">Fecha de Solución</h6>
                                        <p className="mb-0 text-success">
                                            <i className="fas fa-check-circle me-2"></i>
                                            {new Date(ticket.fecha_solucion).toLocaleString()}
                                        </p>
                                    </div>
                                    <div className="col-md-6">
                                        <h6 className="fw-semibold mb-2">Tiempo de Resolución</h6>
                                        <p className="mb-0 text-info">
                                            <i className="fas fa-clock me-2"></i>
                                            {Math.round((new Date(ticket.fecha_solucion) - new Date(ticket.fecha_creacion)) / (1000 * 60 * 60 * 24))} días
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Panel Lateral */}
                <div className="col-lg-4">
                    {/* Información del Analista */}
                    <div className="card border-0 shadow-sm mb-4">
                        <div className="card-header bg-white border-0">
                            <h5 className="card-title mb-0">
                                <i className="fas fa-user-tie text-primary me-2"></i>
                                Analista Asignado
                            </h5>
                        </div>
                        <div className="card-body text-center">
                            {tieneAnalistaAsignado(ticket) ? (
                                <div>
                                    <div className="mb-3">
                                        <div className="bg-primary rounded-circle d-inline-flex align-items-center justify-content-center avatar-large">
                                            <i className="fas fa-user-tie text-white fs-4"></i>
                                        </div>
                                    </div>
                                    <h6 className="fw-semibold">{getAnalistaAsignado(ticket)}</h6>
                                    <p className="text-muted mb-3">Analista de Soporte</p>
                                    <button
                                        className="btn btn-success btn-sm"
                                        onClick={() => window.open(`/ticket/${ticket.id}/chat-analista-cliente`, '_blank')}
                                    >
                                        <i className="fas fa-comments me-1"></i>
                                        Iniciar Chat
                                    </button>
                                </div>
                            ) : (
                                <div>
                                    <div className="mb-3">
                                        <div className="bg-light rounded-circle d-inline-flex align-items-center justify-content-center avatar-large">
                                            <i className="fas fa-clock text-muted fs-4"></i>
                                        </div>
                                    </div>
                                    <h6 className="fw-semibold text-muted">Sin Asignar</h6>
                                    <p className="text-muted mb-3">Esperando asignación</p>
                                    <span className="badge bg-warning">
                                        <i className="fas fa-hourglass-half me-1"></i>
                                        En Cola
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Calificación */}
                    {ticket.calificacion && (
                        <div className="card border-0 shadow-sm mb-4">
                            <div className="card-header bg-white border-0">
                                <h5 className="card-title mb-0">
                                    <i className="fas fa-star text-warning me-2"></i>
                                    Calificación
                                </h5>
                            </div>
                            <div className="card-body text-center">
                                <div className="mb-3">
                                    {[...Array(5)].map((_, i) => (
                                        <i
                                            key={i}
                                            className={`fas fa-star fs-3 ${i < ticket.calificacion ? 'text-warning' : 'text-muted'}`}
                                        ></i>
                                    ))}
                                </div>
                                <h4 className="fw-bold text-warning">{ticket.calificacion}/5</h4>
                                <p className="text-muted mb-0">Calificación del servicio</p>
                            </div>
                        </div>
                    )}

                    {/* Acciones Rápidas */}
                    <div className="card border-0 shadow-sm">
                        <div className="card-header bg-white border-0">
                            <h5 className="card-title mb-0">
                                <i className="fas fa-bolt text-primary me-2"></i>
                                Acciones Rápidas
                            </h5>
                        </div>
                        <div className="card-body">
                            <div className="d-grid gap-3">
                                <button
                                    className="btn btn-outline-primary btn-lg"
                                    onClick={() => window.open(`/ticket/${ticket.id}/comentarios`, '_blank')}
                                >
                                    <i className="fas fa-comments me-2"></i>
                                    Ver Comentarios
                                </button>
                                <button
                                    className={`btn btn-lg ${ticket.analista_asignado ? 'btn-outline-success' : 'btn-outline-primary'}`}
                                    onClick={() => window.open(`/ticket/${ticket.id}/chat-analista-cliente`, '_blank')}
                                >
                                    <i className={`fas ${ticket.analista_asignado ? 'fa-signal' : 'fa-comments'} me-2`}></i>
                                    {ticket.analista_asignado ? `Chat con ${ticket.analista_asignado}` : 'Chat con Analista'}
                                </button>
                                <div className="btn-group" role="group">
                                    <button
                                        className="btn btn-warning btn-lg dropdown-toggle"
                                        type="button"
                                        data-bs-toggle="dropdown"
                                        aria-expanded="false"
                                        title="Opciones de IA"
                                    >
                                        <i className="fas fa-robot me-2"></i> IA
                                    </button>
                                    <ul className="dropdown-menu">
                                        <li>
                                            <button
                                                className="dropdown-item"
                                                onClick={() => {
                                                    setSelectedTicketId(ticket.id);
                                                    changeView(`recomendacion-${ticket.id}`);
                                                }}
                                            >
                                                <i className="fas fa-lightbulb me-2"></i>
                                                Generar Recomendación
                                            </button>
                                        </li>
                                        <li>
                                            <button
                                                className="dropdown-item"
                                                onClick={() => {
                                                    setSelectedTicketId(ticket.id);
                                                    changeView(`identificar-${ticket.id}`);
                                                }}
                                            >
                                                <i className="fas fa-camera me-2"></i>
                                                Analizar Imagen
                                            </button>
                                        </li>
                                    </ul>
                                </div>
                                {ticketsConRecomendaciones && ticketsConRecomendaciones.has(ticket.id) && (
                                    <button
                                        className="btn btn-outline-success btn-lg"
                                        onClick={() => window.open(`/ticket/${ticket.id}/recomendaciones-similares`, '_blank')}
                                    >
                                        <i className="fas fa-lightbulb me-2"></i>
                                        Ver Sugerencias
                                    </button>
                                )}

                                {/* Botones de Cerrar y Reabrir para tickets solucionados - Sincronizado con ClientePage */}
                                {ticket.estado.toLowerCase() === 'solucionado' && !solicitudesReapertura.has(ticket.id) && (
                                    <>
                                        <button
                                            className="btn btn-outline-success btn-lg"
                                            title="Cerrar ticket y calificar servicio"
                                            onClick={() => cerrarTicket(ticket.id)}
                                        >
                                            <i className="fas fa-check me-2"></i>
                                            Cerrar Ticket
                                        </button>
                                        <button
                                            className="btn btn-outline-warning btn-lg"
                                            title="Reabrir ticket si la solución no fue satisfactoria"
                                            onClick={() => solicitarReapertura(ticket.id)}
                                        >
                                            <i className="fas fa-redo me-2"></i>
                                            Solicitar Reapertura
                                        </button>
                                    </>
                                )}

                                {/* Mostrar mensaje si hay solicitud de reapertura pendiente */}
                                {solicitudesReapertura.has(ticket.id) && (
                                    <div className="alert alert-warning">
                                        <i className="fas fa-clock me-2"></i>
                                        Solicitud de reapertura enviada al supervisor. Esperando respuesta.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Timeline del Ticket */}
            <div className="row mt-4">
                <div className="col-12">
                    <div className="card border-0 shadow-sm">
                        <div className="card-header bg-white border-0">
                            <h5 className="card-title mb-0">
                                <i className="fas fa-history text-primary me-2"></i>
                                Historial del Ticket
                            </h5>
                        </div>
                        <div className="card-body">
                            <div className="timeline">
                                <div className="timeline-item">
                                    <div className="timeline-marker bg-primary"></div>
                                    <div className="timeline-content">
                                        <h6 className="fw-semibold">Ticket Creado</h6>
                                        <p className="text-muted mb-1">{new Date(ticket.fecha_creacion).toLocaleString()}</p>
                                        <p className="mb-0">El ticket fue creado y está esperando asignación.</p>
                                    </div>
                                </div>

                                {tieneAnalistaAsignado(ticket) && (
                                    <div className="timeline-item">
                                        <div className="timeline-marker bg-info"></div>
                                        <div className="timeline-content">
                                            <h6 className="fw-semibold">Analista Asignado</h6>
                                            <p className="text-muted mb-1">Analista: {getAnalistaAsignado(ticket)}</p>
                                            <p className="mb-0">El ticket ha sido asignado a un analista.</p>
                                        </div>
                                    </div>
                                )}

                                {ticket.fecha_solucion && (
                                    <div className="timeline-item">
                                        <div className="timeline-marker bg-success"></div>
                                        <div className="timeline-content">
                                            <h6 className="fw-semibold">Ticket Solucionado</h6>
                                            <p className="text-muted mb-1">{new Date(ticket.fecha_solucion).toLocaleString()}</p>
                                            <p className="mb-0">El ticket ha sido resuelto exitosamente.</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VerTicketHDCliente;
