// Import necessary components and functions from react-router-dom.

import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
} from "react-router-dom";
import { Layout } from "./pages/Layout";
import { Home } from "./pages/Home";
import { Demo } from "./pages/Demo";
import { AuthForm } from "./authentication/AuthForm";

// Páginas protegidas
import { ClientePage } from "./protectedViewsRol/cliente/ClientePage";
import { AnalistaPage } from "./protectedViewsRol/analista/AnalistaPage";
import { SupervisorPage } from "./protectedViewsRol/supervisor/SupervisorPage";
import { AdministradorPage } from "./protectedViewsRol/administrador/AdministradorPage";

import { ProtectedRoute } from "./components/ProtectedRoute";

// CRUD de usuarios y tickets
import { Clientes, AgregarCliente, ActualizarCliente, VerCliente } from "./pages/Clientes";
import { Analistas, AgregarAnalista, ActualizarAnalista, VerAnalista } from "./pages/Analistas";
import { Supervisor, AgregarSupervisor, ActualizarSupervisor, VerSupervisor } from "./pages/Supervisor";
import { Administrador, AgregarAdministrador, ActualizarAdministrador, VerAdministrador } from "./pages/Administrador";
import { Ticket, AgregarTicket, ActualizarTicket, VerTicket } from "./pages/Ticket";
import { Gestion, AgregarGestion, ActualizarGestion, VerGestion } from "./pages/Gestion";
import { Comentarios, AgregarComentarios, ActualizarComentarios, VerComentarios } from "./pages/Comentarios";
import { Asignacion, AgregarAsignacion, ActualizarAsignacion, VerAsignacion } from "./pages/Asignacion";


export const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/" element={<Layout />} errorElement={<h1>Not found!</h1>}>
      {/* Rutas públicas */}
      <Route path="/" element={<Home />} />
      <Route path="/demo" element={<Demo />} />
      <Route path="/auth" element={<AuthForm />} />

      {/* =================== RUTAS PROTEGIDAS =================== */}
      
      {/* Rutas para administradores */}
      <Route element={<ProtectedRoute allowedRoles={["administrador"]} />}>
        <Route path="/administrador" element={<AdministradorPage />} />
        <Route path="/administradores" element={<Administrador />} />
        <Route path="/agregar-administrador" element={<AgregarAdministrador />} />
        <Route path="/actualizar-administrador/:id" element={<ActualizarAdministrador />} />
        <Route path="/ver-administrador/:id" element={<VerAdministrador />} />
      </Route>

      {/* Rutas para clientes */}
      <Route element={<ProtectedRoute allowedRoles={["cliente"]} />}>
        <Route path="/cliente" element={<ClientePage />} />
        <Route path="/clientes" element={<Clientes />} />
        <Route path="/agregar-cliente" element={<AgregarCliente />} />
        <Route path="/actualizar-cliente/:id" element={<ActualizarCliente />} />
        <Route path="/ver-cliente/:id" element={<VerCliente />} />
      </Route>

      {/* Rutas para analistas */}
      <Route element={<ProtectedRoute allowedRoles={["analista"]} />}>
        <Route path="/analista" element={<AnalistaPage />} />
        <Route path="/analistas" element={<Analistas />} />
        <Route path="/agregar-analista" element={<AgregarAnalista />} />
        <Route path="/actualizar-analista/:id" element={<ActualizarAnalista />} />
        <Route path="/ver-analista/:id" element={<VerAnalista />} />
      </Route>

      {/* Rutas para supervisores */}
      <Route element={<ProtectedRoute allowedRoles={["supervisor"]} />}>
        <Route path="/supervisor" element={<SupervisorPage />} />
        <Route path="/supervisores" element={<Supervisor />} />
        <Route path="/supervisores/nuevo" element={<AgregarSupervisor />} />
        <Route path="/supervisor/:supervisorid/editar" element={<ActualizarSupervisor />} />
        <Route path="/supervisor/:supervisorid" element={<VerSupervisor />} />
      </Route>

      {/* Rutas multi-rol */}
      <Route element={<ProtectedRoute allowedRoles={["administrador","analista","supervisor"]} />}>
        <Route path="/tickets" element={<Ticket />} />
        <Route path="/ver-ticket/:id" element={<VerTicket />} />
        <Route path="/actualizar-ticket/:id" element={<ActualizarTicket />} />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={["administrador","cliente"]} />}>
        <Route path="/tickets/nuevo" element={<AgregarTicket />} />
        <Route path="/clientes" element={<Clientes />} />
        <Route path="/agregar-cliente" element={<AgregarCliente />} />
        <Route path="/actualizar-cliente/:id" element={<ActualizarCliente />} />
        <Route path="/ver-cliente/:id" element={<VerCliente />} />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={["analista","supervisor","administrador","cliente"]} />}>
        <Route path="/comentarios" element={<Comentarios />} />
        <Route path="/agregar-comentario" element={<AgregarComentarios />} />
        <Route path="/actualizar-comentario/:id" element={<ActualizarComentarios />} />
        <Route path="/ver-comentario/:id" element={<VerComentarios />} />

        <Route path="/gestiones" element={<Gestion />} />
        <Route path="/agregar-gestion" element={<AgregarGestion />} />
        <Route path="/actualizar-gestion/:id" element={<ActualizarGestion />} />
        <Route path="/ver-gestion/:id" element={<VerGestion />} />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={["administrador","supervisor","analista"]} />}>
        <Route path="/asignaciones" element={<Asignacion />} />
        <Route path="/agregar-asignacion" element={<AgregarAsignacion />} />
        <Route path="/actualizar-asignacion/:id" element={<ActualizarAsignacion />} />
        <Route path="/ver-asignacion/:id" element={<VerAsignacion />} />
      </Route>

    </Route>
  )
);