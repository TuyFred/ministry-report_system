import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { API_URL } from '../utils/api';
import { FaChartLine, FaTrophy, FaExclamationTriangle, FaCheckCircle, FaCalendarCheck, FaUsers, FaFire, FaChevronLeft, FaChevronRight, FaFilePdf, FaFileExcel, FaEnvelope, FaFilter } from 'react-icons/fa';
import { formatDuration } from '../utils/time';
import { AuthContext } from '../context/AuthContext';

const Analytics = () => {
    const { user } = useContext(AuthContext);
    const [analytics, setAnalytics] = useState(null);
    const [members, setMembers] = useState([]);
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [timeRange, setTimeRange] = useState('month'); // week, month, year
    const [countryFilter, setCountryFilter] = useState('');
    const [memberSearch, setMemberSearch] = useState('');
    const [completionFilter, setCompletionFilter] = useState('all');
    const [reminders, setReminders] = useState([]);
    const [sendingReminders, setSendingReminders] = useState(false);
    const [reminderMode, setReminderMode] = useState('bulk');
    const [selectedMemberId, setSelectedMemberId] = useState('');
    const [forceReminder, setForceReminder] = useState(false);
    const [reminderSubject, setReminderSubject] = useState('');
    const [reminderMessage, setReminderMessage] = useState('');
    const [reminderPreview, setReminderPreview] = useState([]);
    const [showReminderModal, setShowReminderModal] = useState(false);

    // Pagination State
    const [countryPage, setCountryPage] = useState(1);
    const [membersPage, setMembersPage] = useState(1);
    const [performersPage, setPerformersPage] = useState(1);
    const [needsAttentionPage, setNeedsAttentionPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        fetchAnalytics();
        fetchMembersAndReports();
        fetchReminders();
    }, [timeRange]);

    const fetchReminders = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/api/reports/reminders`, {
                headers: { 'x-auth-token': token }
            });
            setReminders(response.data);
        } catch (error) {
            console.error('Error fetching reminders:', error);
        }
    };

    const previewWeeklyReminders = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(`${API_URL}/api/reports/reminders/send`, {
                recipientMode: reminderMode,
                userId: reminderMode === 'individual' ? selectedMemberId : undefined,
                preview: true,
                customSubject: reminderSubject || undefined,
                customMessage: reminderMessage || undefined
            }, { headers: { 'x-auth-token': token } });
            setReminderPreview(response.data.sent || []);
        } catch (error) {
            alert(error.response?.data?.msg || 'Unable to preview reminders.');
        }
    };

    const sendWeeklyReminders = async () => {
        setSendingReminders(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(`${API_URL}/api/reports/reminders/send`, {
                recipientMode: reminderMode,
                userId: reminderMode === 'individual' ? selectedMemberId : undefined,
                force: forceReminder,
                customSubject: reminderSubject || undefined,
                customMessage: reminderMessage || undefined
            }, {
                headers: { 'x-auth-token': token }
            });
            await fetchReminders();
            setReminderPreview([]);
            setShowReminderModal(false);
        } catch (error) {
            alert(error.response?.data?.msg || 'Unable to send weekly reminders.');
        } finally {
            setSendingReminders(false);
        }
    };

    const fetchAnalytics = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/api/reports/analytics`, {
                headers: { 'x-auth-token': token },
                params: { range: timeRange }
            });
            setAnalytics(response.data);
        } catch (error) {
            console.error('Error fetching analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchMembersAndReports = async () => {
        try {
            const token = localStorage.getItem('token');
            try {
                const membersRes = await axios.get(`${API_URL}/api/users`, {
                    headers: { 'x-auth-token': token }
                });
                setMembers(membersRes.data);
            } catch (error) {
                if (error.response?.status !== 403) console.error('Error fetching members:', error);
                setMembers([]);
            }

            const reportsRes = await axios.get(`${API_URL}/api/reports`, {
                headers: { 'x-auth-token': token }
            });
            setReports(reportsRes.data);
        } catch (error) {
            console.error('Error fetching members and reports:', error);
        }
    };

    const handleExport = async (type) => {
        try {
            const token = localStorage.getItem('token');

            // Calculate dates based on timeRange
            const endDate = new Date();
            let startDate = new Date();

            if (timeRange === 'week') {
                startDate.setDate(endDate.getDate() - 7);
            } else if (timeRange === 'month') {
                startDate.setMonth(endDate.getMonth() - 1);
            } else if (timeRange === 'year') {
                startDate.setFullYear(endDate.getFullYear() - 1);
            }

            const params = {
                startDate: startDate.toISOString().split('T')[0],
                endDate: endDate.toISOString().split('T')[0]
            };

            const response = await axios.get(`${API_URL}/api/reports/export/${type}`, {
                headers: {
                    'x-auth-token': token,
                    'Accept': type === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                },
                params: params,
                responseType: 'blob'
            });

            // Create blob with explicit MIME type
            const mimeType = type === 'pdf'
                ? 'application/pdf'
                : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
            const blob = new Blob([response.data], { type: mimeType });

            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;

            // Generate filename with proper extension
            const extension = type === 'pdf' ? 'pdf' : 'xlsx';
            const filename = `ministry_analytics_${timeRange}.${extension}`;
            link.setAttribute('download', filename);

            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Export failed:', error);
            alert('Failed to export analytics. Please try again.');
        }
    };

    const handlePerformanceExport = async (scope) => {
        try {
            const token = localStorage.getItem('token');
            const endDate = new Date();
            const startDate = new Date();
            if (timeRange === 'week') startDate.setDate(endDate.getDate() - 7);
            else if (timeRange === 'month') startDate.setMonth(endDate.getMonth() - 1);
            else startDate.setFullYear(endDate.getFullYear() - 1);
            const response = await axios.get(
                `${API_URL}/api/reports/export/performance/excel/${scope}`,
                {
                    headers: { 'x-auth-token': token },
                    params: {
                        startDate: startDate.toISOString().split('T')[0],
                        endDate: endDate.toISOString().split('T')[0]
                    },
                    responseType: 'blob'
                }
            );
            const url = window.URL.createObjectURL(response.data);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${scope}_performance_${timeRange}.xlsx`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            alert(error.response?.data?.msg || 'Unable to export performance report.');
        }
    };

    const getPerformanceColor = (percentage) => {
        if (percentage >= 90) return 'text-green-600';
        if (percentage >= 70) return 'text-yellow-600';
        return 'text-red-600';
    };

    const getPerformanceBg = (percentage) => {
        if (percentage >= 90) return 'bg-green-50 border-green-200';
        if (percentage >= 70) return 'bg-yellow-50 border-yellow-200';
        return 'bg-red-50 border-red-200';
    };

    // Pagination Helper
    const paginateData = (data, page) => {
        if (!data) return [];
        const start = (page - 1) * itemsPerPage;
        return data.slice(start, start + itemsPerPage);
    };

    const renderPagination = (totalItems, currentPage, setPage) => {
        const totalPages = Math.ceil(totalItems / itemsPerPage);
        if (totalPages <= 1) return null;

        return (
            <div className="flex justify-center items-center mt-4 gap-2">
                <button
                    onClick={() => setPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`p-2 rounded-full ${currentPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-indigo-600 hover:bg-indigo-50'}`}
                >
                    <FaChevronLeft />
                </button>
                <span className="text-sm text-gray-600">Page {currentPage} of {totalPages}</span>
                <button
                    onClick={() => setPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`p-2 rounded-full ${currentPage === totalPages ? 'text-gray-300 cursor-not-allowed' : 'text-indigo-600 hover:bg-indigo-50'}`}
                >
                    <FaChevronRight />
                </button>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading analytics...</p>
                </div>
            </div>
        );
    }

    const countryOptions = [...new Set((analytics?.allStats || []).map(member => member.country).filter(Boolean))].sort();
    const matchesMemberFilters = (member) => {
        const matchesCountry = !countryFilter || member.country === countryFilter;
        const search = memberSearch.trim().toLowerCase();
        const matchesSearch = !search ||
            member.fullname?.toLowerCase().includes(search) ||
            member.email?.toLowerCase().includes(search);
        const matchesCompletion =
            completionFilter === 'all' ||
            (completionFilter === 'excellent' && member.completionRate >= 90) ||
            (completionFilter === 'good' && member.completionRate >= 70 && member.completionRate < 90) ||
            (completionFilter === 'needs-improvement' && member.completionRate < 70);
        return matchesCountry && matchesSearch && matchesCompletion;
    };

    // Calculate member performance stats
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
            const reportUserId = report.user_id || report.userId;
            if (reportUserId && memberMap.has(reportUserId)) {
                const memberData = memberMap.get(reportUserId);
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
    const filteredTopPerformersLocal = topPerformers.filter(matchesMemberFilters);

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
    const filteredNeedsAttentionLocal = needsAttention.filter(matchesMemberFilters);

    // Pagination for performers
    const performersIndexOfLast = performersPage * itemsPerPage;
    const performersIndexOfFirst = performersIndexOfLast - itemsPerPage;
    const performersTotalPages = Math.ceil(filteredTopPerformersLocal.length / itemsPerPage);
    const currentPerformers = filteredTopPerformersLocal.slice(performersIndexOfFirst, performersIndexOfLast);

    // Pagination for needs attention
    const needsAttentionIndexOfLast = needsAttentionPage * itemsPerPage;
    const needsAttentionIndexOfFirst = needsAttentionIndexOfLast - itemsPerPage;
    const needsAttentionTotalPages = Math.ceil(filteredNeedsAttentionLocal.length / itemsPerPage);
    const currentNeedsAttention = filteredNeedsAttentionLocal.slice(needsAttentionIndexOfFirst, needsAttentionIndexOfLast);

    const filteredAllStats = (analytics?.allStats || []).filter(matchesMemberFilters);
    const filteredCountryStats = (analytics?.countryStats || []).filter(stat =>
        !countryFilter || stat.country === countryFilter
    );
    const filteredTopPerformers = (analytics?.topPerformers || []).filter(matchesMemberFilters);
    const filteredNeedsAttention = (analytics?.needsAttention || []).filter(matchesMemberFilters);
    const paginatedAllStats = paginateData(filteredAllStats, membersPage);
    const paginatedCountryStats = paginateData(filteredCountryStats, countryPage);

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center gap-3">
                                <FaChartLine />
                                Report Analytics
                            </h1>
                            <p className="text-gray-600 mt-2">Track member performance and reporting consistency</p>
                        </div>
                        {/* Time Range Selector */}
                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={() => setTimeRange('week')}
                                className={`px-4 py-2 rounded-xl font-semibold transition-all ${
                                    timeRange === 'week'
                                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                            >
                                Week
                            </button>
                            <button
                                onClick={() => setTimeRange('month')}
                                className={`px-4 py-2 rounded-xl font-semibold transition-all ${
                                    timeRange === 'month'
                                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                            >
                                Month
                            </button>
                            <button
                                onClick={() => setTimeRange('year')}
                                className={`px-4 py-2 rounded-xl font-semibold transition-all ${
                                    timeRange === 'year'
                                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                            >
                                Year
                            </button>

                            {/* Export Buttons */}
                            <button
                                onClick={() => handleExport('pdf')}
                                className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all shadow-lg flex items-center gap-2"
                            >
                                <FaFilePdf />
                                PDF
                            </button>
                            <button
                                onClick={() => handleExport('excel')}
                                className="px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all shadow-lg flex items-center gap-2"
                            >
                                <FaFileExcel />
                                Excel
                            </button>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-lg p-5 mb-6">
                    <div className="flex items-center gap-2 mb-4">
                        <FaFilter className="text-indigo-600" />
                        <h2 className="text-lg font-bold text-gray-800">Analytics Filters</h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        <input
                            type="search"
                            value={memberSearch}
                            onChange={(event) => { setMemberSearch(event.target.value); setMembersPage(1); setPerformersPage(1); setNeedsAttentionPage(1); }}
                            placeholder="Search member or email"
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        />
                        <select
                            value={countryFilter}
                            onChange={(event) => { setCountryFilter(event.target.value); setCountryPage(1); setMembersPage(1); setPerformersPage(1); setNeedsAttentionPage(1); }}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="">All countries</option>
                            {countryOptions.map(country => <option key={country} value={country}>{country}</option>)}
                        </select>
                        <select
                            value={completionFilter}
                            onChange={(event) => { setCompletionFilter(event.target.value); setMembersPage(1); setNeedsAttentionPage(1); }}
                            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="all">All performance levels</option>
                            <option value="excellent">Excellent (90%+)</option>
                            <option value="good">Good (70-89%)</option>
                            <option value="needs-improvement">Needs improvement (&lt;70%)</option>
                        </select>
                        <button
                            type="button"
                            onClick={() => { setCountryFilter(''); setMemberSearch(''); setCompletionFilter('all'); }}
                            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold"
                        >
                            Clear Filters
                        </button>
                    </div>
                    <div className="mt-5 border-t border-gray-200 pt-5">
                        <button
                            type="button"
                            onClick={() => setShowReminderModal(true)}
                            className="px-4 py-2.5 bg-red-600 text-white rounded-lg font-semibold flex items-center gap-2 hover:bg-red-700"
                        >
                            <FaEnvelope />
                            Open Weekly Reminder Control
                        </button>
                    </div>
                    {showReminderModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/60 p-4" role="dialog" aria-modal="true">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
                            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900">Weekly Reminder Control</h3>
                                    <p className="text-sm text-gray-500 mt-1">Choose, preview, edit, and send professional reminder emails.</p>
                                </div>
                                <button type="button" onClick={() => setShowReminderModal(false)} className="w-10 h-10 rounded-full hover:bg-gray-100 text-2xl text-gray-500" aria-label="Close">&times;</button>
                            </div>
                            <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                            <select
                                value={reminderMode}
                                onChange={event => setReminderMode(event.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-lg"
                            >
                                <option value="bulk">All missing members</option>
                                <option value="individual">One member</option>
                                {user?.role === 'admin' && <option value="leader-summaries">Country leaders</option>}
                                {user?.role === 'leader' && <option value="leader-summaries">My country leader summary</option>}
                            </select>
                            {reminderMode === 'individual' && (
                                <select
                                    value={selectedMemberId}
                                    onChange={event => setSelectedMemberId(event.target.value)}
                                    className="px-3 py-2 border border-gray-300 rounded-lg"
                                >
                                    <option value="">Select a member</option>
                                    {(analytics?.allStats || []).filter(member => member.role !== 'admin').map(member => (
                                        <option key={member.id} value={member.id}>{member.fullname} — {member.country}</option>
                                    ))}
                                </select>
                            )}
                            <input
                                value={reminderSubject}
                                onChange={event => setReminderSubject(event.target.value)}
                                placeholder="Optional custom subject"
                                className="px-3 py-2 border border-gray-300 rounded-lg md:col-span-2"
                            />
                            <textarea
                                value={reminderMessage}
                                onChange={event => setReminderMessage(event.target.value)}
                                placeholder="Optional custom message. You can edit it before approval."
                                rows={3}
                                className="px-3 py-2 border border-gray-300 rounded-lg md:col-span-2 lg:col-span-4"
                            />
                        </div>
                        <label className="flex items-center gap-2 mt-3 text-sm text-gray-700">
                            <input type="checkbox" checked={forceReminder} onChange={event => setForceReminder(event.target.checked)} />
                            Allow an additional reminder for a period already contacted
                        </label>
                        <div className="flex flex-wrap gap-3 mt-4">
                            <button type="button" onClick={previewWeeklyReminders} className="px-4 py-2 bg-gray-800 text-white rounded-lg font-semibold">
                                Preview
                            </button>
                            <button
                                type="button"
                                onClick={sendWeeklyReminders}
                                disabled={sendingReminders || (reminderMode === 'individual' && !selectedMemberId)}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg font-semibold disabled:opacity-60"
                            >
                                {sendingReminders ? 'Sending...' : 'Approve & Send via Brevo'}
                            </button>
                        </div>
                        {reminderPreview.length > 0 && (
                            <div className="mt-4 rounded-xl border border-indigo-200 bg-indigo-50 p-4">
                                <p className="font-bold text-indigo-900 mb-2">Preview ({reminderPreview.length} recipient(s))</p>
                                {reminderPreview.slice(0, 10).map(item => (
                                    <div key={item.id || item.leaderId} className="text-sm text-gray-700 py-1">
                                        {item.fullname || item.email} — {item.country || 'Member'} — {item.language || 'en'}
                                    </div>
                                ))}
                            </div>
                        )}
                            </div>
                        </div>
                    </div>
                    )}
                    <div className="flex flex-wrap gap-3 mt-4">
                        <button
                            type="button"
                            onClick={() => handlePerformanceExport('member')}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold"
                        >
                            Download Member Performance
                        </button>
                        <button
                            type="button"
                            onClick={() => handlePerformanceExport('country')}
                            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold"
                        >
                            Download Country Performance
                        </button>
                    </div>
                </div>

                {reminders.length > 0 && (
                    <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
                        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <FaEnvelope className="text-red-500" />
                            Weekly Reminder History
                        </h2>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Member</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Email</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Country</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Recipient</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Language</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Week</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Missing</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {reminders.slice(0, 10).map(reminder => (
                                        <tr key={reminder.id}>
                                            <td className="px-4 py-3 text-sm font-medium text-gray-900">{reminder.User?.fullname || 'Unknown member'}</td>
                                            <td className="px-4 py-3 text-sm text-gray-600">{reminder.User?.email || 'N/A'}</td>
                                            <td className="px-4 py-3 text-sm text-gray-600">{reminder.User?.country || 'N/A'}</td>
                                            <td className="px-4 py-3 text-sm text-gray-600">{reminder.recipient_type || 'member'}</td>
                                            <td className="px-4 py-3 text-sm text-gray-600">{reminder.language || 'en'}</td>
                                            <td className="px-4 py-3 text-sm text-gray-600">{reminder.week_start} to {reminder.week_end}</td>
                                            <td className="px-4 py-3 text-sm text-red-700 font-semibold">{reminder.missed_reports} days</td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                                    reminder.email_status === 'queued' ? 'bg-yellow-100 text-yellow-800' :
                                                    reminder.email_status === 'failed' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                                                }`}>{reminder.email_status}</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Overview Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-6">
                    <div className="bg-gradient-to-br from-green-400 to-emerald-600 rounded-2xl shadow-lg p-6 text-white">
                        <FaUsers className="text-3xl mb-2 opacity-80" />
                        <p className="text-sm opacity-90">Total Members</p>
                        <p className="text-4xl font-bold">{analytics?.totalMembers || 0}</p>
                    </div>
                    <div className="bg-gradient-to-br from-blue-400 to-indigo-600 rounded-2xl shadow-lg p-6 text-white">
                        <FaCalendarCheck className="text-3xl mb-2 opacity-80" />
                        <p className="text-sm opacity-90">Total Reports</p>
                        <p className="text-4xl font-bold">{analytics?.totalReports || 0}</p>
                    </div>
                    <div className="bg-gradient-to-br from-pink-500 to-rose-600 rounded-2xl shadow-lg p-6 text-white">
                        <FaChartLine className="text-3xl mb-2 opacity-80" />
                        <p className="text-sm opacity-90">Evangelism Hours</p>
                        <p className="text-2xl sm:text-3xl font-bold break-words">{formatDuration(analytics?.totalEvangelismHours, { compact: true })}</p>
                    </div>
                    <div className="bg-gradient-to-br from-yellow-400 to-orange-600 rounded-2xl shadow-lg p-6 text-white">
                        <FaCheckCircle className="text-3xl mb-2 opacity-80" />
                        <p className="text-sm opacity-90">Avg Completion</p>
                        <p className="text-4xl font-bold">{analytics?.averageCompletion || 0}%</p>
                    </div>
                    <div className="bg-gradient-to-br from-purple-400 to-pink-600 rounded-2xl shadow-lg p-6 text-white">
                        <FaFire className="text-3xl mb-2 opacity-80" />
                        <p className="text-sm opacity-90">Top Streak</p>
                        <p className="text-4xl font-bold">{analytics?.topStreak || 0} days</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                    <div className="bg-white rounded-xl shadow p-5 border border-indigo-100">
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Meditation Time</p>
                        <p className="text-xl font-bold text-indigo-700 mt-2">{formatDuration(analytics?.totalMeditationHours, { compact: true })}</p>
                    </div>
                    <div className="bg-white rounded-xl shadow p-5 border border-purple-100">
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Prayer Time</p>
                        <p className="text-xl font-bold text-purple-700 mt-2">{formatDuration(analytics?.totalPrayerHours, { compact: true })}</p>
                    </div>
                    <div className="bg-white rounded-xl shadow p-5 border border-green-100">
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Exercise Time</p>
                        <p className="text-xl font-bold text-green-700 mt-2">{formatDuration(analytics?.totalExerciseHours, { compact: true })}</p>
                    </div>
                </div>

                {/* Country Performance (Admin Only) */}
                {filteredCountryStats.length > 0 && (
                    <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
                        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <FaTrophy className="text-indigo-500" />
                            Country Performance Ranking
                        </h2>

                        {/* Desktop Table */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Country</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Completion</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Members</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reports</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Missing</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {paginatedCountryStats.map((stat, index) => {
                                        const globalIndex = (countryPage - 1) * itemsPerPage + index;
                                        return (
                                        <tr key={stat.country}>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                                                    globalIndex === 0 ? 'bg-yellow-100 text-yellow-800' :
                                                    globalIndex === 1 ? 'bg-gray-100 text-gray-800' :
                                                    globalIndex === 2 ? 'bg-orange-100 text-orange-800' :
                                                    'bg-indigo-50 text-indigo-800'
                                                }`}>
                                                    #{globalIndex + 1}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap font-medium">{stat.country}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 py-1 text-xs rounded-full ${
                                                    stat.averageCompletion >= 90 ? 'bg-green-100 text-green-800' :
                                                    stat.averageCompletion >= 70 ? 'bg-yellow-100 text-yellow-800' :
                                                    'bg-red-100 text-red-800'
                                                }`}>
                                                    {stat.averageCompletion}%
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-gray-500">{stat.memberCount}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-gray-900 font-semibold">{stat.totalReports || 0}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-red-700 font-semibold">{stat.missingReports || 0}</td>
                                        </tr>
                                    )})}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Cards */}
                        <div className="md:hidden space-y-3">
                            {paginatedCountryStats.map((stat, index) => {
                                const globalIndex = (countryPage - 1) * itemsPerPage + index;
                                return (
                                    <div key={stat.country} className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                                                    globalIndex === 0 ? 'bg-yellow-100 text-yellow-800' :
                                                    globalIndex === 1 ? 'bg-gray-100 text-gray-800' :
                                                    globalIndex === 2 ? 'bg-orange-100 text-orange-800' :
                                                    'bg-indigo-50 text-indigo-800'
                                                }`}>
                                                    #{globalIndex + 1}
                                                </div>
                                                <span className="font-bold text-gray-900">{stat.country}</span>
                                            </div>
                                            <span className={`px-2 py-1 text-xs rounded-full ${
                                                stat.averageCompletion >= 90 ? 'bg-green-100 text-green-800' :
                                                stat.averageCompletion >= 70 ? 'bg-yellow-100 text-yellow-800' :
                                                'bg-red-100 text-red-800'
                                            }`}>
                                                {stat.averageCompletion}%
                                            </span>
                                        </div>
                                        <div className="text-sm text-gray-600 pl-11">
                                            {stat.memberCount} members
                                        </div>
                                        <div className="flex gap-4 mt-2 pl-11 text-xs">
                                            <span className="text-gray-700"><strong>{stat.totalReports || 0}</strong> reports</span>
                                            <span className="text-red-700"><strong>{stat.missingReports || 0}</strong> missing</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {renderPagination(filteredCountryStats.length, countryPage, setCountryPage)}
                    </div>
                )}

                {/* Top Performers */}
                <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
                    <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <FaTrophy className="text-yellow-500" />
                        Top Performers (Daily Reporting Champions)
                    </h2>
                    <p className="text-sm text-gray-600 mb-4">
                        Members who consistently submit reports daily perform best!
                    </p>
                    <div className="space-y-3">
                        {filteredTopPerformers.length > 0 ? (
                            filteredTopPerformers.map((member, index) => (
                                <div
                                    key={member.id}
                                    className={`flex items-center justify-between p-4 rounded-xl border-2 ${getPerformanceBg(
                                        member.completionRate
                                    )}`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div
                                            className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl ${
                                                index === 0
                                                    ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white'
                                                    : index === 1
                                                    ? 'bg-gradient-to-r from-gray-300 to-gray-400 text-white'
                                                    : index === 2
                                                    ? 'bg-gradient-to-r from-orange-300 to-orange-400 text-white'
                                                    : 'bg-gradient-to-r from-indigo-400 to-purple-500 text-white'
                                            }`}
                                        >
                                            #{index + 1}
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-800">{member.fullname}</p>
                                            <p className="text-sm text-gray-600">
                                                {member.reportsSubmitted} reports submitted • {member.currentStreak} day streak
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className={`text-3xl font-bold ${getPerformanceColor(member.completionRate)}`}>
                                            {member.completionRate}%
                                        </p>
                                        <p className="text-xs text-gray-600">completion</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-gray-500 text-center py-8">No data available yet</p>
                        )}
                    </div>
                </div>

                {/* Members Needing Attention */}
                <div className="bg-white rounded-2xl shadow-lg p-6">
                    <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <FaExclamationTriangle className="text-red-500" />
                        Needs Attention (Missing Daily Reports)
                    </h2>
                    <p className="text-sm text-gray-600 mb-4">
                        Members who missed reporting - encourage daily submission for better performance
                    </p>
                    <div className="space-y-3">
                        {filteredNeedsAttention.length > 0 ? (
                            filteredNeedsAttention.map((member) => (
                                <div
                                    key={member.id}
                                    className="flex items-center justify-between p-4 rounded-xl bg-red-50 border-2 border-red-200"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                                            <FaExclamationTriangle className="text-red-600 text-xl" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-800">{member.fullname}</p>
                                            <p className="text-sm text-gray-600">
                                                Last report: {member.lastReportDate || 'Never'} • {member.missedDays} days missed
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-3xl font-bold text-red-600">{member.completionRate}%</p>
                                        <p className="text-xs text-gray-600">completion</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8 bg-green-50 rounded-xl border-2 border-green-200">
                                <FaCheckCircle className="text-green-600 text-4xl mx-auto mb-2" />
                                <p className="text-green-800 font-semibold">All members are up to date!</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* All Members Performance Table */}
                <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
                    <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <FaUsers className="text-indigo-600" />
                        All Members Performance
                    </h2>

                    {/* Desktop Table */}
                    <div className="hidden md:block overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Member</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Country</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Completion</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reports</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Evangelism Hours</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Streak</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Report</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted At</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Member Since</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {paginatedAllStats.map((member) => (
                                    <tr key={member.id}>
                                        <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{member.fullname}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{member.email || 'N/A'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{member.country || 'N/A'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                member.completionRate >= 90 ? 'bg-green-100 text-green-800' :
                                                member.completionRate >= 70 ? 'bg-yellow-100 text-yellow-800' :
                                                'bg-red-100 text-red-800'
                                            }`}>
                                                {member.completionRate}%
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-gray-500">{member.reportsSubmitted}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-gray-900 font-bold">{formatDuration(member.totalEvangelismHours, { compact: true })}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-gray-500">{member.currentStreak} days</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-gray-500">{member.lastReportDate || 'Never'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-gray-500">{member.lastSubmittedAt || 'Never'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-gray-500">{member.memberSince || 'Unavailable'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile Cards */}
                    <div className="md:hidden space-y-4">
                        {paginatedAllStats.map((member) => (
                            <div key={member.id} className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <h3 className="font-bold text-gray-900">{member.fullname}</h3>
                                        <p className="text-xs text-gray-600">{member.email || 'N/A'}</p>
                                        <p className="text-xs text-gray-500">{member.country || 'N/A'}</p>
                                        <p className="text-xs text-gray-500">Last: {member.lastReportDate || 'Never'}</p>
                                    </div>
                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                        member.completionRate >= 90 ? 'bg-green-100 text-green-800' :
                                        member.completionRate >= 70 ? 'bg-yellow-100 text-yellow-800' :
                                        'bg-red-100 text-red-800'
                                    }`}>
                                        {member.completionRate}%
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div className="bg-white p-2 rounded border border-gray-100">
                                        <p className="text-xs text-gray-500">Reports</p>
                                        <p className="font-semibold">{member.reportsSubmitted}</p>
                                    </div>
                                    <div className="bg-white p-2 rounded border border-gray-100">
                                        <p className="text-xs text-gray-500">Streak</p>
                                        <p className="font-semibold">{member.currentStreak} days</p>
                                    </div>
                                    <div className="bg-white p-2 rounded border border-gray-100 col-span-2">
                                        <p className="text-xs text-gray-500">Evangelism Hours</p>
                                        <p className="font-bold text-indigo-600">{formatDuration(member.totalEvangelismHours, { compact: true })}</p>
                                    </div>
                                    <div className="bg-white p-2 rounded border border-gray-100 col-span-2">
                                        <p className="text-xs text-gray-500">Submitted At</p>
                                        <p className="font-semibold text-gray-700">{member.lastSubmittedAt || 'Never'}</p>
                                    </div>
                                    <div className="bg-white p-2 rounded border border-gray-100 col-span-2">
                                        <p className="text-xs text-gray-500">Member Since</p>
                                        <p className="font-semibold text-gray-700">{member.memberSince || 'Unavailable'}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {renderPagination(filteredAllStats.length, membersPage, setMembersPage)}
                </div>

                {/* Top Performers Section */}
                {filteredTopPerformersLocal.length > 0 && (
                    <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-6">
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
                        <div className="p-4 border-t border-gray-200 flex items-center justify-between bg-yellow-50">
                                <div className="text-sm text-gray-600">
                                    Showing {performersIndexOfFirst + 1} to {Math.min(performersIndexOfLast, filteredTopPerformersLocal.length)} of {filteredTopPerformersLocal.length} members
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
                    </div>
                )}

                {/* Needs Attention Section */}
                {filteredNeedsAttentionLocal.length > 0 && (
                    <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-6">
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
                        <div className="p-4 border-t border-gray-200 flex items-center justify-between bg-red-50">
                                <div className="text-sm text-gray-600">
                                    Showing {needsAttentionIndexOfFirst + 1} to {Math.min(needsAttentionIndexOfLast, filteredNeedsAttentionLocal.length)} of {filteredNeedsAttentionLocal.length} members
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
                    </div>
                )}

                {/* Performance Guide */}
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl shadow-lg p-6 mt-6 border-2 border-indigo-200">
                    <h3 className="font-bold text-lg text-gray-800 mb-3">📊 Performance Rating Guide</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-green-50 p-4 rounded-xl border-2 border-green-200">
                            <p className="font-bold text-green-800 mb-1">Excellent (90-100%)</p>
                            <p className="text-sm text-gray-700">Submits daily reports consistently</p>
                        </div>
                        <div className="bg-yellow-50 p-4 rounded-xl border-2 border-yellow-200">
                            <p className="font-bold text-yellow-800 mb-1">Good (70-89%)</p>
                            <p className="text-sm text-gray-700">Reports regularly with some gaps</p>
                        </div>
                        <div className="bg-red-50 p-4 rounded-xl border-2 border-red-200">
                            <p className="font-bold text-red-800 mb-1">Needs Improvement (&lt;70%)</p>
                            <p className="text-sm text-gray-700">Missing many daily reports</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Analytics;
