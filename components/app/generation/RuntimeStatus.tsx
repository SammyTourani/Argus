import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiActivity, FiCheckCircle, FiAlertTriangle, FiCpu, FiPower } from 'react-icons/fi';

export type RuntimeStatusType = 'idle' | 'monitoring' | 'fixing' | 'success' | 'error';

interface RuntimeStatusProps {
    status: RuntimeStatusType;
    errorCount: number;
    autoFixEnabled: boolean;
    onToggleAutoFix: () => void;
    disabled?: boolean;
}

export default function RuntimeStatus({
    status,
    errorCount,
    autoFixEnabled,
    onToggleAutoFix,
    disabled = false
}: RuntimeStatusProps) {

    // Status configuration
    const statusConfig = {
        idle: {
            icon: null,
            color: 'text-slate-500',
            bgColor: 'bg-white',
            borderColor: 'border-slate-200',
            text: 'System Ready',
            subtext: 'Monitoring standby'
        },
        monitoring: {
            icon: FiActivity,
            color: 'text-indigo-500',
            bgColor: 'bg-white',
            borderColor: 'border-indigo-100',
            text: 'Scanning Runtime...',
            subtext: 'Checking for errors'
        },
        fixing: {
            icon: FiCpu,
            color: 'text-amber-500',
            bgColor: 'bg-white',
            borderColor: 'border-amber-100',
            text: 'Auto-Fixing...',
            subtext: `Resolving ${errorCount} issue${errorCount !== 1 ? 's' : ''}`
        },
        success: {
            icon: FiCheckCircle,
            color: 'text-emerald-500',
            bgColor: 'bg-white',
            borderColor: 'border-emerald-100',
            text: 'System Healthy',
            subtext: 'No errors detected'
        },
        error: {
            icon: FiAlertTriangle,
            color: 'text-rose-500',
            bgColor: 'bg-white',
            borderColor: 'border-rose-100',
            text: 'Attention Needed',
            subtext: `${errorCount} unresolved error${errorCount !== 1 ? 's' : ''}`
        }
    };

    const currentConfig = statusConfig[status];
    const Icon = currentConfig.icon;

    return (
        <div className="w-full px-4 pb-4 bg-background-base">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md">

                {/* Top Pane: Status Display */}
                <div className="p-4 flex items-center gap-4 border-b border-gray-50">
                    <div className={`
            relative flex items-center justify-center w-10 h-10 rounded-xl 
            bg-gray-50 border border-gray-100
            ${currentConfig.color}
          `}>
                        {Icon && (
                            <Icon className={`w-5 h-5 ${status === 'monitoring' || status === 'fixing' ? 'animate-pulse' : ''}`} />
                        )}

                        {/* Status Dot */}
                        <span className={`
              absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white
              ${status === 'idle' ? 'bg-slate-400' : ''}
              ${status === 'monitoring' ? 'bg-indigo-500 animate-ping' : ''}
              ${status === 'fixing' ? 'bg-amber-500 animate-spin' : ''}
              ${status === 'success' ? 'bg-emerald-500' : ''}
              ${status === 'error' ? 'bg-rose-500' : ''}
            `} />
                    </div>

                    <div className="flex-1 min-w-0">
                        <h4 className={`text-sm font-bold ${currentConfig.color}`}>
                            {currentConfig.text}
                        </h4>
                        <p className="text-xs text-gray-500 truncate">
                            {currentConfig.subtext}
                        </p>
                    </div>
                </div>

                {/* Bottom Pane: The "Power Switch" */}
                <button
                    onClick={onToggleAutoFix}
                    disabled={disabled}
                    className={`
            w-full p-3 relative group overflow-hidden
            ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}
          `}
                >
                    {/* Layer 1: Static Background (Off State) */}
                    <div className={`
            absolute inset-0 bg-slate-100 transition-colors duration-300 
            ${!disabled && 'group-hover:bg-slate-200'}
          `} />

                    {/* Layer 2: Animated Gradient Overlay (On State) */}
                    <motion.div
                        initial={false}
                        animate={{ opacity: autoFixEnabled ? 1 : 0 }}
                        transition={{ duration: 0.3 }}
                        className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-violet-600"
                    />

                    {/* Layer 3: Content (Z-Index to stay on top) */}
                    <div className="relative z-10 flex items-center justify-center gap-3">

                        {/* Icon Container */}
                        <motion.div
                            animate={{
                                scale: autoFixEnabled && !disabled ? 1.1 : 1,
                                color: autoFixEnabled ? '#ffffff' : '#64748b'
                            }}
                            className={`
                p-1.5 rounded-lg transition-colors duration-300
                ${autoFixEnabled ? 'bg-white/20' : 'bg-slate-200'}
              `}
                        >
                            <FiPower className="w-3.5 h-3.5" />
                        </motion.div>

                        {/* Fixed Width Text Container */}
                        <div className="w-[120px] text-left">
                            <span className={`
                text-xs font-bold uppercase tracking-wider transition-colors duration-300
                ${autoFixEnabled ? 'text-white' : 'text-slate-600'}
              `}>
                                {disabled
                                    ? (autoFixEnabled ? 'Locked (Active)' : 'Locked (Paused)')
                                    : (autoFixEnabled ? 'Auto-Fix Active' : 'Auto-Fix Paused')
                                }
                            </span>
                        </div>
                    </div>
                </button>
            </div>
        </div>
    );
}
