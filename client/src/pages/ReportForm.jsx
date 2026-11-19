import React, { useMemo, useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaCalendarAlt, FaChurch, FaUser, FaClock, FaUsers, FaBook, FaPray, FaDumbbell, FaPen } from 'react-icons/fa';
import { API_URL } from '../utils/api';
import CountrySelect from '../components/CountrySelect';

const DurationField = ({ label, value, onChange, required = false, accent = 'indigo' }) => {
    const [hoursText, minutesText] = String(value || '').includes(':')
        ? String(value).split(':')
        : ['', ''];
    const hours = hoursText === '' ? '' : Number(hoursText);
    const minutes = minutesText === '' ? '' : Number(minutesText);
    const validMinutes = minutes === '' || (Number.isFinite(minutes) && minutes >= 0 && minutes <= 59);
    const validHours = hours === '' || (Number.isFinite(hours) && hours >= 0 && hours <= 999);
    const totalMinutes = ((validHours && hours !== '' ? hours : 0) * 60) + (validMinutes && minutes !== '' ? minutes : 0);

    const updateDuration = (nextHours, nextMinutes) => {
        const hasHours = nextHours !== '';
        const hasMinutes = nextMinutes !== '';
        if (!hasHours && !hasMinutes) {
            onChange('');
            return;
        }
        onChange(`${hasHours ? String(Number(nextHours) || 0) : '0'}:${hasMinutes ? String(nextMinutes).padStart(2, '0') : '00'}`);
    };

    const preview = totalMinutes > 0
        ? `${Math.floor(totalMinutes / 60)} hr ${totalMinutes % 60} min`
        : '0 hr 0 min';

    const accentClasses = accent === 'purple'
        ? 'focus:border-purple-500'
        : accent === 'green'
            ? 'focus:border-green-500'
            : 'focus:border-indigo-500';

    return (
        <div className="rounded-2xl border-2 border-gray-200 bg-gray-50 p-3">
            <label className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>
            <div className="grid grid-cols-[1fr_1fr_auto] gap-2 items-end">
                <div>
                    <span className="block text-xs font-medium text-gray-500 mb-1">Hours</span>
                    <input
                        type="number"
                        min="0"
                        max="999"
                        value={hoursText}
                        onChange={(event) => updateDuration(event.target.value, minutesText)}
                        required={required}
                        placeholder="0"
                        className={`w-full px-3 py-3 text-center border-2 border-gray-300 rounded-xl bg-white focus:outline-none ${accentClasses}`}
                    />
                </div>
                <div>
                    <span className="block text-xs font-medium text-gray-500 mb-1">Minutes</span>
                    <input
                        type="number"
                        min="0"
                        max="59"
                        value={minutesText}
                        onChange={(event) => updateDuration(hoursText, event.target.value)}
                        required={required}
                        placeholder="00"
                        className={`w-full px-3 py-3 text-center border-2 border-gray-300 rounded-xl bg-white focus:outline-none ${accentClasses}`}
                    />
                </div>
                <div className="hidden sm:block px-3 py-3 text-sm font-bold text-indigo-700 bg-indigo-50 rounded-xl whitespace-nowrap">
                    {preview}
                </div>
            </div>
            <div className="sm:hidden mt-2 text-sm font-bold text-indigo-700">{preview}</div>
            {(!validHours || !validMinutes) && (
                <p className="mt-2 text-xs font-semibold text-red-600">Use 0-999 hours and 00-59 minutes.</p>
            )}
        </div>
    );
};

