import './globals.css';

export const metadata = {
  title: 'DaaS Sandbox Integration PoC',
  description: 'Proof of Concept Delivery-as-a-Service integration client utilizing DoorDash Drive API v2.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="grid-bg min-h-screen bg-brand-bg text-brand-text antialiased selection:bg-brand-cyan selection:text-brand-bg">
        {/* Decorative background glow elements */}
        <div className="pointer-events-none fixed left-[10%] top-[5%] -z-10 h-[350px] w-[350px] rounded-full bg-brand-cyan/10 opacity-40 blur-[80px]" />
        <div className="pointer-events-none fixed right-[15%] bottom-[10%] -z-10 h-[400px] w-[400px] rounded-full bg-brand-blue/10 opacity-30 blur-[100px]" />

        {/* Global Floating Header */}
        <header className="sticky top-0 z-50 w-full border-b border-brand-border bg-brand-bg/85 backdrop-blur-md">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-brand-green to-brand-cyan text-brand-bg shadow-lg shadow-brand-cyan/20">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="h-5 w-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 0 1-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 0 0 6.16-12.12A14.98 14.98 0 0 0 9.64 8.38m6 .01a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM9.64 8.38a9 9 0 0 1-7.38 5.84m7.38-5.84-4.8-4.8m1.74 15.3a6 6 0 0 1-5.84-7.38" />
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-black tracking-tight bg-gradient-to-r from-brand-text to-brand-muted bg-clip-text text-transparent">
                  WebForge <span className="text-brand-cyan font-bold font-mono text-xs border border-brand-cyan/30 px-1.5 py-0.5 rounded bg-brand-cyan/5">DaaS PoC</span>
                </h1>
                <p className="text-[10px] uppercase font-mono tracking-widest text-brand-muted">DoorDash Drive Sandbox v2</p>
              </div>
            </div>

            <nav className="flex items-center gap-6">
              <a 
                href="/" 
                className="text-sm font-medium text-brand-text hover:text-brand-cyan transition-colors"
              >
                Checkout Terminal
              </a>
              <div className="h-4 w-[1px] bg-brand-border" />
              <div className="flex items-center gap-2 rounded-full border border-brand-green/30 bg-brand-green/5 px-3 py-1 text-xs font-semibold text-brand-green">
                <span className="h-2 w-2 rounded-full bg-brand-green animate-pulse" />
                DaaS Sandbox Connected
              </div>
            </nav>
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-4 py-8 md:px-6 md:py-12">
          {children}
        </main>

        <footer className="mt-auto border-t border-brand-border bg-brand-bg/40 py-6 text-center text-xs text-brand-muted">
          <p>© 2026 WebForge DaaS Integration Client. Built for Local Sandbox and API Verification.</p>
        </footer>
      </body>
    </html>
  );
}
