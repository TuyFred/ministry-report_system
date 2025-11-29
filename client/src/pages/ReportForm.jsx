import React, { useState, useEffect } from 'react';
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
        evangelism_minutes: '',
        people_reached: '',
        contacts_received: '',
        bible_study_sessions: '',
        bible_study_attendants: '',
        unique_attendants: '',
        newcomers: '',
        meditation_hours: '',
        meditation_minutes: '',
        prayer_hours: '',
        prayer_minutes: '',
        morning_service: '',
        regular_service: '',
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
        tomorrow_tasks: ''
    });

    const [isFormValid, setIsFormValid] = useState(false);
    const [countrySearch, setCountrySearch] = useState('');
    const [showCountryDropdown, setShowCountryDropdown] = useState(false);

    // Load edit data if editing
    useEffect(() => {
        if (editReport) {
            const convertMinutesToHoursAndMinutes = (totalMinutes) => {
                const hours = Math.floor(totalMinutes / 60);
                const minutes = totalMinutes % 60;
                return { hours, minutes };
            };

            const evangelism = convertMinutesToHoursAndMinutes(editReport.evangelism_hours || 0);
            const meditation = convertMinutesToHoursAndMinutes(editReport.meditation_time || 0);
            const prayer = convertMinutesToHoursAndMinutes(editReport.prayer_time || 0);
            const exercise = convertMinutesToHoursAndMinutes(editReport.exercise_time || 0);

            setFormData({
                date: editReport.date,
                name: editReport.name || '',
                country: editReport.country || '',
                church: editReport.church || '',
                evangelism_hours: evangelism.hours.toString(),
                evangelism_minutes: evangelism.minutes.toString(),
                people_reached: editReport.people_reached?.toString() || '',
                contacts_received: editReport.contacts_received?.toString() || '',
                bible_study_sessions: editReport.bible_study_sessions?.toString() || '',
                bible_study_attendants: editReport.bible_study_attendants?.toString() || '',
                unique_attendants: editReport.unique_attendants?.toString() || '',
                newcomers: editReport.newcomers?.toString() || '',
                meditation_hours: meditation.hours.toString(),
                meditation_minutes: meditation.minutes.toString(),
                prayer_hours: prayer.hours.toString(),
                prayer_minutes: prayer.minutes.toString(),
                morning_service: editReport.morning_service || '',
                regular_service: editReport.regular_service || '',
                sermons_listened: editReport.sermons_listened?.toString() || '',
                articles_written: editReport.articles_written?.toString() || '',
                exercise_hours: exercise.hours.toString(),
                exercise_minutes: exercise.minutes.toString(),
                sermon_reflection: editReport.sermon_reflection || '',
                thanksgiving: editReport.thanksgiving || '',
                repentance: editReport.repentance || '',
                prayer_requests: editReport.prayer_requests || '',
                reflections: editReport.reflections || '',
                other_work: editReport.other_work || '',
                tomorrow_tasks: editReport.tomorrow_tasks || ''
            });
            setCountrySearch(editReport.country || '');
        }
    }, [editReport]);

    // Check if all required fields are filled
    useEffect(() => {
        const requiredFields = [
            'date', 'name', 'country', 'church', 'evangelism_hours', 'evangelism_minutes',
            'people_reached', 'contacts_received', 'bible_study_sessions', 'bible_study_attendants',
            'unique_attendants', 'newcomers', 'meditation_hours', 'meditation_minutes',
            'prayer_hours', 'prayer_minutes', 'morning_service', 'regular_service',
            'sermons_listened', 'articles_written', 'exercise_hours', 'exercise_minutes',
            'sermon_reflection', 'thanksgiving', 'repentance', 'prayer_requests',
            'reflections', 'other_work', 'tomorrow_tasks'
        ];

        const allFilled = requiredFields.every(field => {
            const value = formData[field];
            return value !== '' && value !== null && value !== undefined;
        });

        setIsFormValid(allFilled);
    }, [formData]);

    const onChange = e => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const onSubmit = async e => {
        e.preventDefault();
        
        if (!isFormValid) {
            alert('Please fill all required fields');
            return;
        }

        // Convert time fields to total minutes
        const dataToSend = {
            ...formData,
            evangelism_hours: parseInt(formData.evangelism_hours) * 60 + parseInt(formData.evangelism_minutes),
            meditation_time: parseInt(formData.meditation_hours) * 60 + parseInt(formData.meditation_minutes),
            prayer_time: parseInt(formData.prayer_hours) * 60 + parseInt(formData.prayer_minutes),
            exercise_time: parseInt(formData.exercise_hours) * 60 + parseInt(formData.exercise_minutes)
        };

        // Remove the individual hour/minute fields
        delete dataToSend.evangelism_minutes;
        delete dataToSend.meditation_hours;
        delete dataToSend.meditation_minutes;
        delete dataToSend.prayer_hours;
        delete dataToSend.prayer_minutes;
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
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4 overflow-y-auto">
            <div className="max-w-5xl mx-auto pb-8">
                {/* Header */}
                <div className="bg-white rounded-2xl shadow-xl p-6 mb-6 sticky top-0 z-10">
                    <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center gap-3">
                        <FaCalendarAlt className="text-indigo-600" />
                        {editReport ? 'Edit Ministry Report' : 'Daily Ministry Report'}
                    </h1>
                    <p className="text-gray-600 mt-2">
                        {editReport ? 'Update your report details' : 'Fill all fields to submit your report'}
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={onSubmit} className="space-y-6">
                    {/* Date Selection */}
                    <div className="bg-white rounded-2xl shadow-lg p-6">
                        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <FaCalendarAlt className="text-indigo-600" />
                            Pick Date to Fill Data
                        </h2>
                        <input
                            type="date"
                            name="date"
                            value={formData.date}
                            onChange={onChange}
                            required
                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-indigo-500 focus:outline-none text-lg"
                        />
                    </div>

                    {/* Basic Information */}
                    <div className="bg-white rounded-2xl shadow-lg p-6">
                        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <FaUser className="text-indigo-600" />
                            Basic Information
                        </h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={onChange}
                                    placeholder="Your Full Name"
                                    required
                                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-indigo-500 focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Country</label>
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
                                            placeholder="Search or select a country"
                                            required
                                            className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:border-indigo-500 focus:outline-none"
                                        />
                                    </div>
                                    {showCountryDropdown && filteredCountries.length > 0 && (
                                        <div className="absolute z-10 w-full mt-1 bg-white border-2 border-gray-300 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                                            {filteredCountries.map(country => (
                                                <div
                                                    key={country}
                                                    onClick={() => handleCountrySelect(country)}
                                                    className="px-4 py-3 hover:bg-indigo-50 cursor-pointer transition-colors"
                                                >
                                                    {country}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Church Currently Serving At</label>
                                <input
                                    type="text"
                                    name="church"
                                    value={formData.church}
                                    onChange={onChange}
                                    placeholder="Church Name"
                                    required
                                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-indigo-500 focus:outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Ministry Activities */}
                    <div className="bg-white rounded-2xl shadow-lg p-6">
                        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <FaUsers className="text-green-600" />
                            Ministry Activities
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Evangelism Hours (HH:MM)</label>
                                <div className="flex gap-2">
                                    <input
                                        type="number"
                                        name="evangelism_hours"
                                        value={formData.evangelism_hours}
                                        onChange={onChange}
                                        placeholder="HH"
                                        min="0"
                                        max="23"
                                        required
                                        className="w-1/2 px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-indigo-500 focus:outline-none"
                                    />
                                    <span className="text-2xl font-bold text-gray-500">:</span>
                                    <input
                                        type="number"
                                        name="evangelism_minutes"
                                        value={formData.evangelism_minutes}
                                        onChange={onChange}
                                        placeholder="MM"
                                        min="0"
                                        max="59"
                                        required
                                        className="w-1/2 px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-indigo-500 focus:outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">People Reached</label>
                                <input
                                    type="number"
                                    name="people_reached"
                                    value={formData.people_reached}
                                    onChange={onChange}
                                    placeholder="Input Number"
                                    min="0"
                                    required
                                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-indigo-500 focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Contacts Received</label>
                                <input
                                    type="number"
                                    name="contacts_received"
                                    value={formData.contacts_received}
                                    onChange={onChange}
                                    placeholder="Input Number"
                                    min="0"
                                    required
                                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-indigo-500 focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Newcomers</label>
                                <input
                                    type="number"
                                    name="newcomers"
                                    value={formData.newcomers}
                                    onChange={onChange}
                                    placeholder="Input Number"
                                    min="0"
                                    required
                                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-indigo-500 focus:outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Bible Study */}
                    <div className="bg-white rounded-2xl shadow-lg p-6">
                        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <FaBook className="text-blue-600" />
                            Bible Study
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Bible Study Sessions</label>
                                <input
                                    type="number"
                                    name="bible_study_sessions"
                                    value={formData.bible_study_sessions}
                                    onChange={onChange}
                                    placeholder="Number of Sessions"
                                    min="0"
                                    required
                                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-indigo-500 focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Bible Study Attendants</label>
                                <input
                                    type="number"
                                    name="bible_study_attendants"
                                    value={formData.bible_study_attendants}
                                    onChange={onChange}
                                    placeholder="Input Number"
                                    min="0"
                                    required
                                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-indigo-500 focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Unique Bible Study Attendants</label>
                                <input
                                    type="number"
                                    name="unique_attendants"
                                    value={formData.unique_attendants}
                                    onChange={onChange}
                                    placeholder="Input Number"
                                    min="0"
                                    required
                                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-indigo-500 focus:outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Spiritual Disciplines */}
                    <div className="bg-white rounded-2xl shadow-lg p-6">
                        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <FaPray className="text-purple-600" />
                            Spiritual Disciplines
                        </h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Bible Reading and Meditation (HH:MM)</label>
                                <div className="flex gap-2">
                                    <input
                                        type="number"
                                        name="meditation_hours"
                                        value={formData.meditation_hours}
                                        onChange={onChange}
                                        placeholder="HH"
                                        min="0"
                                        max="23"
                                        required
                                        className="w-1/2 px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-indigo-500 focus:outline-none"
                                    />
                                    <span className="text-2xl font-bold text-gray-500">:</span>
                                    <input
                                        type="number"
                                        name="meditation_minutes"
                                        value={formData.meditation_minutes}
                                        onChange={onChange}
                                        placeholder="MM"
                                        min="0"
                                        max="59"
                                        required
                                        className="w-1/2 px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-indigo-500 focus:outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Prayer (HH:MM)</label>
                                <div className="flex gap-2">
                                    <input
                                        type="number"
                                        name="prayer_hours"
                                        value={formData.prayer_hours}
                                        onChange={onChange}
                                        placeholder="HH"
                                        min="0"
                                        max="23"
                                        required
                                        className="w-1/2 px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-indigo-500 focus:outline-none"
                                    />
                                    <span className="text-2xl font-bold text-gray-500">:</span>
                                    <input
                                        type="number"
                                        name="prayer_minutes"
                                        value={formData.prayer_minutes}
                                        onChange={onChange}
                                        placeholder="MM"
                                        min="0"
                                        max="59"
                                        required
                                        className="w-1/2 px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-indigo-500 focus:outline-none"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Service Attendance */}
                    <div className="bg-white rounded-2xl shadow-lg p-6">
                        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <FaChurch className="text-orange-600" />
                            Service Attendance
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Morning Service Attendance</label>
                                <select
                                    name="morning_service"
                                    value={formData.morning_service}
                                    onChange={onChange}
                                    required
                                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-indigo-500 focus:outline-none bg-white"
                                >
                                    <option value="">Select</option>
                                    <option value="Yes">Yes</option>
                                    <option value="No">No</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Regular Service Attendance</label>
                                <select
                                    name="regular_service"
                                    value={formData.regular_service}
                                    onChange={onChange}
                                    required
                                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-indigo-500 focus:outline-none bg-white"
                                >
                                    <option value="">Select</option>
                                    <option value="Yes">Yes</option>
                                    <option value="No">No</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Sermons or Bible Study Listened To</label>
                                <input
                                    type="number"
                                    name="sermons_listened"
                                    value={formData.sermons_listened}
                                    onChange={onChange}
                                    placeholder="Input Number"
                                    min="0"
                                    required
                                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-indigo-500 focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Articles Written</label>
                                <input
                                    type="number"
                                    name="articles_written"
                                    value={formData.articles_written}
                                    onChange={onChange}
                                    placeholder="Input Number"
                                    min="0"
                                    required
                                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-indigo-500 focus:outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Physical Health */}
                    <div className="bg-white rounded-2xl shadow-lg p-6">
                        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <FaDumbbell className="text-red-600" />
                            Physical Health
                        </h2>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Exercise (HH:MM)</label>
                            <div className="flex gap-2">
                                <input
                                    type="number"
                                    name="exercise_hours"
                                    value={formData.exercise_hours}
                                    onChange={onChange}
                                    placeholder="HH"
                                    min="0"
                                    max="23"
                                    required
                                    className="w-1/2 px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-indigo-500 focus:outline-none"
                                />
                                <span className="text-2xl font-bold text-gray-500">:</span>
                                <input
                                    type="number"
                                    name="exercise_minutes"
                                    value={formData.exercise_minutes}
                                    onChange={onChange}
                                    placeholder="MM"
                                    min="0"
                                    max="59"
                                    required
                                    className="w-1/2 px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-indigo-500 focus:outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Reflections */}
                    <div className="bg-white rounded-2xl shadow-lg p-6">
                        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <FaPen className="text-pink-600" />
                            Reflections and Prayer
                        </h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Sermon Reflection</label>
                                <textarea
                                    name="sermon_reflection"
                                    value={formData.sermon_reflection}
                                    onChange={onChange}
                                    rows="4"
                                    placeholder="Write your sermon reflection..."
                                    required
                                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-indigo-500 focus:outline-none resize-none"
                                ></textarea>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Thanksgiving</label>
                                <textarea
                                    name="thanksgiving"
                                    value={formData.thanksgiving}
                                    onChange={onChange}
                                    rows="4"
                                    placeholder="What are you thankful for today..."
                                    required
                                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-indigo-500 focus:outline-none resize-none"
                                ></textarea>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Repentance/Struggles</label>
                                <textarea
                                    name="repentance"
                                    value={formData.repentance}
                                    onChange={onChange}
                                    rows="4"
                                    placeholder="Areas of repentance or struggles..."
                                    required
                                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-indigo-500 focus:outline-none resize-none"
                                ></textarea>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Prayer Requests (no more than three)</label>
                                <textarea
                                    name="prayer_requests"
                                    value={formData.prayer_requests}
                                    onChange={onChange}
                                    rows="4"
                                    placeholder="1. &#10;2. &#10;3. "
                                    required
                                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-indigo-500 focus:outline-none resize-none"
                                ></textarea>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Overall Reflection and Evaluation on the Day</label>
                                <textarea
                                    name="reflections"
                                    value={formData.reflections}
                                    onChange={onChange}
                                    rows="4"
                                    placeholder="Reflect on your day..."
                                    required
                                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-indigo-500 focus:outline-none resize-none"
                                ></textarea>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Other Work Done Today (e.g., departmental work, attended training, church cleaning...)</label>
                                <textarea
                                    name="other_work"
                                    value={formData.other_work}
                                    onChange={onChange}
                                    rows="4"
                                    placeholder="Describe other activities..."
                                    required
                                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-indigo-500 focus:outline-none resize-none"
                                ></textarea>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">3 Things Must Do Tomorrow</label>
                                <textarea
                                    name="tomorrow_tasks"
                                    value={formData.tomorrow_tasks}
                                    onChange={onChange}
                                    rows="4"
                                    placeholder="1. &#10;2. &#10;3. "
                                    required
                                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-indigo-500 focus:outline-none resize-none"
                                ></textarea>
                            </div>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <div className="sticky bottom-4 bg-white rounded-2xl shadow-xl p-6">
                        <p className="text-sm text-gray-600 mb-3 text-center">
                            {isFormValid ? '✓ All fields filled - Ready to submit' : '⚠ Button will be active when all input boxes are filled'}
                        </p>
                        <button
                            type="submit"
                            disabled={!isFormValid}
                            className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
                                isFormValid
                                    ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 shadow-lg transform hover:scale-[1.02]'
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
