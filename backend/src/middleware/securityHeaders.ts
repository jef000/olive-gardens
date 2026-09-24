import { Request, Response, NextFunction } from 'express';

/**
 * Security headers middleware
 *
 * Implements comprehensive security headers to protect against common web vulnerabilities:
 * - HSTS: Enforces HTTPS connections
 * - X-Frame-Options: Prevents clickjacking
 * - X-Content-Type-Options: Prevents MIME-sniffing attacks
 * - Referrer-Policy: Controls referrer information
 * - Permissions-Policy: Restricts browser features
 * - Removes X-Powered-By: Prevents technology fingerprinting
 *
 * Requirements: 11.1-11.6
 */
export function securityHeaders(_req: Request, res: Response, next: NextFunction): void {
  // 11.1: Strict-Transport-Security header with 1 year max-age and includeSubDomains
  // Forces browsers to use HTTPS for all future requests for 1 year
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

  // 11.2: X-Frame-Options header set to DENY
  // Prevents the page from being embedded in iframes, protecting against clickjacking
  res.setHeader('X-Frame-Options', 'DENY');

  // 11.3: X-Content-Type-Options header set to nosniff
  // Prevents browsers from MIME-sniffing responses away from declared content-type
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // 11.4: Referrer-Policy header set to strict-origin-when-cross-origin
  // Controls how much referrer information is included with requests
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // 11.5: Permissions-Policy header restricting camera, microphone, and geolocation
  // Prevents the application from using these browser features
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  // 11.6: Remove X-Powered-By header to prevent technology fingerprinting
  // Hides Express/Node.js version information from potential attackers
  res.removeHeader('X-Powered-By');

  next();
}
