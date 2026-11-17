import React, { useEffect, useMemo, useRef, useState } from 'react';
import { COUNTRIES, findCountry } from '../utils/countries';

const CountrySelect = ({
    value,
    onChange,
    onCountrySelect,
    required = false,
    disabled = false,
    className = '',
    placeholder = 'Search any country'
}) => {
    const [query, setQuery] = useState(value || '');
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);

    useEffect(() => {
        setQuery(value || '');
    }, [value]);

    useEffect(() => {
        const closeOnOutsideClick = (event) => {
            if (!containerRef.current?.contains(event.target)) setIsOpen(false);
        };
        document.addEventListener('mousedown', closeOnOutsideClick);
        return () => document.removeEventListener('mousedown', closeOnOutsideClick);
    }, []);

    const filteredCountries = useMemo(() => {
        const normalizedQuery = query.trim().toLowerCase();
        if (!normalizedQuery) return COUNTRIES;
        return COUNTRIES.filter((country) =>
            `${country.name} ${country.isoCode} ${country.dialCode}`.toLowerCase().includes(normalizedQuery)
        );
    }, [query]);

    const selectCountry = (country) => {
        setQuery(country.name);
        setIsOpen(false);
        onChange(country.name);
        onCountrySelect?.(country);
    };

    const handleChange = (event) => {
        const nextValue = event.target.value;
        setQuery(nextValue);
        setIsOpen(true);
        onChange(nextValue);
        const exactCountry = findCountry(nextValue);
        if (exactCountry) onCountrySelect?.(exactCountry);
    };

    return (
        <div ref={containerRef} className="relative w-full">
            <input
                type="text"
                value={query}
                onChange={handleChange}
                onFocus={() => setIsOpen(true)}
                autoComplete="country-name"
                required={required}
                disabled={disabled}
                placeholder={placeholder}
                aria-label="Country"
                aria-expanded={isOpen}
                className={className}
            />
            {isOpen && !disabled && (
                <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-60 overflow-y-auto rounded-lg border border-gray-200 bg-white py-1 shadow-xl">
                    {filteredCountries.length ? filteredCountries.map((country) => (
                        <button
                            type="button"
                            key={country.isoCode}
                            onClick={() => selectCountry(country)}
                            className="flex w-full items-center justify-between px-3 py-2 text-left text-sm text-gray-700 hover:bg-indigo-50"
                        >
                            <span>{country.name}</span>
                            <span className="ml-3 shrink-0 text-xs text-gray-400">
                                {country.isoCode} {country.dialCode}
                            </span>
                        </button>
                    )) : (
                        <p className="px-3 py-2 text-sm text-gray-500">No country found</p>
                    )}
                </div>
            )}
        </div>
    );
};

export default CountrySelect;
