import React, { useId } from 'react';
import { AFRICAN_COUNTRIES } from '../utils/africanCountries';

const CountrySelect = ({ value, onChange, required = false, disabled = false, className = '', placeholder = 'Type or select an African country' }) => {
    const listId = useId();
    return (
        <>
            <input
                type="text"
                list={listId}
                value={value || ''}
                onChange={(event) => onChange(event.target.value)}
                autoComplete="country-name"
                required={required}
                disabled={disabled}
                placeholder={placeholder}
                className={className}
            />
            <datalist id={listId}>
                {AFRICAN_COUNTRIES.map((country) => <option key={country} value={country} />)}
            </datalist>
        </>
    );
};

export default CountrySelect;
