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
  const ContactView = location.pathname === "/contact";
  const home = location.pathname === "/Home";
  const isAuthPage = location.pathname === "/auth";

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

  const FooterToShow =
    isLandingPage || ContactView
      ? <LandFooter />
      : home
        ? <Footer />
        : isAuthPage
          ? null // No mostrar footer en login
          : <Footer /> // Mostrar Footer con sincronización en vistas protegidas

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



// import { Outlet, useLocation } from "react-router-dom";
// import ScrollToTop from "../components/ScrollToTop";
// import { Navbar } from "../components/Navbar";
// import { Footer } from "../components/Footer";

// export const Layout = () => {
//     const location = useLocation();

//     // Ocultar Navbar y Footer en /auth
//     const hideNavAndFooter = location.pathname.startsWith("/auth");

//     return (
//         <ScrollToTop>
//             {!hideNavAndFooter && <Navbar />}
//             <Outlet />
//             {!hideNavAndFooter && <Footer />}
//         </ScrollToTop>
//     );
// };

// export default Layout;