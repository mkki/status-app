import { MESSAGE_TYPES, WEB_VIEW_URL } from '@/constants/webview';
import { ImagePicker } from '@/features/image-upload';
import { photoStore } from '@/features/image-upload/photoStore';
import {
  clearUploadDir,
  photoFile,
  safeDelete,
} from '@/features/image-upload/storage';
import {
  uploadPhotos,
  type UploadResult,
} from '@/features/image-upload/uploader';
import type { Photo } from '@/types/photo';
import { useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';

let didBootstrap = false;

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((v) => typeof v === 'string');

const parseUploadPhotosPayload = (
  data: unknown
): { ids: string[]; questId: string; authToken?: string } | null => {
  if (!data || typeof data !== 'object') {
    return null;
  }
  const d = data as Record<string, unknown>;
  if (!isStringArray(d.ids) || typeof d.questId !== 'string') {
    return null;
  }
  const authToken = typeof d.authToken === 'string' ? d.authToken : undefined;
  return { ids: d.ids, questId: d.questId, authToken };
};

const parseDiscardPhotosPayload = (
  data: unknown
): { ids: string[] } | null => {
  if (!data || typeof data !== 'object') {
    return null;
  }
  const d = data as Record<string, unknown>;
  if (!isStringArray(d.ids)) {
    return null;
  }
  return { ids: d.ids };
};

export default function Index() {
  const webViewRef = useRef<WebView>(null);
  const params = useLocalSearchParams();
  const [webViewLoaded, setWebViewLoaded] = useState(false);
  const [showImagePicker, setShowImagePicker] = useState(false);

  useEffect(() => {
    if (didBootstrap) {
      return;
    }
    didBootstrap = true;
    clearUploadDir();
    photoStore.clear();
  }, []);

  useEffect(() => {
    if (!webViewRef.current || !webViewLoaded || !params.code) {
      return;
    }

    const sendAuthMessage = () => {
      if (!webViewRef.current) {
        return;
      }

      if (params.code && params.provider) {
        webViewRef.current.postMessage(
          JSON.stringify({
            type: MESSAGE_TYPES.AUTH_SUCCESS,
            data: { ...params },
          })
        );
      }

      if (params.error) {
        webViewRef.current.postMessage(
          JSON.stringify({
            type: MESSAGE_TYPES.AUTH_ERROR,
            data: { error: params.error },
          })
        );
      }
    };

    if (Platform.OS === 'ios') {
      WebBrowser.dismissBrowser().then(() => {
        sendAuthMessage();
      });
    } else {
      sendAuthMessage();
    }
  }, [webViewLoaded, params]);

  const handleWebViewLoad = () => {
    setWebViewLoaded(true);
  };

  const sendUploadResults = (questId: string, results: UploadResult[]) => {
    webViewRef.current?.postMessage(
      JSON.stringify({
        type: MESSAGE_TYPES.IMAGES_UPLOADED,
        data: { questId, results },
      })
    );
  };

  const handleUploadPhotos = async (data: {
    ids: string[];
    questId: string;
    authToken?: string;
  }) => {
    const expired: UploadResult[] = [];
    const pending: { id: string; localUri: string }[] = [];

    for (const id of data.ids) {
      const localUri = photoStore.get(id);
      if (!localUri) {
        expired.push({ id, error: 'EXPIRED' });
      } else {
        pending.push({ id, localUri });
      }
    }

    const uploaded = await uploadPhotos(pending, {
      questId: data.questId,
      authToken: data.authToken,
    });

    uploaded.forEach((result) => {
      if ('url' in result) {
        safeDelete(photoFile(result.id).uri);
        photoStore.remove(result.id);
      }
    });

    sendUploadResults(data.questId, [...expired, ...uploaded]);
  };

  const handleDiscardPhotos = (ids: string[]) => {
    ids.forEach((id) => {
      safeDelete(photoFile(id).uri);
      photoStore.remove(id);
    });
  };

  const handleWebMessage = async (event: { nativeEvent: { data: string } }) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);

      switch (message.type) {
        case MESSAGE_TYPES.OPEN_EXTERNAL_BROWSER:
          if (typeof message.url === 'string') {
            await WebBrowser.openBrowserAsync(message.url);
          }
          break;

        case MESSAGE_TYPES.PICK_IMAGES:
          setShowImagePicker(true);
          break;

        case MESSAGE_TYPES.UPLOAD_PHOTOS: {
          const payload = parseUploadPhotosPayload(message.data);
          if (!payload) {
            console.error('Invalid UPLOAD_PHOTOS payload:', message);
            break;
          }
          await handleUploadPhotos(payload);
          break;
        }

        case MESSAGE_TYPES.DISCARD_PHOTOS: {
          const payload = parseDiscardPhotosPayload(message.data);
          if (!payload) {
            console.error('Invalid DISCARD_PHOTOS payload:', message);
            break;
          }
          handleDiscardPhotos(payload.ids);
          break;
        }

        default:
          break;
      }
    } catch (error) {
      console.error('Error parsing web message:', error);
    }
  };

  const handleImagesSelected = (photos: Photo[]) => {
    webViewRef.current?.postMessage(
      JSON.stringify({
        type: MESSAGE_TYPES.IMAGES_SELECTED,
        data: photos,
      })
    );
  };

  const handleImagePickerClose = () => {
    setShowImagePicker(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
      >
        <WebView
          ref={webViewRef}
          source={{ uri: WEB_VIEW_URL }}
          javaScriptEnabled={true}
          onMessage={handleWebMessage}
          onLoadEnd={handleWebViewLoad}
          startInLoadingState={true}
          allowsInlineMediaPlayback={true}
          mediaPlaybackRequiresUserAction={false}
          overScrollMode="never"
        />

        {showImagePicker && (
          <ImagePicker
            onClose={handleImagePickerClose}
            onTransfer={handleImagesSelected}
          />
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
