import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import useGlobalReducer from "../hooks/useGlobalReducer";

export const AgregarAsignacion = () => {
    const { store, dispatch } = useGlobalReducer();
    const navigate = useNavigate();
    const API = import.meta.env.VITE_BACKEND_URL + "/api";

    const [nuevaAsignacion, setNuevaAsignacion] = useState({
        id_ticket: "",
        id_supervisor: "",
        id_analista: "",
        fecha_asignacion: new Date().toISOString().split('T')[0] // Fecha actual por defecto
    });

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

    const limpiarFormulario = () => {
        setNuevaAsignacion({
            id_ticket: "",
            id_supervisor: "",
            id_analista: "",
            fecha_asignacion: new Date().toISOString().split('T')[0]
        });
    };

    const crearAsignacion = () => {
        // Validación básica
        if (!nuevaAsignacion.id_ticket || !nuevaAsignacion.id_supervisor || !nuevaAsignacion.id_analista) {
            setError("Los campos ID Ticket, ID Supervisor e ID Analista son obligatorios");
            return;
        }
 
        const asignacionData = {
            ...nuevaAsignacion,
            id_ticket: parseInt(nuevaAsignacion.id_ticket),
            id_supervisor: parseInt(nuevaAsignacion.id_supervisor),
            id_analista: parseInt(nuevaAsignacion.id_analista)
        };

        setLoading(true);
        fetchJson(`${API}/asignaciones`, {
            method: "POST",
            body: JSON.stringify(asignacionData)
        }).then(({ ok, data }) => {
            if (!ok) throw new Error(data.message);
            dispatch({ type: "asignaciones_add", payload: data });
            limpiarFormulario();
            navigate('/asignaciones'); // Volver a la lista de asignaciones
        }).catch(setError).finally(() => setLoading(false));
    };

    const cancelar = () => {
        navigate('/asignaciones');
    };

    return (
        <div className="container py-4">
            <div className="row justify-content-center">
                <div className="col-12 col-md-8 col-lg-6">
                    <div className="card">
                        <div className="card-header">
                            <h4 className="mb-0">
                                <i className="fas fa-user-plus me-2"></i>
                                Agregar Nueva Asignación
                            </h4>
                        </div>
                        <div className="card-body">
                            {store.api.error && (
                                <div className="alert alert-danger py-2">{String(store.api.error)}</div>
                            )}
                            <form onSubmit={(e) => { e.preventDefault(); crearAsignacion(); }}>
                                <div className="row g-3">
                                    <div className="col-md-6">
                                        <label className="form-label">ID Ticket *</label>
                                        <input
                                            type="number"
                                            className="form-control"
                                            placeholder="Ingrese el ID del ticket"
                                            value={nuevaAsignacion.id_ticket}
                                            onChange={e => setNuevaAsignacion(s => ({ ...s, id_ticket: e.target.value }))}
                                            required
                                        />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label">ID Supervisor *</label>
                                        <input
                                            type="number"
                                            className="form-control"
                                            placeholder="Ingrese el ID del supervisor"
                                            value={nuevaAsignacion.id_supervisor}
                                            onChange={e => setNuevaAsignacion(s => ({ ...s, id_supervisor: e.target.value }))}
                                            required
                                        />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label">ID Analista *</label>
                                        <input
                                            type="number"
                                            className="form-control"
                                            placeholder="Ingrese el ID del analista"
                                            value={nuevaAsignacion.id_analista}
                                            onChange={e => setNuevaAsignacion(s => ({ ...s, id_analista: e.target.value }))}
                                            required
                                        />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label">Fecha de Asignación</label>
                                        <input
                                            type="date"
                                            className="form-control"
                                            value={nuevaAsignacion.fecha_asignacion}
                                            onChange={e => setNuevaAsignacion(s => ({ ...s, fecha_asignacion: e.target.value }))}
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
                                        className="btn btn-primary"
                                        disabled={store.api.loading}
                                    >
                                        <i className="fas fa-save me-1"></i>
                                        {store.api.loading ? 'Guardando...' : 'Guardar Asignación'}
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