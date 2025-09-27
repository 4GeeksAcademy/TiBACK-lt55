import { Link } from "react-router-dom";
import tibacklogo from "../../assets/img/logo2.png";
import React, { useState, useEffect, useRef } from "react";
import "./StyleComponenet/NavbarPrincipal.css"; // 👈 Importamos el CSS

export const NavbarPrincipal = () => {
  // --- Lista de imágenes para el carrusel ---
  const images = [
    "https://picsum.photos/id/9/1200/400",
    "https://picsum.photos/id/6/1200/400",
    "https://picsum.photos/id/4/1200/400",
  ];

  // --- Estados ---
  const [currentSlide, setCurrentSlide] = useState(0);
  const [carouselHeight, setCarouselHeight] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);

  const containerRef = useRef(null);

  // --- Carrusel automático ---
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % images.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [images.length]);

  // --- Ajustar altura del carrusel ---
  useEffect(() => {
    const calculateHeight = () => {
      if (containerRef.current) {
        const width = containerRef.current.offsetWidth;
        setCarouselHeight(width * 0.4);
      }
    };
    calculateHeight();
    window.addEventListener("resize", calculateHeight);
    return () => window.removeEventListener("resize", calculateHeight);
  }, []);

  // --- Detectar scroll para navbar ---
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      {/* --- Navbar --- */}
      <nav
        className={`navbar navbar-expand-lg p-0 ${
          isScrolled
            ? "bg-light bg-opacity-75 position-fixed top-0 w-100 shadow"
            : "bg-transparent position-absolute top-0 w-100"
        }`}
        style={{ zIndex: 1000, transition: "background-color 0.5s ease" }}
      >
        <div className="container">
          {/* Logo */}
          <Link className="navbar-brand" to="/">
            <img
              src={tibacklogo}
              alt="Logo TiBACK"
              className={`rounded-2 ${isScrolled ? "w-25" : "w-75"}`}
              style={{ transition: "all 0.5s ease" }}
            />
          </Link>

          {/* Botón responsive */}
          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarMenu"
            aria-controls="navbarMenu"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          {/* Links */}
          <div className="collapse navbar-collapse" id="navbarMenu">
            <ul className={`navbar-nav ms-auto mb-2 mb-lg-0`}>
              <li className="nav-item">
                <Link to="/Home" className={`${isScrolled ? "nav-link text-dark" : "nav-link text-light fs-3 px-3"}`}>
                  Inicio
                </Link>
              </li>
              <li className="nav-item">
                <Link to="/AboutUs" className={`${isScrolled ? "nav-link text-dark" : "nav-link text-light fs-3 px-3"}`}>
                  Acerca de
                </Link>
              </li>
              <li className="nav-item">
                <Link to="/Contact" className={`${isScrolled ? "nav-link text-dark" : "nav-link text-light fs-3 px-3"}`}>
                  Contáctanos
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </nav>

      {/* --- Carrusel con texto --- */}
      <div
        ref={containerRef}
        className="position-relative w-100"
        style={{ height: carouselHeight, minHeight: "200px", overflow: "hidden" }}
      >
        {/* Slides */}
        {images.map((src, index) => (
          <img
            key={index}
            src={src}
            alt={`Slide ${index + 1}`}
            className="position-absolute object-fit-cover top-0 start-50 translate-middle-x w-100 h-100"
            style={{
              transition: "opacity 1s ease-in-out",
              opacity: index === currentSlide ? 1 : 0,
            }}
          />
        ))}

        {/* Texto animado */}
        <div className="text-shutter-container position-absolute top-50 start-50 translate-middle text-center rounded-2 shadow p-3 mb-5 text-light bg-secondary bg-opacity-50">
          <h1 style={{ fontSize: "clamp(1.5rem, 5vw, 4rem)", lineHeight: 1.4 }}>
            Bienvenidos <br /> a <br /> TiBACK
          </h1>
          <p
            style={{ fontSize: "clamp(1rem, 2.5vw, 1.8rem)" }}
            className="mt-5"
          >
            Tu turno, tu tiempo, tu solución. Con la velocidad que mereces.
          </p>

          {/* Persianas animadas */}
          <div className="shutter-text-overlay">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="shutter-text-panel"></div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};







// import { Link } from "react-router-dom";
// import tibacklogo from "../../assets/img/logotiback.png"
// import React, { useState, useEffect, useRef } from "react";

