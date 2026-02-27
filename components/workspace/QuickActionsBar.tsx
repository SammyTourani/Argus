'use client';

import { useRouter } from 'next/navigation';
import { Plus, Globe, Github, LayoutTemplate } from 'lucide-react';
import { motion } from 'framer-motion';

interface QuickActionsBarProps {
  onNewProject: () => void;
  onCloneUrl: () => void;
  onImportGithub: () => void;
}

interface ActionButtonProps {
  icon: typeof Plus;
  label: string;
  onClick: () => void;
  index: number;
}

function ActionButton({ icon: Icon, label, onClick, index }: ActionButtonProps) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.04 }}
      onClick={onClick}
      className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3.5 py-2 text-[13px] font-medium text-zinc-700 transition-all hover:border-zinc-300 hover:bg-white hover:shadow-sm active:scale-[0.98]"
    >
      <Icon className="h-4 w-4 text-zinc-500" />
      {label}
    </motion.button>
  );
}

export default function QuickActionsBar({ onNewProject, onCloneUrl, onImportGithub }: QuickActionsBarProps) {
  const router = useRouter();

  const actions = [
    { icon: Plus, label: 'New Project', onClick: onNewProject },
    { icon: Globe, label: 'Clone URL', onClick: onCloneUrl },
    { icon: Github, label: 'Import from GitHub', onClick: onImportGithub },
    { icon: LayoutTemplate, label: 'Browse Templates', onClick: () => router.push('/gallery') },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2">
      {actions.map((action, i) => (
        <ActionButton
          key={action.label}
          icon={action.icon}
          label={action.label}
          onClick={action.onClick}
          index={i}
        />
      ))}
    </div>
  );
}
