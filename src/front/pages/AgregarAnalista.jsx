// Import necessary hooks and components from react-router-dom and other libraries.
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import useGlobalReducer from "../hooks/useGlobalReducer";

export const AgregarAnalista = () => {
    const { store, dispatch } = useGlobalReducer(); 
    const navigate = useNavigate();
    const API = import.meta.env.VITE_BACKEND_URL + "/api";

    const [nuevoAnalista, setNuevoAnalista] = useState({
        nombre: "",
        apellido: "",
        email: "",
        contraseña_hash: "",
        especialidad: "",
    });

    const setLoading = (v) => dispatch({ type: "api_loading", payload: v });
    const setError = (e) => dispatch({ type: "api_error", payload: e?.message || e });

    const fetchJson = (url, options = {}) =>
        fetch(url, options)
            .then(res => res.json().then(data => ({ ok: res.ok, data })))
            .catch(err => ({ ok: false, data: { message: err.message } }));

    const limpiarFormulario = () => {
        setNuevoAnalista({
            nombre: "",
            apellido: "",
            email: "",
            contraseña_hash: "",
            especialidad: "",
        });
    };

    const crearAnalista = () => {
        // Validación básica
        if (!nuevoAnalista.nombre || !nuevoAnalista.apellido || !nuevoAnalista.email || !nuevoAnalista.especialidad) {
            setError("Los campos nombre, apellido, especialidad e email son obligatorios");
            return;
        }

        setLoading(true);
        fetchJson(`${API}/analistas`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(nuevoAnalista)
        }).then(({ ok, data }) => {
            if (!ok) throw new Error(data.message);
            dispatch({ type: "analistas_add", payload: data });
            limpiarFormulario();
            navigate('/analistas'); 
        }).catch(setError).finally(() => setLoading(false));
    };

    const cancelar = () => {
        navigate('/analistas');
    };

    return (
        <div className="container py-4">
            <div className="row justify-content-center">
                <div className="col-12 col-md-8 col-lg-6">
                    <div className="card">
                        <div className="card-header">
                            <h4 className="mb-0">
                                <i className="fas fa-user-plus me-2"></i>
                                Agregar Nuevo Analista
                            </h4>
                        </div>
                        <div className="card-body">
                            {store.api.error && (
                                <div className="alert alert-danger py-2">{String(store.api.error)}</div>
                            )}
                            {store.api.loading && (
                                <div className="alert alert-info py-2">Guardando analista...</div>
                            )}

                            <form onSubmit={(e) => { e.preventDefault(); crearAnalista(); }}>
                                <div className="row g-3">
                                    <div className="col-md-6">
                                        <label className="form-label">Nombre *</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="Ingrese el nombre"
                                            value={nuevoAnalista.nombre}
                                            onChange={e => setNuevoAnalista(s => ({ ...s, nombre: e.target.value }))}
                                            required
                                        />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label">Apellido *</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="Ingrese el apellido"
                                            value={nuevoAnalista.apellido}
                                            onChange={e => setNuevoAnalista(s => ({ ...s, apellido: e.target.value }))}
                                            required
                                        />
                                    </div>
                                    <div className="col-12">
                                        <label className="form-label">Email *</label>
                                        <input
                                            type="email"
                                            className="form-control"
                                            placeholder="Ingrese el email"
                                            value={nuevoAnalista.email}
                                            onChange={e => setNuevoAnalista(s => ({ ...s, email: e.target.value }))}
                                            required
                                        />
                                    </div>
                                    <div className="col-12">
                                        <label className="form-label">Contraseña</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="Ingrese la contraseña"
                                            value={nuevoAnalista.contraseña_hash}
                                            onChange={e => setNuevoAnalista(s => ({ ...s, contraseña_hash: e.target.value }))}
                                        />
                                    </div>
                                    <div className="col-12">
                                        <label className="form-label">especialidad</label>
                                        <input
                                            type="password"
                                            className="form-control"
                                            placeholder="Ingrese la contraseña"
                                            value={nuevoAnalista.especialidad}
                                            onChange={e => setNuevoAnalista(s => ({ ...s, especialidad: e.target.value }))}
                                        />
                                    </div>
                                </div>

                                <div className="d-flex gap-2 mt-4 justify-content-end">
                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={cancelar}
                                        disabled={store.api.loading}
                                    >
                                        <i className="fas fa-times me-1"></i>
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn btn-primary"
                                        disabled={store.api.loading}
                                    >
                                        <i className="fas fa-save me-1"></i>
                                        {store.api.loading ? 'Guardando...' : 'Guardar Analista'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
