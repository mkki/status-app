import { computeResizeTarget, MAX_DIMENSION } from '../imageProcessing';

describe('computeResizeTarget', () => {
  it('이미지가 최대치 이내면 빈 객체 반환', () => {
    expect(computeResizeTarget(800, 600, MAX_DIMENSION)).toEqual({});
    expect(
      computeResizeTarget(MAX_DIMENSION, MAX_DIMENSION, MAX_DIMENSION)
    ).toEqual({});
  });

  it('가로가 더 큰 이미지는 width를 최대치로 제한', () => {
    expect(computeResizeTarget(4000, 3000, 1600)).toEqual({ width: 1600 });
  });

  it('세로가 더 큰 이미지는 height를 최대치로 제한', () => {
    expect(computeResizeTarget(3000, 4000, 1600)).toEqual({ height: 1600 });
  });

  it('정사각형이 최대치 초과 시 width로 제한 (width >= height 동률 처리)', () => {
    expect(computeResizeTarget(2000, 2000, 1600)).toEqual({ width: 1600 });
  });

  it('한쪽 변이 정확히 최대치이면서 초과 안 하면 빈 객체 반환', () => {
    expect(computeResizeTarget(1600, 900, 1600)).toEqual({});
    expect(computeResizeTarget(900, 1600, 1600)).toEqual({});
  });

  it('썸네일 크기(400) 타겟에서도 동일한 분기 동작', () => {
    expect(computeResizeTarget(4000, 3000, 400)).toEqual({ width: 400 });
    expect(computeResizeTarget(300, 200, 400)).toEqual({});
  });
});
