'use client';

import React, { createContext, useContext, useReducer, useEffect, useCallback, ReactNode } from 'react';
import { Member, Attendance, Game, Court } from '@/types';
import { memberService, attendanceService, gameService, settingsService } from '@/lib/firestore';
import { scheduleDataRefreshAtMidnight, simulateDateChange } from '@/lib/dateUtils';

// 코트 설정 타입 정의
interface CourtPosition {
  row: number;
  col: number;
  isActive: boolean;
  courtNumber?: number;
}

interface CourtSettings {
  courtGrid: CourtPosition[][];
}

// 상태 타입 정의
interface AppState {
  members: Member[];
  attendance: Attendance[]; // 오늘의 출석 데이터
  allAttendance: Attendance[]; // 전체 출석 데이터
  games: Game[];
  courts: Court[];
  weeklyStats: { date: string; count: number; day: string }[];
  courtSettings: CourtSettings;
  loading: {
    members: boolean;
    attendance: boolean;
    allAttendance: boolean;
    games: boolean;
    courts: boolean;
    weeklyStats: boolean;
  };
  error: string | null;
}

// 액션 타입 정의
type AppAction =
  | { type: 'SET_LOADING'; payload: { key: keyof AppState['loading']; value: boolean } }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_MEMBERS'; payload: Member[] }
  | { type: 'ADD_MEMBER'; payload: Member }
  | { type: 'UPDATE_MEMBER'; payload: Member }
  | { type: 'DELETE_MEMBER'; payload: string }
  | { type: 'SET_ATTENDANCE'; payload: Attendance[] }
  | { type: 'SET_ALL_ATTENDANCE'; payload: Attendance[] }
  | { type: 'ADD_ATTENDANCE'; payload: Attendance }
  | { type: 'UPDATE_ATTENDANCE'; payload: Attendance }
  | { type: 'DELETE_ATTENDANCE'; payload: string }
  | { type: 'SET_GAMES'; payload: Game[] }
  | { type: 'ADD_GAME'; payload: Game }
  | { type: 'UPDATE_GAME'; payload: Game }
  | { type: 'SET_COURTS'; payload: Court[] }
  | { type: 'UPDATE_COURT'; payload: Court }
  | { type: 'SET_COURT_SETTINGS'; payload: CourtSettings }
  | { type: 'UPDATE_COURTS_FROM_SETTINGS' }
  | { type: 'SET_WEEKLY_STATS'; payload: { date: string; count: number; day: string }[] };

// 4x3 그리드 초기화 함수
const initializeCourtGrid = (): CourtPosition[][] => {
  const grid: CourtPosition[][] = [];
  for (let row = 0; row < 3; row++) {
    const rowData: CourtPosition[] = [];
    for (let col = 0; col < 4; col++) {
      rowData.push({
        row,
        col,
        isActive: false
      });
    }
    grid.push(rowData);
  }
  return grid;
};

// 초기 상태
const initialState: AppState = {
  members: [],
  attendance: [],
  allAttendance: [],
  games: [],
  courts: [],
  weeklyStats: [],
  courtSettings: {
    courtGrid: initializeCourtGrid()
  },
  loading: {
    members: false,
    attendance: false,
    allAttendance: false,
    games: false,
    courts: false,
    weeklyStats: false,
  },
  error: null,
};

