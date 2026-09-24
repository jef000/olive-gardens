import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import multer from 'multer';
import { NextFunction, Request, Response } from 'express';
import { sendError } from '../utils/response';

const uploadDir = path.resolve(__dirname, '../../uploads/secure');
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

// The stored extension is derived from the validated MIME type, never from the
// client-supplied filename: an attacker must not be able to store foo.html.
const MIME_EXTENSIONS: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

const storage = multer.diskStorage({
  destination: async (_req, _file, callback) => {
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      callback(null, uploadDir);
    } catch (error) {
      callback(error as Error, uploadDir);
    }
  },
  filename: (_req, file, callback) => {
    const extension = MIME_EXTENSIONS[file.mimetype] ?? '.bin';
    callback(null, `${crypto.randomBytes(16).toString('hex')}${extension}`);
  },
});

const fileFilter: multer.Options['fileFilter'] = (_req, file, callback) => {
  const accepted = new Set(Object.keys(MIME_EXTENSIONS));
  if (!accepted.has(file.mimetype)) {
    callback(new Error('Only JPEG, PNG, and WebP images are allowed'));
    return;
  }
  callback(null, true);
};

export const secureUpload = multer({
  storage,
  limits: { fileSize: MAX_IMAGE_SIZE, files: 1 },
  fileFilter,
});

export function matchesMagicNumber(buffer: Buffer, mimeType: string): boolean {
  if (mimeType === 'image/jpeg')
    return buffer.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]));
  if (mimeType === 'image/png')
    return buffer
      .subarray(0, 8)
      .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  if (mimeType === 'image/webp')
    return (
      buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
      buffer.subarray(8, 12).toString('ascii') === 'WEBP'
    );
  return false;
}

/** Validate bytes after multer has written the file, preventing spoofed MIME types. */
export async function validateUploadedImage(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  if (!req.file) {
    sendError(res, 'No image file provided', 400, 'FILE_REQUIRED');
    return;
  }

  try {
    const header = await fs.readFile(req.file.path, { encoding: null });
    const executable =
      header.subarray(0, 4).toString('ascii') === 'MZ' ||
      header.subarray(0, 4).toString('ascii') === '\x7fELF';
    if (executable || !matchesMagicNumber(header, req.file.mimetype)) {
      await fs.unlink(req.file.path).catch(() => undefined);
      sendError(
        res,
        'File content does not match an allowed image type',
        400,
        'INVALID_FILE_CONTENT'
      );
      return;
    }

    next();
  } catch (error) {
    await fs.unlink(req.file.path).catch(() => undefined);
    next(error);
  }
}

export { MAX_IMAGE_SIZE, uploadDir };
