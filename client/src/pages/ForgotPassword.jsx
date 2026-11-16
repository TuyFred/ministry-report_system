import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaChurch, FaEnvelope, FaCheckCircle, FaLock } from 'react-icons/fa';
import axios from 'axios';
import { API_URL } from '../utils/api';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [otpRequested, setOtpRequested] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const requestCode = async (resend = false) => {
        setError('');
        setLoading(true);
        try {
            const route = resend ? 'password-reset/resend-otp' : 'password-reset/request-otp';
            const response = await axios.post(`${API_URL}/api/auth/${route}`, { email });
            setOtpRequested(true);
            setMessage(response.data.msg || 'If an account exists for this address, a verification code has been sent.');
        } catch (err) {
            setError(err.response?.data?.msg || 'Unable to send the verification code.');
        } finally {
            setLoading(false);
        }
    };

    const submitReset = async (event) => {
        event.preventDefault();
        setError('');
        if (otp.length !== 6) {
            setError('Enter the six-digit code from your email.');
            return;
        }
        if (newPassword.length < 6) {
            setError('Password must be at least 6 characters.');
            return;
        }
        if (newPassword !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }
        setLoading(true);
        try {
            const response = await axios.post(`${API_URL}/api/auth/password-reset/verify-otp`, {
                email,
                otp,
                newPassword
            });
            setMessage(response.data.msg);
            setSuccess(true);
        } catch (err) {
            setError(err.response?.data?.msg || 'Failed to reset password.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-12 px-4">
            <div className="max-w-md w-full">
                <div className="text-center mb-8">
                    <Link to="/" className="inline-flex items-center space-x-2 mb-6">
                        <FaChurch className="text-indigo-600 text-4xl" />
                        <span className="text-3xl font-bold text-gray-800">Ministry Reports</span>
                    </Link>
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">Forgot Password?</h2>
                    <p className="text-gray-600">We’ll email you a secure, one-time verification code.</p>
                </div>

                <div className="bg-white rounded-2xl shadow-xl p-8">
                    {success ? (
                        <div className="text-center">
                            <FaCheckCircle className="text-green-500 text-6xl mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Password reset successfully</h3>
                            <p className="text-gray-600 mb-5">You can now sign in with your new password.</p>
                            <Link to="/login" className="inline-block px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Back to Login</Link>
                        </div>
                    ) : (
                        <form onSubmit={(event) => {
                            if (!otpRequested) {
                                event.preventDefault();
                                requestCode();
                                return;
                            }
                            submitReset(event);
                        }} className="space-y-5">
                            {error && <div role="alert" className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">{error}</div>}
                            {message && <div role="status" className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">{message}</div>}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2"><FaEnvelope className="inline mr-2" />Email Address</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(event) => setEmail(event.target.value)}
                                    autoComplete="email"
                                    required
                                    disabled={otpRequested}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-50"
                                    placeholder="your@email.com"
                                />
                            </div>
                            {!otpRequested ? (
                                <button type="submit" disabled={loading} className="w-full py-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium disabled:opacity-50">
                                    {loading ? 'Sending...' : 'Send Verification Code'}
                                </button>
                            ) : (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Six-digit email code</label>
                                        <input
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
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2"><FaLock className="inline mr-2" />New Password</label>
                                        <input type="password" autoComplete="new-password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} required minLength="6" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
                                        <input type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required minLength="6" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" />
                                    </div>
                                    <button type="submit" disabled={loading} className="w-full py-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium disabled:opacity-50">
                                        {loading ? 'Resetting...' : 'Verify Code and Reset Password'}
                                    </button>
                                    <button type="button" onClick={() => requestCode(true)} disabled={loading} className="w-full text-sm text-indigo-600 hover:text-indigo-700 disabled:opacity-50">
                                        Resend code
                                    </button>
                                </>
                            )}
                            <div className="text-center">
                                <Link to="/login" className="text-sm text-indigo-600 hover:text-indigo-500">← Back to Login</Link>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
