import React from 'react';

const BrandLogo = ({ compact = false, dark = false, className = '' }) => (
    <span className={`inline-flex items-center gap-2 ${className}`}>
        <img
            src="/olivet-assembly-africa-logo.png"
            alt="Olivet Assembly Africa logo"
            className={compact ? 'h-9 w-11 rounded object-contain' : 'h-12 w-14 rounded object-contain'}
        />
        {!compact && (
            <span className={`font-bold leading-tight ${dark ? 'text-white' : 'text-gray-800'}`}>
                Olivet Assembly Africa
            </span>
        )}
    </span>
);

export default BrandLogo;
