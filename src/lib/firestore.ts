import {
  collection,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  Timestamp,
  onSnapshot
} from 'firebase/firestore';
import { db } from './firebase';
import { Member, Attendance, Game, Court, Settings } from '@/types';

// 컬렉션 이름 상수
export const COLLECTIONS = {
  MEMBERS: 'members',
  ATTENDANCE: 'attendance',
  GAMES: 'games',
  COURTS: 'courts',
  SETTINGS: 'settings',
  RESERVATIONS: 'reservations'
} as const;

// 날짜 변환 유틸리티
export const convertTimestamp = (timestamp: Timestamp | Date): Date => {
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate();
  }
  return timestamp;
};

// 회원 관리 함수들
export const memberService = {
  // 회원 추가
  async addMember(memberData: Omit<Member, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const now = new Date();
    const docRef = await addDoc(collection(db, COLLECTIONS.MEMBERS), {
      ...memberData,
      createdAt: Timestamp.fromDate(now),
      updatedAt: Timestamp.fromDate(now)
    });
    return docRef.id;
  },

  // 모든 회원 조회
  async getAllMembers(): Promise<Member[]> {
    const querySnapshot = await getDocs(
      query(collection(db, COLLECTIONS.MEMBERS), orderBy('name'))
    );
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: convertTimestamp(doc.data().createdAt),
      updatedAt: convertTimestamp(doc.data().updatedAt)
    })) as Member[];
  },

  // 회원 정보 업데이트
  async updateMember(id: string, updates: Partial<Omit<Member, 'id' | 'createdAt'>>): Promise<void> {
    const memberRef = doc(db, COLLECTIONS.MEMBERS, id);
    await updateDoc(memberRef, {
      ...updates,
      updatedAt: Timestamp.fromDate(new Date())
    });
  },

  // 회원 삭제
  async deleteMember(id: string): Promise<void> {
    await deleteDoc(doc(db, COLLECTIONS.MEMBERS, id));
  },

  // 실시간 회원 목록 구독
  subscribeToMembers(callback: (members: Member[]) => void) {
    return onSnapshot(
      query(collection(db, COLLECTIONS.MEMBERS), orderBy('name')),
      (snapshot) => {
        const members = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: convertTimestamp(doc.data().createdAt),
          updatedAt: convertTimestamp(doc.data().updatedAt)
        })) as Member[];
        callback(members);
      }
    );
  },

  // 모든 회원 삭제 (초기화)
  async deleteAllMembers(): Promise<void> {
    const querySnapshot = await getDocs(collection(db, COLLECTIONS.MEMBERS));
    const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletePromises);
  }
};

