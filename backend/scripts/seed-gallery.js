/**
 * Seed the public gallery with real venue photography.
 *
 * Source images live in frontend/src/assets/venue (web-optimised JPGs).
 * This script copies them into uploads/secure, generates thumbnails, and
 * replaces any placeholder (Unsplash) rows with the real photos.
 *
 * Usage (from backend/):  node scripts/seed-gallery.js
 * Re-running is safe: previously seeded gallery rows are replaced.
 */
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const { Pool } = require('pg');
const sharp = require('sharp');

const SRC_DIR = path.resolve(__dirname, '../../frontend/src/assets/venue');
const UPLOAD_DIR = path.resolve(__dirname, '../uploads/secure');

const images = [
  // Gardens
  { file: 'hero-garden.jpg', album: 'Gardens', category: 'Gardens', featured: true, title: 'Manicured Lawns & Hedge Borders', description: 'The sweeping lawns and trimmed hedge borders that greet guests at the gardens.' },
  { file: 'venue-lawn.jpg', album: 'Gardens', category: 'Gardens', title: 'Rolling Lawns & Indigenous Trees', description: 'Indigenous trees shade the open lawns used for picnics and gatherings.' },
  { file: 'venue-garden-path.jpg', album: 'Gardens', category: 'Gardens', title: 'A Shaded Garden Path', description: 'Stone pathways wind through flowering beds in the heart of the gardens.' },
  { file: 'venue-chapel-garden.jpg', album: 'Gardens', category: 'Gardens', title: 'Chapel Garden Lawns', description: 'The quiet lawn beside the chapel, framed by the indigenous forest.' },
  { file: 'venue-gazebo.jpg', album: 'Gardens', category: 'Facilities', title: 'The Garden Gazebo', description: 'A shaded gazebo on the lawns — a favourite spot for small ceremonies.' },
  { file: 'venue-hibiscus.jpg', album: 'Gardens', category: 'Nature', title: 'Hibiscus in Bloom', description: 'Flowering shrubs scattered through the gardens year-round.' },
  { file: 'venue-plant.jpg', album: 'Gardens', category: 'Nature', title: 'Ornamental Plants Along the Walkways', description: 'Carefully kept plantings line the garden walkways.' },
  { file: 'venue-flower-gold.jpg', album: 'Gardens', category: 'Nature', title: 'Golden Blossoms', description: 'Golden blossoms hanging over a garden path.' },
  // Garden of Eden
  { file: 'venue-garden-of-eden.jpg', album: 'Garden of Eden', category: 'Gardens', title: 'The Garden of Eden', description: 'Lush planting inside the Garden of Eden, home of the Miracle Tree.' },
  { file: 'venue-miracle-tree-sign.jpg', album: 'Garden of Eden', category: 'Gardens', featured: true, title: 'The Miracle Tree', description: 'The sign at the Miracle Tree, a wonder corner at the base of the main garden.' },
  { file: 'venue-stream-bridge.jpg', album: 'Garden of Eden', category: 'Gardens', title: 'Wooden Bridge Over the Stream', description: 'A timber crossing over the stream that flows through the gardens.' },
  // Mount Sinai Prayer Area
  { file: 'venue-prayer-sign.jpg', album: 'Mount Sinai Prayer Area', category: 'Faith', title: 'Mount Sinai Prayer Point', description: 'One of the prayer points on Mount Sinai — "I know the plans I have for you".' },
  { file: 'venue-prayer-sign-2.jpg', album: 'Mount Sinai Prayer Area', category: 'Faith', title: 'Prayer Garden Sign', description: 'Scripture boards mark the prayer points on the highest part of the gardens.' },
  // Picnic & water features
  { file: 'venue-river.jpg', album: 'Picnic Grounds', category: 'Nature', featured: true, title: 'River Ngaciuma', description: 'The natural river that flows right through the middle of the gardens.' },
  { file: 'venue-spring.jpg', album: 'Picnic Grounds', category: 'Nature', title: 'The Kathambi Spring', description: 'A natural spring feeding a clear fish pond inside the gardens.' },
  { file: 'venue-fountain.jpg', album: 'Picnic Grounds', category: 'Facilities', title: 'Fountain View', description: 'The fountain at Fountain View — an outdoor auditorium for photos and events.' },
  { file: 'venue-water-feature.jpg', album: 'Picnic Grounds', category: 'Nature', title: 'Water Feature & Lilies', description: 'Rocks and lilies around the gardens\u2019 water features.' },
  // Main Arena
  { file: 'venue-main-arena.jpg', album: 'Main Arena', category: 'Events', featured: true, title: 'The Main Arena Grounds', description: 'The largest open ground in the gardens, hosting up to 1,000 guests for receptions and productions.' },
  // Facilities
  { file: 'venue-lounge.jpg', album: 'Facilities', category: 'Facilities', title: 'Guest Lounge', description: 'A quiet lounge for guests, with garden views and room for small meetings.' },
  { file: 'venue-veranda.jpg', album: 'Facilities', category: 'Facilities', title: 'The Veranda', description: 'Shaded veranda seating overlooking the lawns — used for meals and receptions.' },
  { file: 'venue-office.jpg', album: 'Facilities', category: 'Facilities', title: 'The Office', description: 'The gardens\u2019 office, where guests are welcomed on arrival.' },
  { file: 'octc-building.jpg', album: 'Facilities', category: 'Counselling', featured: true, title: 'Olive Counselling & Training Center', description: 'The OCTC building, registered with KCPA since 2005 and housed within the gardens.' },
  // Therapy rooms / OCTC
  { file: 'octc-play-therapy.jpg', album: 'Therapy Room', category: 'Counselling', title: 'Play Therapy Materials', description: 'Play therapy materials used in child and family counselling sessions.' },
  { file: 'dr-monica.jpg', album: 'Therapy Room', category: 'Counselling', title: 'Dr. Monica Gitonga at Work', description: 'Dr. Monica Gitonga, senior psychologist at the Olive Counselling and Training Center.' },
  // Nature & wildlife
  { file: 'venue-birds.jpg', album: 'Other', category: 'Nature', title: 'Guineafowl on the Lawns', description: 'Guineafowl roam freely across the gardens.' },
  { file: 'venue-aviary.jpg', album: 'Other', category: 'Nature', title: 'The Aviary', description: 'The aviary houses a collection of birds for guests to enjoy.' },
  { file: 'venue-tortoise.jpg', album: 'Other', category: 'Nature', title: 'The Tortoise Enclosure', description: 'Slow and steady residents of the gardens\u2019 tortoise enclosure.' },
  { file: 'venue-apiary.jpg', album: 'Other', category: 'Nature', title: 'The Apiary', description: 'Beehives in the Synergy Garden, a living lesson in teamwork.' },
];

