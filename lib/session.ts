export type UserRole = 'developer' | 'manager' | 'user';

const KEYS = {
  developer: 'userData-developer',
  manager: 'userData-manager',
  user: 'userData-client',
  currentRole: 'current-role',
};

export function setSession(role: UserRole, data: unknown) {
  try {
    if (role === 'developer') {
      localStorage.setItem(KEYS.developer, JSON.stringify(data));
      localStorage.removeItem(KEYS.manager);
      localStorage.removeItem(KEYS.user);
      localStorage.setItem(KEYS.currentRole, 'developer');
      return;
    }

    if (role === 'manager') {
      localStorage.setItem(KEYS.manager, JSON.stringify(data));
      localStorage.removeItem(KEYS.developer);
      localStorage.setItem(KEYS.currentRole, 'manager');
      return;
    }

    // role === 'user'
    localStorage.setItem(KEYS.user, JSON.stringify(data));
    localStorage.removeItem(KEYS.developer);
    localStorage.setItem(KEYS.currentRole, 'user');
  } catch (_) {
    // no-op to avoid breaking flow on storage issues
  }
}

export function enforceExclusivity() {
  try {
    const hasDeveloper = !!localStorage.getItem(KEYS.developer);
    const hasManager = !!localStorage.getItem(KEYS.manager);
    const hasUser = !!localStorage.getItem(KEYS.user);

    // If developer exists together with manager or user, keep developer and remove others
    if (hasDeveloper && (hasManager || hasUser)) {
      localStorage.removeItem(KEYS.manager);
      localStorage.removeItem(KEYS.user);
      localStorage.setItem(KEYS.currentRole, 'developer');
      return;
    }

    // If either manager or user exists along with developer, remove developer
    if (!hasDeveloper && (hasManager || hasUser)) {
      localStorage.removeItem(KEYS.developer);
      localStorage.setItem(KEYS.currentRole, hasManager ? 'manager' : 'user');
    }
  } catch (_) {
    // swallow errors
  }
}

export function clearRole(role: UserRole) {
  try {
    if (role === 'developer') {
      localStorage.removeItem(KEYS.developer);
      return;
    }
    if (role === 'manager') {
      localStorage.removeItem(KEYS.manager);
      return;
    }
    localStorage.removeItem(KEYS.user);
  } catch (_) {}
}


