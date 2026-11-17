// Hệ thống tài khoản dùng chung với study-en (web học tiếng Anh).
export const ACCOUNT_API = "https://d1-template.trann46698.workers.dev/api";
export const GOOGLE_OAUTH_URL = `${ACCOUNT_API}/auth/google`;
export const UID_KEY = "studyen-uid";
export const AUTH_USER_KEY = "pf-auth-user";
export const UID_RE = /^[A-Za-z0-9_-]{1,64}$/;

export interface AccountUser {
  id: string;
  username: string;
  display_name: string | null;
  email: string | null;
}
