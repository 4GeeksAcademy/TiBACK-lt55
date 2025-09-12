import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import useGlobalReducer from "../hooks/useGlobalReducer";

export const ActualizarAsignacion = () => {
    const { store, dispatch } = useGlobalReducer();
    const navigate = useNavigate();
    const { id } = useParams();
    const API = import.meta.env.VITE_BACKEND_URL + "/api";

    const [asignacion, setAsignacion] = useState({
        id_ticket: "",
        id_supervisor: "",
        id_analista: "",
        fecha_asignacion: ""
    });

    const setLoading = (v) => dispatch({ type: "api_loading", payload: v });
    const setError = (e) => dispatch({ type: "api_error", payload: e?.message || e });

    const fetchJson = (url, options = {}) =>
        fetch(url, options)
            .then(res => res.json().then(data => ({ ok: res.ok, data })))
            .catch(err => ({ ok: false, data: { message: err.message } }));

    const cargarAsignacion = () => {
        setLoading(true);
        fetchJson(`${API}/asignaciones/${id}`)
            .then(({ ok, data }) => {
                if (!ok) throw new Error(data.message);
                setAsignacion({
                    id_ticket: data.id_ticket.toString(),
                    id_supervisor: data.id_supervisor.toString(),
                    id_analista: data.id_analista.toString(),
                    fecha_asignacion: data.fecha_asignacion
                });
            }).catch(setError).finally(() => setLoading(false));
    };

    const actualizarAsignacion = () => {
        
        if (!asignacion.id_ticket || !asignacion.id_supervisor || !asignacion.id_analista) {
            setError("Los campos ID Ticket, ID Supervisor e ID Analista son obligatorios");
            return;
        }

        
        const asignacionData = {
            ...asignacion,
            id_ticket: parseInt(asignacion.id_ticket),
            id_supervisor: parseInt(asignacion.id_supervisor),
            id_analista: parseInt(asignacion.id_analista)
        };

        setLoading(true);
        fetchJson(`${API}/asignaciones/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(asignacionData)
        }).then(({ ok, data }) => {
            if (!ok) throw new Error(data.message);
            dispatch({ type: "asignaciones_upsert", payload: data });
            navigate('/asignaciones'); // Volver a la lista de asignaciones
        }).catch(setError).finally(() => setLoading(false));
    };

    const cancelar = () => {
        navigate('/asignaciones');
    };

    useEffect(() => {
        if (id) {
            cargarAsignacion();
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
                                Actualizar Asignación
                            </h4>
                        </div>
                        <div className="card-body">
                            {store.api.error && (
                                <div className="alert alert-danger py-2">{String(store.api.error)}</div>
                            )}

                            <form onSubmit={(e) => { e.preventDefault(); actualizarAsignacion(); }}>
                                <div className="row g-3">
                                    <div className="col-md-6">
                                        <label className="form-label">ID Ticket *</label>
                                        <input
                                            type="number"
                                            className="form-control"
                                            placeholder="Ingrese el ID del ticket"
                                            value={asignacion.id_ticket}
                                            onChange={e => setAsignacion(s => ({ ...s, id_ticket: e.target.value }))}
                                            required
                                        />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label">ID Supervisor *</label>
                                        <input
                                            type="number"
                                            className="form-control"
                                            placeholder="Ingrese el ID del supervisor"
                                            value={asignacion.id_supervisor}
                                            onChange={e => setAsignacion(s => ({ ...s, id_supervisor: e.target.value }))}
                                            required
                                        />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label">ID Analista *</label>
                                        <input
                                            type="number"
                                            className="form-control"
                                            placeholder="Ingrese el ID del analista"
                                            value={asignacion.id_analista}
                                            onChange={e => setAsignacion(s => ({ ...s, id_analista: e.target.value }))}
                                            required
                                        />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label">Fecha de Asignación</label>
                                        <input
                                            type="date"
                                            className="form-control"
                                            value={asignacion.fecha_asignacion}
                                            onChange={e => setAsignacion(s => ({ ...s, fecha_asignacion: e.target.value }))}
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
                                        {store.api.loading ? 'Actualizando...' : 'Actualizar Asignación'}
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