// 출석 관리 함수들
export const attendanceService = {
  // 출석 체크
  async checkIn(memberId: string, memberName: string, shuttlecockCount: number = 0, guestInfo?: { gender: string; skillLevel: string; birthYear: number }): Promise<string> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // 오늘 이미 출석했는지 확인
    const existingAttendance = await getDocs(
      query(
        collection(db, COLLECTIONS.ATTENDANCE),
        where('memberId', '==', memberId),
        where('date', '>=', Timestamp.fromDate(today)),
        where('date', '<', Timestamp.fromDate(new Date(today.getTime() + 24 * 60 * 60 * 1000)))
      )
    );

    if (!existingAttendance.empty) {
      throw new Error('이미 오늘 출석체크를 완료했습니다.');
    }

    const docRef = await addDoc(collection(db, COLLECTIONS.ATTENDANCE), {
      memberId,
      memberName,
      date: Timestamp.fromDate(new Date()),
      shuttlecockCount,
      createdAt: Timestamp.fromDate(new Date()),
      ...(guestInfo && { guestInfo })
    });
    return docRef.id;
  },

  // 오늘 출석자 조회 (인덱스 생성 전 임시 버전)
  async getTodayAttendance(): Promise<Attendance[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const querySnapshot = await getDocs(
      query(
        collection(db, COLLECTIONS.ATTENDANCE),
        where('date', '>=', Timestamp.fromDate(today)),
        where('date', '<', Timestamp.fromDate(new Date(today.getTime() + 24 * 60 * 60 * 1000)))
      )
    );

    const results = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      date: convertTimestamp(doc.data().date),
      createdAt: convertTimestamp(doc.data().createdAt)
    })) as Attendance[];

    // 클라이언트에서 정렬
    return results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  },

  // 셔틀콕 개수 업데이트
  async updateShuttlecockStatus(attendanceId: string, shuttlecockCount: number): Promise<void> {
    const attendanceRef = doc(db, COLLECTIONS.ATTENDANCE, attendanceId);
    await updateDoc(attendanceRef, {
      shuttlecockCount
    });
  },

  // 출석 삭제
  async deleteAttendance(attendanceId: string): Promise<void> {
    await deleteDoc(doc(db, COLLECTIONS.ATTENDANCE, attendanceId));
  },

  // 집 갔음 상태 업데이트
  async updateLeftStatus(id: string, hasLeft: boolean): Promise<void> {
    const attendanceRef = doc(db, COLLECTIONS.ATTENDANCE, id);
    await updateDoc(attendanceRef, {
      hasLeft,
      updatedAt: Timestamp.now()
    });
  },

  // 실시간 오늘 출석자 구독 (인덱스 생성 전 임시 버전)
  subscribeToTodayAttendance(callback: (attendance: Attendance[]) => void) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return onSnapshot(
      query(
        collection(db, COLLECTIONS.ATTENDANCE),
        where('date', '>=', Timestamp.fromDate(today)),
        where('date', '<', Timestamp.fromDate(new Date(today.getTime() + 24 * 60 * 60 * 1000)))
      ),
      (snapshot) => {
        const attendance = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          date: convertTimestamp(doc.data().date),
          createdAt: convertTimestamp(doc.data().createdAt)
        })) as Attendance[];

        // 클라이언트에서 정렬
        const sortedAttendance = attendance.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        callback(sortedAttendance);
      }
    );
  },

  // 기간별 출석 데이터 조회 (인덱스 생성 전 임시 버전)
  async getAttendanceByPeriod(startDate: Date, endDate: Date): Promise<Attendance[]> {
    // 인덱스가 없는 동안 단순 쿼리 사용
    const q = query(
      collection(db, COLLECTIONS.ATTENDANCE),
      where('date', '>=', Timestamp.fromDate(startDate)),
      where('date', '<=', Timestamp.fromDate(endDate))
    );

    const querySnapshot = await getDocs(q);
    const results = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      date: doc.data().date.toDate(),
      createdAt: doc.data().createdAt.toDate()
    } as Attendance));

    // 클라이언트에서 정렬
    return results.sort((a, b) => b.date.getTime() - a.date.getTime());
  },

  // 모든 출석 데이터 삭제 (통계 초기화)
  async deleteAllAttendance(): Promise<void> {
    const querySnapshot = await getDocs(collection(db, COLLECTIONS.ATTENDANCE));
    const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletePromises);
  },

  // 전체 출석 데이터 조회
  async getAllAttendance(): Promise<Attendance[]> {
    const querySnapshot = await getDocs(
      query(
        collection(db, COLLECTIONS.ATTENDANCE),
        orderBy('date', 'desc')
      )
    );

    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      date: convertTimestamp(doc.data().date),
      createdAt: convertTimestamp(doc.data().createdAt)
    })) as Attendance[];
  },

  // 주간 출석 통계
  async getWeeklyAttendanceStats(): Promise<{ date: string; count: number; day: string }[]> {
    const today = new Date();
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    const attendanceData = await this.getAttendanceByPeriod(weekAgo, today);

    // 날짜별로 그룹화
    const dailyStats = new Map<string, number>();
    const days = ['일', '월', '화', '수', '목', '금', '토'];

    // 지난 7일간의 날짜 초기화
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      dailyStats.set(dateStr, 0);
    }

    // 실제 출석 데이터로 업데이트
    attendanceData.forEach(attendance => {
      const dateStr = attendance.date.toISOString().split('T')[0];
      const currentCount = dailyStats.get(dateStr) || 0;
      dailyStats.set(dateStr, currentCount + 1);
    });

    // 결과 배열 생성
    return Array.from(dailyStats.entries()).map(([dateStr, count]) => {
      const date = new Date(dateStr);
      return {
        date: `${date.getMonth() + 1}/${date.getDate()}`,
        count,
        day: days[date.getDay()]
      };
    });
  }
};

