import React, { useState, useEffect } from 'react';
import * as storeUtils from '../../store';
import useGlobalReducer from '../../hooks/useGlobalReducer';

export const VerTicketHDSupervisor = ({ ticketId, tickets, ticketsConRecomendaciones, onBack, analistas }) => {
    const { store } = useGlobalReducer();
    const [ticket, setTicket] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showAsignarModal, setShowAsignarModal] = useState(false);
    const [selectedAnalista, setSelectedAnalista] = useState('');

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

    useEffect(() => {
        const fetchTicket = async () => {
            try {
                setLoading(true);
                console.log('VerTicketHDSupervisor - Buscando ticket:', {
                    ticketId,
                    tickets: tickets,
                    ticketsLength: tickets?.length
                });

                // Usar los tickets pasados como prop desde SupervisorPage
                const ticketsArray = tickets || [];
                console.log('VerTicketHDSupervisor - Tickets disponibles:', ticketsArray);

                const foundTicket = ticketsArray.find(t => t.id === ticketId);
                console.log('VerTicketHDSupervisor - Ticket encontrado:', foundTicket);

                if (foundTicket) {
                    setTicket(foundTicket);
                } else {
                    console.log('VerTicketHDSupervisor - Ticket no encontrado, IDs disponibles:', ticketsArray.map(t => t.id));
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
            case 'escalado':
                return 'danger';
            case 'cerrado':
                return 'secondary';
            default:
                return 'primary';
        }
    };

    const getPrioridadColor = (prioridad) => {
        switch (prioridad?.toLowerCase()) {
            case 'critica':
                return 'dark';
            case 'alta':
                return 'danger';
            case 'media':
                return 'warning';
            case 'baja':
                return 'success';
            default:
                return 'secondary';
        }
    };



    const asignarAnalista = async () => {
        if (!selectedAnalista) {
            alert('Por favor selecciona un analista');
            return;
        }

        try {
            const token = store.auth.token;
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/tickets/${ticket.id}/asignar`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    id_analista: parseInt(selectedAnalista)
                })
            });

            if (response.ok) {
                alert('Analista asignado exitosamente');
                setShowAsignarModal(false);
                setSelectedAnalista('');
                // Recargar el ticket
                window.location.reload();
            } else {
                const errorData = await response.json();
                alert(`Error al asignar analista: ${errorData.message || 'Error desconocido'}`);
            }
        } catch (err) {
            alert(`Error al asignar analista: ${err.message}`);
        }
    };

    const escalarTicket = async () => {
        if (confirm('¿Estás seguro de que quieres escalar este ticket?')) {
            try {
                const token = store.auth.token;
                const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/tickets/${ticket.id}/escalar`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (response.ok) {
                    alert('Ticket escalado exitosamente');
                    window.location.reload();
                } else {
                    const errorData = await response.json();
                    alert(`Error al escalar ticket: ${errorData.message || 'Error desconocido'}`);
                }
            } catch (err) {
                alert(`Error al escalar ticket: ${err.message}`);
            }
        }
    };

    const cerrarTicket = async () => {
        if (confirm('¿Estás seguro de que quieres cerrar este ticket?')) {
            try {
                const token = store.auth.token;
                const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/tickets/${ticket.id}/cerrar`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (response.ok) {
                    alert('Ticket cerrado exitosamente');
                    window.location.reload();
                } else {
                    const errorData = await response.json();
                    alert(`Error al cerrar ticket: ${errorData.message || 'Error desconocido'}`);
                }
            } catch (err) {
                alert(`Error al cerrar ticket: ${err.message}`);
            }
        }
    };

    const reabrirTicket = async () => {
        if (confirm('¿Estás seguro de que quieres reabrir este ticket?')) {
            try {
                const token = store.auth.token;

                // CAMBIO 6: Lógica inteligente según estado actual del ticket
                let nuevoEstado = 'en_espera'; // Default

                if (ticket) {
                    const estadoActual = ticket.estado.toLowerCase();

                    if (estadoActual === 'solucionado') {
                        // Desde solucionado puede ir a 'en espera' (reapertura)
                        nuevoEstado = 'en espera';
                    } else if (['creado', 'reabierto'].includes(estadoActual)) {
                        // Desde creado o reabierto puede ir a 'en_espera'  
                        nuevoEstado = 'en espera';
                    } else {
                        // Para otros estados no hay transición válida directa
                        alert('No se puede reabrir este ticket desde su estado actual. El ticket debe estar solucionado o cerrado.');
                        return;
                    }
                }

                console.log(`🔄 Reabriendo ticket ${ticket.id}: ${ticket?.estado} → ${nuevoEstado}`);

                const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/tickets/${ticket.id}/estado`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        estado: nuevoEstado
                    })
                });

                if (response.ok) {
                    alert('Ticket reabierto exitosamente');
                    window.location.reload();
                } else {
                    const errorData = await response.json();
                    alert(`Error al reabrir ticket: ${errorData.message || 'Error desconocido'}`);
                }
            } catch (err) {
                alert(`Error al reabrir ticket: ${err.message}`);
            }
        }
    };
    // FIN CAMBIO 6

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
                                <p className="text-muted mb-0">Vista detallada del ticket - Supervisor</p>
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
                                    <h6 className="fw-semibold mb-2">Cliente</h6>
                                    <p className="mb-0">
                                        <i className="fas fa-user me-2"></i>
                                        {ticket.cliente?.nombre} {ticket.cliente?.apellido}
                                    </p>
                                </div>
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
                                        {storeUtils.formatDate(ticket.fecha_creacion)}
                                    </p>
                                </div>
                                <div className="col-md-6">
                                    <h6 className="fw-semibold mb-2">Email del Cliente</h6>
                                    <p className="mb-0 text-muted">
                                        <i className="fas fa-envelope me-2"></i>
                                        {ticket.cliente?.email || 'No disponible'}
                                    </p>
                                </div>
                            </div>

                            {ticket.fecha_solucion && (
                                <div className="row g-3 mt-3">
                                    <div className="col-md-6">
                                        <h6 className="fw-semibold mb-2">Fecha de Solución</h6>
                                        <p className="mb-0 text-success">
                                            <i className="fas fa-check-circle me-2"></i>
                                            {storeUtils.formatDate(ticket.fecha_solucion)}
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
                                    <div className="d-grid gap-2">
                                        <button
                                            className="btn btn-success btn-sm"
                                            onClick={() => window.open(`/ticket/${ticket.id}/chat`, '_blank')}
                                        >
                                            <i className="fas fa-comments me-1"></i>
                                            Ver Chat
                                        </button>
                                        <button
                                            className="btn btn-warning btn-sm"
                                            onClick={() => setShowAsignarModal(true)}
                                        >
                                            <i className="fas fa-user-edit me-1"></i>
                                            Reasignar
                                        </button>
                                    </div>
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
                                    <button
                                        className="btn btn-primary btn-sm"
                                        onClick={() => setShowAsignarModal(true)}
                                    >
                                        <i className="fas fa-user-plus me-1"></i>
                                        Asignar Analista
                                    </button>
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

                    {/* Acciones de Gestión */}
                    <div className="card border-0 shadow-sm">
                        <div className="card-header bg-white border-0">
                            <h5 className="card-title mb-0">
                                <i className="fas fa-cogs text-primary me-2"></i>
                                Acciones de Gestión
                            </h5>
                        </div>
                        <div className="card-body">
                            <div className="d-grid gap-2">
                                <button
                                    className="btn btn-sidebar-teal btn-sm"
                                    onClick={() => window.open(`/ticket/${ticket.id}/comentarios`, '_blank')}
                                >
                                    <i className="fas fa-users me-2"></i>
                                    Ver Comentarios
                                </button>
                                <div className="btn-group" role="group">
                                    <button
                                        className="btn btn-sidebar-primary btn-sm dropdown-toggle"
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
                                                onClick={() => setActiveView(`recomendacion-${ticket.id}`)}
                                            >
                                                <i className="fas fa-lightbulb me-2"></i>
                                                Generar Recomendación
                                            </button>
                                        </li>
                                        <li>
                                            <button
                                                className="dropdown-item"
                                                onClick={() => setActiveView(`identificar-${ticket.id}`)}
                                            >
                                                <i className="fas fa-camera me-2"></i>
                                                Analizar Imagen
                                            </button>
                                        </li>
                                    </ul>
                                </div>
                                {ticketsConRecomendaciones && ticketsConRecomendaciones.has(ticket.id) && (
                                    <button
                                        className="btn btn-sidebar-teal btn-sm"
                                        onClick={() => window.open(`/ticket/${ticket.id}/recomendaciones-similares`, '_blank')}
                                    >
                                        <i className="fas fa-lightbulb me-2"></i>
                                        Ver Sugerencias
                                    </button>
                                )}
                                <button
                                    className="btn btn-sidebar-warning btn-sm"
                                    onClick={escalarTicket}
                                >
                                    <i className="fas fa-arrow-up me-2"></i>
                                    Escalar Ticket
                                </button>
                                {ticket.estado !== 'cerrado' && ticket.estado !== 'resuelto' && (
                                    <button
                                        className="btn btn-outline-danger btn-sm"
                                        onClick={cerrarTicket}
                                    >
                                        <i className="fas fa-times me-2"></i>
                                        Cerrar Ticket
                                    </button>
                                )}
                                {ticket.estado === 'cerrado' && (
                                    <button
                                        className="btn btn-outline-success btn-sm"
                                        onClick={reabrirTicket}
                                    >
                                        <i className="fas fa-redo me-2"></i>
                                        Reabrir Ticket
                                    </button>
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
                                        <p className="text-muted mb-1">{storeUtils.formatDate(ticket.fecha_creacion)}</p>
                                        <p className="mb-0">El ticket fue creado por el cliente: {ticket.cliente?.nombre} {ticket.cliente?.apellido}</p>
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

                                {ticket.estado === 'escalado' && (
                                    <div className="timeline-item">
                                        <div className="timeline-marker bg-danger"></div>
                                        <div className="timeline-content">
                                            <h6 className="fw-semibold">Ticket Escalado</h6>
                                            <p className="text-muted mb-1">Requiere atención del supervisor</p>
                                            <p className="mb-0">El ticket ha sido escalado por prioridad o tiempo.</p>
                                        </div>
                                    </div>
                                )}

                                {ticket.fecha_solucion && (
                                    <div className="timeline-item">
                                        <div className="timeline-marker bg-success"></div>
                                        <div className="timeline-content">
                                            <h6 className="fw-semibold">Ticket Solucionado</h6>
                                            <p className="text-muted mb-1">{storeUtils.formatDate(ticket.fecha_solucion)}</p>
                                            <p className="mb-0">El ticket ha sido resuelto exitosamente.</p>
                                        </div>
                                    </div>
                                )}

                                {ticket.estado === 'cerrado' && (
                                    <div className="timeline-item">
                                        <div className="timeline-marker bg-secondary"></div>
                                        <div className="timeline-content">
                                            <h6 className="fw-semibold">Ticket Cerrado</h6>
                                            <p className="text-muted mb-1">Cerrado por supervisor</p>
                                            <p className="mb-0">El ticket ha sido cerrado definitivamente.</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal para Asignar Analista */}
            {showAsignarModal && (
                <div className="modal show d-block modal-backdrop-custom" tabIndex="-1">
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">
                                    {tieneAnalistaAsignado(ticket) ? 'Reasignar Analista' : 'Asignar Analista'}
                                </h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => setShowAsignarModal(false)}
                                ></button>
                            </div>
                            <div className="modal-body">
                                <div className="mb-3">
                                    <label className="form-label">Seleccionar Analista:</label>
                                    <select
                                        className="form-select"
                                        value={selectedAnalista}
                                        onChange={(e) => setSelectedAnalista(e.target.value)}
                                    >
                                        <option value="">Selecciona un analista</option>
                                        {analistas.map((analista) => (
                                            <option key={analista.id} value={analista.id}>
                                                {analista.nombre} {analista.apellido}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => setShowAsignarModal(false)}
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-primary"
                                    onClick={asignarAnalista}
                                >
                                    {tieneAnalistaAsignado(ticket) ? 'Reasignar' : 'Asignar'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VerTicketHDSupervisor;
