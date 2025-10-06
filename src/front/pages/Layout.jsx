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
  const isLandingPage = location.pathname === "/";
  const isContactPage = location.pathname === "/contact";
  const isFeaturePage = location.pathname === "/feature/apps" || location.pathname === "/feature/design";
  const isAuthPage = location.pathname === "/auth";

  const navbarmain = isLandingPage || isContactPage || isFeaturePage;

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

  // Verificamos si es una vista de administrador (solo administrador ve el navbar)
  const isAdminView = location.pathname.startsWith("/administrador") ||
    location.pathname.startsWith("/administradores") ||
    location.pathname.startsWith("/analistas") ||
    location.pathname.startsWith("/supervisores") ||
    location.pathname.startsWith("/clientes") ||
    location.pathname.startsWith("/tickets") ||
    location.pathname.startsWith("/comentarios") ||
    location.pathname.startsWith("/asignaciones") ||
    location.pathname.startsWith("/gestiones") ||
    location.pathname.startsWith("/dashboard-calidad");

  // Verificamos si es una vista de supervisor, analista o cliente (no mostrar navbar)
  const isRoleView = location.pathname.startsWith("/supervisor") ||
    location.pathname.startsWith("/analista") ||
    location.pathname.startsWith("/cliente");

  // Verificamos si es la vista de recomendaciones-ia o comentarios (ocultar LandNavbar)
  const isRecomendacionIA = location.pathname.includes("/recomendacion-ia") || location.pathname.includes("/recomendaciones-ia") || location.pathname.includes("/recomendaciones-similares") || location.pathname.includes("/comentarios");

  // Elegimos qué navbar mostrar
  const NavbarToShow = navbarmain ? <LandNavbar /> : isAdminView ? <Navbar /> : isRoleView ? null : isAuthPage ? null : isRecomendacionIA ? null : <LandNavbar />;

  const FooterToShow = navbarmain ? <LandFooter /> : footermain ? <Footer /> : null;

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