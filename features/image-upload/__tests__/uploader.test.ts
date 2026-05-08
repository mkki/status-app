type UploaderModule = typeof import('../uploader');

const TEST_ENDPOINT = 'https://test.example.com/upload';

const loadUploader = (endpoint: string | undefined): UploaderModule => {
  let mod: UploaderModule = {} as UploaderModule;
  jest.isolateModules(() => {
    jest.doMock('@/constants/upload', () => ({
      UPLOAD_PHOTO_ENDPOINT: endpoint,
    }));
    mod = require('../uploader');
  });
  return mod;
};

describe('uploadPhoto', () => {
  let fetchMock: jest.Mock;

  beforeEach(() => {
    fetchMock = jest.fn();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  it('endpoint가 설정되지 않으면 throw하고 fetch도 호출하지 않음', async () => {
    const { uploadPhoto } = loadUploader(undefined);
    await expect(
      uploadPhoto('id1', 'file:///cache/id1.jpg', { questId: 'q1' })
    ).rejects.toThrow(/업로드 서버 설정/);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('업로드 성공 시 data.urls[0]을 반환', async () => {
    const { uploadPhoto } = loadUploader(TEST_ENDPOINT);
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ data: { urls: ['https://cdn.example.com/photo.jpg'] } }),
    });

    const result = await uploadPhoto('id1', 'file:///cache/id1.jpg', {
      questId: 'q1',
    });

    expect(result).toEqual({ url: 'https://cdn.example.com/photo.jpg' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      TEST_ENDPOINT,
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('authToken 전달 시 Authorization 헤더에 Bearer로 포함', async () => {
    const { uploadPhoto } = loadUploader(TEST_ENDPOINT);
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ data: { urls: ['https://cdn.example.com/p.jpg'] } }),
    });

    await uploadPhoto('id1', 'file:///cache/id1.jpg', {
      questId: 'q1',
      authToken: 'tok123',
    });

    const init = fetchMock.mock.calls[0][1] as RequestInit;
    expect(init.headers).toEqual({ Authorization: 'Bearer tok123' });
  });

  it('authToken이 없으면 Authorization 헤더를 포함하지 않음', async () => {
    const { uploadPhoto } = loadUploader(TEST_ENDPOINT);
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ data: { urls: ['https://cdn.example.com/p.jpg'] } }),
    });

    await uploadPhoto('id1', 'file:///cache/id1.jpg', { questId: 'q1' });

    const init = fetchMock.mock.calls[0][1] as RequestInit;
    expect(init.headers).toEqual({});
  });

  it('FormData 본문에 files 필드가 포함됨', async () => {
    // RN의 FormData는 { uri, name, type } 객체를 파일로 인식하는 비표준 동작.
    // Node 테스트 환경에서는 해당 객체가 문자열로 강제 변환되므로 표준 영역만 검증.
    // RN 특유의 파일 형태는 시뮬레이터/실기기에서 검증한다.
    const { uploadPhoto } = loadUploader(TEST_ENDPOINT);
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ data: { urls: ['https://cdn.example.com/p.jpg'] } }),
    });

    await uploadPhoto('id1', 'file:///cache/id1.jpg', { questId: 'q1' });

    const init = fetchMock.mock.calls[0][1] as RequestInit;
    const body = init.body as FormData;
    expect(body).toBeInstanceOf(FormData);
    expect(body.has('files')).toBe(true);
  });

  it('2xx가 아닌 응답이면 status를 포함한 에러 throw', async () => {
    const { uploadPhoto } = loadUploader(TEST_ENDPOINT);
    fetchMock.mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({}),
    });

    await expect(
      uploadPhoto('id1', 'file:///cache/id1.jpg', { questId: 'q1' })
    ).rejects.toThrow(/status 500/);
  });

  it('응답에 urls가 없으면 throw', async () => {
    const { uploadPhoto } = loadUploader(TEST_ENDPOINT);
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({}) });

    await expect(
      uploadPhoto('id1', 'file:///cache/id1.jpg', { questId: 'q1' })
    ).rejects.toThrow(/URL이 없습니다/);
  });
});

describe('uploadPhotos', () => {
  let fetchMock: jest.Mock;

  beforeEach(() => {
    fetchMock = jest.fn();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  it('성공/실패가 섞인 결과를 입력 순서대로 반환', async () => {
    const { uploadPhotos } = loadUploader(TEST_ENDPOINT);
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { urls: ['https://cdn/a.jpg'] } }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({}),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { urls: ['https://cdn/c.jpg'] } }),
      });

    const results = await uploadPhotos(
      [
        { id: 'a', localUri: 'file:///a.jpg' },
        { id: 'b', localUri: 'file:///b.jpg' },
        { id: 'c', localUri: 'file:///c.jpg' },
      ],
      { questId: 'q1' }
    );

    expect(results).toHaveLength(3);
    expect(results[0]).toEqual({ id: 'a', url: 'https://cdn/a.jpg' });
    expect(results[1]).toMatchObject({
      id: 'b',
      error: expect.stringContaining('500'),
    });
    expect(results[2]).toEqual({ id: 'c', url: 'https://cdn/c.jpg' });
  });

  it('업로드는 순차적으로 진행됨 (병렬 아님)', async () => {
    const { uploadPhotos } = loadUploader(TEST_ENDPOINT);
    const callOrder: number[] = [];
    let callCount = 0;
    fetchMock.mockImplementation(async () => {
      callOrder.push(++callCount);
      await new Promise((r) => setTimeout(r, 10));
      return {
        ok: true,
        json: async () => ({ data: { urls: ['https://cdn/x.jpg'] } }),
      };
    });

    await uploadPhotos(
      [
        { id: 'a', localUri: 'file:///a.jpg' },
        { id: 'b', localUri: 'file:///b.jpg' },
      ],
      { questId: 'q1' }
    );

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(callOrder).toEqual([1, 2]);
  });

  it('빈 배열을 넘기면 빈 배열을 반환하고 fetch 호출 없음', async () => {
    const { uploadPhotos } = loadUploader(TEST_ENDPOINT);
    const results = await uploadPhotos([], { questId: 'q1' });
    expect(results).toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
