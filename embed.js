(function () {
  const script = document.currentScript;
  if (!script) return;

  const brand = script.getAttribute("data-brand") || "freddy";
  const configUrl = script.getAttribute("data-config-url") || "";
  const height = script.getAttribute("data-height") || "860";
  const scriptOrigin = new URL(script.src).origin;
  const base = scriptOrigin + new URL(script.src).pathname.replace(/\/embed\.js$/, "");
  const src = `${base}/booking.html?brand=${encodeURIComponent(brand)}${configUrl ? `&configUrl=${encodeURIComponent(configUrl)}` : ""}`;

  const iframe = document.createElement("iframe");
  iframe.src = src;
  iframe.loading = "lazy";
  iframe.style.width = "100%";
  iframe.style.minHeight = `${height}px`;
  iframe.style.border = "0";
  iframe.style.borderRadius = "8px";
  iframe.setAttribute("title", "Booking");

  script.parentNode.insertBefore(iframe, script);

  // Boken selv rapporterer sin faktiske innholdshøyde via postMessage, slik at
  // rammen vokser til innholdet i stedet for å vise sin egen scrollbar.
  window.addEventListener("message", (event) => {
    if (event.origin !== scriptOrigin) return;
    if (event.source !== iframe.contentWindow) return;
    if (!event.data || event.data.type !== "appt-embed-height") return;
    const nextHeight = Number(event.data.height);
    if (!Number.isFinite(nextHeight) || nextHeight <= 0) return;
    iframe.style.height = `${nextHeight}px`;
  });
})();
