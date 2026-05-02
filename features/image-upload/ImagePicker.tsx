import IconArrowBack from '@/components/icons/icon-arrow-back.svg';
import IconRoundCheck from '@/components/icons/icon-round-check.svg';
import { Image } from 'expo-image';
import type * as MediaLibrary from 'expo-media-library';
import { useCallback } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAssetSelection } from './hooks/useAssetSelection';
import { useMediaLibraryAssets } from './hooks/useMediaLibraryAssets';
import { useMediaLibraryPermission } from './hooks/useMediaLibraryPermission';
import { usePhotoConversion } from './hooks/usePhotoConversion';
import { photoStore } from './photoStore';
import type { Photo } from '@/types/photo';

type ImagePickerProps = {
  maxImages?: number;
  onClose: () => void;
  onTransfer: (photos: Photo[]) => void;
};

const SCREEN_WIDTH = Dimensions.get('window').width;
const IMAGE_SIZE = SCREEN_WIDTH / 3;

const PERMISSION_DENIED_MESSAGE = '갤러리 접근 권한이 필요합니다.';
const CONVERSION_ERROR_MESSAGE = '이미지를 추가하는 중 오류가 발생했습니다.';

export const ImagePicker = ({
  maxImages = 5,
  onClose,
  onTransfer,
}: ImagePickerProps) => {
  const { granted } = useMediaLibraryPermission({
    onDenied: () => {
      Alert.alert('알림', PERMISSION_DENIED_MESSAGE);
      onClose();
    },
  });

  const { assets, isLoading, loadMore } = useMediaLibraryAssets({ granted });

  const { selectedIds, selectedAssets, count, isSelected, toggle } =
    useAssetSelection({
      maxImages,
      onLimitReached: (max) => {
        Alert.alert('알림', `최대 ${max}장까지만 추가할 수 있습니다.`);
      },
    });

  const { isConverting, convert } = usePhotoConversion();

  const handleConfirm = async () => {
    if (count === 0 || isConverting) {
      return;
    }
    try {
      const outcome = await convert(selectedAssets);
      if (!outcome) {
        return;
      }
      outcome.registrations.forEach(({ id, localUri }) =>
        photoStore.register(id, localUri)
      );
      onTransfer(outcome.photos);
      onClose();
    } catch (error) {
      console.error('Error processing images:', error);
      Alert.alert('알림', CONVERSION_ERROR_MESSAGE);
    }
  };

  const renderImageItem = useCallback(
    ({ item }: { item: MediaLibrary.Asset }) => {
      const selected = isSelected(item.id);
      return (
        <TouchableOpacity
          style={styles.imageItem}
          accessibilityRole="button"
          accessibilityLabel={`이미지 ${selected ? '선택됨' : '선택 안됨'}`}
          activeOpacity={0.8}
          onPress={() => toggle(item)}
        >
          <Image
            source={{ uri: item.uri }}
            style={styles.image}
            contentFit="cover"
          />
          {selected && (
            <View style={styles.checkbox}>
              <IconRoundCheck />
            </View>
          )}
        </TouchableOpacity>
      );
    },
    [isSelected, toggle]
  );

  if (!granted) {
    return null;
  }

  const confirmDisabled = count === 0 || isConverting;

  return (
    <View style={styles.overlay}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={onClose}
            style={styles.backButton}
            accessibilityLabel="뒤로가기"
            accessibilityRole="button"
          >
            <IconArrowBack />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>이미지 선택</Text>
          <Text
            style={styles.counter}
            accessibilityLabel={`전체 ${maxImages}장 중 ${count}장 선택됨`}
          >
            ({count}/{maxImages})
          </Text>
        </View>

        <FlatList
          data={assets}
          renderItem={renderImageItem}
          keyExtractor={(item) => item.id}
          numColumns={3}
          extraData={selectedIds}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            isLoading ? (
              <ActivityIndicator
                size="small"
                color="#ffffff"
                style={styles.loader}
              />
            ) : null
          }
        />

        <View style={styles.footer}>
          <TouchableOpacity
            onPress={handleConfirm}
            disabled={confirmDisabled}
            style={[
              styles.confirmButton,
              confirmDisabled && styles.confirmButtonDisabled,
            ]}
            accessibilityLabel="선택 완료"
            accessibilityRole="button"
          >
            {isConverting ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={styles.confirmButtonText}>선택 완료</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 2000,
  },
  container: {
    flex: 1,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    backgroundColor: '#212121',
  },
  header: {
    position: 'relative',
    height: 58,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButton: {
    position: 'absolute',
    top: 9,
    left: 6,
    padding: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  counter: {
    marginLeft: 4,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  imageItem: {
    position: 'relative',
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
  },
  image: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
  },
  checkbox: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 2,
    backgroundColor: '#f5432d',
  },
  loader: {
    paddingVertical: 16,
  },
  footer: {
    paddingTop: 8,
    paddingHorizontal: 14,
    paddingBottom: 14,
  },
  confirmButton: {
    backgroundColor: '#ff4a33',
    paddingVertical: 16,
    borderRadius: 5,
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    opacity: 0.5,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#ffffff',
  },
});
