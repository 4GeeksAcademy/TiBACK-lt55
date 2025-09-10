import React, { useState, useEffect } from "react";
import useGlobalReducer from "../hooks/useGlobalReducer";

export const Ticket = () => {
    const { store, dispatch } = useGlobalReducer();
    const API = import.meta.env.VITE_BACKEND_URL + "/api";

    const [nuevoTicket, setNuevoTicket] = useState({
        id_cliente: "", estado: "", titulo: "", descripcion: "", fecha_creacion: "",
        fecha_cierre: "", prioridad: "", calificacion: "", comentario: "", fecha_evaluacion: ""
    });
    const [ticketId, setTicketId] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [ticketToView, setTicketToView] = useState(null);

    const setLoading = (v) => dispatch({ type: "api_loading", payload: v });
    const setError = (e) => dispatch({ type: "api_error", payload: e?.message || e });

    const fetchJson = (API, options = {}) =>
        fetch(API, options)
            .then(res => res.json().then(data => ({ ok: res.ok, data })))
            .catch(err => ({ ok: false, data: { message: err.message } }));

    const limpiarFormulario = () => {
        setNuevoTicket({
            id_cliente: "", estado: "", titulo: "", descripcion: "", fecha_creacion: "",
            fecha_cierre: "", prioridad: "", calificacion: "", comentario: "", fecha_evaluacion: ""
        });
        setTicketId("");
        dispatch({ type: "ticket_clear_detail" });
        setIsEdit(false);
    };

    const crearTicket = () => {
        setLoading(true);
        fetchJson(`${API}/tickets`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(nuevoTicket)
        })
            .then(({ ok, data }) => {
                if (!ok) throw new Error(data.message);
                dispatch({ type: "tickets_add", payload: data });
                limpiarFormulario();
                setShowModal(false);
            })
            .catch(setError)
            .finally(() => setLoading(false));
    };

    const actualizarTicket = (id) => {
        setLoading(true);
        fetchJson(`${API}/tickets/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(nuevoTicket)
        })
            .then(({ ok, data }) => {
                if (!ok) throw new Error(data.message);
                dispatch({ type: "tickets_upsert", payload: data });
                limpiarFormulario();
                setShowModal(false);
            })
            .catch(setError)
            .finally(() => setLoading(false));
    };

    const abrirModalEditar = (ticket) => {
        setNuevoTicket({
            id_cliente: ticket.id_cliente || "",
            estado: ticket.estado || "",
            titulo: ticket.titulo || "",
            descripcion: ticket.descripcion || "",
            fecha_creacion: ticket.fecha_creacion || "",
            fecha_cierre: ticket.fecha_cierre || "",
            prioridad: ticket.prioridad || "",
            calificacion: ticket.calificacion || "",
            comentario: ticket.comentario || "",
            fecha_evaluacion: ticket.fecha_evaluacion || ""
        });
        setTicketId(ticket.id);
        setIsEdit(true);
        setShowModal(true);
    };

    const cerrarModal = () => {
        setShowModal(false);
        limpiarFormulario();
    };

    const abrirModalVer = (ticket) => {
        setTicketToView(ticket);
        setShowViewModal(true);
    };

    const cerrarModalVer = () => {
        setShowViewModal(false);
        setTicketToView(null);
    };

    const eliminarTicket = (id) => {
        if (!window.confirm("¿Estás seguro de que quieres eliminar este ticket?")) return;

        setLoading(true);
        fetchJson(`${API}/tickets/${id}`, { method: "DELETE" })
            .then(({ ok, data }) => {
                if (!ok) throw new Error(data.message);
                dispatch({ type: "tickets_remove", payload: parseInt(id) });
                limpiarFormulario();
            })
            .catch(setError)
            .finally(() => setLoading(false));
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

    useEffect(() => {
        listarTodosLosTickets();
    }, []);

    const getEstadoBadgeClass = (estado) => {
        switch (estado?.toLowerCase()) {
            case 'abierto': return 'badge bg-success';
            case 'en_proceso': return 'badge bg-warning';
            case 'cerrado': return 'badge bg-secondary';
            case 'pendiente': return 'badge bg-info';
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
            <h2 className="mb-3">Gestión de Tickets</h2>

            {store?.api?.error && (
                <div className="alert alert-danger py-2">{String(store.api.error)}</div>
            )}
            {store?.api?.loading && (
                <div className="alert alert-info py-2">Cargando...</div>
            )}

            <button className="btn btn-primary mb-3" onClick={() => setShowModal(true)}>
                <i className="fas fa-plus"></i> Nuevo Ticket
            </button>

            {showModal && (
                <div className="modal fade show d-block" tabIndex="-1" role="dialog">
                    <div className="modal-dialog modal-xl" role="document">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">{isEdit ? "Editar Ticket" : "Crear Nuevo Ticket"}</h5>
                                <button type="button" className="btn-close" onClick={cerrarModal}></button>
                            </div>
                            <div className="modal-body">
                                <div className="row g-3">
                                    {[
                                        { field: "id_cliente", label: "ID Cliente", type: "number", col: "6" },
                                        { field: "estado", label: "Estado", type: "select", col: "6", options: ["Abierto", "En Proceso", "Cerrado", "Pendiente"] },
                                        { field: "titulo", label: "Título", type: "text", col: "12" },
                                        { field: "descripcion", label: "Descripción", type: "textarea", col: "12" },
                                        { field: "fecha_creacion", label: "Fecha Creación", type: "datetime-local", col: "6" },
                                        { field: "fecha_cierre", label: "Fecha Cierre", type: "datetime-local", col: "6" },
                                        { field: "prioridad", label: "Prioridad", type: "select", col: "6", options: ["Alta", "Media", "Baja"] },
                                        { field: "calificacion", label: "Calificación", type: "number", col: "6" },
                                        { field: "comentario", label: "Comentario", type: "textarea", col: "12" },
                                        { field: "fecha_evaluacion", label: "Fecha Evaluación", type: "datetime-local", col: "12" }
                                    ].map(({ field, label, type, col, options }, i) => (
                                        <div key={i} className={`col-${col}`}>
                                            <label className="form-label">{label}</label>
                                            {type === "select" ? (
                                                <select
                                                    className="form-control"
                                                    value={nuevoTicket[field]}
                                                    onChange={e => setNuevoTicket(s => ({ ...s, [field]: e.target.value }))}
                                                >
                                                    <option value="">Seleccionar {label}</option>
                                                    {options?.map(option => (
                                                        <option key={option} value={option}>{option}</option>
                                                    ))}
                                                </select>
                                            ) : type === "textarea" ? (
                                                <textarea
                                                    className="form-control"
                                                    rows="3"
                                                    placeholder={`Ingrese ${label}`}
                                                    value={nuevoTicket[field]}
                                                    onChange={e => setNuevoTicket(s => ({ ...s, [field]: e.target.value }))}
                                                />
                                            ) : (
                                                <input
                                                    className="form-control"
                                                    type={type}
                                                    placeholder={`Ingrese ${label}`}
                                                    value={nuevoTicket[field]}
                                                    onChange={e => setNuevoTicket(s => ({ ...s, [field]: e.target.value }))}
                                                />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button className="btn btn-secondary" onClick={cerrarModal}>
                                    Cancelar
                                </button>
                                <button
                                    className="btn btn-primary"
                                    onClick={() => (isEdit ? actualizarTicket(ticketId) : crearTicket())}
                                >
                                    {isEdit ? "Actualizar" : "Guardar"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal para ver detalles del ticket */}
            {showViewModal && ticketToView && (
                <div className="modal fade show d-block" tabIndex="-1" role="dialog">
                    <div className="modal-dialog modal-xl" role="document">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Detalles del Ticket #{ticketToView.id}</h5>
                                <button type="button" className="btn-close" onClick={cerrarModalVer}></button>
                            </div>
                            <div className="modal-body">
                                <div className="row g-3">
                                    <div className="col-12">
                                        <h6 className="text-primary mb-3">
                                            <i className="fas fa-ticket-alt"></i> Información del Ticket
                                        </h6>
                                    </div>
                                    <div className="col-md-3">
                                        <label className="form-label fw-bold">ID:</label>
                                        <p className="form-control-plaintext bg-light p-2 rounded">{ticketToView.id}</p>
                                    </div>
                                    <div className="col-md-3">
                                        <label className="form-label fw-bold">ID Cliente:</label>
                                        <p className="form-control-plaintext bg-light p-2 rounded">{ticketToView.id_cliente}</p>
                                    </div>
                                    <div className="col-md-3">
                                        <label className="form-label fw-bold">Estado:</label>
                                        <p className="form-control-plaintext bg-light p-2 rounded">
                                            <span className={getEstadoBadgeClass(ticketToView.estado)}>{ticketToView.estado}</span>
                                        </p>
                                    </div>
                                    <div className="col-md-3">
                                        <label className="form-label fw-bold">Prioridad:</label>
                                        <p className="form-control-plaintext bg-light p-2 rounded">
                                            <span className={getPrioridadBadgeClass(ticketToView.prioridad)}>{ticketToView.prioridad}</span>
                                        </p>
                                    </div>
                                    <div className="col-12">
                                        <label className="form-label fw-bold">Título:</label>
                                        <p className="form-control-plaintext bg-light p-2 rounded">{ticketToView.titulo}</p>
                                    </div>
                                    <div className="col-12">
                                        <label className="form-label fw-bold">Descripción:</label>
                                        <p className="form-control-plaintext bg-light p-2 rounded" style={{ whiteSpace: 'pre-wrap' }}>{ticketToView.descripcion}</p>
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label fw-bold">Fecha Creación:</label>
                                        <p className="form-control-plaintext bg-light p-2 rounded">{ticketToView.fecha_creacion}</p>
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label fw-bold">Fecha Cierre:</label>
                                        <p className="form-control-plaintext bg-light p-2 rounded">{ticketToView.fecha_cierre || 'No cerrado'}</p>
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label fw-bold">Calificación:</label>
                                        <p className="form-control-plaintext bg-light p-2 rounded">{ticketToView.calificacion || 'Sin calificar'}</p>
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label fw-bold">Fecha Evaluación:</label>
                                        <p className="form-control-plaintext bg-light p-2 rounded">{ticketToView.fecha_evaluacion || 'Sin evaluar'}</p>
                                    </div>
                                    {ticketToView.comentario && (
                                        <div className="col-12">
                                            <label className="form-label fw-bold">Comentario:</label>
                                            <p className="form-control-plaintext bg-light p-2 rounded" style={{ whiteSpace: 'pre-wrap' }}>{ticketToView.comentario}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button className="btn btn-secondary" onClick={cerrarModalVer}>
                                    <i className="fas fa-times"></i> Cerrar
                                </button>
                                <button className="btn btn-warning" onClick={() => {
                                    cerrarModalVer();
                                    abrirModalEditar(ticketToView);
                                }}>
                                    <i className="fas fa-edit"></i> Editar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="card">
                <div className="card-header d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">Lista de Tickets</h5>
                    <button className="btn btn-outline-primary" onClick={listarTodosLosTickets}>
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
                                            <td>{ticket.id_cliente}</td>
                                            <td>
                                                <span className={getEstadoBadgeClass(ticket.estado)}>{ticket.estado}</span>
                                            </td>
                                            <td>
                                                <div style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {ticket.titulo}
                                                </div>
                                            </td>
                                            <td>
                                                <span className={getPrioridadBadgeClass(ticket.prioridad)}>{ticket.prioridad}</span>
                                            </td>
                                            <td>{ticket.fecha_creacion}</td>
                                            <td>
                                                <button className="btn btn-info mx-1" onClick={() => abrirModalVer(ticket)} title="Ver Ticket">
                                                    <i className="fas fa-eye"></i>
                                                </button>
                                                <button className="btn btn-warning mx-1" onClick={() => abrirModalEditar(ticket)} title="Editar Ticket">
                                                    <i className="fas fa-edit"></i>
                                                </button>
                                                <button className="btn btn-danger mx-1" onClick={() => eliminarTicket(ticket.id)} title="Eliminar Ticket">
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
        </div>
    );
};
