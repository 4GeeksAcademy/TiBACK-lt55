import React from "react";
import { Link } from "react-router-dom";

export const Home = () => {
	return (
		<div className="container py-4 text-center">

			<h1 className="display-1 mt-4 mb-5 me-4">TiBACK</h1>

			<div className="d-flex justify-content-center align-items-start gap-3 flex-wrap">

				<div className="d-flex flex-column align-items-center mx-4">
					<Link to="/clientes" className="btn btn-primary btn-lg">Clientes</Link>
					<Link to="/auth?role=cliente" className="btn btn-outline-primary btn-lg mt-2 d-flex align-items-center">
						<i className="fas fa-user me-2"></i> Acceso Cliente
					</Link>
				</div>

				<div className="d-flex flex-column align-items-center mx-4">
					<Link to="/analistas" className="btn btn-success btn-lg">Analistas</Link>
					<Link to="/auth?role=analista" className="btn btn-outline-success btn-lg mt-2 d-flex align-items-center">
						<i className="fas fa-user-tie me-2"></i> Acceso Analista
					</Link>
				</div>

				<div className="d-flex flex-column align-items-center mx-4">
					<Link to="/supervisores" className="btn btn-warning btn-lg">Supervisores</Link>
					<Link to="/auth?role=supervisor" className="btn btn-outline-warning btn-lg mt-2 d-flex align-items-center">
						<i className="fas fa-user-shield me-2"></i> Acceso Supervisor
					</Link>
				</div>

				<div className="d-flex flex-column align-items-center mx-4">
					<Link to="/administradores" className="btn btn-danger btn-lg">Administradores</Link>
					<Link to="/auth?role=administrador" className="btn btn-outline-danger btn-lg mt-2 d-flex align-items-center">
						<i className="fas fa-crown me-2"></i> Acceso Administrador
					</Link>
				</div>

			</div>

		</div>
	)
};


