import React, { useEffect, useRef, useState } from 'react';

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

    useEffect(() => {
        const initializeMap = () => {
            if (!window.google || !window.google.maps || !window.google.maps.places) {
                console.error('Google Maps API o la librería Places no está cargada');
                return;
            }

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

            // Configurar autocompletado SOLO si places está disponible
            if (window.google.maps.places && window.google.maps.places.Autocomplete) {
                const autocomplete = new window.google.maps.places.Autocomplete(autocompleteRef.current, {
                    types: ['address']
                });

                autocomplete.addListener('place_changed', () => {
                    const place = autocomplete.getPlace();
                    if (place.geometry && place.geometry.location) {
                        const lat = place.geometry.location.lat();
                        const lng = place.geometry.location.lng();
                        setCoordinates({ lat, lng });
                        setAddress(place.formatted_address);
                        marker.setPosition({ lat, lng });
                        map.setCenter({ lat, lng });
                        onLocationChange({ address: place.formatted_address, lat, lng });
                    }
                });
            } else {
                console.error('Autocomplete no está disponible. La librería Places no se cargó correctamente.');
            }

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
                        onLocationChange({ address: newAddress, lat, lng });
                    }
                });
            });
            // Centrar el mapa cuando se mueve el marcador
            marker.addListener('drag', () => {
                const newPosition = marker.getPosition();
                map.panTo(newPosition);
            });
        };

        // Cargar la API de Google Maps si no está cargada o si falta la librería places
        const isGoogleLoaded = window.google && window.google.maps;
        const isPlacesLoaded = isGoogleLoaded && window.google.maps.places && window.google.maps.places.Autocomplete;
        if (!isGoogleLoaded || !isPlacesLoaded) {
            // Eliminar script previo si existe y no tiene places
            const existingScript = document.querySelector('script[src*="maps.googleapis.com/maps/api/js"]');
            if (existingScript) {
                existingScript.remove();
            }
            const script = document.createElement('script');
            script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&libraries=places`;
            script.async = true;
            script.defer = true;
            script.onload = initializeMap;
            document.head.appendChild(script);
        } else {
            initializeMap();
        }

        return () => {
            // Cleanup
            if (markerRef.current) {
                markerRef.current.setMap(null);
            }
        };
    }, []);

    const handleAddressChange = (e) => {
        setAddress(e.target.value);
    };

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
