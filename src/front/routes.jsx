// Import necessary components and functions from react-router-dom.

import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
} from "react-router-dom";
import Layout from "./pages/Layout";
import { Landing } from "./pages/Landing"
import AboutUs from "./components/LaindigViewComponent/AboutUs"
import Contact from "./components/LaindigViewComponent/Contact"
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
import ComentariosTicket from "./pages/ComentariosTicket";
import RecomendacionVista from "./components/RecomendacionVista";
import RecomendacionesGuardadas from "./pages/RecomendacionesGuardadas";
import ChatSupervisorAnalista from "./pages/ChatSupervisorAnalista";
import ChatAnalistaCliente from "./pages/ChatAnalistaCliente";

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
import { ProtectedRoute } from "./components/ProtectedRoute";
import { ClientePage } from "./protectedViewsRol/cliente/ClientePage";
import { AnalistaPage } from "./protectedViewsRol/analista/AnalistaPage";
import { SupervisorPage } from "./protectedViewsRol/supervisor/SupervisorPage";
import { AdministradorPage } from "./protectedViewsRol/administrador/AdministradorPage";

export const router = createBrowserRouter(
  createRoutesFromElements(

    <Route path="/" element={<Layout />} errorElement={<h1>Not found!</h1>} >

      <Route path="/" element={<Landing />} />
      <Route path="/AboutUs" element={<AboutUs />}/>
      <Route path="/Contact" element={<Contact />}/>
      <Route path="/Home" element={<Home />} />
      <Route path="/demo" element={<Demo />} />

      {/* rutas de autenticacion */}
      <Route path="/auth" element={<AuthForm />} />

      {/* rutas protegidas para diferentes roles */}
      <Route path="/cliente" element={
        <ProtectedRoute allowedRoles={["cliente"]}>
          <ClientePage />
        </ProtectedRoute>
      } />

      <Route path="/analista" element={
        <ProtectedRoute allowedRoles={["analista"]}>
          <AnalistaPage />
        </ProtectedRoute>
      } />

      <Route path="/supervisor" element={
        <ProtectedRoute allowedRoles={["supervisor"]}>
          <SupervisorPage />
        </ProtectedRoute>
      } />

      <Route path="/administrador" element={
        <ProtectedRoute allowedRoles={["administrador"]}>
          <AdministradorPage />
        </ProtectedRoute>
      } />


      <Route path="/analistas" element={
        <ProtectedRoute allowedRoles={["administrador", "analista"]}>
          <Analistas />
        </ProtectedRoute>
      } />
      <Route path="/agregar-analista" element={
        <ProtectedRoute allowedRoles={["administrador", "analista"]}>
          <AgregarAnalista />
        </ProtectedRoute>
      } />
      <Route path="/actualizar-analista/:id" element={
        <ProtectedRoute allowedRoles={["administrador", "analista"]}>
          <ActualizarAnalista />
        </ProtectedRoute>
      } />
      <Route path="/ver-analista/:id" element={
        <ProtectedRoute allowedRoles={["administrador", "analista"]}>
          <VerAnalista />
        </ProtectedRoute>
      } />


      <Route path="/supervisores" element={
        <ProtectedRoute allowedRoles={["administrador", "supervisor"]}>
          <Supervisor />
        </ProtectedRoute>
      } />
      <Route path="/supervisores/nuevo" element={
        <ProtectedRoute allowedRoles={["administrador", "supervisor"]}>
          <AgregarSupervisor />
        </ProtectedRoute>
      } />
      <Route path="/supervisor/:supervisorid/editar" element={
        <ProtectedRoute allowedRoles={["administrador", "supervisor"]}>
          <ActualizarSupervisor />
        </ProtectedRoute>
      } />
      <Route path="/supervisor/:supervisorid" element={
        <ProtectedRoute allowedRoles={["administrador", "supervisor"]}>
          <VerSupervisor />
        </ProtectedRoute>
      } />


      <Route path="/tickets" element={
        <ProtectedRoute allowedRoles={["administrador", "supervisor", "analista"]}>
          <Ticket />
        </ProtectedRoute>
      } />
      <Route path="/tickets/nuevo" element={
        <ProtectedRoute allowedRoles={["administrador", "cliente"]}>
          <AgregarTicket />
        </ProtectedRoute>
      } />
      <Route path="/ver-ticket/:id" element={
        <ProtectedRoute allowedRoles={["administrador", "supervisor", "analista"]}>
          <VerTicket />
        </ProtectedRoute>
      } />
      <Route path="/actualizar-ticket/:id" element={
        <ProtectedRoute allowedRoles={["administrador", "supervisor", "analista"]}>
          <ActualizarTicket />
        </ProtectedRoute>
      } />


      <Route path="/clientes" element={
        <ProtectedRoute allowedRoles={["administrador", "cliente"]}>
          <Clientes />
        </ProtectedRoute>
      } />
      <Route path="/agregar-cliente" element={
        <ProtectedRoute allowedRoles={["administrador", "cliente"]}>
          <AgregarCliente />
        </ProtectedRoute>
      } />
      <Route path="/actualizar-cliente/:id" element={
        <ProtectedRoute allowedRoles={["administrador", "cliente"]}>
          <ActualizarCliente />
        </ProtectedRoute>
      } />
      <Route path="/ver-cliente/:id" element={
        <ProtectedRoute allowedRoles={["administrador", "cliente"]}>
          <VerCliente />
        </ProtectedRoute>
      } />


      <Route path="/comentarios" element={
        <ProtectedRoute allowedRoles={["analista", "supervisor", "administrador", "cliente"]}>
          <Comentarios />
        </ProtectedRoute>
      } />
      <Route path="/agregar-comentario" element={
        <ProtectedRoute allowedRoles={["analista", "supervisor", "administrador", "cliente"]}>
          <AgregarComentarios />
        </ProtectedRoute>
      } />
      <Route path="/actualizar-comentario/:id" element={
        <ProtectedRoute allowedRoles={["analista", "supervisor", "administrador", "cliente"]}>
          <ActualizarComentarios />
        </ProtectedRoute>
      } />
      <Route path="/ver-comentario/:id" element={
        <ProtectedRoute allowedRoles={["analista", "supervisor", "administrador", "cliente"]}>
          <VerComentarios />
        </ProtectedRoute>
      } />
      <Route path="/ticket/:ticketId/comentarios" element={
        <ProtectedRoute allowedRoles={["analista", "supervisor", "administrador", "cliente"]}>
          <ComentariosTicket />
        </ProtectedRoute>
      } />
      <Route path="/ticket/:ticketId/comentarios-cerrado" element={
        <ProtectedRoute allowedRoles={["supervisor", "administrador"]}>
          <ComentariosTicket />
        </ProtectedRoute>
      } />
      <Route path="/ticket/:ticketId/recomendacion-ia" element={
        <ProtectedRoute allowedRoles={["analista", "supervisor", "administrador", "cliente"]}>
          <RecomendacionVista />
        </ProtectedRoute>
      } />
      <Route path="/ticket/:ticketId/recomendaciones-ia" element={
        <ProtectedRoute allowedRoles={["analista", "supervisor", "administrador", "cliente"]}>
          <RecomendacionesGuardadas />
        </ProtectedRoute>
      } />
      <Route path="/ticket/:ticketId/chat-supervisor-analista" element={
        <ProtectedRoute allowedRoles={["supervisor", "analista"]}>
          <ChatSupervisorAnalista />
        </ProtectedRoute>
      } />
      <Route path="/ticket/:ticketId/chat-analista-cliente" element={
        <ProtectedRoute allowedRoles={["analista", "cliente"]}>
          <ChatAnalistaCliente />
        </ProtectedRoute>
      } />


      <Route path="/asignaciones" element={
        <ProtectedRoute allowedRoles={["supervisor", "administrador", "analista"]}>
          <Asignacion />
        </ProtectedRoute>
      } />
      <Route path="/agregar-asignacion" element={
        <ProtectedRoute allowedRoles={["supervisor", "administrador", "analista"]}>
          <AgregarAsignacion />
        </ProtectedRoute>
      } />
      <Route path="/actualizar-asignacion/:id" element={
        <ProtectedRoute allowedRoles={["supervisor", "administrador", "analista"]}>
          <ActualizarAsignacion />
        </ProtectedRoute>
      } />
      <Route path="/ver-asignacion/:id" element={
        <ProtectedRoute allowedRoles={["supervisor", "administrador", "analista"]}>
          <VerAsignacion />
        </ProtectedRoute>
      } />


      <Route path="/administradores" element={
        <ProtectedRoute allowedRoles={["administrador"]}>
          <Administrador />
        </ProtectedRoute>
      } />
      <Route path="/agregar-administrador" element={
        <ProtectedRoute allowedRoles={["administrador"]}>
          <AgregarAdministrador />
        </ProtectedRoute>
      } />
      <Route path="/actualizar-administrador/:id" element={
        <ProtectedRoute allowedRoles={["administrador"]}>
          <ActualizarAdministrador />
        </ProtectedRoute>
      } />
      <Route path="/ver-administrador/:id" element={
        <ProtectedRoute allowedRoles={["administrador"]}>
          <VerAdministrador />
        </ProtectedRoute>
      } />


      <Route path="/gestiones" element={
        <ProtectedRoute allowedRoles={["analista", "supervisor", "administrador", "cliente"]}>
          <Gestion />
        </ProtectedRoute>
      } />
      <Route path="/agregar-gestion" element={
        <ProtectedRoute allowedRoles={["analista", "supervisor", "administrador", "cliente"]}>
          <AgregarGestion />
        </ProtectedRoute>
      } />
      <Route path="/actualizar-gestion/:id" element={
        <ProtectedRoute allowedRoles={["analista", "supervisor", "administrador", "cliente"]}>
          <ActualizarGestion />
        </ProtectedRoute>
      } />
      <Route path="/ver-gestion/:id" element={
        <ProtectedRoute allowedRoles={["analista", "supervisor", "administrador", "cliente"]}>
          <VerGestion />
        </ProtectedRoute>
      } />
    </Route>
  ),
  {
    future: {
      v7_startTransition: true,
      v7_relativeSplatPath: true
    }
  }
);