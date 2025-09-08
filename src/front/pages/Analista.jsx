import React, { useState } from "react";
import useGlobalReducer from "../hooks/useGlobalReducer";

export const Analista = () => {
    const [mostrarStore, setMostrarStore] = useState(false);
    const { store, dispatch } = useGlobalReducer();
    const API = import.meta.env.VITE_BACKEND_URL + "/api";

    const [nuevoAnalista, setNuevoAnalista] = useState({
        nombre: "", apellido: "", email: "", contraseña_hash: "",
        especialidad: ""
    });
    const [analistaId, setAnalistaId] = useState("");

    const setLoading = (v) => dispatch({ type: "api_loading", payload: v });
    const setError = (e) => dispatch({ type: "api_error", payload: e?.message || e });

    const fetchJson = (url, options = {}) =>
        fetch(url, options)
            .then(res => res.json().then(data => ({ ok: res.ok, data })))
            .catch(err => ({ ok: false, data: { message: err.message } }));

    const limpiarFormulario = () => {
        setNuevoAnalista({
            nombre: "", apellido: "", email: "", contraseña_hash: "",
            especialidad: ""
        });
        setAnalistaId("");
        dispatch({ type: "analista_clear_detail" });
    };

    const crearAnalista = () => {
        setLoading(true);
        fetchJson(`${API}/analistas`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(nuevoAnalista)
        }).then(({ ok, data }) => {
            if (!ok) throw new Error(data.message);
            dispatch({ type: "analistas_add", payload: data });
            limpiarFormulario();
        }).catch(setError).finally(() => setLoading(false));
    };

    const obtenerAnalista = () => {
        setLoading(true);
        fetchJson(`${API}/analistas/${analistaId}`)
            .then(({ ok, data }) => {
                if (!ok) throw new Error(data.message);
                dispatch({ type: "analista_set_detail", payload: data });
                setNuevoAnalista({
                    nombre: data.nombre,
                    apellido: data.apellido,
                    email: data.email,
                    contraseña_hash: data.contraseña_hash || "",
                    especialidad: data.especialidad
                });
            }).catch(setError).finally(() => setLoading(false));
    };

    const actualizarAnalista = () => {
        setLoading(true);
        fetchJson(`${API}/analistas/${analistaId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(nuevoAnalista)
        }).then(({ ok, data }) => {
            if (!ok) throw new Error(data.message);
            dispatch({ type: "analista_set_detail", payload: data });
            dispatch({ type: "analistas_upsert", payload: data });
            limpiarFormulario();
        }).catch(setError).finally(() => setLoading(false));
    };

    const eliminarAnalista = () => {
        setLoading(true);
        fetchJson(`${API}/analistas/${analistaId}`, { method: "DELETE" })
            .then(({ ok, data }) => {
                if (!ok) throw new Error(data.message);
                dispatch({ type: "analistas_remove", payload: parseInt(analistaId) });
                limpiarFormulario();
            }).catch(setError).finally(() => setLoading(false));
    };

    const listarTodosLosAnalistas = () => {
        setLoading(true);
        fetchJson(`${API}/analistas`)
            .then(({ ok, data }) => {
                if (!ok) throw new Error(data.message);
                dispatch({ type: "analistas_set_list", payload: data });
            })
            .catch(setError)
            .finally(() => setLoading(false));
    };

    return (
        <div className="container py-4">
            <h2 className="mb-3">Gestión de Analistas</h2>

            {store.api.error && (
                <div className="alert alert-danger py-2">{String(store.api.error)}</div>
            )}
            {store.api.loading && (
                <div className="alert alert-info py-2">Cargando...</div>
            )}

            <div className="row">
                <div className="col-12 col-lg-8 mx-auto">
                    <div className="card mb-4">
                        <div className="card-header">
                            <h5 className="mb-0">Operaciones de Analista</h5>
                        </div>
                        <div className="card-body">
                            <div className="row g-3">
                                {["nombre", "apellido", "email", "contraseña_hash", "especialidad"].map((field, i) => (
                                    <div key={i} className={`col-${field === "especialidad" ? "12" : "6"}`}>
                                        <label className="form-label">{field.charAt(0).toUpperCase() + field.slice(1)}</label>
                                        <input
                                            className="form-control"
                                            placeholder={`Ingrese ${field}`}
                                            value={nuevoAnalista[field]}
                                            onChange={e => setNuevoAnalista(s => ({ ...s, [field]: e.target.value }))}
                                        />
                                    </div>
                                ))}
                            </div>

                            <div className="d-flex gap-2 mt-4 flex-wrap">
                                <button className="btn btn-primary" onClick={crearAnalista}>
                                    <i className="fas fa-plus"></i> Crear Analista
                                </button>
                                <input
                                    className="form-control w-auto"
                                    placeholder="ID del analista"
                                    value={analistaId}
                                    onChange={e => setAnalistaId(e.target.value)}
                                />
                                <button className="btn btn-outline-secondary" onClick={obtenerAnalista}>
                                    <i className="fas fa-search"></i> Buscar
                                </button>
                                <button className="btn btn-warning" onClick={actualizarAnalista}>
                                    <i className="fas fa-edit"></i> Actualizar
                                </button>
                                <button className="btn btn-danger" onClick={eliminarAnalista}>
                                    <i className="fas fa-trash"></i> Eliminar
                                </button>
                                <button className="btn btn-outline-info" onClick={limpiarFormulario}>
                                    <i className="fas fa-eraser"></i> Limpiar
                                </button>
                            </div>

                            {store.analistaDetail && (
                                <div className="alert alert-info mt-3">
                                    <h6>Detalle del Analista:</h6>
                                    <pre className="small m-0">{JSON.stringify(store.analistaDetail, null, 2)}</pre>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="card">
                        <div className="card-header d-flex justify-content-between align-items-center">
                            <h5 className="mb-0">Lista de Analistas</h5>
                            <button className="btn btn-outline-primary" onClick={listarTodosLosAnalistas}>
                                <i className="fas fa-refresh"></i> Actualizar Lista
                            </button>
                        </div>
                        <div className="card-body">
                            {Array.isArray(store.analistas) && store.analistas.length > 0 ? (
                                <div className="table-responsive">
                                    <table className="table table-striped">
                                        <thead>
                                            <tr>
                                                <th>ID</th>
                                                <th>Nombre</th>
                                                <th>Apellido</th>
                                                <th>Email</th>
                                                <th>Especialidad</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {store.analistas.map((analista) => (
                                                <tr key={analista.id}>
                                                    <td>{analista.id}</td>
                                                    <td>{analista.nombre}</td>
                                                    <td>{analista.apellido}</td>
                                                    <td>{analista.email}</td>
                                                    <td>{analista.especialidad}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="text-center py-4">
                                    <p className="text-muted">No hay analistas registrados.</p>
                                    <button className="btn btn-primary" onClick={listarTodosLosAnalistas}>
                                        Cargar Analistas
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


