// Use environment variable for API URL
// Production: same-origin API (frontend and backend are served together)
// Development: localhost
const isProduction = window.location.hostname !== 'localhost' && !window.location.hostname.includes('127.0.0.1');

export const API_URL = import.meta.env.VITE_API_URL || 
    (isProduction ? window.location.origin : 'http://localhost:5000');
