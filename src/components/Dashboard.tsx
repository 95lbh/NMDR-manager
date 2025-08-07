'use client';

import { useState, useEffect, useCallback } from 'react';
import { PlayIcon, ClockIcon, UserGroupIcon, ArrowPathIcon, ArrowsPointingOutIcon, ArrowsPointingInIcon } from '@heroicons/react/24/outline';
import { Court } from '@/types';
import GameModal from './GameModal';
import { useApp } from '@/contexts/AppContext';
import ClientOnly from './ClientOnly';
import QRCodeGenerator from './QRCodeGenerator';

type DetailViewType = 'attendance' | 'playing' | 'waiting' | 'todayStats';
type SortType = 'name' | 'gender' | 'skillLevel' | 'gamesPlayed' | 'winRate' | 'gameStatus';
type GameStatus = 'playing' | 'waiting' | 'available';

export default function Dashboard() {
  const { state, actions } = useApp();
  const [selectedCourt, setSelectedCourt] = useState<Court | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeDetailView, setActiveDetailView] = useState<DetailViewType>('attendance');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [sortBy, setSortBy] = useState<SortType>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [isCourtExpanded, setIsCourtExpanded] = useState(false);
  const [courtDisplayMode, setCourtDisplayMode] = useState<'normal' | 'waiting' | 'players'>('normal');
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [gameTypeFilter, setGameTypeFilter] = useState<'men_doubles' | 'women_doubles' | 'mixed_doubles'>('mixed_doubles');
  const [showCourtSelection, setShowCourtSelection] = useState(false);
  const [isAttendanceExpanded, setIsAttendanceExpanded] = useState(false);
  const [selectedMemberForAttendance, setSelectedMemberForAttendance] = useState<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any
  const [isShuttlecockModalOpen, setIsShuttlecockModalOpen] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);

  const { members, attendance, courts } = state;

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

  // 게임 상태를 판별하는 함수
  const getGameStatus = (memberId: string): GameStatus => {
    // 현재 게임 중인지 확인
    for (const court of courts) {
      if (court.currentGame?.players?.includes(memberId)) {
        return 'playing';
      }
    }

    // 다음 게임 대기 중인지 확인
    for (const court of courts) {
      if (court.nextGame?.players?.includes(memberId)) {
        return 'waiting';
      }
    }

    // 게임 가능
    return 'available';
  };

  // 전체화면 토글 함수
  const toggleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.error('전체화면 전환 실패:', error);
    }
  }, []);

  // 전체화면 상태 감지 및 키보드 단축키
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      // F11 키 또는 Ctrl+Shift+F로 전체화면 토글
      if (event.key === 'F11' || (event.ctrlKey && event.shiftKey && event.key === 'F')) {
        event.preventDefault();
        toggleFullscreen();
      }
      // ESC 키로 전체화면 종료
      if (event.key === 'Escape' && document.fullscreenElement) {
        event.preventDefault();
        document.exitFullscreen();
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [toggleFullscreen]);

  // 1초마다 현재 시간 업데이트 (타이머용)
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // 경과 시간 계산 함수
  const getElapsedTime = (startTime: Date) => {
    const elapsed = Math.floor((currentTime.getTime() - startTime.getTime()) / 1000);
    const hours = Math.floor(elapsed / 3600);
    const minutes = Math.floor((elapsed % 3600) / 60);
    const seconds = elapsed % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } else {
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
  };

  // 진행 중인 게임 플레이어 목록 가져오기
  const getPlayingPlayers = () => {
    const playingPlayers: Array<{
      name: string;
      courtName: string;
      startTime: Date;
    }> = [];

    courts.forEach(court => {
      if (court.currentGame && court.currentGame.playerNames && Array.isArray(court.currentGame.playerNames)) {
        court.currentGame.playerNames.forEach((playerName: string) => {
          if (playerName && typeof playerName === 'string') {
            playingPlayers.push({
              name: playerName,
              courtName: court.name,
              startTime: court.currentGame?.startTime || new Date()
            });
          }
        });
      }
    });

    return playingPlayers;
  };

  // 다른 예약에서 플레이어 제거 함수
  const removePlayersFromOtherReservations = (players: string[], excludeCourtId: string) => {
    // 다른 코트의 예약에서 충돌하는 플레이어가 있는지 확인하고 제거
    const courtsToUpdate: string[] = [];

    courts.forEach(court => {
      // 현재 게임을 시작하는 코트는 제외
      if (court.id === excludeCourtId) return;

      // 예약된 게임이 있고, 해당 플레이어들이 포함되어 있는지 확인
      if (court.nextGame && court.nextGame.players) {
        const hasConflictingPlayer = court.nextGame.players.some(playerId =>
          players.includes(playerId)
        );

        if (hasConflictingPlayer) {
          courtsToUpdate.push(court.id);
        }
      }
    });

    // 충돌하는 예약이 있는 코트들의 예약 취소
    if (courtsToUpdate.length > 0) {
      courtsToUpdate.forEach(courtId => {
        actions.updateCourtGame(courtId, null, null); // 예약 취소
      });

      // 사용자에게 알림
      const courtNames = courtsToUpdate.map(courtId => {
        const court = courts.find(c => c.id === courtId);
        return court?.name || '알 수 없는 코트';
      }).join(', ');

      alert(`다음 코트의 예약이 취소되었습니다: ${courtNames}\n(선택된 플레이어가 다른 게임에 참여하게 되어 자동 취소됨)`);
    }
  };

  // 코트 선택 처리
  const handleCourtSelection = async (courtId: string) => {
    try {
      const availablePlayers = getAvailablePlayers();
      const selectedPlayerData = selectedPlayers.map(playerId => {
        const player = availablePlayers.find(p => p.id === playerId);
        return player ? {
          id: player.id,
          name: player.name,
          gender: player.gender,
          skillLevel: player.skillLevel
        } : null;
      }).filter(Boolean);

      if (selectedPlayerData.length === 4) {
        const playerNames = selectedPlayerData.map(p => p!.name);
        const playerIds = selectedPlayerData.map(p => p!.id);

        // 새 게임 객체 생성
        const newGame = {
          id: `game-${Date.now()}`,
          players: playerIds,
          playerNames: playerNames,
          courtId: courtId,
          type: gameTypeFilter,
          status: 'playing' as const,
          startTime: new Date(),
          createdAt: new Date(),
          updatedAt: new Date()
        };

        // 코트에 게임 추가 (현재 게임이 있으면 예약으로, 없으면 현재 게임으로)
        const court = courts.find(c => c.id === courtId);
        if (court?.currentGame && court.currentGame.players && court.currentGame.players.length > 0) {
          // 예약으로 추가
          const nextGame = { ...newGame, status: 'waiting' as const };
          actions.updateCourtGame(courtId, court.currentGame, nextGame);
        } else {
          // 현재 게임으로 시작 - 다른 예약에서 플레이어 제거
          removePlayersFromOtherReservations(playerIds, courtId);
          actions.updateCourtGame(courtId, newGame);
        }

        // 상태 초기화
        setSelectedPlayers([]);
        setShowCourtSelection(false);
        setCourtDisplayMode('normal');
        setActiveDetailView('playing');
      }
    } catch (error) {
      console.error('게임 매칭 실패:', error);
      alert('게임 매칭에 실패했습니다.');
    }
  };

  // 대기 중인 게임 플레이어 목록 가져오기
  const getWaitingPlayers = () => {
    const waitingPlayers: Array<{
      name: string;
      courtName: string;
    }> = [];

    courts.forEach(court => {
      if (court.nextGame && court.nextGame.playerNames && Array.isArray(court.nextGame.playerNames)) {
        court.nextGame.playerNames.forEach((playerName: string) => {
          if (playerName && typeof playerName === 'string') {
            waitingPlayers.push({
              name: playerName,
              courtName: court.name
            });
          }
        });
      }
    });

    return waitingPlayers;
  };

  // 게임 가능한 플레이어들 가져오기
  const getAvailablePlayers = () => {
    // 집에 가지 않은 출석자들만 필터링
    const availableAttendees = todayAttendance.filter(attendee => !attendee.hasLeft);

    // 현재 게임 중이거나 대기 중인 플레이어들 수집
    const busyPlayerIds = new Set<string>();
    courts.forEach(court => {
      if (court.currentGame?.players) {
        court.currentGame.players.forEach(playerId => busyPlayerIds.add(playerId));
      }
      if (court.nextGame?.players) {
        court.nextGame.players.forEach(playerId => busyPlayerIds.add(playerId));
      }
    });

    // 게임 가능한 플레이어들만 필터링
    const availablePlayers = availableAttendees
      .filter(attendee => !busyPlayerIds.has(attendee.memberId))
      .map(attendee => {
        const member = members.find(m => m.id === attendee.memberId);
        return {
          id: attendee.memberId,
          name: attendee.memberName,
          gender: member?.gender || attendee.guestInfo?.gender || 'male',
          skillLevel: member?.skillLevel || attendee.guestInfo?.skillLevel || 'C',
          isGuest: !!attendee.guestInfo
        };
      });

    // 게임 타입에 따른 필터링
    const filteredPlayers = availablePlayers.filter(player => {
      if (gameTypeFilter === 'men_doubles') {
        return player.gender === 'male';
      } else if (gameTypeFilter === 'women_doubles') {
        return player.gender === 'female';
      }
      return true; // 혼합 복식은 모든 성별 포함
    });

    // 성별 > 실력 > 이름 순으로 정렬
    return filteredPlayers.sort((a, b) => {
      // 1. 성별 정렬 (남성 먼저)
      if (a.gender !== b.gender) {
        return a.gender === 'male' ? -1 : 1;
      }

      // 2. 실력 정렬 (S > A > B > C > D > E > F)
      const skillOrder = { 'S': 0, 'A': 1, 'B': 2, 'C': 3, 'D': 4, 'E': 5, 'F': 6 };
      const skillA = skillOrder[a.skillLevel as keyof typeof skillOrder] ?? 3;
      const skillB = skillOrder[b.skillLevel as keyof typeof skillOrder] ?? 3;
      if (skillA !== skillB) {
        return skillA - skillB;
      }

      // 3. 이름 정렬
      return a.name.localeCompare(b.name);
    });
  };

  // 상세 뷰 제목과 내용을 렌더링하는 함수
  const renderDetailView = () => {
    switch (activeDetailView) {
      case 'attendance':
        return {
          title: '오늘 출석자',
          subtitle: `총 ${todayAttendance.length}명`,
          content: (() => {
            const sortedAttendees = [...todayAttendance].sort((a, b) => {
              const memberA = members.find(m => m.id === a.memberId);
              const memberB = members.find(m => m.id === b.memberId);

              switch (sortBy) {
                case 'name':
                  return sortOrder === 'asc'
                    ? a.memberName.localeCompare(b.memberName)
                    : b.memberName.localeCompare(a.memberName);
                case 'gender':
                  const genderA = memberA?.gender || a.guestInfo?.gender || '';
                  const genderB = memberB?.gender || b.guestInfo?.gender || '';
                  return sortOrder === 'asc'
                    ? genderA.localeCompare(genderB)
                    : genderB.localeCompare(genderA);
                case 'skillLevel':
                  const skillA = memberA?.skillLevel || a.guestInfo?.skillLevel || '';
                  const skillB = memberB?.skillLevel || b.guestInfo?.skillLevel || '';
                  return sortOrder === 'asc'
                    ? skillA.localeCompare(skillB)
                    : skillB.localeCompare(skillA);
                case 'gameStatus':
                  const statusA = getGameStatus(a.memberId);
                  const statusB = getGameStatus(b.memberId);
                  // 게임 상태 우선순위: playing > waiting > available
                  const statusOrder = { playing: 0, waiting: 1, available: 2 };
                  return sortOrder === 'asc'
                    ? statusOrder[statusA] - statusOrder[statusB]
                    : statusOrder[statusB] - statusOrder[statusA];
                default:
                  return 0;
              }
            });

            return (
              <div>
                {/* 정렬 버튼들 */}
                <div className="flex flex-wrap gap-2 mb-4 p-3 bg-gray-50 rounded-lg">
                  {[
                    { key: 'name', label: '이름' },
                    { key: 'gender', label: '성별' },
                    { key: 'skillLevel', label: '등급' },
                    { key: 'gameStatus', label: '게임 상태' }
                  ].map(({ key, label }) => (
                    <button
                      key={key}
                      onClick={() => {
                        if (sortBy === key) {
                          setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                        } else {
                          setSortBy(key as SortType);
                          setSortOrder('asc');
                        }
                      }}
                      className={`px-3 py-1 text-xs rounded-full transition-colors ${
                        sortBy === key
                          ? 'bg-blue-500 text-white'
                          : 'bg-white text-gray-600 hover:bg-blue-100'
                      }`}
                    >
                      {label} {sortBy === key && (sortOrder === 'asc' ? '↑' : '↓')}
                    </button>
                  ))}
                </div>

                {/* 출석자 목록 */}
                {sortedAttendees.map((attendee, index) => {
                  const member = members.find(m => m.id === attendee.memberId);
                  const gender = member?.gender || attendee.guestInfo?.gender;
                  const skillLevel = member?.skillLevel || attendee.guestInfo?.skillLevel;
                  const gameStatus = getGameStatus(attendee.memberId);

                  // 게임 상태별 스타일 정의
                  const getStatusStyle = (status: GameStatus) => {
                    switch (status) {
                      case 'playing':
                        return {
                          bg: 'bg-red-50 border border-red-200',
                          badge: 'bg-red-100 text-red-700',
                          label: '게임중'
                        };
                      case 'waiting':
                        return {
                          bg: 'bg-yellow-50 border border-yellow-200',
                          badge: 'bg-yellow-100 text-yellow-700',
                          label: '예약중'
                        };
                      case 'available':
                        return {
                          bg: 'bg-green-50 border border-green-200',
                          badge: 'bg-green-100 text-green-700',
                          label: '대기중'
                        };
                    }
                  };

                  const statusStyle = getStatusStyle(gameStatus);

                  return (
                    <div
                      key={attendee.id}
                      className={`flex items-center justify-between p-3 rounded-lg hover:opacity-80 transition-all slide-up mb-2 cursor-pointer ${statusStyle.bg} ${attendee.hasLeft ? 'opacity-50 bg-gray-100 border-gray-300' : ''}`}
                      style={{ animationDelay: `${index * 0.1}s` }}
                      onClick={() => {
                        if (!attendee.hasLeft) {
                          const confirmLeave = confirm(`${attendee.memberName}님이 집에 가셨나요?`);
                          if (confirmLeave) {
                            actions.updateAttendanceLeftStatus(attendee.id, true);
                          }
                        } else {
                          const confirmReturn = confirm(`${attendee.memberName}님이 다시 돌아오셨나요?`);
                          if (confirmReturn) {
                            actions.updateAttendanceLeftStatus(attendee.id, false);
                          }
                        }
                      }}
                    >
                      <div className="flex items-center">
                        <div>
                          <p className="font-medium text-gray-900 mb-2">{attendee.memberName}</p>
                          <div className="flex items-center space-x-2 flex-wrap">
                            {/* 성별 배지 */}
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              gender === 'male'
                                ? 'bg-blue-100 text-blue-700 border border-blue-200'
                                : gender === 'female'
                                ? 'bg-pink-100 text-pink-700 border border-pink-200'
                                : 'bg-gray-100 text-gray-700 border border-gray-200'
                            }`}>
                              {gender === 'male' ? '남성' : gender === 'female' ? '여성' : 'N/A'}
                            </span>
                            {/* 등급 배지 */}
                            <span className="px-2 py-1 bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-full text-xs font-semibold">
                              {skillLevel}조
                            </span>
                            {/* 게스트 배지 */}
                            {attendee.guestInfo && (
                              <span className="px-2 py-1 bg-amber-100 text-amber-700 border border-amber-200 rounded-full text-xs font-semibold">
                                게스트
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        {attendee.hasLeft ? (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                            집 갔음
                          </span>
                        ) : (
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusStyle.badge}`}>
                            {statusStyle.label}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()
        };

      case 'playing':
        const playingPlayers = getPlayingPlayers();
        return {
          title: '진행 중인 게임',
          subtitle: `총 ${playingPlayers.length}명`,
          content: playingPlayers.map((player, index) => (
            <div
              key={`${player.courtName}-${player.name}-${index}`}
              className="flex items-center justify-between p-2 bg-green-50 rounded-lg hover:bg-green-100 transition-colors slide-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex items-center">
                <div>
                  <p className="font-medium text-gray-900 text-sm">{player.name}</p>
                  <p className="text-sm text-gray-600">{player.courtName}</p>
                </div>
              </div>
              <div className="flex items-center">
                <ClientOnly fallback={<span className="text-xs bg-green-100 px-2 py-1 rounded-full">00:00</span>}>
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-mono">
                    {getElapsedTime(player.startTime)}
                  </span>
                </ClientOnly>
              </div>
            </div>
          ))
        };

      case 'waiting':
        const waitingPlayers = getWaitingPlayers();
        return {
          title: '대기 중인 게임',
          subtitle: `총 ${waitingPlayers.length}명`,
          content: waitingPlayers.map((player, index) => (
            <div
              key={`${player.courtName}-${player.name}-${index}`}
              className="flex items-center justify-between p-2 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors slide-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex items-center">
                <div>
                  <p className="font-medium text-gray-900 text-sm">{player.name}</p>
                  <p className="text-sm text-gray-600">{player.courtName} 대기</p>
                </div>
              </div>
              <div className="flex items-center">
                <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full font-mono">
                  대기중
                </span>
              </div>
            </div>
          ))
        };

      case 'todayStats':
        return {
          title: '오늘의 전적',
          subtitle: '오늘 게임을 한 사람들의 전적을 확인하세요',
          content: (() => {
            // 오늘 게임을 한 사람들의 전적 계산
            const todayGames = state.games.filter(game => {
              const gameDate = new Date(game.createdAt);
              const today = new Date();
              return gameDate.toDateString() === today.toDateString() && game.status === 'completed';
            });

            const playerStats = new Map();

            todayGames.forEach(game => {
              if (game.players && game.winners) {
                game.players.forEach(playerId => {
                  if (!playerStats.has(playerId)) {
                    const member = members.find(m => m.id === playerId);
                    if (member) {
                      playerStats.set(playerId, {
                        member,
                        gamesPlayed: 0,
                        gamesWon: 0
                      });
                    }
                  }

                  const stats = playerStats.get(playerId);
                  if (stats) {
                    stats.gamesPlayed++;
                    if (game.winners && game.winners.includes(playerId)) {
                      stats.gamesWon++;
                    }
                  }
                });
              }
            });

            const sortedStats = Array.from(playerStats.values()).sort((a, b) => {
              switch (sortBy) {
                case 'name':
                  return sortOrder === 'asc'
                    ? a.member.name.localeCompare(b.member.name)
                    : b.member.name.localeCompare(a.member.name);
                case 'gender':
                  return sortOrder === 'asc'
                    ? a.member.gender.localeCompare(b.member.gender)
                    : b.member.gender.localeCompare(a.member.gender);
                case 'skillLevel':
                  return sortOrder === 'asc'
                    ? a.member.skillLevel.localeCompare(b.member.skillLevel)
                    : b.member.skillLevel.localeCompare(a.member.skillLevel);
                case 'gamesPlayed':
                  return sortOrder === 'asc'
                    ? a.gamesPlayed - b.gamesPlayed
                    : b.gamesPlayed - a.gamesPlayed;
                case 'winRate':
                  const aWinRate = a.gamesPlayed > 0 ? (a.gamesWon / a.gamesPlayed) : 0;
                  const bWinRate = b.gamesPlayed > 0 ? (b.gamesWon / b.gamesPlayed) : 0;
                  return sortOrder === 'asc'
                    ? aWinRate - bWinRate
                    : bWinRate - aWinRate;
                default:
                  return 0;
              }
            });

            return (
              <div>
                {/* 정렬 버튼들 */}
                <div className="flex flex-wrap gap-2 mb-4 p-3 bg-gray-50 rounded-lg">
                  {[
                    { key: 'name', label: '이름' },
                    { key: 'gender', label: '성별' },
                    { key: 'skillLevel', label: '등급' },
                    { key: 'gamesPlayed', label: '게임 수' },
                    { key: 'winRate', label: '승률' }
                  ].map(({ key, label }) => (
                    <button
                      key={key}
                      onClick={() => {
                        if (sortBy === key) {
                          setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                        } else {
                          setSortBy(key as SortType);
                          setSortOrder('asc');
                        }
                      }}
                      className={`px-3 py-1 text-xs rounded-full transition-colors ${
                        sortBy === key
                          ? 'bg-teal-500 text-white'
                          : 'bg-white text-gray-600 hover:bg-teal-100'
                      }`}
                    >
                      {label} {sortBy === key && (sortOrder === 'asc' ? '↑' : '↓')}
                    </button>
                  ))}
                </div>

                {/* 전적 목록 */}
                {sortedStats.map((stats, index) => (
                  <div
                    key={stats.member.id}
                    className="flex items-center justify-between p-3 bg-teal-50 rounded-lg hover:bg-teal-100 transition-colors slide-up mb-2"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className="flex items-center">
                      <div>
                        <p className="font-medium text-gray-900 mb-2">{stats.member.name}</p>
                        <div className="flex items-center space-x-2">
                          {/* 성별 배지 */}
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            stats.member.gender === 'male'
                              ? 'bg-blue-100 text-blue-700 border border-blue-200'
                              : 'bg-pink-100 text-pink-700 border border-pink-200'
                          }`}>
                            {stats.member.gender === 'male' ? '남성' : '여성'}
                          </span>
                          {/* 등급 배지 */}
                          <span className="px-2 py-1 bg-teal-100 text-teal-700 border border-teal-200 rounded-full text-xs font-semibold">
                            {stats.member.skillLevel}조
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">
                        {stats.gamesPlayed}게임 {stats.gamesWon}승
                      </p>
                      <p className="text-xs text-gray-500">
                        승률 {stats.gamesPlayed > 0 ? Math.round((stats.gamesWon / stats.gamesPlayed) * 100) : 0}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            );
          })()
        };

      default:
        return {
          title: '오늘 출석자',
          subtitle: `총 ${attendance.length}명`,
          content: []
        };
    }
  };

  // 동적 그리드 생성 함수
  const createDynamicGrid = () => {
    if (courts.length === 0) return { grid: [], rows: 0, cols: 0, cardSize: 'large' };

    // 활성화된 코트들의 위치 정보 수집
    const positions = courts.map(court => ({
      court,
      x: court.position.x,
      y: court.position.y
    }));

    // 최대 행과 열 계산
    const maxRow = Math.max(...positions.map(p => p.y));
    const maxCol = Math.max(...positions.map(p => p.x));
    const rows = maxRow + 1;
    const cols = maxCol + 1;

    // 그리드 초기화
    const grid: (Court | null)[][] = Array(rows).fill(null).map(() => Array(cols).fill(null));

    // 코트들을 그리드에 배치
    positions.forEach(({ court, x, y }) => {
      grid[y][x] = court;
    });

    // 카드 크기 결정 (열 수와 총 코트 수에 따라)
    let cardSize = 'large';
    const totalCourts = courts.length;

    if (cols >= 5 || totalCourts >= 8) {
      cardSize = 'small';
    } else if (cols >= 4 || totalCourts >= 6) {
      cardSize = 'medium';
    } else if (cols >= 3) {
      cardSize = 'medium';
    }

    return { grid, rows, cols, cardSize };
  };

  // 코트 설정 변경 감지
  useEffect(() => {
    // 코트 상태 변경 시 리렌더링 트리거
  }, [courts, state.courtSettings]);

  // 60초마다 현재 게임 상태만 자동 새로고침
  useEffect(() => {
    const refreshInterval = setInterval(async () => {
      try {
        await actions.loadCurrentGames();
      } catch (error) {
        console.error('게임 상태 자동 새로고침 실패:', error);
      }
    }, 60000); // 60초마다 실행

    return () => clearInterval(refreshInterval);
  }, [actions]);

  // 수동 새로고침 함수
  const handleManualRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        actions.loadAttendance(),
        actions.loadCurrentGames(),
        actions.loadGames(),
        actions.loadMembers()
      ]);
    } catch (error) {
      console.error('수동 새로고침 실패:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [actions]);



  const handleCourtClick = (court: Court) => {
    setSelectedCourt(court);
  };

  const handleGameUpdate = useCallback((courtId: string, currentGame: any, nextGame?: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
    actions.updateCourtGame(courtId, currentGame, nextGame);
    setSelectedCourt(null);

    // 게임 상태가 변경되었으므로 완료된 게임 데이터도 다시 로드 (비동기로 처리)
    setTimeout(() => {
      actions.loadGames();
    }, 100);
  }, [actions]);



  const getCourtStatusText = (court: Court) => {
    if (court.currentGame) {
      return '경기 중';
    }
    if (court.nextGame) {
      return '예약됨';
    }
    return '빈 코트';
  };

  return (
    <div className={`min-h-screen flex flex-col space-y-6 fade-in landscape-optimized ${isFullscreen ? 'fullscreen-optimized' : ''}`}>
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">내맘대로 대시보드</h1>
          {/* <p className="text-gray-600 mt-1">오늘의 활동을 한눈에 확인하세요</p> */}
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={toggleFullscreen}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              isFullscreen
                ? 'bg-purple-50 text-purple-700 hover:bg-purple-100'
                : 'bg-blue-50 text-blue-700 hover:bg-blue-100 hover:scale-105'
            }`}
            title={isFullscreen ? '전체화면 종료 (ESC 또는 F11)' : '전체화면 모드 (F11 또는 Ctrl+Shift+F)'}
          >
            {isFullscreen ? (
              <ArrowsPointingInIcon className="h-4 w-4" />
            ) : (
              <ArrowsPointingOutIcon className="h-4 w-4" />
            )}
            <span>{isFullscreen ? '전체화면 종료' : '전체화면'}</span>
          </button>
          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              isRefreshing
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-green-50 text-green-700 hover:bg-green-100 hover:scale-105'
            }`}
            title="데이터 새로고침"
          >
            <ArrowPathIcon className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? '새로고침 중...' : '새로고침'}</span>
          </button>
          <div className="bg-blue-50 px-4 py-2 rounded-lg">
            <p className="text-sm font-medium text-blue-700">
              오늘 출석자: {todayAttendance.length}명
            </p>
          </div>
          <div className="bg-purple-50 px-4 py-2 rounded-lg">
            <p className="text-sm font-medium text-purple-700">
              🏸 셔틀콕: {todayAttendance.reduce((sum: number, a: any) => sum + a.shuttlecockCount, 0)}개 {/* eslint-disable-line @typescript-eslint/no-explicit-any */}
            </p>
          </div>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          className={`card hover-lift cursor-pointer transition-all duration-200 ${
            activeDetailView === 'attendance' ? 'ring-2 ring-blue-500 bg-blue-50' : ''
          }`}
          onClick={() => {
            setActiveDetailView('attendance');
            setCourtDisplayMode('players');
            setSelectedPlayers([]);
          }}
        >
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <UserGroupIcon className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">오늘 출석자</p>
              <p className="text-2xl font-bold text-gray-900">{attendance.length}명</p>
            </div>
          </div>
        </div>

        <div
          className={`card hover-lift cursor-pointer transition-all duration-200 ${
            activeDetailView === 'playing' ? 'ring-2 ring-green-500 bg-green-50' : ''
          }`}
          onClick={() => {
            setActiveDetailView('playing');
            setCourtDisplayMode('normal');
          }}
        >
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <PlayIcon className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">진행 중인 게임</p>
              <p className="text-2xl font-bold text-gray-900">
                {courts.filter(c => c.currentGame).length}
              </p>
            </div>
          </div>
        </div>

        <div
          className={`card hover-lift cursor-pointer transition-all duration-200 ${
            activeDetailView === 'waiting' ? 'ring-2 ring-yellow-500 bg-yellow-50' : ''
          }`}
          onClick={() => {
            setActiveDetailView('waiting');
            setCourtDisplayMode('waiting');
          }}
        >
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <ClockIcon className="h-8 w-8 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">대기 중인 게임</p>
              <p className="text-2xl font-bold text-gray-900">
                {courts.filter(c => c.nextGame).length}
              </p>
            </div>
          </div>
        </div>

        <div
          className={`card hover-lift cursor-pointer transition-all duration-200 ${
            activeDetailView === 'todayStats' ? 'ring-2 ring-teal-500 bg-teal-50' : ''
          }`}
          onClick={() => {
            setActiveDetailView('todayStats');
            setCourtDisplayMode('normal');
          }}
        >
          <div className="flex items-center">
            <div className="p-3 bg-teal-100 rounded-lg">
              <div className="h-8 w-8 bg-teal-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-lg">📊</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">오늘의 전적</p>
              <p className="text-2xl font-bold text-gray-900">
                {/* 오늘 진행된 게임 판수 계산 */}Total:
                {(() => {
                  const todayGames = state.games.filter(game => {
                    const gameDate = new Date(game.createdAt);
                    const today = new Date();
                    return gameDate.toDateString() === today.toDateString() && game.status === 'completed';
                  });
                  return todayGames.length;
                })()} 게임
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 게임판 및 출석체크 버튼들 */}
      <div className="mb-6 flex flex-col lg:flex-row gap-4 landscape-buttons">
        {/* 게임판 버튼 */}
        <button
          onClick={() => setIsCourtExpanded(true)}
          className="group lg:flex-1 w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center space-x-3"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 6v12M16 6v12" />
          </svg>
          <span className="text-lg">게임판</span>
        </button>

        {/* 빠른 출석체크 */}
        <button
          onClick={() => setIsAttendanceExpanded(true)}
          className="group lg:flex-[2] w-full bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-semibold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center space-x-3"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-lg">빠른 출석체크</span>
        </button>

        {/* QR 코드 생성 버튼 */}
        <button
          onClick={() => setShowQRCode(true)}
          className="group lg:flex-1 w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-semibold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center space-x-3"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
          </svg>
          <span className="text-lg">셀프 출석체크</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-9 gap-2 flex-1 min-h-0">
        {/* 코트 현황 */}
        <div className="lg:col-span-7 flex flex-col min-h-0">
          <div className="card flex-1 flex flex-col min-h-0">
            <div className="card-header flex-shrink-0">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">
                  {courtDisplayMode === 'players' ? '플레이어 선택' : '코트 현황'}
                </h2>
                <div className="flex items-center space-x-2">
                  {courtDisplayMode === 'players' && (
                    <button
                      onClick={() => {
                        setCourtDisplayMode('normal');
                        setSelectedPlayers([]);
                      }}
                      className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                    >
                      코트 보기
                    </button>
                  )}
                </div>
              </div>
              {/* <p className="text-sm text-gray-600 mt-1">코트를 클릭하여 게임을 관리하세요</p> */}
            </div>
            <div className="flex-1 overflow-y-auto overflow-x-hidden">
              {courtDisplayMode === 'players' ? (
                /* 플레이어 선택 모드 - 코트 대신 플레이어 카드들만 표시 */
                <div className="w-full h-full p-4 bg-blue-50">
                  {/* 게임 타입 필터 버튼 */}
                  <div className="flex justify-center gap-2 mb-4">
                    {[
                      { key: 'men_doubles', label: '남복' },
                      { key: 'women_doubles', label: '여복' },
                      { key: 'mixed_doubles', label: '혼복' }
                    ].map(({ key, label }) => (
                      <button
                        key={key}
                        onClick={() => {
                          setGameTypeFilter(key as typeof gameTypeFilter);
                          setSelectedPlayers([]);
                        }}
                        className={`px-3 py-1 text-sm rounded-lg font-medium transition-colors ${
                          gameTypeFilter === key
                            ? 'bg-blue-500 text-white'
                            : 'bg-white text-gray-600 hover:bg-blue-100'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>

                  {/* 선택된 플레이어 수 표시 */}
                  <div className="text-center mb-4">
                    <span className="text-sm font-medium text-blue-700">
                      선택된 플레이어: {selectedPlayers.length}/4
                    </span>
                  </div>

                  {/* 플레이어 카드들 */}
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                    {(() => {
                      const availablePlayers = getAvailablePlayers();
                      let currentGender = '';
                      const cards: React.ReactElement[] = [];

                      availablePlayers.forEach((player) => {
                        // 성별이 바뀔 때 구분선 추가 (그리드에서는 전체 너비로)
                        if (player.gender !== currentGender) {
                          if (currentGender !== '') {
                            cards.push(
                              <div key={`divider-${player.gender}`} className="col-span-full border-t border-gray-300 my-2"></div>
                            );
                          }
                          currentGender = player.gender;
                          cards.push(
                            <div key={`header-${player.gender}`} className="col-span-full text-sm font-semibold text-gray-700 mb-2">
                              {player.gender === 'male' ? '👨 남성' : '👩 여성'}
                            </div>
                          );
                        }

                        const isSelected = selectedPlayers.includes(player.id);
                        const canSelect = selectedPlayers.length < 4 || isSelected;

                        cards.push(
                          <button
                            key={player.id}
                            onClick={() => {
                              if (isSelected) {
                                setSelectedPlayers(prev => prev.filter(id => id !== player.id));
                              } else if (selectedPlayers.length < 4) {
                                setSelectedPlayers(prev => [...prev, player.id]);
                              }
                            }}
                            disabled={!canSelect}
                            className={`p-3 rounded-lg border-2 transition-all text-center ${
                              isSelected
                                ? 'border-blue-500 bg-blue-100 text-blue-800'
                                : canSelect
                                ? 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50'
                                : 'border-gray-200 bg-gray-100 opacity-50 cursor-not-allowed'
                            }`}
                          >
                            <div className="space-y-1">
                              <p className="font-medium text-xs truncate">{player.name}</p>
                              <div className="flex items-center justify-center space-x-1">
                                <span className="px-1 py-0.5 bg-indigo-100 text-indigo-700 rounded text-xs font-semibold">
                                  {player.skillLevel}
                                </span>
                                {player.isGuest && (
                                  <span className="px-1 py-0.5 bg-amber-100 text-amber-700 rounded text-xs">
                                    G
                                  </span>
                                )}
                              </div>
                              {isSelected && (
                                <div className="text-blue-500">
                                  <svg className="h-4 w-4 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                </div>
                              )}
                            </div>
                          </button>
                        );
                      });

                      return cards;
                    })()}
                  </div>

                  {/* 게임 매칭 버튼 */}
                  <div className="mt-6 pt-4 border-t border-gray-300">
                    <button
                      onClick={() => selectedPlayers.length === 4 && setShowCourtSelection(true)}
                      disabled={selectedPlayers.length !== 4}
                      className={`w-full font-bold py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-center space-x-2 ${
                        selectedPlayers.length === 4
                          ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white cursor-pointer'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      <span>게임 매칭 ({selectedPlayers.length}/4)</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* 일반 코트 현황 모드 */
                (() => {
                  const { grid, rows, cols, cardSize } = createDynamicGrid();

                if (courts.length === 0) {
                  return (
                    <div className="text-center py-8">
                      <p className="text-gray-500">활성화된 코트가 없습니다.</p>
                      <p className="text-sm text-gray-400 mt-2">설정에서 코트를 활성화해주세요.</p>
                    </div>
                  );
                }

                // 카드 크기별 스타일 정의 - 플레이어 이름 가독성 개선
                const getCardStyles = (size: string) => {
                  switch (size) {
                    case 'small':
                      return {
                        gap: 'gap-2',
                        padding: 'p-2',
                        minHeight: 'min-h-[120px]',
                        fontSize: 'text-xs',
                        titleSize: 'text-sm',
                        statusSize: 'text-xs',
                        playerSize: 'text-sm font-bold' // 가독성 개선: xs → sm, font-bold 추가
                      };
                    case 'medium':
                      return {
                        gap: 'gap-3',
                        padding: 'p-3',
                        minHeight: 'min-h-[160px]',
                        fontSize: 'text-sm',
                        titleSize: 'text-base',
                        statusSize: 'text-xs',
                        playerSize: 'text-base font-bold' // 가독성 개선: xs → base, font-bold 추가
                      };
                    default: // large
                      return {
                        gap: 'gap-4',
                        padding: 'p-4',
                        minHeight: 'min-h-[200px]',
                        fontSize: 'text-sm',
                        titleSize: 'text-lg',
                        statusSize: 'text-xs',
                        playerSize: 'text-lg font-bold' // 가독성 개선: xs → lg, font-bold 추가
                      };
                  }
                };

                const cardStyles = getCardStyles(cardSize);

                return (
                  <div
                    className={`${cardStyles.gap} h-full w-full max-w-full overflow-hidden`}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
                      gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`
                    }}
                  >
                  {grid.map((row, rowIndex) =>
                    row.map((court, colIndex) => (
                      <div key={`${rowIndex}-${colIndex}`} className="w-full h-full">
                        {court ? (
                          <button
                            onClick={() => handleCourtClick(court)}
                            className={`w-full h-full ${cardStyles.padding} rounded-xl font-medium transition-all duration-300 hover:scale-105 hover:shadow-xl ${cardStyles.minHeight} flex flex-col bg-white border-2 shadow-lg`}
                            style={{
                              borderColor: court.currentGame ? '#10b981' : '#e5e7eb',
                              background: court.currentGame
                                ? 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)'
                                : 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)'
                            }}
                          >
                            <div className="h-full flex flex-col">
                              {/* 헤더: 코트 이름 + 상태 */}
                              <div className={`flex items-center justify-between ${cardSize === 'small' ? 'mb-1' : cardSize === 'medium' ? 'mb-2' : 'mb-3'}`}>
                                <h3 className={`${cardStyles.titleSize} font-bold text-gray-800`}>{court.name}</h3>
                                <div className={`px-2 py-1 rounded-full ${cardStyles.statusSize} font-semibold ${
                                  court.currentGame
                                    ? 'bg-green-100 text-green-700 border border-green-200'
                                    : 'bg-gray-100 text-gray-600 border border-gray-200'
                                }`}>
                                  {getCourtStatusText(court)}
                                </div>
                              </div>

                              {/* 모드별 표시 */}
                              {courtDisplayMode === 'waiting' ? (
                                /* 대기자 표시 */
                                court.nextGame && court.nextGame.playerNames && court.nextGame.playerNames.length > 0 ? (
                                  <div className="flex-1 space-y-3">
                                    <div className={`bg-yellow-50 rounded-lg ${cardStyles.padding} border border-yellow-200 shadow-sm`}>
                                      <div className={`${cardStyles.statusSize} text-yellow-700 ${cardSize === 'small' ? 'mb-1' : 'mb-2'} flex items-center justify-between`}>
                                        <span className="font-semibold">⏳ 대기 중</span>
                                        <span className={`${cardStyles.statusSize} bg-yellow-100 px-2 py-1 rounded-full`}>
                                          {court.nextGame.playerNames.length}명
                                        </span>
                                      </div>
                                      <div className={`grid grid-cols-2 ${cardSize === 'small' ? 'gap-1' : 'gap-2'}`}>
                                        {court.nextGame.playerNames.map((name, index) => {
                                          const displayName = cardSize === 'small' && name.length > 6
                                            ? name.split(' ')[0] || name.substring(0, 4) + '...'
                                            : name;

                                          return (
                                            <div
                                              key={index}
                                              className={`bg-white text-yellow-800 rounded-lg ${cardSize === 'small' ? 'px-1 py-1.5' : 'px-2 py-2'} text-center ${cardStyles.playerSize} border border-yellow-100 shadow-sm hover:shadow-md transition-shadow`}
                                              title={name}
                                            >
                                              <div className="truncate">{displayName}</div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  /* 대기자가 없을 때 */
                                  <div className="flex-1 flex items-center justify-center">
                                    <div className={`text-center ${cardStyles.padding} rounded-lg bg-gray-50 border-2 border-dashed border-gray-300`}>
                                      <div className={`${cardStyles.fontSize} text-gray-600 font-semibold`}>대기자 없음</div>
                                      <div className={`${cardStyles.statusSize} text-gray-500 mt-1`}>예약 게임 없음</div>
                                    </div>
                                  </div>
                                )
                              ) : (
                                /* 일반 모드: 현재 경기 정보 표시 */
                                court.currentGame && court.currentGame.playerNames && court.currentGame.playerNames.length > 0 ? (
                                <div className="flex-1 space-y-3">
                                  {/* 플레이어 미리보기 */}
                                  <div className={`bg-green-50 rounded-lg ${cardStyles.padding} border border-green-200 shadow-sm`}>
                                    <div className={`${cardStyles.statusSize} text-green-700 ${cardSize === 'small' ? 'mb-1' : 'mb-2'} flex items-center justify-between`}>
                                      <span className="font-semibold">🏸 현재 플레이</span>
                                      <ClientOnly fallback={<span className={`font-mono ${cardStyles.statusSize} bg-green-100 px-2 py-1 rounded-full`}>00:00</span>}>
                                        <span className={`font-mono ${cardStyles.statusSize} bg-green-100 px-2 py-1 rounded-full`}>
                                          {court.currentGame.startTime ? getElapsedTime(court.currentGame.startTime) : '00:00'}
                                        </span>
                                      </ClientOnly>
                                    </div>
                                    <div className={`grid grid-cols-2 ${cardSize === 'small' ? 'gap-1' : 'gap-2'}`}>
                                      {court.currentGame.playerNames.map((name, index) => {
                                        // 이름 길이에 따른 동적 표시
                                        const displayName = cardSize === 'small' && name.length > 6
                                          ? name.split(' ')[0] || name.substring(0, 4) + '...'
                                          : name;

                                        return (
                                          <div
                                            key={index}
                                            className={`bg-white text-green-800 rounded-lg ${cardSize === 'small' ? 'px-1 py-1.5' : 'px-2 py-2'} text-center ${cardStyles.playerSize} border border-green-100 shadow-sm hover:shadow-md transition-shadow`}
                                            title={name} // 전체 이름을 툴팁으로 표시
                                          >
                                            <div className="truncate">{displayName}</div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>


                                </div>
                              ) : (
                                /* 빈 코트일 때 안내 */
                                <div className="flex-1 flex items-center justify-center">
                                  <div className={`text-center ${cardStyles.padding} rounded-lg bg-gray-50 border-2 border-dashed border-gray-300`}>
                                    <div className={`${cardStyles.fontSize} text-gray-600 font-semibold`}>사용 가능</div>
                                    <div className={`${cardStyles.statusSize} text-gray-500 mt-1`}>클릭하여 게임 시작</div>
                                  </div>
                                </div>
                              )
                              )}
                            </div>
                          </button>
                        ) : (
                          <div className="w-full h-full"></div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              );
                })()
              )}
            </div>
          </div>
        </div>

        {/* 동적 상세 뷰 */}
        <div className="lg:col-span-2 flex flex-col min-h-0">
          {(() => {
            const detailView = renderDetailView();
            return (
              <div className="card min-h-[500px] max-h-[80vh] flex flex-col">
                <div className="card-header flex-shrink-0">
                  <h2 className="text-lg font-semibold text-gray-900">{detailView.title}</h2>
                  <p className="text-xs text-gray-600 mt-1">{detailView.subtitle}</p>
                </div>
                <div className="space-y-2 flex-1 overflow-y-auto scrollbar-thin">
                  {(Array.isArray(detailView.content) && detailView.content.length > 0) || (!Array.isArray(detailView.content) && detailView.content) ? (
                    detailView.content
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <UserGroupIcon className="h-8 w-8 text-gray-400" />
                      </div>
                      <p className="text-gray-500">
                        {activeDetailView === 'attendance' && '아직 출석한 사람이 없습니다'}
                        {activeDetailView === 'playing' && '진행 중인 게임이 없습니다'}
                        {activeDetailView === 'waiting' && '대기 중인 게임이 없습니다'}
                        {activeDetailView === 'todayStats' && '오늘 게임을 한 사람이 없습니다'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* 게임 관리 모달 */}
      {selectedCourt && (
        <GameModal
          court={selectedCourt}
          courts={courts}
          onClose={() => setSelectedCourt(null)}
          onGameUpdate={handleGameUpdate}
          attendees={attendance}
          members={members}
        />
      )}

      {/* 전체 화면 코트 현황 */}
      {isCourtExpanded && (
        <ClientOnly fallback={
          <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-gray-600">로딩 중...</p>
            </div>
          </div>
        }>
          <div className="fixed inset-0 bg-white z-50 flex flex-col">
            {/* 헤더 */}
            <div className="bg-white border-b border-gray-200">
              <div className="p-4 flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    게임판 - {courtDisplayMode === 'players' ? '플레이어 선택' :
                     courtDisplayMode === 'waiting' ? '대기 중인 게임' :
                     '진행 중인 게임'}
                  </h1>
                  <p className="text-sm text-gray-600 mt-1">
                    현재 시간: <span className="font-mono">{currentTime.toLocaleTimeString()}</span>
                  </p>
                </div>
                <div className="flex items-center justify-between w-full">
                  {/* 빈 공간 (왼쪽) */}
                  <div className="w-24"></div>

                  {/* 코트 현황판 모드 전환 버튼들 (중앙) */}
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => {
                        setActiveDetailView('attendance');
                        setCourtDisplayMode('players');
                        setSelectedPlayers([]);
                      }}
                      className={`flex items-center space-x-3 px-5 py-3 rounded-xl text-lg font-semibold transition-colors ${
                        courtDisplayMode === 'players'
                          ? 'bg-blue-500 text-white shadow-lg'
                          : 'bg-blue-50 hover:bg-blue-100 text-blue-700'
                      }`}
                      title="플레이어 선택 모드"
                    >
                      <span className="text-xl">👥</span>
                      <span>플레이어 선택</span>
                    </button>
                    <button
                      onClick={() => {
                        setActiveDetailView('playing');
                        setCourtDisplayMode('normal');
                      }}
                      className={`flex items-center space-x-3 px-5 py-3 rounded-xl text-lg font-semibold transition-colors ${
                        courtDisplayMode === 'normal' && activeDetailView === 'playing'
                          ? 'bg-green-500 text-white shadow-lg'
                          : 'bg-green-50 hover:bg-green-100 text-green-700'
                      }`}
                      title="게임 중 모드"
                    >
                      <span className="text-xl">🏸</span>
                      <span>게임중</span>
                    </button>
                    <button
                      onClick={() => {
                        setActiveDetailView('waiting');
                        setCourtDisplayMode('waiting');
                      }}
                      className={`flex items-center space-x-3 px-5 py-3 rounded-xl text-lg font-semibold transition-colors ${
                        courtDisplayMode === 'waiting'
                          ? 'bg-yellow-500 text-white shadow-lg'
                          : 'bg-yellow-50 hover:bg-yellow-100 text-yellow-700'
                      }`}
                      title="대기자 표시 모드"
                    >
                      <span className="text-xl">⏳</span>
                      <span>대기중</span>
                    </button>
                  </div>

                  {/* 닫기 버튼 (오른쪽) */}
                  <button
                    onClick={() => {
                      setIsCourtExpanded(false);
                      setCourtDisplayMode('normal');
                      setSelectedPlayers([]);
                    }}
                    className="flex items-center space-x-3 px-6 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl text-lg font-semibold transition-colors"
                  >
                    <ArrowsPointingInIcon className="h-5 w-5" />
                    <span>닫기</span>
                  </button>
                </div>
              </div>

            </div>

          {/* 메인 콘텐츠 - 코트 현황판 */}
          <div className="flex-1 p-6 overflow-auto">
            {courtDisplayMode === 'players' ? (
              /* 플레이어 선택 모드 - 전체 화면 */
              <div className="w-full h-full bg-blue-50 rounded-xl p-6">
                {/* 게임 타입 필터 버튼 */}
                <div className="flex justify-center gap-3 mb-6">
                  {[
                    { key: 'men_doubles', label: '남복' },
                    { key: 'women_doubles', label: '여복' },
                    { key: 'mixed_doubles', label: '혼복' }
                  ].map(({ key, label }) => (
                    <button
                      key={key}
                      onClick={() => {
                        setGameTypeFilter(key as typeof gameTypeFilter);
                        setSelectedPlayers([]);
                      }}
                      className={`px-6 py-3 text-lg rounded-xl font-medium transition-colors ${
                        gameTypeFilter === key
                          ? 'bg-blue-500 text-white'
                          : 'bg-white text-gray-600 hover:bg-blue-100'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {/* 선택된 플레이어 수 표시 */}
                <div className="text-center mb-6">
                  <span className="text-xl font-medium text-blue-700">
                    선택된 플레이어: {selectedPlayers.length}/4
                  </span>
                </div>

                {/* 플레이어 카드들 */}
                <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
                  {(() => {
                    const availablePlayers = getAvailablePlayers();
                    let currentGender = '';
                    const cards: React.ReactElement[] = [];

                    availablePlayers.forEach((player) => {
                      // 성별이 바뀔 때 구분선 추가 (그리드에서는 전체 너비로)
                      if (player.gender !== currentGender) {
                        if (currentGender !== '') {
                          cards.push(
                            <div key={`divider-${player.gender}`} className="col-span-full border-t border-gray-300 my-4"></div>
                          );
                        }
                        currentGender = player.gender;
                        cards.push(
                          <div key={`header-${player.gender}`} className="col-span-full text-lg font-semibold text-gray-700 mb-4">
                            {player.gender === 'male' ? '👨 남성' : '👩 여성'}
                          </div>
                        );
                      }

                      const isSelected = selectedPlayers.includes(player.id);
                      const canSelect = selectedPlayers.length < 4 || isSelected;

                      cards.push(
                        <button
                          key={player.id}
                          onClick={() => {
                            if (isSelected) {
                              setSelectedPlayers(prev => prev.filter(id => id !== player.id));
                            } else if (selectedPlayers.length < 4) {
                              setSelectedPlayers(prev => [...prev, player.id]);
                            }
                          }}
                          disabled={!canSelect}
                          className={`p-4 rounded-xl border-2 transition-all text-center ${
                            isSelected
                              ? 'border-blue-500 bg-blue-100 text-blue-800'
                              : canSelect
                              ? 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50'
                              : 'border-gray-200 bg-gray-100 opacity-50 cursor-not-allowed'
                          }`}
                        >
                          <div className="space-y-2">
                            <p className="font-medium text-sm truncate">{player.name}</p>
                            <div className="flex items-center justify-center space-x-1">
                              <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded text-xs font-semibold">
                                {player.skillLevel}
                              </span>
                              {player.isGuest && (
                                <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded text-xs">
                                  게스트
                                </span>
                              )}
                            </div>
                            {isSelected && (
                              <div className="text-blue-500">
                                <svg className="h-5 w-5 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              </div>
                            )}
                          </div>
                        </button>
                      );
                    });

                    return cards;
                  })()}
                </div>

                {/* 게임 매칭 버튼 */}
                <div className="mt-8 pt-6 border-t border-gray-300">
                  <button
                    onClick={() => selectedPlayers.length === 4 && setShowCourtSelection(true)}
                    disabled={selectedPlayers.length !== 4}
                    className={`w-full font-bold py-4 px-6 rounded-xl transition-all duration-200 flex items-center justify-center space-x-3 text-xl ${
                      selectedPlayers.length === 4
                        ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white cursor-pointer'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span>게임 매칭 ({selectedPlayers.length}/4)</span>
                  </button>
                </div>
              </div>
            ) : (
              /* 일반 코트 현황 */
              (() => {
              const { grid, rows, cols } = createDynamicGrid();

              if (grid.length === 0) {
                return (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="text-6xl mb-4">🏸</div>
                      <p className="text-xl text-gray-500">설정에서 코트를 활성화해주세요</p>
                    </div>
                  </div>
                );
              }

              // 그리드 크기에 따른 동적 스타일 계산
              const getDynamicStyles = (rows: number, cols: number) => {
                const totalCells = rows * cols;

                // 기본 최소 높이 계산 (화면 크기와 그리드 크기에 따라)
                // 서버 사이드 렌더링 호환성을 위해 window 객체 체크
                const windowHeight = typeof window !== 'undefined' ? window.innerHeight : 800;
                const baseMinHeight = Math.max(250, Math.min(400, (windowHeight - 200) / rows));

                // 글씨 크기 계산
                const getTextSizes = () => {
                  if (totalCells <= 4) {
                    return {
                      courtName: 'text-4xl',
                      timer: 'text-xl',
                      playerName: 'text-3xl font-black', // 텍스트 크기 최대화: 5xl → 8xl
                      waitingTitle: 'text-2xl',
                      waitingPlayer: 'text-3xl font-black', // 게임중과 동일한 크기
                      emptyTitle: 'text-3xl',
                      emptySubtitle: 'text-xl',
                      padding: 'p-8',
                      playerPadding: 'px-1 py-4', // 패딩 최소화
                      gap: 'gap-8'
                    };
                  } else if (totalCells <= 9) {
                    return {
                      courtName: 'text-3xl',
                      timer: 'text-lg',
                      playerName: 'text-4xl font-black', // 텍스트 크기 최대화: 7xl → 8xl
                      waitingTitle: 'text-xl',
                      waitingPlayer: 'text-4xl font-black', // 게임중과 동일한 크기
                      emptyTitle: 'text-2xl',
                      emptySubtitle: 'text-lg',
                      padding: 'p-2',
                      playerPadding: 'px-2 py-4', // 패딩 최소화
                      gap: 'gap-5'
                    };
                  } else {
                    return {
                      courtName: 'text-2xl',
                      timer: 'text-base',
                      playerName: 'text-5xl font-bold', // 텍스트 크기 증가: 3xl → 5xl
                      waitingTitle: 'text-lg',
                      waitingPlayer: 'text-5xl font-bold', // 게임중과 동일한 크기
                      emptyTitle: 'text-xl',
                      emptySubtitle: 'text-base',
                      padding: 'p-4',
                      playerPadding: 'px-1 py-2', // 패딩 최소화
                      gap: 'gap-4'
                    };
                  }
                };

                return {
                  minHeight: baseMinHeight,
                  textSizes: getTextSizes()
                };
              };

              const { minHeight, textSizes } = getDynamicStyles(rows, cols);

              return (
                <div
                  className={`${textSizes.gap} h-full`}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
                    gridTemplateRows: `repeat(${rows}, minmax(${minHeight}px, 1fr))`
                  }}
                >
                  {grid.map((row, rowIndex) =>
                    row.map((court, colIndex) => (
                      <div key={`${rowIndex}-${colIndex}`} className="w-full h-full">
                        {court ? (
                          <button
                            onClick={() => {
                              setSelectedCourt(court);
                              setIsCourtExpanded(false);
                            }}
                            className={`w-full h-full ${textSizes.padding} rounded-xl font-medium transition-all duration-300 hover:scale-105 hover:shadow-xl flex flex-col bg-white border-2 shadow-lg`}
                            style={{
                              borderColor: court.currentGame
                                ? '#10b981' // 게임 중 - 초록색
                                : court.nextGame
                                ? '#f59e0b' // 대기 중 - 주황색
                                : '#d1d5db' // 비어있음 - 회색
                            }}
                          >
                            <div className="h-full flex flex-col">
                              {/* 헤더: 코트 이름 + 타이머 */}
                              <div className="flex items-center justify-between mb-4">
                                <h3 className={`${textSizes.courtName} font-bold text-gray-800`}>{court.name}</h3>
                                {court.currentGame && (
                                  <ClientOnly fallback={<span className={`font-mono ${textSizes.timer} bg-green-100 px-3 py-1 rounded-full`}>00:00</span>}>
                                    <span className={`font-mono ${textSizes.timer} bg-green-100 text-green-700 px-3 py-1 rounded-full font-bold`}>
                                      {court.currentGame.startTime ? getElapsedTime(court.currentGame.startTime) : '00:00'}
                                    </span>
                                  </ClientOnly>
                                )}
                              </div>

                              {courtDisplayMode === 'players' ? (
                                /* 플레이어 선택 모드 - 전체 코트 영역을 플레이어 카드로 대체 */
                                <div className="w-full h-full p-6 bg-blue-50 rounded-xl overflow-y-auto">
                                  {/* 게임 타입 필터 버튼 */}
                                  <div className="flex justify-center gap-3 mb-6">
                                    {[
                                      { key: 'men_doubles', label: '남복' },
                                      { key: 'women_doubles', label: '여복' },
                                      { key: 'mixed_doubles', label: '혼복!' }
                                    ].map(({ key, label }) => (
                                      <button
                                        key={key}
                                        onClick={() => {
                                          setGameTypeFilter(key as typeof gameTypeFilter);
                                          setSelectedPlayers([]);
                                        }}
                                        className={`px-6 py-3 text-lg rounded-xl font-medium transition-colors ${
                                          gameTypeFilter === key
                                            ? 'bg-blue-500 text-white'
                                            : 'bg-white text-gray-600 hover:bg-blue-100'
                                        }`}
                                      >
                                        {label}
                                      </button>
                                    ))}
                                  </div>

                                  {/* 선택된 플레이어 수 표시 */}
                                  <div className="text-center mb-6">
                                    <span className="text-xl font-medium text-blue-700">
                                      선택된 플레이어: {selectedPlayers.length}/4
                                    </span>
                                  </div>

                                  {/* 플레이어 카드들 */}
                                  <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
                                    {(() => {
                                      const availablePlayers = getAvailablePlayers();
                                      let currentGender = '';
                                      const cards: React.ReactElement[] = [];

                                      availablePlayers.forEach((player) => {
                                        // 성별이 바뀔 때 구분선 추가 (그리드에서는 전체 너비로)
                                        if (player.gender !== currentGender) {
                                          if (currentGender !== '') {
                                            cards.push(
                                              <div key={`divider-${player.gender}`} className="col-span-full border-t border-gray-300 my-4"></div>
                                            );
                                          }
                                          currentGender = player.gender;
                                          cards.push(
                                            <div key={`header-${player.gender}`} className="col-span-full text-lg font-semibold text-gray-700 mb-4">
                                              {player.gender === 'male' ? '👨 남성' : '👩 여성'}
                                            </div>
                                          );
                                        }

                                        const isSelected = selectedPlayers.includes(player.id);
                                        const canSelect = selectedPlayers.length < 4 || isSelected;

                                        cards.push(
                                          <button
                                            key={player.id}
                                            onClick={() => {
                                              if (isSelected) {
                                                setSelectedPlayers(prev => prev.filter(id => id !== player.id));
                                              } else if (selectedPlayers.length < 4) {
                                                setSelectedPlayers(prev => [...prev, player.id]);
                                              }
                                            }}
                                            disabled={!canSelect}
                                            className={`p-4 rounded-xl border-2 transition-all text-center ${
                                              isSelected
                                                ? 'border-blue-500 bg-blue-100 text-blue-800'
                                                : canSelect
                                                ? 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50'
                                                : 'border-gray-200 bg-gray-100 opacity-50 cursor-not-allowed'
                                            }`}
                                          >
                                            <div className="space-y-2">
                                              <p className="font-medium text-sm truncate">{player.name}</p>
                                              <div className="flex items-center justify-center space-x-1">
                                                <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded text-xs font-semibold">
                                                  {player.skillLevel}
                                                </span>
                                                {player.isGuest && (
                                                  <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded text-xs">
                                                    게스트
                                                  </span>
                                                )}
                                              </div>
                                              {isSelected && (
                                                <div className="text-blue-500">
                                                  <svg className="h-5 w-5 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                  </svg>
                                                </div>
                                              )}
                                            </div>
                                          </button>
                                        );
                                      });

                                      return cards;
                                    })()}
                                  </div>

                                  {/* 게임 매칭 버튼 */}
                                  {selectedPlayers.length === 4 && (
                                    <div className="mt-8 pt-6 border-t border-gray-300">
                                      <button
                                        onClick={() => setShowCourtSelection(true)}
                                        className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-4 px-6 rounded-xl transition-all duration-200 flex items-center justify-center space-x-3 text-xl"
                                      >
                                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                        </svg>
                                        <span>게임 매칭</span>
                                      </button>
                                    </div>
                                  )}
                                </div>
                              ) : courtDisplayMode === 'waiting' ? (
                                /* 대기 모드: 대기자만 표시 */
                                court.nextGame ? (
                                  <div className="flex-1 flex items-center justify-center">
                                    <div className="text-center w-full">
                                      {/* <div className={`${textSizes.waitingTitle} text-orange-700 mb-4 font-semibold`}>⏳ 대기 중인 게임</div> */}
                                      <div className={`grid grid-cols-2 ${textSizes.gap}`}>
                                        {court.nextGame.playerNames.map((name, index) => {
                                          const cellCount = rows * cols;
                                          const maxLength = cellCount <= 4 ? 12 : cellCount <= 9 ? 10 : 8;
                                          const displayName = name.length > maxLength
                                            ? name.substring(0, maxLength - 2) + '...'
                                            : name;

                                          return (
                                            <div
                                              key={index}
                                              className={`bg-orange-50 text-orange-800 rounded-xl ${textSizes.playerPadding} text-center ${textSizes.waitingPlayer} border-2 border-orange-200 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105`}
                                              title={name}
                                            >
                                              <div className="truncate px-1">{displayName}</div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex-1 flex items-center justify-center">
                                    <div className={`text-center ${textSizes.padding} rounded-xl bg-gray-50 border-2 border-dashed border-gray-300`}>
                                      <div className={`${textSizes.emptyTitle} text-gray-600 font-semibold mb-2`}>대기자 없음</div>
                                      <div className={`${textSizes.emptySubtitle} text-gray-500`}>예약 게임 없음</div>
                                    </div>
                                  </div>
                                )
                              ) : (
                                /* 일반 모드: 현재 게임 우선 표시 */
                                court.currentGame ? (
                                  /* 현재 게임 플레이어들 */
                                <div className="flex-1 flex items-center justify-center">
                                  <div className={`grid grid-cols-2 ${textSizes.gap} w-full`}>
                                    {court.currentGame.playerNames.map((name, index) => {
                                      // 이름 길이에 따른 동적 표시 (전체화면에서는 더 관대하게)
                                      const cellCount = rows * cols;
                                      const maxLength = cellCount <= 4 ? 12 : cellCount <= 9 ? 10 : 8;
                                      const displayName = name.length > maxLength
                                        ? name.substring(0, maxLength - 2) + '...'
                                        : name;

                                      return (
                                        <div
                                          key={index}
                                          className={`bg-green-50 text-green-800 rounded-xl ${textSizes.playerPadding} text-center ${textSizes.playerName} border-2 border-green-200 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105`}
                                          title={name} // 전체 이름을 툴팁으로 표시
                                        >
                                          <div className="truncate px-1">{displayName}</div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              ) : court.nextGame ? (
                                /* 대기 중인 게임 */
                                <div className="flex-1 flex items-center justify-center">
                                  <div className="text-center">
                                    <div className={`${textSizes.waitingTitle} text-orange-700 mb-4 font-semibold`}>⏳ 대기 중인 게임</div>
                                    <div className={`grid grid-cols-2 ${textSizes.gap}`}>
                                      {court.nextGame.playerNames.map((name, index) => {
                                        // 이름 길이에 따른 동적 표시
                                        const cellCount = rows * cols;
                                        const maxLength = cellCount <= 4 ? 12 : cellCount <= 9 ? 10 : 8;
                                        const displayName = name.length > maxLength
                                          ? name.substring(0, maxLength - 2) + '...'
                                          : name;

                                        return (
                                          <div
                                            key={index}
                                            className={`bg-orange-50 text-orange-800 rounded-xl ${textSizes.playerPadding} text-center ${textSizes.waitingPlayer} border-2 border-orange-200 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105`}
                                            title={name} // 전체 이름을 툴팁으로 표시
                                          >
                                            <div className="truncate px-1">{displayName}</div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                /* 빈 코트일 때 안내 */
                                <div className="flex-1 flex items-center justify-center">
                                  <div className={`text-center ${textSizes.padding} rounded-xl bg-gray-50 border-2 border-dashed border-gray-300`}>
                                    <div className={`${textSizes.emptyTitle} text-gray-600 font-semibold mb-2`}>사용 가능</div>
                                    <div className={`${textSizes.emptySubtitle} text-gray-500`}>클릭하여 게임 시작</div>
                                  </div>
                                </div>
                              )
                              )}
                            </div>
                          </button>
                        ) : (
                          <div className="w-full h-full"></div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              );
              })()
            )}
          </div>
          </div>
        </ClientOnly>
      )}

      {/* 확장형 출석체크 모달 */}
      {isAttendanceExpanded && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[95vw] h-[95vh] flex flex-col">
            {/* 헤더 */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="bg-green-100 p-2 rounded-full">
                  <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">빠른 출석체크</h2>
                  <p className="text-sm text-gray-600">회원 이름을 클릭하여 출석체크를 진행하세요</p>
                </div>
              </div>
              <button
                onClick={() => setIsAttendanceExpanded(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <ArrowsPointingInIcon className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            {/* 출석 현황 */}
            <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  오늘 출석: <span className="font-semibold text-green-600">{todayAttendance.length}명</span>
                </div>
                <div className="text-sm text-gray-600">
                  미출석: <span className="font-semibold text-orange-600">{members.length - todayAttendance.length}명</span>
                </div>
              </div>
            </div>

            {/* 회원 목록 */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 2xl:grid-cols-14 gap-3">
                {members
                  .filter(member => !todayAttendance.some(att => att.memberId === member.id))
                  .sort((a, b) => a.name.localeCompare(b.name, 'ko'))
                  .map((member) => (
                    <button
                      key={member.id}
                      onClick={() => {
                        setSelectedMemberForAttendance(member);
                        setIsShuttlecockModalOpen(true);
                      }}
                      className="bg-white border-2 border-gray-200 hover:border-green-400 hover:bg-green-50 rounded-lg p-3 transition-all duration-200 hover:scale-105 hover:shadow-lg group aspect-square flex flex-col justify-center"
                    >
                      <div className="text-center">
                        <div className="text-xl font-black text-gray-800 group-hover:text-green-700 leading-tight break-keep">
                          {member.name}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {member.gender === 'male' ? '남' : '여'} · {member.skillLevel}
                        </div>
                      </div>
                    </button>
                  ))}
              </div>

              {/* 이미 출석한 회원들 */}
              {todayAttendance.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">오늘 출석 완료</h3>
                  <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 2xl:grid-cols-14 gap-3">
                    {todayAttendance
                      .sort((a, b) => a.memberName.localeCompare(b.memberName, 'ko'))
                      .map((attendance) => (
                        <div
                          key={attendance.id}
                          className="bg-green-50 border-2 border-green-200 rounded-lg p-3 opacity-75 aspect-square flex flex-col justify-center"
                        >
                          <div className="text-center">
                            <div className="text-xl font-black text-green-700 leading-tight break-keep">
                              {attendance.memberName}
                            </div>
                            <div className="text-xs text-green-600 mt-1">
                              셔틀콕 {attendance.shuttlecockCount}개
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 셔틀콕 개수 선택 모달 */}
      {isShuttlecockModalOpen && selectedMemberForAttendance && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {selectedMemberForAttendance.name} 출석체크
              </h3>
              <p className="text-gray-600 mb-6">셔틀콕 개수를 선택해주세요</p>

              <div className="grid grid-cols-3 gap-3 mb-6">
                {[0, 1, 2, 3, 4, 5].map((count) => (
                  <button
                    key={count}
                    onClick={async () => {
                      try {
                        await actions.addAttendance(
                          selectedMemberForAttendance.id,
                          selectedMemberForAttendance.name,
                          count
                        );
                        setIsShuttlecockModalOpen(false);
                        setSelectedMemberForAttendance(null);
                      } catch (error) {
                        console.error('출석체크 실패:', error);
                        alert('출석체크에 실패했습니다.');
                      }
                    }}
                    className="bg-green-100 hover:bg-green-200 text-green-800 font-bold py-4 px-6 rounded-xl transition-colors text-lg"
                  >
                    {count}개
                  </button>
                ))}
              </div>

              <button
                onClick={() => {
                  setIsShuttlecockModalOpen(false);
                  setSelectedMemberForAttendance(null);
                }}
                className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-3 px-4 rounded-xl transition-colors"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QR 코드 모달 */}
      {showQRCode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full relative">
            <button
              onClick={() => setShowQRCode(false)}
              className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors z-10"
            >
              <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <QRCodeGenerator
              url={`${typeof window !== 'undefined' ? window.location.origin : 'https://nmdr.vercel.app'}/checkin`}
              title="셀프 출석체크"
            />
          </div>
        </div>
      )}

      {/* 코트 선택 모달 */}
      {showCourtSelection && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">코트 선택</h2>
              <button
                onClick={() => setShowCourtSelection(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6">
              <div className="mb-4">
                <h3 className="text-lg font-medium text-gray-900 mb-2">선택된 플레이어</h3>
                <div className="grid grid-cols-2 gap-2">
                  {selectedPlayers.map(playerId => {
                    const availablePlayers = getAvailablePlayers();
                    const player = availablePlayers.find(p => p.id === playerId);
                    return player ? (
                      <div key={playerId} className="bg-blue-50 p-2 rounded-lg text-center">
                        <span className="font-medium">{player.name}</span>
                        <span className="text-sm text-gray-600 ml-2">({player.skillLevel}조)</span>
                      </div>
                    ) : null;
                  })}
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-lg font-medium text-gray-900">코트 선택</h3>
                {courts.map(court => {
                  const isPlaying = court.currentGame && court.currentGame.players && court.currentGame.players.length > 0;
                  const hasReservation = court.nextGame && court.nextGame.players && court.nextGame.players.length > 0;
                  const isFull = isPlaying && hasReservation;

                  let status = '';
                  let statusColor = '';
                  let buttonClass = '';

                  if (isFull) {
                    status = '예약 가득참';
                    statusColor = 'text-red-600';
                    buttonClass = 'bg-gray-100 text-gray-400 cursor-not-allowed';
                  } else if (isPlaying) {
                    status = '진행 중 (예약 가능)';
                    statusColor = 'text-orange-600';
                    buttonClass = 'bg-orange-50 hover:bg-orange-100 text-orange-700 border-orange-200';
                  } else {
                    status = '사용 가능';
                    statusColor = 'text-green-600';
                    buttonClass = 'bg-green-50 hover:bg-green-100 text-green-700 border-green-200';
                  }

                  return (
                    <button
                      key={court.id}
                      onClick={() => {
                        if (!isFull) {
                          handleCourtSelection(court.id);
                        }
                      }}
                      disabled={isFull}
                      className={`w-full p-4 rounded-lg border-2 transition-all text-left ${buttonClass}`}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-semibold text-lg">{court.name}</h4>
                          <p className={`text-sm ${statusColor}`}>{status}</p>
                        </div>
                        <div className="text-right">
                          {isPlaying && (
                            <div className="text-xs text-gray-500">
                              현재: {court.currentGame?.playerNames?.join(', ')}
                            </div>
                          )}
                          {hasReservation && (
                            <div className="text-xs text-gray-500">
                              예약: {court.nextGame?.playerNames?.join(', ')}
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="p-4 bg-gray-50 border-t">
              <button
                onClick={() => setShowCourtSelection(false)}
                className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-lg transition-colors"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}