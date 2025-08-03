'use client';

import { useEffect, useState } from 'react';
import { isOnline, addNetworkStatusListener } from '@/utils/pwa';

export default function OfflineIndicator() {
  const [online, setOnline] = useState(true);
  const [showIndicator, setShowIndicator] = useState(false);

  useEffect(() => {
    // 초기 상태 설정
    setOnline(isOnline());

    // 네트워크 상태 변경 리스너 등록
    const cleanup = addNetworkStatusListener(
      () => {
        setOnline(true);
        // 온라인 복구 시 잠시 표시 후 숨김
        setShowIndicator(true);
        setTimeout(() => setShowIndicator(false), 3000);
      },
      () => {
        setOnline(false);
        setShowIndicator(true);
      }
    );

    return cleanup;
  }, []);

  // 오프라인이 아니고 표시할 필요가 없으면 렌더링하지 않음
  if (online && !showIndicator) return null;

  return (
    <div className={`fixed top-0 left-0 right-0 z-50 transition-transform duration-300 ${
      showIndicator ? 'translate-y-0' : '-translate-y-full'
    }`}>
      <div className={`px-4 py-2 text-center text-sm font-medium ${
        online 
          ? 'bg-green-600 text-white' 
          : 'bg-red-600 text-white'
      }`}>
        {online ? (
          <div className="flex items-center justify-center space-x-2">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>인터넷 연결이 복구되었습니다</span>
          </div>
        ) : (
          <div className="flex items-center justify-center space-x-2">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <span>오프라인 모드 - 일부 기능이 제한될 수 있습니다</span>
          </div>
        )}
      </div>
    </div>
  );
}
