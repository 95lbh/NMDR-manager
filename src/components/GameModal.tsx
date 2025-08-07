'use client';

import { useState } from 'react';
import { XMarkIcon, PlayIcon, StopIcon, ClockIcon } from '@heroicons/react/24/outline';
import { Court, Game, Member, Attendance, GameType } from '@/types';
import { SKILL_LEVEL_RANGES } from '@/lib/mmr';
import { gameService } from '@/lib/firestore';

interface GameModalProps {
  court: Court;
  courts: Court[];
  onClose: () => void;
  onGameUpdate: (courtId: string, currentGame: Game | null, nextGame?: Game | null) => void;
  attendees: Attendance[];
  members: Member[];
}

export default function GameModal({ court, courts, onClose, onGameUpdate, attendees, members }: GameModalProps) {

  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [gameType, setGameType] = useState<GameType>('mixed_doubles');
  const [winners, setWinners] = useState<string[]>([]);
  const [showWinnerSelection, setShowWinnerSelection] = useState(false);


  // 출석한 모든 플레이어 (회원 + 게스트) 생성 (집에 간 사람 제외)
  const availablePlayers = attendees
    .filter(attendee => !attendee.hasLeft) // 집에 간 사람들 제외
    .map(attendee => {
    // 회원인 경우 회원 정보 사용
    const member = members.find(m => m.id === attendee.memberId);
    if (member) {
      return {
        id: member.id,
        name: member.name,
        gender: member.gender,
        skillLevel: member.skillLevel,
        isGuest: false
      };
    }

    // 게스트인 경우 저장된 정보 사용
    const skillLevel = attendee.guestInfo?.skillLevel || 'C';
    const mmr = SKILL_LEVEL_RANGES[skillLevel]?.min || 1200; // 실력 수준의 최소 MMR

    return {
      id: attendee.memberId,
      name: attendee.memberName,
      gender: attendee.guestInfo?.gender || 'male',
      skillLevel,
      mmr,
      isGuest: true
    };
  });

  // 모든 코트에서 현재 게임 중인 플레이어들 수집
  const allPlayingPlayers = courts
    .filter(c => c.currentGame && c.currentGame.status === 'playing')
    .flatMap(c => c.currentGame!.players);

  // 현재 게임 중이 아닌 플레이어들만 필터링
  const freePlayers = availablePlayers.filter(player =>
    !allPlayingPlayers.includes(player.id)
  );

  // 게임 타입에 따른 플레이어 필터링
  const filteredPlayers = freePlayers.filter(player => {
    if (gameType === 'men_doubles') {
      return player.gender === 'male';
    } else if (gameType === 'women_doubles') {
      return player.gender === 'female';
    }
    // 혼합 복식의 경우 모든 성별 포함
    return true;
  });

  const handlePlayerSelect = (memberId: string) => {
    if (selectedPlayers.includes(memberId)) {
      setSelectedPlayers(selectedPlayers.filter(id => id !== memberId));
    } else if (selectedPlayers.length < 4) {
      setSelectedPlayers([...selectedPlayers, memberId]);
    }
  };

  // 실력 등급을 숫자로 변환 (S=7, A=6, B=5, C=4, D=3, E=2, F=1)
  const getSkillLevelValue = (skillLevel: string): number => {
    const skillMap: { [key: string]: number } = {
      'S': 7, 'A': 6, 'B': 5, 'C': 4, 'D': 3, 'E': 2, 'F': 1
    };
    return skillMap[skillLevel] || 4; // 기본값 C
  };

  // 조합의 품질을 평가하는 함수 (낮을수록 좋음)
  const evaluateCombinationQuality = (players: typeof filteredPlayers): number => {
    const skills = players.map(p => getSkillLevelValue(p.skillLevel));

    // 1. 실력 차이의 표준편차 (팀 내 균형)
    const avg = skills.reduce((sum, skill) => sum + skill, 0) / skills.length;
    const variance = skills.reduce((sum, skill) => sum + Math.pow(skill - avg, 2), 0) / skills.length;
    const stdDev = Math.sqrt(variance);

    // 2. 최대-최소 실력 차이 (극단적 조합 방지)
    const maxSkill = Math.max(...skills);
    const minSkill = Math.min(...skills);
    const skillRange = maxSkill - minSkill;

    // 3. 실력 차이가 3 이상인 경우 페널티 (예: A등급(6)과 D등급(3) 이상 차이)
    const extremePenalty = skillRange >= 3 ? skillRange * 2 : 0;

    // 종합 점수: 표준편차 + 실력 범위 + 극단 페널티
    return stdDev + skillRange * 0.5 + extremePenalty;
  };

  // 자동 추천 조합 생성 (개선된 알고리즘)
  const generateRecommendedTeam = () => {
    if (gameType === 'mixed_doubles') {
      // 혼합 복식: 남자 2명, 여자 2명
      const malePlayers = filteredPlayers.filter(p => p.gender === 'male');
      const femalePlayers = filteredPlayers.filter(p => p.gender === 'female');

      if (malePlayers.length < 2 || femalePlayers.length < 2) {
        alert('혼합 복식을 위해서는 남자 최소 2명, 여자 최소 2명이 필요합니다.');
        return;
      }

      let selectedMales: typeof malePlayers = [];
      let selectedFemales: typeof femalePlayers = [];

      if (malePlayers.length === 2) {
        selectedMales = malePlayers;
      } else {
        // 모든 가능한 남자 2명 조합 평가
        const maleCombinations: { combination: typeof malePlayers, quality: number }[] = [];

        for (let i = 0; i < malePlayers.length - 1; i++) {
          for (let j = i + 1; j < malePlayers.length; j++) {
            const combination = [malePlayers[i], malePlayers[j]];
            const quality = evaluateCombinationQuality(combination);
            maleCombinations.push({ combination, quality });
          }
        }

        // 품질 기준으로 정렬하고 상위 조합들 중 랜덤 선택
        maleCombinations.sort((a, b) => a.quality - b.quality);
        const bestQuality = maleCombinations[0].quality;
        const goodCombinations = maleCombinations.filter(c => Math.abs(c.quality - bestQuality) < 0.5);

        const randomMaleCombination = goodCombinations[Math.floor(Math.random() * goodCombinations.length)];
        selectedMales = randomMaleCombination.combination;
      }

      if (femalePlayers.length === 2) {
        selectedFemales = femalePlayers;
      } else {
        // 모든 가능한 여자 2명 조합 평가
        const femaleCombinations: { combination: typeof femalePlayers, quality: number }[] = [];

        for (let i = 0; i < femalePlayers.length - 1; i++) {
          for (let j = i + 1; j < femalePlayers.length; j++) {
            const combination = [femalePlayers[i], femalePlayers[j]];
            const quality = evaluateCombinationQuality(combination);
            femaleCombinations.push({ combination, quality });
          }
        }

        // 품질 기준으로 정렬하고 상위 조합들 중 랜덤 선택
        femaleCombinations.sort((a, b) => a.quality - b.quality);
        const bestQuality = femaleCombinations[0].quality;
        const goodCombinations = femaleCombinations.filter(c => Math.abs(c.quality - bestQuality) < 0.5);

        const randomFemaleCombination = goodCombinations[Math.floor(Math.random() * goodCombinations.length)];
        selectedFemales = randomFemaleCombination.combination;
      }

      setSelectedPlayers([...selectedMales.map(p => p.id), ...selectedFemales.map(p => p.id)]);
    } else {
      // 남자 복식 또는 여자 복식
      if (filteredPlayers.length < 4) {
        alert(`${gameType === 'men_doubles' ? '남자' : '여자'} 복식을 위해서는 최소 4명이 필요합니다.`);
        return;
      }

      if (filteredPlayers.length === 4) {
        setSelectedPlayers(filteredPlayers.map(p => p.id));
        return;
      }

      // 모든 가능한 4명 조합 평가
      const allCombinations: { combination: typeof filteredPlayers, quality: number }[] = [];

      // 모든 4명 조합을 확인하고 품질 평가
      for (let i = 0; i < filteredPlayers.length - 3; i++) {
        for (let j = i + 1; j < filteredPlayers.length - 2; j++) {
          for (let k = j + 1; k < filteredPlayers.length - 1; k++) {
            for (let l = k + 1; l < filteredPlayers.length; l++) {
              const combination = [filteredPlayers[i], filteredPlayers[j], filteredPlayers[k], filteredPlayers[l]];
              const quality = evaluateCombinationQuality(combination);
              allCombinations.push({ combination, quality });
            }
          }
        }
      }

      // 품질 기준으로 정렬하고 상위 조합들 중 랜덤 선택
      allCombinations.sort((a, b) => a.quality - b.quality);
      const bestQuality = allCombinations[0].quality;
      const goodCombinations = allCombinations.filter(c => Math.abs(c.quality - bestQuality) < 0.5);

      const randomCombination = goodCombinations[Math.floor(Math.random() * goodCombinations.length)];
      setSelectedPlayers(randomCombination.combination.map(p => p.id));
    }
  };

  const handleStartGame = async () => {
    if (selectedPlayers.length !== 4) {
      alert('복식 게임을 위해 정확히 4명의 플레이어를 선택해주세요.');
      return;
    }

    const selectedPlayerData = selectedPlayers.map(id =>
      availablePlayers.find(p => p.id === id)!
    );

    const playerNames = selectedPlayerData.map(p => p.name);

    const newGame: Game = {
      id: `game-${Date.now()}`,
      courtId: court.id,
      type: gameType,
      players: selectedPlayers,
      playerNames,
      status: 'playing',
      startTime: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Firebase에 게임 저장 후 상태 업데이트
    try {
      const gameId = await gameService.createGame(newGame);
      const gameWithId = { ...newGame, id: gameId };
      onGameUpdate(court.id, gameWithId);
      setSelectedPlayers([]);
      alert('게임이 시작되었습니다!');
    } catch (error) {
      console.error('게임 시작 실패:', error);
      alert('게임 시작에 실패했습니다.');
    }
  };

  const handleReserveGame = async () => {
    if (selectedPlayers.length !== 4) {
      alert('복식 게임을 위해 정확히 4명의 플레이어를 선택해주세요.');
      return;
    }

    try {
      // 기존 예약이 있으면 먼저 삭제
      if (court.nextGame) {
        await gameService.deleteGame(court.nextGame.id);
      }

      const selectedPlayerData = selectedPlayers.map(id =>
        availablePlayers.find(p => p.id === id)!
      );

      const playerNames = selectedPlayerData.map(p => p.name);

      const reservedGame: Game = {
        id: '', // Firebase에서 생성될 ID
        courtId: court.id,
        players: selectedPlayers,
        playerNames,
        type: gameType,
        status: 'waiting',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Firebase에 예약 게임 저장 후 ID 받기
      const gameId = await gameService.createGame(reservedGame);
      const gameWithId = { ...reservedGame, id: gameId };

      // 코트의 nextGame으로 설정
      onGameUpdate(court.id, court.currentGame || null, gameWithId);
      setSelectedPlayers([]);

      const message = court.nextGame
        ? '기존 예약이 새로운 예약으로 변경되었습니다!'
        : '게임이 예약되었습니다!';
      alert(message);
    } catch (error) {
      console.error('게임 예약 실패:', error);
      alert('게임 예약에 실패했습니다.');
    }
  };

  const handleEndGame = () => {
    if (!court.currentGame) return;
    setShowWinnerSelection(true);
  };

  const handleWinnerSelection = async () => {
    // 승자가 0명, 1명, 2명 모두 허용
    if (winners.length > 2) {
      alert('승자는 최대 2명까지 선택할 수 있습니다.');
      return;
    }

    if (!court.currentGame) return;

    try {
      // 현재 게임의 플레이어 정보는 Firebase에서 직접 처리

      // 게임 완료 처리
      const completedGame: Game = {
        ...court.currentGame,
        status: 'completed',
        endTime: new Date(),
        winners: winners.length > 0 ? winners : undefined, // 승자가 없으면 undefined
        winnerNames: winners.length > 0 ? winners.map(id => {
          const player = availablePlayers.find(p => p.id === id);
          return player?.name || '';
        }) : undefined,
        updatedAt: new Date()
      };

      // 전적 업데이트를 위한 정보 수집 (게스트 포함)
      const statsMessage = '';

      // 승자가 있는 경우 전적 업데이트
      if (winners.length > 0) {
        // 전적 업데이트 로직은 주석 처리되어 있음
        // 향후 MMR 시스템 구현 시 사용 예정

        // 전적 업데이트 메시지 생성
        // statsMessage = '\n\n📊 전적 업데이트:\n';
        // if (winnerPlayers.length > 0) {
        //   // statsMessage += '🏆 승리:\n';
        //   winnerPlayers.forEach(player => {
        //     if (!player.isGuest) {
        //       const member = members.find(m => m.id === player.id);
        //       if (member) {
        //         statsMessage += `  ${player.name}: ${member.gamesWon + 1}승 ${member.gamesPlayed + 1 - (member.gamesWon + 1)}패 (${member.gamesPlayed + 1}경기)\n`;
        //       }
        //     } else {
        //       // statsMessage += `  ${player.name}: 게스트 (전적 미기록)\n`;
        //     }
        //   });
        // }
        // if (loserPlayers.length > 0) {
        //   statsMessage += '😔 패배:\n';
        //   loserPlayers.forEach(player => {
        //     if (!player.isGuest) {
        //       const member = members.find(m => m.id === player.id);
        //       if (member) {
        //         statsMessage += `  ${player.name}: ${member.gamesWon}승 ${member.gamesPlayed + 1 - member.gamesWon}패 (${member.gamesPlayed + 1}경기)\n`;
        //       }
        //     } else {
        //       statsMessage += `  ${player.name}: 게스트 (전적 미기록)\n`;
        //     }
        //   });
        // }
      }

      // Firebase에 게임 완료 저장
      await gameService.completeGame(completedGame);

      // 다음 예약 게임이 있으면 현재 게임으로 이동
      let nextCurrentGame = null;
      const nextReservedGame = null;

      if (court.nextGame) {
        // 예약된 플레이어들이 다른 코트에서 게임 중인지 확인
        const reservedPlayers = court.nextGame.players;
        let hasConflictingPlayer = false;

        // 다른 코트들을 확인
        for (const otherCourt of courts) {
          if (otherCourt.id !== court.id && otherCourt.currentGame) {
            const conflictingPlayers = otherCourt.currentGame.players.filter(playerId =>
              reservedPlayers.includes(playerId)
            );
            if (conflictingPlayers.length > 0) {
              hasConflictingPlayer = true;
              break;
            }
          }
        }

        if (hasConflictingPlayer) {
          // 충돌하는 플레이어가 있으면 예약 취소
          await gameService.deleteGame(court.nextGame.id);
          alert('예약된 게임의 플레이어가 다른 코트에서 게임 중이어서 예약이 자동 취소되었습니다.');
        } else {
          // 예약 게임을 현재 게임으로 변경
          nextCurrentGame = {
            ...court.nextGame,
            status: 'playing' as const,
            startTime: new Date(),
            updatedAt: new Date()
          };

          // Firebase에서 게임 상태 업데이트
          await gameService.updateGameStatus(court.nextGame.id, 'playing', undefined, undefined);
        }
      }

      // 로컬 상태 업데이트
      onGameUpdate(court.id, nextCurrentGame, nextReservedGame);
      setShowWinnerSelection(false);
      setWinners([]);

      let message = '게임이 완료되었습니다!';
      message = '게임이 종료되었습니다!';

      alert(message + statsMessage);

    } catch (error) {
      console.error('게임 완료 처리 실패:', error);
      alert('게임 완료 처리 중 오류가 발생했습니다.');
    }
  };

  const getGameDuration = () => {
    if (!court.currentGame?.startTime) return '0분';
    const duration = Math.floor((Date.now() - court.currentGame.startTime.getTime()) / 60000);
    return `${duration}분`;
  };

  const getGameLevel = () => {
    if (selectedPlayers.length !== 4) return null;

    const selectedPlayerData = selectedPlayers.map(id =>
      availablePlayers.find(p => p.id === id)!
    );

    // 스킬 레벨을 숫자로 변환 (S=7, A=6, B=5, C=4, D=3, E=2, F=1)
    const skillToNumber = (skill: string) => {
      const skillMap: { [key: string]: number } = { 'S': 7, 'A': 6, 'B': 5, 'C': 4, 'D': 3, 'E': 2, 'F': 1 };
      return skillMap[skill] || 1;
    };

    const totalSkill = selectedPlayerData.reduce((sum, player) => {
      return sum + skillToNumber(player.skillLevel || 'F');
    }, 0);

    const averageSkill = Math.round(totalSkill / 4);

    // 평균 스킬에 따른 게임 수준 결정
    let gameLevel = '';
    if (averageSkill >= 7) gameLevel = 'S조 (준프로)';
    else if (averageSkill >= 6) gameLevel = 'A조 (고수)';
    else if (averageSkill >= 5) gameLevel = 'B조 (중상급)';
    else if (averageSkill >= 4) gameLevel = 'C조 (중급)';
    else if (averageSkill >= 3) gameLevel = 'D조 (초중급)';
    else if (averageSkill >= 2) gameLevel = 'E조 (초심자)';
    else gameLevel = 'F조 (완전 초보)';

    return {
      averageSkill,
      gameLevel,
      hasGuest: selectedPlayerData.some(p => p.isGuest)
    };
  };

  const gameInfo = getGameLevel();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {court.name} 관리
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* 현재 게임 상태 */}
          <div>
              {court.currentGame ? (
                <div className="space-y-4">
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="text-lg font-semibold text-green-800">진행 중인 게임</h3>
                      <div className="flex items-center text-green-600">
                        <ClockIcon className="h-5 w-5 mr-1" />
                        <span>{getGameDuration()}</span>
                      </div>
                    </div>
                    
                    <div className="bg-white p-3 rounded border">
                      <h4 className="font-medium text-gray-700 mb-2">참가자 (4명)</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {court.currentGame.playerNames.map((name, index) => (
                          <div key={index} className="text-sm bg-gray-50 p-2 rounded">
                            {name}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-4 flex justify-end">
                      <button
                        onClick={handleEndGame}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2"
                      >
                        <StopIcon className="h-5 w-5" />
                        <span>게임 종료</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">현재 진행 중인 게임이 없습니다.</p>

                </div>
              )}
          </div>

          {/* 다음 예약 게임 */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">다음 예약 게임</h3>
            {court.nextGame ? (
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-medium text-yellow-800">예약된 게임</h4>
                  <div className="flex space-x-2">
                    <span className="text-sm text-yellow-600 bg-yellow-100 px-2 py-1 rounded">대기 중</span>
                    <button
                      onClick={async () => {
                        try {
                          // Firebase에서 예약 게임 삭제
                          await gameService.deleteGame(court.nextGame!.id);
                          // 로컬 상태 업데이트
                          onGameUpdate(court.id, court.currentGame || null, null);
                          alert('예약이 취소되었습니다.');
                        } catch (error) {
                          console.error('예약 취소 실패:', error);
                          alert('예약 취소에 실패했습니다.');
                        }
                      }}
                      className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded hover:bg-red-200"
                    >
                      예약 취소
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-3 border border-yellow-100">
                  <h5 className="font-medium text-gray-700 mb-2">참가자 (4명)</h5>
                  <div className="grid grid-cols-2 gap-2">
                    {court.nextGame.playerNames.map((name, index) => (
                      <div key={index} className="text-sm bg-yellow-50 text-yellow-800 p-2 rounded border border-yellow-200">
                        {name}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-3 text-xs text-yellow-700 bg-yellow-100 p-2 rounded">
                  💡 새로운 플레이어 4명을 선택하고 &quot;예약 변경&quot; 버튼을 클릭하면 기존 예약을 덮어씁니다.
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <div className="text-2xl mb-2">📅</div>
                <div>예약된 게임이 없습니다.</div>
                <div className="text-xs mt-1">플레이어 4명을 선택하고 예약해보세요.</div>
              </div>
            )}
          </div>

          {/* 새 게임 시작/예약 */}
          <div>
            <div className="space-y-6">
              {/* {court.currentGame && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-yellow-800">현재 게임이 진행 중입니다. 게임을 종료한 후 새 게임을 시작할 수 있습니다.</p>
                </div>
              )} */}

              <div>
                {/* 게임 타입 선택 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    게임 타입
                  </label>
                  <select
                    value={gameType}
                    onChange={(e) => {
                      setGameType(e.target.value as GameType);
                      setSelectedPlayers([]); // 게임 타입 변경 시 선택 초기화
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="mixed_doubles">혼합 복식</option>
                    <option value="men_doubles">남자 복식</option>
                    <option value="women_doubles">여자 복식</option>
                  </select>
                </div>

                {/* 플레이어 선택 */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      플레이어 선택 ({selectedPlayers.length}/4)
                    </label>
                    <button
                      onClick={generateRecommendedTeam}
                      disabled={filteredPlayers.length < 4 || (gameType === 'mixed_doubles' &&
                        (filteredPlayers.filter(p => p.gender === 'male').length < 2 ||
                         filteredPlayers.filter(p => p.gender === 'female').length < 2))}
                      className="px-3 py-1 text-xs bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center space-x-1"
                    >
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      <span>추천 조합</span>
                    </button>
                  </div>

                  {/* 추천 조합 안내 */}
                  {/* {selectedPlayers.length === 4 && (
                    <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <svg className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-sm text-blue-700 font-medium">
                          {selectedPlayers.length === 4 ? '추천 조합이 선택되었습니다!' : '추천 조합 정보'}
                        </span>
                      </div>
                      <p className="text-xs text-blue-600 mt-1">
                        실력 등급을 기반으로 균형 잡힌 팀을 구성했습니다.
                        {gameType === 'mixed_doubles' ? ' 남녀 각 2명씩 선택되었습니다.' : ' 실력이 비슷한 선수들로 구성되었습니다.'}
                        <br />
                        💡 같은 실력의 선수가 많다면 버튼을 다시 눌러 다른 조합을 확인해보세요!
                      </p>
                    </div>
                  )} */}

                  <div className="grid grid-cols-4 gap-2 max-h-96 overflow-y-auto">
                    {filteredPlayers.length > 0 ? (
                      filteredPlayers.map((player) => (
                        <button
                          key={player.id}
                          onClick={() => handlePlayerSelect(player.id)}
                          className={`p-2 text-left rounded-lg border transition-colors ${
                            selectedPlayers.includes(player.id)
                              ? 'bg-blue-100 border-blue-300'
                              : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                          }`}
                        >
                          <div className="flex flex-col space-y-0.5">
                            <div className="font-medium text-xs truncate">
                              {player.name}
                              {player.isGuest && <span className="text-xs text-green-600 ml-1">(게스트)</span>}
                            </div>
                            <div className="text-xs text-gray-600 truncate">
                              {player.skillLevel}조
                            </div>
                            <div className="text-xs text-gray-500">
                              {player.gender === 'male' ? '남' : '여'}
                            </div>
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="col-span-2 text-center py-8 text-gray-500">
                        {gameType === 'men_doubles' && '출석한 남성이 없습니다.'}
                        {gameType === 'women_doubles' && '출석한 여성이 없습니다.'}
                        {gameType === 'mixed_doubles' && '출석한 플레이어가 없습니다.'}
                      </div>
                    )}
                  </div>
                </div>

                {/* 게임 수준 표시 */}
                {selectedPlayers.length === 4 && gameInfo && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-700 mb-2">게임 수준</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">평균 스킬:</span>
                        <span className="font-medium">{gameInfo.averageSkill}/7</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">게임 수준:</span>
                        <span className="font-medium text-blue-600">{gameInfo.gameLevel}</span>
                      </div>
                      {/* {gameInfo.hasGuest && (
                        <div className="text-xs text-yellow-600 bg-yellow-50 p-2 rounded mt-2">
                          💡 게스트 포함 게임: MMR 및 통계 업데이트는 회원만 적용됩니다.
                        </div>
                      )} */}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  {/* 디버깅 정보 */}
                  <div className="text-xs text-gray-500 text-center">
                    선택된 플레이어: {selectedPlayers.length}/4
                  </div>

                  {!court.currentGame && (
                    <button
                      onClick={handleStartGame}
                      disabled={selectedPlayers.length !== 4}
                      className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2"
                    >
                      <PlayIcon className="h-5 w-5" />
                      <span>게임 시작</span>
                    </button>
                  )}

                  {court.currentGame && (
                    <button
                      onClick={handleReserveGame}
                      disabled={selectedPlayers.length !== 4}
                      className="w-full bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2"
                    >
                      <ClockIcon className="h-5 w-5" />
                      <span>
                        {court.nextGame ? '예약 변경' : '다음 게임 예약'} ({selectedPlayers.length}/4)
                      </span>
                    </button>
                  )}

                  {court.nextGame && (
                    <div className="w-full px-4 py-2 bg-yellow-100 border border-yellow-300 text-yellow-800 rounded-lg text-center text-sm">
                      이미 다음 게임이 예약되어 있습니다
                    </div>
                  )}
                </div>
              </div>
          </div>
        </div>
      </div>
    </div>

      {/* 승자 선택 모달 */}
      {showWinnerSelection && court.currentGame && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-60">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">게임 완료</h3>
              <p className="text-gray-600 mb-4">승리한 플레이어를 선택해주세요. (0~2명, 선택하지 않으면 승자 없이 종료)</p>

              {/* 게스트 포함 안내 메시지
              {court.currentGame.players.some(playerId =>
                availablePlayers.find(p => p.id === playerId)?.isGuest
              ) && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                  <p className="text-yellow-800 text-sm">
                    💡 게스트는 승자로 선택되어도 MMR 및 통계에 반영되지 않습니다.
                  </p>
                </div>
              )} */}

              <div className="space-y-2">
                {court.currentGame.players.map((playerId, index) => {
                  const playerName = court.currentGame!.playerNames[index];
                  const player = availablePlayers.find(p => p.id === playerId);
                  const isGuest = player?.isGuest || false;

                  return (
                    <button
                      key={playerId}
                      onClick={() => {
                        if (winners.includes(playerId)) {
                          setWinners(winners.filter(id => id !== playerId));
                        } else if (winners.length < 2) {
                          setWinners([...winners, playerId]);
                        }
                      }}
                      className={`w-full p-3 text-left rounded-lg border transition-colors ${
                        winners.includes(playerId)
                          ? 'bg-green-100 border-green-300'
                          : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                      } ${isGuest ? 'opacity-75' : ''}`}
                    >
                      <div className="flex justify-between items-center">
                        <span>{playerName}</span>
                        {isGuest && (
                          <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">
                            게스트
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="flex space-x-2 mt-6">
                <button
                  onClick={() => {
                    setShowWinnerSelection(false);
                    setWinners([]);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  이전으로
                </button>
                <button
                  onClick={handleWinnerSelection}
                  className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg"
                >
                  완료
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
