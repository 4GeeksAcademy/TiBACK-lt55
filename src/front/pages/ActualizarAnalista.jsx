import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import useGlobalReducer from "../hooks/useGlobalReducer";

export const ActualizarAnalista = () => {
    const { store, dispatch } = useGlobalReducer();
    const navigate = useNavigate();
    const { id } = useParams();
    const API = import.meta.env.VITE_BACKEND_URL + "/api";

    const [analista, setAnalista] = useState({
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

    const cargarAnalista = () => {
        setLoading(true);
        fetchJson(`${API}/analistas/${id}`)
            .then(({ ok, data }) => {
                if (!ok) throw new Error(data.message);
                setAnalista({
                    nombre: data.nombre,
                    apellido: data.apellido,
                    email: data.email,
                    especialidad: data.especialidad,
                    contraseña_hash: data.contraseña_hash || "",
                });
            }).catch(setError).finally(() => setLoading(false));
    };

    const actualizarAnalista = () => {
        // Validación básica
        if (!analista.nombre || !analista.apellido || !analista.email || !analista.especialidad) {
            setError("Los campos nombre, apellido y email son obligatorios");
            return;
        }

        setLoading(true);
        fetchJson(`${API}/analistas/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(analista)
        }).then(({ ok, data }) => {
            if (!ok) throw new Error(data.message);
            dispatch({ type: "analistas_upsert", payload: data });
            navigate('/'); // Volver al home después de actualizar
        }).catch(setError).finally(() => setLoading(false));
    };

    const cancelar = () => {
        navigate('/');
    };

    useEffect(() => {
        if (id) {
            cargarAnalista();
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
                                Actualizar Analista
                            </h4>
                        </div>
                        <div className="card-body">
                            {store.api.error && (
                                <div className="alert alert-danger py-2">{String(store.api.error)}</div>
                            )}
                            {store.api.loading && (
                                <div className="alert alert-info py-2">
                                    {analista.nombre ? 'Actualizando analista...' : 'Cargando analista...'}
                                </div>
                            )}

                            <form onSubmit={(e) => { e.preventDefault(); actualizarAnalista(); }}>
                                <div className="row g-3">
                                    <div className="col-md-6">
                                        <label className="form-label">Nombre *</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="Ingrese el nombre"
                                            value={analista.nombre}
                                            onChange={e => setAnalista(s => ({ ...s, nombre: e.target.value }))}
                                            required
                                        />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label">Apellido *</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="Ingrese el apellido"
                                            value={analista.apellido}
                                            onChange={e => setAnalista(s => ({ ...s, apellido: e.target.value }))}
                                            required
                                        />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label">especialidad *</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="Ingrese la especialidad"
                                            value={analista.especialidad}
                                            onChange={e => setAnalista(s => ({ ...s, especialidad: e.target.value }))}
                                            required
                                        />
                                    </div>
                                    <div className="col-12">
                                        <label className="form-label">Email *</label>
                                        <input
                                            type="email"
                                            className="form-control"
                                            placeholder="Ingrese el email"
                                            value={analista.email}
                                            onChange={e => setAnalista(s => ({ ...s, email: e.target.value }))}
                                            required
                                        />
                                    </div>
                                    <div className="col-12">
                                        <label className="form-label">Contraseña</label>
                                        <input
                                            type="password"
                                            className="form-control"
                                            placeholder="Ingrese la nueva contraseña (dejar vacío para mantener la actual)"
                                            value={analista.contraseña_hash}
                                            onChange={e => setAnalista(s => ({ ...s, contraseña_hash: e.target.value }))}
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
                                        {store.api.loading ? 'Actualizando...' : 'Actualizar Analista'}
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
