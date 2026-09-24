/**
 * Single source of truth for public contact details.
 * Sourced from the venue's published contacts (Meru–Maua Road, Makutano).
 * Confirm the numbers with the office before launch — every page and the
 * footer read from here, so there is only one edit.
 */
export const SITE_CONTACT = {
  name: 'Olive Retreat Gardens',
  phoneDisplay: '+254 716 876 689',
  phoneHref: 'tel:+254716876689',
  phoneAltDisplay: '0725 652 345 · 0725 653 331',
  email: 'olivecounseling@gmail.com',
  whatsappUrl:
    'https://wa.me/254716876689?text=Hello%21%20I%27m%20planning%20to%20have%20an%20event%20at%20Olive%20Retreat%20Gardens%20and%20would%20love%20to%20discuss%20availability%20and%20services.%20Could%20you%20please%20share%20more%20details%3F',
  addressLines: [
    'Off Meru–Maua Road, 3 km after Makutano Shopping Centre',
    'About 200 m before the KeMU main campus gate',
    'Meru County, Kenya',
  ],
  postal: 'P.O. Box 2064-60200, Meru',
  /** Resolved from the facility's shared Google Maps pin (0.083942, 37.6550359). */
  mapsUrl: 'https://maps.app.goo.gl/V8qDRsVhXNbUoXxQ9',
  mapsEmbedUrl: 'https://maps.google.com/maps?q=0.083942,37.6550359&z=16&output=embed',
} as const;