const ReportForm = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const editReport = location.state?.editReport;

    // Helper: local date string (YYYY-MM-DD) so the default
    // selected date matches the user's calendar day reliably.
    const getLocalISODate = () => {
        const d = new Date();
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    };

    const [formData, setFormData] = useState({
        date: getLocalISODate(),
        name: '',
        country: '',
        church: '',
        evangelism_hours: '',
        evangelism_hours_hhmm: '',
        people_reached: '',
        contacts_received: '',
        bible_study_sessions: '',
        bible_study_attendants: '',
        newcomers: '',
        meditation_hours: '',
        meditation_hours_hhmm: '',
        prayer_hours: '',
        prayer_hours_hhmm: '',
        morning_service: 'No',
        regular_service: [],
        sermons_listened: '',
        articles_written: '',
        exercise_time_hhmm: '',
        sermon_reflection: '',
        thanksgiving: '',
        repentance: '',
        prayer_requests: '',
        reflections: '',
        other_work: '',
        tomorrow_tasks: '',
        other_activities: ''
    });

    const [isFormValid, setIsFormValid] = useState(false);
    const [isWeekend, setIsWeekend] = useState(false);
    const [isSaturday, setIsSaturday] = useState(false);
    const [isSunday, setIsSunday] = useState(false);
    const [dateWarning, setDateWarning] = useState('');
    const [prayerRequestsWarning, setPrayerRequestsWarning] = useState('');
    const [activeTemplate, setActiveTemplate] = useState(null);
    const [selectedDayName, setSelectedDayName] = useState('');

    const defaultWeekdayConfig = useMemo(() => ({
        visibleSections: [
            'ministryActivities',
            'bibleStudy',
            'spiritualDiscipline',
            'serviceAttendance',
            'serviceAttendanceExtras',
            'otherActivities'
        ],
        requiredFields: [
            'date', 'name', 'country', 'church',
            'evangelism_hours_hhmm', 'people_reached', 'contacts_received',
            'bible_study_sessions', 'bible_study_attendants',
            'newcomers', 'meditation_hours_hhmm', 'prayer_hours_hhmm',
            'sermons_listened', 'articles_written'
        ]
    }), []);

    const defaultSaturdayConfig = useMemo(() => ({
        visibleSections: [
            'weeklyReflection',
            'serviceAttendance',
            'planNextWeek'
        ],
        requiredFields: [
            'date', 'name', 'country', 'church',
            'exercise_time_hhmm',
            'sermon_reflection',
            'thanksgiving',
            'repentance',
            'prayer_requests',
            'reflections',
            'other_work',
            'tomorrow_tasks'
        ]
    }), []);

    const defaultSundayConfig = useMemo(() => ({
        visibleSections: [
            'serviceAttendance',
            'sundayCoreMessage',
            'otherActivities'
        ],
        requiredFields: [
            'date', 'name', 'country', 'church',
            'regular_service',
            'sermon_reflection'
        ]
    }), []);

    const fieldMeta = useMemo(() => {
        return activeTemplate?.definition?.fields || {};
    }, [activeTemplate]);

    const getLabel = (key, fallback) => {
        const v = fieldMeta?.[key]?.label;
        return typeof v === 'string' && v.trim() ? v : fallback;
    };

    const getPlaceholder = (key, fallback) => {
        const v = fieldMeta?.[key]?.placeholder;
        return typeof v === 'string' ? v : fallback;
    };

    const mergeDayConfig = (baseCfg, overrideCfg) => {
        if (!overrideCfg) return baseCfg;

        const baseVisible = Array.isArray(baseCfg?.visibleSections) ? baseCfg.visibleSections : [];
        const overrideVisibleIsArray = Array.isArray(overrideCfg?.visibleSections);
        const overrideVisible = overrideVisibleIsArray ? overrideCfg.visibleSections : null;

        // If override provides an explicit empty array, treat it as "show all"
        // (keep empty so showSection() returns true for everything).
        let visibleSections;
        if (overrideVisibleIsArray && overrideVisible.length === 0) {
            visibleSections = [];
        } else if (overrideVisibleIsArray) {
            visibleSections = Array.from(new Set([...baseVisible, ...overrideVisible]));
        } else {
            visibleSections = baseVisible;
        }

        const baseRequired = Array.isArray(baseCfg?.requiredFields) ? baseCfg.requiredFields : [];
        const overrideRequiredIsArray = Array.isArray(overrideCfg?.requiredFields);
        const overrideRequired = overrideRequiredIsArray ? overrideCfg.requiredFields : null;
        const requiredFields = overrideRequiredIsArray
            ? Array.from(new Set([...baseRequired, ...overrideRequired]))
            : baseRequired;

        return {
            ...baseCfg,
            ...overrideCfg,
            visibleSections,
            requiredFields
        };
    };

    const dayConfig = useMemo(() => {
        const def = activeTemplate?.definition;

        // If admin template supports separate configs, prefer them.
        // Otherwise fall back to our defaults.
        if (isSaturday) {
            const cfg = def?.saturday || def?.weekend;
            // Always include the default Saturday sections so the Saturday form is never hidden.
            return mergeDayConfig(defaultSaturdayConfig, cfg);
        }
        if (isSunday) {
            const cfg = def?.sunday || def?.weekend;
            return mergeDayConfig(defaultSundayConfig, cfg);
        }

        const cfg = def?.weekday;
        return mergeDayConfig(defaultWeekdayConfig, cfg);
    }, [activeTemplate, isSaturday, isSunday, defaultSaturdayConfig, defaultSundayConfig, defaultWeekdayConfig]);

    const showSection = (key) => {
        const sections = dayConfig?.visibleSections;
        if (!Array.isArray(sections) || sections.length === 0) return true;
        return sections.includes(key);
    };

    // Load active report form template (admin-managed)
    useEffect(() => {
        const fetchActiveTemplate = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) return;
                const res = await axios.get(`${API_URL}/api/report-forms/active`, {
                    headers: { 'x-auth-token': token }
                });
                setActiveTemplate(res.data);
            } catch (err) {
                // Non-blocking: fall back to default behavior
                console.error('Failed to load active report form template:', err);
            }
        };
        fetchActiveTemplate();
    }, []);

    // Check if report exists for selected date
    const checkExistingReport = async (selectedDate) => {
        if (editReport) return; // Skip check if editing existing report
        
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}/api/reports`, {
                headers: { 'x-auth-token': token },
                params: {
                    startDate: selectedDate,
                    endDate: selectedDate
                }
            });
            
            if (response.data && response.data.length > 0) {
                setDateWarning('⚠️ You already have a report for this date. Please choose a different date or edit your existing report.');
            } else {
                setDateWarning('');
            }
        } catch (error) {
            console.error('Error checking existing report:', error);
        }
    };

    const countNonEmptyLines = (text) => {
        if (typeof text !== 'string') return 0;
        return text
            .split(/\r?\n/)
            .map(l => l.trim())
            .filter(Boolean)
            .length;
    };

    const getLocalDateDay = (dateStr) => {
        if (!dateStr) return null;
        // Interpret the selected YYYY-MM-DD as a local date (not UTC)
        // so day-of-week always matches the user's calendar.
        const d = new Date(dateStr + 'T00:00:00');
        const day = d.getDay();
        return Number.isNaN(day) ? null : day;
    };

    const isSaturdayDate = (dateStr) => getLocalDateDay(dateStr) === 6;
    const isSundayDate = (dateStr) => getLocalDateDay(dateStr) === 0;

    const isValidDurationHHMM = (value) => {
        if (typeof value !== 'string') return false;
        const v = value.trim();
        // Allow 1-3 digit hours to support weekly totals > 23h.
        const match = v.match(/^\d{1,3}:[0-5]\d$/);
        return Boolean(match);
    };

    const parseDurationHHMMToHours = (value) => {
        if (!isValidDurationHHMM(value)) return null;
        const [hStr, mStr] = value.trim().split(':');
        const hours = parseInt(hStr, 10);
        const minutes = parseInt(mStr, 10);
        if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
        return hours + (minutes / 60);
    };

    const formatHoursToHHMM = (value) => {
        const numericValue = Number(value);
        if (!Number.isFinite(numericValue) || numericValue < 0) return '';
        const totalMinutes = Math.max(0, Math.round(numericValue * 60));
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        return `${hours}:${String(minutes).padStart(2, '0')}`;
    };

    // Check if selected date is weekend (Saturday or Sunday) and check for existing reports
    useEffect(() => {
        if (formData.date) {
            const saturday = isSaturdayDate(formData.date);
            const sunday = isSundayDate(formData.date);
            setIsSaturday(saturday);
            setIsSunday(sunday);
            setIsWeekend(saturday || sunday);
            // Track selected calendar day name for user clarity
            const dayNames = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
            const day = getLocalDateDay(formData.date);
            setSelectedDayName(day === null ? '' : (dayNames[day] || ''));
            
            // Check if report exists for this date
            checkExistingReport(formData.date);
        }
    }, [formData.date]);

    // Prayer requests: no more than three (Saturday weekly form)
    useEffect(() => {
        if (!isSaturday) {
            setPrayerRequestsWarning('');
            return;
        }
        const count = countNonEmptyLines(formData.prayer_requests);
        if (count > 3) {
            setPrayerRequestsWarning('⚠️ Prayer requests must be no more than three (use one line per request).');
        } else {
            setPrayerRequestsWarning('');
        }
    }, [formData.prayer_requests, isSaturday]);

    // Load edit data if editing
    useEffect(() => {
        if (editReport) {
            const exerciseTime = Number(editReport.exercise_time);
            let exerciseTimeHHMM = '';
            if (!Number.isNaN(exerciseTime) && exerciseTime >= 0) {
                const totalMinutes = Math.max(0, Math.round(exerciseTime * 60));
                const hh = Math.floor(totalMinutes / 60);
                const mm = totalMinutes % 60;
                const hhStr = hh < 100 ? String(hh).padStart(2, '0') : String(hh);
                exerciseTimeHHMM = `${hhStr}:${String(mm).padStart(2, '0')}`;
            }

            setFormData({
                date: editReport.date,
                name: editReport.name || '',
                country: editReport.country || '',
                church: editReport.church || '',
                evangelism_hours: editReport.evangelism_hours?.toString() || '',
                evangelism_hours_hhmm: formatHoursToHHMM(editReport.evangelism_hours),
                people_reached: editReport.people_reached?.toString() || '',
                contacts_received: editReport.contacts_received?.toString() || '',
                bible_study_sessions: editReport.bible_study_sessions?.toString() || '',
                bible_study_attendants: editReport.bible_study_attendants?.toString() || '',
                newcomers: editReport.newcomers?.toString() || '',
                meditation_hours: editReport.meditation_time?.toString() || '',
                meditation_hours_hhmm: formatHoursToHHMM(editReport.meditation_time),
                prayer_hours: editReport.prayer_time?.toString() || '',
                prayer_hours_hhmm: formatHoursToHHMM(editReport.prayer_time),
                morning_service: editReport.morning_service || 'No',
                regular_service: editReport.regular_service ? (typeof editReport.regular_service === 'string' ? editReport.regular_service.split(',').map(s => s.trim()) : []) : [],
                sermons_listened: editReport.sermons_listened?.toString() || '',
                articles_written: editReport.articles_written?.toString() || '',
                exercise_time_hhmm: exerciseTimeHHMM,
                sermon_reflection: editReport.sermon_reflection || '',
                thanksgiving: editReport.thanksgiving || '',
                repentance: editReport.repentance || '',
                prayer_requests: editReport.prayer_requests || '',
                reflections: editReport.reflections || '',
                other_work: editReport.other_work || '',
                tomorrow_tasks: editReport.tomorrow_tasks || '',
                other_activities: editReport.other_activities || ''
            });
        }
    }, [editReport]);

    // Check if all required fields are filled - different requirements for weekday vs Saturday vs Sunday
    useEffect(() => {
        const requiredFields = Array.isArray(dayConfig?.requiredFields)
            ? dayConfig.requiredFields
            : (isSaturday
                ? defaultSaturdayConfig.requiredFields
                : (isSunday
                    ? defaultSundayConfig.requiredFields
                    : defaultWeekdayConfig.requiredFields));

        const allRequiredFilled = requiredFields.every(field => {
            const normalizedField =
                field === 'evangelism_hours' ? 'evangelism_hours_hhmm'
                    : field === 'meditation_hours' ? 'meditation_hours_hhmm'
                        : field === 'prayer_hours' ? 'prayer_hours_hhmm'
                            : field;
            const value = formData[normalizedField];
            if (Array.isArray(value)) {
                return value.length > 0;
            }
            return value !== '' && value !== null && value !== undefined;
        });

        const prayerOk = !isSaturday || countNonEmptyLines(formData.prayer_requests) <= 3;
        const exerciseOk = !isSaturday || isValidDurationHHMM(formData.exercise_time_hhmm);
        const weekdayDurationOk = isSaturday || isSunday || (
            isValidDurationHHMM(formData.evangelism_hours_hhmm) &&
            (!showSection('spiritualDiscipline') ||
                (isValidDurationHHMM(formData.meditation_hours_hhmm) && isValidDurationHHMM(formData.prayer_hours_hhmm)))
        );
        setIsFormValid(allRequiredFilled && prayerOk && exerciseOk && weekdayDurationOk);
    }, [formData, isSaturday, isSunday, dayConfig, defaultSaturdayConfig, defaultSundayConfig, defaultWeekdayConfig]);

    const onChange = e => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const onServiceChange = (serviceName) => {
        const currentServices = formData.regular_service;
        if (currentServices.includes(serviceName)) {
            // Remove service if already selected
            setFormData({ 
                ...formData, 
                regular_service: currentServices.filter(s => s !== serviceName) 
            });
        } else {
            // Add service if not selected
            setFormData({ 
                ...formData, 
                regular_service: [...currentServices, serviceName] 
            });
        }
    };

    const onSubmit = async e => {
        e.preventDefault();
        
        // Prevent submission if there's a date warning (duplicate report)
        if (dateWarning && !editReport) {
            alert('You already have a report for this date. Please edit your existing report or choose a different date.');
            return;
        }
        
        if (isSaturday && countNonEmptyLines(formData.prayer_requests) > 3) {
            alert('Prayer requests must be no more than three (use one line per request).');
            return;
        }

        if (isSaturday && !isValidDurationHHMM(formData.exercise_time_hhmm)) {
            alert('Exercise time must be in HH:MM format (minutes 00-59). Example: 05:30');
            return;
        }

        if (!isSaturday && !isSunday) {
            const weekdayDurations = [
                ['Evangelism', formData.evangelism_hours_hhmm],
                ['Meditation', formData.meditation_hours_hhmm],
                ['Prayer', formData.prayer_hours_hhmm]
            ];
            const invalidDuration = weekdayDurations.find(([, value]) => !isValidDurationHHMM(value));
            if (invalidDuration) {
                alert(`${invalidDuration[0]} time must include valid hours and minutes (00-59).`);
                return;
            }
        }

        if (!isFormValid) {
            alert('Please fill all required fields');
            return;
        }

        const exerciseTotalHours = isSaturday
            ? (parseDurationHHMMToHours(formData.exercise_time_hhmm) || 0)
            : 0;
        const evangelismTotalHours = parseDurationHHMMToHours(formData.evangelism_hours_hhmm) || 0;
        const meditationTotalHours = parseDurationHHMMToHours(formData.meditation_hours_hhmm) || 0;
        const prayerTotalHours = parseDurationHHMMToHours(formData.prayer_hours_hhmm) || 0;

        // Normalize numeric fields so weekend submissions can omit weekday sections safely
        const dataToSend = {
            ...formData,
            evangelism_hours: evangelismTotalHours,
            people_reached: parseInt(formData.people_reached, 10) || 0,
            contacts_received: parseInt(formData.contacts_received, 10) || 0,
            bible_study_sessions: parseInt(formData.bible_study_sessions, 10) || 0,
            bible_study_attendants: parseInt(formData.bible_study_attendants, 10) || 0,
            newcomers: parseInt(formData.newcomers, 10) || 0,
            sermons_listened: parseInt(formData.sermons_listened, 10) || 0,
            articles_written: parseInt(formData.articles_written, 10) || 0,
            meditation_time: meditationTotalHours,
            prayer_time: prayerTotalHours,
            exercise_time: exerciseTotalHours || 0,
            regular_service: Array.isArray(formData.regular_service) ? formData.regular_service.join(', ') : formData.regular_service
        };

        // Weekend UX: "Other Activities" and "Plan for Next Week" are separate inputs.

        // Remove the individual hour fields that were renamed
        delete dataToSend.meditation_hours;
        delete dataToSend.prayer_hours;
        delete dataToSend.exercise_time_hhmm;
        delete dataToSend.evangelism_hours_hhmm;
        delete dataToSend.meditation_hours_hhmm;
        delete dataToSend.prayer_hours_hhmm;

        try {
            const token = localStorage.getItem('token');
            if (editReport) {
                // Update existing report
                await axios.put(`${API_URL}/api/reports/${editReport.id}`, dataToSend, {
                    headers: {
                        'x-auth-token': token,
                        'Content-Type': 'application/json'
                    }
                });
                alert('Report Updated Successfully! ✓');
            } else {
                // Create new report
                await axios.post(`${API_URL}/api/reports`, dataToSend, {
                    headers: {
                        'x-auth-token': token,
                        'Content-Type': 'application/json'
                    }
                });
                alert('Report Submitted Successfully! ✓');
            }
            navigate('/view-reports');
        } catch (err) {
            console.error(err);
            alert('Submission Failed: ' + (err.response?.data?.msg || 'Please try again'));
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4">
            <div className="max-w-5xl mx-auto pb-6">
                {/* Header */}
                <div className="bg-white rounded-2xl shadow-xl p-4 mb-4 sticky top-0 z-10">
                    <h1 className="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center gap-3">
                        <FaCalendarAlt className="text-indigo-600" />
                        {editReport ? 'Edit Ministry Report' : 'Daily Ministry Report'}
                    </h1>
                    <p className="text-sm text-gray-600 mt-1">
                        {editReport
                            ? 'Update your report details'
                            : (isSaturday
                                ? `Selected day: ${selectedDayName}. Saturday weekly reflection form.`
                                : (isSunday
                                    ? `Selected day: ${selectedDayName}. Sunday core message form.`
                                    : `Selected day: ${selectedDayName}. Weekday full daily form.`))}
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={onSubmit} className="space-y-4">
                    {/* Date Selection */}
                    <div className="bg-white rounded-2xl shadow-lg p-4">
                        <h2 className="text-lg md:text-xl font-bold text-gray-800 mb-3 flex items-center gap-2">
                            <FaCalendarAlt className="text-indigo-600" />
                            Pick Date to Fill Data
                        </h2>
                        <input
                            type="date"
                            name="date"
                            value={formData.date}
                            onChange={onChange}
                            required
                            className="w-full px-3 py-2.5 border-2 border-gray-300 rounded-xl focus:border-indigo-500 focus:outline-none text-base"
                        />
                        {dateWarning && (
                            <div className="mt-3 p-3 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800 rounded">
                                <p className="text-sm font-medium">{dateWarning}</p>
                            </div>
                        )}
                    </div>

                    {/* Basic Information */}
                    <div className="bg-white rounded-2xl shadow-lg p-4">
                        <h2 className="text-lg md:text-xl font-bold text-gray-800 mb-3 flex items-center gap-2">
                            <FaUser className="text-indigo-600" />
                            Basic Information
                        </h2>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">{getLabel('name', 'Name')}</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={onChange}
                                    placeholder={getPlaceholder('name', 'Your Full Name')}
                                    required
                                    className="w-full px-3 py-2.5 border-2 border-gray-300 rounded-xl focus:border-indigo-500 focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">{getLabel('country', 'Country')}</label>
                                <CountrySelect
                                    value={formData.country}
                                    onChange={(country) => setFormData({ ...formData, country })}
                                    placeholder={getPlaceholder('country', 'Type or select an African country')}
                                    required
                                    className="w-full px-3 py-2.5 border-2 border-gray-300 rounded-xl focus:border-indigo-500 focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">{getLabel('church', 'Church Currently Serving At')}</label>
                                <input
                                    type="text"
                                    name="church"
                                    value={formData.church}
                                    onChange={onChange}
                                    placeholder={getPlaceholder('church', 'Church Name')}
                                    required
                                    className="w-full px-3 py-2.5 border-2 border-gray-300 rounded-xl focus:border-indigo-500 focus:outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    {!isWeekend && showSection('ministryActivities') && (
                        <>
                            {/* Ministry Activities */}
                            <div className="bg-white rounded-2xl shadow-lg p-4">
                                <h2 className="text-lg md:text-xl font-bold text-gray-800 mb-3 flex items-center gap-2">
                                    <FaUsers className="text-green-600" />
                                    Ministry Activities
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <DurationField
                                            label={getLabel('evangelism_hours', 'Evangelism Time')}
                                            value={formData.evangelism_hours_hhmm}
                                            onChange={(value) => setFormData({ ...formData, evangelism_hours_hhmm: value })}
                                            required
                                            accent="green"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">{getLabel('people_reached', 'People Reached')}</label>
                                        <input
                                            type="number"
                                            name="people_reached"
                                            value={formData.people_reached}
                                            onChange={onChange}
                                            placeholder={getPlaceholder('people_reached', 'Input Number')}
                                            min="0"
                                            required
                                            className="w-full px-3 py-2.5 border-2 border-gray-300 rounded-xl focus:border-indigo-500 focus:outline-none"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">{getLabel('contacts_received', 'Contacts Received')}</label>
                                        <input
                                            type="number"
                                            name="contacts_received"
                                            value={formData.contacts_received}
                                            onChange={onChange}
                                            placeholder={getPlaceholder('contacts_received', 'Input Number')}
                                            min="0"
                                            required
                                            className="w-full px-3 py-2.5 border-2 border-gray-300 rounded-xl focus:border-indigo-500 focus:outline-none"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">{getLabel('newcomers', 'Newcomers')}</label>
                                        <input
                                            type="number"
                                            name="newcomers"
                                            value={formData.newcomers}
                                            onChange={onChange}
                                            placeholder={getPlaceholder('newcomers', 'Input Number')}
                                            min="0"
                                            required
                                            className="w-full px-3 py-2.5 border-2 border-gray-300 rounded-xl focus:border-indigo-500 focus:outline-none"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Bible Study */}
                            {showSection('bibleStudy') && (
                            <div className="bg-white rounded-2xl shadow-lg p-4">
                                <h2 className="text-lg md:text-xl font-bold text-gray-800 mb-3 flex items-center gap-2">
                                    <FaBook className="text-blue-600" />
                                    Bible Study
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">{getLabel('bible_study_sessions', 'Bible Study Sessions')}</label>
                                        <input
                                            type="number"
                                            name="bible_study_sessions"
                                            value={formData.bible_study_sessions}
                                            onChange={onChange}
                                            placeholder={getPlaceholder('bible_study_sessions', 'Number of Sessions')}
                                            min="0"
                                            required
                                            className="w-full px-3 py-2.5 border-2 border-gray-300 rounded-xl focus:border-indigo-500 focus:outline-none"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">{getLabel('bible_study_attendants', 'Bible Study Attendants')}</label>
                                        <input
                                            type="number"
                                            name="bible_study_attendants"
                                            value={formData.bible_study_attendants}
                                            onChange={onChange}
                                            placeholder={getPlaceholder('bible_study_attendants', 'Input Number')}
                                            min="0"
                                            required
                                            className="w-full px-3 py-2.5 border-2 border-gray-300 rounded-xl focus:border-indigo-500 focus:outline-none"
                                        />
                                    </div>
                                </div>
                            </div>
                            )}

                            {/* Spiritual Disciplines */}
                            {showSection('spiritualDiscipline') && (
                            <div className="bg-white rounded-2xl shadow-lg p-4">
                                <h2 className="text-lg md:text-xl font-bold text-gray-800 mb-3 flex items-center gap-2">
                                    <FaPray className="text-purple-600" />
                                    Personal Spiritual Discipline
                                </h2>
                                <div className="space-y-3">
                                    <div>
                                        <DurationField
                                            label={getLabel('meditation_hours', 'Bible Reading and Meditation')}
                                            value={formData.meditation_hours_hhmm}
                                            onChange={(value) => setFormData({ ...formData, meditation_hours_hhmm: value })}
                                            required
                                            accent="purple"
                                        />
                                    </div>

                                    <div>
                                        <DurationField
                                            label={getLabel('prayer_hours', 'Prayer Time')}
                                            value={formData.prayer_hours_hhmm}
                                            onChange={(value) => setFormData({ ...formData, prayer_hours_hhmm: value })}
                                            required
                                            accent="purple"
                                        />
                                    </div>
                                </div>
                            </div>
                            )}
                        </>
                    )}

                    {/* Saturday: Weekly Reflection (Saturday only) */}
                    {isSaturday && showSection('weeklyReflection') && (
                        <div className="bg-white rounded-2xl shadow-lg p-4">
                            <h2 className="text-lg md:text-xl font-bold text-gray-800 mb-3 flex items-center gap-2">
                                <FaPen className="text-indigo-600" />
                                Weekly Reflection (Saturday)
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <DurationField
                                        label="Exercise Time"
                                        value={formData.exercise_time_hhmm}
                                        onChange={(value) => setFormData({ ...formData, exercise_time_hhmm: value })}
                                        required={isSaturday}
                                        accent="green"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                                        Sermon Reflection :
                                    </label>
                                    <textarea
                                        name="sermon_reflection"
                                        value={formData.sermon_reflection}
                                        onChange={onChange}
                                        rows="4"
                                        placeholder={getPlaceholder('sermon_reflection', 'Write sermon reflection...')}
                                        required={isSaturday}
                                        className="w-full px-3 py-2.5 border-2 border-gray-300 rounded-xl focus:border-indigo-500 focus:outline-none resize-none"
                                    ></textarea>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Thanks giving :</label>
                                    <textarea
                                        name="thanksgiving"
                                        value={formData.thanksgiving}
                                        onChange={onChange}
                                        rows="4"
                                        placeholder="Write thanksgiving..."
                                        required={isSaturday}
                                        className="w-full px-3 py-2.5 border-2 border-gray-300 rounded-xl focus:border-indigo-500 focus:outline-none resize-none"
                                    ></textarea>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Repentance/Struggles :</label>
                                    <textarea
                                        name="repentance"
                                        value={formData.repentance}
                                        onChange={onChange}
                                        rows="4"
                                        placeholder="Write repentance/struggles..."
                                        required={isSaturday}
                                        className="w-full px-3 py-2.5 border-2 border-gray-300 rounded-xl focus:border-indigo-500 focus:outline-none resize-none"
                                    ></textarea>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Prayer Requests (no more than three) :</label>
                                    <textarea
                                        name="prayer_requests"
                                        value={formData.prayer_requests}
                                        onChange={onChange}
                                        rows="4"
                                        placeholder="1.\n2.\n3."
                                        required={isSaturday}
                                        className="w-full px-3 py-2.5 border-2 border-gray-300 rounded-xl focus:border-indigo-500 focus:outline-none resize-none"
                                    ></textarea>
                                    {prayerRequestsWarning ? (
                                        <p className="text-xs text-red-600 mt-2">{prayerRequestsWarning}</p>
                                    ) : (
                                        <p className="text-xs text-gray-500 mt-2">Use one line per request (max 3).</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                                        Overall Reflection and evaluation on the day :
                                    </label>
                                    <textarea
                                        name="reflections"
                                        value={formData.reflections}
                                        onChange={onChange}
                                        rows="4"
                                        placeholder="Write your overall reflection and evaluation on the day..."
                                        required={isSaturday}
                                        className="w-full px-3 py-2.5 border-2 border-gray-300 rounded-xl focus:border-indigo-500 focus:outline-none resize-none"
                                    ></textarea>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Other work done today(e.g departmental work, attended training, church cleaning...) :</label>
                                    <textarea
                                        name="other_work"
                                        value={formData.other_work}
                                        onChange={onChange}
                                        rows="4"
                                        placeholder="Describe other work done today..."
                                        required={isSaturday}
                                        className="w-full px-3 py-2.5 border-2 border-gray-300 rounded-xl focus:border-indigo-500 focus:outline-none resize-none"
                                    ></textarea>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">3 things must do tomorrow :</label>
                                    <textarea
                                        name="tomorrow_tasks"
                                        value={formData.tomorrow_tasks}
                                        onChange={onChange}
                                        rows="4"
                                        placeholder={getPlaceholder('tomorrow_tasks', '1. \n2. \n3. ')}
                                        required={isSaturday}
                                        className="w-full px-3 py-2.5 border-2 border-gray-300 rounded-xl focus:border-indigo-500 focus:outline-none resize-none"
                                    ></textarea>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Service Attendance */}
                    {showSection('serviceAttendance') && (
                    <div className="bg-white rounded-2xl shadow-lg p-4">
                        <h2 className="text-lg md:text-xl font-bold text-gray-800 mb-3 flex items-center gap-2">
                            <FaChurch className="text-orange-600" />
                            Service Attendance
                        </h2>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-3">{getLabel('regular_service', 'Regular Service Type(s) - Select all that apply')}</label>
                            <div className="space-y-3">
                                <label className="flex items-center gap-3 p-2.5 border-2 border-gray-200 rounded-xl hover:border-indigo-300 cursor-pointer transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={formData.regular_service.includes('No Service Attended')}
                                        onChange={() => onServiceChange('No Service Attended')}
                                        className="w-4 h-4 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500"
                                    />
                                    <span className="text-sm text-gray-700 font-medium">No Service Attended</span>
                                </label>
                                <label className="flex items-center gap-3 p-2.5 border-2 border-gray-200 rounded-xl hover:border-indigo-300 cursor-pointer transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={formData.regular_service.includes('Morning Service')}
                                        onChange={() => onServiceChange('Morning Service')}
                                        className="w-4 h-4 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500"
                                    />
                                    <span className="text-sm text-gray-700 font-medium">Morning Service</span>
                                </label>
                                <label className="flex items-center gap-3 p-2.5 border-2 border-gray-200 rounded-xl hover:border-indigo-300 cursor-pointer transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={formData.regular_service.includes('Wednesday Weekly Service')}
                                        onChange={() => onServiceChange('Wednesday Weekly Service')}
                                        className="w-4 h-4 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500"
                                    />
                                    <span className="text-sm text-gray-700 font-medium">Wednesday Weekly Service</span>
                                </label>
                                <label className="flex items-center gap-3 p-2.5 border-2 border-gray-200 rounded-xl hover:border-indigo-300 cursor-pointer transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={formData.regular_service.includes('Friday Prayer Meeting')}
                                        onChange={() => onServiceChange('Friday Prayer Meeting')}
                                        className="w-4 h-4 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500"
                                    />
                                    <span className="text-sm text-gray-700 font-medium">Friday Prayer Meeting</span>
                                </label>

                                {isSaturday && (
                                    <label className="flex items-center gap-3 p-2.5 border-2 border-gray-200 rounded-xl hover:border-indigo-300 cursor-pointer transition-colors">
                                        <input
                                            type="checkbox"
                                            checked={formData.regular_service.includes('Saturday Weekly Bible Study')}
                                            onChange={() => onServiceChange('Saturday Weekly Bible Study')}
                                            className="w-4 h-4 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500"
                                        />
                                        <span className="text-sm text-gray-700 font-medium">Saturday Weekly Bible Study</span>
                                    </label>
                                )}

                                <label className="flex items-center gap-3 p-2.5 border-2 border-gray-200 rounded-xl hover:border-indigo-300 cursor-pointer transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={formData.regular_service.includes('Sunday Service')}
                                        onChange={() => onServiceChange('Sunday Service')}
                                        className="w-4 h-4 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500"
                                    />
                                    <span className="text-sm text-gray-700 font-medium">Sunday Service</span>
                                </label>
                            </div>
                            <p className="text-xs text-gray-500 mt-2">You can select multiple services if you attended more than one.</p>
                        </div>

                        {showSection('serviceAttendanceExtras') && (
                            <>
                                <div className="mt-4">
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">{getLabel('sermons_listened', 'Sermons or Bible Study Listened To')}</label>
                                    <input
                                        type="number"
                                        name="sermons_listened"
                                        value={formData.sermons_listened}
                                        onChange={onChange}
                                        placeholder={getPlaceholder('sermons_listened', 'Input Number')}
                                        min="0"
                                        required
                                        className="w-full px-3 py-2.5 border-2 border-gray-300 rounded-xl focus:border-indigo-500 focus:outline-none"
                                    />
                                </div>

                                <div className="mt-4">
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">{getLabel('articles_written', 'Articles Written')}</label>
                                    <input
                                        type="number"
                                        name="articles_written"
                                        value={formData.articles_written}
                                        onChange={onChange}
                                        placeholder={getPlaceholder('articles_written', 'Input Number')}
                                        min="0"
                                        required
                                        className="w-full px-3 py-2.5 border-2 border-gray-300 rounded-xl focus:border-indigo-500 focus:outline-none"
                                    />
                                </div>
                            </>
                        )}
                    </div>
                    )}

                    {/* Sunday: Service core message */}
                    {isSunday && showSection('sundayCoreMessage') && (
                        <div className="bg-white rounded-2xl shadow-lg p-4">
                            <h2 className="text-lg md:text-xl font-bold text-gray-800 mb-3 flex items-center gap-2">
                                <FaPen className="text-pink-600" />
                                {getLabel('sermon_reflection', 'Sunday Service Core Message')}
                            </h2>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">
                                    Write the core message (Sunday)
                                </label>
                                <textarea
                                    name="sermon_reflection"
                                    value={formData.sermon_reflection}
                                    onChange={onChange}
                                    rows="4"
                                    placeholder={getPlaceholder('sermon_reflection', 'Write the main points / core message...')}
                                    required={isSunday}
                                    className="w-full px-3 py-2.5 border-2 border-gray-300 rounded-xl focus:border-indigo-500 focus:outline-none resize-none"
                                ></textarea>
                            </div>
                        </div>
                    )}

                    {/* Other Activities - Optional for all days */}
                    {showSection('otherActivities') && (
                    <div className="bg-white rounded-2xl shadow-lg p-4">
                        <h2 className="text-lg md:text-xl font-bold text-gray-800 mb-3 flex items-center gap-2">
                            <FaPen className="text-green-600" />
                            {getLabel('other_activities', 'Other Activities (Optional)')}
                        </h2>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">
                                Any other ministry or personal activities for today
                            </label>
                            <textarea
                                name="other_activities"
                                value={formData.other_activities}
                                onChange={onChange}
                                rows="3"
                                placeholder={getPlaceholder('other_activities', 'Describe any other activities, events, or tasks you did today (optional)...')}
                                className="w-full px-3 py-2.5 border-2 border-gray-300 rounded-xl focus:border-indigo-500 focus:outline-none resize-none"
                            ></textarea>
                            <p className="text-xs text-gray-500 mt-2">This field is optional - fill it only if you have additional activities to report.</p>
                        </div>
                    </div>
                    )}

                    {/* Saturday: Plan for Next Week */}
                    {isSaturday && showSection('planNextWeek') && null}

                    {/* Submit Button */}
                    <div className="sticky bottom-4 bg-white rounded-2xl shadow-xl p-4">
                        <p className="text-sm text-gray-600 mb-3 text-center">
                            {isFormValid ? '✓ Ready to submit' : (isSaturday ? '⚠ Fill the required Saturday weekly fields to submit' : (isSunday ? '⚠ Fill the required Sunday fields to submit' : '⚠ Button will be active when all input boxes are filled'))}
                        </p>
                        <button
                            type="submit"
                            disabled={!isFormValid}
                            className={`w-full py-3 rounded-xl font-bold text-base transition-all ${
                                isFormValid
                                    ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 shadow-lg transform hover:scale-[1.01]'
                                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            }`}
                        >
                            {isFormValid ? '✓ Submit Report' : '✗ Fill All Fields to Submit'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ReportForm;
