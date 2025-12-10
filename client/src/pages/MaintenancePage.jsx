import React from 'react';
import { FaTools, FaExclamationTriangle } from 'react-icons/fa';

const MaintenancePage = () => {
    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-100 flex items-center justify-center p-4">
            <div className="max-w-2xl w-full">
                <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12 text-center">
                    <div className="mb-6">
                        <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-full flex items-center justify-center animate-pulse">
                            <FaTools className="text-white text-5xl" />
                        </div>
                        <h1 className="text-4xl font-bold text-gray-900 mb-4">
                            System Under Maintenance
                        </h1>
                        <div className="flex items-center justify-center gap-2 mb-6">
                            <FaExclamationTriangle className="text-orange-600 text-xl" />
                            <p className="text-xl text-gray-700 font-semibold">
                                We're currently performing system maintenance
                            </p>
                        </div>
                    </div>

                    <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl p-6 mb-8 border-2 border-orange-200">
                        <p className="text-gray-700 text-lg mb-4">
                            Our team is working hard to improve your experience. The system will be back online shortly.
                        </p>
                        <p className="text-gray-600">
                            We apologize for any inconvenience this may cause. Please try again in a few minutes.
                        </p>
                    </div>

                    <div className="space-y-3 text-sm text-gray-600">
                        <p className="flex items-center justify-center gap-2">
                            <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                            Estimated downtime: A few minutes
                        </p>
                        <p className="flex items-center justify-center gap-2">
                            <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                            Your data is safe and secure
                        </p>
                        <p className="flex items-center justify-center gap-2">
                            <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                            Please refresh this page to check if maintenance is complete
                        </p>
                    </div>

                    <button
                        onClick={() => window.location.reload()}
                        className="mt-8 px-8 py-4 bg-gradient-to-r from-orange-600 to-yellow-600 text-white rounded-xl font-bold text-lg hover:from-orange-700 hover:to-yellow-700 transition-all shadow-lg hover:shadow-xl"
                    >
                        🔄 Refresh Page
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MaintenancePage;
