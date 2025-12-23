import React, { useMemo, useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaCalendarAlt, FaChurch, FaGlobe, FaUser, FaClock, FaUsers, FaBook, FaPray, FaDumbbell, FaPen, FaSearch } from 'react-icons/fa';
import { API_URL } from '../utils/api';

const ReportForm = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const editReport = location.state?.editReport;

    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        name: '',
        country: '',
        church: '',
        evangelism_hours: '',
        people_reached: '',
        contacts_received: '',
        bible_study_sessions: '',
        bible_study_attendants: '',
        newcomers: '',
        meditation_hours: '',
        prayer_hours: '',
        morning_service: 'No',
        regular_service: [],
        sermons_listened: '',
        articles_written: '',
        exercise_hours: '',
        exercise_minutes: '',
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
    const [countrySearch, setCountrySearch] = useState('');
    const [showCountryDropdown, setShowCountryDropdown] = useState(false);
    const [isWeekend, setIsWeekend] = useState(false);
    const [dateWarning, setDateWarning] = useState('');
    const [activeTemplate, setActiveTemplate] = useState(null);

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
            'evangelism_hours', 'people_reached', 'contacts_received',
            'bible_study_sessions', 'bible_study_attendants',
            'newcomers', 'meditation_hours', 'prayer_hours',
            'sermons_listened', 'articles_written'
        ]
    }), []);

    const defaultWeekendConfig = useMemo(() => ({
        visibleSections: [
            'serviceAttendance',
            'sundayCoreMessage',
            'otherActivities',
            'planNextWeek'
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

    const dayConfig = useMemo(() => {
        const def = activeTemplate?.definition;
        const cfg = isWeekend ? def?.weekend : def?.weekday;
        return cfg || (isWeekend ? defaultWeekendConfig : defaultWeekdayConfig);
    }, [activeTemplate, isWeekend, defaultWeekendConfig, defaultWeekdayConfig]);

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

    // Check if selected date is weekend (Saturday or Sunday) and check for existing reports
    useEffect(() => {
        if (formData.date) {
            const selectedDate = new Date(formData.date + 'T00:00:00');
            const dayOfWeek = selectedDate.getDay();
            // 0 = Sunday, 6 = Saturday
            setIsWeekend(dayOfWeek === 0 || dayOfWeek === 6);
            
            // Check if report exists for this date
            checkExistingReport(formData.date);
        }
    }, [formData.date]);

    // Load edit data if editing
    useEffect(() => {
        if (editReport) {
            const exerciseTime = Number(editReport.exercise_time);
            let exerciseHours = '';
            let exerciseMinutes = '';
            if (!Number.isNaN(exerciseTime)) {
                const wholeHours = Math.max(0, Math.floor(exerciseTime));
                const minutes = Math.max(0, Math.round((exerciseTime - wholeHours) * 60));
                const normalizedMinutes = minutes >= 60 ? 0 : minutes;
                const normalizedHours = minutes >= 60 ? wholeHours + 1 : wholeHours;
                exerciseHours = normalizedHours.toString();
                exerciseMinutes = normalizedMinutes.toString();
            }

            setFormData({
                date: editReport.date,
                name: editReport.name || '',
                country: editReport.country || '',
                church: editReport.church || '',
                evangelism_hours: editReport.evangelism_hours?.toString() || '',
                people_reached: editReport.people_reached?.toString() || '',
                contacts_received: editReport.contacts_received?.toString() || '',
                bible_study_sessions: editReport.bible_study_sessions?.toString() || '',
                bible_study_attendants: editReport.bible_study_attendants?.toString() || '',
                newcomers: editReport.newcomers?.toString() || '',
                meditation_hours: editReport.meditation_time?.toString() || '',
                prayer_hours: editReport.prayer_time?.toString() || '',
                morning_service: editReport.morning_service || 'No',
                regular_service: editReport.regular_service ? (typeof editReport.regular_service === 'string' ? editReport.regular_service.split(',').map(s => s.trim()) : []) : [],
                sermons_listened: editReport.sermons_listened?.toString() || '',
                articles_written: editReport.articles_written?.toString() || '',
                exercise_hours: exerciseHours,
                exercise_minutes: exerciseMinutes,
                sermon_reflection: editReport.sermon_reflection || '',
                thanksgiving: editReport.thanksgiving || '',
                repentance: editReport.repentance || '',
                prayer_requests: editReport.prayer_requests || '',
                reflections: editReport.reflections || '',
                other_work: editReport.other_work || '',
                tomorrow_tasks: editReport.tomorrow_tasks || '',
                other_activities: editReport.other_activities || ''
            });
            setCountrySearch(editReport.country || '');
        }
    }, [editReport]);

    // Check if all required fields are filled - different requirements for weekday vs weekend
    useEffect(() => {
        const requiredFields = Array.isArray(dayConfig?.requiredFields)
            ? dayConfig.requiredFields
            : (isWeekend ? defaultWeekendConfig.requiredFields : defaultWeekdayConfig.requiredFields);

        const allRequiredFilled = requiredFields.every(field => {
            const value = formData[field];
            if (Array.isArray(value)) {
                return value.length > 0;
            }
            return value !== '' && value !== null && value !== undefined;
        });

        setIsFormValid(allRequiredFilled);
    }, [formData, isWeekend, dayConfig, defaultWeekendConfig, defaultWeekdayConfig]);

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
        
        if (!isFormValid) {
            alert('Please fill all required fields');
            return;
        }

        const exerciseHours = parseInt(formData.exercise_hours, 10) || 0;
        const exerciseMinutesRaw = parseInt(formData.exercise_minutes, 10) || 0;
        const exerciseMinutes = Math.max(0, Math.min(59, exerciseMinutesRaw));
        const exerciseTotalHours = exerciseHours + (exerciseMinutes / 60);

        // Normalize numeric fields so weekend submissions can omit weekday sections safely
        const dataToSend = {
            ...formData,
            evangelism_hours: parseFloat(formData.evangelism_hours) || 0,
            people_reached: parseInt(formData.people_reached, 10) || 0,
            contacts_received: parseInt(formData.contacts_received, 10) || 0,
            bible_study_sessions: parseInt(formData.bible_study_sessions, 10) || 0,
            bible_study_attendants: parseInt(formData.bible_study_attendants, 10) || 0,
            newcomers: parseInt(formData.newcomers, 10) || 0,
            sermons_listened: parseInt(formData.sermons_listened, 10) || 0,
            articles_written: parseInt(formData.articles_written, 10) || 0,
            meditation_time: parseFloat(formData.meditation_hours) || 0,
            prayer_time: parseFloat(formData.prayer_hours) || 0,
            exercise_time: exerciseTotalHours || 0,
            regular_service: Array.isArray(formData.regular_service) ? formData.regular_service.join(', ') : formData.regular_service
        };

        // Weekend UX: "Other Activities" and "Plan for Next Week" are separate inputs.

        // Remove the individual hour fields that were renamed
        delete dataToSend.meditation_hours;
        delete dataToSend.prayer_hours;
        delete dataToSend.exercise_hours;
        delete dataToSend.exercise_minutes;

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

    const countries = [
        'Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola', 'Argentina', 'Armenia', 'Australia',
        'Austria', 'Azerbaijan', 'Bahamas', 'Bahrain', 'Bangladesh', 'Barbados', 'Belarus', 'Belgium',
        'Belize', 'Benin', 'Bhutan', 'Bolivia', 'Bosnia and Herzegovina', 'Botswana', 'Brazil', 'Brunei',
        'Bulgaria', 'Burkina Faso', 'Burundi', 'Cambodia', 'Cameroon', 'Canada', 'Cape Verde',
        'Central African Republic', 'Chad', 'Chile', 'China', 'Colombia', 'Comoros', 'Congo',
        'Costa Rica', 'Croatia', 'Cuba', 'Cyprus', 'Czech Republic', 'Denmark', 'Djibouti', 'Dominica',
        'Dominican Republic', 'East Timor', 'Ecuador', 'Egypt', 'El Salvador', 'Equatorial Guinea',
        'Eritrea', 'Estonia', 'Ethiopia', 'Fiji', 'Finland', 'France', 'Gabon', 'Gambia', 'Georgia',
        'Germany', 'Ghana', 'Greece', 'Grenada', 'Guatemala', 'Guinea', 'Guinea-Bissau', 'Guyana',
        'Haiti', 'Honduras', 'Hungary', 'Iceland', 'India', 'Indonesia', 'Iran', 'Iraq', 'Ireland',
        'Israel', 'Italy', 'Jamaica', 'Japan', 'Jordan', 'Kazakhstan', 'Kenya', 'Kiribati', 'Kuwait',
        'Kyrgyzstan', 'Laos', 'Latvia', 'Lebanon', 'Lesotho', 'Liberia', 'Libya', 'Liechtenstein',
        'Lithuania', 'Luxembourg', 'Madagascar', 'Malawi', 'Malaysia', 'Maldives', 'Mali', 'Malta',
        'Marshall Islands', 'Mauritania', 'Mauritius', 'Mexico', 'Micronesia', 'Moldova', 'Monaco',
        'Mongolia', 'Montenegro', 'Morocco', 'Mozambique', 'Myanmar', 'Namibia', 'Nauru', 'Nepal',
        'Netherlands', 'New Zealand', 'Nicaragua', 'Niger', 'Nigeria', 'North Korea', 'North Macedonia',
        'Norway', 'Oman', 'Pakistan', 'Palau', 'Palestine', 'Panama', 'Papua New Guinea', 'Paraguay',
        'Peru', 'Philippines', 'Poland', 'Portugal', 'Qatar', 'Romania', 'Russia', 'Rwanda',
        'Saint Kitts and Nevis', 'Saint Lucia', 'Saint Vincent and the Grenadines', 'Samoa',
        'San Marino', 'Sao Tome and Principe', 'Saudi Arabia', 'Senegal', 'Serbia', 'Seychelles',
        'Sierra Leone', 'Singapore', 'Slovakia', 'Slovenia', 'Solomon Islands', 'Somalia', 'South Africa',
        'South Korea', 'South Sudan', 'Spain', 'Sri Lanka', 'Sudan', 'Suriname', 'Sweden', 'Switzerland',
        'Syria', 'Taiwan', 'Tajikistan', 'Tanzania', 'Thailand', 'Togo', 'Tonga', 'Trinidad and Tobago',
        'Tunisia', 'Turkey', 'Turkmenistan', 'Tuvalu', 'Uganda', 'Ukraine', 'United Arab Emirates',
        'United Kingdom', 'United States', 'Uruguay', 'Uzbekistan', 'Vanuatu', 'Vatican City',
        'Venezuela', 'Vietnam', 'Yemen', 'Zambia', 'Zimbabwe'
    ];

    const filteredCountries = countries.filter(country =>
        country.toLowerCase().includes(countrySearch.toLowerCase())
    );

    const handleCountrySelect = (country) => {
        setFormData({ ...formData, country });
        setCountrySearch(country);
        setShowCountryDropdown(false);
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
                        {editReport ? 'Update your report details' : (isWeekend ? 'Weekend: fill the short form to submit your report' : 'Fill all fields to submit your report')}
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
                                <div className="relative">
                                    <div className="relative">
                                        <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                        <input
                                            type="text"
                                            value={countrySearch}
                                            onChange={(e) => {
                                                setCountrySearch(e.target.value);
                                                setShowCountryDropdown(true);
                                            }}
                                            onFocus={() => setShowCountryDropdown(true)}
                                            placeholder={getPlaceholder('country', 'Search or select a country')}
                                            required
                                            className="w-full pl-11 pr-3 py-2.5 border-2 border-gray-300 rounded-xl focus:border-indigo-500 focus:outline-none"
                                        />
                                    </div>
                                    {showCountryDropdown && filteredCountries.length > 0 && (
                                        <div className="absolute z-10 w-full mt-1 bg-white border-2 border-gray-300 rounded-xl shadow-lg max-h-60 overflow-y-auto no-scrollbar">
                                            {filteredCountries.map(country => (
                                                <div
                                                    key={country}
                                                    onClick={() => handleCountrySelect(country)}
                                                    className="px-3 py-2.5 hover:bg-indigo-50 cursor-pointer transition-colors text-sm"
                                                >
                                                    {country}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
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
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">{getLabel('evangelism_hours', 'Evangelism Hours')}</label>
                                        <input
                                            type="number"
                                            name="evangelism_hours"
                                            value={formData.evangelism_hours}
                                            onChange={onChange}
                                            placeholder={getPlaceholder('evangelism_hours', 'Enter Hours')}
                                            min="0"
                                            step="0.5"
                                            required
                                            className="w-full px-3 py-2.5 border-2 border-gray-300 rounded-xl focus:border-indigo-500 focus:outline-none"
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
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">{getLabel('meditation_hours', 'Bible Reading and Meditation (Hours)')}</label>
                                        <input
                                            type="number"
                                            name="meditation_hours"
                                            value={formData.meditation_hours}
                                            onChange={onChange}
                                            placeholder={getPlaceholder('meditation_hours', 'Enter Hours')}
                                            min="0"
                                            step="0.5"
                                            required
                                            className="w-full px-3 py-2.5 border-2 border-gray-300 rounded-xl focus:border-indigo-500 focus:outline-none"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">{getLabel('prayer_hours', 'Prayer (Hours)')}</label>
                                        <input
                                            type="number"
                                            name="prayer_hours"
                                            value={formData.prayer_hours}
                                            onChange={onChange}
                                            placeholder={getPlaceholder('prayer_hours', 'Enter Hours')}
                                            min="0"
                                            step="0.5"
                                            required
                                            className="w-full px-3 py-2.5 border-2 border-gray-300 rounded-xl focus:border-indigo-500 focus:outline-none"
                                        />
                                    </div>
                                </div>
                            </div>
                            )}
                        </>
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

                    {/* Weekend: Sunday Service core message */}
                    {isWeekend && showSection('sundayCoreMessage') && (
                        <div className="bg-white rounded-2xl shadow-lg p-4">
                            <h2 className="text-lg md:text-xl font-bold text-gray-800 mb-3 flex items-center gap-2">
                                <FaPen className="text-pink-600" />
                                {getLabel('sermon_reflection', 'Sunday Service Core Message')}
                            </h2>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">
                                    Write the core message (Sunday/Saturday)
                                </label>
                                <textarea
                                    name="sermon_reflection"
                                    value={formData.sermon_reflection}
                                    onChange={onChange}
                                    rows="4"
                                    placeholder={getPlaceholder('sermon_reflection', 'Write the main points / core message...')}
                                    required={isWeekend}
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

                    {/* Weekend: Plan for Next Week (separate input) */}
                    {isWeekend && showSection('planNextWeek') && (
                        <div className="bg-white rounded-2xl shadow-lg p-4">
                            <h2 className="text-lg md:text-xl font-bold text-gray-800 mb-3 flex items-center gap-2">
                                <FaPen className="text-indigo-600" />
                                {getLabel('tomorrow_tasks', 'Plan for Next Week (Optional)')}
                            </h2>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">
                                    What you plan to do next week
                                </label>
                                <textarea
                                    name="tomorrow_tasks"
                                    value={formData.tomorrow_tasks}
                                    onChange={onChange}
                                    rows="3"
                                    placeholder={getPlaceholder('tomorrow_tasks', '1. \n2. \n3. ')}
                                    className="w-full px-3 py-2.5 border-2 border-gray-300 rounded-xl focus:border-indigo-500 focus:outline-none resize-none"
                                ></textarea>
                            </div>
                        </div>
                    )}

                    {/* Submit Button */}
                    <div className="sticky bottom-4 bg-white rounded-2xl shadow-xl p-4">
                        <p className="text-sm text-gray-600 mb-3 text-center">
                            {isFormValid ? '✓ Ready to submit' : (isWeekend ? '⚠ Fill the required weekend fields to submit' : '⚠ Button will be active when all input boxes are filled')}
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
