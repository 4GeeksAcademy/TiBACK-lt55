import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useGlobalReducer from "../hooks/useGlobalReducer";

export const AnalistasManager = () => {
    const { store, dispatch } = useGlobalReducer();
    const navigate = useNavigate();
    const API = import.meta.env.VITE_BACKEND_URL + "/api";

    const setLoading = (v) => dispatch({ type: "api_loading", payload: v });
    const setError = (e) => dispatch({ type: "api_error", payload: e?.message || e });

    const fetchJson = (url, options = {}) =>
        fetch(url, options)
            .then(res => res.json().then(data => ({ ok: res.ok, data })))
            .catch(err => ({ ok: false, data: { message: err.message } }));

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

    const eliminarAnalista = (id) => {
        if (!window.confirm("¿Estás seguro de que quieres eliminar este analista?")) return;

        setLoading(true);
        fetchJson(`${API}/analistas/${id}`, { method: "DELETE" })
            .then(({ ok, data }) => {
                if (!ok) throw new Error(data.message);
                dispatch({ type: "analistas_remove", payload: id });
            }).catch(setError).finally(() => setLoading(false));
    };

    useEffect(() => {
        listarTodosLosAnalistas();
    }, []);

    return (
        <>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div></div>
                <div className="d-flex gap-2">
                    <button
                        className="btn btn-primary"
                        onClick={() => navigate('/agregar-analista')}
                    >
                        <i className="fas fa-plus"></i> Agregar Analista
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
                                                <th>Nombre</th>
                                                <th>Apellido</th>
                                                <th>Email</th>
                                                <th>especialidad</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {store.analistas.map((analista) => (
                                                <tr key={analista.id}>
                                                    <td>{analista.nombre}</td>
                                                    <td>{analista.apellido}</td>
                                                    <td>{analista.email}</td>
                                                    <td>{analista.especialidad}</td>
                                                    <td>
                                                        <div className="d-flex gap-2" role="group">
                                                            <button
                                                                className="btn btn-warning"
                                                                onClick={() => navigate(`/actualizar-analista/${analista.id}`)}
                                                                title="Actualizar Analista"
                                                            >
                                                                <i className="fas fa-edit"></i>
                                                            </button>
                                                            <button
                                                                className="btn btn-info"
                                                                onClick={() => navigate(`/ver-analista/${analista.id}`)}
                                                                title="Ver Analista"
                                                            >
                                                                <i className="fas fa-eye"></i>
                                                            </button>
                                                            <button
                                                                className="btn btn-danger"
                                                                onClick={() => eliminarAnalista(analista.id)}
                                                                title="Eliminar Analista"
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
                                    <p className="text-muted">No hay analistas registrados.</p>
                                    <button className="btn btn-primary" onClick={listarTodosLosAnalistas}>
                                        Cargar Analistas
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
