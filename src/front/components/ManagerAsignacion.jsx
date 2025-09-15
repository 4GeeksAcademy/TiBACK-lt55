import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useGlobalReducer from "../hooks/useGlobalReducer";

export const ManagerAsignacion = () => {
    const { store, dispatch } = useGlobalReducer();
    const navigate = useNavigate();
    const API = import.meta.env.VITE_BACKEND_URL + "/api";

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

    const listarTodasLasAsignaciones = () => {
        setLoading(true);
        fetchJson(`${API}/asignaciones`)
            .then(({ ok, data }) => {
                if (!ok) throw new Error(data.message);
                dispatch({ type: "asignaciones_set_list", payload: data });
            })
            .catch(setError)
            .finally(() => setLoading(false));
    };

    const eliminarAsignacion = (id) => {
        if (!window.confirm("¿Estás seguro de que quieres eliminar esta asignación?")) return;

        setLoading(true);
        fetchJson(`${API}/asignaciones/${id}`, { method: "DELETE" })
            .then(({ ok, data }) => {
                if (!ok) throw new Error(data.message);
                dispatch({ type: "asignaciones_remove", payload: id });
            }).catch(setError).finally(() => setLoading(false));
    };

    useEffect(() => {
        listarTodasLasAsignaciones();
    }, []);

    return (
        <>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div></div>
                <div className="d-flex gap-2">
                    <button
                        className="btn btn-primary"
                        onClick={() => navigate('/agregar-asignacion')}
                    >
                        <i className="fas fa-plus"></i> Agregar Asignación
                    </button>
                </div>
            </div>

            {store.api.error && (
                <div className="alert alert-danger py-2">{String(store.api.error)}</div>
            )}


            <div className="row">
                <div className="col-12">
                    <div className="card">
                        <div className="card-header d-flex justify-content-between align-items-center">
                            <h5 className="mb-0">Lista de Asignaciones</h5>
                            <button className="btn btn-outline-primary" onClick={listarTodasLasAsignaciones}>
                                <i className="fas fa-refresh"></i> Actualizar Lista
                            </button>
                        </div>
                        <div className="card-body">
                            {Array.isArray(store.asignaciones) && store.asignaciones.length > 0 ? (
                                <div className="table-responsive">
                                    <table className="table table-striped">
                                        <thead>
                                            <tr>
                                                <th>ID</th>
                                                <th>ID Ticket</th>
                                                <th>ID Supervisor</th>
                                                <th>ID Analista</th>
                                                <th>Fecha Asignación</th>
                                                <th>Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {store.asignaciones.map((asignacion) => (
                                                <tr key={asignacion.id}>
                                                    <td>{asignacion.id}</td>
                                                    <td>{asignacion.id_ticket}</td>
                                                    <td>{asignacion.id_supervisor}</td>
                                                    <td>{asignacion.id_analista}</td>
                                                    <td>{asignacion.fecha_asignacion}</td>
                                                    <td>
                                                        <div className="d-flex gap-2" role="group">
                                                            <button
                                                                className="btn btn-warning"
                                                                onClick={() => navigate(`/actualizar-asignacion/${asignacion.id}`)}
                                                                title="Actualizar Asignación"
                                                            >
                                                                <i className="fas fa-edit"></i>
                                                            </button>
                                                            <button
                                                                className="btn btn-info"
                                                                onClick={() => navigate(`/ver-asignacion/${asignacion.id}`)}
                                                                title="Ver Asignación"
                                                            >
                                                                <i className="fas fa-eye"></i>
                                                            </button>
                                                            <button
                                                                className="btn btn-danger"
                                                                onClick={() => eliminarAsignacion(asignacion.id)}
                                                                title="Eliminar Asignación"
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
                                    <p className="text-muted">No hay asignaciones registradas.</p>
                                    <button className="btn btn-primary" onClick={listarTodasLasAsignaciones}>
                                        Cargar Asignaciones
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