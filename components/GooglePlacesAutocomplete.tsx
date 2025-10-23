
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
        googleMapsLoader?: Promise<void>;
    }
}

async function loadGoogleMapsScript(): Promise<void> {
    if (window.google && window.google.maps && window.google.maps.places) {
        return Promise.resolve();
    }

    if (window.googleMapsLoader) {
        return window.googleMapsLoader;
    }

    window.googleMapsLoader = new Promise<void>(async (resolve, reject) => {
        try {
            const response = await fetch('/api/config/google-maps-key');
            const data = await response.json();
            const apiKey = data.apiKey || '';
            
            if (!apiKey) {
                console.warn('Google Maps API key not available - using manual input mode');
                reject(new Error('Google Maps API key not available'));
                return;
            }

            const script = document.createElement('script');
            script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
            script.async = true;
            script.defer = true;
            
            script.onload = () => {
                resolve();
            };
            
            script.onerror = (error) => {
                reject(error);
            };

            document.head.appendChild(script);
        } catch (error) {
            console.warn('Failed to load Google Maps API - using manual input mode:', error);
            reject(error);
        }
    });

    return window.googleMapsLoader;
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
    const [loadError, setLoadError] = useState(false);
    const [isLoadingApi, setIsLoadingApi] = useState(true);

    useEffect(() => {
        loadGoogleMapsScript()
            .then(() => {
                setIsLoaded(true);
                setLoadError(false);
                setIsLoadingApi(false);
            })
            .catch((error) => {
                console.warn('Google Maps autocomplete not available:', error.message);
                setLoadError(true);
                setIsLoaded(false);
                setIsLoadingApi(false);
            });
    }, []);

    useEffect(() => {
        if (!isLoaded || !inputRef.current) return;

        try {
            autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
                types: ['address'],
            });

            autocompleteRef.current.addListener('place_changed', () => {
                const place = autocompleteRef.current.getPlace();
                if (place.formatted_address) {
                    onChange(place.formatted_address);
                }
            });
        } catch (error) {
            console.error('Failed to initialize Google Places Autocomplete:', error);
            setLoadError(true);
        }

        return () => {
            if (autocompleteRef.current) {
                try {
                    window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
                } catch (error) {
                    console.warn('Failed to clear autocomplete listeners:', error);
                }
            }
        };
    }, [isLoaded, onChange]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange(e.target.value);
    };

    return (
        <div className="relative">
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
            {isLoadingApi && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                </div>
            )}
            {loadError && !isLoadingApi && (
                <p className="mt-1 text-xs text-amber-600 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    Autocomplete not available - you can type the address manually
                </p>
            )}
            {isLoaded && !loadError && (
                <p className="mt-1 text-xs text-green-600 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Autocomplete enabled - start typing to search
                </p>
            )}
        </div>
    );
};
