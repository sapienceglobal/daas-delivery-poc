export const metadata = {
  title: 'Platform Super Admin | Control Plane',
  description: 'Enterprise Multi-Tenant Cloud Operations & White-Label Brand Management',
};

export default function AdminLayout({ children }) {
  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 selection:bg-indigo-500/30 selection:text-indigo-200 relative overflow-x-hidden">
      {/* Ambient background lighting */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute -top-40 left-1/3 w-[600px] h-[600px] bg-indigo-600/[0.07] rounded-full blur-[140px]" />
        <div className="absolute top-1/2 -right-40 w-[500px] h-[500px] bg-blue-600/[0.05] rounded-full blur-[140px]" />
        <div className="absolute -bottom-40 left-10 w-[500px] h-[500px] bg-emerald-600/[0.04] rounded-full blur-[140px]" />
        {/* Subtle grid pattern */}
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.6) 1px, transparent 0)`,
            backgroundSize: '32px 32px'
          }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </div>
    </div>
  );
}
