import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import useGlobalReducer from "../hooks/useGlobalReducer";

export const VerAnalista = () => {
    const { store, dispatch } = useGlobalReducer();
    const navigate = useNavigate();
    const { id } = useParams();
    const API = import.meta.env.VITE_BACKEND_URL + "/api";

    const [analista, setAnalista] = useState(null);

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

    const cargarAnalista = () => {
        setLoading(true);
        fetchJson(`${API}/analistas/${id}`)
            .then(({ ok, data }) => {
                if (!ok) throw new Error(data.message);
                setAnalista(data);
            }).catch(setError).finally(() => setLoading(false));
    };

    const eliminarAnalista = () => {
        if (!window.confirm("¿Estás seguro de que quieres eliminar este analista?")) return;

        setLoading(true);
        fetchJson(`${API}/analistas/${id}`, { method: "DELETE" })
            .then(({ ok, data }) => {
                if (!ok) throw new Error(data.message);
                dispatch({ type: "analistas_remove", payload: parseInt(id) });
                navigate('/analistas');
            }).catch(setError).finally(() => setLoading(false));
    };

    const volver = () => {
        navigate('/analistas');
    };

    const editar = () => {
        navigate(`/actualizar-analista/${id}`);
    };

    useEffect(() => {
        if (id) {
            cargarAnalista();
        }
    }, [id]);

    if (!analista && !store.api.loading) {
        return (
            <div className="container py-4">
                <div className="row justify-content-center">
                    <div className="col-12 col-md-8 col-lg-6">
                        <div className="card">
                            <div className="card-body text-center">
                                <h5>Analista no encontrado</h5>
                                <button className="btn btn-primary" onClick={volver}>
                                    Volver al inicio
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="container py-4">
            <div className="row justify-content-center">
                <div className="col-12 col-md-8 col-lg-6">
                    <div className="card">
                        <div className="card-header">
                            <h4 className="mb-0">
                                <i className="fas fa-user me-2"></i>
                                Detalles del Analista
                            </h4>
                        </div>
                        <div className="card-body">
                            {store.api.error && (
                                <div className="alert alert-danger py-2">{String(store.api.error)}</div>
                            )}
                            {analista && (
                                <div className="row g-3">
                                    <div className="col-md-6">
                                        <label className="form-label fw-bold">Nombre:</label>
                                        <p className="form-control-plaintext">{analista.nombre}</p>
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label fw-bold">Apellido:</label>
                                        <p className="form-control-plaintext">{analista.apellido}</p>
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label fw-bold">Especialidad:</label>
                                        <p className="form-control-plaintext">{analista.especialidad}</p>
                                    </div>
                                    <div className="col-12">
                                        <label className="form-label fw-bold">Email:</label>
                                        <p className="form-control-plaintext">
                                            <a href={`mailto:${analista.email}`} className="text-decoration-none">
                                                {analista.email}
                                            </a>
                                        </p>
                                    </div>
                                </div>
                            )}

                            <div className="d-flex gap-2 mt-4 justify-content-between">
                                <button
                                    className="btn btn-secondary"
                                    onClick={volver}
                                    disabled={store.api.loading}
                                >
                                    <i className="fas fa-arrow-left me-1"></i>
                                    Volver
                                </button>

                                <div className="d-flex gap-2">
                                    <button
                                        className="btn btn-warning"
                                        onClick={editar}
                                        disabled={store.api.loading}
                                    >
                                        <i className="fas fa-edit me-1"></i>
                                        Editar
                                    </button>
                                    <button
                                        className="btn btn-danger"
                                        onClick={eliminarAnalista}
                                        disabled={store.api.loading}
                                    >
                                        <i className="fas fa-trash me-1"></i>
                                        Eliminar
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};