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


  const home = location.pathname === "/Home";
  const isAuthPage = location.pathname === "/auth";

  // Elegimos qué navbar mostrar
  const NavbarToShow =
    navbarmain ? <LandNavbar /> : location.pathname === "/auth" ? <Navbar /> : "";

  const FooterToShow =
    navbarmain ? <LandFooter /> : location.pathname === "/auth" ? <Footer /> : footermain ? <Footer /> : "" ;

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