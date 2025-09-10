import React from "react";
import { ClientesManager } from "../components/ClientesManager";
import { ComentariosManager } from "../components/ComentariosManager";
import { ManagerAsignacion } from "../components/ManagerAsignacion";

export const Home = () => (
	<div className="container py-4">
		<h1 className="display-5 mb-4">Gestión de Clientes</h1>
		<ClientesManager />

		<h1 className="display-5 mb-4 mt-5">Gestión de Comentarios</h1>
		<ComentariosManager />

		<h1 className="display-5 mb-4 mt-5">Gestión de Asignaciones</h1>
		<ManagerAsignacion />
	</div>
); 