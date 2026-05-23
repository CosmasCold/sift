import { User } from 'lucide-react';

const AVATARS: Record<string, { bg: string; text: string }> = {
  lavender: { bg: 'bg-accent-400', text: 'text-white' },
  charcoal: { bg: 'bg-surface-700', text: 'text-surface-200' },
  sage: { bg: 'bg-emerald-400', text: 'text-white' },
  rose: { bg: 'bg-rose-300', text: 'text-white' },
  sky: { bg: 'bg-sky-400', text: 'text-white' },
  amber: { bg: 'bg-amber-400', text: 'text-white' },
  indigo: { bg: 'bg-indigo-400', text: 'text-white' },
  coral: { bg: 'bg-coral-400', text: 'text-white' },
};

interface UserAvatarProps {
  username: string;
  avatarKey?: string | null;
  size?: number;
}

export default function UserAvatar({ username, avatarKey, size = 40 }: UserAvatarProps) {
  const colors = AVATARS[avatarKey || 'lavender'] || AVATARS.lavender;
  return (
    <div
      className={`rounded-full flex items-center justify-center font-bold ${colors.bg} ${colors.text}`}
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {username ? username[0].toUpperCase() : <User size={size * 0.5} />}
    </div>
  );
}