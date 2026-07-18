import Image from 'next/image';
import Link from 'next/link';

/**
 * CategoryIcon — circular category thumbnail + label.
 *
 * FIX: circle backdrop used `bg-surface` (brand-root dark token) — switched
 * to literal `bg-white`. Label used `text-text` (token-fragile) — switched
 * to literal `text-gray-800`.
 */
export default function CategoryIcon({ label, icon, href }) {
  const content = (
    <div className="flex flex-col items-center gap-2 group">
      <span className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-accent-500 bg-white">
        <Image src={icon} alt={label} fill sizes="64px" className="object-cover" />
      </span>
      <span className="text-xs font-semibold tracking-wide text-gray-800 uppercase group-hover:text-primary-600">
        {label}
      </span>
    </div>
  );

  return href ? <Link href={href}>{content}</Link> : content;
}