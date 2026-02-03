import { Platform } from 'react-native';

export const WEB_VIEW_URL = __DEV__
  ? Platform.OS === 'android'
    ? 'http://10.0.2.2:5173'
    : 'http://localhost:5173'
  : 'https://status-front.duckdns.org';

export const MESSAGE_TYPES = {
  AUTH_SUCCESS: 'AUTH_SUCCESS',
  AUTH_ERROR: 'AUTH_ERROR',
  OPEN_EXTERNAL_BROWSER: 'OPEN_EXTERNAL_BROWSER',
} as const;
