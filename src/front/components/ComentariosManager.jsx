import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useGlobalReducer from "../hooks/useGlobalReducer";

export const ComentariosManager = () => {
    const { store, dispatch } = useGlobalReducer();
    const navigate = useNavigate();
    const API = import.meta.env.VITE_BACKEND_URL + "/api";

    const setLoading = (v) => dispatch({ type: "api_loading", payload: v });
    const setError = (e) => dispatch({ type: "api_error", payload: e?.message || e });

    const fetchJson = (url, options = {}) =>
        fetch(url, options)
            .then(res => res.json().then(data => ({ ok: res.ok, data })))
            .catch(err => ({ ok: false, data: { message: err.message } }));

    const listarTodosLosComentarios = () => {
        setLoading(true);
        fetchJson(`${API}/comentarios`)
            .then(({ ok, data }) => {
                if (!ok) throw new Error(data.message);
                dispatch({ type: "comentarios_set_list", payload: data });
            })
            .catch(setError)
            .finally(() => setLoading(false));
    };

    const eliminarComentario = (id) => {
        if (!window.confirm("¿Estás seguro de que quieres eliminar este comentario?")) return;

        setLoading(true);
        fetchJson(`${API}/comentarios/${id}`, { method: "DELETE" })
            .then(({ ok, data }) => {
                if (!ok) throw new Error(data.message);
                dispatch({ type: "comentarios_remove", payload: id });
            }).catch(setError).finally(() => setLoading(false));
    };

    useEffect(() => {
        listarTodosLosComentarios();
    }, []);

    return (
        <>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div></div>
                <div className="d-flex gap-2">
                    <button
                        className="btn btn-primary"
                        onClick={() => navigate('/agregar-comentario')}
                    >
                        <i className="fas fa-plus"></i> Agregar Comentario
                    </button>
                </div>
            </div>

            {store.api.error && (
                <div className="alert alert-danger py-2">{String(store.api.error)}</div>
            )}
            {store.api.loading && (
                <div className="alert alert-info py-2">Cargando...</div>
            )}

            <div className="row">
                <div className="col-12">
                    <div className="card">
                        <div className="card-header d-flex justify-content-between align-items-center">
                            <h5 className="mb-0">Lista de Comentarios</h5>
                            <button className="btn btn-outline-primary" onClick={listarTodosLosComentarios}>
                                <i className="fas fa-refresh"></i> Actualizar Lista
                            </button>
                        </div>
                        <div className="card-body">
                            {Array.isArray(store.comentarios) && store.comentarios.length > 0 ? (
                                <div className="table-responsive">
                                    <table className="table table-striped">
                                        <thead>
                                            <tr>
                                                <th>ID</th>
                                                <th>ID Gestión</th>
                                                <th>ID Cliente</th>
                                                <th>ID Analista</th>
                                                <th>ID Supervisor</th>
                                                <th>Texto</th>
                                                <th>Fecha</th>
                                                <th>Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {store.comentarios.map((comentario) => (
                                                <tr key={comentario.id}>
                                                    <td>{comentario.id}</td>
                                                    <td>{comentario.id_gestion}</td>
                                                    <td>{comentario.id_cliente}</td>
                                                    <td>{comentario.id_analista}</td>
                                                    <td>{comentario.id_supervisor}</td>
                                                    <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                        {comentario.texto}
                                                    </td>
                                                    <td>{comentario.fecha_comentario}</td>
                                                    <td>
                                                        <div className="d-flex gap-2" role="group">
                                                            <button
                                                                className="btn btn-warning"
                                                                onClick={() => navigate(`/actualizar-comentario/${comentario.id}`)}
                                                                title="Actualizar Comentario"
                                                            >
                                                                <i className="fas fa-edit"></i>
                                                            </button>
                                                            <button
                                                                className="btn btn-info"
                                                                onClick={() => navigate(`/ver-comentario/${comentario.id}`)}
                                                                title="Ver Comentario"
                                                            >
                                                                <i className="fas fa-eye"></i>
                                                            </button>
                                                            <button
                                                                className="btn btn-danger"
                                                                onClick={() => eliminarComentario(comentario.id)}
                                                                title="Eliminar Comentario"
                                                            >
                                                                <i className="fas fa-trash"></i>
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="text-center py-4">
                                    <p className="text-muted">No hay comentarios registrados.</p>
                                    <button className="btn btn-primary" onClick={listarTodosLosComentarios}>
                                        Cargar Comentarios
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};
