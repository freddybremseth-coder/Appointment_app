/* global React, Icon, BookingStore */
const { useEffect, useState, useMemo } = React;

/* ---------- Brand context (the user manages multiple) ---------- */
const BRANDS = [
  { id: "freddy",    name: "FreddyBremseth.com",   tagline: "Boligråd · Strategi",    mark: "F",  color: "#0F1B2D",  accent: "#F5A623" },
  { id: "zen",       name: "ZenEcoHomes.com",      tagline: "Bolig i Spania",         mark: "Z",  color: "#166534",  accent: "#BBF7D0" },
  { id: "pinoso",    name: "PinosoEcoLife.com",    tagline: "Pinoso og innlandet",    mark: "P",  color: "#1E3A8A",  accent: "#BFDBFE" },
  { id: "chatgenius",name: "ChatGenius.pro",       tagline: "AI og salg",             mark: "C",  color: "#5B21B6",  accent: "#DDD6FE" },
];

/* ---------- Event types (the 4 services from booking) ---------- */
const EVENT_TYPES = [
  { id: "zen-first-call",        icon: "Phone",     iconStyle: "ink",   title: "Første boligsamtale Spania", sub: "ZenEcoHomes",       duration: "30 min", price: "Gratis", paid: false, active: true, color: "#166534" },
  { id: "pinoso-first-call",     icon: "Home",      iconStyle: "ink",   title: "Første boligsamtale Pinoso", sub: "PinosoEcoLife",     duration: "30 min", price: "Gratis", paid: false, active: true, color: "#1E3A8A" },
  { id: "freddy-property-advice",icon: "Compass",   iconStyle: "amber", title: "Uavhengig boligrådgivning",  sub: "FreddyBremseth",    duration: "60 min", price: "€195",   paid: true,  active: true, color: "#F5A623" },
  { id: "chat-ai-opportunity",   icon: "Spark",     iconStyle: "ink",   title: "AI-mulighetssamtale",        sub: "ChatGenius",        duration: "30 min", price: "Gratis", paid: false, active: true, color: "#5B21B6" },
  { id: "freddy-strategy",       icon: "Briefcase", iconStyle: "amber", title: "Strategisamtale",            sub: "FreddyBremseth",    duration: "60 min", price: "€195",   paid: true,  active: true, color: "#F5A623" },
];

/* ---------- Bookings ---------- */
const BOOKINGS = [
  { date: "13. mai · 09:00", type: "Første boligsamtale",   customer: "Lars Hagen",          status: "confirmed", price: "Gratis", paid: false },
  { date: "13. mai · 10:30", type: "Første Pinoso-samtale", customer: "Anne Vik",            status: "confirmed", price: "Gratis", paid: false },
  { date: "13. mai · 11:30", type: "Uavhengig boligråd",    customer: "Marit Dahl",          status: "confirmed", price: "€195",   paid: true  },
  { date: "13. mai · 14:00", type: "AI-mulighetssamtale",   customer: "Roar Andersen",       status: "confirmed", price: "Gratis", paid: false },
  { date: "14. mai · 10:00", type: "Strategisamtale",       customer: "Camilla Bjørnerud",   status: "pending",   price: "€195",   paid: true  },
  { date: "14. mai · 15:30", type: "Første boligsamtale",   customer: "Tom Eriksen",         status: "confirmed", price: "Gratis", paid: false },
  { date: "15. mai · 09:30", type: "Uavhengig boligråd",    customer: "Hanne Solberg",       status: "confirmed", price: "€195",   paid: true  },
  { date: "15. mai · 13:00", type: "AI-mulighetssamtale",   customer: "Tech Nordic AS",      status: "pending",   price: "Gratis", paid: false },
];

function formatStoredBooking(booking) {
  return {
    date: `${booking.date} · ${booking.time}`,
    type: booking.serviceTitle,
    customer: booking.contact?.name || "Ukjent kunde",
    status: booking.status,
    price: booking.price,
    paid: booking.paid,
    brandName: booking.brandName,
    email: booking.contact?.email || "",
    crmSync: booking.crmSync?.status || "local_only",
  };
}

/* ---------- Sidebar ---------- */
function NavItem({ icon, label, active, badge, onClick }) {
  return (
    <button className={`nav-item ${active ? "is-active" : ""}`} onClick={onClick}>
      <span className="nav-icon">{icon}</span>
      <span className="nav-label">{label}</span>
      {badge && <span className="nav-badge">{badge}</span>}
    </button>
  );
}

