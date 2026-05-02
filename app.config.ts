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
      NSPhotoLibraryUsageDescription: '프로필 사진 및 게시물에 사용할 사진을 선택하기 위해 갤러리 접근 권한이 필요합니다.',
      NSPhotoLibraryAddUsageDescription: '선택한 사진을 저장하기 위해 갤러리 접근 권한이 필요합니다.',
    },
  },
  android: {
    edgeToEdgeEnabled: true,
    package: 'com.status.app.status',
    permissions: [
      'READ_EXTERNAL_STORAGE',
      'WRITE_EXTERNAL_STORAGE',
      'READ_MEDIA_IMAGES',
    ],
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
    [
      'expo-media-library',
      {
        photosPermission: '프로필 사진 및 게시물에 사용할 사진을 선택하기 위해 갤러리 접근 권한이 필요합니다.',
        savePhotosPermission: '선택한 사진을 저장하기 위해 갤러리 접근 권한이 필요합니다.',
        isAccessMediaLocationEnabled: true,
        granularPermissions: ['photo'],
      },
    ],
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
