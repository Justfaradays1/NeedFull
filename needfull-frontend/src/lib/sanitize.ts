const XSS_PATTERNS = /[<>"'\\]/g;
const SCRIPT_PATTERN = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;
const EVENT_HANDLER = /\son\w+\s*=\s*['"][^'"]*['"]/gi;
const JS_PROTOCOL = /javascript\s*:/gi;

export function sanitizeInput(value: string): string {
  return value
    .replace(SCRIPT_PATTERN, '')
    .replace(EVENT_HANDLER, '')
    .replace(JS_PROTOCOL, '')
    .trim();
}

export function sanitizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function sanitizeName(name: string): string {
  return name
    .replace(XSS_PATTERNS, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function sanitizePhone(phone: string): string {
  return phone.replace(/[^\d\s\-\+\(\)]/g, '').trim();
}

export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}
