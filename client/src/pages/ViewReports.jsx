import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { API_URL } from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import { FaCalendarDay, FaCalendarWeek, FaCalendarAlt, FaEye, FaChevronDown, FaChevronUp, FaChevronLeft, FaChevronRight, FaEdit, FaFilePdf, FaFileExcel, FaTrash, FaUser, FaUsers } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const ViewReports = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [reports, setReports] = useState([]);
    const [filter, setFilter] = useState('daily'); // daily, weekly, monthly
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [loading, setLoading] = useState(false);
    const [expandedReport, setExpandedReport] = useState(null);

    const [country, setCountry] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [availableCountries, setAvailableCountries] = useState([]);
    const [countrySearch, setCountrySearch] = useState('');
    const [showCountryDropdown, setShowCountryDropdown] = useState(false);
    
    // Leader View Mode: 'personal' or 'team'
    const [viewMode, setViewMode] = useState('personal'); 

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    useEffect(() => {
        // If user is leader, default to personal view initially or keep current
        if (user?.role === 'leader' && !viewMode) {
            setViewMode('personal');
        }
        // Fetch available countries for admin
        if (user?.role === 'admin') {
            fetchAvailableCountries();
        }
    }, [user]);

    const fetchAvailableCountries = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/api/reports`, {
                headers: { 'x-auth-token': token }
            });
            // Extract unique countries from all reports
            const countries = [...new Set(response.data.map(r => r.country).filter(Boolean))];
            setAvailableCountries(countries.sort());
        } catch (error) {
            console.error('Error fetching countries:', error);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchReports();
        }, 500);
        return () => clearTimeout(timer);
    }, [filter, selectedDate, country, searchQuery, viewMode]);

    const fetchReports = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            
            let startDate = selectedDate;
            let endDate = selectedDate;
            
            if (filter === 'weekly') {
                const curr = new Date(selectedDate);
                const first = curr.getDate() - curr.getDay(); 
                const last = first + 6; 
                startDate = new Date(curr.setDate(first)).toISOString().split('T')[0];
                endDate = new Date(curr.setDate(last)).toISOString().split('T')[0];
            } else if (filter === 'monthly') {
                const date = new Date(selectedDate);
                startDate = new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split('T')[0];
                endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString().split('T')[0];
            }

            const params = { startDate, endDate };
            if (country) params.country = country;
            
            // Handle Leader View Modes
            if (user?.role === 'leader') {
                if (viewMode === 'personal') {
                    params.userId = user.id; // Only fetch my reports
                    // Clear search query for personal view to avoid confusion, or ignore it
                } else {
                    // Team view: pass search query if exists
                    if (searchQuery) params.searchQuery = searchQuery;
                }
            } else {
                // Admin or Member
                if (searchQuery) params.searchQuery = searchQuery;
            }

            const response = await axios.get(`${API_URL}/api/reports`, {
                headers: { 'x-auth-token': token },
                params: params
            });
            setReports(response.data);
            setCurrentPage(1); // Reset to first page on new fetch
        } catch (error) {
            console.error('Error fetching reports:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteReport = async (reportId) => {
        if (window.confirm('Are you sure you want to delete this report? This action cannot be undone.')) {
            try {
                const token = localStorage.getItem('token');
                await axios.delete(`${API_URL}/api/reports/${reportId}`, {
                    headers: { 'x-auth-token': token }
                });
                // Refresh reports
                fetchReports();
                alert('Report deleted successfully');
            } catch (error) {
                console.error('Error deleting report:', error);
                alert('Failed to delete report');
            }
        }
    };

    const handleExport = async (type) => {
        try {
            const token = localStorage.getItem('token');
            const params = { startDate: selectedDate, endDate: selectedDate }; // Default to daily
            
            // Apply current filters
            if (filter === 'weekly') {
                const curr = new Date(selectedDate);
                const first = curr.getDate() - curr.getDay(); 
                const last = first + 6; 
                params.startDate = new Date(curr.setDate(first)).toISOString().split('T')[0];
                params.endDate = new Date(curr.setDate(last)).toISOString().split('T')[0];
            } else if (filter === 'monthly') {
                const date = new Date(selectedDate);
                params.startDate = new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split('T')[0];
                params.endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString().split('T')[0];
            }

            if (country) params.country = country;
            if (searchQuery) params.searchQuery = searchQuery;
            
            // Handle Leader View Modes
            if (user?.role === 'leader') {
                if (viewMode === 'personal') {
                    params.userId = user.id;
                } else {
                    if (searchQuery) params.searchQuery = searchQuery;
                }
            } else {
                if (searchQuery) params.searchQuery = searchQuery;
            }

            const response = await axios.get(`${API_URL}/api/reports/export/${type}`, {
                headers: { 
                    'x-auth-token': token,
                    'Accept': type === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                },
                params: params,
                responseType: 'blob'
            });

            // Determine proper file extension and MIME type
            const fileExtension = type === 'pdf' ? 'pdf' : 'xlsx';
            const mimeType = type === 'pdf' 
                ? 'application/pdf' 
                : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

            // Generate filename based on filter
            let filename = 'ministry_report';
            if (filter === 'daily') {
                filename = `ministry_report_daily_${selectedDate}.${fileExtension}`;
            } else if (filter === 'weekly') {
                filename = `ministry_report_week_${weekDates.start}.${fileExtension}`;
            } else if (filter === 'monthly') {
                const date = new Date(selectedDate);
                const monthName = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
                filename = `ministry_report_${monthName.replace(' ', '_')}.${fileExtension}`;
            }

            // Create download link with proper MIME type
            const blob = new Blob([response.data], { type: mimeType });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

        } catch (error) {
            console.error('Export failed:', error);
            alert('Failed to export report. Please try again.');
        }
    };

    const toggleExpand = (reportId) => {
        setExpandedReport(expandedReport === reportId ? null : reportId);
    };

    const formatTime = (timeValue) => {
        // Handle if it's already a number (hours)
        if (typeof timeValue === 'number') {
            const hours = Math.floor(timeValue);
            const mins = Math.round((timeValue - hours) * 60);
            if (mins === 0) {
                return `${hours} hrs`;
            }
            return `${hours} hrs ${mins} min`;
        }
        // Handle if it's a string number
        const parsed = parseFloat(timeValue);
        if (!isNaN(parsed)) {
            const hours = Math.floor(parsed);
            const mins = Math.round((parsed - hours) * 60);
            if (mins === 0) {
                return `${hours} hrs`;
            }
            return `${hours} hrs ${mins} min`;
        }
        return '0 hrs';
    };

    // Pagination Logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentReports = reports.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(reports.length / itemsPerPage);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    const handleEditReport = (report) => {
        navigate('/report-form', { state: { editReport: report } });
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                        <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
                            {user?.role === 'member' ? 'My Reports' : 
                             user?.role === 'leader' ? (viewMode === 'personal' ? 'My Reports' : 'Team Reports') : 
                             'All Reports'}
                        </h1>
                        
                        {/* Leader View Toggle */}
                        {user?.role === 'leader' && (
                            <div className="flex bg-gray-100 p-1 rounded-xl">
                                <button
                                    onClick={() => setViewMode('personal')}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                                        viewMode === 'personal' 
                                            ? 'bg-white text-indigo-600 shadow-sm' 
                                            : 'text-gray-500 hover:text-gray-700'
                                    }`}
                                >
                                    <FaUser size={14} /> My Reports
                                </button>
                                <button
                                    onClick={() => setViewMode('team')}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                                        viewMode === 'team' 
                                            ? 'bg-white text-indigo-600 shadow-sm' 
                                            : 'text-gray-500 hover:text-gray-700'
                                    }`}
                                >
                                    <FaUsers size={14} /> Team Reports
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Filter Buttons */}
                    <div className="flex flex-wrap gap-3 mb-4">
                        <button
                            onClick={() => setFilter('daily')}
                            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${
                                filter === 'daily'
                                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                        >
                            <FaCalendarDay />
                            Daily
                        </button>
                        <button
                            onClick={() => setFilter('weekly')}
                            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${
                                filter === 'weekly'
                                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                        >
                            <FaCalendarWeek />
                            Weekly
                        </button>
                        <button
                            onClick={() => setFilter('monthly')}
                            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${
                                filter === 'monthly'
                                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                        >
                            <FaCalendarAlt />
                            Monthly
                        </button>
                    </div>

                    {/* Date Selector */}
                    <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-3">
                            <label className="font-semibold text-gray-700">Select Date:</label>
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                className="px-4 py-2 border-2 border-gray-300 rounded-xl focus:border-indigo-500 focus:outline-none"
                            />
                        </div>

                        {user?.role === 'admin' && (
                            <div className="relative flex items-center gap-3">
                                <label className="font-semibold text-gray-700">Country:</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={countrySearch || country}
                                        onChange={(e) => {
                                            setCountrySearch(e.target.value);
                                            setShowCountryDropdown(true);
                                        }}
                                        onFocus={() => setShowCountryDropdown(true)}
                                        placeholder="Search or select country..."
                                        className="px-4 py-2 border-2 border-gray-300 rounded-xl focus:border-indigo-500 focus:outline-none min-w-[220px]"
                                    />
                                    
                                    {showCountryDropdown && (
                                        <>
                                            <div 
                                                className="fixed inset-0 z-10" 
                                                onClick={() => setShowCountryDropdown(false)}
                                            ></div>
                                            <div className="absolute z-20 mt-1 w-full max-h-60 overflow-auto no-scrollbar bg-white border-2 border-gray-300 rounded-xl shadow-lg">
                                                <div 
                                                    className="px-4 py-2 hover:bg-indigo-50 cursor-pointer border-b border-gray-200 font-medium text-indigo-600"
                                                    onClick={() => {
                                                        setCountry('');
                                                        setCountrySearch('');
                                                        setShowCountryDropdown(false);
                                                    }}
                                                >
                                                    All Countries
                                                </div>
                                                {availableCountries
                                                    .filter(c => c.toLowerCase().includes(countrySearch.toLowerCase()))
                                                    .map(c => (
                                                        <div
                                                            key={c}
                                                            className="px-4 py-2 hover:bg-indigo-50 cursor-pointer"
                                                            onClick={() => {
                                                                setCountry(c);
                                                                setCountrySearch(c);
                                                                setShowCountryDropdown(false);
                                                            }}
                                                        >
                                                            {c}
                                                        </div>
                                                    ))}
                                                {availableCountries.filter(c => c.toLowerCase().includes(countrySearch.toLowerCase())).length === 0 && (
                                                    <div className="px-4 py-2 text-gray-500 text-sm">
                                                        No countries found
                                                    </div>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Search Box - Only for Admin or Leader in Team Mode */}
                        {((user?.role === 'leader' && viewMode === 'team') || user?.role === 'admin') && (
                            <div className="flex items-center gap-3">
                                <label className="font-semibold text-gray-700">Search:</label>
                                <input
                                    type="text"
                                    placeholder="Name or Contact..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="px-4 py-2 border-2 border-gray-300 rounded-xl focus:border-indigo-500 focus:outline-none"
                                />
                            </div>
                        )}

                        {/* Export Buttons */}
                        <div className="ml-auto flex gap-2">
                            <button 
                                onClick={() => handleExport('pdf')}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all shadow-lg flex items-center gap-2"
                            >
                                <FaFilePdf />
                                Export PDF
                            </button>
                            <button 
                                onClick={() => handleExport('excel')}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all shadow-lg flex items-center gap-2"
                            >
                                <FaFileExcel />
                                Export Excel
                            </button>
                        </div>
                    </div>
                </div>

                {/* Reports List */}
                <div className="space-y-4">
                    {loading ? (
                        <div className="text-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                            <p className="mt-4 text-gray-600">Loading reports...</p>
                        </div>
                    ) : reports.length === 0 ? (
                        <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                            <p className="text-gray-500 text-lg">No reports found for this period.</p>
                        </div>
                    ) : (
                        currentReports.map((report) => (
                            <div key={report.id} className="bg-white rounded-2xl shadow-lg overflow-hidden">
                                {/* Report Header */}
                                <div
                                    onClick={() => toggleExpand(report.id)}
                                    className="flex items-center justify-between p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-center text-white">
                                            <FaEye />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-bold text-lg text-gray-800">{report.User?.fullname || 'Unknown User'}</h3>
                                            <p className="text-sm text-gray-500">
                                                {new Date(report.date).toLocaleDateString('en-US', {
                                                    weekday: 'long',
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric'
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {(user?.id === report.user_id || user?.role === 'leader' || user?.role === 'admin') && (
                                            <>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleEditReport(report);
                                                    }}
                                                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-md"
                                                    title="Edit Report"
                                                >
                                                    <FaEdit /> Edit
                                                </button>
                                                {(user?.role === 'admin' || user?.role === 'leader') && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDeleteReport(report.id);
                                                        }}
                                                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all flex items-center gap-2 shadow-md"
                                                        title="Delete Report"
                                                    >
                                                        <FaTrash /> Delete
                                                    </button>
                                                )}
                                            </>
                                        )}
                                        <div className="text-indigo-600">
                                            {expandedReport === report.id ? <FaChevronUp size={24} /> : <FaChevronDown size={24} />}
                                        </div>
                                    </div>
                                </div>

                                {/* Expanded Report Details */}
                                {expandedReport === report.id && (
                                    <div className="p-6 pt-0 border-t border-gray-100">
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {/* Basic Info */}
                                            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-xl">
                                                <h4 className="font-semibold text-indigo-900 mb-2">Basic Information</h4>
                                                <p className="text-sm text-gray-700"><strong>Country:</strong> {report.User?.country}</p>
                                                <p className="text-sm text-gray-700"><strong>Church:</strong> {report.church || 'N/A'}</p>
                                            </div>

                                            {/* Ministry Stats */}
                                            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-4 rounded-xl">
                                                <h4 className="font-semibold text-blue-900 mb-2">Ministry Statistics</h4>
                                                <p className="text-sm text-gray-700"><strong>Evangelism:</strong> {formatTime(report.evangelism_hours)}</p>
                                                <p className="text-sm text-gray-700"><strong>People Reached:</strong> {report.people_reached}</p>
                                                <p className="text-sm text-gray-700"><strong>Contacts:</strong> {report.contacts_received}</p>
                                                <p className="text-sm text-gray-700"><strong>Newcomers:</strong> {report.newcomers}</p>
                                            </div>

                                            {/* Bible Study */}
                                            <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl">
                                                <h4 className="font-semibold text-green-900 mb-2">Bible Study</h4>
                                                <p className="text-sm text-gray-700"><strong>Sessions:</strong> {report.bible_study_sessions}</p>
                                                <p className="text-sm text-gray-700"><strong>Attendants:</strong> {report.bible_study_attendants}</p>
                                                <p className="text-sm text-gray-700"><strong>Unique:</strong> {report.unique_attendants}</p>
                                            </div>

                                            {/* Spiritual Disciplines */}
                                            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-4 rounded-xl">
                                                <h4 className="font-semibold text-yellow-900 mb-2">Spiritual Disciplines</h4>
                                                <p className="text-sm text-gray-700"><strong>Bible Reading:</strong> {formatTime(report.meditation_time)}</p>
                                                <p className="text-sm text-gray-700"><strong>Prayer:</strong> {formatTime(report.prayer_time)}</p>
                                                <p className="text-sm text-gray-700"><strong>Sermons:</strong> {report.sermons_listened}</p>
                                            </div>

                                            {/* Service Attendance */}
                                            <div className="bg-gradient-to-r from-pink-50 to-rose-50 p-4 rounded-xl">
                                                <h4 className="font-semibold text-pink-900 mb-2">Service Attendance</h4>
                                                <p className="text-sm text-gray-700"><strong>Morning:</strong> {report.morning_service || 'N/A'}</p>
                                                <p className="text-sm text-gray-700"><strong>Regular:</strong> {report.regular_service || 'N/A'}</p>
                                            </div>

                                            {/* Other Activities */}
                                            <div className="bg-gradient-to-r from-purple-50 to-fuchsia-50 p-4 rounded-xl">
                                                <h4 className="font-semibold text-purple-900 mb-2">Other Activities</h4>
                                                <p className="text-sm text-gray-700"><strong>Articles:</strong> {report.articles_written}</p>
                                                <p className="text-sm text-gray-700"><strong>Exercise:</strong> {formatTime(report.exercise_time)}</p>
                                            </div>
                                        </div>

                                        {/* Reflections Section */}
                                        <div className="mt-6 space-y-4">
                                            {report.sermon_reflection && (
                                                <div className="bg-gray-50 p-4 rounded-xl">
                                                    <h4 className="font-semibold text-gray-900 mb-2">Sermon Reflection</h4>
                                                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{report.sermon_reflection}</p>
                                                </div>
                                            )}
                                            {report.thanksgiving && (
                                                <div className="bg-green-50 p-4 rounded-xl">
                                                    <h4 className="font-semibold text-green-900 mb-2">Thanksgiving</h4>
                                                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{report.thanksgiving}</p>
                                                </div>
                                            )}
                                            {report.repentance && (
                                                <div className="bg-yellow-50 p-4 rounded-xl">
                                                    <h4 className="font-semibold text-yellow-900 mb-2">Repentance/Struggles</h4>
                                                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{report.repentance}</p>
                                                </div>
                                            )}
                                            {report.prayer_requests && (
                                                <div className="bg-blue-50 p-4 rounded-xl">
                                                    <h4 className="font-semibold text-blue-900 mb-2">Prayer Requests</h4>
                                                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{report.prayer_requests}</p>
                                                </div>
                                            )}
                                            {report.reflections && (
                                                <div className="bg-purple-50 p-4 rounded-xl">
                                                    <h4 className="font-semibold text-purple-900 mb-2">Overall Reflection</h4>
                                                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{report.reflections}</p>
                                                </div>
                                            )}
                                            {report.other_work && (
                                                <div className="bg-indigo-50 p-4 rounded-xl">
                                                    <h4 className="font-semibold text-indigo-900 mb-2">Other Work Done</h4>
                                                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{report.other_work}</p>
                                                </div>
                                            )}
                                            {report.tomorrow_tasks && (
                                                <div className="bg-pink-50 p-4 rounded-xl">
                                                    <h4 className="font-semibold text-pink-900 mb-2">3 Things Must Do Tomorrow</h4>
                                                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{report.tomorrow_tasks}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div className="flex justify-center items-center mt-8 gap-2">
                        <button 
                            onClick={() => paginate(currentPage - 1)} 
                            disabled={currentPage === 1}
                            className={`p-2 rounded-full ${currentPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-indigo-600 hover:bg-indigo-50'}`}
                        >
                            <FaChevronLeft />
                        </button>
                        
                        {[...Array(totalPages)].map((_, i) => (
                            <button
                                key={i}
                                onClick={() => paginate(i + 1)}
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                                    currentPage === i + 1 
                                        ? 'bg-indigo-600 text-white' 
                                        : 'text-gray-600 hover:bg-gray-100'
                                }`}
                            >
                                {i + 1}
                            </button>
                        ))}

                        <button 
                            onClick={() => paginate(currentPage + 1)} 
                            disabled={currentPage === totalPages}
                            className={`p-2 rounded-full ${currentPage === totalPages ? 'text-gray-300 cursor-not-allowed' : 'text-indigo-600 hover:bg-indigo-50'}`}
                        >
                            <FaChevronRight />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ViewReports;
