import { Member } from '@/types';

// 실력 등급별 MMR 구간
export const SKILL_LEVEL_RANGES = {
  S: { min: 2400, max: 3000, label: '준프로' },
  A: { min: 2000, max: 2399, label: '고수' },
  B: { min: 1600, max: 1999, label: '중상급자' },
  C: { min: 1200, max: 1599, label: '중급자' },
  D: { min: 800, max: 1199, label: '초중급' },
  E: { min: 400, max: 799, label: '초심자' },
  F: { min: 0, max: 399, label: '완전 초보' }
} as const;

// MMR에 따른 실력 등급 계산
export function getSkillLevelFromMMR(mmr: number): Member['skillLevel'] {
  if (mmr >= 2400) return 'S';
  if (mmr >= 2000) return 'A';
  if (mmr >= 1600) return 'B';
  if (mmr >= 1200) return 'C';
  if (mmr >= 800) return 'D';
  if (mmr >= 400) return 'E';
  return 'F';
}

// 실력 등급에 따른 기본 MMR 계산
export function getDefaultMMRForSkillLevel(skillLevel: Member['skillLevel']): number {
  const range = SKILL_LEVEL_RANGES[skillLevel];
  return Math.floor((range.min + range.max) / 2);
}

// Elo Rating 시스템을 이용한 MMR 계산
export function calculateNewMMR(
  playerMMR: number,
  opponentMMR: number,
  won: boolean,
  kFactor: number = 32
): number {
  // 기대 승률 계산
  const expectedScore = 1 / (1 + Math.pow(10, (opponentMMR - playerMMR) / 400));
  
  // 실제 결과 (승리: 1, 패배: 0)
  const actualScore = won ? 1 : 0;
  
  // 새로운 MMR 계산
  const newMMR = playerMMR + kFactor * (actualScore - expectedScore);
  
  // MMR은 0 이하로 내려가지 않도록 제한
  return Math.max(0, Math.round(newMMR));
}

// MMR 시스템 제거됨 - 팀 평균 MMR 계산 함수 제거

// MMR 시스템 제거됨 - 게임 결과에 따른 MMR 업데이트 계산 함수 제거
export function calculateGameMMRChanges(): { playerId: string; oldMMR: number; newMMR: number; change: number }[] {
  // MMR 시스템이 제거되어 빈 배열 반환
  return [];
}

// 승률 계산
export function calculateWinRate(gamesWon: number, gamesPlayed: number): number {
  if (gamesPlayed === 0) return 0;
  return Math.round((gamesWon / gamesPlayed) * 100);
}

// 실력 등급별 색상 반환
export function getSkillLevelColor(skillLevel: Member['skillLevel']): string {
  switch (skillLevel) {
    case 'S': return 'bg-purple-100 text-purple-800';
    case 'A': return 'bg-red-100 text-red-800';
    case 'B': return 'bg-orange-100 text-orange-800';
    case 'C': return 'bg-yellow-100 text-yellow-800';
    case 'D': return 'bg-green-100 text-green-800';
    case 'E': return 'bg-blue-100 text-blue-800';
    case 'F': return 'bg-gray-100 text-gray-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}

// MMR 시스템 제거됨 - 팀 밸런스 계산 함수 제거
export function calculateTeamBalance(): {
  team1AvgMMR: number;
  team2AvgMMR: number;
  mmrDifference: number;
  isBalanced: boolean;
} {
  // MMR 시스템이 제거되어 기본값 반환
  return {
    team1AvgMMR: 0,
    team2AvgMMR: 0,
    mmrDifference: 0,
    isBalanced: true
  };
}
