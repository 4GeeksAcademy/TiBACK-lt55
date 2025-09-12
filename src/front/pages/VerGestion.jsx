import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import useGlobalReducer from "../hooks/useGlobalReducer";

export const VerGestion = () => {
    const { store, dispatch } = useGlobalReducer();
    const navigate = useNavigate();
    const { id } = useParams();
    const API = import.meta.env.VITE_BACKEND_URL + "/api";

    const [gestion, setgestion] = useState(null);

    const setLoading = (v) => dispatch({ type: "api_loading", payload: v });
    const setError = (e) => dispatch({ type: "api_error", payload: e?.message || e });

    const fetchJson = (url, options = {}) =>
        fetch(url, options)
            .then(res => res.json().then(data => ({ ok: res.ok, data })))
            .catch(err => ({ ok: false, data: { message: err.message } }));

    const cargarGestion = () => {
        setLoading(true);
        fetchJson(`${API}/gestiones/${id}`)
            .then(({ ok, data }) => {
                if (!ok) throw new Error(data.message);
                setgestion(data);
            }).catch(setError).finally(() => setLoading(false));
    };

    const eliminarGestion = () => {
        if (!window.confirm("¿Estás seguro de que quieres eliminar esta gestion?")) return;

        setLoading(true);
        fetchJson(`${API}/gestiones/${id}`, { method: "DELETE" })
            .then(({ ok, data }) => {
                if (!ok) throw new Error(data.message);
                dispatch({ type: "gestiones_remove", payload: parseInt(id) });
                navigate('/gestiones'); // Volver al home después de eliminar
            }).catch(setError).finally(() => setLoading(false));
    };

    const volver = () => {
        navigate('/gestiones');
    };

    const editar = () => {
        navigate(`/actualizar-gestion/${id}`);
    };

    useEffect(() => {
        if (id) {
            cargarGestion();
        }
    }, [id]);

    if (!gestion && !store.api.loading) {
        return (
            <div className="container py-4">
                <div className="row justify-content-center">
                    <div className="col-12 col-md-8 col-lg-6">
                        <div className="card">
                            <div className="card-body text-center">
                                <h5>Gestion no encontrada</h5>
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
                                Detalles de la gestion
                            </h4>
                        </div>
                        <div className="card-body">
                            {store.api.error && (
                                <div className="alert alert-danger py-2">{String(store.api.error)}</div>
                            )}

                            {gestion && (
                                <div className="row g-3">
                                    <div className="col-md-6">
                                        <label className="form-label fw-bold">Ticket:</label>
                                        <p className="form-control-plaintext">{gestion.id_ticket}</p>
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label fw-bold">Fecha del cambio:</label>
                                        <p className="form-control-plaintext">{gestion.fecha_cambio}</p>
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label fw-bold">Nota del caso:</label>
                                        <p className="form-control-plaintext">{gestion.Nota_de_caso}</p>
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
                                        onClick={eliminarGestion}
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
