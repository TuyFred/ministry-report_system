// Use environment variable for API URL
// Production: Uses Render backend
// Development: Uses localhost
const isProduction = window.location.hostname.includes('vercel.app') || window.location.hostname.includes('ministry-report-system');

export const API_URL = import.meta.env.VITE_API_URL || 
    (isProduction ? 'https://ministry-report-system.onrender.com' : 'http://localhost:5000');
