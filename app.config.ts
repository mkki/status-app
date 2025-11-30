import { ConfigContext, ExpoConfig } from 'expo/config';
import 'tsx/cjs';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: '상태창',
  slug: 'status-app',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'statusapp',
  userInterfaceStyle: 'automatic',
  newArchEnabled: true,
  ios: {
    appleTeamId: 'KK8RN9BH2Z',
    bundleIdentifier: 'com.status.app.status',
    supportsTablet: false,
    usesAppleSignIn: true,
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
    },
  },
  android: {
    edgeToEdgeEnabled: true,
    package: 'com.status.app.status',
  },
  web: {
    bundler: 'metro',
    output: 'static',
    favicon: '',
  },
  plugins: [
    'expo-router',
    'expo-web-browser',
    [
      'expo-splash-screen',
      {
        image: './assets/images/splash.png',
        backgroundColor: '#161416',
      },
    ],
    'react-native-video',
    ['./plugins/withPlugin.ts'],
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    router: {},
    eas: {
      projectId: 'bb83d6ca-e7fc-406b-8e82-ef092f10c41d',
    },
  },
});
