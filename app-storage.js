/* ===== Temporary client-side storage =====
   Swappable adapter: Realtyflow CRM can replace these methods with API calls.
==================================================================== */
(function () {
  const KEY = "realtyflow.booking.requests.v1";

  function read() {
    try {
      const value = window.localStorage.getItem(KEY);
      return value ? JSON.parse(value) : [];
    } catch (error) {
      console.warn("Could not read bookings", error);
      return [];
    }
  }

  function write(bookings) {
    window.localStorage.setItem(KEY, JSON.stringify(bookings));
    window.dispatchEvent(new CustomEvent("booking-store:changed"));
  }

  function endpoint() {
    return String(window.REALTYFLOW_BOOKING_API_URL || "").trim();
  }

  function sourceKey() {
    return String(window.REALTYFLOW_BOOKING_SOURCE_KEY || "").trim();
  }

  function syncToRealtyflow(booking) {
    const url = endpoint();
    if (!url) return Promise.resolve({ skipped: true, reason: "No Realtyflow endpoint configured" });

    return fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(sourceKey() ? { "x-realtyflow-source-key": sourceKey() } : {}),
      },
      body: JSON.stringify(booking),
    })
      .then(async (response) => {
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(payload.error || `Realtyflow sync failed (${response.status})`);
        return payload;
      })
      .then((payload) => {
        const bookings = read().map((item) => item.id === booking.id ? { ...item, crmSync: { status: "synced", payload, syncedAt: new Date().toISOString() } } : item);
        write(bookings);
        return payload;
      })
      .catch((error) => {
        const bookings = read().map((item) => item.id === booking.id ? { ...item, crmSync: { status: "error", message: error.message, syncedAt: new Date().toISOString() } } : item);
        write(bookings);
        throw error;
      });
  }

  function create(input) {
    const booking = {
      id: `bk_${Date.now()}_${Math.random().toString(16).slice(2)}`,
      createdAt: new Date().toISOString(),
      status: input.paid ? "payment_pending" : "confirmed",
      source: "booking_page",
      crmSync: endpoint() ? { status: "pending" } : { status: "local_only" },
      ...input,
    };
    write([booking, ...read()]);
    syncToRealtyflow(booking).catch((error) => console.warn("Realtyflow booking sync failed", error));
    return booking;
  }

  function clear() {
    write([]);
  }

  window.BookingStore = { read, create, clear, syncToRealtyflow };
})();
