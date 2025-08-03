// 날짜 관련 유틸리티 함수들

/**
 * 오늘 날짜인지 확인하는 함수
 */
export const isToday = (date: Date): boolean => {
  const today = new Date();
  return date.getDate() === today.getDate() &&
         date.getMonth() === today.getMonth() &&
         date.getFullYear() === today.getFullYear();
};

/**
 * 오늘 날짜의 시작 시간 (00:00:00)을 반환
 */
export const getTodayStart = (): Date => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

/**
 * 오늘 날짜의 끝 시간 (23:59:59.999)을 반환
 */
export const getTodayEnd = (): Date => {
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  return today;
};

/**
 * 내일 날짜의 시작 시간 (00:00:00)을 반환
 */
export const getTomorrowStart = (): Date => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  return tomorrow;
};

/**
 * 날짜가 같은 날인지 확인하는 함수
 */
export const isSameDay = (date1: Date, date2: Date): boolean => {
  return date1.getDate() === date2.getDate() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getFullYear() === date2.getFullYear();
};

/**
 * 날짜를 YYYY-MM-DD 형식의 문자열로 변환
 */
export const formatDateToString = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

/**
 * 개발 환경에서 날짜 변경 시뮬레이션을 위한 함수
 * 실제 운영 환경에서는 사용하지 않음
 */
export const simulateDateChange = () => {
  if (process.env.NODE_ENV === 'development') {
    console.log('🗓️ 날짜 변경 시뮬레이션');
    console.log('- 출석 데이터: 오늘 날짜 기준으로 필터링됨');
    console.log('- 셔틀콕 데이터: 출석 데이터와 함께 자동 초기화됨');
    console.log('- 진행 중인 게임: 오늘 생성된 게임만 표시됨');
    console.log('- 완료된 게임: 날짜별로 저장되어 통계에 반영됨');
    
    // 실제 데이터 새로고침을 위해 페이지 리로드 권장
    console.log('💡 실제 확인을 위해서는 브라우저를 새로고침하거나 앱을 재시작하세요.');
  }
};

/**
 * 자정(00:00)에 자동으로 데이터를 새로고침하는 함수
 * 실제 운영 환경에서 사용할 수 있음
 */
export const scheduleDataRefreshAtMidnight = (refreshCallback: () => void) => {
  const now = new Date();
  const tomorrow = getTomorrowStart();
  const msUntilMidnight = tomorrow.getTime() - now.getTime();
  
  console.log(`⏰ ${msUntilMidnight / 1000 / 60 / 60}시간 후 자정에 데이터가 자동 새로고침됩니다.`);
  
  setTimeout(() => {
    console.log('🌅 자정이 되었습니다. 데이터를 새로고침합니다.');
    refreshCallback();
    
    // 다음 날 자정을 위해 다시 스케줄링
    scheduleDataRefreshAtMidnight(refreshCallback);
  }, msUntilMidnight);
};
