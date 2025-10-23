
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
        googleMapsLoadError?: Error;
    }
}

async function loadGoogleMapsScript(): Promise<void> {
    if (window.google && window.google.maps && window.google.maps.places) {
        console.log('[GoogleMaps] API already loaded');
        return Promise.resolve();
    }

    if (window.googleMapsLoadError) {
        console.warn('[GoogleMaps] Previous load failed, rejecting');
        return Promise.reject(window.googleMapsLoadError);
    }

    if (window.googleMapsLoader) {
        console.log('[GoogleMaps] Already loading, waiting for existing promise');
        return window.googleMapsLoader;
    }

    console.log('[GoogleMaps] Starting to load API');
    window.googleMapsLoader = new Promise<void>(async (resolve, reject) => {
        try {
            const response = await fetch('/api/config/google-maps-key');
            const data = await response.json();
            const apiKey = data.apiKey || '';
            
            if (!apiKey) {
                const error = new Error('Google Maps API key not configured');
                window.googleMapsLoadError = error;
                console.warn('[GoogleMaps] API key not available');
                reject(error);
                return;
            }

            console.log('[GoogleMaps] API key received, loading script');
            const script = document.createElement('script');
            script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
            script.async = true;
            script.defer = true;
            
            script.onload = () => {
                console.log('[GoogleMaps] Script loaded successfully');
                if (window.google && window.google.maps && window.google.maps.places) {
                    console.log('[GoogleMaps] Places API confirmed available');
                    resolve();
                } else {
                    const error = new Error('Google Maps loaded but Places API not available');
                    window.googleMapsLoadError = error;
                    console.error('[GoogleMaps]', error.message);
                    reject(error);
                }
            };
            
            script.onerror = (error) => {
                const err = new Error('Failed to load Google Maps script');
                window.googleMapsLoadError = err;
                console.error('[GoogleMaps] Script load error:', error);
                reject(err);
            };

            document.head.appendChild(script);
        } catch (error) {
            const err = error instanceof Error ? error : new Error('Unknown error loading Google Maps');
            window.googleMapsLoadError = err;
            console.error('[GoogleMaps] Load error:', err);
            reject(err);
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
    const [loadError, setLoadError] = useState<string | null>(null);
    const [isLoadingApi, setIsLoadingApi] = useState(true);

    useEffect(() => {
        console.log(`[GooglePlacesAutocomplete ${name}] Component mounted, loading API`);
        
        loadGoogleMapsScript()
            .then(() => {
                console.log(`[GooglePlacesAutocomplete ${name}] API loaded successfully`);
                setIsLoaded(true);
                setLoadError(null);
                setIsLoadingApi(false);
            })
            .catch((error) => {
                console.warn(`[GooglePlacesAutocomplete ${name}] API load failed:`, error.message);
                setLoadError(error.message);
                setIsLoaded(false);
                setIsLoadingApi(false);
            });
    }, [name]);

    useEffect(() => {
        if (!isLoaded || !inputRef.current) {
            console.log(`[GooglePlacesAutocomplete ${name}] Skipping autocomplete init - not ready`);
            return;
        }

        try {
            console.log(`[GooglePlacesAutocomplete ${name}] Initializing Places Autocomplete`);
            
            autocompleteRef.current = new window.google.maps.places.Autocomplete(inputRef.current, {
                types: ['address'],
            });

            autocompleteRef.current.addListener('place_changed', () => {
                try {
                    const place = autocompleteRef.current.getPlace();
                    console.log(`[GooglePlacesAutocomplete ${name}] Place selected:`, place);
                    
                    if (place.formatted_address) {
                        onChange(place.formatted_address);
                    } else if (place.name) {
                        onChange(place.name);
                    }
                } catch (error) {
                    console.error(`[GooglePlacesAutocomplete ${name}] Error getting place:`, error);
                }
            });

            console.log(`[GooglePlacesAutocomplete ${name}] Autocomplete initialized successfully`);
        } catch (error) {
            console.error(`[GooglePlacesAutocomplete ${name}] Failed to initialize autocomplete:`, error);
            setLoadError('Failed to initialize autocomplete');
            setIsLoaded(false);
        }

        return () => {
            if (autocompleteRef.current) {
                try {
                    console.log(`[GooglePlacesAutocomplete ${name}] Cleaning up autocomplete`);
                    window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
                } catch (error) {
                    console.warn(`[GooglePlacesAutocomplete ${name}] Failed to clean up:`, error);
                }
            }
        };
    }, [isLoaded, onChange, name]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange(e.target.value);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        // Allow Enter key to work normally for manual input
        if (e.key === 'Enter') {
            e.stopPropagation();
        }
    };

    return (
        <div className="relative">
            <input
                ref={inputRef}
                type="text"
                name={name}
                value={value}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                className={`block w-full px-3 py-2 bg-gray-50/50 border rounded-md text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${hasError ? 'border-red-500' : 'border-gray-300'} text-gray-900`}
                autoComplete="off"
                disabled={false}
            />
            {isLoadingApi && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                </div>
            )}
            {loadError && !isLoadingApi && (
                <div className="mt-1">
                    <p className="text-xs text-amber-600 flex items-center gap-1">
                        <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <span>Address autocomplete unavailable - type manually</span>
                    </p>
                    {loadError.includes('API key') && (
                        <p className="text-xs text-gray-500 mt-1 ml-4">
                            Contact your administrator to configure Google Maps API
                        </p>
                    )}
                </div>
            )}
            {isLoaded && !loadError && (
                <p className="mt-1 text-xs text-green-600 flex items-center gap-1">
                    <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Address suggestions enabled</span>
                </p>
            )}
        </div>
    );
};
