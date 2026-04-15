/** Shared user preferences – used by account page & AI generation */

export interface UserPreferences {
  defaultPlatform: 'xiaohongshu' | 'wechat' | 'douyin';
  writingStyle: string;
  writingTone: string;
  signature: string;
}

export const defaultPrefs: UserPreferences = {
  defaultPlatform: 'xiaohongshu',
  writingStyle: '专业严谨',
  writingTone: '友好亲切',
  signature: '',
};

const STORAGE_KEY = 'spark-user-prefs';

export function loadUserPrefs(): UserPreferences {
  try {
    const s = localStorage.getItem(STORAGE_KEY);
    return s ? { ...defaultPrefs, ...JSON.parse(s) } : defaultPrefs;
  } catch {
    return defaultPrefs;
  }
}

export function saveUserPrefs(p: UserPreferences) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
}

/** Build a context string for AI prompts */
export function getUserPrefsContext(): string {
  const p = loadUserPrefs();
  const parts: string[] = [];
  parts.push('【用户写作偏好】');
  parts.push(`默认平台: ${platformLabel(p.defaultPlatform)}`);
  parts.push(`写作风格: ${p.writingStyle}`);
  parts.push(`语气偏好: ${p.writingTone}`);
  if (p.signature) parts.push(`个性签名: ${p.signature}`);
  return parts.join('\n');
}

export function platformLabel(v: string) {
  const map: Record<string, string> = { xiaohongshu: '小红书', wechat: '公众号', douyin: '抖音' };
  return map[v] || v;
}
