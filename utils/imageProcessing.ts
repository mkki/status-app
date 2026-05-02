import {
  ensureUploadDir,
  photoFile,
  safeDelete,
} from '@/features/image-upload/storage';
import type { Photo } from '@/types/photo';
import { randomUUID } from 'expo-crypto';
import { File } from 'expo-file-system';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as MediaLibrary from 'expo-media-library';
import { ImageConversionError } from './errors';

export const MAX_DIMENSION = 1600;
export const JPEG_QUALITY = 0.7;
export const THUMBNAIL_DIMENSION = 400;
export const THUMBNAIL_QUALITY = 0.5;

export type ConversionResult = {
  photo: Photo;
  localUri: string;
};

export const computeResizeTarget = (
  width: number,
  height: number,
  maxDimension: number
): { width?: number; height?: number } => {
  if (width <= maxDimension && height <= maxDimension) {
    return {};
  }
  return width >= height ? { width: maxDimension } : { height: maxDimension };
};

const renderResized = async (
  sourceUri: string,
  originalWidth: number,
  originalHeight: number,
  maxDimension: number,
  quality: number,
  withBase64: boolean
) => {
  const target = computeResizeTarget(originalWidth, originalHeight, maxDimension);
  const context = ImageManipulator.manipulate(sourceUri);
  if (target.width != null || target.height != null) {
    context.resize(target);
  }
  const ref = await context.renderAsync();
  return ref.saveAsync({
    base64: withBase64,
    compress: quality,
    format: SaveFormat.JPEG,
  });
};

export const assetToPhoto = async (
  asset: MediaLibrary.Asset,
  signal?: AbortSignal
): Promise<ConversionResult> => {
  if (signal?.aborted) {
    throw new ImageConversionError(asset.id, 'Conversion aborted');
  }

  const assetInfo = await MediaLibrary.getAssetInfoAsync(asset, {
    shouldDownloadFromNetwork: true,
  });

  if (!assetInfo.localUri) {
    throw new ImageConversionError(
      asset.id,
      'Asset localUri is unavailable (iCloud photo download may have failed)'
    );
  }

  if (signal?.aborted) {
    throw new ImageConversionError(asset.id, 'Conversion aborted');
  }

  const id = randomUUID();

  const fullResult = await renderResized(
    assetInfo.localUri,
    asset.width,
    asset.height,
    MAX_DIMENSION,
    JPEG_QUALITY,
    false
  );

  if (signal?.aborted) {
    safeDelete(fullResult.uri);
    throw new ImageConversionError(asset.id, 'Conversion aborted');
  }

  ensureUploadDir();
  const targetFile = photoFile(id);
  new File(fullResult.uri).move(targetFile);

  try {
    if (signal?.aborted) {
      throw new ImageConversionError(asset.id, 'Conversion aborted');
    }

    const thumbnailResult = await renderResized(
      targetFile.uri,
      fullResult.width,
      fullResult.height,
      THUMBNAIL_DIMENSION,
      THUMBNAIL_QUALITY,
      true
    );

    if (signal?.aborted) {
      throw new ImageConversionError(asset.id, 'Conversion aborted');
    }

    if (!thumbnailResult.base64) {
      throw new ImageConversionError(
        asset.id,
        'Image manipulator did not return thumbnail base64'
      );
    }

    return {
      photo: {
        id,
        thumbnailDataURI: `data:image/jpeg;base64,${thumbnailResult.base64}`,
        width: fullResult.width,
        height: fullResult.height,
      },
      localUri: targetFile.uri,
    };
  } catch (error) {
    safeDelete(targetFile.uri);
    throw error;
  }
};

export const assetsToPhotos = async (
  assets: MediaLibrary.Asset[],
  signal?: AbortSignal
): Promise<ConversionResult[]> => {
  const results: ConversionResult[] = [];
  try {
    for (const asset of assets) {
      if (signal?.aborted) {
        throw new ImageConversionError(asset.id, 'Conversion aborted');
      }
      results.push(await assetToPhoto(asset, signal));
    }
    return results;
  } catch (error) {
    results.forEach((r) => safeDelete(r.localUri));
    throw error;
  }
};
