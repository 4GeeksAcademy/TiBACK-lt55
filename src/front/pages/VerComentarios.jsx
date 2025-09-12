import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import useGlobalReducer from "../hooks/useGlobalReducer";

export const VerComentarios = () => {
    const { store, dispatch } = useGlobalReducer();
    const navigate = useNavigate();
    const { id } = useParams();
    const API = import.meta.env.VITE_BACKEND_URL + "/api";

    const [comentario, setComentario] = useState(null);

    const setLoading = (v) => dispatch({ type: "api_loading", payload: v });
    const setError = (e) => dispatch({ type: "api_error", payload: e?.message || e });

    const fetchJson = (url, options = {}) =>
        fetch(url, options)
            .then(res => res.json().then(data => ({ ok: res.ok, data })))
            .catch(err => ({ ok: false, data: { message: err.message } }));

    const cargarComentario = () => {
        setLoading(true);
        fetchJson(`${API}/comentarios/${id}`)
            .then(({ ok, data }) => {
                if (!ok) throw new Error(data.message);
                setComentario(data);
            }).catch(setError).finally(() => setLoading(false));
    };

    const eliminarComentario = () => {
        if (!window.confirm("¿Estás seguro de que quieres eliminar este comentario?")) return;

        setLoading(true);
        fetchJson(`${API}/comentarios/${id}`, { method: "DELETE" })
            .then(({ ok, data }) => {
                if (!ok) throw new Error(data.message);
                dispatch({ type: "comentarios_remove", payload: parseInt(id) });
                navigate('/comentarios'); 
            }).catch(setError).finally(() => setLoading(false));
    };

    const volver = () => {
        navigate('/comentarios');
    };

    const editar = () => {
        navigate(`/actualizar-comentario/${id}`);
    };

    useEffect(() => {
        if (id) {
            cargarComentario();
        }
    }, [id]);

    if (!comentario && !store.api.loading) {
        return (
            <div className="container py-4">
                <div className="row justify-content-center">
                    <div className="col-12 col-md-8 col-lg-6">
                        <div className="card">
                            <div className="card-body text-center">
                                <h5>Comentario no encontrado</h5>
                                <button className="btn btn-primary" onClick={volver}>
                                    Volver a la lista
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
                                <i className="fas fa-comment me-2"></i>
                                Detalles del Comentario
                            </h4>
                        </div>
                        <div className="card-body">
                            {store.api.error && (
                                <div className="alert alert-danger py-2">{String(store.api.error)}</div>
                            )}
                            {comentario && (
                                <div className="row g-3">
                                    <div className="col-md-6">
                                        <label className="form-label fw-bold">ID:</label>
                                        <p className="form-control-plaintext">{comentario.id}</p>
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label fw-bold">ID Gestión:</label>
                                        <p className="form-control-plaintext">{comentario.id_gestion}</p>
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label fw-bold">ID Cliente:</label>
                                        <p className="form-control-plaintext">{comentario.id_cliente}</p>
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label fw-bold">ID Analista:</label>
                                        <p className="form-control-plaintext">{comentario.id_analista}</p>
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label fw-bold">ID Supervisor:</label>
                                        <p className="form-control-plaintext">{comentario.id_supervisor}</p>
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label fw-bold">Fecha del Comentario:</label>
                                        <p className="form-control-plaintext">{comentario.fecha_comentario}</p>
                                    </div>
                                    <div className="col-12">
                                        <label className="form-label fw-bold">Texto del Comentario:</label>
                                        <div className="form-control-plaintext border p-3 bg-light rounded">
                                            {comentario.texto}
                                        </div>
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
                                        onClick={eliminarComentario}
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
