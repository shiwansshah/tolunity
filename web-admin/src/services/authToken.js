export const clearStoredAuth = () => {
  localStorage.removeItem('admin_token');
  localStorage.removeItem('admin_user');
};

const parseJwtPayload = (token) => {
  const parts = token.split('.');

  if (parts.length !== 3) {
    return null;
  }

  try {
    const normalized = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=');
    const binary = window.atob(padded);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    const json = new TextDecoder().decode(bytes);

    return JSON.parse(json);
  } catch {
    return null;
  }
};

export const isTokenExpired = (token) => {
  if (!token) {
    return false;
  }

  const payload = parseJwtPayload(token);

  if (!payload || typeof payload.exp !== 'number') {
    return false;
  }

  return payload.exp * 1000 <= Date.now();
};
