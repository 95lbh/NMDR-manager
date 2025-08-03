# 🏸 배드민턴 매니저

배드민턴 운동을 위한 스마트 관리 시스템입니다. 회원 관리, 출석 체크, 코트 현황 모니터링, 게임 관리 등의 기능을 제공합니다.

## ✨ 주요 기능

### 📊 대시보드
- 실시간 코트 현황 모니터링
- 오늘 출석자 현황
- 게임 진행 상황 한눈에 보기
- 셔틀콕 제출 현황

### 👥 회원 관리
- 회원 등록, 수정, 삭제
- 이름, 나이, 성별, 실력 수준 관리
- 연락처 및 이메일 정보 관리
- 회원 검색 기능

### ✅ 출석 체크
- 회원 데이터베이스 기반 출석 체크
- 커스텀 이름으로 직접 출석 등록
- 셔틀콕 제출 여부 확인
- 실시간 출석자 현황

### 🏟️ 코트 관리
- 코트 수 및 배치 설정
- 코트별 게임 상태 모니터링
- 게임 예약 시스템
- 자동 매칭 기능

### 📈 통계
- 주간/월간 출석 현황
- 실력별 회원 분포
- 활발한 플레이어 순위
- 게임 통계

### ⚙️ 설정
- 코트 수 및 배치 설정
- 게임 기본 시간 설정
- 자동 매칭 활성화/비활성화

## 🛠️ 기술 스택

- **Frontend**: Next.js 15, React 18, TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Firebase Firestore
- **Authentication**: Firebase Auth
- **Icons**: Heroicons
- **Charts**: Chart.js with react-chartjs-2
- **State Management**: React Context API

## 🛠️ 기술 스택

- **Frontend**: Next.js 15, React 18, TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Heroicons
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth
- **Deployment**: Vercel

## 🚀 시작하기

### 필수 요구사항
- Node.js 18.0 이상
- npm 또는 yarn

### 설치 및 실행

1. 저장소 클론
```bash
git clone https://github.com/95lbh/badminton-manager.git
cd badminton-manager
```

2. 의존성 설치
```bash
npm install
```

3. 환경 변수 설정
`.env.local.example` 파일을 참고하여 `.env.local` 파일을 생성하고 Firebase 설정을 입력하세요.

```bash
cp .env.local.example .env.local
```

4. 개발 서버 실행
```bash
npm run dev
```

5. 브라우저에서 [http://localhost:3000](http://localhost:3000) 접속

### Firebase 설정

1. [Firebase Console](https://console.firebase.google.com/)에서 새 프로젝트 생성
2. Firestore Database 활성화
3. Authentication 설정 (선택사항)
4. 프로젝트 설정에서 웹 앱 추가
5. 설정 정보를 `.env.local` 파일에 입력

## 📱 반응형 디자인

모바일, 태블릿, 데스크톱 모든 기기에서 최적화된 사용자 경험을 제공합니다.

- **모바일**: 터치 친화적 인터페이스, 간소화된 네비게이션
- **태블릿**: 적응형 레이아웃, 터치 및 마우스 지원
- **데스크톱**: 풀 기능 인터페이스, 키보드 단축키 지원

## 🎨 UI/UX 특징

- **직관적인 인터페이스**: 사용하기 쉬운 깔끔한 디자인
- **트렌디한 스타일**: 모던한 색상과 타이포그래피
- **부드러운 애니메이션**: 자연스러운 전환 효과
- **접근성**: 키보드 네비게이션 및 스크린 리더 지원

## 📦 빌드 및 배포

### 로컬 빌드
```bash
npm run build
npm start
```

### Vercel 배포
1. [Vercel](https://vercel.com)에 계정 생성
2. GitHub 저장소 연결
3. 환경 변수 설정
4. 자동 배포 완료

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 `LICENSE` 파일을 참조하세요.

## 📞 문의

프로젝트에 대한 문의사항이나 제안사항이 있으시면 언제든지 연락해 주세요.

- GitHub: [@95lbh](https://github.com/95lbh)
- 프로젝트 링크: [https://github.com/95lbh/badminton-manager](https://github.com/95lbh/badminton-manager)
