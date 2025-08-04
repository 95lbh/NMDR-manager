'use client';

import { usePathname } from 'next/navigation';
import Navigation from './Navigation';
import PWAInstaller from './PWAInstaller';
import OfflineIndicator from './OfflineIndicator';
import PWADebugger from './PWADebugger';

interface ConditionalLayoutProps {
  children: React.ReactNode;
}

export default function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname();
  
  // /checkin 경로에서는 완전히 독립적인 레이아웃 사용
  const isStandalonePage = pathname === '/checkin';

  if (isStandalonePage) {
    return (
      <div className="min-h-screen">
        {/* 셀프 출석체크 페이지는 완전히 독립적 - 네비게이션 및 기타 컴포넌트 제거 */}
        {children}
      </div>
    );
  }

  // 일반 관리자 페이지들은 기존 레이아웃 사용
  return (
    <div className="min-h-screen">
      <OfflineIndicator />
      <Navigation />
      <main className="container mx-auto px-4 py-6">
        {children}
      </main>
      <PWAInstaller />
      <PWADebugger />
    </div>
  );
}
