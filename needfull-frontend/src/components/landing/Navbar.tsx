// WHAT: Server-safe navbar that blends into the hero gradient
// WHY: WASM SWC can't compile client components imported from server components.
// All interactivity (theme toggle + mobile menu) uses vanilla JS inline.

const NAV_LINKS = [
  { href: '#how-it-works', label: 'How it works' },
  { href: '#features', label: 'For students' },
  { href: '#safety', label: 'Safety' },
];

export function Navbar() {
  return (
    <>
      <nav
        id="navbar"
        className="sticky top-0 z-50"
        style={{
          background: 'linear-gradient(to bottom, rgba(13,79,53,0.96), rgba(26,107,74,0.88))',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        }}
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-10 lg:px-24 h-20 flex items-center justify-between">
          <a href="/" className="flex items-center gap-3 shrink-0" aria-label="NeedFull home">
            <div className="w-11 h-11 bg-brand rounded-[12px] flex items-center justify-center text-gold" style={{ boxShadow: 'inset 0 1px 0 rgba(234,163,37,0.3)' }}>
              <svg viewBox="0 3 36 30" fill="none" className="w-[28px] h-[28px]">
                <rect x="12" y="24" width="16" height="2.5" rx="1.25" fill="currentColor" opacity="0.18"/>
                <rect x="2" y="27.5" width="26" height="3" rx="1.5" fill="currentColor" opacity="0.28"/>
                <circle cx="23" cy="9" r="4" fill="currentColor"/>
                <path d="M23 13v8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <path d="M23 19.5l-2.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <path d="M23 19.5l2.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <path d="M23 15.5l-7 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <circle cx="8" cy="14" r="4" fill="white" fillOpacity="0.9"/>
                <path d="M8 18v8" stroke="white" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.9"/>
                <path d="M8 24.5l-2 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.9"/>
                <path d="M8 24.5l2 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.9"/>
                <path d="M8 20l7.5-1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.9"/>
                <circle cx="16" cy="21" r="2.5" fill="currentColor"/>
                <circle cx="16" cy="21" r="1.5" fill="#1A6B4A"/>
              </svg>
            </div>
            <span className="font-bold text-xl leading-none font-display text-white">NeedFull</span>
          </a>

          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="px-3 py-2 text-sm font-medium rounded-[8px] text-white/70 hover:text-white hover:bg-white/10 transition-colors duration-200"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Desktop right section (md+) */}
          <div className="hidden md:flex items-center gap-3">
            <button
              id="theme-toggle"
              aria-label="Toggle theme"
              className="inline-flex items-center justify-center w-9 h-9 rounded-[10px] text-white/70 hover:text-white hover:bg-white/10 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/30"
            >
              <svg id="theme-icon-sun" className="w-5 h-5 hidden" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
              </svg>
              <svg id="theme-icon-moon" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
              </svg>
            </button>

            <a
              href="/login"
              className="inline-flex items-center border border-white/30 text-white text-sm font-semibold px-5 py-2.5 rounded-full transition-all duration-200 hover:border-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/50"
            >
              Sign in
            </a>
            <a
              href="/register"
              className="inline-flex items-center bg-gold hover:bg-[#d4931f] text-white text-sm font-bold px-5 py-2.5 rounded-full transition-all duration-200 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2"
            >
              Get started
            </a>
          </div>

          {/* Mobile: only hamburger visible */}
          <div className="flex md:hidden items-center gap-2">
            <button
              id="mobile-menu-btn"
              aria-label="Open menu"
              aria-expanded="false"
              className="inline-flex items-center justify-center w-9 h-9 rounded-[10px] text-white/70 hover:text-white hover:bg-white/10 transition-all focus:outline-none focus:ring-2 focus:ring-white/30"
            >
              <svg id="menu-icon-open" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
              <svg id="menu-icon-close" className="w-5 h-5 hidden" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile drawer */}
        <div id="mobile-menu" className="hidden md:hidden" style={{ background: 'linear-gradient(to bottom, rgba(13,79,53,0.98), rgba(26,107,74,0.95))' }}>
          <div className="px-4 pb-6 pt-2 space-y-1">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="block px-3 py-2.5 text-sm font-medium rounded-[8px] text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              >
                {link.label}
              </a>
            ))}
            <hr className="border-white/10 my-3" />
            <div className="flex items-center gap-3 px-3 pb-2">
              <button
                id="theme-toggle-mobile"
                aria-label="Toggle theme"
                className="inline-flex items-center justify-center w-9 h-9 rounded-[10px] text-white/70 hover:text-white hover:bg-white/10 transition-all"
              >
                <svg id="m-icon-sun" className="w-5 h-5 hidden" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
                </svg>
                <svg id="m-icon-moon" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
                </svg>
              </button>
              <a href="/login" className="flex-1 text-center border border-white/30 text-white text-sm font-semibold px-4 py-2.5 rounded-full transition-colors hover:border-white hover:bg-white/10">Sign in</a>
              <a href="/register" className="flex-1 text-center bg-gold hover:bg-[#d4931f] text-white text-sm font-bold px-4 py-2.5 rounded-full transition-colors shadow-md">Get started</a>
            </div>
          </div>
        </div>
      </nav>

      <script
        dangerouslySetInnerHTML={{
          __html: `
(function(){
  function q(id){return document.getElementById(id)}
  var toggle=q('theme-toggle'), toggleM=q('theme-toggle-mobile');
  var menuBtn=q('mobile-menu-btn'), mobileMenu=q('mobile-menu');
  var icons=[q('theme-icon-sun'),q('theme-icon-moon'),q('m-icon-sun'),q('m-icon-moon')];
  var menuIcons=[q('menu-icon-open'),q('menu-icon-close')];

  function setUI(theme){
    icons.forEach(function(el){if(!el)return;el.classList.toggle('hidden',(el.id.indexOf('sun')>=0)!==(theme==='light'))});
  }

  function toggleTheme(){
    var html=document.documentElement;
    var cur=html.getAttribute('data-theme')||'light';
    var next=cur==='dark'?'light':'dark';
    html.setAttribute('data-theme',next);
    try{localStorage.setItem('nf-theme',next)}catch(e){}
    setUI(next);
    var meta=document.querySelector('meta[name="theme-color"]');
    if(meta)meta.setAttribute('content',next==='dark'?'#0a0a0b':'#1A6B4A');
  }

  if(toggle)toggle.addEventListener('click',toggleTheme);
  if(toggleM)toggleM.addEventListener('click',toggleTheme);

  if(menuBtn&&mobileMenu){
    menuBtn.addEventListener('click',function(){
      var closed=mobileMenu.classList.contains('hidden');
      mobileMenu.classList.toggle('hidden',!closed);
      menuBtn.setAttribute('aria-expanded',String(closed));
      if(menuIcons[0]&&menuIcons[1]){
        menuIcons[0].classList.toggle('hidden',!closed);
        menuIcons[1].classList.toggle('hidden',closed);
      }
    });
  }

  setUI(document.documentElement.getAttribute('data-theme')||'light');
})();
          `,
        }}
      />
    </>
  );
}
