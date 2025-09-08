import React, { useState } from "react";
import useGlobalReducer from "../hooks/useGlobalReducer";

export const Supervisor = () => {
    const [mostrarStore, setMostrarStore] = useState(false);
    const { store, dispatch } = useGlobalReducer();
    const API = import.meta.env.VITE_BACKEND_URL + "/api";

    const [nuevoSupervisor, setNuevoSupervisor] = useState({
        nombre: "", apellido: "", email: "", contraseña_hash: "",
        area_responsable: ""
    });
    const [supervisorId, setSupervisorId] = useState("");

    const setLoading = (v) => dispatch({ type: "api_loading", payload: v });
    const setError = (e) => dispatch({ type: "api_error", payload: e?.message || e });

    const fetchJson = (url, options = {}) =>
        fetch(url, options)
            .then(res => res.json().then(data => ({ ok: res.ok, data })))
            .catch(err => ({ ok: false, data: { message: err.message } }));

    const limpiarFormulario = () => {
        setNuevoSupervisor({
            nombre: "", apellido: "", email: "", contraseña_hash: "",
            area_responsable: ""
        });
        setSupervisorId("");
        dispatch({ type: "supervisor_clear_detail" });
    };

    const crearSupervisor = () => {
        setLoading(true);
        fetchJson(`${API}/supervisores`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(nuevoSupervisor)
        }).then(({ ok, data }) => {
            if (!ok) throw new Error(data.message);
            dispatch({ type: "supervisores_add", payload: data });
            limpiarFormulario();
        }).catch(setError).finally(() => setLoading(false));
    };

    const obtenerSupervisor = () => {
        setLoading(true);
        fetchJson(`${API}/supervisores/${supervisorId}`)
            .then(({ ok, data }) => {
                if (!ok) throw new Error(data.message);
                dispatch({ type: "supervisor_set_detail", payload: data });
                setNuevoSupervisor({
                    nombre: data.nombre,
                    apellido: data.apellido,
                    email: data.email,
                    contraseña_hash: data.contraseña_hash || "",
                    area_responsable: data.area_responsable
                });
            }).catch(setError).finally(() => setLoading(false));
    };

    const actualizarSupervisor = () => {
        setLoading(true);
        fetchJson(`${API}/supervisores/${supervisorId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(nuevoSupervisor)
        }).then(({ ok, data }) => {
            if (!ok) throw new Error(data.message);
            dispatch({ type: "supervisor_set_detail", payload: data });
            dispatch({ type: "supervisores_upsert", payload: data });
            limpiarFormulario();
        }).catch(setError).finally(() => setLoading(false));
    };

    const eliminarSupervisor = () => {
        setLoading(true);
        fetchJson(`${API}/supervisores/${supervisorId}`, { method: "DELETE" })
            .then(({ ok, data }) => {
                if (!ok) throw new Error(data.message);
                dispatch({ type: "supervisores_remove", payload: parseInt(supervisorId) });
                limpiarFormulario();
            }).catch(setError).finally(() => setLoading(false));
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

    return (
        <div className="container py-4">
            <h2 className="mb-3">Gestión de Supervisores</h2>

            {store?.api?.error && (
                <div className="alert alert-danger py-2">{String(store.api.error)}</div>
            )}
            {store?.api?.loading && (
                <div className="alert alert-info py-2">Cargando...</div>
            )}

            <div className="row">
                <div className="col-12 col-lg-8 mx-auto">
                    <div className="card mb-4">
                        <div className="card-header">
                            <h5 className="mb-0">Operaciones de Supervisor</h5>
                        </div>
                        <div className="card-body">
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

                            <div className="d-flex gap-2 mt-4 flex-wrap">
                                <button className="btn btn-primary" onClick={crearSupervisor}>
                                    <i className="fas fa-plus"></i> Crear Supervisor
                                </button>
                                <input
                                    className="form-control w-auto"
                                    placeholder="ID del supervisor"
                                    value={supervisorId}
                                    onChange={e => setSupervisorId(e.target.value)}
                                />
                                <button className="btn btn-outline-secondary" onClick={obtenerSupervisor}>
                                    <i className="fas fa-search"></i> Buscar
                                </button>
                                <button className="btn btn-warning" onClick={actualizarSupervisor}>
                                    <i className="fas fa-edit"></i> Actualizar
                                </button>
                                <button className="btn btn-danger" onClick={eliminarSupervisor}>
                                    <i className="fas fa-trash"></i> Eliminar
                                </button>
                                <button className="btn btn-outline-info" onClick={limpiarFormulario}>
                                    <i className="fas fa-eraser"></i> Limpiar
                                </button>
                            </div>

                            {store.supervisorDetail && (
                                <div className="alert alert-info mt-3">
                                    <h6>Detalle del Supervisor:</h6>
                                    <pre className="small m-0">{JSON.stringify(store.supervisorDetail, null, 2)}</pre>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="card">
                        <div className="card-header d-flex justify-content-between align-items-center">
                            <h5 className="mb-0">Lista de Supervisores</h5>
                            <button className="btn btn-outline-primary" onClick={listarTodosLosSupervisores}>
                                <i className="fas fa-refresh"></i> Actualizar Lista
                            </button>
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
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="text-center py-4">
                                    <p className="text-muted">No hay supervisores registrados.</p>
                                    <button className="btn btn-primary" onClick={listarTodosLosSupervisores}>
                                        Cargar Supervisores
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="card mt-3">
                        <div className="card-header d-flex justify-content-between align-items-center">
                            <span>Estado del Store</span>
                            <button className="btn btn-sm btn-outline-secondary" onClick={() => setMostrarStore(s => !s)}>
                                {mostrarStore ? "Ocultar" : "Mostrar"}
                            </button>
                        </div>
                        {mostrarStore && (
                            <div className="card-body">
                                <pre className="small m-0">{JSON.stringify(store, null, 2)}</pre>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};


