import React from "react";
import { Link } from "react-router-dom";

export const Home = () => (
	<div className="container-fluid d-flex flex-column min-vh-100 py-4 text-center">
		<h1 className="display-1 mt-4 mb-5 me-4">TiBACK</h1>
		
		<div className="container">
			<div className="row g-3 justify-content-center">

				<div className="col-12 col-sm-6 col-md-3">
					<div className="card h-100">
						<div className="card-body">
							<Link to="/clientes" className="btn btn-primary btn-lg w-100">Clientes</Link>
						</div>
						<div className="card-footer">
							<Link to="/auth" className="btn btn-outline-primary btn-lg mt-2 d-flex align-items-center justify-content-center">
								<i className="fas fa-user me-2"></i> Acceso Clientes
							</Link>
						</div>
					</div>
				</div>

				<div className="col-12 col-sm-6 col-md-3">
					<div className="card h-100">
						<div className="card-body">
							<Link to="/analistas" className="btn btn-success btn-lg w-100">Analistas</Link>
						</div>
						<div className="card-footer">
							<Link to="/auth" className="btn btn-outline-primary btn-lg mt-2 d-flex align-items-center justify-content-center">
								<i className="fas fa-user me-2"></i> Acceso Analistas
							</Link>
						</div>
					</div>
				</div>

				<div className="col-12 col-sm-6 col-md-3">
					<div className="card h-100">
						<div className="card-body">
							<Link to="/supervisores" className="btn btn-warning btn-lg w-100">Supervisores</Link>
						</div>
						<div className="card-footer">
							<Link to="/auth" className="btn btn-outline-primary btn-lg mt-2 d-flex align-items-center justify-content-center">
								<i className="fas fa-user me-2"></i> Acceso Supervisores
							</Link>
						</div>
					</div>
				</div>

				<div className="col-12 col-sm-6 col-md-3">
					<div className="card h-100">
						
						<div className="card-body">
							<Link to="/administradores" className="btn btn-danger btn-lg w-100">Administradores</Link>
						</div>
						<div className="card-footer">
							<Link to="/auth" className="btn btn-outline-primary btn-lg mt-2 d-flex align-items-center justify-content-center">
								<i className="fas fa-user me-2"></i> Acceso Administradores
							</Link>
						</div>
					</div>
				</div>

			</div>
		</div>
	</div>
);
