import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import useGlobalReducer from "../hooks/useGlobalReducer";

export const ActualizarCliente = () => {
    const { store, dispatch } = useGlobalReducer();
    const navigate = useNavigate();
    const { id } = useParams();
    const API = import.meta.env.VITE_BACKEND_URL + "/api";

    const [cliente, setCliente] = useState({
        nombre: "",
        apellido: "",
        email: "",
        contraseña_hash: "",
        direccion: "",
        telefono: ""
    });

    const setLoading = (v) => dispatch({ type: "api_loading", payload: v });
    const setError = (e) => dispatch({ type: "api_error", payload: e?.message || e });

    const fetchJson = (url, options = {}) =>
        fetch(url, options)
            .then(res => res.json().then(data => ({ ok: res.ok, data })))
            .catch(err => ({ ok: false, data: { message: err.message } }));

    const cargarCliente = () => {
        setLoading(true);
        fetchJson(`${API}/clientes/${id}`)
            .then(({ ok, data }) => {
                if (!ok) throw new Error(data.message);
                setCliente({
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
        // Validación básica
        if (!cliente.nombre || !cliente.apellido || !cliente.email) {
            setError("Los campos nombre, apellido y email son obligatorios");
            return;
        }

        setLoading(true);
        fetchJson(`${API}/clientes/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(cliente)
        }).then(({ ok, data }) => {
            if (!ok) throw new Error(data.message);
            dispatch({ type: "clientes_upsert", payload: data });
            navigate('/clientes'); // Volver al home después de actualizar
        }).catch(setError).finally(() => setLoading(false));
    };

    const cancelar = () => {
        navigate('/clientes');
    };

    useEffect(() => {
        if (id) {
            cargarCliente();
        }
    }, [id]);

    return (
        <div className="container py-4">
            <div className="row justify-content-center">
                <div className="col-12 col-md-8 col-lg-6">
                    <div className="card">
                        <div className="card-header">
                            <h4 className="mb-0">
                                <i className="fas fa-user-edit me-2"></i>
                                Actualizar Cliente
                            </h4>
                        </div>
                        <div className="card-body">
                            {store.api.error && (
                                <div className="alert alert-danger py-2">{String(store.api.error)}</div>
                            )}

                            <form onSubmit={(e) => { e.preventDefault(); actualizarCliente(); }}>
                                <div className="row g-3">
                                    <div className="col-md-6">
                                        <label className="form-label">Nombre *</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="Ingrese el nombre"
                                            value={cliente.nombre}
                                            onChange={e => setCliente(s => ({ ...s, nombre: e.target.value }))}
                                            required
                                        />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label">Apellido *</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="Ingrese el apellido"
                                            value={cliente.apellido}
                                            onChange={e => setCliente(s => ({ ...s, apellido: e.target.value }))}
                                            required
                                        />
                                    </div>
                                    <div className="col-12">
                                        <label className="form-label">Email *</label>
                                        <input
                                            type="email"
                                            className="form-control"
                                            placeholder="Ingrese el email"
                                            value={cliente.email}
                                            onChange={e => setCliente(s => ({ ...s, email: e.target.value }))}
                                            required
                                        />
                                    </div>
                                    <div className="col-12">
                                        <label className="form-label">Contraseña</label>
                                        <input
                                            type="password"
                                            className="form-control"
                                            placeholder="Ingrese la nueva contraseña (dejar vacío para mantener la actual)"
                                            value={cliente.contraseña_hash}
                                            onChange={e => setCliente(s => ({ ...s, contraseña_hash: e.target.value }))}
                                        />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label">Teléfono</label>
                                        <input
                                            type="tel"
                                            className="form-control"
                                            placeholder="Ingrese el teléfono"
                                            value={cliente.telefono}
                                            onChange={e => setCliente(s => ({ ...s, telefono: e.target.value }))}
                                        />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label">Dirección</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="Ingrese la dirección"
                                            value={cliente.direccion}
                                            onChange={e => setCliente(s => ({ ...s, direccion: e.target.value }))}
                                        />
                                    </div>
                                </div>

                                <div className="d-flex gap-2 mt-4 justify-content-end">
                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={cancelar}
                                        disabled={store.api.loading}
                                    >
                                        <i className="fas fa-times me-1"></i>
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn btn-warning"
                                        disabled={store.api.loading}
                                    >
                                        <i className="fas fa-save me-1"></i>
                                        {store.api.loading ? 'Actualizando...' : 'Actualizar Cliente'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

