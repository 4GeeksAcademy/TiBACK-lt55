
import React from "react";
import { useNavigate } from "react-router-dom";

export const FeatureAppsPage = () => {
  const navigate = useNavigate();

   const goToDesign = () => {
        navigate("/"); // vuelve a la raíz
        setTimeout(() => {
            const feature = document.getElementById("feature");
            if (feature) {
                feature.scrollIntoView({ behavior: "smooth" });
            }
        }, 300); // da tiempo a que la raíz cargue
    };

  return (
    <div className="container py-5">

      <a className="btn btn-link text-blue-50" onClick={goToDesign}>← Volver al panel de características</a>

      {/* Título principal */}
      <div className="text-center mb-4">
        <h2 className="fw-bold text-dark">Aplicaciones Integradas de Supervisión y Administración</h2>
        <p className="text-muted mt-2 fs-5">
          TiBACK centraliza las operaciones del equipo de soporte con herramientas diseñadas
          para el analista, la Supervisor y el administrador general del sistema.
        </p>
      </div>

      {/* Contenido principal */}
      <div className="row align-items-center mt-5">
        <div className="col-md-6">
          <h4 className="fw-semibold mb-3 text-primary">Gestión jerárquica y control total</h4>
          <p className="text-muted">
            Desde la recepción de solicitudes hasta la supervisión de métricas, las aplicaciones
            integradas de TiBACK aseguran que cada nivel tenga visibilidad y control de sus funciones.
          </p>

          <ul className="list-unstyled text-muted mt-4">
            <li>
              <strong>Analista:</strong> Gestiona solicitudes, clasifica incidencias y actualiza el estado de los tickets.
            </li>
            <li>
              <strong>Supervisor:</strong> Supervisa rendimiento, asigna prioridades y genera reportes de cumplimiento.
            </li>
            <li>
              <strong>Administrador:</strong> Configura roles, gestiona usuarios y mantiene la integridad del sistema.
            </li>
          </ul>
        </div>

        <div className="col-md-6 text-center">
          <img
            src="https://res.cloudinary.com/mystoreimg/image/upload/v1759730939/vhtugercpvzl9leijvag.jpg"
            alt="Panel de control administrativo"
            className="img-fluid rounded shadow-lg border border-light"
            style={{ maxHeight: "450px", objectFit: "cover" }}
          />
        </div>
      </div>

      {/* Contexto extendido */}
      <div className="mt-5 pt-4 border-top">
        <h4 className="fw-semibold text-dark">Supervisión en tiempo real</h4>
        <p className="text-muted">
          La Supervisor cuenta con vistas dinámicas que muestran el avance de cada caso,
          mientras que el administrador tiene acceso total a estadísticas, control de usuarios
          y configuración del sistema.
        </p>

        <p className="text-muted">
          Todo el ecosistema está diseñado bajo principios de seguridad, escalabilidad
          y control, garantizando la trazabilidad de las acciones en todo el flujo operativo.
        </p>

        <div className="alert alert-light border-start border-3 border-success mt-4 shadow-sm">
          <p className="mb-0">
            <strong>Tip profesional:</strong> aprovecha los paneles de supervisión para detectar patrones,
            mejorar los tiempos de respuesta y fortalecer la comunicación interna del equipo de soporte.
          </p>
        </div>
      </div>
    </div>
  );
};

            