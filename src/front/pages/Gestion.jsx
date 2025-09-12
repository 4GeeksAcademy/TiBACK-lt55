import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useGlobalReducer from "../hooks/useGlobalReducer";

export const Gestion = () => {
  const { store, dispatch } = useGlobalReducer();
  const navigate = useNavigate();
  const API = import.meta.env.VITE_BACKEND_URL + "/api";

  const setLoading = (v) => dispatch({ type: "api_loading", payload: v });
  const setError = (e) => dispatch({ type: "api_error", payload: e?.message || e });

  const fetchJson = (url, options = {}) =>
    fetch(url, options)
      .then(res => res.json().then(data => ({ ok: res.ok, data })))
      .catch(err => ({ ok: false, data: { message: err.message } }));

  const listarTodasLasGestiones = () => {
    setLoading(true);
    fetchJson(`${API}/gestiones`)
      .then(({ ok, data }) => {
        if (!ok) throw new Error(data.message);
        dispatch({ type: "gestiones_set_list", payload: data });
      })
      .catch(setError)
      .finally(() => setLoading(false));
  };

  const eliminarGestion = (id) => {
    if (!window.confirm("¿Estás seguro de que quieres eliminar esta gestión?")) return;

    setLoading(true);
    fetchJson(`${API}/gestiones/${id}`, { method: "DELETE" })
      .then(({ ok, data }) => {
        if (!ok) throw new Error(data.message);
        dispatch({ type: "gestiones_remove", payload: id });
      }).catch(setError).finally(() => setLoading(false));
  };

  useEffect(() => {
    listarTodasLasGestiones();
  }, []);

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">Lista de Gestiones</h2>
        <button
          className="btn btn-primary"
          onClick={() => navigate('/agregar-gestion')}
        >
          <i className="fas fa-plus"></i> Agregar Gestión
        </button>
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
              <h5 className="mb-0">Gestiones Cargadas</h5>
              <button className="btn btn-outline-primary" onClick={listarTodasLasGestiones}>
                <i className="fas fa-refresh"></i> Actualizar Lista
              </button>
            </div>
            <div className="card-body">
              {Array.isArray(store.gestiones) && store.gestiones.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-striped">
                    <thead>
                      <tr>
                        <th>Ticket</th>
                        <th>Fecha del cambio</th>
                        <th>Nota del caso</th>
                      </tr>
                    </thead>
                    <tbody>
                      {store.gestiones.map((gestion) => (
                        <tr key={gestion.id}>
                          <td>{gestion.id_ticket}</td>
                          <td>{gestion.fecha_cambio}</td>
                          <td>{gestion.Nota_de_caso}</td>
                          <td>
                            <div className="btn-group" role="group">
                              <button
                                className="btn btn-warning btn-sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/actualizar-gestion/${gestion.id}`);
                                }}
                              >
                                <i className="fas fa-edit"></i>
                              </button>
                              <button
                                className="btn btn-danger btn-sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  eliminarGestion(gestion.id);
                                }}
                              >
                                <i className="fas fa-trash"></i>
                              </button>
                            </div>
                            <button
                              className="btn btn-info btn-sm ms-4"
                              onClick={() => navigate(`/ver-gestion/${gestion.id}`)}>
                              <i className="fa-solid fa-eye"> ver</i>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-muted">No hay gestiones realizadas.</p>
                  <button className="btn btn-primary" onClick={listarTodasLasGestiones}>
                    Cargar Gestiones
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
