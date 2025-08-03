# PWA (Progressive Web App) 설정 가이드

이 프로젝트는 PWA 기능을 지원하여 사용자가 웹앱을 모바일 기기의 홈 화면에 설치하고 네이티브 앱처럼 사용할 수 있습니다.

## 🚀 PWA 기능

### ✅ 구현된 기능
- **앱 설치**: 홈 화면에 추가 가능
- **오프라인 지원**: Service Worker를 통한 캐싱
- **반응형 디자인**: 모든 기기에서 최적화된 경험
- **네이티브 앱 느낌**: 스탠드얼론 모드 지원
- **빠른 로딩**: 캐시된 리소스로 빠른 앱 시작
- **오프라인 알림**: 네트워크 상태 표시
- **앱 바로가기**: 주요 기능에 빠른 접근

### 📱 지원 플랫폼
- **Android**: Chrome, Samsung Internet, Firefox
- **iOS**: Safari (iOS 11.3+)
- **Desktop**: Chrome, Edge, Firefox

## 🛠️ 설치 방법

### Android (Chrome)
1. 웹사이트 방문
2. 주소창 옆의 "설치" 버튼 클릭
3. 또는 메뉴 → "홈 화면에 추가" 선택

### iOS (Safari)
1. Safari에서 웹사이트 방문
2. 공유 버튼(↗️) 탭
3. "홈 화면에 추가" 선택
4. "추가" 버튼 탭

### Desktop (Chrome/Edge)
1. 주소창 오른쪽의 설치 아이콘 클릭
2. 또는 메뉴 → "앱 설치" 선택

## 🔧 개발자 설정

### 아이콘 생성
```bash
# Sharp 패키지 설치 (아이콘 생성용)
npm install sharp --save-dev

# PWA 아이콘 생성
npm run generate-icons

# PWA 포함 빌드
npm run build:pwa
```

### 파일 구조
```
public/
├── manifest.json          # 웹 앱 매니페스트
├── sw.js                 # Service Worker
├── favicon.ico           # 파비콘
└── icons/                # PWA 아이콘들
    ├── icon.svg          # 원본 SVG 아이콘
    ├── icon-72x72.png
    ├── icon-96x96.png
    ├── icon-128x128.png
    ├── icon-144x144.png
    ├── icon-152x152.png
    ├── icon-192x192.png
    ├── icon-384x384.png
    └── icon-512x512.png

src/
├── components/
│   ├── PWAInstaller.tsx   # PWA 설치 프롬프트
│   └── OfflineIndicator.tsx # 오프라인 상태 표시
└── utils/
    └── pwa.ts            # PWA 유틸리티 함수
```

## 📋 체크리스트

### 배포 전 확인사항
- [ ] HTTPS 환경에서 테스트
- [ ] 모든 아이콘 파일 생성 확인
- [ ] Service Worker 정상 동작 확인
- [ ] 오프라인 모드 테스트
- [ ] 다양한 기기에서 설치 테스트
- [ ] 매니페스트 파일 유효성 검사

### 테스트 방법
1. **Chrome DevTools**
   - Application 탭 → Manifest 확인
   - Application 탭 → Service Workers 확인
   - Lighthouse → PWA 점수 확인

2. **실제 기기 테스트**
   - 모바일에서 설치 프롬프트 확인
   - 오프라인 상태에서 앱 동작 확인
   - 홈 화면 아이콘 표시 확인

## 🔍 문제 해결

### 일반적인 문제
1. **설치 버튼이 나타나지 않음**
   - HTTPS 환경인지 확인
   - 매니페스트 파일 경로 확인
   - Service Worker 등록 확인

2. **아이콘이 표시되지 않음**
   - 아이콘 파일 경로 확인
   - 아이콘 크기 및 형식 확인
   - 캐시 클리어 후 재시도

3. **오프라인에서 동작하지 않음**
   - Service Worker 등록 상태 확인
   - 캐시 전략 검토
   - 네트워크 탭에서 요청 확인

### 디버깅 도구
- Chrome DevTools → Application 탭
- Lighthouse PWA 감사
- PWA Builder (Microsoft)

## 📚 추가 자료

- [PWA 가이드](https://web.dev/progressive-web-apps/)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Web App Manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest)
- [PWA 체크리스트](https://web.dev/pwa-checklist/)

## 🎯 향후 개선사항

- [ ] 푸시 알림 기능
- [ ] 백그라운드 동기화
- [ ] 더 정교한 캐싱 전략
- [ ] 앱 업데이트 알림
- [ ] 사용자 참여도 분석