// 게임 관리 함수들
export const gameService = {
  // 게임 생성 (시작 또는 예약)
  async createGame(game: Game): Promise<string> {
    const gameRef = doc(collection(db, COLLECTIONS.GAMES));
    await setDoc(gameRef, {
      ...game,
      id: gameRef.id,
      startTime: game.startTime ? Timestamp.fromDate(game.startTime) : null,
      endTime: game.endTime ? Timestamp.fromDate(game.endTime) : null,
      createdAt: Timestamp.fromDate(game.createdAt),
      updatedAt: Timestamp.fromDate(game.updatedAt)
    });
    return gameRef.id;
  },

  // 게임 상태 업데이트
  async updateGameStatus(gameId: string, status: Game['status'], winners?: string[], winnerNames?: string[]): Promise<void> {
    const gameRef = doc(db, COLLECTIONS.GAMES, gameId);
    const updates = {
      status,
      updatedAt: Timestamp.fromDate(new Date()),
      ...(status === 'playing' && { startTime: Timestamp.fromDate(new Date()) }),
      ...(status === 'completed' && {
        endTime: Timestamp.fromDate(new Date()),
        ...(winners && { winners }),
        ...(winnerNames && { winnerNames })
      })
    };

    await updateDoc(gameRef, updates);
  },

  // 현재 진행 중인 게임들 조회 (임시: 인덱스 생성 전까지 날짜 필터링 비활성화)
  async getCurrentGames(): Promise<Game[]> {
    // TODO: Firebase 인덱스 생성 후 날짜 필터링 활성화
    const q = query(
      collection(db, COLLECTIONS.GAMES),
      where('status', 'in', ['playing', 'waiting'])
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      startTime: doc.data().startTime ? convertTimestamp(doc.data().startTime) : undefined,
      endTime: doc.data().endTime ? convertTimestamp(doc.data().endTime) : undefined,
      createdAt: convertTimestamp(doc.data().createdAt),
      updatedAt: convertTimestamp(doc.data().updatedAt)
    })) as Game[];
  },

  // 게임 삭제
  async deleteGame(gameId: string): Promise<void> {
    await deleteDoc(doc(db, COLLECTIONS.GAMES, gameId));
  },

  // 오늘 게임 목록 조회 (인덱스 생성 전 임시 버전)
  async getTodayGames(): Promise<Game[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const querySnapshot = await getDocs(
      query(
        collection(db, COLLECTIONS.GAMES),
        where('createdAt', '>=', Timestamp.fromDate(today)),
        where('createdAt', '<', Timestamp.fromDate(new Date(today.getTime() + 24 * 60 * 60 * 1000)))
      )
    );

    const results = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: convertTimestamp(doc.data().createdAt),
      updatedAt: convertTimestamp(doc.data().updatedAt),
      startTime: doc.data().startTime ? convertTimestamp(doc.data().startTime) : undefined,
      endTime: doc.data().endTime ? convertTimestamp(doc.data().endTime) : undefined
    })) as Game[];

    // 클라이언트에서 정렬
    return results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  },

  // 게임 결과 저장 및 회원 통계 업데이트
  async completeGame(game: Game): Promise<void> {
    // 기존 게임 문서 업데이트 (새로 생성하지 않음)
    if (game.id) {
      const gameRef = doc(db, COLLECTIONS.GAMES, game.id);
      await updateDoc(gameRef, {
        status: 'completed',
        endTime: game.endTime ? Timestamp.fromDate(game.endTime) : null,
        winners: game.winners || [],
        winnerNames: game.winnerNames || [],
        updatedAt: Timestamp.fromDate(game.updatedAt)
      });
    }

    // 회원 전적 업데이트 (게스트 포함된 게임도 처리)
    if (game.players && game.winners) {
      for (const playerId of game.players) {
        const memberRef = doc(db, COLLECTIONS.MEMBERS, playerId);
        const memberDoc = await getDoc(memberRef);

        if (memberDoc.exists()) {
          const memberData = memberDoc.data();
          const isWinner = game.winners.includes(playerId);

          await updateDoc(memberRef, {
            gamesPlayed: (memberData.gamesPlayed || 0) + 1,
            gamesWon: (memberData.gamesWon || 0) + (isWinner ? 1 : 0),
            updatedAt: Timestamp.fromDate(new Date())
          });
        }
      }
    }
  },

  // 모든 게임 데이터 삭제 (통계 초기화)
  async deleteAllGames(): Promise<void> {
    const querySnapshot = await getDocs(collection(db, COLLECTIONS.GAMES));
    const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletePromises);
  }
};

// 코트 관리 함수들
export const courtService = {
  // 코트 설정 초기화
  async initializeCourts(courtCount: number = 4): Promise<void> {
    const courts: Omit<Court, 'id'>[] = [];
    const rows = Math.ceil(Math.sqrt(courtCount));
    const cols = Math.ceil(courtCount / rows);

    for (let i = 0; i < courtCount; i++) {
      courts.push({
        name: `코트 ${i + 1}`,
        position: {
          x: i % cols,
          y: Math.floor(i / cols)
        },
        isActive: true
      });
    }

    // 기존 코트 삭제 후 새로 생성
    const existingCourts = await getDocs(collection(db, COLLECTIONS.COURTS));
    for (const courtDoc of existingCourts.docs) {
      await deleteDoc(courtDoc.ref);
    }

    for (const court of courts) {
      await addDoc(collection(db, COLLECTIONS.COURTS), court);
    }
  },

  // 모든 코트 조회
  async getAllCourts(): Promise<Court[]> {
    const querySnapshot = await getDocs(
      query(collection(db, COLLECTIONS.COURTS), orderBy('name'))
    );
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Court[];
  },

  // 실시간 코트 상태 구독
  subscribeToCourtStatus(callback: (courts: Court[]) => void) {
    return onSnapshot(
      query(collection(db, COLLECTIONS.COURTS), orderBy('name')),
      (snapshot) => {
        const courts = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Court[];
        callback(courts);
      }
    );
  }
};

