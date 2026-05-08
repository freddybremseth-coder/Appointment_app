(function () {
  const script = document.currentScript;
  if (!script) return;

  const brand = script.getAttribute("data-brand") || "freddy";
  const configUrl = script.getAttribute("data-config-url") || "";
  const height = script.getAttribute("data-height") || "860";
  const base = new URL(script.src).origin + new URL(script.src).pathname.replace(/\/embed\.js$/, "");
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
})();
