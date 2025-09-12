import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import useGlobalReducer from "../hooks/useGlobalReducer";

export const AgregarGestion = () => {
    const { store, dispatch } = useGlobalReducer();
    const navigate = useNavigate();
    const API = import.meta.env.VITE_BACKEND_URL + "/api";

    const [nuevaGestion, setNuevaGestion] = useState({
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

    const limpiarFormulario = () => {
        setNuevaGestion({
            id_ticket: "",
            fecha_cambio: "",
            Nota_de_caso: "",
        });
    };

    const crearGestion = () => {
        // Validación básica
        if (!nuevaGestion.id_ticket || !nuevaGestion.fecha_cambio || !nuevaGestion.Nota_de_caso) {
            setError("Los campos Ticket, Fecha de cambio y la nota del caso son obligatorios");
            return;
        }

        setLoading(true);
        fetchJson(`${API}/gestiones`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(nuevaGestion)
        }).then(({ ok, data }) => {
            if (!ok) throw new Error(data.message);
            dispatch({ type: "gestiones_add", payload: data });
            limpiarFormulario();
            navigate('/gestiones'); // Volver al home después de crear
        }).catch(setError).finally(() => setLoading(false));
    };

    const cancelar = () => {
        navigate('/gestiones');
    };

    return (
        <div className="container py-4">
            <div className="row justify-content-center">
                <div className="col-12 col-md-8 col-lg-6">
                    <div className="card">
                        <div className="card-header">
                            <h4 className="mb-0">
                                <i className="fas fa-user-plus me-2"></i>
                                Agregar Nueva Gestión
                            </h4>
                        </div>
                        <div className="card-body">
                            {store.api.error && (
                                <div className="alert alert-danger py-2">{String(store.api.error)}</div>
                            )}
                            {store.api.loading && (
                                <div className="alert alert-info py-2">Guardando Gestion...</div>
                            )}

                            <form onSubmit={(e) => { e.preventDefault(); crearGestion(); }}>
                                <div className="row g-3">
                                    <div className="col-md-6">
                                        <label className="form-label">Ticket *</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="Ingrese el ticket"
                                            value={nuevaGestion.id_ticket}
                                            onChange={e => setNuevaGestion(s => ({ ...s, id_ticket: e.target.value }))}
                                            required
                                        />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label">Fecha *</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="Ingrese la fecha de emisión del cambio de la fecha"
                                            value={nuevaGestion.fecha_cambio}
                                            onChange={e => setNuevaGestion(s => ({ ...s, fecha_cambio: e.target.value }))}
                                            required
                                        />
                                    </div>
                                    <div className="col-12">
                                        <label className="form-label">Nota del caso *</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="Ingrese una nota para el caso"
                                            value={nuevaGestion.Nota_de_caso}
                                            onChange={e => setNuevaGestion(s => ({ ...s, Nota_de_caso: e.target.value }))}
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
                                        className="btn btn-primary"
                                        disabled={store.api.loading}
                                    >
                                        <i className="fas fa-save me-1"></i>
                                        {store.api.loading ? 'Guardando...' : 'Guardar Gestión'}
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
