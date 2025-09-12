import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import useGlobalReducer from "../hooks/useGlobalReducer";

export const ActualizarAdministrador = () => {
    const { store, dispatch } = useGlobalReducer();
    const navigate = useNavigate();
    const { id } = useParams();
    const API = import.meta.env.VITE_BACKEND_URL + "/api";

    const [administrador, setAdministrador] = useState({
        permisos_especiales: "",
        email: "",
        contraseña_hash: ""
    });

    const setLoading = (v) => dispatch({ type: "api_loading", payload: v });
    const setError = (e) => dispatch({ type: "api_error", payload: e?.message || e });

    const fetchJson = (url, options = {}) =>
        fetch(url, options)
            .then(res => res.json().then(data => ({ ok: res.ok, data })))
            .catch(err => ({ ok: false, data: { message: err.message } }));

    const cargarAdministrador = () => {
        setLoading(true);
        fetchJson(`${API}/administradores/${id}`)
            .then(({ ok, data }) => {
                if (!ok) throw new Error(data.message);
                setAdministrador({
                    permisos_especiales: data.permisos_especiales,
                    email: data.email,
                    contraseña_hash: "" // No cargar la contraseña por seguridad
                });
            }).catch(setError).finally(() => setLoading(false));
    };

    const actualizarAdministrador = () => {
        // Validación básica
        if (!administrador.permisos_especiales || !administrador.email) {
            setError("Los campos permisos especiales y email son obligatorios");
            return;
        }

        // Solo enviar contraseña si se proporcionó una nueva
        const datosActualizacion = {
            permisos_especiales: administrador.permisos_especiales,
            email: administrador.email
        };

        if (administrador.contraseña_hash) {
            datosActualizacion.contraseña_hash = administrador.contraseña_hash;
        }

        setLoading(true);
        fetchJson(`${API}/administradores/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(datosActualizacion)
        }).then(({ ok, data }) => {
            if (!ok) throw new Error(data.message);
            dispatch({ type: "administradores_upsert", payload: data });
            navigate('/administradores'); // Volver a la lista de administradores
        }).catch(setError).finally(() => setLoading(false));
    };

    const cancelar = () => {
        navigate('/administradores');
    };

    useEffect(() => {
        if (id) {
            cargarAdministrador();
        }
    }, [id]);

    return (
        <div className="container py-4">
            <div className="row justify-content-center">
                <div className="col-12 col-md-8 col-lg-6">
                    <div className="card">
                        <div className="card-header">
                            <h4 className="mb-0">
                                <i className="fas fa-user-edit me-2"></i>
                                Actualizar Administrador
                            </h4>
                        </div>
                        <div className="card-body">
                            {store.api.error && (
                                <div className="alert alert-danger py-2">{String(store.api.error)}</div>
                            )}
                            <form onSubmit={(e) => { e.preventDefault(); actualizarAdministrador(); }}>
                                <div className="row g-3">
                                    <div className="col-12">
                                        <label className="form-label">Email *</label>
                                        <input
                                            type="email"
                                            className="form-control"
                                            placeholder="Ingrese el email del administrador"
                                            value={administrador.email}
                                            onChange={e => setAdministrador(s => ({ ...s, email: e.target.value }))}
                                            required
                                        />
                                    </div>
                                    <div className="col-12">
                                        <label className="form-label">Nueva Contraseña</label>
                                        <input
                                            type="password"
                                            className="form-control"
                                            placeholder="Ingrese la nueva contraseña (dejar vacío para mantener la actual)"
                                            value={administrador.contraseña_hash}
                                            onChange={e => setAdministrador(s => ({ ...s, contraseña_hash: e.target.value }))}
                                        />
                                    </div>
                                    <div className="col-12">
                                        <label className="form-label">Permisos Especiales *</label>
                                        <textarea
                                            className="form-control"
                                            placeholder="Ingrese los permisos especiales del administrador"
                                            value={administrador.permisos_especiales}
                                            onChange={e => setAdministrador(s => ({ ...s, permisos_especiales: e.target.value }))}
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
                                        className="btn btn-warning"
                                        disabled={store.api.loading}
                                    >
                                        <i className="fas fa-save me-1"></i>
                                        {store.api.loading ? 'Actualizando...' : 'Actualizar Administrador'}
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
