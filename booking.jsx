/* global React, ReactDOM, Icon, BOOKING_BRANDS, BOOKING_DEFAULT_BRAND, BookingStore */
const { useEffect, useState, useMemo, useRef } = React;

const MONTHS_NO = ["januar","februar","mars","april","mai","juni","juli","august","september","oktober","november","desember"];
const DOW_NO = ["man","tir","ons","tor","fre","lør","søn"];
const TIMES_AM = ["09:00","09:30","10:00","10:30","11:00","11:30"];
const TIMES_PM = ["13:00","13:30","14:00","14:30","15:00","16:00","17:00"];

function getInitialBrand() {
  const params = new URLSearchParams(window.location.search);
  const fromQuery = params.get("brand");
  const fromBody = document.body.dataset.brand;
  return BOOKING_BRANDS[fromQuery] || BOOKING_BRANDS[fromBody] || BOOKING_BRANDS[BOOKING_DEFAULT_BRAND];
}

function getInitialService(brand) {
  const params = new URLSearchParams(window.location.search);
  const fromQuery = params.get("service");
  return brand.services.find(s => s.id === fromQuery) || brand.services[0];
}

function getRemoteConfigUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("configUrl") || "";
}

function getAvailabilityUrl() {
  const params = new URLSearchParams(window.location.search);
  const explicit = params.get("availabilityUrl");
  if (explicit) return explicit;
  const configUrl = getRemoteConfigUrl();
  return configUrl ? configUrl.replace("/booking-config", "/booking-availability").split("?")[0] : "";
}

function buildMonth(year, month) {
  const first = new Date(year, month, 1);
  const startDow = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prev = new Date(year, month, 0).getDate();
  const cells = [];
  for (let i = startDow - 1; i >= 0; i--) cells.push({ d: prev - i, cur: false });
  for (let d = 1; d <= daysInMonth; d++) cells.push({ d, cur: true });
  while (cells.length < 42) cells.push({ d: cells.length - daysInMonth - startDow + 1, cur: false });
  return cells;
}

function addMinutes(time, minutes) {
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m + minutes;
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

function timeToMinutes(time) {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function selectedDateToRange(selected) {
  if (!selected) return null;
  const start = new Date(selected.y, selected.m, selected.d, 0, 0, 0);
  const end = new Date(selected.y, selected.m, selected.d, 23, 59, 59);
  return { start: start.toISOString(), end: end.toISOString() };
}

function busyToMinutesForDate(item, selected) {
  const start = new Date(item.start);
  const end = new Date(item.end);
  const dayStart = new Date(selected.y, selected.m, selected.d, 0, 0, 0);
  const dayEnd = new Date(selected.y, selected.m, selected.d, 23, 59, 59);
  const clippedStart = Math.max(start.getTime(), dayStart.getTime());
  const clippedEnd = Math.min(end.getTime(), dayEnd.getTime());
  if (clippedEnd <= clippedStart) return null;
  const s = new Date(clippedStart);
  const e = new Date(clippedEnd);
  return { start: s.getHours() * 60 + s.getMinutes(), end: e.getHours() * 60 + e.getMinutes() };
}

function isTimeBlocked(time, duration, busy, selected) {
  if (!selected || !busy?.length) return false;
  const start = timeToMinutes(time);
  const end = start + duration;
  return busy
    .map(item => busyToMinutesForDate(item, selected))
    .filter(Boolean)
    .some(item => start < item.end && end > item.start);
}

function decodeJwtPayload(token) {
  try {
    const payload = token.split(".")[1];
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(atob(base64).split("").map(c => `%${(`00${c.charCodeAt(0).toString(16)}`).slice(-2)}`).join(""));
    return JSON.parse(json);
  } catch (error) {
    console.warn("Could not decode Google credential", error);
    return null;
  }
}

function loadGoogleIdentityScript() {
  if (window.google?.accounts?.id) return Promise.resolve();
  if (window.__googleIdentityPromise) return window.__googleIdentityPromise;
  window.__googleIdentityPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = resolve;
    script.onerror = () => reject(new Error("Kunne ikke laste Google innlogging"));
    document.head.appendChild(script);
  });
  return window.__googleIdentityPromise;
}

function fieldIsFilled(value) {
  return Array.isArray(value) ? value.length > 0 : Boolean(String(value || "").trim());
}

