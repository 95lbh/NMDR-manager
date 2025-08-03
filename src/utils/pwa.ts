// PWA 관련 유틸리티 함수들

/**
 * PWA가 설치되어 있는지 확인
 */
export const isPWAInstalled = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  // 스탠드얼론 모드에서 실행 중인지 확인
  return window.matchMedia('(display-mode: standalone)').matches ||
         (window.navigator as Navigator & { standalone?: boolean }).standalone === true ||
         document.referrer.includes('android-app://');
};

/**
 * PWA 설치 가능한지 확인
 */
export const isPWAInstallable = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  // 이미 설치되어 있으면 설치 불가
  if (isPWAInstalled()) return false;
  
  // Service Worker 지원 확인
  return 'serviceWorker' in navigator;
};

/**
 * 브라우저가 PWA를 지원하는지 확인
 */
export const isPWASupported = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  return 'serviceWorker' in navigator && 'PushManager' in window;
};

/**
 * 현재 플랫폼 감지
 */
export const getPlatform = (): 'ios' | 'android' | 'desktop' => {
  if (typeof window === 'undefined') return 'desktop';
  
  const userAgent = window.navigator.userAgent.toLowerCase();
  
  if (/iphone|ipad|ipod/.test(userAgent)) {
    return 'ios';
  } else if (/android/.test(userAgent)) {
    return 'android';
  } else {
    return 'desktop';
  }
};

/**
 * iOS Safari에서 PWA 설치 안내 메시지
 */
export const getIOSInstallMessage = (): string => {
  return '이 앱을 홈 화면에 추가하려면:\n1. 공유 버튼(↗️)을 탭하세요\n2. "홈 화면에 추가"를 선택하세요';
};

/**
 * Service Worker 등록
 */
export const registerServiceWorker = async (): Promise<ServiceWorkerRegistration | null> => {
  if (!('serviceWorker' in navigator)) {
    console.log('Service Worker를 지원하지 않는 브라우저입니다.');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });

    console.log('Service Worker 등록 성공:', registration);

    // 업데이트 확인
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // 새 버전이 설치됨
            console.log('새 버전이 설치되었습니다. 페이지를 새로고침하세요.');
          }
        });
      }
    });

    return registration;
  } catch (error) {
    console.error('Service Worker 등록 실패:', error);
    return null;
  }
};

/**
 * Service Worker 업데이트 확인
 */
export const checkForSWUpdate = async (): Promise<boolean> => {
  if (!('serviceWorker' in navigator)) return false;

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      await registration.update();
      return true;
    }
  } catch (error) {
    console.error('Service Worker 업데이트 확인 실패:', error);
  }
  
  return false;
};

/**
 * 오프라인 상태 확인
 */
export const isOnline = (): boolean => {
  if (typeof window === 'undefined') return true;
  return navigator.onLine;
};

/**
 * 네트워크 상태 변경 이벤트 리스너 등록
 */
export const addNetworkStatusListener = (
  onOnline: () => void,
  onOffline: () => void
): (() => void) => {
  if (typeof window === 'undefined') return () => {};

  window.addEventListener('online', onOnline);
  window.addEventListener('offline', onOffline);

  // 클린업 함수 반환
  return () => {
    window.removeEventListener('online', onOnline);
    window.removeEventListener('offline', onOffline);
  };
};
