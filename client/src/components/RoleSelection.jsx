import React from 'react';
import { User, Stethoscope } from 'lucide-react';

export default function RoleSelection({ onSelectRole }) {
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
            <div className="text-center mb-12">
                <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Healthcare Translator</h1>
                <p className="text-slate-600 max-w-md mx-auto">
                    Real-time translation bridge for better doctor-patient communication.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl w-full">
                <button
                    onClick={() => onSelectRole('doctor')}
                    className="group relative bg-white p-8 rounded-2xl shadow-sm border-2 border-transparent hover:border-blue-500 hover:shadow-md transition-all text-left"
                >
                    <div className="absolute top-6 right-6 p-3 bg-blue-50 rounded-full group-hover:bg-blue-100 transition-colors">
                        <Stethoscope className="w-8 h-8 text-blue-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">I am a Doctor</h2>
                    <p className="text-slate-500">
                        Start a consultation, record medical notes, and communicate with patients.
                    </p>
                </button>

                <button
                    onClick={() => onSelectRole('patient')}
                    className="group relative bg-white p-8 rounded-2xl shadow-sm border-2 border-transparent hover:border-emerald-500 hover:shadow-md transition-all text-left"
                >
                    <div className="absolute top-6 right-6 p-3 bg-emerald-50 rounded-full group-hover:bg-emerald-100 transition-colors">
                        <User className="w-8 h-8 text-emerald-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">I am a Patient</h2>
                    <p className="text-slate-500">
                        Join a consultation to explain symptoms and understand diagnosis.
                    </p>
                </button>
            </div>
        </div>
    );
}
