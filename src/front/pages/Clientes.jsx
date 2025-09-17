import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useGlobalReducer from "../hooks/useGlobalReducer";

// Utilidades de token seguras
const tokenUtils = {
  decodeToken: (token) => {
    try {
      if (!token) return null;
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      return JSON.parse(atob(parts[1]));
    } catch (error) {
      return null;
    }
  },
  getRole: (token) => {
    const payload = tokenUtils.decodeToken(token);
    return payload ? payload.role : null;
  }
};

export const Clientes = () => {
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

  const listarTodosLosClientes = () => {
    setLoading(true);
    fetchJson(`${API}/clientes`)
      .then(({ ok, data }) => {
        if (!ok) throw new Error(data.message);
        dispatch({ type: "clientes_set_list", payload: data });
      })
      .catch(setError)
      .finally(() => setLoading(false));
  };

  const eliminarCliente = (id) => {
    if (!window.confirm("¿Estás seguro de que quieres eliminar este cliente?")) return;

    setLoading(true);
    fetchJson(`${API}/clientes/${id}`, { method: "DELETE" })
      .then(({ ok, data }) => {
        if (!ok) throw new Error(data.message);
        dispatch({ type: "clientes_remove", payload: id });
      }).catch(setError).finally(() => setLoading(false));
  };

  useEffect(() => {
    listarTodosLosClientes();
  }, []);

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">Lista de Clientes</h2>
        <div className="d-flex gap-2">
          <button className="btn btn-secondary" onClick={() => navigate(`/${tokenUtils.getRole(store.auth.token)}`)}>Volver</button>
          <button
            className="btn btn-primary"
            onClick={() => navigate('/agregar-cliente')}
          >
            <i className="fas fa-plus"></i> Agregar Cliente
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
              <h5 className="mb-0">Clientes Registrados</h5>
              <button className="btn btn-outline-primary" onClick={listarTodosLosClientes}>
                <i className="fas fa-refresh"></i> Actualizar Lista
              </button>
            </div>
            <div className="card-body">
              {Array.isArray(store.clientes) && store.clientes.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-striped">
                    <thead>
                      <tr>
                        <th>Nombre</th>
                        <th>Apellido</th>
                        <th>Email</th>
                        <th>Teléfono</th>
                        <th>Dirección</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {store.clientes.map((cliente) => (
                        <tr key={cliente.id}>
                          <td>{cliente.nombre}</td>
                          <td>{cliente.apellido}</td>
                          <td>{cliente.email}</td>
                          <td>{cliente.telefono}</td>
                          <td>{cliente.direccion}</td>
                          <td>
                            <div className="d-flex gap-2" role="group">
                              <button
                                className="btn btn-warning"
                                onClick={() => navigate(`/actualizar-cliente/${cliente.id}`)}
                                title="Actualizar Cliente"
                              >
                                <i className="fas fa-edit"></i>
                              </button>
                              <button
                                className="btn btn-info"
                                onClick={() => navigate(`/ver-cliente/${cliente.id}`)}
                                title="Ver Cliente"
                              >
                                <i className="fas fa-eye"></i>
                              </button>
                              <button
                                className="btn btn-danger"
                                onClick={() => eliminarCliente(cliente.id)}
                                title="Eliminar Cliente"
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
                  <p className="text-muted">No hay clientes registrados.</p>
                  <button className="btn btn-primary" onClick={listarTodosLosClientes}>
                    Cargar Clientes
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
