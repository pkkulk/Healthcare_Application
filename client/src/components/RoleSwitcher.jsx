import React from 'react';
import { User, Stethoscope } from 'lucide-react';

export default function RoleSwitcher({ currentRole, onSwitch }) {
    const isDoctor = currentRole === 'doctor';

    return (
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg">
            <button
                onClick={() => onSwitch('doctor')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${isDoctor ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                    }`}
            >
                <Stethoscope className="w-4 h-4" />
                Doctor
            </button>
            <button
                onClick={() => onSwitch('patient')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${!isDoctor ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                    }`}
            >
                <User className="w-4 h-4" />
                Patient
            </button>
        </div>
    );
}
