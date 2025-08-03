import { render, screen } from '@testing-library/react'
import Home from '@/app/page'
import { AppProvider } from '@/contexts/AppContext'

// Mock Dashboard component
jest.mock('@/components/Dashboard', () => {
  return function MockDashboard() {
    return <div data-testid="dashboard">Dashboard Component</div>
  }
})

// Mock Firebase services
jest.mock('@/lib/firestore', () => ({
  memberService: {
    getAllMembers: jest.fn().mockResolvedValue([]),
    subscribeToMembers: jest.fn(),
  },
  attendanceService: {
    getTodayAttendance: jest.fn().mockResolvedValue([]),
  },
  gameService: {
    getTodayGames: jest.fn().mockResolvedValue([]),
    getCurrentGames: jest.fn().mockResolvedValue([]),
  },
  settingsService: {
    getCourtSettings: jest.fn().mockResolvedValue({ courtGrid: [] }),
  },
}))

describe('Home Page', () => {
  it('renders Dashboard component', () => {
    render(
      <AppProvider>
        <Home />
      </AppProvider>
    )
    
    expect(screen.getByTestId('dashboard')).toBeInTheDocument()
  })

  it('renders without crashing', () => {
    expect(() => {
      render(
        <AppProvider>
          <Home />
        </AppProvider>
      )
    }).not.toThrow()
  })
})
