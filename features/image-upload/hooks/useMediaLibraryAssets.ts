import * as MediaLibrary from 'expo-media-library';
import { useCallback, useEffect, useRef, useState } from 'react';

const PAGE_SIZE = 50;

type Options = {
  granted: boolean;
};

export type MediaLibraryAssetsState = {
  assets: MediaLibrary.Asset[];
  isLoading: boolean;
  hasNextPage: boolean;
  loadMore: () => void;
};

export const useMediaLibraryAssets = ({
  granted,
}: Options): MediaLibraryAssetsState => {
  const [assets, setAssets] = useState<MediaLibrary.Asset[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [endCursor, setEndCursor] = useState<string | undefined>();
  const inFlightRef = useRef(false);
  const initializedRef = useRef(false);

  const load = useCallback(async (after?: string) => {
    if (inFlightRef.current) {
      return;
    }
    inFlightRef.current = true;
    setIsLoading(true);

    try {
      const result = await MediaLibrary.getAssetsAsync({
        first: PAGE_SIZE,
        after,
        mediaType: 'photo',
        sortBy: [[MediaLibrary.SortBy.creationTime, false]],
      });

      setAssets((previous) =>
        after ? [...previous, ...result.assets] : result.assets
      );
      setHasNextPage(result.hasNextPage);
      setEndCursor(result.endCursor);
    } catch (error) {
      console.error('Error loading assets:', error);
    } finally {
      inFlightRef.current = false;
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (granted && !initializedRef.current) {
      initializedRef.current = true;
      load();
    }
  }, [granted, load]);

  const loadMore = useCallback(() => {
    if (hasNextPage && !inFlightRef.current && endCursor) {
      load(endCursor);
    }
  }, [hasNextPage, endCursor, load]);

  return { assets, isLoading, hasNextPage, loadMore };
};
