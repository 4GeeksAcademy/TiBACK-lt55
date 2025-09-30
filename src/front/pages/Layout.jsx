import { Outlet, useLocation } from "react-router-dom";
import ScrollToTop from "../components/ScrollToTop";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";

export const Layout = () => {
    const location = useLocation();

    // Ocultar Navbar y Footer en /auth
    const hideNavAndFooter = location.pathname.startsWith("/auth");

    return (
        <ScrollToTop>
            {!hideNavAndFooter && <Navbar />}
            <Outlet />
            {!hideNavAndFooter && <Footer />}
        </ScrollToTop>
    );
};

export default Layout;
