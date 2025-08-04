'use client';

import { useEffect, useState } from 'react';

export default function OrientationGuide() {
  const [isPortrait, setIsPortrait] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    const checkOrientation = () => {
      if (typeof window !== 'undefined') {
        const isPortraitMode = window.innerHeight > window.innerWidth;
        const isMobile = window.innerWidth <= 768;
        
        setIsPortrait(isPortraitMode && isMobile);
        setShowGuide(isPortraitMode && isMobile);
      }
    };

    // 초기 체크
    checkOrientation();

    // 화면 회전 감지
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', () => {
      // orientationchange 이벤트는 약간의 지연이 있을 수 있음
      setTimeout(checkOrientation, 100);
    });

    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  if (!showGuide) return null;

  return (
    <>
      {/* 오버레이 */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-[9999] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center">
          {/* 회전 애니메이션 아이콘 */}
          <div className="mb-4 flex justify-center">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-blue-200 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📱</span>
              </div>
              <div className="absolute -top-2 -right-2 bg-blue-500 rounded-full p-1 animate-bounce">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
            </div>
          </div>

          {/* 메시지 */}
          <h3 className="text-lg font-bold text-gray-900 mb-2">
            더 나은 경험을 위해
          </h3>
          <p className="text-gray-600 mb-4">
            기기를 <span className="font-semibold text-blue-600">가로로 회전</span>해주세요
          </p>
          <p className="text-sm text-gray-500 mb-6">
            배드민턴 매니저는 가로모드에 최적화되어 있습니다
          </p>

          {/* 버튼들 */}
          <div className="space-y-3">
            <button
              onClick={() => setShowGuide(false)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
            >
              확인했습니다
            </button>
            <button
              onClick={() => setShowGuide(false)}
              className="w-full text-gray-500 hover:text-gray-700 text-sm transition-colors"
            >
              다시 보지 않기
            </button>
          </div>
        </div>
      </div>

      {/* 상단 알림 바 (모달을 닫은 후에도 표시) */}
      {isPortrait && !showGuide && (
        <div className="fixed top-0 left-0 right-0 bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-center py-2 px-4 z-50 shadow-lg">
          <div className="flex items-center justify-center space-x-2 text-sm">
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>가로모드로 회전하면 더 편리하게 이용할 수 있습니다</span>
          </div>
        </div>
      )}
    </>
  );
}
