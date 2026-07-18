export default function FeatureIconItem({ icon: Icon, title, description }) {
  return (
    <div className="flex items-center justify-center lg:justify-start gap-4">
      <span className="text-primary-600 flex items-center justify-center shrink-0">
        <Icon size={38} strokeWidth={1.5} />
      </span>
      <div className="flex flex-col">
 
        <span className="block text-sm font-bold uppercase tracking-wide text-text">{title}</span>
    
        <span className="block text-xs text-text-secondary mt-1">{description}</span>
      </div>
    </div>
  );
}