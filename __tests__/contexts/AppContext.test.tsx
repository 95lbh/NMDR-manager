import { render, screen, waitFor } from '@testing-library/react'
import { AppProvider, useApp } from '@/contexts/AppContext'
import { Member } from '@/types'

// Mock Firebase services
jest.mock('@/lib/firestore', () => ({
  memberService: {
    getAllMembers: jest.fn(),
    addMember: jest.fn(),
    updateMember: jest.fn(),
    deleteMember: jest.fn(),
  },
  attendanceService: {
    getTodayAttendance: jest.fn(),
    addAttendance: jest.fn(),
    updateAttendance: jest.fn(),
    deleteAttendance: jest.fn(),
  },
  gameService: {
    getTodayGames: jest.fn(),
    getCurrentGames: jest.fn(),
    completeGame: jest.fn(),
  },
  settingsService: {
    getCourtSettings: jest.fn(),
    saveCourtSettings: jest.fn(),
  },
}))

// Test component to access context
function TestComponent() {
  const { state, actions } = useApp()
  
  return (
    <div>
      <div data-testid="members-count">{state.members.length}</div>
      <div data-testid="loading-members">{state.loading.members.toString()}</div>
      <button onClick={() => actions.loadMembers()}>Load Members</button>
    </div>
  )
}

describe('AppContext', () => {
  const mockMembers: Member[] = [
    {
      id: '1',
      name: '홍길동',
      age: 25,
      gender: 'male',
      skillLevel: 'intermediate',
      email: 'hong@example.com',
      phone: '010-1234-5678',
      mmr: 1500,
      gamesPlayed: 10,
      gamesWon: 5,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]

  beforeEach(() => {
    jest.clearAllMocks()
    const { memberService, attendanceService, gameService, settingsService } = require('@/lib/firestore')
    
    memberService.getAllMembers.mockResolvedValue(mockMembers)
    attendanceService.getTodayAttendance.mockResolvedValue([])
    gameService.getTodayGames.mockResolvedValue([])
    gameService.getCurrentGames.mockResolvedValue([])
    settingsService.getCourtSettings.mockResolvedValue({ courtGrid: [] })
  })

  it('provides initial state', async () => {
    render(
      <AppProvider>
        <TestComponent />
      </AppProvider>
    )

    // 초기 상태 확인
    expect(screen.getByTestId('members-count')).toHaveTextContent('0')
    
    // 데이터 로드 후 상태 확인
    await waitFor(() => {
      expect(screen.getByTestId('members-count')).toHaveTextContent('1')
    })
  })

  it('handles loading states correctly', async () => {
    const { memberService } = require('@/lib/firestore')
    
    // 로딩 지연을 위한 Promise
    let resolveMembers: (value: Member[]) => void
    const membersPromise = new Promise<Member[]>((resolve) => {
      resolveMembers = resolve
    })
    memberService.getAllMembers.mockReturnValue(membersPromise)

    render(
      <AppProvider>
        <TestComponent />
      </AppProvider>
    )

    // 로딩 상태 확인
    await waitFor(() => {
      expect(screen.getByTestId('loading-members')).toHaveTextContent('true')
    })

    // 로딩 완료
    resolveMembers!(mockMembers)
    
    await waitFor(() => {
      expect(screen.getByTestId('loading-members')).toHaveTextContent('false')
      expect(screen.getByTestId('members-count')).toHaveTextContent('1')
    })
  })

  it('throws error when used outside provider', () => {
    // 에러 로그를 숨기기 위해 console.error를 모킹
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
    
    expect(() => {
      render(<TestComponent />)
    }).toThrow('useApp must be used within an AppProvider')
    
    consoleSpy.mockRestore()
  })
})
