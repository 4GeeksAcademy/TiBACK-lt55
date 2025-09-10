import React, { useState, useEffect } from "react";
import useGlobalReducer from "../hooks/useGlobalReducer";

export const Supervisor = () => {
    const { store, dispatch } = useGlobalReducer();
    const API = import.meta.env.VITE_BACKEND_URL + "/api";

    const [nuevoSupervisor, setNuevoSupervisor] = useState({
        nombre: "", apellido: "", email: "", contraseña_hash: "", area_responsable: ""
    });
    const [supervisorId, setSupervisorId] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [isEdit, setIsEdit] = useState(false);

    const [showViewModal, setShowViewModal] = useState(false);
    const [supervisorToView, setSupervisorToView] = useState(null);

    const setLoading = (v) => dispatch({ type: "api_loading", payload: v });
    const setError = (e) => dispatch({ type: "api_error", payload: e?.message || e });

    const fetchJson = (API, options = {}) =>
        fetch(API, options)
            .then(res => res.json().then(data => ({ ok: res.ok, data })))
            .catch(err => ({ ok: false, data: { message: err.message } }));

    const limpiarFormulario = () => {
        setNuevoSupervisor({ nombre: "", apellido: "", email: "", contraseña_hash: "", area_responsable: "" });
        setSupervisorId("");
        dispatch({ type: "supervisor_clear_detail" });
        setIsEdit(false);
    };

    const crearSupervisor = () => {
        setLoading(true);
        fetchJson(`${API}/supervisores`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(nuevoSupervisor)
        })
            .then(({ ok, data }) => {
                if (!ok) throw new Error(data.message);
                dispatch({ type: "supervisores_add", payload: data });
                limpiarFormulario();
                setShowModal(false);
            })
            .catch(setError)
            .finally(() => setLoading(false));
    };

    const actualizarSupervisor = (id) => {
        setLoading(true);
        fetchJson(`${API}/supervisores/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(nuevoSupervisor)
        })
            .then(({ ok, data }) => {
                if (!ok) throw new Error(data.message);
                dispatch({ type: "supervisores_upsert", payload: data });
                limpiarFormulario();
                setShowModal(false);
            })
            .catch(setError)
            .finally(() => setLoading(false));
    };

    const abrirModalEditar = (supervisor) => {
        setNuevoSupervisor({
            nombre: supervisor.nombre,
            apellido: supervisor.apellido,
            email: supervisor.email,
            contraseña_hash: supervisor.contraseña_hash || "",
            area_responsable: supervisor.area_responsable
        });
        setSupervisorId(supervisor.id);
        setIsEdit(true);
        setShowModal(true);
    };

    const cerrarModal = () => {
        setShowModal(false);
        limpiarFormulario();
    };

    
    const abrirModalVer = (supervisor) => {
        setSupervisorToView(supervisor);
        setShowViewModal(true);
    };

    const cerrarModalVer = () => {
        setShowViewModal(false);
        setSupervisorToView(null);
    };

    const eliminarSupervisor = (id) => {
        setLoading(true);
        fetchJson(`${API}/supervisores/${id}`, { method: "DELETE" })
            .then(({ ok, data }) => {
                if (!ok) throw new Error(data.message);
                dispatch({ type: "supervisores_remove", payload: parseInt(id) });
                limpiarFormulario();
            })
            .catch(setError)
            .finally(() => setLoading(false));
    };

    const listarTodosLosSupervisores = () => {
        setLoading(true);
        fetchJson(`${API}/supervisores`)
            .then(({ ok, data }) => {
                if (!ok) throw new Error(data.message);
                dispatch({ type: "supervisores_set_list", payload: data });
            })
            .catch(setError)
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        listarTodosLosSupervisores();
    }, []);

    return (
        <div className="container py-4">
            <h2 className="mb-3">Gestión de Supervisores</h2>

            {store?.api?.error && (
                <div className="alert alert-danger py-2">{String(store.api.error)}</div>
            )}
            {store?.api?.loading && (
                <div className="alert alert-info py-2">Cargando...</div>
            )}

            <button className="btn btn-primary mb-3" onClick={() => setShowModal(true)}>
                <i className="fas fa-plus"></i> Nuevo Supervisor
            </button>

            {showModal && (
                <div className="modal fade show d-block" tabIndex="-1" role="dialog">
                    <div className="modal-dialog modal-lg" role="document">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">{isEdit ? "Editar Supervisor" : "Crear Nuevo Supervisor"}</h5>
                                <button type="button" className="btn-close" onClick={cerrarModal}></button>
                            </div>
                            <div className="modal-body">
                                <div className="row g-3">
                                    {["nombre", "apellido", "email", "contraseña_hash", "area_responsable"].map((field, i) => (
                                        <div key={i} className={`col-${field === "area_responsable" ? "12" : "6"}`}>
                                            <label className="form-label">{field.charAt(0).toUpperCase() + field.slice(1)}</label>
                                            <input
                                                className="form-control"
                                                placeholder={`Ingrese ${field}`}
                                                value={nuevoSupervisor[field]}
                                                onChange={e => setNuevoSupervisor(s => ({ ...s, [field]: e.target.value }))}
                                            />
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
                                    onClick={() => (isEdit ? actualizarSupervisor(supervisorId) : crearSupervisor())}
                                >
                                    {isEdit ? "Actualizar" : "Guardar"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}


              {/* Modal para ver detalles del supervisor */}
            {showViewModal && supervisorToView && (
                <div className="modal fade show d-block" tabIndex="-1" role="dialog">
                    <div className="modal-dialog modal-lg" role="document">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Detalles del Supervisor</h5>
                                <button type="button" className="btn-close" onClick={cerrarModalVer}></button>
                            </div>
                            <div className="modal-body">
                                <div className="row g-3">
                                    <div className="col-12">
                                        <h6 className="text-primary mb-3">
                                            <i className="fas fa-user"></i> Información Personal
                                        </h6>
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label fw-bold">ID:</label>
                                        <p className="form-control-plaintext bg-light p-2 rounded">{supervisorToView.id}</p>
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label fw-bold">Nombre:</label>
                                        <p className="form-control-plaintext bg-light p-2 rounded">{supervisorToView.nombre}</p>
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label fw-bold">Apellido:</label>
                                        <p className="form-control-plaintext bg-light p-2 rounded">{supervisorToView.apellido}</p>
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label fw-bold">Email:</label>
                                        <p className="form-control-plaintext bg-light p-2 rounded">{supervisorToView.email}</p>
                                    </div>
                                    <div className="col-12">
                                        <label className="form-label fw-bold">Área Responsable:</label>
                                        <p className="form-control-plaintext bg-light p-2 rounded">{supervisorToView.area_responsable}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button className="btn btn-secondary" onClick={cerrarModalVer}>
                                    <i className="fas fa-times"></i> Cerrar
                                </button>
                                <button className="btn btn-warning" onClick={() => {
                                    cerrarModalVer();
                                    abrirModalEditar(supervisorToView);
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
                    <h5 className="mb-0">Lista de Supervisores</h5>
                </div>
                <div className="card-body">
                    {Array.isArray(store.supervisores) && store.supervisores.length > 0 ? (
                        <div className="table-responsive">
                            <table className="table table-striped">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Nombre</th>
                                        <th>Apellido</th>
                                        <th>Email</th>
                                        <th>Área Responsable</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {store.supervisores.map((supervisor) => (
                                        <tr key={supervisor.id}>
                                            <td>{supervisor.id}</td>
                                            <td>{supervisor.nombre}</td>
                                            <td>{supervisor.apellido}</td>
                                            <td>{supervisor.email}</td>
                                            <td>{supervisor.area_responsable}</td>
                                            <td>
                                                <button className="btn btn-info mx-1" onClick={() => abrirModalVer(supervisor)} title="Ver Supervisor">
                                                    <i className="fas fa-eye"></i>
                                                </button>
                                                <button className="btn btn-warning mx-1" onClick={() => abrirModalEditar(supervisor)} title="Editar Supervisor">
                                                    <i className="fas fa-edit"></i>
                                                </button>
                                                <button className="btn btn-danger mx-1" onClick={() => eliminarSupervisor(supervisor.id)} title="Eliminar Supervisor">
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
                            <p className="text-muted">No hay supervisores registrados.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};