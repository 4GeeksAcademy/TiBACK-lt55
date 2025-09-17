import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import useGlobalReducer from '../../hooks/useGlobalReducer';

export function SupervisorPage() {
    const { store, logout } = useGlobalReducer();
    const [tickets, setTickets] = useState([]);
    const [analistas, setAnalistas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

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

    const asignarTicket = async (ticketId, analistaId) => {
        try {
            const token = store.auth.token;
            const comentario = prompt('Agregar comentario (opcional):');
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/tickets/${ticketId}/asignar`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ id_analista: analistaId, comentario })
            });

            if (!response.ok) {
                throw new Error('Error al asignar ticket');
            }

            // Actualizar tickets sin recargar la página
            await actualizarTickets();
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
            await actualizarTickets();
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
            await actualizarTickets();
        } catch (err) {
            setError(err.message);
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
            {/* Header con información del supervisor */}
            <div className="row mb-4">
                <div className="col-12">
                    <div className="card">
                        <div className="card-body d-flex justify-content-between align-items-center">
                            <div>
                                <h2 className="mb-1">Panel de Supervisor</h2>
                                <p className="text-muted mb-0">Bienvenido, {store.auth.user?.nombre} {store.auth.user?.apellido}</p>
                                <small className="text-info">Área: {store.auth.user?.area_responsable}</small>
                            </div>
                            <div className="d-flex gap-2">
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

            {/* Lista de tickets */}
            <div className="row">
                <div className="col-12">
                    <div className="card">
                        <div className="card-header d-flex justify-content-between align-items-center">
                            <h5 className="mb-0">Todos los Tickets</h5>
                            <small className="text-muted">
                                {analistas.length} analista{analistas.length !== 1 ? 's' : ''} disponible{analistas.length !== 1 ? 's' : ''}
                            </small>
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
                                                            {ticket.estado.toLowerCase() === 'reabierto' && (
                                                                <div className="d-flex gap-1">
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
                                                                    <button
                                                                        className="btn btn-danger btn-sm"
                                                                        onClick={() => cambiarEstadoTicket(ticket.id, 'cerrado')}
                                                                        title="Cerrar ticket reabierto"
                                                                    >
                                                                        <i className="fas fa-times"></i> Cerrar
                                                                    </button>
                                                                </div>
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
                                                            <button
                                                                className="btn btn-info btn-sm"
                                                                onClick={() => agregarComentario(ticket.id)}
                                                                title="Agregar comentario"
                                                            >
                                                                <i className="fas fa-comment"></i> Comentar
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
        </div>
    );
}

export default SupervisorPage;