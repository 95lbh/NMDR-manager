'use client';

import { useEffect, useState } from 'react';

interface PWAStatus {
  isHTTPS: boolean;
  hasServiceWorker: boolean;
  hasManifest: boolean;
  hasIcons: boolean;
  isInstallable: boolean;
  isInstalled: boolean;
  browserSupport: string;
}

export default function PWADebugger() {
  const [status, setStatus] = useState<PWAStatus | null>(null);
  const [showDebugger, setShowDebugger] = useState(false);

  useEffect(() => {
    const checkPWAStatus = async () => {
      const isHTTPS = location.protocol === 'https:' || location.hostname === 'localhost';
      
      const hasServiceWorker = 'serviceWorker' in navigator;
      
      let hasManifest = false;
      try {
        const response = await fetch('/manifest.json');
        hasManifest = response.ok;
      } catch (error) {
        console.error('Manifest check failed:', error);
      }
      
      let hasIcons = false;
      try {
        const response = await fetch('/icons/icon-192x192.png');
        hasIcons = response.ok;
      } catch (error) {
        console.error('Icon check failed:', error);
      }
      
      const isInstalled = window.matchMedia('(display-mode: standalone)').matches ||
                         (window.navigator as any).standalone === true;
      
      const userAgent = navigator.userAgent.toLowerCase();
      let browserSupport = 'Unknown';
      if (userAgent.includes('chrome') && !userAgent.includes('edg')) {
        browserSupport = 'Chrome (Full Support)';
      } else if (userAgent.includes('safari') && !userAgent.includes('chrome')) {
        browserSupport = 'Safari (Limited Support)';
      } else if (userAgent.includes('edg')) {
        browserSupport = 'Edge (Full Support)';
      } else if (userAgent.includes('firefox')) {
        browserSupport = 'Firefox (Limited Support)';
      }
      
      const isInstallable = isHTTPS && hasServiceWorker && hasManifest && hasIcons && !isInstalled;
      
      setStatus({
        isHTTPS,
        hasServiceWorker,
        hasManifest,
        hasIcons,
        isInstallable,
        isInstalled,
        browserSupport
      });
    };

    checkPWAStatus();
  }, []);

  // 개발 환경에서만 표시
  if (process.env.NODE_ENV !== 'development') return null;

  if (!showDebugger) {
    return (
      <button
        onClick={() => setShowDebugger(true)}
        className="fixed top-4 right-4 z-50 bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
      >
        PWA 디버그
      </button>
    );
  }

  return (
    <div className="fixed top-4 right-4 z-50 bg-white border border-gray-300 rounded-lg shadow-lg p-4 max-w-sm">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-semibold text-gray-900">PWA 상태</h3>
        <button
          onClick={() => setShowDebugger(false)}
          className="text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>
      
      {status && (
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>HTTPS:</span>
            <span className={status.isHTTPS ? 'text-green-600' : 'text-red-600'}>
              {status.isHTTPS ? '✓' : '✗'}
            </span>
          </div>
          
          <div className="flex justify-between">
            <span>Service Worker:</span>
            <span className={status.hasServiceWorker ? 'text-green-600' : 'text-red-600'}>
              {status.hasServiceWorker ? '✓' : '✗'}
            </span>
          </div>
          
          <div className="flex justify-between">
            <span>Manifest:</span>
            <span className={status.hasManifest ? 'text-green-600' : 'text-red-600'}>
              {status.hasManifest ? '✓' : '✗'}
            </span>
          </div>
          
          <div className="flex justify-between">
            <span>Icons:</span>
            <span className={status.hasIcons ? 'text-green-600' : 'text-red-600'}>
              {status.hasIcons ? '✓' : '✗'}
            </span>
          </div>
          
          <div className="flex justify-between">
            <span>설치됨:</span>
            <span className={status.isInstalled ? 'text-green-600' : 'text-gray-600'}>
              {status.isInstalled ? '✓' : '✗'}
            </span>
          </div>
          
          <div className="flex justify-between">
            <span>설치 가능:</span>
            <span className={status.isInstallable ? 'text-green-600' : 'text-red-600'}>
              {status.isInstallable ? '✓' : '✗'}
            </span>
          </div>
          
          <div className="pt-2 border-t border-gray-200">
            <div className="text-xs text-gray-600">
              브라우저: {status.browserSupport}
            </div>
          </div>
          
          {!status.isInstallable && !status.isInstalled && (
            <div className="pt-2 border-t border-gray-200">
              <div className="text-xs text-red-600">
                설치 불가 이유:
                {!status.isHTTPS && <div>• HTTPS 필요</div>}
                {!status.hasServiceWorker && <div>• Service Worker 미지원</div>}
                {!status.hasManifest && <div>• Manifest 파일 없음</div>}
                {!status.hasIcons && <div>• 아이콘 파일 없음</div>}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