function BrandSwitcher({ brand, setBrand, open, setOpen }) {
  return (
    <div className="brand-wrap">
      <button className="brand-btn" onClick={() => setOpen(!open)}>
        <span className="brand-mark" style={{ background: brand.color, color: brand.accent }}>{brand.mark}</span>
        <span className="brand-info">
          <span className="brand-name">{brand.name}</span>
          <span className="brand-tag">{brand.tagline}</span>
        </span>
        <Icon.ChevD/>
      </button>
      {open && (
        <div className="brand-pop card">
          <div className="brand-pop-head">Bytt arbeidsområde</div>
          {BRANDS.map(b => (
            <button
              key={b.id}
              className={`brand-pop-item ${brand.id === b.id ? "is-active" : ""}`}
              onClick={() => { setBrand(b); setOpen(false); }}
            >
              <span className="brand-mark sm" style={{ background: b.color, color: b.accent }}>{b.mark}</span>
              <span>
                <div className="brand-name">{b.name}</div>
                <div className="brand-tag">{b.tagline}</div>
              </span>
              {brand.id === b.id && <Icon.Check/>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Sidebar({ brand, setBrand, brandOpen, setBrandOpen, page, setPage }) {
  const items = [
    { id: "dashboard",  label: "Dashbord",      icon: <DashIcon/> },
    { id: "bookings",   label: "Bookinger",     icon: <CalIcon/>,    badge: 7 },
    { id: "availability",label:"Tilgjengelighet",icon: <ClockSm/> },
    { id: "events",     label: "Tjenester",     icon: <StarSm/> },
    { id: "contacts",   label: "Kontakter",     icon: <UsersSm/> },
    { id: "reminders",  label: "Påminnelser",   icon: <BellSm/> },
    { id: "payments",   label: "Betalinger",    icon: <CardSm/> },
    { id: "integrations",label:"Integrasjoner", icon: <PlugSm/> },
    { id: "analytics",  label: "Analyse",       icon: <ChartSm/> },
    { id: "branding",   label: "Merkevare",     icon: <PaintSm/> },
    { id: "settings",   label: "Innstillinger", icon: <CogSm/> },
  ];
  return (
    <aside className="ad-side">
      <BrandSwitcher brand={brand} setBrand={setBrand} open={brandOpen} setOpen={setBrandOpen}/>
      <nav className="nav">
        {items.map(it => (
          <NavItem key={it.id} icon={it.icon} label={it.label} active={page === it.id} badge={it.badge} onClick={() => setPage(it.id)}/>
        ))}
      </nav>

      <div className="plan-card card">
        <div className="plan-head">
          <span className="plan-tag">Pro</span>
          <span className="plan-name">Plan</span>
        </div>
        <div className="plan-meta">1 250 av 2 000 bookinger denne måneden</div>
        <div className="plan-bar"><div className="plan-bar-fill" style={{ width: "62.5%" }}/></div>
        <button className="btn-ghost plan-btn">Administrer plan</button>
      </div>

      <div className="user-card card">
        <div className="user-avatar">FB</div>
        <div className="user-info">
          <div className="user-name">Freddy Bremseth</div>
          <div className="user-mail">freddy@bremseth.no</div>
        </div>
        <Icon.ChevD/>
      </div>
    </aside>
  );
}

/* tiny inline icons for nav */
function DashIcon(){return(<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>)}
function CalIcon(){return(<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>)}
function ClockSm(){return(<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>)}
function StarSm(){return(<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26"/></svg>)}
function UsersSm(){return(<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>)}
function BellSm(){return(<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>)}
function CardSm(){return(<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>)}
function PlugSm(){return(<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11V5a3 3 0 0 1 6 0v6"/><path d="M5 11h14v3a7 7 0 0 1-14 0z"/></svg>)}
function ChartSm(){return(<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></svg>)}
function PaintSm(){return(<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="13.5" cy="6.5" r=".5"/><circle cx="17.5" cy="10.5" r=".5"/><circle cx="8.5" cy="7.5" r=".5"/><circle cx="6.5" cy="12.5" r=".5"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-.99 0-.83.67-1.5 1.5-1.5H16c3.31 0 6-2.69 6-6 0-5.52-4.48-10-10-10z"/></svg>)}
function CogSm(){return(<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>)}

/* ---------- Top bar ---------- */
function TopBar() {
  return (
    <header className="ad-top">
      <div className="ad-search">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input placeholder="Søk i bookinger, kontakter, tjenester…"/>
        <kbd>⌘K</kbd>
      </div>
      <div className="ad-top-right">
        <div className="cal-pill">
          <Icon.GCal/>
          <span>Google Calendar</span>
          <span className="badge">Tilkoblet</span>
        </div>
        <button className="icon-btn" aria-label="Notifications">
          <BellSm/>
          <span className="dot"/>
        </button>
        <div className="top-avatar">FB</div>
      </div>
    </header>
  );
}

/* ---------- Event types row ---------- */
function EventTypeCard({ ev }) {
  const I = Icon[ev.icon];
  const [on, setOn] = useState(ev.active);
  return (
    <div className="ev-card card">
      <div className="ev-head">
        <span className={`icn icn--${ev.iconStyle}`}><I/></span>
        <button className={`switch ${on ? "is-on" : ""}`} onClick={() => setOn(!on)} aria-label="Toggle">
          <span className="switch-knob"/>
        </button>
      </div>
      <div className="ev-title">{ev.title}</div>
      <div className="ev-sub">{ev.sub}</div>
      <div className="ev-meta">
        <span className="ev-dur"><Icon.Clock/> {ev.duration}</span>
        <span className={`ev-price ${ev.paid ? "is-paid" : "is-free"}`}>{ev.price}</span>
      </div>
    </div>
  );
}

function EventTypes() {
  return (
    <section className="ev-section">
      <div className="sec-head">
        <h3 className="h-section">Tjenester</h3>
        <div className="sec-actions">
          <a href="#" className="link-action">Administrer</a>
          <button className="btn-ink">+ Ny tjeneste</button>
        </div>
      </div>
      <div className="ev-grid">
        {EVENT_TYPES.map(ev => <EventTypeCard key={ev.id} ev={ev}/>)}
      </div>
    </section>
  );
}

/* ---------- Availability grid ---------- */
function Availability() {
  const hours = ["09","10","11","12","13","14","15","16","17"];
  const days = ["MAN","TIR","ONS","TOR","FRE","LØR","SØN"];
  const open = (hi, di) => di < 5 && !(hi === 3); // closed lunch 12, weekends off
  return (
    <div className="card avail-card">
      <div className="sec-head">
        <h3 className="h-section">Tilgjengelighet</h3>
        <a href="#" className="link-action">Rediger</a>
      </div>
      <div className="avail-grid">
        <div className="avail-cell avail-corner">TID</div>
        {days.map(d => <div key={d} className="avail-cell avail-dow">{d}</div>)}
        {hours.map((h, hi) => (
          <React.Fragment key={h}>
            <div className="avail-cell avail-time">{h}:00</div>
            {days.map((d, di) => (
              <div key={d} className={`avail-cell avail-slot ${open(hi, di) ? "is-open" : "is-closed"}`}>
                {open(hi, di) ? <span className="avail-tick"><Icon.Check/></span> : <span className="avail-dash">—</span>}
              </div>
            ))}
          </React.Fragment>
        ))}
      </div>
      <div className="avail-foot">
        <Icon.Globe/>
        <span>Tidssone: Europa/Madrid (CET)</span>
        <Icon.ChevD/>
      </div>
    </div>
  );
}

/* ---------- Reminders / Calendar Sync ---------- */
function Reminders() {
  return (
    <div className="card reminders-card">
      <div className="sec-head">
        <h3 className="h-section">Påminnelser</h3>
        <a href="#" className="link-action">Rediger</a>
      </div>
      <div className="reminder-row">
        <span className="reminder-icn"><BellSm/></span>
        <div className="reminder-info">
          <div className="reminder-title">E-postpåminnelse</div>
          <div className="reminder-sub">24 timer før</div>
        </div>
        <span className="reminder-state">På</span>
      </div>
      <div className="reminder-row">
        <span className="reminder-icn"><PhoneSm/></span>
        <div className="reminder-info">
          <div className="reminder-title">SMS-påminnelse</div>
          <div className="reminder-sub">1 time før</div>
        </div>
        <span className="reminder-state">På</span>
      </div>
      <div className="reminder-row">
        <span className="reminder-icn"><CalIcon/></span>
        <div className="reminder-info">
          <div className="reminder-title">Kalenderinvitasjon</div>
          <div className="reminder-sub">Umiddelbart</div>
        </div>
        <span className="reminder-state">På</span>
      </div>
    </div>
  );
}
function PhoneSm(){return(<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13 1.05.37 2.07.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.74.33 1.76.57 2.81.7A2 2 0 0 1 22 16.92z"/></svg>)}

function CalendarSync() {
  return (
    <div className="card sync-card">
      <div className="h-section" style={{ marginBottom: 12 }}>Kalendersynkronisering</div>
      <div className="sync-row">
        <Icon.GCal/>
        <div className="sync-info">
          <div className="sync-title">Google Calendar</div>
          <div className="sync-sub">freddy@bremseth.no</div>
        </div>
        <span className="badge">Tilkoblet</span>
      </div>
      <div className="sync-foot">
        <span>Sist synket: for 2 min siden</span>
        <button className="btn-ghost btn-sm">Synk nå</button>
      </div>
    </div>
  );
}

/* ---------- Bookings table ---------- */
function BookingsTable() {
  const statusBadge = (s) => {
    if (s === "confirmed") return <span className="badge">Bekreftet</span>;
    if (s === "payment_pending") return <span className="badge badge--pending">Betaling</span>;
    return <span className="badge badge--pending">Venter</span>;
  };
  const [filter, setFilter] = useState("all");
  const [storedBookings, setStoredBookings] = useState(() => BookingStore.read().map(formatStoredBooking));
  useEffect(() => {
    const refresh = () => setStoredBookings(BookingStore.read().map(formatStoredBooking));
    window.addEventListener("booking-store:changed", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("booking-store:changed", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);
  const allBookings = [...storedBookings, ...BOOKINGS];
  const filtered = filter === "all" ? allBookings : allBookings.filter(b => filter === "paid" ? b.paid : !b.paid);
  return (
    <div className="card bookings-card">
      <div className="sec-head">
        <h3 className="h-section">Kommende bookinger <span className="sec-sub">({storedBookings.length} fra booking-sidene)</span></h3>
        <div className="bk-filters">
          <button className={`pill ${filter==="all"?"is-on":""}`} onClick={()=>setFilter("all")}>Alle</button>
          <button className={`pill ${filter==="free"?"is-on":""}`} onClick={()=>setFilter("free")}>Gratis</button>
          <button className={`pill ${filter==="paid"?"is-on":""}`} onClick={()=>setFilter("paid")}>Betalt</button>
          <a href="#" className="link-action" style={{marginLeft: 8}}>Se alle →</a>
        </div>
      </div>
      <table className="bk-table">
        <thead>
          <tr>
            <th>DATO &amp; TID</th>
            <th>TJENESTE</th>
            <th>KUNDE</th>
            <th>BELØP</th>
            <th>STATUS</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((b, i) => (
            <tr key={i}>
              <td className="bk-date">{b.date}</td>
              <td>{b.type}</td>
              <td>
                <div className="bk-cust">
                  <span className="bk-avatar">{b.customer.split(" ").map(p=>p[0]).slice(0,2).join("")}</span>
                  <span>{b.customer}</span>
                </div>
              </td>
              <td className={b.paid ? "bk-paid" : "bk-free"}>{b.price}</td>
              <td>{statusBadge(b.status)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ---------- Analytics ---------- */
function Analytics() {
  const stats = [
    { label: "Bookinger",       value: "48",     trend: "+20%", up: true,  spark: [3,5,4,6,7,8,9] },
    { label: "Inntekt",         value: "€6 800", trend: "+32%", up: true,  spark: [4,3,5,6,8,9,11], paid: true },
    { label: "Konverteringsrate", value: "68%",  trend: "+8%",  up: true,  spark: [5,6,5,7,8,9,10] },
    { label: "Ikke-fremmøte",   value: "2%",     trend: "−1%",  up: false, spark: [6,4,5,3,4,3,2] },
  ];
  return (
    <div className="card analytics-card">
      <div className="sec-head">
        <h3 className="h-section">Analyse <span className="sec-sub">(denne måneden)</span></h3>
        <a href="#" className="link-action">Se rapport →</a>
      </div>
      <div className="stats-grid">
        {stats.map(s => (
          <div key={s.label} className="stat">
            <div className="stat-label">{s.label}</div>
            <div className="stat-row">
              <div className={`stat-val ${s.paid ? "is-amber" : ""}`}>{s.value}</div>
              <div className={`stat-trend ${s.up ? "up" : "down"}`}>
                {s.up ? "↑" : "↓"} {s.trend}
              </div>
            </div>
            <Sparkline points={s.spark} up={s.up}/>
          </div>
        ))}
      </div>
    </div>
  );
}
function Sparkline({ points, up }) {
  const max = Math.max(...points), min = Math.min(...points);
  const w = 100, h = 28;
  const path = points.map((p, i) => {
    const x = (i / (points.length - 1)) * w;
    const y = h - ((p - min) / (max - min || 1)) * h;
    return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join(" ");
  const color = up ? "#10B981" : "#EF4444";
  return (
    <svg width="100%" height="28" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="spark">
      <path d={path} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d={`${path} L ${w} ${h} L 0 ${h} Z`} fill={color} opacity="0.08"/>
    </svg>
  );
}

/* ---------- Booking page promo + branding ---------- */
function BookingLink() {
  return (
    <div className="card linkcard">
      <div className="h-section">Bookingside</div>
      <div className="lc-sub">Din side er publisert og klar for deling.</div>
      <div className="lc-url">
        <span>realtyflow.crm/booking-admin</span>
        <button className="btn-ghost btn-sm">Kopier</button>
      </div>
      <a href="booking.html" className="link-action lc-link">Åpne Freddy-side ↗</a>
    </div>
  );
}

function BrandingCard({ brand }) {
  return (
    <div className="card brandcard">
      <div className="sec-head"><div className="h-section">Merkevare</div><a href="#" className="link-action">Rediger</a></div>
      <div className="brand-row">
        <div className="brand-row-label">Logo</div>
        <div className="brand-mark md" style={{ background: brand.color, color: brand.accent }}>{brand.mark}</div>
      </div>
      <div className="brand-row">
        <div className="brand-row-label">Primærfarge</div>
        <div className="swatch" style={{ background: brand.color }}/>
      </div>
      <div className="brand-row">
        <div className="brand-row-label">Aksentfarge</div>
        <div className="swatch" style={{ background: brand.accent }}/>
      </div>
    </div>
  );
}

function EmbedCard() {
  const code = `<div class="realtyflow-booking"\n  data-brand="freddy"\n  data-url="https://freddybremseth.com/book"></div>`;
  return (
    <div className="card embedcard">
      <div className="sec-head"><div className="h-section">Innebygd widget</div><a href="#" className="link-action">Kopier kode</a></div>
      <p className="embed-sub">Legg widgeten på nettsiden din slik at besøkende kan booke uten å forlate siden.</p>
      <pre className="embed-code"><code>{code}</code></pre>
    </div>
  );
}

/* ---------- Quick Actions ---------- */
function QuickActions() {
  const items = [
    { label: "Ny tjeneste",       icon: <PlusSm/>, accent: true },
    { label: "Kopier bookinglenke",icon: <CopySm/> },
    { label: "Vis bookingside",   icon: <EyeSm/> },
    { label: "Del tilgjengelighet",icon: <ShareSm/> },
  ];
  return (
    <div className="card qa-card">
      <div className="h-section" style={{ marginBottom: 8 }}>Hurtighandlinger</div>
      {items.map(i => (
        <button key={i.label} className={`qa-row ${i.accent ? "is-accent" : ""}`}>
          <span className="qa-icn">{i.icon}</span>
          <span>{i.label}</span>
        </button>
      ))}
    </div>
  );
}
function PlusSm(){return(<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>)}
function CopySm(){return(<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>)}
function EyeSm(){return(<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>)}
function ShareSm(){return(<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>)}

/* ---------- Page header ---------- */
function PageHeader() {
  return (
    <div className="page-head">
      <div>
        <div className="eyebrow">Tirsdag, 13. mai 2026</div>
        <h1 className="page-title">God morgen, Freddy</h1>
        <div className="page-sub">Du har <b>3 bookinger</b> i dag og <b>4 ventende henvendelser</b>.</div>
      </div>
      <div className="page-actions">
        <button className="btn-ghost"><Icon.Link/> Del lenke</button>
        <button className="btn-ink">+ Ny tjeneste</button>
      </div>
    </div>
  );
}

/* ---------- Main App ---------- */
function AdminApp() {
  const [brand, setBrand] = useState(BRANDS[0]);
  const [brandOpen, setBrandOpen] = useState(false);
  const [page, setPage] = useState("dashboard");

  return (
    <div className="ad-shell">
      <Sidebar brand={brand} setBrand={setBrand} brandOpen={brandOpen} setBrandOpen={setBrandOpen} page={page} setPage={setPage}/>
      <div className="ad-main">
        <TopBar/>
        <div className="ad-body">
          <PageHeader/>

          <div className="grid-12">
            <div className="span-8">
              <EventTypes/>
            </div>
            <div className="span-4">
              <QuickActions/>
            </div>

            <div className="span-8">
              <Availability/>
            </div>
            <div className="span-4 stack">
              <Reminders/>
              <CalendarSync/>
            </div>

            <div className="span-8">
              <BookingsTable/>
            </div>
            <div className="span-4">
              <Analytics/>
            </div>

            <div className="span-4">
              <BookingLink/>
            </div>
            <div className="span-4">
              <BrandingCard brand={brand}/>
            </div>
            <div className="span-4">
              <EmbedCard/>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<AdminApp/>);
