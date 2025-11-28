import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { FaFileAlt, FaFilePdf, FaFileExcel, FaUsers, FaChartLine, FaClock, FaGlobe } from 'react-icons/fa';

const Dashboard = () => {
    const { user } = useContext(AuthContext);
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalReports: 0,
        totalHours: 0,
        totalReached: 0
    });

    useEffect(() => {
        const fetchReports = async () => {
            try {
                const res = await axios.get('http://localhost:5000/api/reports');
                setReports(res.data);
                
                // Calculate stats
                const totalHours = res.data.reduce((sum, r) => sum + (r.evangelism_hours || 0), 0);
                const totalReached = res.data.reduce((sum, r) => sum + (r.people_reached || 0), 0);
                setStats({
                    totalReports: res.data.length,
                    totalHours,
                    totalReached
                });
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchReports();
    }, []);

    return (
        <div className="space-y-6 p-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-5">
                    <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-white shadow-lg">
                        {user?.profile_image ? (
                            <img 
                                src={`http://localhost:5000/${user.profile_image}`} 
                                alt="Profile" 
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-indigo-300">
                                <FaUsers className="text-3xl" />
                            </div>
                        )}
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">
                            Welcome back, {user?.fullname}!
                        </h1>
                        <p className="text-gray-600 mt-1 flex items-center gap-2">
                            <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded text-sm font-semibold capitalize">{user?.role}</span>
                            <span className="text-gray-400">•</span>
                            <span className="font-medium">{user?.country}</span>
                        </p>
                    </div>
                </div>
                
                {(user?.role === 'member' || user?.role === 'leader') && (
                    <div className="flex flex-wrap gap-2">
                        <Link to="/report-form">
                            <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all shadow-lg hover:shadow-xl flex items-center gap-2">
                                <FaFileAlt />
                                Submit Report
                            </button>
                        </Link>
                        <a 
                            href={`http://localhost:5000/api/reports/export/pdf`}
                            download
                        >
                            <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all shadow-lg hover:shadow-xl flex items-center gap-2">
                                <FaFilePdf />
                                Export PDF
                            </button>
                        </a>
                        <a 
                            href={`http://localhost:5000/api/reports/export/excel`}
                            download
                        >
                            <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all shadow-lg hover:shadow-xl flex items-center gap-2">
                                <FaFileExcel />
                                Export Excel
                            </button>
                        </a>
                    </div>
                )}
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-6 text-white shadow-xl">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-blue-100 text-sm font-medium">Total Reports</p>
                            <h3 className="text-3xl font-bold mt-2">{stats.totalReports}</h3>
                        </div>
                        <div className="w-14 h-14 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
                            <FaFileAlt className="text-2xl" />
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl p-6 text-white shadow-xl">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-purple-100 text-sm font-medium">Evangelism Hours</p>
                            <h3 className="text-3xl font-bold mt-2">{stats.totalHours}</h3>
                        </div>
                        <div className="w-14 h-14 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
                            <FaClock className="text-2xl" />
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 text-white shadow-xl">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-green-100 text-sm font-medium">People Reached</p>
                            <h3 className="text-3xl font-bold mt-2">{stats.totalReached}</h3>
                        </div>
                        <div className="w-14 h-14 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
                            <FaUsers className="text-2xl" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Reports Table */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <FaChartLine className="text-indigo-600" />
                        Recent Reports
                    </h2>
                </div>

                {loading ? (
                    <div className="p-12 text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-indigo-600 mx-auto"></div>
                        <p className="text-gray-600 mt-4">Loading reports...</p>
                    </div>
                ) : reports.length === 0 ? (
                    <div className="p-12 text-center">
                        <FaFileAlt className="text-6xl text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-600 text-lg">No reports available yet.</p>
                        {(user?.role === 'member' || user?.role === 'leader') && (
                            <Link to="/report-form">
                                <button className="mt-4 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all">
                                    Submit Your First Report
                                </button>
                            </Link>
                        )}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted By</th>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Country</th>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hours</th>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">People Reached</th>
                                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {reports.map(report => (
                                    <tr key={report.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {new Date(report.date).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {report.User ? report.User.fullname : 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                            <span className="flex items-center gap-1">
                                                <FaGlobe className="text-indigo-600" />
                                                {report.User ? report.User.country : 'N/A'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                                            {report.evangelism_hours}h
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                                            {report.people_reached}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <button className="text-indigo-600 hover:text-indigo-900 font-medium">
                                                View Details
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
