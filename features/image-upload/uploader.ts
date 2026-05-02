import { UPLOAD_PHOTO_ENDPOINT } from '@/constants/upload';

type UploadOptions = {
  questId: string;
  authToken?: string;
};

export type UploadResult =
  | { id: string; url: string }
  | { id: string; error: string };

const ensureEndpoint = (): string => {
  if (!UPLOAD_PHOTO_ENDPOINT) {
    throw new Error('업로드 서버 설정이 누락되었습니다 (EXPO_PUBLIC_UPLOAD_ENDPOINT)');
  }
  return UPLOAD_PHOTO_ENDPOINT;
};

export const uploadPhoto = async (
  id: string,
  localUri: string,
  { questId, authToken }: UploadOptions
): Promise<{ url: string }> => {
  const endpoint = ensureEndpoint();

  const formData = new FormData();
  formData.append('file', {
    uri: localUri,
    name: `${id}.jpg`,
    type: 'image/jpeg',
  } as unknown as Blob);
  formData.append('questId', questId);

  const headers: Record<string, string> = {};
  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    body: formData,
    headers,
  });

  if (!response.ok) {
    throw new Error(`업로드 실패 (status ${response.status})`);
  }

  const json = (await response.json()) as { url?: string };
  if (!json.url) {
    throw new Error('서버 응답에 URL이 없습니다');
  }

  return { url: json.url };
};

export const uploadPhotos = async (
  items: { id: string; localUri: string }[],
  options: UploadOptions
): Promise<UploadResult[]> => {
  const results: UploadResult[] = [];
  for (const { id, localUri } of items) {
    try {
      const { url } = await uploadPhoto(id, localUri, options);
      results.push({ id, url });
    } catch (error) {
      const message = error instanceof Error ? error.message : '업로드 실패';
      results.push({ id, error: message });
    }
  }
  return results;
};