function ProfileSidebar({ brand, googleUser, googleStatus, onGoogleLogin }) {
  return (
    <aside className="sidebar">
      <div className="card card-pad profile-card">
        <div className={`avatar avatar--${brand.accent}`}>{brand.profile.initials}</div>
        <div className="profile-name">{brand.profile.name}</div>
        <div className="profile-role">{brand.profile.role}</div>
        <div className="profile-socials">
          <a href="#" aria-label="LinkedIn"><Icon.In/></a>
          <a href="#" aria-label="X"><Icon.X/></a>
          <a href="#" aria-label="Web"><Icon.Link/></a>
        </div>
        <div className="profile-meta">
          <div className="profile-meta-row"><Icon.Pin/> <span>{brand.profile.location}</span></div>
          <div className="profile-meta-row"><Icon.Clock/> <span>{brand.profile.tz}</span></div>
        </div>
        <p className="profile-bio">{brand.profile.bio}</p>
      </div>

      <div className="card card-pad google-card">
        <button className="google-btn" onClick={onGoogleLogin} type="button">
          <Icon.Google/>
          <span>{googleUser ? `Innlogget som ${googleUser.name}` : "Logg inn med Google"}</span>
        </button>
        <div className={`google-sub ${googleStatus?.type === "error" ? "google-sub--error" : ""}`}>
          {googleStatus?.message || (googleUser ? googleUser.email : "for å autofylle dine opplysninger")}
        </div>
      </div>

      <div className="card card-pad gcal-card">
        <div className="gcal-head">
          <Icon.GCal/>
          <span className="gcal-name">Google Calendar</span>
          <span className="badge">Tilkoblet</span>
        </div>
        <div className="gcal-sub">Møtet opprettes med kalenderinvitasjon.</div>
      </div>

      <div className="powered">
        <div className={`powered-mark powered-mark--${brand.accent}`}>{brand.profile.initials.slice(0, 1)}</div>
        <div>
          <div className="powered-by">Drevet av</div>
          <div className="powered-name">{brand.siteName}</div>
        </div>
      </div>
      <div className="footer-links">
        <a href="#">Personvern</a>
        <span>·</span>
        <a href="#">Vilkår</a>
      </div>
    </aside>
  );
}

function PageIntro({ brand }) {
  return (
    <section className="booking-hero">
      <div className="eyebrow">{brand.page.eyebrow}</div>
      <h1>{brand.page.title}</h1>
      <p className="booking-lead">{brand.page.lead}</p>
      <div className="booking-url">
        <Icon.Link/>
        <span>{brand.bookingUrl}</span>
      </div>
      <div className="intro-copy">
        {brand.page.intro.map((text, i) => <p key={i}>{text}</p>)}
      </div>
    </section>
  );
}

function Stepper({ step }) {
  const steps = ["Velg tjeneste","Velg tidspunkt","Dine detaljer","Bekreft"];
  return (
    <div className="stepper">
      {steps.map((label, i) => {
        const idx = i + 1;
        const state = step === idx ? "current" : step > idx ? "done" : "todo";
        return (
          <React.Fragment key={label}>
            <div className={`step step--${state}`}>
              <div className="step-bub">{state === "done" ? <Icon.Check/> : idx}</div>
              <div className="step-label">{label}</div>
            </div>
            {idx < steps.length && <div className={`step-line ${step > idx ? "step-line--done" : ""}`}/>}
          </React.Fragment>
        );
      })}
    </div>
  );
}

