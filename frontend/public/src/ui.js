export function formatMoney(value) {
  const number = Number(value);
  if (Number.isNaN(number)) return String(value);
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "KRW",
    maximumFractionDigits: 0,
  }).format(number);
}

export function formatDateTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function clampInt(value, min, max) {
  const n = Math.trunc(Number(value));
  if (Number.isNaN(n)) return min;
  return Math.max(min, Math.min(max, n));
}

export function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function toast({ title, message, kind = "info", timeoutMs = 3200 }) {
  const root = document.getElementById("toast-root");
  if (!root) return;

  const el = document.createElement("div");
  el.className = `toast toast--${kind === "info" ? "ok" : kind}`;

  el.innerHTML = `
    <div class="toast__dot" aria-hidden="true"></div>
    <div>
      <p class="toast__title">${escapeHtml(title ?? kind.toUpperCase())}</p>
      <p class="toast__msg">${escapeHtml(message ?? "")}</p>
    </div>
  `;

  root.appendChild(el);
  const timer = window.setTimeout(() => {
    el.remove();
  }, timeoutMs);

  el.addEventListener("click", () => {
    window.clearTimeout(timer);
    el.remove();
  });
}

export function setPage(el) {
  const root = document.getElementById("page");
  if (!root) return;
  root.replaceChildren(el);
}

