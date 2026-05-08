# CLAUDE.md

이 파일은 Claude Code(claude.ai/code)가 이 저장소에서 작업할 때 참고하는 가이드입니다.

## 주요 명령어

```bash
# 개발 서버 실행
npx expo start          # 개발 서버 시작
npx expo run:ios        # iOS 시뮬레이터 실행
npx expo run:android    # Android 에뮬레이터 실행
npx expo start --web    # 웹 브라우저 실행

# 코드 품질
npm test                # Jest 테스트 실행
npm run lint            # expo lint (ESLint)

# 단일 테스트 파일 실행
npx jest features/image-upload/__tests__/someTest.ts
```

## 아키텍처

React Native(Expo) 앱으로, **WebView 셸 안에 웹 프론트엔드를 감싸는 구조**다. 기기 기능(카메라 롤, 이미지 처리, 권한 등)은 네이티브 레이어에서 처리하고, 주요 UI는 WebView 안의 웹 앱에서 렌더링된다.

**통신 패턴**: `app/index.tsx`가 WebView를 호스팅한다. 네이티브와 웹 레이어는 `constants/webview.ts`에 정의된 `MESSAGE_TYPES`를 통해 메시지를 주고받는다. 웹 앱이 사진 업로드를 요청하면 네이티브 레이어가 `onMessage`로 이를 인터셉트해 image-upload 기능을 실행하고, 결과를 다시 WebView로 전달한다.

**피처 모듈 구조**: `features/image-upload/`가 피처 모듈의 기준 패턴이다. 컴포넌트, 훅, 스토리지, 업로더, 타입, 테스트를 하나의 디렉토리에 모으고 `index.ts`로 배럴 익스포트한다. 새 기능 추가 시 이 패턴을 따른다.

**상태 관리**: `features/image-upload/photoStore.ts`의 경량 커스텀 스토어를 사용한다. Redux나 Zustand를 도입하지 않고 이 패턴을 유지한다.

**New Architecture**: `app.config.ts`에서 `newArchEnabled: true`로 설정되어 있다. Fabric 렌더러와 JSI 브리지를 사용하므로, New Architecture와 호환되지 않는 네이티브 모듈은 사용하지 않는다.

## 주요 파일

| 파일 | 역할 |
|------|------|
| `app/index.tsx` | 루트 화면: WebView + 이미지 업로드 오버레이 |
| `app/_layout.tsx` | 내비게이션 스택 루트 |
| `constants/webview.ts` | WebView URL 설정 및 `MESSAGE_TYPES` 열거형 |
| `constants/upload.ts` | 업로드 제한 및 설정값 |
| `features/image-upload/` | 이미지 피커, 훅, 스토리지, 업로드 로직 |
| `types/photo.ts` | 공통 사진/에셋 타입 정의 |
| `app.config.ts` | Expo 설정 (번들 ID, 플러그인, 권한 등) |
| `plugins/` | 네이티브 프로젝트를 수정하는 Expo 설정 플러그인 |

## TypeScript

경로 별칭 `@/*`가 프로젝트 루트를 가리킨다. 디렉토리 간 임포트 시 상대 경로 대신 `@/features/...`, `@/constants/...` 형태를 사용한다.
