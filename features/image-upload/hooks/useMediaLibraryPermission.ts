import * as MediaLibrary from 'expo-media-library';
import { useEffect, useRef } from 'react';

type Options = {
  onDenied?: () => void;
};

export type MediaLibraryPermission = {
  granted: boolean;
};

export const useMediaLibraryPermission = ({
  onDenied,
}: Options = {}): MediaLibraryPermission => {
  const [response, requestPermission] = MediaLibrary.usePermissions();
  const handledRef = useRef(false);
  const onDeniedRef = useRef(onDenied);
  onDeniedRef.current = onDenied;

  useEffect(() => {
    if (!response || handledRef.current) {
      return;
    }

    switch (response.status) {
      case MediaLibrary.PermissionStatus.UNDETERMINED:
        requestPermission();
        break;
      case MediaLibrary.PermissionStatus.DENIED:
        handledRef.current = true;
        onDeniedRef.current?.();
        break;
    }
  }, [response, requestPermission]);

  return {
    granted: response?.granted ?? false,
  };
};
