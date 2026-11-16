import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { FaChurch, FaUser, FaEnvelope, FaLock, FaGlobe, FaPhone, FaMapMarkerAlt, FaEye, FaEyeSlash } from 'react-icons/fa';
import axios from 'axios';
import { API_URL } from '../utils/api';
import CountrySelect from '../components/CountrySelect';

const Register = () => {
    const [formData, setFormData] = useState({
        fullname: '',
        email: '',
        password: '',
        confirmPassword: '',
        role: 'member',
        country: '',
        contact: '',
        address: ''
    });
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');
    const [loading, setLoading] = useState(false);
    const [otpRequested, setOtpRequested] = useState(false);
    const [otp, setOtp] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const { register } = useContext(AuthContext);
    const navigate = useNavigate();

    const { fullname, email, password, confirmPassword, role, country, contact, address } = formData;

    // Check maintenance mode and block registration
    useEffect(() => {
        const checkMaintenance = async () => {
            try {
                const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
                await axios.get(`${apiUrl}/api/auth/check`);
            } catch (err) {
                if (err.response?.status === 503 && err.response?.data?.maintenanceMode) {
                    // Redirect to maintenance page - registration not allowed
                    navigate('/maintenance');
                }
            }
        };
        checkMaintenance();
    }, [navigate]);

    const onChange = e => {
        setError('');
        setNotice('');
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const onSubmit = async e => {
        e.preventDefault();
        setError('');
        
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }
        
        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setLoading(true);
        try {
            const response = await register({ fullname, email, password, role, country, contact, address });
            setOtpRequested(true);
            setNotice(response.data.msg);
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.msg || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const verifyOtp = async (event) => {
        event.preventDefault();
        setError('');
        setLoading(true);
        try {
            await axios.post(`${API_URL}/api/auth/register/verify-otp`, {
                email,
                otp
            });
            navigate('/login', {
                state: {
                    message: 'Your email is verified and your account has been created. Please sign in.',
                    email
                }
            });
        } catch (err) {
            setError(err.response?.data?.msg || 'Unable to verify the code.');
        } finally {
            setLoading(false);
        }
    };

    const resendOtp = async () => {
        setError('');
        setNotice('');
        setLoading(true);
        try {
            const response = await axios.post(`${API_URL}/api/auth/register/resend-otp`, { email });
            setNotice(response.data.msg);
        } catch (err) {
            setError(err.response?.data?.msg || 'Unable to resend the code.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-8 px-4">
            <div className="max-w-md w-full">
                <div className="text-center mb-6">
                    <Link to="/" className="inline-flex items-center space-x-2 mb-4">
                        <FaChurch className="text-indigo-600 text-3xl" />
                        <span className="text-2xl font-bold text-gray-800">Ministry Reports</span>
                    </Link>
                    <h2 className="text-2xl font-bold text-gray-900 mb-1">Create Your Account</h2>
                    <p className="text-sm text-gray-600">
                        Already have an account?{' '}
                        <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500">Sign in</Link>
                    </p>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6">
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">{error}</div>
                    )}
                    {notice && (
                        <div role="status" className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">{notice}</div>
                    )}

                    {otpRequested ? (
                        <form onSubmit={verifyOtp} className="space-y-4">
                            <p className="text-sm text-gray-600">Enter the six-digit verification code sent to <strong>{email}</strong>. It expires in 10 minutes.</p>
                            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="registration-otp">Email verification code</label>
                            <input
                                id="registration-otp"
                                type="text"
                                inputMode="numeric"
                                autoComplete="one-time-code"
                                pattern="[0-9]{6}"
                                maxLength="6"
                                value={otp}
                                onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))}
                                required
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-center tracking-[0.5em] text-lg focus:ring-2 focus:ring-indigo-500"
                                placeholder="000000"
                            />
                            <button type="submit" disabled={loading} className="w-full py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium disabled:opacity-50">
                                {loading ? 'Verifying...' : 'Verify Email and Create Account'}
                            </button>
                            <button type="button" onClick={resendOtp} disabled={loading} className="w-full text-sm text-indigo-600 hover:text-indigo-700 disabled:opacity-50">
                                Resend code
                            </button>
                        </form>
                    ) : (
                    <form onSubmit={onSubmit} className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                <div className="relative">
                                    <FaUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
                                    <input
                                        type="text"
                                        name="fullname"
                                        value={fullname}
                                        onChange={onChange}
                                        required
                                        className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                                        placeholder="John Doe"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                <div className="relative">
                                    <FaEnvelope className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
                                    <input
                                        type="email"
                                        name="email"
                                        value={email}
                                        onChange={onChange}
                                        required
                                        className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                                        placeholder="email@example.com"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                                <div className="relative">
                                    <FaLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        name="password"
                                        value={password}
                                        onChange={onChange}
                                        required
                                        className="w-full pl-9 pr-9 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                                        placeholder="••••••"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        {showPassword ? <FaEyeSlash className="text-sm" /> : <FaEye className="text-sm" />}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm</label>
                                <div className="relative">
                                    <FaLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
                                    <input
                                        type={showConfirmPassword ? "text" : "password"}
                                        name="confirmPassword"
                                        value={confirmPassword}
                                        onChange={onChange}
                                        required
                                        className="w-full pl-9 pr-9 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                                        placeholder="••••••"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        {showConfirmPassword ? <FaEyeSlash className="text-sm" /> : <FaEye className="text-sm" />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                                <div className="relative">
                                    <FaGlobe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
                                    <CountrySelect
                                        value={country}
                                        onChange={(value) => setFormData({ ...formData, country: value })}
                                        required
                                        className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm bg-white"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                                <div className="relative">
                                    <FaPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
                                    <input
                                        type="tel"
                                        name="contact"
                                        value={contact}
                                        onChange={onChange}
                                        className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                                        placeholder="+1234567890"
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Address (Optional)</label>
                            <div className="relative">
                                <FaMapMarkerAlt className="absolute left-3 top-3 text-gray-400 text-sm" />
                                <textarea
                                    name="address"
                                    value={address}
                                    onChange={onChange}
                                    rows="2"
                                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm resize-none"
                                    placeholder="Your address"
                                ></textarea>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all shadow-md hover:shadow-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Creating Account...' : 'Create Account'}
                        </button>
                    </form>
                    )}

                    <p className="mt-4 text-center text-xs text-gray-500">
                        Admin accounts are managed by administrators
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Register;