// 설정 관리 함수들
export const settingsService = {
  // 설정 저장
  async saveSettings(settings: Omit<Settings, 'id' | 'updatedAt'>): Promise<void> {
    const settingsRef = doc(db, COLLECTIONS.SETTINGS, 'main');
    await updateDoc(settingsRef, {
      ...settings,
      updatedAt: Timestamp.fromDate(new Date())
    });
  },

  // 설정 조회
  async getSettings(): Promise<Settings | null> {
    const settingsDoc = await getDoc(doc(db, COLLECTIONS.SETTINGS, 'main'));
    if (settingsDoc.exists()) {
      return {
        id: settingsDoc.id,
        ...settingsDoc.data(),
        updatedAt: convertTimestamp(settingsDoc.data().updatedAt)
      } as Settings;
    }
    return null;
  },

  // 기본 설정 초기화
  async initializeSettings(): Promise<void> {
    const settingsRef = doc(db, COLLECTIONS.SETTINGS, 'main');
    await updateDoc(settingsRef, {
      courtCount: 4,
      courtLayout: {
        rows: 2,
        columns: 2
      },
      gameSettings: {
        defaultGameDuration: 30,
        autoMatchmaking: false
      },
      updatedAt: Timestamp.fromDate(new Date())
    });
  },

  // 코트 설정 저장
  async saveCourtSettings(courtSettings: Record<string, unknown>): Promise<void> {
    try {
      console.log('Firestore: 코트 설정 저장 시작', courtSettings);
      const settingsRef = doc(db, COLLECTIONS.SETTINGS, 'court-settings');

      // 중첩 배열을 평면화하여 저장
      const courtGrid = courtSettings.courtGrid as unknown[][];
      console.log('Firestore: courtGrid', courtGrid);

      const flattenedGrid = courtGrid.map((row, rowIndex) =>
        row.map((court, colIndex) => {
          const courtData = court as Record<string, unknown>;
          // undefined 값 제거
          const cleanCourtData: Record<string, unknown> = {};
          Object.keys(courtData).forEach(key => {
            if (courtData[key] !== undefined) {
              cleanCourtData[key] = courtData[key];
            }
          });

          return {
            row: rowIndex,
            col: colIndex,
            ...cleanCourtData
          };
        })
      ).flat();

      console.log('Firestore: flattenedGrid', flattenedGrid);

      // undefined 값을 제거하는 헬퍼 함수
      const removeUndefined = (obj: unknown): unknown => {
        if (Array.isArray(obj)) {
          return obj.map(removeUndefined).filter(item => item !== undefined);
        } else if (obj !== null && typeof obj === 'object') {
          const cleaned: Record<string, unknown> = {};
          Object.keys(obj as Record<string, unknown>).forEach(key => {
            const value = removeUndefined((obj as Record<string, unknown>)[key]);
            if (value !== undefined) {
              cleaned[key] = value;
            }
          });
          return cleaned;
        }
        return obj;
      };

      const dataToSave = removeUndefined({
        courtGridFlat: flattenedGrid,
        rows: courtGrid.length,
        cols: courtGrid[0]?.length || 0,
        updatedAt: Timestamp.fromDate(new Date())
      });

      console.log('Firestore: 저장할 데이터', dataToSave);
      await setDoc(settingsRef, dataToSave);
      console.log('Firestore: 저장 완료');
    } catch (error) {
      console.error('Firestore: 저장 실패', error);
      throw error;
    }
  },

  // 코트 설정 조회
  async getCourtSettings(): Promise<Record<string, unknown> | null> {
    const settingsRef = doc(db, COLLECTIONS.SETTINGS, 'court-settings');
    const settingsDoc = await getDoc(settingsRef);

    if (settingsDoc.exists()) {
      const data = settingsDoc.data();

      // 평면화된 데이터를 2차원 배열로 복원
      if (data.courtGridFlat && data.rows && data.cols) {
        const courtGrid: unknown[][] = Array(data.rows).fill(null).map(() => Array(data.cols).fill(null));

        data.courtGridFlat.forEach((court: Record<string, unknown>) => {
          const row = court.row as number;
          const col = court.col as number;
          // row와 col을 제외한 나머지 데이터만 추출
          const courtData = { ...court };
          delete courtData.row;
          delete courtData.col;
          courtGrid[row][col] = courtData;
        });

        return {
          courtGrid,
          updatedAt: data.updatedAt ? convertTimestamp(data.updatedAt) : new Date()
        };
      }
    }

    return null;
  }
};
