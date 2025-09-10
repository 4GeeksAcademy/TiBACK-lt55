import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import useGlobalReducer from "../hooks/useGlobalReducer";

export const VerCliente = () => {
    const { store, dispatch } = useGlobalReducer();
    const navigate = useNavigate();
    const { id } = useParams();
    const API = import.meta.env.VITE_BACKEND_URL + "/api";

    const [cliente, setCliente] = useState(null);

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
                setCliente(data);
            }).catch(setError).finally(() => setLoading(false));
    };

    const eliminarCliente = () => {
        if (!window.confirm("¿Estás seguro de que quieres eliminar este cliente?")) return;

        setLoading(true);
        fetchJson(`${API}/clientes/${id}`, { method: "DELETE" })
            .then(({ ok, data }) => {
                if (!ok) throw new Error(data.message);
                dispatch({ type: "clientes_remove", payload: parseInt(id) });
                navigate('/'); // Volver al home después de eliminar
            }).catch(setError).finally(() => setLoading(false));
    };

    const volver = () => {
        navigate('/');
    };

    const editar = () => {
        navigate(`/actualizar-cliente/${id}`);
    };

    useEffect(() => {
        if (id) {
            cargarCliente();
        }
    }, [id]);

    if (!cliente && !store.api.loading) {
        return (
            <div className="container py-4">
                <div className="row justify-content-center">
                    <div className="col-12 col-md-8 col-lg-6">
                        <div className="card">
                            <div className="card-body text-center">
                                <h5>Cliente no encontrado</h5>
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
                                Detalles del Cliente
                            </h4>
                        </div>
                        <div className="card-body">
                            {store.api.error && (
                                <div className="alert alert-danger py-2">{String(store.api.error)}</div>
                            )}
                            {store.api.loading && (
                                <div className="alert alert-info py-2">Cargando cliente...</div>
                            )}

                            {cliente && (
                                <div className="row g-3">
                                    <div className="col-md-6">
                                        <label className="form-label fw-bold">Nombre:</label>
                                        <p className="form-control-plaintext">{cliente.nombre}</p>
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label fw-bold">Apellido:</label>
                                        <p className="form-control-plaintext">{cliente.apellido}</p>
                                    </div>
                                    <div className="col-12">
                                        <label className="form-label fw-bold">Email:</label>
                                        <p className="form-control-plaintext">
                                            
                                                {cliente.email}
                                             
                                        </p>
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label fw-bold">Teléfono:</label>
                                        <p className="form-control-plaintext">    
                                                    {cliente.telefono}
                                        </p>
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label fw-bold">Dirección:</label>
                                        <p className="form-control-plaintext">
                                            {cliente.direccion || <span className="text-muted">No especificada</span>}
                                        </p>
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
                                        onClick={eliminarCliente}
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
