// Import necessary components and functions from react-router-dom.

import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
} from "react-router-dom";
import { Layout } from "./pages/Layout";
import { Home } from "./pages/Home";
import { Single } from "./pages/Single";
import { Demo } from "./pages/Demo";

import { Supervisor } from "./pages/Supervisor";
import VerSupervisor from "./pages/VerSupervisor";
import ActualizarSupervisor from "./pages/ActualizarSupervisor";
import AgregarSupervisor from "./pages/AgregarSupervisor";

import { Analistas } from "./pages/Analistas"
import { ActualizarAnalista } from "./pages/ActualizarAnalista";
import { AgregarAnalista } from "./pages/AgregarAnalista"
import { VerAnalista } from "./pages/VerAnalista";

import { Clientes } from "./pages/Clientes";
import { AgregarCliente } from "./pages/AgregarCliente";
import { ActualizarCliente } from "./pages/ActualizarCliente";
import { VerCliente } from "./pages/VerCliente";

import { Comentarios } from "./pages/Comentarios";
import { AgregarComentarios } from "./pages/AgregarComentarios";
import { ActualizarComentarios } from "./pages/ActualizarComentarios";
import { VerComentarios } from "./pages/VerComentarios";

import { Asignacion } from "./pages/Asignacion";
import { AgregarAsignacion } from "./pages/AgregarAsignacion";
import { ActualizarAsignacion } from "./pages/ActualizarAsignacion";
import { VerAsignacion } from "./pages/VerAsignacion";

import { Administrador } from "./pages/Administrador";
import { AgregarAdministrador } from "./pages/AgregarAdministrador";
import { ActualizarAdministrador } from "./pages/ActualizarAdministrador";
import { VerAdministrador } from "./pages/VerAdministrador";

import { Ticket } from "./pages/Ticket";
import { VerTicket } from "./pages/VerTicket";
import { ActualizarTicket } from "./pages/ActualizarTicket";
import AgregarTicket from "./pages/AgregarTicket";

import { Gestion } from "./pages/Gestion";
import { VerGestion } from "./pages/VerGestion";
import { AgregarGestion } from "./pages/AgregarGestion"
import { ActualizarGestion } from "./pages/ActualizarGestion";

import { AuthForm } from "./authentication/AuthForm";
import { ProtectedRoute } from "./authentication/ProtectedRoute";
import { ClientePage } from "./protectedViewsRol/cliente/ClientePage";

export const router = createBrowserRouter(
  createRoutesFromElements(

    <Route path="/" element={<Layout />} errorElement={<h1>Not found!</h1>} >


      <Route path="/" element={<Home />} />
      <Route path="/demo" element={<Demo />} />

         {/* rutas de autenticacion */}
      <Route path="/auth" element={<AuthForm />} />

      {/* rutas protegidas para diferentes roles */}
      <Route path="/cliente" element={
        <ProtectedRoute allowedRoles={["cliente"]}>
          <ClientePage />
        </ProtectedRoute>
      } />


      <Route path="/analistas" element={<Analistas />} />
      <Route path="/agregar-analista" element={<AgregarAnalista />} />
      <Route path="/actualizar-analista/:id" element={<ActualizarAnalista />} />
      <Route path="/ver-analista/:id" element={<VerAnalista />} />


      <Route path="/supervisores" element={<Supervisor />} />
      <Route path="/supervisores/nuevo" element={<AgregarSupervisor />} />
      <Route path="/supervisor/:supervisorid/editar" element={<ActualizarSupervisor />} />
      <Route path="/supervisor/:supervisorid" element={<VerSupervisor />} />


      <Route path="/tickets" element={<Ticket />} />
      <Route path="/tickets/nuevo" element={<AgregarTicket />} />
      <Route path="/ver-ticket/:id" element={<VerTicket />} />
      <Route path="/actualizar-ticket/:id" element={<ActualizarTicket />} />


      <Route path="/clientes" element={<Clientes />} />
      <Route path="/agregar-cliente" element={<AgregarCliente />} />
      <Route path="/actualizar-cliente/:id" element={<ActualizarCliente />} />
      <Route path="/ver-cliente/:id" element={<VerCliente />} />


      <Route path="/comentarios" element={<Comentarios />} />
      <Route path="/agregar-comentario" element={<AgregarComentarios />} />
      <Route path="/actualizar-comentario/:id" element={<ActualizarComentarios />} />
      <Route path="/ver-comentario/:id" element={<VerComentarios />} />


      <Route path="/asignaciones" element={<Asignacion />} />
      <Route path="/agregar-asignacion" element={<AgregarAsignacion />} />
      <Route path="/actualizar-asignacion/:id" element={<ActualizarAsignacion />} />
      <Route path="/ver-asignacion/:id" element={<VerAsignacion />} />


      <Route path="/administradores" element={<Administrador />} />
      <Route path="/agregar-administrador" element={<AgregarAdministrador />} />
      <Route path="/actualizar-administrador/:id" element={<ActualizarAdministrador />} />
      <Route path="/ver-administrador/:id" element={<VerAdministrador />} />


      <Route path="/gestiones" element={<Gestion />} />
      <Route path="/agregar-gestion" element={<AgregarGestion />} />
      <Route path="/actualizar-gestion/:id" element={<ActualizarGestion />} />
      <Route path="/ver-gestion/:id" element={<VerGestion />} />
    </Route>
  )
);