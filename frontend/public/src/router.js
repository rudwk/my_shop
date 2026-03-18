export function getPath() {
  const raw = window.location.hash.replace(/^#/, "");
  return raw || "/";
}

export function navigate(path) {
  window.location.hash = path.startsWith("#") ? path : `#${path}`;
}

export function startRouter(onChange) {
  const handler = () => onChange(getPath());
  window.addEventListener("hashchange", handler);
  handler();
  return () => window.removeEventListener("hashchange", handler);
}

export function matchRoute(path, pattern) {
  const pathParts = path.split("/").filter(Boolean);
  const patternParts = pattern.split("/").filter(Boolean);
  if (pathParts.length !== patternParts.length) return null;

  const params = {};
  for (let i = 0; i < patternParts.length; i += 1) {
    const pp = patternParts[i];
    const pv = pathParts[i];
    if (pp.startsWith(":")) {
      params[pp.slice(1)] = pv;
      continue;
    }
    if (pp !== pv) return null;
  }
  return params;
}

