import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { authActions } from '../../store';
import { useNavigate } from 'react-router-dom';

export const Header = ({ toggleSidebar, sidebarHidden, changeView, isDarkMode, toggleTheme }) => {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [showSearchResults, setShowSearchResults] = useState(false);
    const [showUserDropdown, setShowUserDropdown] = useState(false);

    const userData = useSelector(state => state.auth.userData);
    const tickets = useSelector(state => state.tickets.tickets);

    useEffect(() => {
        // Cerrar el dropdown al hacer clic fuera
        const handleClickOutside = (event) => {
            if (!event.target.closest('.dropdown')) {
                setShowUserDropdown(false);
            }
        };
        
        document.addEventListener('click', handleClickOutside);
        return () => {
            document.removeEventListener('click', handleClickOutside);
        }
    }, []);
    
    const handleSearch = (query) => {
        setSearchQuery(query);
        if (query.length > 2) {
            const results = tickets.filter(ticket =>
                ticket.titulo.toLowerCase().includes(query.toLowerCase())
            );
            setSearchResults(results);
            setShowSearchResults(true);
        } else {
            setSearchResults([]);
            setShowSearchResults(false);
        }
    };

    const closeSearchResults = () => {
        setShowSearchResults(false);
    };
    return (
        <header className="hyper-header bg-white border-bottom p-3">
            <div className="d-flex align-items-center justify-content-between w-100">
                <div className="d-flex align-items-center gap-3">
                    <button
                        className="hyper-sidebar-toggle btn btn-link p-2"
                        onClick={toggleSidebar}
                        title={sidebarHidden ? "Mostrar menú" : "Ocultar menú"}
                    >
                        <i className="fas fa-bars"></i>
                    </button>

                    <div className="hyper-search position-relative">
                        <i className="fas fa-search position-absolute top-50 start-0 translate-middle-y ms-3 text-muted"></i>
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Buscar tickets por título..."
                            value={searchQuery}
                            onChange={(e) => handleSearch(e.target.value)}
                            onFocus={() => {
                                if (searchResults.length > 0) {
                                    setShowSearchResults(true);
                                }
                            }}
                        />

                        {/* Resultados de búsqueda */}
                        {showSearchResults && searchResults.length > 0 && (
                            <div className="position-absolute w-100 bg-white border border-top-0 rounded-bottom shadow-lg dropdown-menu-custom">
                                <div className="p-3">
                                    <div className="d-flex justify-content-between align-items-center mb-3 w-100">
                                        <small className="text-muted fw-semibold">

                                            Tickets encontrados ({searchResults.length})
                                        </small>
                                        <button
                                            className="btn btn-sm btn-outline-secondary ms-3"
                                            onClick={closeSearchResults}
                                            title="Cerrar resultados"
                                        >
                                            <span>X</span>
                                        </button>
                                    </div>
                                    {searchResults.map((ticket) => (
                                        <div
                                            key={ticket.id}
                                            className="search-result-item p-2 border-bottom cursor-pointer"
                                            onClick={() => selectTicketFromSearch(ticket)}
                                            onMouseEnter={(e) => e.target.style.backgroundColor = 'var(--ct-gray-100)'}
                                            onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                                        >
                                            <div className="d-flex justify-content-between align-items-start">
                                                <div className="flex-grow-1">
                                                    <div className="fw-semibold text-primary">#{ticket.id}</div>
                                                    <div className="text-dark">{ticket.titulo}</div>
                                                    <small className="text-muted">
                                                        {ticket.descripcion.length > 60
                                                            ? `${ticket.descripcion.substring(0, 60)}...`
                                                            : ticket.descripcion
                                                        }
                                                    </small>
                                                </div>
                                                <div className="ms-2">
                                                    <span className={`badge ${ticket.estado.toLowerCase() === 'solucionado' ? 'bg-success' :
                                                        ticket.estado.toLowerCase() === 'en_proceso' ? 'bg-warning' :
                                                            ticket.estado.toLowerCase() === 'en_espera' ? 'bg-info' :
                                                                'bg-primary'
                                                        }`}>
                                                        {ticket.estado}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="d-flex align-items-center gap-2">
                    {/* Dropdown del usuario */}
                    <div className="position-relative dropdown">
                        <button
                            className="btn btn-link d-flex align-items-center gap-2 text-decoration-none"
                            onClick={() => {
                                console.log('ClientePage - Dropdown toggle clicked, current state:', showUserDropdown);
                                setShowUserDropdown(!showUserDropdown);
                                console.log('ClientePage - Dropdown state set to:', !showUserDropdown);
                            }}
                        >
                            {userData?.url_imagen ? (
                                <img
                                    src={userData.url_imagen}
                                    alt="Avatar"
                                    className="avatar-header-normal rounded-circle"
                                />
                            ) : (
                                <div className="avatar-header-normal bg-primary d-flex align-items-center justify-content-center rounded-circle">
                                    <i className="fas fa-user text-white"></i>
                                </div>
                            )}
                            <span className="fw-semibold">
                                {userData?.nombre === 'Pendiente' ? 'Cliente' : userData?.nombre}
                            </span>
                            <i className="fas fa-chevron-down"></i>
                        </button>

                        {showUserDropdown && (
                            <>
                                {console.log('ClientePage - Rendering dropdown, showUserDropdown:', showUserDropdown)}
                                <div className="position-absolute end-0 mt-2 bg-white border rounded shadow-lg dropdown-menu-min-width" style={{ zIndex: 9999, minWidth: '200px' }}>
                                    <div className="p-3 border-bottom">
                                        <div className="fw-semibold">
                                            {userData?.nombre === 'Pendiente' ? 'Cliente' : userData?.nombre}
                                        </div>
                                        <small className="text-muted">Cliente</small>
                                    </div>
                                    <div className="p-2">
                                        <button
                                            className="btn btn-link w-100 text-start d-flex align-items-center gap-2"
                                            onClick={() => {
                                                console.log('ClientePage - Mi Perfil button clicked');
                                                changeView('profile');
                                                setShowUserDropdown(false);
                                                console.log('ClientePage - Dropdown closed, view changed to profile');
                                            }}
                                        >
                                            <i className="fas fa-user-edit"></i>
                                            Mi Perfil
                                        </button>
                                        <div className="d-flex align-items-center justify-content-between p-2">
                                            <span className="small">Modo Oscuro</span>
                                            <div className="form-check form-switch">
                                                <input
                                                    className="form-check-input"
                                                    type="checkbox"
                                                    checked={isDarkMode}
                                                    onChange={toggleTheme}
                                                />
                                            </div>
                                        </div>
                                        <hr className="my-2" />
                                        <button
                                            className="btn btn-link w-100 text-start text-danger d-flex align-items-center gap-2"
                                            onClick={logout}
                                        >
                                            <i className="fas fa-sign-out-alt"></i>
                                            Cerrar Sesión
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </header>
    )
}