import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useGlobalReducer from "../hooks/useGlobalReducer";

export const ManagerAdministrador = () => {
    const { store, dispatch } = useGlobalReducer();
    const navigate = useNavigate();
    const API = import.meta.env.VITE_BACKEND_URL + "/api";

    const setLoading = (v) => dispatch({ type: "api_loading", payload: v });
    const setError = (e) => dispatch({ type: "api_error", payload: e?.message || e });

    const fetchJson = (url, options = {}) =>
        fetch(url, options)
            .then(res => res.json().then(data => ({ ok: res.ok, data })))
            .catch(err => ({ ok: false, data: { message: err.message } }));

    const listarTodosLosAdministradores = () => {
        setLoading(true);
        fetchJson(`${API}/administradores`)
            .then(({ ok, data }) => {
                if (!ok) throw new Error(data.message);
                dispatch({ type: "administradores_set_list", payload: data });
            })
            .catch(setError)
            .finally(() => setLoading(false));
    };

    const eliminarAdministrador = (id) => {
        if (!window.confirm("¿Estás seguro de que quieres eliminar este administrador?")) return;

        setLoading(true);
        fetchJson(`${API}/administradores/${id}`, { method: "DELETE" })
            .then(({ ok, data }) => {
                if (!ok) throw new Error(data.message);
                dispatch({ type: "administradores_remove", payload: id });
            }).catch(setError).finally(() => setLoading(false));
    };

    useEffect(() => {
        listarTodosLosAdministradores();
    }, []);

    return (
        <>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div></div>
                <div className="d-flex gap-2">
                    <button
                        className="btn btn-primary"
                        onClick={() => navigate('/agregar-administrador')}
                    >
                        <i className="fas fa-plus"></i> Agregar Administrador
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
                            <h5 className="mb-0">Lista de Administradores</h5>
                            <button className="btn btn-outline-primary" onClick={listarTodosLosAdministradores}>
                                <i className="fas fa-refresh"></i> Actualizar Lista
                            </button>
                        </div>
                        <div className="card-body">
                            {Array.isArray(store.administradores) && store.administradores.length > 0 ? (
                                <div className="table-responsive">
                                    <table className="table table-striped">
                                        <thead>
                                            <tr>
                                                <th>ID</th>
                                                <th>Email</th>
                                                <th>Permisos Especiales</th>
                                                <th>Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {store.administradores.map((administrador) => (
                                                <tr key={administrador.id}>
                                                    <td>{administrador.id}</td>
                                                    <td>{administrador.email}</td>
                                                    <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                        {administrador.permisos_especiales}
                                                    </td>
                                                    <td>
                                                        <div className="d-flex gap-2" role="group">
                                                            <button
                                                                className="btn btn-warning"
                                                                onClick={() => navigate(`/actualizar-administrador/${administrador.id}`)}
                                                                title="Actualizar Administrador"
                                                            >
                                                                <i className="fas fa-edit"></i>
                                                            </button>
                                                            <button
                                                                className="btn btn-info"
                                                                onClick={() => navigate(`/ver-administrador/${administrador.id}`)}
                                                                title="Ver Administrador"
                                                            >
                                                                <i className="fas fa-eye"></i>
                                                            </button>
                                                            <button
                                                                className="btn btn-danger"
                                                                onClick={() => eliminarAdministrador(administrador.id)}
                                                                title="Eliminar Administrador"
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
                                    <p className="text-muted">No hay administradores registrados.</p>
                                    <button className="btn btn-primary" onClick={listarTodosLosAdministradores}>
                                        Cargar Administradores
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