// 리듀서
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_LOADING':
      return {
        ...state,
        loading: { ...state.loading, [action.payload.key]: action.payload.value }
      };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_MEMBERS':
      return { ...state, members: action.payload };
    case 'ADD_MEMBER':
      return { ...state, members: [...state.members, action.payload] };
    case 'UPDATE_MEMBER':
      return {
        ...state,
        members: state.members.map(m => m.id === action.payload.id ? action.payload : m)
      };
    case 'DELETE_MEMBER':
      return {
        ...state,
        members: state.members.filter(m => m.id !== action.payload)
      };
    case 'SET_ATTENDANCE':
      return { ...state, attendance: action.payload };
    case 'SET_ALL_ATTENDANCE':
      return { ...state, allAttendance: action.payload };
    case 'ADD_ATTENDANCE':
      return { ...state, attendance: [...state.attendance, action.payload] };
    case 'UPDATE_ATTENDANCE':
      return {
        ...state,
        attendance: state.attendance.map(a => a.id === action.payload.id ? action.payload : a)
      };
    case 'DELETE_ATTENDANCE':
      return {
        ...state,
        attendance: state.attendance.filter(a => a.id !== action.payload)
      };
    case 'SET_GAMES':
      return { ...state, games: action.payload };
    case 'ADD_GAME':
      return { ...state, games: [...state.games, action.payload] };
    case 'UPDATE_GAME':
      return {
        ...state,
        games: state.games.map(g => g.id === action.payload.id ? action.payload : g)
      };
    case 'SET_COURTS':
      return { ...state, courts: action.payload };
    case 'UPDATE_COURT':
      return {
        ...state,
        courts: state.courts.map(c => c.id === action.payload.id ? action.payload : c)
      };
    case 'SET_COURT_SETTINGS':
      return { ...state, courtSettings: action.payload };
    case 'UPDATE_COURTS_FROM_SETTINGS':
      // 설정에서 활성화된 코트들로 courts 배열 업데이트
      const activeCourts: Court[] = [];
      state.courtSettings.courtGrid.forEach((row, rowIndex) => {
        row.forEach((court, colIndex) => {
          if (court.isActive && court.courtNumber) {
            // 기존 코트 정보가 있으면 게임 상태 유지
            const existingCourt = state.courts.find(c => c.id === court.courtNumber!.toString());
            activeCourts.push({
              id: court.courtNumber.toString(),
              name: `코트 ${court.courtNumber}`,
              position: { x: colIndex, y: rowIndex },
              isActive: true,
              currentGame: existingCourt?.currentGame,
              nextGame: existingCourt?.nextGame
            });
          }
        });
      });

      return { ...state, courts: activeCourts };
    case 'SET_WEEKLY_STATS':
      return { ...state, weeklyStats: action.payload };
    default:
      return state;
  }
}

// Context 생성
const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  actions: {
    loadMembers: () => Promise<void>;
    addMember: (memberData: Omit<Member, 'id' | 'createdAt' | 'updatedAt' | 'gamesPlayed' | 'gamesWon'>) => Promise<void>;
    updateMember: (id: string, memberData: Partial<Member>) => Promise<void>;
    deleteMember: (id: string) => Promise<void>;
    loadAttendance: () => Promise<void>;
    loadAllAttendance: () => Promise<void>;
    addAttendance: (memberId: string, memberName: string, shuttlecockCount: number, guestInfo?: { gender: string; skillLevel: string; birthYear: number }) => Promise<void>;
    updateAttendance: (id: string, updates: Partial<Attendance>) => Promise<void>;
    deleteAttendance: (id: string) => Promise<void>;
    loadGames: () => Promise<void>;
    loadCurrentGames: () => Promise<void>;
    completeGame: (game: Game, mmrChanges: any[]) => Promise<void>; // eslint-disable-line @typescript-eslint/no-explicit-any
    updateCourtGame: (courtId: string, currentGame: Game | null, nextGame?: Game | null) => void;
    updateCourtSettings: (settings: CourtSettings) => Promise<void>;
    loadWeeklyStats: () => Promise<void>;
    resetMemberData: () => Promise<void>;
    resetStatisticsData: () => Promise<void>;
  };
} | null>(null);

