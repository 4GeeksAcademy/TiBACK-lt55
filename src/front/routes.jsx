// Import necessary components and functions from react-router-dom.

import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
} from "react-router-dom";
import { Layout } from "./pages/Layout";
import { Home } from "./pages/Home";
import { Single } from "./pages/Single";
import { SingleAnalista } from "./pages/SingleAnalista"
import { Demo } from "./pages/Demo";
import { Analista } from "./pages/Analista";
import { Supervisor } from "./pages/Supervisor";

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

export const router = createBrowserRouter(
  createRoutesFromElements(
    // CreateRoutesFromElements function allows you to build route elements declaratively.
    // Create your routes here, if you want to keep the Navbar and Footer in all views, add your new routes inside the containing Route.
    // Root, on the contrary, create a sister Route, if you have doubts, try it!
    // Note: keep in mind that errorElement will be the default page when you don't get a route, customize that page to make your project more attractive.
    // Note: The child paths of the Layout element replace the Outlet component with the elements contained in the "element" attribute of these child paths.

    // Root Route: All navigation will start from here.
    <Route path="/" element={<Layout />} errorElement={<h1>Not found!</h1>} >

        {/* Nested Routes: Defines sub-routes within the BaseHome component. */}
        <Route path= "/" element={<Home />} />
        <Route path="/demo" element={<Demo />} />
      
        <Route path="/single/:theId" element={ <Single />} />  {/* Dynamic route for single items */}
        <Route path="/analistas/:analista_id" element={ <SingleAnalista />} />
        <Route path="/analistas" element={<Analista />} />
        
        <Route path="/supervisores" element={<Supervisor />} />
        <Route path="/tickets" element={<Ticket />} />

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
          <Route path="/agregar-asignacion" element={<AgregarAsignacion />} />
          <Route path="/actualizar-asignacion/:id" element={<ActualizarAsignacion />} />
          <Route path="/ver-asignacion/:id" element={<VerAsignacion />} />

          <Route path="/administradores" element={<Administrador />} />
          <Route path="/agregar-administrador" element={<AgregarAdministrador />} />
          <Route path="/actualizar-administrador/:id" element={<ActualizarAdministrador />} />
          <Route path="/ver-administrador/:id" element={<VerAdministrador />} />
      </Route>
    )
);