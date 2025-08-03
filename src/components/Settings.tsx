'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Cog6ToothIcon,
  CheckIcon,
  ExclamationTriangleIcon,
  TrashIcon,
  UserGroupIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import { useApp } from '@/contexts/AppContext';

interface CourtPosition {
  row: number;
  col: number;
  isActive: boolean;
  courtNumber?: number;
}

interface SettingsData {
  courtGrid: CourtPosition[][];
}

export default function Settings() {
  const { state, actions } = useApp();
  const router = useRouter();

  const [settings, setSettings] = useState<SettingsData>({
    courtGrid: state.courtSettings.courtGrid
  });

  // AppContext의 설정이 변경되면 로컬 상태 업데이트
  useEffect(() => {
    setSettings({
      courtGrid: state.courtSettings.courtGrid
    });
  }, [state.courtSettings]);

  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [isResetting, setIsResetting] = useState<'members' | 'statistics' | null>(null);

  // 코트 토글 함수
  const toggleCourt = (row: number, col: number) => {
    const newGrid = [...settings.courtGrid];
    const court = newGrid[row][col];

    if (court.isActive) {
      // 비활성화
      court.isActive = false;
      // undefined 대신 null 사용하거나 속성 삭제
      delete court.courtNumber;
    } else {
      // 활성화
      court.isActive = true;
    }

    // 코트 번호 재계산
    let courtNumber = 1;
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 4; c++) {
        if (newGrid[r][c].isActive) {
          newGrid[r][c].courtNumber = courtNumber++;
        } else {
          // 비활성화된 코트는 courtNumber 속성 삭제
          delete newGrid[r][c].courtNumber;
        }
      }
    }

    setSettings({
      ...settings,
      courtGrid: newGrid
    });
  };

  // 활성화된 코트 수 계산
  const getActiveCourtsCount = () => {
    return settings.courtGrid.flat().filter(court => court.isActive).length;
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // AppContext에 설정 업데이트 (Firebase에 자동 저장됨)
      await actions.updateCourtSettings(settings);
      setSaveMessage('설정이 저장되었습니다. 대시보드로 이동합니다...');

      // 1.5초 후 대시보드로 이동
      setTimeout(() => {
        router.push('/');
      }, 1500);
    } catch (error) {
      console.error('설정 저장 실패:', error);
      setSaveMessage(`저장 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
      setTimeout(() => setSaveMessage(''), 5000);
    } finally {
      setIsSaving(false);
    }
  };

  // 회원 목록 초기화
  const handleResetMembers = async () => {
    if (!confirm('정말로 모든 회원 데이터를 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.')) {
      return;
    }

    setIsResetting('members');
    try {
      await actions.resetMemberData();
      setSaveMessage('회원 목록이 초기화되었습니다.');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      console.error('회원 목록 초기화 실패:', error);
      setSaveMessage(`회원 목록 초기화 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
      setTimeout(() => setSaveMessage(''), 5000);
    } finally {
      setIsResetting(null);
    }
  };

  // 통계 초기화
  const handleResetStatistics = async () => {
    if (!confirm('정말로 모든 통계 데이터(출석, 게임 기록)를 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.')) {
      return;
    }

    setIsResetting('statistics');
    try {
      await actions.resetStatisticsData();
      setSaveMessage('통계 데이터가 초기화되었습니다.');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      console.error('통계 초기화 실패:', error);
      setSaveMessage(`통계 초기화 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
      setTimeout(() => setSaveMessage(''), 5000);
    } finally {
      setIsResetting(null);
    }
  };

  const renderCourtGrid = () => {
    return (
      <div className="grid grid-cols-4 gap-2 sm:gap-3 p-3 sm:p-4 bg-gray-50 rounded-lg">
        {settings.courtGrid.map((row, rowIndex) =>
          row.map((court, colIndex) => (
            <button
              key={`${rowIndex}-${colIndex}`}
              onClick={() => toggleCourt(rowIndex, colIndex)}
              className={`
                h-12 sm:h-16 rounded-lg border-2 transition-all duration-200 font-semibold text-xs sm:text-sm
                ${court.isActive
                  ? 'bg-green-500 text-white border-green-600 hover:bg-green-600'
                  : 'bg-gray-200 text-gray-500 border-gray-300 hover:bg-gray-300'
                }
              `}
            >
              {court.isActive ? `코트 ${court.courtNumber}` : '비활성'}
            </button>
          ))
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-0">
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">설정</h1>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2 transition-colors text-sm sm:text-base"
        >
          {isSaving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>저장 중...</span>
            </>
          ) : (
            <>
              <CheckIcon className="h-4 w-4 sm:h-5 sm:w-5" />
              <span>설정 저장</span>
            </>
          )}
        </button>
      </div>

      {/* 저장 메시지 */}
      {saveMessage && (
        <div className={`p-4 rounded-lg ${
          saveMessage.includes('오류') 
            ? 'bg-red-100 text-red-700 border border-red-200' 
            : 'bg-green-100 text-green-700 border border-green-200'
        }`}>
          {saveMessage}
        </div>
      )}

      {/* 코트 설정 */}
      <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <Cog6ToothIcon className="h-5 w-5 sm:h-6 sm:w-6 mr-2" />
          코트 설정
        </h2>

        <div className="space-y-4">
          {/* 활성화된 코트 수 표시 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-blue-800">활성화된 코트</span>
              <span className="text-lg font-bold text-blue-900">{getActiveCourtsCount()}개</span>
            </div>
          </div>

          {/* 코트 그리드 설정 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              코트 배치 설정
            </label>
            <p className="text-xs text-gray-500 mb-3">
              코트를 클릭하여 활성화/비활성화할 수 있습니다. 활성화 된 배치 그대로 대시보드에 표시됩니다.
            </p>
            {renderCourtGrid()}
          </div>
        </div>
      </div>

      {/* 데이터 관리 */}
      <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <TrashIcon className="h-5 w-5 sm:h-6 sm:w-6 mr-2 text-red-500" />
          데이터 관리
        </h2>

        <div className="space-y-4">
          {/* 회원 목록 초기화 */}
          <div className="border border-red-200 rounded-lg p-4 bg-red-50">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center mb-2">
                  <UserGroupIcon className="h-5 w-5 text-red-600 mr-2" />
                  <h3 className="text-sm font-semibold text-red-800">회원 목록 초기화</h3>
                </div>
                <p className="text-xs text-red-700 mb-3">
                  모든 회원 데이터를 삭제합니다. 이 작업은 되돌릴 수 없습니다.
                </p>
              </div>
              <button
                onClick={handleResetMembers}
                disabled={isResetting === 'members'}
                className="ml-4 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white px-3 py-2 rounded-lg text-xs font-medium transition-colors flex items-center space-x-1"
              >
                {isResetting === 'members' ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                    <span>초기화 중...</span>
                  </>
                ) : (
                  <>
                    <TrashIcon className="h-3 w-3" />
                    <span>초기화</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* 통계 초기화 */}
          <div className="border border-orange-200 rounded-lg p-4 bg-orange-50">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center mb-2">
                  <ChartBarIcon className="h-5 w-5 text-orange-600 mr-2" />
                  <h3 className="text-sm font-semibold text-orange-800">통계 초기화</h3>
                </div>
                <p className="text-xs text-orange-700 mb-3">
                  모든 출석 기록, 게임 기록, 회원 통계를 삭제합니다. 회원 정보는 유지됩니다.
                </p>
              </div>
              <button
                onClick={handleResetStatistics}
                disabled={isResetting === 'statistics'}
                className="ml-4 bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400 text-white px-3 py-2 rounded-lg text-xs font-medium transition-colors flex items-center space-x-1"
              >
                {isResetting === 'statistics' ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                    <span>초기화 중...</span>
                  </>
                ) : (
                  <>
                    <TrashIcon className="h-3 w-3" />
                    <span>초기화</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 시스템 정보 */}
      <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">시스템 정보</h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <div className="text-center p-3 sm:p-4 bg-gray-50 rounded-lg">
            <p className="text-xs sm:text-sm text-gray-600">버전</p>
            <p className="text-base sm:text-lg font-semibold text-gray-900">1.0.0</p>
          </div>

          <div className="text-center p-3 sm:p-4 bg-gray-50 rounded-lg">
            <p className="text-xs sm:text-sm text-gray-600">마지막 업데이트</p>
            <p className="text-base sm:text-lg font-semibold text-gray-900">
              {new Date().toLocaleDateString('ko-KR')}
            </p>
          </div>

          <div className="text-center p-3 sm:p-4 bg-gray-50 rounded-lg">
            <p className="text-xs sm:text-sm text-gray-600">상태</p>
            <p className="text-base sm:text-lg font-semibold text-green-600">정상</p>
          </div>
        </div>
      </div>

      {/* 주의사항 */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 sm:p-4">
        <div className="flex">
          <ExclamationTriangleIcon className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-400 mr-2 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="text-sm font-medium text-yellow-800">주의사항</h3>
            <div className="mt-2 text-xs sm:text-sm text-yellow-700">
              <ul className="list-disc list-inside space-y-1">
                <li>코트 배치를 변경하면 기존 게임 데이터에 영향을 줄 수 있습니다.</li>
                <li>설정 변경 후 반드시 &apos;설정 저장&apos; 버튼을 클릭해주세요.</li>
                <li>활성화된 코트만 대시보드에 표시됩니다.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