// export const NavbarPrincipal = () => {
//     const images = [
//         "https://picsum.photos/id/9/1200/400",
//         "https://picsum.photos/id/6/1200/400",
//         "https://picsum.photos/id/4/1200/400",
//       ];
    
//       const [currentIndex, setCurrentIndex] = useState(0);
//       const [carouselHeight, setCarouselHeight] = useState(0);
//       const containerRef = useRef(null);
    
//       // Cambia automáticamente de imagen cada 4 segundos
//       useEffect(() => {
//         const interval = setInterval(() => {
//           setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
//         }, 5000);
//         return () => clearInterval(interval);
//       }, [images.length]);
    
//       // Calcula altura del contenedor según su ancho (aspect ratio)
//       useEffect(() => {
//         const calculateHeight = () => {
//           if (containerRef.current) {
//             const width = containerRef.current.offsetWidth;
//             setCarouselHeight(width * 0.4); // 40% del ancho como alto
//           }
//         };
//         calculateHeight();
//         window.addEventListener("resize", calculateHeight);
//         return () => window.removeEventListener("resize", calculateHeight);
//       }, []);
//     return (
//         <>
//             <nav className="navbar navbar-expand-lg bg-dark p-0">
//                 <div className="container">
//                     <Link className="navbar-brand" to="/"><img src={tibacklogo} alt="" className="w-25 rounded-2" /></Link>
//                     <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
//                         <span className="navbar-toggler-icon"></span>
//                     </button>
//                     <div className="collapse navbar-collapse " id="navbarSupportedContent">
//                         <ul className="navbar-nav ms-auto mb-2 mb-lg-0 text-light">
//                             <li className="nav-item">
//                                 <Link to="/Home" className="nav-link active text-light" aria-current="page">Home</Link>
//                             </li>
//                             <li className="nav-item">
//                                 <Link to="/AboutUs" className="nav-link text-light" aria-current="page">Acerca de</Link>
//                             </li>
//                             <li className="nav-item">
//                                 <Link to="/Contact" className="nav-link text-light" aria-current="page">Contactanos</Link>
//                             </li>
//                             <li className="nav-item dropdown">
//                                 <a className="nav-link dropdown-toggle text-light" href="#" role="button" data-bs-toggle="dropdown-dark" aria-expanded="false">
//                                     Dropdown
//                                 </a>
//                                 <ul className="dropdown-menu bg-dark">
//                                     <li><a className="dropdown-item text-light" href="#">Action</a></li>
//                                     <li><a className="dropdown-item text-light" href="#">Another action</a></li>
//                                     <li><hr className="dropdown-divider" /></li>
//                                     <li><a className="dropdown-item text-light" href="#">Something else here</a></li>
//                                 </ul>
//                             </li>
//                             <li className="nav-item">

//                             </li>
//                         </ul>
//                     </div>
//                 </div>
//             </nav>

//             <div
//                 ref={containerRef}
//                 className="position-relative w-100"
//                 style={{ height: carouselHeight, minHeight: "200px", overflow: "hidden" }}
//             >
//                 {/* Fade carousel: todas las imágenes absolutas */}
//                 {images.map((src, index) => (
//                     <img
//                         key={index}
//                         src={src}
//                         alt={`Slide ${index + 1}`}
//                         className="position-absolute object-fit-cover top-0 start-50 translate-middle-x w-100 h-100"
//                         style={{
//                             transition: "opacity 1s ease-in-out",
//                             opacity: index === currentIndex ? 1 : 0,
//                         }}
//                     />
//                 ))}

//                 {/* Texto centrado */}
//                 <div className="position-absolute top-50 start-50 translate-middle text-center rounded-2 shadow p-3 mb-5 text-light bg-secondary bg-opacity-50">
//                     <h1 style={{ fontSize: "clamp(1.5rem, 5vw, 4rem)", lineHeight: 1.4 }}>
//                         Bienvenidos <br /> a <br /> TiBACK
//                     </h1>
//                     <p style={{ fontSize: "clamp(1rem, 2.5vw, 1.8rem)" }} className="mt-5">
//                         Tu turno, tu tiempo, tu solución. Con la velocidad que mereces.
//                     </p>
//                 </div>
//             </div>
//         </>
//     )
// }
