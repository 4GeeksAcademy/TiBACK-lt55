import { Link } from "react-router-dom";
import tibacklogo from "../../assets/img/logo2.png";
import { useState, useEffect, useRef } from "react";
import "./StyleComponenet/NavbarPrincipal.css";

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
        className={`navbar navbar-expand-lg p-0 ${isScrolled
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
                <Link to="/" className={`${isScrolled ? "nav-link text-dark" : "nav-link text-light fs-5 px-3"}`}>
                  Inicio
                </Link>
              </li>
              <li className="nav-item">
                <Link to="/AboutUs" className={`${isScrolled ? "nav-link text-dark" : "nav-link text-light fs-5 px-3"}`}>
                  Acerca de
                </Link>
              </li>
              <li className="nav-item">
                <Link to="/Contact" className={`${isScrolled ? "nav-link text-dark" : "nav-link text-light fs-5 px-3"}`}>
                  Contáctanos
                </Link>
              </li>
              <li className="nav-item">
                <Link to="/Home" type="button" className={`${isScrolled ? "btn btn-outline-dark ms-5" : "btn btn-primary ms-5"}`}>
                  Ingresar
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </nav>

      {/* --- Carrusel con texto --- */}
      <div
        ref={containerRef}
        className="position-relative w-100 bg-info-subtle"
        style={{ height: carouselHeight, minHeight: "200px", overflow: "hidden" }}
      >
        {/* Slides */}
        {images.map((src, index) => (
          <img
            key={index}
            src={src}
            alt={`Slide ${index + 1}`}
            className="cutter position-absolute object-fit-cover top-0 start-50 translate-middle-x w-100 h-100"
            style={{
              transition: "opacity 1s ease-in-out",
              opacity: index === currentSlide ? 1 : 0,
            }}
          />
        ))}

        {/* Texto animado */}
        <div className="text-shutter-container position-absolute top-50 end-0 translate-middle-y text-center shadow p-3 mb-5 text-light bg-primary">
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
