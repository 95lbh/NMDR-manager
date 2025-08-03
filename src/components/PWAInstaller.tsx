'use client';

import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export default function PWAInstaller() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallButton, setShowInstallButton] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);

  const addDebugInfo = (info: string) => {
    console.log('PWA Debug:', info);
    setDebugInfo(prev => [...prev.slice(-4), info]); // 최근 5개만 유지
  };

  useEffect(() => {
    // PWA 설치 상태 확인
    const checkInstallStatus = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isInWebAppiOS = (window.navigator as any).standalone === true;
      const isInWebAppChrome = window.matchMedia('(display-mode: standalone)').matches;

      if (isStandalone || isInWebAppiOS || isInWebAppChrome) {
        setIsInstalled(true);
        addDebugInfo('앱이 이미 설치되어 있습니다');
        return true;
      }
      return false;
    };

    // Service Worker 등록
    if ('serviceWorker' in navigator) {
      addDebugInfo('Service Worker 지원됨');
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then((registration) => {
            addDebugInfo('Service Worker 등록 성공');
            console.log('SW registered: ', registration);
          })
          .catch((registrationError) => {
            addDebugInfo('Service Worker 등록 실패');
            console.log('SW registration failed: ', registrationError);
          });
      });
    } else {
      addDebugInfo('Service Worker 지원되지 않음');
    }

    // 설치 상태 확인
    if (checkInstallStatus()) {
      return;
    }

    // PWA 설치 프롬프트 이벤트 리스너
    const handleBeforeInstallPrompt = (e: Event) => {
      addDebugInfo('beforeinstallprompt 이벤트 발생');
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowInstallButton(true);
    };

    // 앱이 설치되었을 때
    const handleAppInstalled = () => {
      addDebugInfo('PWA가 설치되었습니다');
      setShowInstallButton(false);
      setDeferredPrompt(null);
      setIsInstalled(true);
    };

    // 이벤트 리스너 등록
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // 개발 환경에서 강제로 설치 버튼 표시 (테스트용)
    if (process.env.NODE_ENV === 'development') {
      setTimeout(() => {
        if (!deferredPrompt && !isInstalled) {
          addDebugInfo('개발 모드: 강제 설치 버튼 표시');
          setShowInstallButton(true);
        }
      }, 3000);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [deferredPrompt, isInstalled]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      addDebugInfo('설치 프롬프트가 없습니다. 수동 설치 안내를 표시합니다.');
      // 수동 설치 안내
      const userAgent = navigator.userAgent.toLowerCase();
      let message = '';

      if (userAgent.includes('chrome') && !userAgent.includes('edg')) {
        message = 'Chrome: 주소창 오른쪽의 설치 아이콘을 클릭하거나 메뉴 → "앱 설치"를 선택하세요.';
      } else if (userAgent.includes('safari') && !userAgent.includes('chrome')) {
        message = 'Safari: 공유 버튼(↗️) → "홈 화면에 추가"를 선택하세요.';
      } else if (userAgent.includes('edg')) {
        message = 'Edge: 주소창 오른쪽의 설치 아이콘을 클릭하거나 메뉴 → "앱 설치"를 선택하세요.';
      } else {
        message = '브라우저 메뉴에서 "홈 화면에 추가" 또는 "앱 설치" 옵션을 찾아보세요.';
      }

      alert(message);
      return;
    }

    try {
      addDebugInfo('설치 프롬프트 표시 중...');
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === 'accepted') {
        addDebugInfo('사용자가 PWA 설치를 수락했습니다');
      } else {
        addDebugInfo('사용자가 PWA 설치를 거부했습니다');
      }
    } catch (error) {
      addDebugInfo('설치 프롬프트 오류: ' + (error as Error).message);
    }

    setDeferredPrompt(null);
    setShowInstallButton(false);
  };

  // 이미 설치된 경우 표시하지 않음
  if (isInstalled) return null;

  // 설치 버튼을 표시하지 않는 경우에도 개발 모드에서는 디버그 정보 표시
  if (!showInstallButton && process.env.NODE_ENV === 'development') {
    return (
      <div className="fixed bottom-4 left-4 z-50 max-w-xs">
        <div className="bg-gray-800 text-white p-3 rounded-lg shadow-lg text-xs">
          <div className="font-semibold mb-2">PWA 디버그 정보:</div>
          {debugInfo.map((info, index) => (
            <div key={index} className="mb-1">{info}</div>
          ))}
        </div>
      </div>
    );
  }

  if (!showInstallButton) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-green-600 text-white p-4 rounded-lg shadow-lg max-w-sm">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">앱 설치</p>
            <p className="text-xs text-green-100">홈 화면에 추가하여 더 빠르게 접근하세요</p>
          </div>
        </div>
        <div className="mt-3 flex space-x-2">
          <button
            onClick={handleInstallClick}
            className="bg-white text-green-600 px-3 py-1 rounded text-sm font-medium hover:bg-green-50 transition-colors"
          >
            설치
          </button>
          <button
            onClick={() => setShowInstallButton(false)}
            className="bg-green-700 text-white px-3 py-1 rounded text-sm font-medium hover:bg-green-800 transition-colors"
          >
            나중에
          </button>
        </div>
      </div>
    </div>
  );
}