async function main() {
  if (!fs.existsSync(SRC_DIR)) {
    throw new Error(`Source image directory not found: ${SRC_DIR}`);
  }
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });

  const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME || 'olive',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
  });

  // Remove placeholder stock rows and any previously seeded rows.
  const removed = await pool.query(
    `DELETE FROM gallery_images
     WHERE url LIKE 'https://images.unsplash.com/%'
        OR url LIKE '/uploads/secure/gallery-%'`
  );
  console.log(`Removed ${removed.rowCount} placeholder/previous rows.`);

  let inserted = 0;
  for (const img of images) {
    const srcPath = path.join(SRC_DIR, img.file);
    if (!fs.existsSync(srcPath)) {
      console.warn(`  skipping missing source: ${img.file}`);
      continue;
    }

    const storedName = `gallery-${img.file.replace(/[^a-z0-9.-]+/gi, '-').toLowerCase()}`;
    const thumbName = storedName.replace(/^gallery-/, 'thumb-');
    const storedPath = path.join(UPLOAD_DIR, storedName);
    const thumbPath = path.join(UPLOAD_DIR, thumbName);

    fs.copyFileSync(srcPath, storedPath);

    const meta = await sharp(srcPath).metadata();
    await sharp(srcPath)
      .resize({ width: 400, height: 300, fit: 'cover' })
      .jpeg({ quality: 78, mozjpeg: true })
      .toFile(thumbPath);

    const url = `/uploads/secure/${storedName}`;
    const thumbnailUrl = `/uploads/secure/${thumbName}`;
    const altText = img.title.slice(0, 125);

    await pool.query(
      `INSERT INTO gallery_images
         (title, alt_text, description, url, thumbnail_url, album, category, tags,
          file_size, file_type, width, height, is_featured, is_published)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,true)`,
      [
        img.title,
        altText,
        img.description,
        url,
        thumbnailUrl,
        img.album,
        img.category,
        [img.category.toLowerCase(), img.album.toLowerCase()],
        fs.statSync(storedPath).size,
        'image/jpeg',
        meta.width || null,
        meta.height || null,
        Boolean(img.featured),
      ]
    );
    inserted += 1;
  }

  const { rows } = await pool.query('SELECT COUNT(*)::int AS count FROM gallery_images');
  console.log(`Inserted ${inserted} real gallery images. Table now holds ${rows[0].count} rows.`);
  await pool.end();
}

main().catch((err) => {
  console.error('Gallery seed failed:', err.message);
  process.exit(1);
});
