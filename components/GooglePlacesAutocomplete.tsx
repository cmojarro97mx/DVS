
import React, { useRef, useEffect, useState } from 'react';

interface GooglePlacesAutocompleteProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    hasError?: boolean;
    name: string;
}

declare global {
    interface Window {
        google: any;
        initGoogleMaps: () => void;
    }
}

export const GooglePlacesAutocomplete: React.FC<GooglePlacesAutocompleteProps> = ({
    value,
    onChange,
    placeholder,
    hasError,
    name,
}) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const autocompleteRef = useRef<any>(null);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        // Check if Google Maps API is already loaded
        if (window.google && window.google.maps && window.google.maps.places) {
            setIsLoaded(true);
            return;
        }

        // Load Google Maps API
        const script = document.createElement('script');
        const apiKey = import.meta.env.VITE_GOOGLE_MAPS_KEY || '';
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initGoogleMaps`;
        script.async = true;
        script.defer = true;
        
        window.initGoogleMaps = () => {
            setIsLoaded(true);
        };

        document.head.appendChild(script);

        return () => {
            if (script.parentNode) {
                script.parentNode.removeChild(script);
            }
        };
    }, []);

    useEffect(() => {
        if (!isLoaded || !inputRef.current) return;

        // Initialize autocomplete
        autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
            types: ['address'],
        });

        // Add listener for place selection
        autocompleteRef.current.addListener('place_changed', () => {
            const place = autocompleteRef.current.getPlace();
            if (place.formatted_address) {
                onChange(place.formatted_address);
            }
        });

        return () => {
            if (autocompleteRef.current) {
                window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
            }
        };
    }, [isLoaded, onChange]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange(e.target.value);
    };

    return (
        <input
            ref={inputRef}
            type="text"
            name={name}
            value={value}
            onChange={handleInputChange}
            placeholder={placeholder}
            className={`block w-full px-3 py-2 bg-gray-50/50 border rounded-md text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${hasError ? 'border-red-500' : 'border-gray-300'} text-gray-900`}
            autoComplete="off"
        />
    );
};
