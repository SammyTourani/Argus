'use client';

import { useState } from 'react';
import { Globe, ExternalLink, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CustomDomainInputProps {
  currentUrl?: string;
}

export default function CustomDomainInput({ currentUrl }: CustomDomainInputProps) {
  const [domain, setDomain] = useState('');

  return (
    <div className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#0E0E0E] p-3 w-full">
      {/* Header */}
      <div className="flex items-center gap-2 mb-2.5">
        <Globe className="w-3.5 h-3.5 text-[#FA4500]" />
        <span className="text-xs font-mono font-semibold text-white">Domain</span>
      </div>

      {/* Current URL */}
      {currentUrl && (
        <div className="flex items-center gap-2 mb-2.5 px-2.5 py-1.5 rounded-lg bg-[#1A1A1A]">
          <div className="w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0" />
          <a
            href={currentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] font-mono text-[#888] hover:text-white transition-colors truncate flex-1"
            title={currentUrl}
          >
            {currentUrl.replace('https://', '')}
          </a>
          <ExternalLink className="w-3 h-3 text-[#555] flex-shrink-0" />
        </div>
      )}

      {/* Custom domain input */}
      <div className="relative">
        <input
          type="text"
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          placeholder="yourdomain.com"
          className={cn(
            'w-full px-3 py-2 rounded-lg text-[11px] font-mono',
            'bg-[#1A1A1A] text-white placeholder:text-[#555]',
            'border border-[rgba(255,255,255,0.08)] focus:border-[#FA4500]/40',
            'outline-none transition-colors'
          )}
        />
      </div>

      {/* Connect button — disabled stub */}
      <div className="relative mt-2">
        <button
          disabled
          className={cn(
            'w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg',
            'text-[11px] font-mono text-[#555] bg-[#1A1A1A]',
            'border border-[rgba(255,255,255,0.06)]',
            'cursor-not-allowed opacity-60'
          )}
          title="Custom domains coming soon"
        >
          <Lock className="w-3 h-3" />
          Connect Domain
        </button>

        {/* Coming soon tooltip */}
        <div className="mt-1.5 flex items-center justify-center gap-1">
          <span className="text-[10px] font-mono text-[#444]">
            Coming soon
          </span>
        </div>
      </div>
    </div>
  );
}
