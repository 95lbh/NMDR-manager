'use client';

import { useState } from 'react';
import {
  ChartBarIcon,
  UserGroupIcon,
  TrophyIcon,
  CalendarDaysIcon
} from '@heroicons/react/24/outline';

import { calculateWinRate } from '@/lib/mmr';
import { useApp } from '@/contexts/AppContext';



export default function Stats() {
  const { state } = useApp();
  const [selectedPeriod, setSelectedPeriod] = useState('week');

  const { members, attendance, weeklyStats, loading } = state;

  // 오늘 날짜 필터링 함수
  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  // 오늘 출석한 사람들만 필터링
  const todayAttendance = attendance.filter((attendee: any) => // eslint-disable-line @typescript-eslint/no-explicit-any
    isToday(new Date(attendee.date))
  );

  // 실력별 회원 분포 계산
  const skillLevels = ['S', 'A', 'B', 'C', 'D', 'E', 'F'];
  const skillDistribution = skillLevels.map(level => {
    const count = members.filter((m: any) => m.skillLevel === level).length; // eslint-disable-line @typescript-eslint/no-explicit-any
    const percentage = members.length > 0 ? Math.round((count / members.length) * 100) : 0;
    return {
      level,
      count,
      percentage
    };
  });

  // 총 게임 수 계산
  const totalGames = members.reduce((sum: number, member: any) => sum + (member.gamesPlayed || 0), 0); // eslint-disable-line @typescript-eslint/no-explicit-any

  // 상위 플레이어 계산 (게임 수 기준)
  const topPlayers = members
    .filter((m: any) => m.gamesPlayed > 0) // eslint-disable-line @typescript-eslint/no-explicit-any
    .sort((a: any, b: any) => b.gamesPlayed - a.gamesPlayed) // eslint-disable-line @typescript-eslint/no-explicit-any
    .slice(0, 5)
    .map((member: any) => ({ // eslint-disable-line @typescript-eslint/no-explicit-any
      name: member.name,
      games: member.gamesPlayed,
      winRate: calculateWinRate(member.gamesWon, member.gamesPlayed)
    }));

  // 주간 출석 현황
  const maxAttendance = weeklyStats.length > 0 ? Math.max(...weeklyStats.map(d => d.count)) : 1;

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-0">
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">통계</h1>
        <select
          value={selectedPeriod}
          onChange={(e) => setSelectedPeriod(e.target.value)}
          className="w-full sm:w-auto px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
        >
          <option value="week">이번 주</option>
          <option value="month">이번 달</option>
          <option value="year">올해</option>
        </select>
      </div>

      {/* 주요 지표 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
          <div className="flex items-center">
            <UserGroupIcon className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
            <div className="ml-3 sm:ml-4">
              <p className="text-xs sm:text-sm font-medium text-gray-600">총 회원 수</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900">
                {loading.members ? '...' : members.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
          <div className="flex items-center">
            <CalendarDaysIcon className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
            <div className="ml-3 sm:ml-4">
              <p className="text-xs sm:text-sm font-medium text-gray-600">오늘 출석</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900">
                {loading.attendance ? '...' : todayAttendance.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
          <div className="flex items-center">
            <TrophyIcon className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-600" />
            <div className="ml-3 sm:ml-4">
              <p className="text-xs sm:text-sm font-medium text-gray-600">총 게임</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900">
                {loading.members ? '...' : totalGames}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
          <div className="flex items-center">
            <ChartBarIcon className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600" />
            <div className="ml-3 sm:ml-4">
              <p className="text-xs sm:text-sm font-medium text-gray-600">총 셔틀콕</p>
              <p className="text-lg sm:text-2xl font-bold text-gray-900">
                {loading.attendance ? '...' : attendance.reduce((sum: number, a: any) => sum + a.shuttlecockCount, 0)} {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 실력별 분포 */}
      <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">실력별 회원 분포</h2>
          {loading.members ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-500 mt-2">데이터 로딩 중...</p>
            </div>
          ) : (
            <div className="space-y-3">
              {skillDistribution.map((data) => (
                <div key={data.level} className="flex items-center justify-between">
                  <div className="flex items-center flex-1">
                    <div className="w-16 text-sm font-medium text-gray-600">{data.level}조</div>
                    <div className="flex-1 mx-3">
                      <div className="bg-gray-200 rounded-full h-4">
                        <div
                          className="bg-green-600 h-4 rounded-full transition-all duration-300"
                          style={{ width: `${data.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="w-12 text-sm font-medium text-gray-900">{data.count}명</div>
                  </div>
                  <div className="w-12 text-sm text-gray-500">{data.percentage}%</div>
                </div>
              ))}
            </div>
          )}
        </div>

      {/* 상위 플레이어 */}
      <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">활발한 플레이어</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-medium text-gray-600 text-sm">순위</th>
                <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-medium text-gray-600 text-sm">이름</th>
                <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-medium text-gray-600 text-sm">게임 수</th>
                <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-medium text-gray-600 text-sm">승률</th>
                <th className="text-left py-2 sm:py-3 px-2 sm:px-4 font-medium text-gray-600 text-sm">활동도</th>
              </tr>
            </thead>
            <tbody>
              {loading.members ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-gray-500 mt-2">데이터 로딩 중...</p>
                  </td>
                </tr>
              ) : topPlayers.length > 0 ? (
                topPlayers.map((player, index) => (
                  <tr key={player.name} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-2 sm:py-3 px-2 sm:px-4">
                      <div className="flex items-center">
                        {index < 3 ? (
                          <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-white text-xs sm:text-sm font-bold ${
                            index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-orange-500'
                          }`}>
                            {index + 1}
                          </div>
                        ) : (
                          <div className="w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center text-gray-600 text-xs sm:text-sm font-bold">
                            {index + 1}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-2 sm:py-3 px-2 sm:px-4 font-medium text-gray-900 text-sm sm:text-base">{player.name}</td>
                    <td className="py-2 sm:py-3 px-2 sm:px-4 text-gray-600 text-sm sm:text-base">{player.games}게임</td>
                    <td className="py-2 sm:py-3 px-2 sm:px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        player.winRate >= 70 ? 'bg-green-100 text-green-800' :
                        player.winRate >= 60 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {player.winRate}%
                      </span>
                    </td>
                    <td className="py-2 sm:py-3 px-2 sm:px-4">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${Math.min((player.games / Math.max(...topPlayers.map(p => p.games))) * 100, 100)}%` }}
                        ></div>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-500">
                    아직 게임 기록이 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      {/* 주간 출석 현황 */}
      <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 space-y-2 sm:space-y-0">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">주간 출석 현황</h2>
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="w-full sm:w-auto px-3 py-1 border border-gray-300 rounded text-sm"
          >
            <option value="week">이번 주</option>
            <option value="month">이번 달</option>
            <option value="year">올해</option>
          </select>
        </div>
          {loading.weeklyStats ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-500 mt-2">데이터 로딩 중...</p>
            </div>
          ) : weeklyStats.length > 0 ? (
            <div className="space-y-2 sm:space-y-3">
              {weeklyStats.map((data, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <div className="w-6 sm:w-8 text-xs sm:text-sm text-gray-600">{data.day}</div>
                    <div className="w-12 sm:w-16 text-xs sm:text-sm text-gray-900">{data.date}</div>
                  </div>
                  <div className="flex-1 mx-2 sm:mx-4">
                    <div className="bg-gray-200 rounded-full h-3 sm:h-4">
                      <div
                        className="bg-blue-600 h-3 sm:h-4 rounded-full transition-all duration-300"
                        style={{ width: `${(data.count / maxAttendance) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="w-6 sm:w-8 text-xs sm:text-sm font-medium text-gray-900">{data.count}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              아직 출석 데이터가 없습니다.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
