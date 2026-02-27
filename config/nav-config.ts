import {
  LayoutGrid,
  Star,
  Users,
  Zap,
  GalleryHorizontal,
  UserCircle,
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  title: string;
  url: string;
  icon: LucideIcon;
  /** If true, this item matches any subpath of url */
  matchExact?: boolean;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const navGroups: NavGroup[] = [
  {
    label: 'Projects',
    items: [
      { title: 'All Projects', url: '/workspace', icon: LayoutGrid, matchExact: true },
      { title: 'Starred', url: '/workspace?view=starred', icon: Star, matchExact: true },
      { title: 'Shared with me', url: '/workspace?view=shared', icon: Users, matchExact: true },
    ],
  },
  {
    label: 'Explore',
    items: [
      { title: 'Model Marketplace', url: '/marketplace', icon: Zap },
      { title: 'Gallery', url: '/gallery', icon: GalleryHorizontal },
    ],
  },
  {
    label: 'Settings',
    items: [
      { title: 'Account', url: '/account', icon: UserCircle },
    ],
  },
];
