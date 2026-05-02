import type * as MediaLibrary from 'expo-media-library';
import { useCallback, useMemo, useRef, useState } from 'react';

type Options = {
  maxImages: number;
  onLimitReached?: (max: number) => void;
};

export type AssetSelection = {
  selectedIds: ReadonlySet<string>;
  selectedAssets: MediaLibrary.Asset[];
  count: number;
  isSelected: (id: string) => boolean;
  toggle: (asset: MediaLibrary.Asset) => void;
};

export const useAssetSelection = ({
  maxImages,
  onLimitReached,
}: Options): AssetSelection => {
  const [selectedMap, setSelectedMap] = useState<Map<string, MediaLibrary.Asset>>(
    () => new Map()
  );

  const onLimitReachedRef = useRef(onLimitReached);
  onLimitReachedRef.current = onLimitReached;

  const toggle = useCallback(
    (asset: MediaLibrary.Asset) => {
      setSelectedMap((previous) => {
        if (previous.has(asset.id)) {
          const next = new Map(previous);
          next.delete(asset.id);
          return next;
        }
        if (previous.size >= maxImages) {
          onLimitReachedRef.current?.(maxImages);
          return previous;
        }
        const next = new Map(previous);
        next.set(asset.id, asset);
        return next;
      });
    },
    [maxImages]
  );

  const selectedIds = useMemo(
    () => new Set(selectedMap.keys()),
    [selectedMap]
  );

  const selectedAssets = useMemo(
    () => Array.from(selectedMap.values()),
    [selectedMap]
  );

  const isSelected = useCallback(
    (id: string) => selectedMap.has(id),
    [selectedMap]
  );

  return {
    selectedIds,
    selectedAssets,
    count: selectedMap.size,
    isSelected,
    toggle,
  };
};
