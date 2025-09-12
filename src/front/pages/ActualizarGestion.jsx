import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import useGlobalReducer from "../hooks/useGlobalReducer";

export const ActualizarGestion = () => {
    const { store, dispatch } = useGlobalReducer();
    const navigate = useNavigate();
    const { id } = useParams();
    const API = import.meta.env.VITE_BACKEND_URL + "/api";

    const [gestion, setGestion] = useState({
        id_ticket: "",
        fecha_cambio: "",
        Nota_de_caso: "",
    });

    const setLoading = (v) => dispatch({ type: "api_loading", payload: v });
    const setError = (e) => dispatch({ type: "api_error", payload: e?.message || e });

    const fetchJson = (url, options = {}) =>
        fetch(url, options)
            .then(res => res.json().then(data => ({ ok: res.ok, data })))
            .catch(err => ({ ok: false, data: { message: err.message } }));

    const cargarGestion = () => {
        setLoading(true);
        fetchJson(`${API}/gestiones/${id}`)
            .then(({ ok, data }) => {
                if (!ok) throw new Error(data.message);
                setGestion({
                    id_ticket: data.id_ticket,
                    fecha_cambio: data.fecha_cambio,
                    Nota_de_caso: data.Nota_de_caso,
                });
            }).catch(setError).finally(() => setLoading(false));
    };

    const actualizarGestion = () => {
        // Validación básica
        if (!gestion.id_ticket || !gestion.fecha_cambio || !gestion.Nota_de_caso) {
            setError("Los campos Ticket, Fecha de cambio y la nota del caso son obligatorios");
            return;
        }

        setLoading(true);
        fetchJson(`${API}/gestiones/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(gestion)
        }).then(({ ok, data }) => {
            if (!ok) throw new Error(data.message);
            dispatch({ type: "gestiones_upsert", payload: data });
            navigate('/gestiones'); // Volver al home después de actualizar
        }).catch(setError).finally(() => setLoading(false));
    };

    const cancelar = () => {
        navigate('/gestiones');
    };

    useEffect(() => {
        if (id) {
            cargarGestion();
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
                                Actualizar Gestión
                            </h4>
                        </div>
                        <div className="card-body">
                            {store.api.error && (
                                <div className="alert alert-danger py-2">{String(store.api.error)}</div>
                            )}
                          
                            <form onSubmit={(e) => { e.preventDefault(); actualizarGestion(); }}>
                                <div className="row g-3">
                                    <div className="col-md-6">
                                        <label className="form-label">Ticket *</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="Ingrese el ticket a actualizar"
                                            value={gestion.id_ticket}
                                            onChange={e => setGestion(s => ({ ...s, id_ticket: e.target.value }))}
                                            required
                                        />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label">Fecha del cambio *</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="Ingrese la fecha del cambio"
                                            value={gestion.fecha_cambio}
                                            onChange={e => setGestion(s => ({ ...s, fecha_cambio: e.target.value }))}
                                            required
                                        />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label">Nota del caso *</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="Ingrese la nota del caso"
                                            value={gestion.Nota_de_caso}
                                            onChange={e => setGestion(s => ({ ...s, Nota_de_caso: e.target.value }))}
                                            required
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
                                        {store.api.loading ? 'Actualizando...' : 'Actualizar Gestión'}
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
