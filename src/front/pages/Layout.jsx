import React from "react";
import { Outlet, useLocation } from "react-router-dom";

// Importamos los diferentes headers y footers
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import { NavbarPrincipal } from "../components/LaindigViewComponent/NavbarPrincipal";
import { FooterPrincipal } from "../components/LaindigViewComponent/FooterPrincipal";

const Layout = () => {
  const location = useLocation(); // Hook para saber en qué ruta estamos

  // Verificamos las rutas
  const isLandingPage = location.pathname === "/";
  const aboutUs = location.pathname === "/AboutUs";
  const contact = location.pathname === "/Contact";
  const home = location.pathname === "/Home";

  // Elegimos qué navbar mostrar
  const NavbarToShow =
    isLandingPage || aboutUs || contact
      ? <NavbarPrincipal />
      : home
      ? <Navbar />
      : <NavbarPrincipal />;
  const FooterToShow =
    isLandingPage || aboutUs || contact
      ? <FooterPrincipal />
      : home
      ? <Footer />
      : <FooterPrincipal />;

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


// import React from "react";
// import { Outlet, useLocation } from "react-router-dom";

// // Importamos los diferentes headers y footers
// import {Navbar} from "../components/Navbar";
// import {Footer} from "../components/Footer";
// import {NavbarPrincipal} from "../components/LaindigViewComponent/NavbarPrincipal";
// import {FooterPrincipal} from "../components/LaindigViewComponent/FooterPrincipal";

// const Layout = () => {
//     const location = useLocation(); // Hook para saber en qué ruta estamos

//     // Verificamos si estamos en la página principal (raíz "/")
//     const isLandingPage = location.pathname === "/";
//     const aboutUs = location.pathname === "/AboutUs";
//     const contact = location.pathname === "/Contact";
//     const home = location.pathname === "/Home";

//     return (
//         <>
//             {/* Si estamos en "/", mostramos la versión principal del navbar */}

//             {isLandingPage ? <NavbarPrincipal /> : <Navbar /> || aboutUs ? <NavbarPrincipal /> : <Navbar /> || contact ? <NavbarPrincipal /> : <Navbar /> || home ? <Navbar /> : <NavbarPrincipal />}
            

//             {/* Aquí se van a renderizar las páginas hijas */}
//             <main>
//                 <Outlet />
//             </main>

//             {/* Dependiendo de la ruta, cargamos el footer correspondiente */}
//             {isLandingPage ? <FooterPrincipal /> : <Footer />}
//         </>
//     );
// };

// export default Layout;
