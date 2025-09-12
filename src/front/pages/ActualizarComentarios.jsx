import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import useGlobalReducer from "../hooks/useGlobalReducer";

export const ActualizarComentarios = () => {
    const { store, dispatch } = useGlobalReducer();
    const navigate = useNavigate();
    const { id } = useParams();
    const API = import.meta.env.VITE_BACKEND_URL + "/api";

    const [comentario, setComentario] = useState({
        id_gestion: "",
        id_cliente: "",
        id_analista: "",
        id_supervisor: "",
        texto: "",
        fecha_comentario: ""
    });

    const setLoading = (v) => dispatch({ type: "api_loading", payload: v });
    const setError = (e) => dispatch({ type: "api_error", payload: e?.message || e });

    const fetchJson = (url, options = {}) =>
        fetch(url, options)
            .then(res => res.json().then(data => ({ ok: res.ok, data })))
            .catch(err => ({ ok: false, data: { message: err.message } }));

    const cargarComentario = () => {
        setLoading(true);
        fetchJson(`${API}/comentarios/${id}`)
            .then(({ ok, data }) => {
                if (!ok) throw new Error(data.message);
                setComentario({
                    id_gestion: data.id_gestion.toString(),
                    id_cliente: data.id_cliente.toString(),
                    id_analista: data.id_analista.toString(),
                    id_supervisor: data.id_supervisor.toString(),
                    texto: data.texto,
                    fecha_comentario: data.fecha_comentario
                });
            }).catch(setError).finally(() => setLoading(false));
    };

    const actualizarComentario = () => {

        if (!comentario.id_gestion || !comentario.id_cliente || !comentario.id_analista || !comentario.id_supervisor || !comentario.texto) {
            setError("Los campos ID Gestión, ID Cliente, ID Analista, ID Supervisor y Texto son obligatorios");
            return;
        }

        // Convertir strings a números para los IDs por ahora ya que 3 de ellos son Llaves Foraneas
        const comentarioData = {
            ...comentario,
            id_gestion: parseInt(comentario.id_gestion),
            id_cliente: parseInt(comentario.id_cliente),
            id_analista: parseInt(comentario.id_analista),
            id_supervisor: parseInt(comentario.id_supervisor)
        };

        setLoading(true);
        fetchJson(`${API}/comentarios/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(comentarioData)
        }).then(({ ok, data }) => {
            if (!ok) throw new Error(data.message);
            dispatch({ type: "comentarios_upsert", payload: data });
            navigate('/comentarios'); // Volver al home
        }).catch(setError).finally(() => setLoading(false));
    };

    //Cancelar puede apuntar a home o a comentarios para futuros casos 
    const cancelar = () => {
        navigate('/comentarios');
    };

    useEffect(() => {
        if (id) {
            cargarComentario();
        }
    }, [id]);

    return (
        <div className="container py-4">
            <div className="row justify-content-center">
                <div className="col-12 col-md-8 col-lg-6">
                    <div className="card">
                        <div className="card-header">
                            <h4 className="mb-0">
                                <i className="fas fa-comment-edit me-2"></i>
                                Actualizar Comentario
                            </h4>
                        </div>
                        <div className="card-body">
                            {store.api.error && (
                                <div className="alert alert-danger py-2">{String(store.api.error)}</div>
                            )}
                            <form onSubmit={(e) => { e.preventDefault(); actualizarComentario(); }}>
                                <div className="row g-3">
                                    <div className="col-md-6">
                                        <label className="form-label">ID Gestión *</label>
                                        <input
                                            type="number"
                                            className="form-control"
                                            placeholder="Ingrese el ID de gestión"
                                            value={comentario.id_gestion}
                                            onChange={e => setComentario(s => ({ ...s, id_gestion: e.target.value }))}
                                            required
                                        />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label">ID Cliente *</label>
                                        <input
                                            type="number"
                                            className="form-control"
                                            placeholder="Ingrese el ID del cliente"
                                            value={comentario.id_cliente}
                                            onChange={e => setComentario(s => ({ ...s, id_cliente: e.target.value }))}
                                            required
                                        />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label">ID Analista *</label>
                                        <input
                                            type="number"
                                            className="form-control"
                                            placeholder="Ingrese el ID del analista"
                                            value={comentario.id_analista}
                                            onChange={e => setComentario(s => ({ ...s, id_analista: e.target.value }))}
                                            required
                                        />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label">ID Supervisor *</label>
                                        <input
                                            type="number"
                                            className="form-control"
                                            placeholder="Ingrese el ID del supervisor"
                                            value={comentario.id_supervisor}
                                            onChange={e => setComentario(s => ({ ...s, id_supervisor: e.target.value }))}
                                            required
                                        />
                                    </div>
                                    <div className="col-12">
                                        <label className="form-label">Texto del Comentario *</label>
                                        <textarea
                                            className="form-control"
                                            placeholder="Ingrese el texto del comentario"
                                            value={comentario.texto}
                                            onChange={e => setComentario(s => ({ ...s, texto: e.target.value }))}
                                            rows="4"
                                            required
                                        />
                                    </div>
                                    <div className="col-12">
                                        <label className="form-label">Fecha del Comentario</label>
                                        <input
                                            type="date"
                                            className="form-control"
                                            value={comentario.fecha_comentario}
                                            onChange={e => setComentario(s => ({ ...s, fecha_comentario: e.target.value }))}
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
                                        {store.api.loading ? 'Actualizando...' : 'Actualizar Comentario'}
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
