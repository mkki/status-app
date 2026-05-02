import { assetsToPhotos } from '@/utils/imageProcessing';
import type { Photo } from '@/types/photo';
import type * as MediaLibrary from 'expo-media-library';
import { useCallback, useEffect, useRef, useState } from 'react';
import { safeDelete } from '../storage';

export type Registration = { id: string; localUri: string };

export type ConversionOutcome = {
  photos: Photo[];
  registrations: Registration[];
};

export type PhotoConversion = {
  isConverting: boolean;
  convert: (assets: MediaLibrary.Asset[]) => Promise<ConversionOutcome | null>;
};

export const usePhotoConversion = (): PhotoConversion => {
  const [isConverting, setIsConverting] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      abortRef.current?.abort();
    };
  }, []);

  const convert = useCallback(
    async (assets: MediaLibrary.Asset[]): Promise<ConversionOutcome | null> => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setIsConverting(true);
      try {
        const results = await assetsToPhotos(assets, controller.signal);
        if (controller.signal.aborted || !mountedRef.current) {
          results.forEach((r) => safeDelete(r.localUri));
          return null;
        }
        return {
          photos: results.map((r) => r.photo),
          registrations: results.map((r) => ({
            id: r.photo.id,
            localUri: r.localUri,
          })),
        };
      } finally {
        if (mountedRef.current && abortRef.current === controller) {
          setIsConverting(false);
        }
      }
    },
    []
  );

  return { isConverting, convert };
};
