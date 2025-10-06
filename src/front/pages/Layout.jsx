import React from "react";
import { Outlet, useLocation } from "react-router-dom";

// Importamos los diferentes headers y footers
import { Navbar } from "../components/Navbar";
import { LandNavbar } from "../components/LandingComponent/LandNavbar"
import { Footer } from "../components/Footer";
import { LandFooter } from "../components/LandingComponent/LandFooter"

const Layout = () => {
  const location = useLocation(); // Hook para saber en qué ruta estamos

  // Verificamos las rutas
  const navbarmain = 
  location.pathname === "/" || 
  location.pathname === "/contact" ||
  location.pathname === "/feature/apps" ||
  location.pathname === "/feature/design";

  const footermain = 
  location.pathname === "/cliente" ||
  location.pathname === "/analista" ||
  location.pathname === "/supervisor" || 
  location.pathname === "/administrador";

  // Verificamos si es una vista privada de roles o gestión
  const isPrivateRoleView = location.pathname.startsWith("/cliente") ||
    location.pathname.startsWith("/analista") ||
    location.pathname.startsWith("/supervisor") ||
    location.pathname.startsWith("/administrador") ||
    location.pathname.startsWith("/analistas") ||
    location.pathname.startsWith("/supervisores") ||
    location.pathname.startsWith("/clientes") ||
    location.pathname.startsWith("/administradores") ||
    location.pathname.startsWith("/tickets") ||
    location.pathname.startsWith("/comentarios") ||
    location.pathname.startsWith("/asignaciones") ||
    location.pathname.startsWith("/gestiones") ||
    location.pathname.startsWith("/dashboard-calidad");

  // Elegimos qué navbar mostrar
  const NavbarToShow =
    isLandingPage || ContactView
      ? <LandNavbar />
      : home || isPrivateRoleView
        ? <Navbar />
        : isAuthPage
          ? null // No mostrar navbar en login
          : <LandNavbar />;
    navbarmain ? <LandNavbar /> :  "";

  const FooterToShow =
    navbarmain ? <LandFooter /> : footermain ? <Footer /> : "" ;

  return (
    <>
      {/* Navbar dinámico */}
      {NavbarToShow}

      {/* Aquí se van a renderizar las páginas hijas */}
      <main>
        <Outlet />
      </main>

      {/* Footer dinámico */}
      {FooterToShow}
    </>
  );
};

export default Layout;