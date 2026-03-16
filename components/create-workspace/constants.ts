export const STEP_LABELS = [
  { num: '01', label: 'NAME' },
  { num: '02', label: 'PLAN' },
] as const;

export const PLANS = [
  {
    id: 'free' as const,
    name: 'Free',
    price: '$0/month',
    features: ['30 credits / month', '1 workspace member', 'Community support'],
    badge: null as string | null,
    recommended: false,
  },
  {
    id: 'pro' as const,
    name: 'Pro',
    price: '$19/month',
    features: ['300 credits / month', 'All 9 AI models', 'Custom domains', 'Priority support'],
    badge: 'Upgrade later',
    recommended: true,
  },
  {
    id: 'team' as const,
    name: 'Team',
    price: '$49/month',
    features: ['Everything in Pro', '500 credits / month', 'Team collaboration', 'Shared workspaces', 'Admin controls'],
    badge: 'Coming soon',
    recommended: false,
  },
] as const;