// Provider 컴포넌트
export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // 초기 데이터 로드
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        // 순차적으로 로드하여 무한 루프 방지
        await loadMembers();
        await loadAttendance();
        await loadAllAttendance(); // 전체 출석 데이터 로드 추가
        // 코트 설정을 먼저 로드하여 코트 배치 설정
        await loadCourtSettings();
        await loadWeeklyStats();
        // 코트 설정 로드 후 현재 게임 상태 복원
        await loadCurrentGames();
      } catch (error) {
        console.error('초기 데이터 로드 실패:', error);
      }
    };
    loadInitialData();

    // 자정에 자동으로 데이터 새로고침 스케줄링
    scheduleDataRefreshAtMidnight(() => {
      loadAttendance();
      loadCurrentGames();
      loadWeeklyStats();
    });

    // 개발 환경에서 테스트를 위한 전역 함수 등록
    if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
      (window as unknown as { testDateChange: () => void }).testDateChange = () => {
        simulateDateChange();
        loadAttendance();
        loadCurrentGames();
        loadWeeklyStats();
      };
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps



  // 회원 관련 액션
  const loadMembers = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: { key: 'members', value: true } });
      const members = await memberService.getAllMembers();
      dispatch({ type: 'SET_MEMBERS', payload: members });
    } catch (error) {
      console.error('회원 데이터 로드 실패:', error);
      dispatch({ type: 'SET_ERROR', payload: '회원 데이터를 불러오는데 실패했습니다.' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: { key: 'members', value: false } });
    }
  };

  const addMember = async (memberData: Omit<Member, 'id' | 'createdAt' | 'updatedAt' | 'gamesPlayed' | 'gamesWon'>) => {
    try {
      const memberId = await memberService.addMember({ ...memberData, gamesPlayed: 0, gamesWon: 0 });
      const newMember: Member = {
        id: memberId,
        ...memberData,
        gamesPlayed: 0,
        gamesWon: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      dispatch({ type: 'ADD_MEMBER', payload: newMember });
    } catch (error) {
      console.error('회원 추가 실패:', error);
      throw error;
    }
  };

  const updateMember = async (id: string, memberData: Partial<Member>) => {
    try {
      await memberService.updateMember(id, memberData);
      const updatedMember = { ...state.members.find(m => m.id === id)!, ...memberData, updatedAt: new Date() };
      dispatch({ type: 'UPDATE_MEMBER', payload: updatedMember });
    } catch (error) {
      console.error('회원 수정 실패:', error);
      throw error;
    }
  };

  const deleteMember = async (id: string) => {
    try {
      await memberService.deleteMember(id);
      dispatch({ type: 'DELETE_MEMBER', payload: id });
    } catch (error) {
      console.error('회원 삭제 실패:', error);
      throw error;
    }
  };

  // 출석 관련 액션
  const loadAttendance = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: { key: 'attendance', value: true } });
      const attendance = await attendanceService.getTodayAttendance();
      dispatch({ type: 'SET_ATTENDANCE', payload: attendance });
    } catch (error) {
      console.error('출석 데이터 로드 실패:', error);
      dispatch({ type: 'SET_ERROR', payload: '출석 데이터를 불러오는데 실패했습니다.' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: { key: 'attendance', value: false } });
    }
  };

  const loadAllAttendance = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: { key: 'allAttendance', value: true } });
      const allAttendance = await attendanceService.getAllAttendance();
      dispatch({ type: 'SET_ALL_ATTENDANCE', payload: allAttendance });
    } catch (error) {
      console.error('전체 출석 데이터 로드 실패:', error);
      dispatch({ type: 'SET_ERROR', payload: '전체 출석 데이터를 불러오는데 실패했습니다.' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: { key: 'allAttendance', value: false } });
    }
  };

  const addAttendance = async (memberId: string, memberName: string, shuttlecockCount: number, guestInfo?: { gender: string; skillLevel: string; birthYear: number }) => {
    try {
      const attendanceId = await attendanceService.checkIn(memberId, memberName, shuttlecockCount, guestInfo);
      const newAttendance: Attendance = {
        id: attendanceId,
        memberId,
        memberName,
        date: new Date(),
        shuttlecockCount,
        createdAt: new Date(),
        ...(guestInfo && {
          guestInfo: {
            gender: guestInfo.gender as 'male' | 'female',
            skillLevel: guestInfo.skillLevel as 'S' | 'A' | 'B' | 'C' | 'D' | 'E' | 'F',
            birthYear: guestInfo.birthYear
          }
        })
      };
      dispatch({ type: 'ADD_ATTENDANCE', payload: newAttendance });
    } catch (error) {
      console.error('출석 추가 실패:', error);
      throw error;
    }
  };

  const updateAttendance = async (id: string, updates: Partial<Attendance>) => {
    try {
      if (updates.shuttlecockCount !== undefined) {
        await attendanceService.updateShuttlecockStatus(id, updates.shuttlecockCount);
      }
      const updatedAttendance = { ...state.attendance.find(a => a.id === id)!, ...updates };
      dispatch({ type: 'UPDATE_ATTENDANCE', payload: updatedAttendance });
    } catch (error) {
      console.error('출석 수정 실패:', error);
      throw error;
    }
  };

  const deleteAttendance = async (id: string) => {
    try {
      await attendanceService.deleteAttendance(id);
      dispatch({ type: 'DELETE_ATTENDANCE', payload: id });
    } catch (error) {
      console.error('출석 삭제 실패:', error);
      throw error;
    }
  };

  // 게임 관련 액션
  const loadGames = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: { key: 'games', value: true } });
      const games = await gameService.getTodayGames();
      dispatch({ type: 'SET_GAMES', payload: games });
    } catch (error) {
      console.error('게임 데이터 로드 실패:', error);
      dispatch({ type: 'SET_ERROR', payload: '게임 데이터를 불러오는데 실패했습니다.' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: { key: 'games', value: false } });
    }
  };

  // 현재 진행 중인 게임들을 로드하여 코트 상태 복원
  const loadCurrentGames = useCallback(async (courtsToUse?: Court[]) => {
    try {
      // 매개변수로 받은 코트 배열을 사용하거나 현재 상태의 코트 배열 사용
      const courts = courtsToUse || state.courts;

      // 코트가 설정되지 않은 경우 로딩하지 않음
      if (courts.length === 0) {
        return;
      }

      const currentGames = await gameService.getCurrentGames();

      // 코트별로 게임 할당
      const updatedCourts = courts.map(court => {
        const currentGame = currentGames.find(game =>
          game.courtId === court.id && game.status === 'playing'
        );
        const nextGame = currentGames.find(game =>
          game.courtId === court.id && game.status === 'waiting'
        );

        return {
          ...court,
          currentGame: currentGame || undefined,
          nextGame: nextGame || undefined
        };
      });

      // 모든 코트 상태를 한 번에 업데이트
      dispatch({ type: 'SET_COURTS', payload: updatedCourts });
    } catch (error) {
      console.error('현재 게임 로드 실패:', error);
    }
  }, [state.courts]);

  const completeGame = async (game: Game) => {
    try {
      await gameService.completeGame(game);
      dispatch({ type: 'ADD_GAME', payload: game });

      // 게임 참가자들의 통계 업데이트
      for (const playerId of game.players) {
        const member = state.members.find(m => m.id === playerId);
        if (member) {
          const isWinner = game.winners?.includes(playerId) || false;
          const updatedMember = {
            ...member,
            gamesPlayed: member.gamesPlayed + 1,
            gamesWon: member.gamesWon + (isWinner ? 1 : 0),
            updatedAt: new Date()
          };
          dispatch({ type: 'UPDATE_MEMBER', payload: updatedMember });
        }
      }
    } catch (error) {
      console.error('게임 완료 처리 실패:', error);
      throw error;
    }
  };

  const updateCourtGame = (courtId: string, currentGame: Game | null, nextGame?: Game | null) => {
    // 로컬 상태만 업데이트 (Firebase 저장은 GameModal에서 처리)
    const court = state.courts.find(c => c.id === courtId);
    if (court) {
      const updatedCourt = {
        ...court,
        currentGame: currentGame || undefined,
        nextGame: nextGame !== undefined ? (nextGame || undefined) : court.nextGame
      };
      dispatch({ type: 'UPDATE_COURT', payload: updatedCourt });
    }
  };

  // 주간 통계 로드
  const loadWeeklyStats = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: { key: 'weeklyStats', value: true } });
      const weeklyStats = await attendanceService.getWeeklyAttendanceStats();
      dispatch({ type: 'SET_WEEKLY_STATS', payload: weeklyStats });
    } catch (error) {
      console.error('주간 통계 로드 실패:', error);
      dispatch({ type: 'SET_ERROR', payload: '주간 통계를 불러오는데 실패했습니다.' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: { key: 'weeklyStats', value: false } });
    }
  };

  // 코트 설정 로드
  const loadCourtSettings = async () => {
    try {
      const savedSettings = await settingsService.getCourtSettings();
      if (savedSettings) {
        dispatch({ type: 'SET_COURT_SETTINGS', payload: savedSettings as unknown as CourtSettings });
        dispatch({ type: 'UPDATE_COURTS_FROM_SETTINGS' });
      }
    } catch (error) {
      console.error('코트 설정 로드 실패:', error);
    }
  };

  // 코트 설정 업데이트
  const updateCourtSettings = async (settings: CourtSettings) => {
    try {
      // Firebase에 저장
      await settingsService.saveCourtSettings(settings as unknown as Record<string, unknown>);

      // 로컬 상태 업데이트
      dispatch({ type: 'SET_COURT_SETTINGS', payload: settings });

      // 새로운 코트 배열 생성
      const activeCourts: Court[] = [];
      settings.courtGrid.forEach((row, rowIndex) => {
        row.forEach((court, colIndex) => {
          if (court.isActive && court.courtNumber) {
            // 기존 코트 정보가 있으면 게임 상태 유지
            const existingCourt = state.courts.find(c => c.id === court.courtNumber!.toString());
            activeCourts.push({
              id: court.courtNumber.toString(),
              name: `코트 ${court.courtNumber}`,
              position: { x: colIndex, y: rowIndex },
              isActive: true,
              currentGame: existingCourt?.currentGame,
              nextGame: existingCourt?.nextGame
            });
          }
        });
      });

      // 코트 배열 업데이트
      dispatch({ type: 'SET_COURTS', payload: activeCourts });

      // 현재 게임 상태 복원 (새로운 코트 배열 사용)
      await loadCurrentGames(activeCourts);
    } catch (error) {
      console.error('코트 설정 저장 실패:', error);
      throw error;
    }
  };

  // 회원 데이터 초기화
  const resetMemberData = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: { key: 'members', value: true } });
      await memberService.deleteAllMembers();
      dispatch({ type: 'SET_MEMBERS', payload: [] });
    } catch (error) {
      console.error('회원 데이터 초기화 실패:', error);
      dispatch({ type: 'SET_ERROR', payload: '회원 데이터 초기화에 실패했습니다.' });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: { key: 'members', value: false } });
    }
  };

  // 통계 데이터 초기화 (출석 및 게임 데이터)
  const resetStatisticsData = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: { key: 'attendance', value: true } });
      dispatch({ type: 'SET_LOADING', payload: { key: 'games', value: true } });

      // 출석 및 게임 데이터 삭제
      await Promise.all([
        attendanceService.deleteAllAttendance(),
        gameService.deleteAllGames()
      ]);

      // 회원들의 게임 통계 초기화
      const members = state.members;
      for (const member of members) {
        await memberService.updateMember(member.id, {
          gamesPlayed: 0,
          gamesWon: 0
        });
      }

      // 상태 초기화
      dispatch({ type: 'SET_ATTENDANCE', payload: [] });
      dispatch({ type: 'SET_GAMES', payload: [] });
      dispatch({ type: 'SET_WEEKLY_STATS', payload: [] });

      // 회원 데이터 다시 로드 (통계가 초기화된 상태로)
      await loadMembers();

    } catch (error) {
      console.error('통계 데이터 초기화 실패:', error);
      dispatch({ type: 'SET_ERROR', payload: '통계 데이터 초기화에 실패했습니다.' });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: { key: 'attendance', value: false } });
      dispatch({ type: 'SET_LOADING', payload: { key: 'games', value: false } });
    }
  };

  const actions = {
    loadMembers,
    addMember,
    updateMember,
    deleteMember,
    loadAttendance,
    loadAllAttendance,
    addAttendance,
    updateAttendance,
    deleteAttendance,
    loadGames,
    loadCurrentGames,
    completeGame,
    updateCourtGame,
    loadCourtSettings,
    updateCourtSettings,
    loadWeeklyStats,
    resetMemberData,
    resetStatisticsData,
  };

  return (
    <AppContext.Provider value={{ state, dispatch, actions }}>
      {children}
    </AppContext.Provider>
  );
}

// Hook
export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
