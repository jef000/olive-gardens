import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';
import { uploadDir } from '../middleware/fileUpload.middleware';

export interface ProcessedImage {
  width: number;
  height: number;
  original: string;
  webp: string;
  thumbnail: string;
  medium: string;
  large: string;
}

/** Generate cacheable responsive WebP variants while retaining the uploaded original. */
export async function processUploadedImage(
  filePath: string,
  originalFilename: string
): Promise<ProcessedImage> {
  const metadata = await sharp(filePath).metadata();
  const baseName = path.parse(originalFilename).name;
  const makeVariant = async (width: number, suffix: string): Promise<string> => {
    const outputName = `${baseName}-${suffix}-${Date.now()}.webp`;
    await sharp(filePath)
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: 85 })
      .toFile(path.join(uploadDir, outputName));
    return `/uploads/secure/${outputName}`;
  };

  const [thumbnail, medium, large] = await Promise.all([
    makeVariant(150, '150'),
    makeVariant(300, '300'),
    makeVariant(800, '800'),
  ]);

  await fs.access(filePath);
  return {
    width: metadata.width ?? 0,
    height: metadata.height ?? 0,
    original: `/uploads/secure/${originalFilename}`,
    webp: large,
    thumbnail,
    medium,
    large,
  };
}
