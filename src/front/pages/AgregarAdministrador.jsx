import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import useGlobalReducer from "../hooks/useGlobalReducer";

export const AgregarAdministrador = () => {
    const { store, dispatch } = useGlobalReducer();
    const navigate = useNavigate();
    const API = import.meta.env.VITE_BACKEND_URL + "/api";

    const [nuevoAdministrador, setNuevoAdministrador] = useState({
        permisos_especiales: "",
        email: "",
        contraseña_hash: ""
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
        setNuevoAdministrador({
            permisos_especiales: "",
            email: "",
            contraseña_hash: ""
        });
    };

    const crearAdministrador = () => {
        // Validación básica
        if (!nuevoAdministrador.permisos_especiales || !nuevoAdministrador.email || !nuevoAdministrador.contraseña_hash) {
            setError("Todos los campos son obligatorios");
            return;
        }

        setLoading(true);
        fetchJson(`${API}/administradores`, {
            method: "POST",
            body: JSON.stringify(nuevoAdministrador)
        }).then(({ ok, data }) => {
            if (!ok) throw new Error(data.message);
            dispatch({ type: "administradores_add", payload: data });
            limpiarFormulario();
            navigate('/administradores'); // Volver a la lista de administradores
        }).catch(setError).finally(() => setLoading(false));
    };

    const cancelar = () => {
        navigate('/administradores');
    };

    return (
        <div className="container py-4">
            <div className="row justify-content-center">
                <div className="col-12 col-md-8 col-lg-6">
                    <div className="card">
                        <div className="card-header">
                            <h4 className="mb-0">
                                <i className="fas fa-user-shield me-2"></i>
                                Agregar Nuevo Administrador
                            </h4>
                        </div>
                        <div className="card-body">
                            {store.api.error && (
                                <div className="alert alert-danger py-2">{String(store.api.error)}</div>
                            )}
                            <form onSubmit={(e) => { e.preventDefault(); crearAdministrador(); }}>
                                <div className="row g-3">
                                    <div className="col-12">
                                        <label className="form-label">Email *</label>
                                        <input
                                            type="email"
                                            className="form-control"
                                            placeholder="Ingrese el email del administrador"
                                            value={nuevoAdministrador.email}
                                            onChange={e => setNuevoAdministrador(s => ({ ...s, email: e.target.value }))}
                                            required
                                        />
                                    </div>
                                    <div className="col-12">
                                        <label className="form-label">Contraseña *</label>
                                        <input
                                            type="password"
                                            className="form-control"
                                            placeholder="Ingrese la contraseña"
                                            value={nuevoAdministrador.contraseña_hash}
                                            onChange={e => setNuevoAdministrador(s => ({ ...s, contraseña_hash: e.target.value }))}
                                            required
                                        />
                                    </div>
                                    <div className="col-12">
                                        <label className="form-label">Permisos Especiales *</label>
                                        <textarea
                                            className="form-control"
                                            placeholder="Ingrese los permisos especiales del administrador"
                                            value={nuevoAdministrador.permisos_especiales}
                                            onChange={e => setNuevoAdministrador(s => ({ ...s, permisos_especiales: e.target.value }))}
                                            rows="3"
                                            required
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
                                        {store.api.loading ? 'Guardando...' : 'Guardar Administrador'}
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