import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import useGlobalReducer from "../hooks/useGlobalReducer";

export const AgregarComentarios = () => {
    const { store, dispatch } = useGlobalReducer();
    const navigate = useNavigate();
    const API = import.meta.env.VITE_BACKEND_URL + "/api";

    const [nuevoComentario, setNuevoComentario] = useState({
        id_gestion: "",
        id_cliente: "",
        id_analista: "",
        id_supervisor: "",
        texto: "",
        fecha_comentario: new Date().toISOString().split('T')[0] // Fecha actual por defecto
    });

    const setLoading = (v) => dispatch({ type: "api_loading", payload: v });
    const setError = (e) => dispatch({ type: "api_error", payload: e?.message || e });

    const fetchJson = (url, options = {}) =>
        fetch(url, options)
            .then(res => res.json().then(data => ({ ok: res.ok, data })))
            .catch(err => ({ ok: false, data: { message: err.message } }));

    const limpiarFormulario = () => {
        setNuevoComentario({
            id_gestion: "",
            id_cliente: "",
            id_analista: "",
            id_supervisor: "",
            texto: "",
            fecha_comentario: new Date().toISOString().split('T')[0]
        });
    };

    const crearComentario = () => {
         
        if (!nuevoComentario.id_gestion || !nuevoComentario.id_cliente || !nuevoComentario.id_analista || !nuevoComentario.id_supervisor || !nuevoComentario.texto) {
            setError("Los campos ID Gestión, ID Cliente, ID Analista, ID Supervisor y Texto son obligatorios");
            return;
        }

        // Convertir strings a números para los IDs mismo caso, luego seran foraneas y no se muestran
        const comentarioData = {
            ...nuevoComentario,
            id_gestion: parseInt(nuevoComentario.id_gestion),
            id_cliente: parseInt(nuevoComentario.id_cliente),
            id_analista: parseInt(nuevoComentario.id_analista),
            id_supervisor: parseInt(nuevoComentario.id_supervisor)
        };

        setLoading(true);
        fetchJson(`${API}/comentarios`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(comentarioData)
        }).then(({ ok, data }) => {
            if (!ok) throw new Error(data.message);
            dispatch({ type: "comentarios_add", payload: data });
            limpiarFormulario();
            navigate('/comentarios'); 
        }).catch(setError).finally(() => setLoading(false));
    };

    const cancelar = () => {
        navigate('/comentarios');
    };

    return (
        <div className="container py-4">
            <div className="row justify-content-center">
                <div className="col-12 col-md-8 col-lg-6">
                    <div className="card">
                        <div className="card-header">
                            <h4 className="mb-0">
                                <i className="fas fa-comment-plus me-2"></i>
                                Agregar Nuevo Comentario
                            </h4>
                        </div>
                        <div className="card-body">
                            {store.api.error && (
                                <div className="alert alert-danger py-2">{String(store.api.error)}</div>
                            )}
                            <form onSubmit={(e) => { e.preventDefault(); crearComentario(); }}>
                                <div className="row g-3">
                                    <div className="col-md-6">
                                        <label className="form-label">ID Gestión *</label>
                                        <input
                                            type="number"
                                            className="form-control"
                                            placeholder="Ingrese el ID de gestión"
                                            value={nuevoComentario.id_gestion}
                                            onChange={e => setNuevoComentario(s => ({ ...s, id_gestion: e.target.value }))}
                                            required
                                        />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label">ID Cliente *</label>
                                        <input
                                            type="number"
                                            className="form-control"
                                            placeholder="Ingrese el ID del cliente"
                                            value={nuevoComentario.id_cliente}
                                            onChange={e => setNuevoComentario(s => ({ ...s, id_cliente: e.target.value }))}
                                            required
                                        />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label">ID Analista *</label>
                                        <input
                                            type="number"
                                            className="form-control"
                                            placeholder="Ingrese el ID del analista"
                                            value={nuevoComentario.id_analista}
                                            onChange={e => setNuevoComentario(s => ({ ...s, id_analista: e.target.value }))}
                                            required
                                        />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label">ID Supervisor *</label>
                                        <input
                                            type="number"
                                            className="form-control"
                                            placeholder="Ingrese el ID del supervisor"
                                            value={nuevoComentario.id_supervisor}
                                            onChange={e => setNuevoComentario(s => ({ ...s, id_supervisor: e.target.value }))}
                                            required
                                        />
                                    </div>
                                    <div className="col-12">
                                        <label className="form-label">Texto del Comentario *</label>
                                        <textarea
                                            className="form-control"
                                            placeholder="Ingrese el texto del comentario"
                                            value={nuevoComentario.texto}
                                            onChange={e => setNuevoComentario(s => ({ ...s, texto: e.target.value }))}
                                            rows="4"
                                            required
                                        />
                                    </div>
                                    <div className="col-12">
                                        <label className="form-label">Fecha del Comentario</label>
                                        <input
                                            type="date"
                                            className="form-control"
                                            value={nuevoComentario.fecha_comentario}
                                            onChange={e => setNuevoComentario(s => ({ ...s, fecha_comentario: e.target.value }))}
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
                                        {store.api.loading ? 'Guardando...' : 'Guardar Comentario'}
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
