import { MESSAGE_TYPES, WEB_VIEW_URL } from '@/constants/auth';
import { useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';

export default function Index() {
  const webViewRef = useRef<WebView>(null);
  const params = useLocalSearchParams();
  const [webViewLoaded, setWebViewLoaded] = useState(false);

  useEffect(() => {
    if (!webViewRef.current || !webViewLoaded) {
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

  const handleWebMessage = async (event: { nativeEvent: { data: string } }) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);

      switch (message.type) {
        case MESSAGE_TYPES.OPEN_EXTERNAL_BROWSER:
          await WebBrowser.openBrowserAsync(message.url);
          break;
        default:
          break;
      }
    } catch (error) {
      console.error('Error parsing web message:', error);
    }
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
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
