import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import useGlobalReducer from "../hooks/useGlobalReducer";

export const AgregarCliente = () => {
    const { store, dispatch } = useGlobalReducer();
    const navigate = useNavigate();
    const API = import.meta.env.VITE_BACKEND_URL + "/api";

    const [nuevoCliente, setNuevoCliente] = useState({
        nombre: "",
        apellido: "",
        email: "",
        contraseña_hash: "",
        direccion: "",
        telefono: ""
    });

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

    const limpiarFormulario = () => {
        setNuevoCliente({
            nombre: "",
            apellido: "",
            email: "",
            contraseña_hash: "",
            direccion: "",
            telefono: "" 
        });
    };

    const crearCliente = () => {
        // Validación básica
        if (!nuevoCliente.nombre || !nuevoCliente.apellido || !nuevoCliente.email) {
            setError("Los campos nombre, apellido y email son obligatorios");
            return;
        }

        setLoading(true);
        fetchJson(`${API}/clientes`, {
            method: "POST",
            body: JSON.stringify(nuevoCliente)
        }).then(({ ok, data }) => {
            if (!ok) throw new Error(data.message);
            dispatch({ type: "clientes_add", payload: data });
            limpiarFormulario();
            navigate('/clientes'); 
        }).catch(setError).finally(() => setLoading(false));
    };

    const cancelar = () => {
        navigate('/clientes');
    };

    return (
        <div className="container py-4">
            <div className="row justify-content-center">
                <div className="col-12 col-md-8 col-lg-6">
                    <div className="card">
                        <div className="card-header">
                            <h4 className="mb-0">
                                <i className="fas fa-user-plus me-2"></i>
                                Agregar Nuevo Cliente
                            </h4>
                        </div>
                        <div className="card-body">
                            {store.api.error && (
                                <div className="alert alert-danger py-2">{String(store.api.error)}</div>
                            )}
                            <form onSubmit={(e) => { e.preventDefault(); crearCliente(); }}>
                                <div className="row g-3">
                                    <div className="col-md-6">
                                        <label className="form-label">Nombre *</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="Ingrese el nombre"
                                            value={nuevoCliente.nombre}
                                            onChange={e => setNuevoCliente(s => ({ ...s, nombre: e.target.value }))}
                                            required
                                        />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label">Apellido *</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="Ingrese el apellido"
                                            value={nuevoCliente.apellido}
                                            onChange={e => setNuevoCliente(s => ({ ...s, apellido: e.target.value }))}
                                            required
                                        />
                                    </div>
                                    <div className="col-12">
                                        <label className="form-label">Email *</label>
                                        <input
                                            type="email"
                                            className="form-control"
                                            placeholder="Ingrese el email"
                                            value={nuevoCliente.email}
                                            onChange={e => setNuevoCliente(s => ({ ...s, email: e.target.value }))}
                                            required
                                        />
                                    </div>
                                    <div className="col-12">
                                        <label className="form-label">Contraseña</label>
                                        <input
                                            type="password"
                                            className="form-control"
                                            placeholder="Ingrese la contraseña"
                                            value={nuevoCliente.contraseña_hash}
                                            onChange={e => setNuevoCliente(s => ({ ...s, contraseña_hash: e.target.value }))}
                                        />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label">Teléfono</label>
                                        <input
                                            type="tel"
                                            className="form-control"
                                            placeholder="Ingrese el teléfono"
                                            value={nuevoCliente.telefono}
                                            onChange={e => setNuevoCliente(s => ({ ...s, telefono: e.target.value }))}
                                        />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label">Dirección</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="Ingrese la dirección"
                                            value={nuevoCliente.direccion}
                                            onChange={e => setNuevoCliente(s => ({ ...s, direccion: e.target.value }))}
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
                                        {store.api.loading ? 'Guardando...' : 'Guardar Cliente'}
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