import React from 'react';

export function RecomendacionModal({ isOpen, onClose, recomendacion, loading, error }) {
    if (!isOpen) return null;

    const getNivelDificultadColor = (nivel) => {
        switch (nivel?.toLowerCase()) {
            case 'baja': return 'badge bg-success';
            case 'media': return 'badge bg-warning';
            case 'alta': return 'badge bg-danger';
            default: return 'badge bg-secondary';
        }
    };

    return (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-lg">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">
                            <i className="fas fa-robot me-2"></i>
                            Recomendación de IA
                        </h5>
                        <button
                            type="button"
                            className="btn-close"
                            onClick={onClose}
                            aria-label="Cerrar"
                        ></button>
                    </div>
                    <div className="modal-body">
                        {loading && (
                            <div className="text-center py-4">
                                <div className="spinner-border text-primary" role="status">
                                    <span className="visually-hidden">Generando recomendación...</span>
                                </div>
                                <p className="mt-2 text-muted">Generando recomendación con IA...</p>
                            </div>
                        )}

                        {error && (
                            <div className="alert alert-danger" role="alert">
                                <i className="fas fa-exclamation-triangle me-2"></i>
                                {error}
                            </div>
                        )}

                        {recomendacion && !loading && !error && (
                            <div>
                                {/* Diagnóstico */}
                                <div className="mb-4">
                                    <h6 className="text-primary">
                                        <i className="fas fa-search me-2"></i>
                                        Diagnóstico
                                    </h6>
                                    <p className="text-muted">{recomendacion.diagnostico}</p>
                                </div>

                                {/* Pasos de Solución */}
                                <div className="mb-4">
                                    <h6 className="text-primary">
                                        <i className="fas fa-list-ol me-2"></i>
                                        Pasos de Solución
                                    </h6>
                                    <ol className="list-group list-group-numbered">
                                        {recomendacion.pasos_solucion?.map((paso, index) => (
                                            <li key={index} className="list-group-item">
                                                {paso}
                                            </li>
                                        ))}
                                    </ol>
                                </div>

                                {/* Información Adicional */}
                                <div className="row">
                                    <div className="col-md-6 mb-3">
                                        <h6 className="text-primary">
                                            <i className="fas fa-clock me-2"></i>
                                            Tiempo Estimado
                                        </h6>
                                        <p className="text-muted">{recomendacion.tiempo_estimado}</p>
                                    </div>
                                    <div className="col-md-6 mb-3">
                                        <h6 className="text-primary">
                                            <i className="fas fa-signal me-2"></i>
                                            Nivel de Dificultad
                                        </h6>
                                        <span className={getNivelDificultadColor(recomendacion.nivel_dificultad)}>
                                            {recomendacion.nivel_dificultad}
                                        </span>
                                    </div>
                                </div>

                                {/* Recursos Necesarios */}
                                <div className="mb-4">
                                    <h6 className="text-primary">
                                        <i className="fas fa-tools me-2"></i>
                                        Recursos Necesarios
                                    </h6>
                                    <ul className="list-group">
                                        {recomendacion.recursos_necesarios?.map((recurso, index) => (
                                            <li key={index} className="list-group-item d-flex align-items-center">
                                                <i className="fas fa-check-circle text-success me-2"></i>
                                                {recurso}
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {/* Recomendaciones Adicionales */}
                                {recomendacion.recomendaciones_adicionales && (
                                    <div className="mb-4">
                                        <h6 className="text-primary">
                                            <i className="fas fa-lightbulb me-2"></i>
                                            Recomendaciones Adicionales
                                        </h6>
                                        <div className="alert alert-info">
                                            <i className="fas fa-info-circle me-2"></i>
                                            {recomendacion.recomendaciones_adicionales}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    <div className="modal-footer">
                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={onClose}
                        >
                            <i className="fas fa-times me-2"></i>
                            Cerrar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default RecomendacionModal;
