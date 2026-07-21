export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#f7f8f5] px-5 text-[#17251f]">
      <div className="text-center">
        <div className="mx-auto mb-8 grid h-24 w-24 place-items-center rounded-full bg-[#dcfce7]">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="h-12 w-12 text-[#147243]">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>
        <h1 className="font-display text-3xl font-black tracking-[-0.04em] text-[#123625] sm:text-4xl">
          Nothing to show here
        </h1>
        <p className="mx-auto mt-4 max-w-sm text-sm leading-6 text-[#5c7564]">
          The page you are looking for does not exist or may have been moved.
        </p>
        <a href="/" className="mt-8 inline-block rounded-xl bg-[#147243] px-8 py-4 text-xs font-black uppercase tracking-[0.18em] text-white shadow-md transition-colors hover:bg-[#0d5933]">
          Back to home
        </a>
      </div>
    </main>
  );
}
