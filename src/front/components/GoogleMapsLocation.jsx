import React, { useEffect, useRef, useState } from 'react';
import { useGoogleMaps } from '../hooks/useGoogleMaps';

const GoogleMapsLocation = ({
    onLocationChange,
    initialAddress = '',
    initialLat = null,
    initialLng = null
}) => {
    const mapRef = useRef(null);
    const autocompleteRef = useRef(null);
    const markerRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const [address, setAddress] = useState(initialAddress);
    const [coordinates, setCoordinates] = useState({
        lat: initialLat || 19.4326,
        lng: initialLng || -99.1332
    });
    const { isLoaded, error } = useGoogleMaps();

    useEffect(() => {
        if (!isLoaded || error) return;

        const initializeMap = () => {
            if (!window.google || !window.google.maps) {
                console.error('Google Maps API no está disponible');
                return;
            }

            // Suprimir warnings específicos de Google Maps API
            const originalConsoleWarn = console.warn;
            console.warn = (...args) => {
                const message = args.join(' ');
                // Suprimir warnings específicos de Google Maps
                if (
                    message.includes('google.maps.Marker is deprecated') ||
                    message.includes('Please use google.maps.marker.AdvancedMarkerElement') ||
                    message.includes('As of February 21st, 2024, google.maps.Marker is deprecated') ||
                    message.includes('google.maps.places.Autocomplete is not available to new customers') ||
                    message.includes('Please use google.maps.places.PlaceAutocompleteElement instead') ||
                    message.includes('As of March 1st, 2025, google.maps.places.Autocomplete')
                ) {
                    return; // No mostrar estos warnings
                }
                originalConsoleWarn.apply(console, args);
            };

            // Inicializar el mapa
            const map = new window.google.maps.Map(mapRef.current, {
                center: { lat: coordinates.lat, lng: coordinates.lng },
                zoom: 15,
                mapTypeControl: true,
                streetViewControl: true,
                fullscreenControl: true,
                zoomControl: true
            });

            mapInstanceRef.current = map;

            // Crear marcador
            const marker = new window.google.maps.Marker({
                position: { lat: coordinates.lat, lng: coordinates.lng },
                map: map,
                draggable: true,
                title: 'Tu ubicación'
            });

            markerRef.current = marker;

            // Configurar autocompletado
            const autocomplete = new window.google.maps.places.Autocomplete(autocompleteRef.current, {
                types: ['address']
            });

            // Cuando se selecciona una dirección del autocompletado
            autocomplete.addListener('place_changed', () => {
                const place = autocomplete.getPlace();
                if (place.geometry && place.geometry.location) {
                    const lat = place.geometry.location.lat();
                    const lng = place.geometry.location.lng();

                    setCoordinates({ lat, lng });
                    setAddress(place.formatted_address);

                    // Mover el marcador y el mapa
                    marker.setPosition({ lat, lng });
                    map.setCenter({ lat, lng });

                    // Notificar al componente padre
                    onLocationChange({
                        address: place.formatted_address,
                        lat,
                        lng
                    });
                }
            });

            // Cuando se mueve el marcador
            marker.addListener('dragend', () => {
                const newPosition = marker.getPosition();
                const lat = newPosition.lat();
                const lng = newPosition.lng();

                setCoordinates({ lat, lng });

                // Geocodificación inversa para obtener la dirección
                const geocoder = new window.google.maps.Geocoder();
                geocoder.geocode({ location: { lat, lng } }, (results, status) => {
                    if (status === 'OK' && results[0]) {
                        const newAddress = results[0].formatted_address;
                        setAddress(newAddress);

                        // Notificar al componente padre
                        onLocationChange({
                            address: newAddress,
                            lat,
                            lng
                        });
                    }
                });
            });

            // Centrar el mapa cuando se mueve el marcador
            marker.addListener('drag', () => {
                const newPosition = marker.getPosition();
                map.panTo(newPosition);
            });
        };

        // Inicializar el mapa cuando Google Maps esté listo
        initializeMap();

        return () => {
            // Cleanup
            if (markerRef.current) {
                markerRef.current.setMap(null);
            }
        };
    }, [isLoaded, error, coordinates.lat, coordinates.lng, onLocationChange]);

    const handleAddressChange = (e) => {
        setAddress(e.target.value);
    };

    // Mostrar estado de carga
    if (!isLoaded) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
                <div className="text-center">
                    <div className="spinner-border text-primary mb-3" role="status">
                        <span className="visually-hidden">Cargando mapa...</span>
                    </div>
                    <p className="text-muted">Cargando Google Maps...</p>
                </div>
            </div>
        );
    }

    // Mostrar error
    if (error) {
        return (
            <div className="alert alert-danger" role="alert">
                <i className="fas fa-exclamation-triangle me-2"></i>
                Error al cargar Google Maps: {error.message}
            </div>
        );
    }

    return (
        <div className="google-maps-location">
            <div className="mb-3">
                <label htmlFor="address-input" className="form-label">
                    Dirección <span className="text-danger">*</span>
                </label>
                <input
                    ref={autocompleteRef}
                    id="address-input"
                    type="text"
                    className="form-control"
                    placeholder="Escribe tu dirección..."
                    value={address}
                    onChange={handleAddressChange}
                    required
                />
                <div className="form-text">
                    Escribe tu dirección (cualquier país) y selecciona una opción del menú desplegable,
                    o mueve el marcador en el mapa para ajustar la ubicación.
                </div>
            </div>

            <div className="mb-3">
                <div className="row">
                    <div className="col-md-6">
                        <label className="form-label">Latitud</label>
                        <input
                            type="text"
                            className="form-control"
                            value={coordinates.lat ? coordinates.lat.toFixed(6) : ''}
                            readOnly
                        />
                    </div>
                    <div className="col-md-6">
                        <label className="form-label">Longitud</label>
                        <input
                            type="text"
                            className="form-control"
                            value={coordinates.lng ? coordinates.lng.toFixed(6) : ''}
                            readOnly
                        />
                    </div>
                </div>
            </div>

            <div className="map-container" style={{ height: '400px', width: '100%' }}>
                <div
                    ref={mapRef}
                    style={{ height: '100%', width: '100%', borderRadius: '8px' }}
                />
            </div>

            <div className="mt-2">
                <small className="text-muted">
                    <i className="fas fa-info-circle me-1"></i>
                    Puedes arrastrar el marcador rojo para ajustar tu ubicación exacta.
                </small>
            </div>
        </div>
    );
};

export default GoogleMapsLocation;