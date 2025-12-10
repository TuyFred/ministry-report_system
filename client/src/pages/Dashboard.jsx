import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { FaFileAlt, FaFilePdf, FaFileExcel, FaUsers, FaChartLine, FaClock, FaGlobe, FaChevronLeft, FaChevronRight, FaTrophy, FaExclamationTriangle } from 'react-icons/fa';
import { API_URL } from '../utils/api';
import ExportReports from '../components/ExportReports';

const Dashboard = () => {
    const { user } = useContext(AuthContext);
    const [reports, setReports] = useState([]);
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const reportsPerPage = 5;
    const [performersPage, setPerformersPage] = useState(1);
    const [needsAttentionPage, setNeedsAttentionPage] = useState(1);
    const performersPerPage = 5;
    const [stats, setStats] = useState({
        totalReports: 0,
        totalHours: 0,
        totalReached: 0
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('token');
                
                // Fetch reports
                const reportsRes = await axios.get(`${API_URL}/api/reports`);
                setReports(reportsRes.data);
                
                // Fetch members if admin or leader
                if (user?.role === 'admin' || user?.role === 'leader') {
                    const membersRes = await axios.get(`${API_URL}/api/users`, {
                        headers: { 'x-auth-token': token }
                    });
                    setMembers(membersRes.data);
                }
                
                // Calculate stats
                const totalHours = reportsRes.data.reduce((sum, r) => sum + (r.evangelism_hours || 0), 0);
                const totalReached = reportsRes.data.reduce((sum, r) => sum + (r.people_reached || 0), 0);
                setStats({
                    totalReports: reportsRes.data.length,
                    totalHours,
                    totalReached
                });
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [user]);

    // Pagination calculations
    const indexOfLastReport = currentPage * reportsPerPage;
    const indexOfFirstReport = indexOfLastReport - reportsPerPage;
    const totalPages = Math.ceil(reports.length / reportsPerPage);
    
    const getCurrentPageReports = () => {
        return reports.slice(indexOfFirstReport, indexOfLastReport);
    };

    // Calculate member performance
    const getMemberStats = () => {
        const memberMap = new Map();
        
        members.forEach(member => {
            memberMap.set(member.id, {
                ...member,
                reportCount: 0,
                lastReportDate: null
            });
        });
        
        reports.forEach(report => {
            if (report.userId && memberMap.has(report.userId)) {
                const memberData = memberMap.get(report.userId);
                memberData.reportCount += 1;
                const reportDate = new Date(report.date);
                if (!memberData.lastReportDate || reportDate > memberData.lastReportDate) {
                    memberData.lastReportDate = reportDate;
                }
            }
        });
        
        return Array.from(memberMap.values());
    };
    
    const memberStats = getMemberStats();
    
    // Top performers (sorted by report count)
    const topPerformers = memberStats
        .filter(m => m.reportCount > 0)
        .sort((a, b) => b.reportCount - a.reportCount);
    
    // Needs attention (members with no reports or not reported in last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const needsAttention = memberStats
        .filter(m => m.reportCount === 0 || !m.lastReportDate || m.lastReportDate < sevenDaysAgo)
        .sort((a, b) => {
            if (a.reportCount === 0 && b.reportCount > 0) return -1;
            if (a.reportCount > 0 && b.reportCount === 0) return 1;
            return (a.lastReportDate || new Date(0)) - (b.lastReportDate || new Date(0));
        });
    
    // Pagination for performers
    const performersIndexOfLast = performersPage * performersPerPage;
    const performersIndexOfFirst = performersIndexOfLast - performersPerPage;
    const performersTotalPages = Math.ceil(topPerformers.length / performersPerPage);
    const currentPerformers = topPerformers.slice(performersIndexOfFirst, performersIndexOfLast);
    
    // Pagination for needs attention
    const needsAttentionIndexOfLast = needsAttentionPage * performersPerPage;
    const needsAttentionIndexOfFirst = needsAttentionIndexOfLast - performersPerPage;
    const needsAttentionTotalPages = Math.ceil(needsAttention.length / performersPerPage);
    const currentNeedsAttention = needsAttention.slice(needsAttentionIndexOfFirst, needsAttentionIndexOfLast);

    return (
        <div className="space-y-6 p-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-5">
                    <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-white shadow-lg">
                        {user?.profile_image ? (
                            <img 
                                src={`${API_URL}/${user.profile_image}`}
                                alt="Profile" 
                                className="w-full h-full object-cover"
                                key={user.id}
                                onError={(e) => {
                                    e.target.style.display = 'none';
                                    e.target.parentElement.innerHTML = '<div class="w-full h-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-indigo-300"><svg class="text-3xl" fill="currentColor" viewBox="0 0 20 20"><path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z"></path></svg></div>';
                                }}
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
                    <Link to="/report-form">
                        <button className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl flex items-center gap-2">
                            <FaFileAlt />
                            Submit New Report
                        </button>
                    </Link>
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

            {/* Export Reports Section - Available for all roles */}
            <ExportReports />

            {/* Top Performers Section - Only for Admin/Leader */}
            {(user?.role === 'admin' || user?.role === 'leader') && topPerformers.length > 0 && (
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                    <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-yellow-50 to-amber-50">
                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <FaTrophy className="text-yellow-600" />
                            Top Performers (Daily Reporting Champions)
                        </h2>
                        <p className="text-sm text-gray-600 mt-1">Members who consistently submit reports daily perform best!</p>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gradient-to-r from-yellow-100 to-amber-100">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Rank</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Member</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Country</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Total Reports</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Last Report</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {currentPerformers.map((member, index) => (
                                    <tr key={member.id} className="hover:bg-yellow-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                {performersIndexOfFirst + index + 1 === 1 && <span className="text-2xl">🥇</span>}
                                                {performersIndexOfFirst + index + 1 === 2 && <span className="text-2xl">🥈</span>}
                                                {performersIndexOfFirst + index + 1 === 3 && <span className="text-2xl">🥉</span>}
                                                <span className="font-bold text-gray-700">#{performersIndexOfFirst + index + 1}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center text-white font-bold">
                                                    {member.fullname.charAt(0)}
                                                </div>
                                                <div className="font-medium text-gray-900">{member.fullname}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{member.country}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-bold">
                                                {member.reportCount} reports
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                            {member.lastReportDate ? new Date(member.lastReportDate).toLocaleDateString() : 'Never'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination for Top Performers */}
                    {topPerformers.length > performersPerPage && (
                        <div className="p-4 border-t border-gray-200 flex items-center justify-between bg-yellow-50">
                            <div className="text-sm text-gray-600">
                                Showing {performersIndexOfFirst + 1} to {Math.min(performersIndexOfLast, topPerformers.length)} of {topPerformers.length} members
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setPerformersPage(prev => Math.max(prev - 1, 1))}
                                    disabled={performersPage === 1}
                                    className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                                        performersPage === 1
                                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                            : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                                    }`}
                                >
                                    <FaChevronLeft className="text-xs" />
                                    Previous
                                </button>
                                <span className="px-4 py-2 bg-yellow-600 text-white rounded-lg font-medium">
                                    {performersPage}
                                </span>
                                <button
                                    onClick={() => setPerformersPage(prev => Math.min(prev + 1, performersTotalPages))}
                                    disabled={performersPage === performersTotalPages}
                                    className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                                        performersPage === performersTotalPages
                                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                            : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                                    }`}
                                >
                                    Next
                                    <FaChevronRight className="text-xs" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Needs Attention Section - Only for Admin/Leader */}
            {(user?.role === 'admin' || user?.role === 'leader') && needsAttention.length > 0 && (
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                    <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-red-50 to-orange-50">
                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <FaExclamationTriangle className="text-red-600" />
                            Needs Attention (Missing Daily Reports)
                        </h2>
                        <p className="text-sm text-gray-600 mt-1">Members who missed reporting - encourage daily submission for better performance</p>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gradient-to-r from-red-100 to-orange-100">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Member</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Country</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Total Reports</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Last Report</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Status</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {currentNeedsAttention.map(member => (
                                    <tr key={member.id} className="hover:bg-red-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-400 to-orange-500 flex items-center justify-center text-white font-bold">
                                                    {member.fullname.charAt(0)}
                                                </div>
                                                <div className="font-medium text-gray-900">{member.fullname}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{member.country}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                                                member.reportCount === 0 
                                                    ? 'bg-red-100 text-red-800' 
                                                    : 'bg-orange-100 text-orange-800'
                                            }`}>
                                                {member.reportCount} reports
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                            {member.lastReportDate ? new Date(member.lastReportDate).toLocaleDateString() : 'Never'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                                member.reportCount === 0
                                                    ? 'bg-red-100 text-red-800'
                                                    : 'bg-orange-100 text-orange-800'
                                            }`}>
                                                {member.reportCount === 0 ? 'No Reports' : 'Inactive'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination for Needs Attention */}
                    {needsAttention.length > performersPerPage && (
                        <div className="p-4 border-t border-gray-200 flex items-center justify-between bg-red-50">
                            <div className="text-sm text-gray-600">
                                Showing {needsAttentionIndexOfFirst + 1} to {Math.min(needsAttentionIndexOfLast, needsAttention.length)} of {needsAttention.length} members
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setNeedsAttentionPage(prev => Math.max(prev - 1, 1))}
                                    disabled={needsAttentionPage === 1}
                                    className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                                        needsAttentionPage === 1
                                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                            : 'bg-red-100 text-red-700 hover:bg-red-200'
                                    }`}
                                >
                                    <FaChevronLeft className="text-xs" />
                                    Previous
                                </button>
                                <span className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium">
                                    {needsAttentionPage}
                                </span>
                                <button
                                    onClick={() => setNeedsAttentionPage(prev => Math.min(prev + 1, needsAttentionTotalPages))}
                                    disabled={needsAttentionPage === needsAttentionTotalPages}
                                    className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                                        needsAttentionPage === needsAttentionTotalPages
                                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                            : 'bg-red-100 text-red-700 hover:bg-red-200'
                                    }`}
                                >
                                    Next
                                    <FaChevronRight className="text-xs" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

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
                    <>
                        {/* Desktop Table */}
                        <div className="hidden md:block overflow-x-auto">
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
                                    {getCurrentPageReports().map(report => (
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

                        {/* Mobile Cards */}
                        <div className="md:hidden space-y-4 p-4">
                            {getCurrentPageReports().map(report => (
                                <div key={report.id} className="bg-gray-50 rounded-xl p-4 border border-gray-100 shadow-sm">
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <p className="text-sm text-gray-500">{new Date(report.date).toLocaleDateString()}</p>
                                            <h3 className="font-bold text-gray-900">{report.User ? report.User.fullname : 'N/A'}</h3>
                                        </div>
                                        <span className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-full flex items-center gap-1">
                                            <FaGlobe className="text-xs" />
                                            {report.User ? report.User.country : 'N/A'}
                                        </span>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-4 mb-4">
                                        <div className="bg-white p-3 rounded-lg border border-gray-100">
                                            <p className="text-xs text-gray-500 mb-1">Hours</p>
                                            <p className="font-bold text-indigo-600">{report.evangelism_hours}h</p>
                                        </div>
                                        <div className="bg-white p-3 rounded-lg border border-gray-100">
                                            <p className="text-xs text-gray-500 mb-1">Reached</p>
                                            <p className="font-bold text-green-600">{report.people_reached}</p>
                                        </div>
                                    </div>

                                    <button className="w-full py-2 bg-white border border-indigo-200 text-indigo-600 rounded-lg text-sm font-medium hover:bg-indigo-50 transition-colors">
                                        View Details
                                    </button>
                                </div>
                            ))}
                        </div>

                        {/* Pagination */}
                        {reports.length > reportsPerPage && (
                            <div className="p-4 border-t border-gray-200 flex items-center justify-between">
                                <div className="text-sm text-gray-600">
                                    Showing {indexOfFirstReport + 1} to {Math.min(indexOfLastReport, reports.length)} of {reports.length} reports
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                        disabled={currentPage === 1}
                                        className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                                            currentPage === 1
                                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                                        }`}
                                    >
                                        <FaChevronLeft className="text-xs" />
                                        Previous
                                    </button>
                                    <span className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium">
                                        {currentPage}
                                    </span>
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                        disabled={currentPage === totalPages}
                                        className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                                            currentPage === totalPages
                                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                                        }`}
                                    >
                                        Next
                                        <FaChevronRight className="text-xs" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
