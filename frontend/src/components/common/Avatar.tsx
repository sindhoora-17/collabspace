import { initials } from '../../lib/format';

// Stable color per person so the same teammate always looks the same.
const tones = ['#4f46e5', '#0891b2', '#c2410c', '#15803d', '#be185d', '#7c3aed'];

function toneFor(id: string) {
  let hash = 0;
  for (const ch of id) hash = (hash * 31 + ch.charCodeAt(0)) | 0;
  return tones[Math.abs(hash) % tones.length];
}

type AvatarProps = {
  id: string;
  name: string;
  size?: number;
};

export function Avatar({ id, name, size = 24 }: AvatarProps) {
  return (
    <span
      className="avatar"
      title={name}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.42,
        background: toneFor(id),
      }}
    >
      {initials(name)}
    </span>
  );
}
