
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
    const observerRef = useRef<MutationObserver | null>(null);
    const [autocompleteStatus, setAutocompleteStatus] = useState<'loading' | 'ready' | 'unavailable'>('loading');

    // Function to forcefully unlock the input
    const unlockInput = () => {
        if (inputRef.current) {
            inputRef.current.readOnly = false;
            inputRef.current.disabled = false;
            
            // Clear error message if Google injected it
            if (inputRef.current.value === 'Oops! Something went wrong.') {
                inputRef.current.value = value;
            }
        }
    };

    // Function to destroy autocomplete and fall back to manual input
    const destroyAutocomplete = () => {
        console.log(`[GooglePlacesAutocomplete ${name}] Destroying autocomplete, falling back to manual input`);
        
        // Clean up autocomplete
        if (autocompleteRef.current) {
            try {
                window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
            } catch (error) {
                console.warn(`[GooglePlacesAutocomplete ${name}] Error clearing listeners:`, error);
            }
            autocompleteRef.current = null;
        }

        // Stop observing
        if (observerRef.current) {
            observerRef.current.disconnect();
            observerRef.current = null;
        }

        // Unlock input
        unlockInput();

        // Set status to unavailable
        setAutocompleteStatus('unavailable');
    };

    useEffect(() => {
        console.log(`[GooglePlacesAutocomplete ${name}] Component mounted, attempting to load API`);
        
        loadGoogleMapsScript()
            .then(() => {
                console.log(`[GooglePlacesAutocomplete ${name}] API loaded successfully`);
                setAutocompleteStatus('ready');
            })
            .catch((error) => {
                console.warn(`[GooglePlacesAutocomplete ${name}] API unavailable, using manual input:`, error.message);
                setAutocompleteStatus('unavailable');
            });
    }, [name]);

    useEffect(() => {
        // Only initialize autocomplete if API loaded successfully
        if (autocompleteStatus !== 'ready' || !inputRef.current) {
            console.log(`[GooglePlacesAutocomplete ${name}] Skipping autocomplete init - status: ${autocompleteStatus}`);
            return;
        }

        try {
            console.log(`[GooglePlacesAutocomplete ${name}] Attempting to initialize Places Autocomplete`);
            
            // Create autocomplete instance
            const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
                types: ['address'],
            });

            // Store reference
            autocompleteRef.current = autocomplete;

            // Listen for place selection
            autocomplete.addListener('place_changed', () => {
                try {
                    const place = autocomplete.getPlace();
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

            // Set up MutationObserver to watch for Google blocking the input
            observerRef.current = new MutationObserver((mutations) => {
                for (const mutation of mutations) {
                    if (mutation.type === 'attributes' && inputRef.current) {
                        const isDisabled = inputRef.current.disabled;
                        const isReadOnly = inputRef.current.readOnly;
                        const hasErrorMessage = inputRef.current.value === 'Oops! Something went wrong.';

                        if (isDisabled || isReadOnly || hasErrorMessage) {
                            console.error(`[GooglePlacesAutocomplete ${name}] Google blocked the input! Disabling autocomplete.`);
                            destroyAutocomplete();
                            return;
                        }
                    }
                }
            });

            // Start observing
            observerRef.current.observe(inputRef.current, {
                attributes: true,
                attributeFilter: ['disabled', 'readonly', 'value'],
            });

            // Also check immediately after a short delay (Google might block it asynchronously)
            setTimeout(() => {
                if (inputRef.current) {
                    const isDisabled = inputRef.current.disabled;
                    const isReadOnly = inputRef.current.readOnly;
                    const hasErrorMessage = inputRef.current.value === 'Oops! Something went wrong.';

                    if (isDisabled || isReadOnly || hasErrorMessage) {
                        console.error(`[GooglePlacesAutocomplete ${name}] Google blocked the input on initialization! Disabling autocomplete.`);
                        destroyAutocomplete();
                    } else {
                        console.log(`[GooglePlacesAutocomplete ${name}] Autocomplete initialized successfully, input is editable`);
                    }
                }
            }, 500);

        } catch (error) {
            // If initialization fails, fall back to manual input
            console.error(`[GooglePlacesAutocomplete ${name}] Failed to initialize autocomplete:`, error);
            destroyAutocomplete();
        }

        return () => {
            // Cleanup on unmount
            if (autocompleteRef.current) {
                try {
                    console.log(`[GooglePlacesAutocomplete ${name}] Cleaning up autocomplete on unmount`);
                    window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
                } catch (error) {
                    console.warn(`[GooglePlacesAutocomplete ${name}] Failed to clean up:`, error);
                }
            }

            if (observerRef.current) {
                observerRef.current.disconnect();
            }
        };
    }, [autocompleteStatus, name, value, onChange]);

    // Continuously ensure input stays unlocked
    useEffect(() => {
        const interval = setInterval(() => {
            unlockInput();
        }, 100);

        return () => clearInterval(interval);
    }, [value]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Always allow manual input
        onChange(e.target.value);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        // Prevent form submission on Enter
        if (e.key === 'Enter') {
            e.preventDefault();
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
            />
            {autocompleteStatus === 'loading' && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                </div>
            )}
            {autocompleteStatus === 'unavailable' && (
                <p className="mt-1 text-xs text-amber-600 flex items-center gap-1">
                    <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <span>Address autocomplete unavailable - type address manually</span>
                </p>
            )}
            {autocompleteStatus === 'ready' && (
                <p className="mt-1 text-xs text-green-600 flex items-center gap-1">
                    <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Address suggestions enabled - start typing</span>
                </p>
            )}
        </div>
    );
};