function ServiceGrid({ services, value, onChange }) {
  return (
    <div className="svc-grid">
      {services.map(s => {
        const I = Icon[s.icon] || Icon.Phone;
        const active = value === s.id;
        return (
          <button key={s.id} className={`svc-card ${active ? "svc-card--active" : ""}`} onClick={() => onChange(s.id)}>
            <div className="svc-head">
              <span className={`icn icn--${s.iconStyle}`}><I/></span>
              {s.paid ? <span className="svc-tag svc-tag--paid">Betalt</span> : <span className="svc-tag svc-tag--free">Gratis</span>}
            </div>
            <div className="svc-title">{s.title}</div>
            <div className="svc-sub">{s.subtitle}</div>
            <div className="svc-dur"><Icon.Clock/> {s.durationLabel} · {s.format}</div>
            <p className="svc-blurb">{s.blurb}</p>
            <div className="svc-foot">
              <div className={`svc-price ${s.paid ? "is-paid" : "is-free"}`}>{s.price}</div>
              <div className="svc-price-note">{s.priceNote}</div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

function MiniCal({ year, month, selected, onPick, onMonth }) {
  const cells = useMemo(() => buildMonth(year, month), [year, month]);
  const today = new Date();
  const isToday = (d, cur) => cur && d === today.getDate() && month === today.getMonth() && year === today.getFullYear();
  return (
    <div className="cal">
      <div className="cal-head">
        <button className="cal-nav" onClick={() => onMonth(-1)} aria-label="Forrige måned"><Icon.ChevL/></button>
        <div className="cal-title">{MONTHS_NO[month]} {year}</div>
        <button className="cal-nav" onClick={() => onMonth(1)} aria-label="Neste måned"><Icon.ChevR/></button>
      </div>
      <div className="cal-dow">{DOW_NO.map(d => <div key={d}>{d}</div>)}</div>
      <div className="cal-grid">
        {cells.map((c, i) => {
          const sel = selected && c.cur && c.d === selected.d && month === selected.m && year === selected.y;
          const avail = c.cur && c.d >= 11 && c.d <= 22 && (i % 7) !== 5 && (i % 7) !== 6;
          return (
            <button
              key={i}
              disabled={!c.cur || !avail}
              className={`cal-cell ${!c.cur ? "is-out" : ""} ${sel ? "is-sel" : ""} ${isToday(c.d, c.cur) ? "is-today" : ""} ${avail ? "is-avail" : ""}`}
              onClick={() => avail && onPick({ d: c.d, m: month, y: year })}
            >
              {c.d}
              {avail && !sel && <span className="cal-dot"/>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function TimeList({ selected, onPick, dateLabel, times, loading }) {
  return (
    <div className="time-wrap">
      <div className="time-head">
        <div className="h-section">3. Velg et tidspunkt</div>
        <div className="time-sub">{loading ? "Sjekker kalender..." : dateLabel}</div>
      </div>
      <div className="time-list">
        {times.map(t => (
          <button key={t} className={`time-btn ${selected === t ? "is-sel" : ""}`} onClick={() => onPick(t)}>{t}</button>
        ))}
        {!loading && times.length === 0 && <div className="time-empty">Ingen ledige tider denne dagen.</div>}
      </div>
      <a href="#" className="link-action time-more">Vis flere tider</a>
    </div>
  );
}

function SelectedCard({ service, dateLabel, time }) {
  if (!service) return null;
  const I = Icon[service.icon] || Icon.Phone;
  const endTime = time ? addMinutes(time, service.duration) : "";
  return (
    <div className="selected card">
      <div className="selected-left">
        <div className="selected-eyebrow">Du har valgt</div>
        <div className="selected-row">
          <span className={`icn icn--${service.iconStyle}`}><I/></span>
          <div>
            <div className="selected-title">{service.title}</div>
            <div className="selected-meta">{service.durationLabel} · {service.price}</div>
          </div>
        </div>
      </div>
      <div className="selected-right">
        <div className="selected-when">{dateLabel || "Velg en dato"}</div>
        <div className="selected-time">{time ? `${time} – ${endTime} CET` : "Velg et tidspunkt"}</div>
      </div>
      <div className="selected-tick">{time && dateLabel && <Icon.CheckCircle/>}</div>
    </div>
  );
}

function IntakeField({ field, value, onChange }) {
  const setArrayValue = (option) => {
    const current = Array.isArray(value) ? value : [];
    onChange(current.includes(option) ? current.filter(x => x !== option) : [...current, option]);
  };

  if (field.type === "select") {
    return (
      <label className="form-field">
        <span>{field.label}{field.required && <b>*</b>}</span>
        <select value={value || ""} onChange={e => onChange(e.target.value)}>
          <option value="">Velg...</option>
          {field.options.map(option => <option key={option} value={option}>{option}</option>)}
        </select>
      </label>
    );
  }

  if (field.type === "radio-grid") {
    return (
      <div className="form-field">
        <span>{field.label}{field.required && <b>*</b>}</span>
        <div className="choice-grid">
          {field.options.map(option => (
            <button key={option} type="button" className={`choice ${value === option ? "is-on" : ""}`} onClick={() => onChange(option)}>
              {option}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (field.type === "checkbox-grid") {
    const current = Array.isArray(value) ? value : [];
    return (
      <div className="form-field">
        <span>{field.label}{field.required && <b>*</b>}</span>
        <div className="choice-grid">
          {field.options.map(option => (
            <button key={option} type="button" className={`choice ${current.includes(option) ? "is-on" : ""}`} onClick={() => setArrayValue(option)}>
              {option}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (field.type === "textarea") {
    return (
      <label className="form-field">
        <span>{field.label}{field.required && <b>*</b>}</span>
        <textarea value={value || ""} onChange={e => onChange(e.target.value)} placeholder={field.placeholder || ""} maxLength={700}/>
      </label>
    );
  }

  return (
    <label className="form-field">
      <span>{field.label}{field.required && <b>*</b>}</span>
      <input type={field.type === "url" ? "url" : "text"} value={value || ""} onChange={e => onChange(e.target.value)} placeholder={field.placeholder || ""}/>
    </label>
  );
}

function IntakeForm({ service, contact, setContact, answers, setAnswers }) {
  const updateAnswer = (id, value) => setAnswers(prev => ({ ...prev, [id]: value }));
  return (
    <section className="sec">
      <h2 className="h-section">4. {service.intakeTitle}</h2>
      <div className="contact-grid">
        <label className="form-field">
          <span>Navn<b>*</b></span>
          <input value={contact.name} onChange={e => setContact(p => ({ ...p, name: e.target.value }))} placeholder="Ditt navn"/>
        </label>
        <label className="form-field">
          <span>E-post<b>*</b></span>
          <input type="email" value={contact.email} onChange={e => setContact(p => ({ ...p, email: e.target.value }))} placeholder="din@epost.no"/>
        </label>
      </div>
      <div className="intake-grid">
        {service.intakeFields.map(field => (
          <IntakeField key={field.id} field={field} value={answers[field.id]} onChange={value => updateAnswer(field.id, value)}/>
        ))}
      </div>
    </section>
  );
}

function CrossLinks({ links }) {
  if (!links?.length) return null;
  return (
    <div className="cross-links">
      {links.map(link => (
        <a key={link.href} className="cross-link card" href={link.href}>
          <span>{link.label}</span>
          <strong>{link.text} {link.linkText}</strong>
        </a>
      ))}
    </div>
  );
}

function Confirmation({ brand, service, dateLabel, time, contact, booking }) {
  const endTime = time ? addMinutes(time, service.duration) : "";
  return (
    <div className="confirm-box card">
      <Icon.CheckCircle/>
      <div>
        <div className="confirm-title">{service.paid ? "Betaling må fullføres" : "Booking bekreftet"}</div>
        <p>
          {contact.name || "Kunden"} booker {service.title.toLowerCase()} hos {brand.siteName}
          {dateLabel && time ? ` ${dateLabel} kl. ${time}–${endTime}.` : "."}
        </p>
        {booking && <p>Referanse: {booking.id}</p>}
        {service.paid && <p className="payment-note">Neste produksjonssteg: send kunden til Stripe Checkout for {service.price} før møtet bekreftes.</p>}
      </div>
    </div>
  );
}

function BookingApp() {
  const [brand, setBrand] = useState(getInitialBrand);
  const [remoteStatus, setRemoteStatus] = useState("idle");
  document.body.dataset.brand = brand.id;

  const initialService = getInitialService(brand);
  const [serviceId, setServiceId] = useState(initialService.id);
  const [date, setDate] = useState({ d: 13, m: 4, y: 2026 });
  const [time, setTime] = useState("10:00");
  const [calMonth, setCalMonth] = useState({ m: 4, y: 2026 });
  const [contact, setContact] = useState({ name: "", email: "" });
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [booking, setBooking] = useState(null);
  const [busySlots, setBusySlots] = useState([]);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [googleStatus, setGoogleStatus] = useState({ type: "idle", message: "" });
  const [googleUser, setGoogleUser] = useState(null);
  const [googleCredential, setGoogleCredential] = useState("");
  const googleTokenClient = useRef(null);

  useEffect(() => {
    const configUrl = getRemoteConfigUrl();
    if (!configUrl) return;
    let cancelled = false;
    setRemoteStatus("loading");
    fetch(configUrl)
      .then((response) => response.json())
      .then((payload) => {
        if (cancelled || !payload?.config?.services?.length) return;
        setBrand(payload.config);
        setServiceId(payload.config.services[0].id);
        setAnswers({});
        setSubmitted(false);
        setBooking(null);
        setRemoteStatus("ready");
      })
      .catch((error) => {
        console.warn("Could not load remote booking config", error);
        if (!cancelled) setRemoteStatus("error");
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const clientId = String(window.GOOGLE_CLIENT_ID || "").trim();
    if (!clientId) {
      setGoogleStatus({ type: "error", message: "Google Client ID mangler." });
      return;
    }
    if (window.location.protocol === "file:") {
      setGoogleStatus({ type: "error", message: "Google innlogging virker på publisert https-side, ikke lokal filvisning." });
      return;
    }

    let cancelled = false;
    loadGoogleIdentityScript()
      .then(() => {
        if (cancelled || !window.google?.accounts) return;
        if (window.google.accounts.id) {
          window.google.accounts.id.initialize({
            client_id: clientId,
            callback: (response) => {
              const profile = decodeJwtPayload(response.credential);
              if (!profile?.email) {
                setGoogleStatus({ type: "error", message: "Google returnerte ikke e-post." });
                return;
              }
              const user = {
                name: profile.name || [profile.given_name, profile.family_name].filter(Boolean).join(" ") || profile.email,
                email: profile.email,
                picture: profile.picture || "",
                sub: profile.sub || "",
              };
              setGoogleCredential(response.credential || "");
              setGoogleUser(user);
              setContact((current) => ({
                ...current,
                name: current.name || user.name,
                email: current.email || user.email,
              }));
              setGoogleStatus({ type: "ready", message: "Google fylte inn navn og e-post." });
            },
            ux_mode: "popup",
          });
        }
        if (window.google.accounts.oauth2) {
          googleTokenClient.current = window.google.accounts.oauth2.initTokenClient({
            client_id: clientId,
            scope: "openid email profile",
            callback: async (response) => {
              if (response.error) {
                setGoogleStatus({ type: "error", message: "Google innlogging ble avbrutt." });
                return;
              }
              try {
                const profile = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
                  headers: { Authorization: `Bearer ${response.access_token}` },
                }).then((res) => res.json());
                if (!profile?.email) throw new Error("No email");
                const user = {
                  name: profile.name || [profile.given_name, profile.family_name].filter(Boolean).join(" ") || profile.email,
                  email: profile.email,
                  picture: profile.picture || "",
                  sub: profile.sub || "",
                };
                setGoogleCredential(response.access_token || "");
                setGoogleUser(user);
                setContact((current) => ({
                  ...current,
                  name: current.name || user.name,
                  email: current.email || user.email,
                }));
                setGoogleStatus({ type: "ready", message: "Google fylte inn navn og e-post." });
              } catch {
                setGoogleStatus({ type: "error", message: "Kunne ikke hente profil fra Google." });
              }
            },
          });
        }
        setGoogleStatus({ type: "ready", message: "" });
      })
      .catch(() => setGoogleStatus({ type: "error", message: "Kunne ikke laste Google innlogging." }));

    return () => { cancelled = true; };
  }, []);

  const service = brand.services.find(s => s.id === serviceId) || brand.services[0];
  const availabilityUrl = getAvailabilityUrl();
  const availableTimes = useMemo(() => {
    const allTimes = [...TIMES_AM, ...TIMES_PM];
    return allTimes.filter(t => !isTimeBlocked(t, service.duration, busySlots, date));
  }, [busySlots, date, service.duration]);
  const dateLabel = date
    ? `${["søndag","mandag","tirsdag","onsdag","torsdag","fredag","lørdag"][new Date(date.y, date.m, date.d).getDay()]} ${date.d}. ${MONTHS_NO[date.m]} ${date.y}`
    : "";
  const requiredFields = service.intakeFields.filter(f => f.required);
  const detailsReady = fieldIsFilled(contact.name) && fieldIsFilled(contact.email) && requiredFields.every(f => fieldIsFilled(answers[f.id]));
  const stepNum = submitted ? 4 : !serviceId ? 1 : !date || !time ? 2 : !detailsReady ? 3 : 4;

  const monthShift = (delta) => setCalMonth(p => {
    const total = p.y * 12 + p.m + delta;
    return { y: Math.floor(total / 12), m: total % 12 };
  });

  useEffect(() => {
    if (!availabilityUrl || !date) {
      setBusySlots([]);
      return;
    }
    const range = selectedDateToRange(date);
    if (!range) return;
    const controller = new AbortController();
    const url = new URL(availabilityUrl);
    url.searchParams.set("start", range.start);
    url.searchParams.set("end", range.end);
    url.searchParams.set("buffer", "30");
    setAvailabilityLoading(true);
    fetch(url.toString(), { signal: controller.signal })
      .then(res => res.ok ? res.json() : { busy: [] })
      .then(data => setBusySlots(Array.isArray(data.busy) ? data.busy : []))
      .catch(() => setBusySlots([]))
      .finally(() => setAvailabilityLoading(false));
    return () => controller.abort();
  }, [availabilityUrl, date]);

  useEffect(() => {
    if (time && !availableTimes.includes(time)) {
      setTime(availableTimes[0] || "");
    }
  }, [availableTimes, time]);

  const selectService = (id) => {
    setServiceId(id);
    setAnswers({});
    setSubmitted(false);
    setBooking(null);
  };

  const signInWithGoogle = () => {
    if (window.location.protocol === "file:") {
      setGoogleStatus({ type: "error", message: "Åpne den publiserte https-siden for Google innlogging." });
      return;
    }
    if (!window.google?.accounts) {
      setGoogleStatus({ type: "error", message: "Google innlogging er ikke ferdig lastet. Prøv igjen om et sekund." });
      return;
    }
    if (googleTokenClient.current) {
      googleTokenClient.current.requestAccessToken({ prompt: "select_account" });
      return;
    }
    window.google.accounts.id.prompt();
  };

  const submitBooking = () => {
    if (!detailsReady) return;
    const saved = BookingStore.create({
      brandId: brand.id,
      brandName: brand.siteName,
      serviceId: service.id,
      serviceTitle: service.title,
      date: dateLabel,
      time,
      duration: service.duration,
      price: service.price,
      paid: service.paid,
      contact,
      googleAuth: googleUser ? { user: googleUser, token: googleCredential } : null,
      answers,
    });
    setBooking(saved);
    setSubmitted(true);
  };

  return (
    <div className="page">
      <ProfileSidebar brand={brand} googleUser={googleUser} googleStatus={googleStatus} onGoogleLogin={signInWithGoogle}/>
      <main className="main">
        <div className="main-card card">
          <Stepper step={stepNum}/>
          {remoteStatus === "loading" && <div className="remote-note">Henter publisert bookingoppsett fra Realtyflow...</div>}
          {remoteStatus === "error" && <div className="remote-note remote-note--error">Kunne ikke hente publisert bookingoppsett. Viser lokal standard.</div>}
          <PageIntro brand={brand}/>

          <section className="sec">
            <h2 className="h-section">1. Velg en tjeneste</h2>
            <ServiceGrid services={brand.services} value={serviceId} onChange={selectService}/>
          </section>

          <div className="sec-split">
            <section className="sec sec-cal">
              <h2 className="h-section">2. Velg en dato</h2>
              <MiniCal year={calMonth.y} month={calMonth.m} selected={date} onPick={setDate} onMonth={monthShift}/>
              <div className="tz-note">
                <Icon.Globe/>
                <span>Tidssone: Europa/Madrid (CET)</span>
                <Icon.ChevD/>
              </div>
            </section>
            <section className="sec sec-time">
              <TimeList selected={time} onPick={setTime} dateLabel={dateLabel} times={availableTimes} loading={availabilityLoading}/>
            </section>
          </div>

          <SelectedCard service={service} dateLabel={dateLabel} time={time}/>
          <IntakeForm service={service} contact={contact} setContact={setContact} answers={answers} setAnswers={setAnswers}/>

          {submitted && <Confirmation brand={brand} service={service} dateLabel={dateLabel} time={time} contact={contact} booking={booking}/>}

          <div className="legal">
            <span className="lock">Sikkerhet</span>
            Ved å fortsette godtar du våre <a href="#">personvernvilkår</a> og <a href="#">brukervilkår</a>.
          </div>

          <button className="btn-primary" disabled={!detailsReady} onClick={submitBooking}>
            {service.cta}
          </button>

          <div className="reschedule">
            <Icon.Clock/>
            <span>Du kan <a href="#">flytte</a> eller <a href="#">avlyse</a> møtet etter bekreftelse.</span>
          </div>

          <CrossLinks links={brand.crossLinks}/>
        </div>
      </main>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<BookingApp/>);
