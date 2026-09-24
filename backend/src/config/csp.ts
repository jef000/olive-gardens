import config from './env';

/**
 * Content-Security-Policy directives shared by Helmet and the CSP report
 * endpoint. Keeping the policy in one place makes it easier to audit.
 */
export const cspDirectives = {
  defaultSrc: ["'self'"],
  scriptSrc: ["'self'"],
  styleSrc: ["'self'", "'unsafe-inline'"],
  imgSrc: ["'self'", 'data:', 'blob:', config.frontend.url],
  fontSrc: ["'self'", 'data:'],
  connectSrc: ["'self'", config.frontend.url],
  objectSrc: ["'none'"],
  baseUri: ["'self'"],
  frameAncestors: ["'none'"],
  formAction: ["'self'"],
  reportUri: ['/api/csp-report'],
  ...(config.isProduction ? { upgradeInsecureRequests: [] as const } : {}),
} as const;

export function cspReportHandler(): { success: true } {
  return { success: true };
}
