// 회원 정보 타입
export interface Member {
  id: string;
  name: string;
  birthYear: number;
  gender: 'male' | 'female';
  skillLevel: 'S' | 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
  gamesPlayed: number; // 총 게임 수
  gamesWon: number; // 승리한 게임 수
  createdAt: Date;
  updatedAt: Date;
}

// 출석 정보 타입
export interface Attendance {
  id: string;
  memberId: string;
  memberName: string;
  date: Date;
  shuttlecockCount: number; // 제출한 셔틀콕 개수
  createdAt: Date;
  hasLeft?: boolean; // 집에 갔는지 여부
  // 게스트 정보 (게스트인 경우에만 존재)
  guestInfo?: {
    gender: 'male' | 'female';
    skillLevel: 'S' | 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
    birthYear: number;
  };
}

// 게임 타입
export type GameType = 'men_doubles' | 'women_doubles' | 'mixed_doubles';

// 게임 상태
export type GameStatus = 'waiting' | 'playing' | 'completed';

// 게임 정보 타입
export interface Game {
  id: string;
  courtId: string;
  type: GameType;
  players: string[]; // 플레이어 ID 배열 (복식이므로 4명)
  playerNames: string[]; // 플레이어 이름 배열
  status: GameStatus;
  startTime?: Date;
  endTime?: Date;
  winners?: string[]; // 승리한 플레이어 ID 배열 (2명)
  winnerNames?: string[]; // 승리한 플레이어 이름 배열
  createdAt: Date;
  updatedAt: Date;
}

// 코트 정보 타입
export interface Court {
  id: string;
  name: string;
  position: {
    x: number;
    y: number;
  };
  isActive: boolean;
  currentGame?: Game;
  nextGame?: Game;
}

// 예약 정보 타입
export interface Reservation {
  id: string;
  courtId: string;
  gameType: GameType;
  players: string[]; // 플레이어 ID 배열
  playerNames: string[]; // 플레이어 이름 배열
  reservedAt: Date;
  estimatedStartTime?: Date;
}

// 설정 정보 타입
export interface Settings {
  id: string;
  courtCount: number;
  courtLayout: {
    rows: number;
    columns: number;
  };
  gameSettings: {
    defaultGameDuration: number; // 분 단위
    autoMatchmaking: boolean;
  };
  updatedAt: Date;
}
