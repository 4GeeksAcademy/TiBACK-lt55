import React, { useState } from "react";
import useGlobalReducer from "../hooks/useGlobalReducer";

export const Clientes = () => {
  const [mostrarStore, setMostrarStore] = useState(false);
  const { store, dispatch } = useGlobalReducer();
  const API = import.meta.env.VITE_BACKEND_URL + "/api";

  const [nuevoCliente, setNuevoCliente] = useState({
    nombre: "", apellido: "", email: "", contraseña_hash: "",
    direccion: "", telefono: ""
  });
  const [clienteId, setClienteId] = useState("");

  const setLoading = (v) => dispatch({ type: "api_loading", payload: v });
  const setError = (e) => dispatch({ type: "api_error", payload: e?.message || e });

  const fetchJson = (url, options = {}) =>
    fetch(url, options)
      .then(res => res.json().then(data => ({ ok: res.ok, data })))
      .catch(err => ({ ok: false, data: { message: err.message } }));

  const limpiarFormulario = () => {
    setNuevoCliente({
      nombre: "", apellido: "", email: "", contraseña_hash: "",
      direccion: "", telefono: ""
    });
    setClienteId("");
    dispatch({ type: "cliente_clear_detail" });
  };

  const crearCliente = () => {
    setLoading(true);
    fetchJson(`${API}/clientes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(nuevoCliente)
    }).then(({ ok, data }) => {
      if (!ok) throw new Error(data.message);
      dispatch({ type: "clientes_add", payload: data });
      limpiarFormulario();
    }).catch(setError).finally(() => setLoading(false));
  };

  const obtenerCliente = () => {
    setLoading(true);
    fetchJson(`${API}/clientes/${clienteId}`)
      .then(({ ok, data }) => {
        if (!ok) throw new Error(data.message);
        dispatch({ type: "cliente_set_detail", payload: data });
        setNuevoCliente({
          nombre: data.nombre,
          apellido: data.apellido,
          email: data.email,
          contraseña_hash: data.contraseña_hash || "",
          direccion: data.direccion,
          telefono: data.telefono
        });
      }).catch(setError).finally(() => setLoading(false));
  };

  const actualizarCliente = () => {
    setLoading(true);
    fetchJson(`${API}/clientes/${clienteId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(nuevoCliente)
    }).then(({ ok, data }) => {
      if (!ok) throw new Error(data.message);
      dispatch({ type: "cliente_set_detail", payload: data });
      dispatch({ type: "clientes_upsert", payload: data });
      limpiarFormulario();
    }).catch(setError).finally(() => setLoading(false));
  };

  const eliminarCliente = () => {
    setLoading(true);
    fetchJson(`${API}/clientes/${clienteId}`, { method: "DELETE" })
      .then(({ ok, data }) => {
        if (!ok) throw new Error(data.message);
        dispatch({ type: "clientes_remove", payload: parseInt(clienteId) });
        limpiarFormulario();
      }).catch(setError).finally(() => setLoading(false));
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

  return (
    <div className="container py-4">
      <h2 className="mb-3">Gestión de Clientes</h2>

      {store.api.error && (
        <div className="alert alert-danger py-2">{String(store.api.error)}</div>
      )}
      {store.api.loading && (
        <div className="alert alert-info py-2">Cargando...</div>
      )}

      <div className="row">
        <div className="col-12 col-lg-8 mx-auto">
          <div className="card mb-4">
            <div className="card-header">
              <h5 className="mb-0">Operaciones de Cliente</h5>
            </div>
            <div className="card-body">
              <div className="row g-3">
                {["nombre", "apellido", "email", "contraseña_hash", "direccion", "telefono"].map((field, i) => (
                  <div key={i} className={`col-${field === "direccion" ? "12" : "6"}`}>
                    <label className="form-label">{field.charAt(0).toUpperCase() + field.slice(1)}</label>
                    <input
                      className="form-control"
                      placeholder={`Ingrese ${field}`}
                      value={nuevoCliente[field]}
                      onChange={e => setNuevoCliente(s => ({ ...s, [field]: e.target.value }))}
                    />
                  </div>
                ))}
              </div>

              <div className="d-flex gap-2 mt-4 flex-wrap">
                <button className="btn btn-primary" onClick={crearCliente}>
                  <i className="fas fa-plus"></i> Crear Cliente
                </button>
                <input
                  className="form-control w-auto"
                  placeholder="ID del cliente"
                  value={clienteId}
                  onChange={e => setClienteId(e.target.value)}
                />
                <button className="btn btn-outline-secondary" onClick={obtenerCliente}>
                  <i className="fas fa-search"></i> Buscar
                </button>
                <button className="btn btn-warning" onClick={actualizarCliente}>
                  <i className="fas fa-edit"></i> Actualizar
                </button>
                <button className="btn btn-danger" onClick={eliminarCliente}>
                  <i className="fas fa-trash"></i> Eliminar
                </button>
                <button className="btn btn-outline-info" onClick={limpiarFormulario}>
                  <i className="fas fa-eraser"></i> Limpiar
                </button>
              </div>

              {store.clienteDetail && (
                <div className="alert alert-info mt-3">
                  <h6>Detalle del Cliente:</h6>
                  <pre className="small m-0">{JSON.stringify(store.clienteDetail, null, 2)}</pre>
                </div>
              )}
            </div>
          </div>

    
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Lista de Clientes</h5>
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
                        <th>ID</th>
                        <th>Nombre</th>
                        <th>Apellido</th>
                        <th>Email</th>
                        <th>Teléfono</th>
                        <th>Dirección</th>
                      </tr>
                    </thead>
                    <tbody>
                      {store.clientes.map((cliente) => (
                        <tr key={cliente.id}>
                          <td>{cliente.id}</td>
                          <td>{cliente.nombre}</td>
                          <td>{cliente.apellido}</td>
                          <td>{cliente.email}</td>
                          <td>{cliente.telefono}</td>
                          <td>{cliente.direccion}</td>
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

         
          <div className="card mt-3">
            <div className="card-header d-flex justify-content-between align-items-center">
              <span>Estado del Store</span>
              <button className="btn btn-sm btn-outline-secondary" onClick={() => setMostrarStore(s => !s)}>
                {mostrarStore ? "Ocultar" : "Mostrar"}
              </button>
            </div>
            {mostrarStore && (
              <div className="card-body">
                <pre className="small m-0">{JSON.stringify(store, null, 2)}</pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
