import { photoStore } from '../photoStore';

describe('photoStore', () => {
  beforeEach(() => {
    photoStore.clear();
  });

  it('등록되지 않은 id 조회 시 undefined 반환', () => {
    expect(photoStore.get('missing')).toBeUndefined();
  });

  it('register 후 get으로 localUri를 가져올 수 있음', () => {
    photoStore.register('a', 'file:///cache/a.jpg');
    expect(photoStore.get('a')).toBe('file:///cache/a.jpg');
  });

  it('동일 id로 register 시 기존 항목을 덮어씀', () => {
    photoStore.register('a', 'file:///old.jpg');
    photoStore.register('a', 'file:///new.jpg');
    expect(photoStore.get('a')).toBe('file:///new.jpg');
  });

  it('remove는 해당 id만 제거하고 다른 항목은 유지', () => {
    photoStore.register('a', 'file:///a.jpg');
    photoStore.register('b', 'file:///b.jpg');
    photoStore.remove('a');
    expect(photoStore.get('a')).toBeUndefined();
    expect(photoStore.get('b')).toBe('file:///b.jpg');
  });

  it('존재하지 않는 id를 remove해도 예외 없이 동작', () => {
    expect(() => photoStore.remove('missing')).not.toThrow();
  });

  it('clear는 모든 항목을 제거', () => {
    photoStore.register('a', 'file:///a.jpg');
    photoStore.register('b', 'file:///b.jpg');
    photoStore.clear();
    expect(photoStore.get('a')).toBeUndefined();
    expect(photoStore.get('b')).toBeUndefined();
  });
});
