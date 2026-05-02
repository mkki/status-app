import { Directory, File, Paths } from 'expo-file-system';

const UPLOAD_DIR_NAME = 'image-uploads';

export const ensureUploadDir = (): Directory => {
  const dir = new Directory(Paths.cache, UPLOAD_DIR_NAME);
  dir.create({ idempotent: true });
  return dir;
};

export const clearUploadDir = (): void => {
  const dir = new Directory(Paths.cache, UPLOAD_DIR_NAME);
  if (dir.exists) {
    dir.delete();
  }
};

export const photoFile = (id: string): File => {
  return new File(Paths.cache, UPLOAD_DIR_NAME, `${id}.jpg`);
};

export const safeDelete = (uri: string): void => {
  const file = new File(uri);
  if (!file.exists) {
    return;
  }
  try {
    file.delete();
  } catch (error) {
    if (__DEV__) {
      console.warn('safeDelete failed:', uri, error);
    }
  }
};
