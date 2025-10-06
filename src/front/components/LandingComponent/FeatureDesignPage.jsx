import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export const FeatureDesignPage = () => {
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

      <div className="text-center mb-4">
        <h2 className="fw-bold text-dark">Diseño del Módulo de Soporte y Supervisión</h2>
        <p className="text-muted mt-2 fs-5">
          TiBACK fue diseñado para optimizar la comunicación entre el cliente, el analista de soporte,
          y la Supervisor que supervisa el proceso. Todo bajo una interfaz moderna, estructurada y eficiente.
        </p>
      </div>

      <div className="row align-items-center mt-5">
        <div className="col-md-6">
          <h4 className="fw-semibold text-primary mb-3">Flujo de atención estructurado</h4>
          <p className="text-muted">
            Cada solicitud enviada por un cliente se canaliza directamente al analista correspondiente,
            quien gestiona y documenta el caso en tiempo real.  
            La Supervisor supervisa las incidencias, prioriza los casos críticos y garantiza el cumplimiento
            de los niveles de servicio (SLA).
          </p>

          <ul className="list-unstyled text-muted mt-4">
            <li>
              <i className="fa-solid fa-check text-success me-2"></i>
              <strong>Analistas:</strong> Gestionan tickets, documentan acciones y comunican avances.
            </li>
            <li>
              <i className="fa-solid fa-check text-success me-2"></i>
              <strong>Supervisor:</strong> Supervisa tiempos de respuesta, reasigna casos y valida soluciones.
            </li>
            <li>
              <i className="fa-solid fa-check text-success me-2"></i>
              <strong>Administrador:</strong> Control total del sistema, usuarios, roles y métricas globales.
            </li>
          </ul>
        </div>

        <div className="col-md-6 text-center">
          <img
            src="https://res.cloudinary.com/mystoreimg/image/upload/v1759732380/fqoa6qkdincx1jfrben2.png"
            alt="Panel de soporte y supervisión"
            className="img-fluid rounded shadow-sm border border-light"
            style={{ cursor: "pointer", maxHeight: "420px", objectFit: "cover" }}
          />
        </div>
      </div>

      <div className="mt-5 pt-4 border-top">
        <h4 className="fw-semibold text-dark">Diseñado para la colaboración efectiva</h4>
        <p className="text-muted">
          TiBACK permite que todos los actores —cliente, analista, Supervisor y administrador—
          trabajen coordinadamente. La interfaz está pensada para minimizar errores y
          maximizar la trazabilidad de las acciones.
        </p>

        <div className="alert alert-light border-start border-3 border-info shadow-sm mt-4">
          <p className="mb-0">
            <strong>Consejo:</strong> Utiliza los tableros de supervisión para detectar cuellos de botella
            y optimizar la asignación de recursos en el equipo de soporte.
          </p>
        </div>
      </div>
    </div>
  );
};