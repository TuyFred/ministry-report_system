import React from 'react';

const BrandLogo = ({ compact = false, dark = false, className = '', size = 'default' }) => {
    const imageSize = compact
        ? 'h-9 w-11'
        : size === 'tiny'
            ? 'h-10 w-12'
            : size === 'small'
            ? 'h-14 w-16'
            : 'h-16 w-20';

    return (
        <span className={`inline-flex items-center gap-2 ${className}`}>
            <img
                src="/olivet-assembly-africa-logo.png"
                alt="Olivet Assembly Africa logo"
                className={`${imageSize} rounded-lg bg-white p-1 object-contain shadow-sm`}
            />
            {!compact && (
                <span className={`${size === 'tiny' ? 'text-lg' : 'text-xl'} font-extrabold leading-tight tracking-tight ${dark ? 'text-white' : 'text-gray-800'}`}>
                    Olivet Assembly Africa
                </span>
            )}
        </span>
    );
};

export default BrandLogo;
