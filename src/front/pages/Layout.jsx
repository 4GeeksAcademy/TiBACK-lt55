import React from "react";
import { Outlet, useLocation } from "react-router-dom";

// Importamos los diferentes headers y footers
import { Navbar } from "../components/Navbar";
import { LandNavbar } from "../components/LandingComponent/LandNavbar"
import { Footer } from "../components/Footer";
import { LandFooter } from "../components/LandingComponent/LandFooter"
import { authActions } from "../store";

const Layout = () => {
  const location = useLocation(); // Hook para saber en qué ruta estamos

  // Verificamos las rutas
  const isLandingPage = location.pathname === "/";
  const ContactView = location.pathname === "/contact";
  const home = location.pathname === "/Home";

  // Elegimos qué navbar mostrar
  const NavbarToShow =
    isLandingPage || ContactView
      ? <LandNavbar />
      : home || authActions
      ? <Navbar />
      : <LandNavbar />;
    
  const FooterToShow =
    isLandingPage || ContactView
      ? <LandFooter />
      : home || authActions
      ? <Footer />
      : <LandFooter />

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