import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { FaEnvelope, FaLock, FaSignInAlt, FaEye, FaEyeSlash, FaExclamationTriangle, FaTimes } from 'react-icons/fa';
import axios from 'axios';
import BrandLogo from '../components/BrandLogo';

const Login = ({ isModal = false, onClose, onSwitchToRegister, initialEmail = '', initialMessage = '' }) => {
    const location = useLocation();
    const [formData, setFormData] = useState({ 
        email: location.state?.email || initialEmail,
        password: '' 
    });
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState(location.state?.message || initialMessage);
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [maintenanceMode, setMaintenanceMode] = useState(false);
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();

    const { email, password } = formData;

    // Check maintenance mode on component mount - but don't block login form
    useEffect(() => {
        const checkMaintenance = async () => {
            try {
                const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
                await axios.get(`${apiUrl}/api/auth/check`);
                setMaintenanceMode(false); // System is accessible
            } catch (err) {
                if (err.response?.status === 503 && err.response?.data?.maintenanceMode) {
                    setMaintenanceMode(true); // System in maintenance
                }
            }
        };
        checkMaintenance();
    }, []);

    // Clear success message after 5 seconds
    useEffect(() => {
        if (successMessage) {
            const timer = setTimeout(() => setSuccessMessage(''), 5000);
            return () => clearTimeout(timer);
        }
    }, [successMessage]);

    const onChange = e => {
        setError('');
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const onSubmit = async e => {
        e.preventDefault();
        setError('');
        setLoading(true);
        
        try {
            const result = await login(email, password);
            // If login successful, navigate to dashboard
            navigate('/dashboard');
        } catch (err) {
            console.error(err);
            if (err.response?.status === 503 && err.response?.data?.maintenanceMode) {
                // Show error but don't redirect - admin might be trying to login
                setError('⚠️ System is under maintenance. Only administrators can access the system.');
            } else {
                setError(err.response?.data?.msg || 'Invalid email or password');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div role={isModal ? 'dialog' : undefined} aria-modal={isModal || undefined} className={isModal ? 'fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-slate-950/70 p-4 backdrop-blur-sm' : 'min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-12 px-4 sm:px-6 lg:px-8'}>
            <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl sm:p-7">
                {isModal && (
                    <button type="button" onClick={onClose} aria-label="Close sign in dialog" className="absolute right-5 top-5 z-10 rounded-full bg-white/90 p-2 text-gray-600 hover:bg-white hover:text-gray-900">
                        <FaTimes />
                    </button>
                )}
                {/* Header */}
                <div className="mb-6 text-center">
                    <Link to="/" onClick={isModal ? onClose : undefined} className="group mb-4 inline-flex flex-col items-center">
                        <BrandLogo size="tiny" />
                    </Link>
                    <h2 className="mb-1 text-2xl font-semibold text-slate-800">Login</h2>
                    <p className="text-sm text-gray-600">
                        Don't have an account?{' '}
                        {isModal ? (
                            <button type="button" onClick={onSwitchToRegister} className="font-medium text-indigo-600 hover:text-indigo-500">Create account</button>
                        ) : (
                            <Link to="/register" className="font-medium text-indigo-600 hover:text-indigo-500">Create account</Link>
                        )}
                    </p>
                </div>

                {/* Login Form */}
                <div className="bg-transparent p-0">
                    {/* Maintenance Warning Banner */}
                    {maintenanceMode && (
                        <div className="mb-6 p-4 bg-gradient-to-r from-orange-50 to-yellow-50 border-2 border-orange-400 rounded-lg">
                            <div className="flex items-center gap-2 text-orange-800 font-semibold mb-2">
                                <FaExclamationTriangle className="text-orange-600" />
                                System Under Maintenance
                            </div>
                            <p className="text-sm text-orange-700">
                                Access is restricted. Only administrators can log in during maintenance.
                            </p>
                        </div>
                    )}

                    {successMessage && (
                        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                            ✓ {successMessage}
                        </div>
                    )}
                    
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={onSubmit} className="space-y-4">
                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <FaEnvelope className="inline mr-2" />
                                Email Address
                            </label>
                            <input
                                type="email"
                                name="email"
                                value={email}
                                onChange={onChange}
                                required
                                className="w-full rounded-sm border border-slate-300 bg-white px-4 py-3 transition-all focus:border-sky-700 focus:ring-2 focus:ring-sky-700/20"
                                placeholder="your@email.com"
                            />
                        </div>

                        {/* Password */}
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label className="block text-sm font-medium text-gray-700">
                                    <FaLock className="inline mr-2" />
                                    Password
                                </label>
                                <Link to="/forgot-password" className="text-xs text-indigo-600 hover:text-indigo-500">
                                    Forgot Password?
                                </Link>
                            </div>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    value={password}
                                    onChange={onChange}
                                    required
                                    className="w-full rounded-sm border border-slate-300 bg-white px-4 py-3 pr-10 transition-all focus:border-sky-700 focus:ring-2 focus:ring-sky-700/20"
                                    placeholder="Enter your password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                                </button>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full rounded-sm bg-[#17466f] py-3.5 text-base font-semibold uppercase tracking-wide text-white shadow-md transition-all hover:bg-[#123a5d] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <FaSignInAlt />
                            {loading ? 'Signing In...' : 'Sign In'}
                        </button>
                    </form>

                    <div className="mt-4 text-center">
                        <Link to="/" onClick={isModal ? onClose : undefined} className="text-sm text-indigo-600 hover:text-indigo-500">
                            ← Back to Home
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
