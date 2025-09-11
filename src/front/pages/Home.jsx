import React from "react";
import { Link } from "react-router-dom";

export const Home = () => (
	<div className="container py-4 text-center">
		<h1 className="display-1 mt-4 mb-5 me-4">TiBACK</h1>

		<div className="d-flex justify-content-center gap-3">
			<Link to="/clientes" className="btn btn-primary btn-lg mx-4">Clientes</Link>
			<Link to="/analistas" className="btn btn-success btn-lg mx-4">Analistas</Link>
			<Link to="/supervisores" className="btn btn-warning btn-lg mx-4">Supervisores</Link>
			<Link to="/administradores" className="btn btn-danger btn-lg mx-4">Administradores</Link>
		</div>
	</div>
); 