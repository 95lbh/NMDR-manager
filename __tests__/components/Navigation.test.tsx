import { render, screen } from '@testing-library/react'
import Navigation from '@/components/Navigation'

// Mock next/navigation
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
}))

const mockUsePathname = require('next/navigation').usePathname

describe('Navigation', () => {
  beforeEach(() => {
    mockUsePathname.mockReturnValue('/')
  })

  it('renders navigation with all menu items', () => {
    render(<Navigation />)
    
    // 로고 확인
    expect(screen.getByText('🏸 N.M.D.R')).toBeInTheDocument()
    
    // 메뉴 항목들 확인
    expect(screen.getByText('대시보드')).toBeInTheDocument()
    expect(screen.getByText('회원 관리')).toBeInTheDocument()
    expect(screen.getByText('출석 체크')).toBeInTheDocument()
    expect(screen.getByText('통계')).toBeInTheDocument()
    expect(screen.getByText('설정')).toBeInTheDocument()
  })

  it('highlights active menu item', () => {
    mockUsePathname.mockReturnValue('/members')
    render(<Navigation />)
    
    const membersLink = screen.getAllByText('회원 관리')[0].closest('a')
    expect(membersLink).toHaveClass('bg-blue-100', 'text-blue-700')
  })

  it('shows current date', () => {
    render(<Navigation />)
    
    // 현재 날짜가 표시되는지 확인 (정확한 텍스트는 날짜에 따라 달라지므로 요소 존재만 확인)
    const dateElement = screen.getByText(new Date().toLocaleDateString('ko-KR', {
      month: 'long',
      day: 'numeric',
      weekday: 'short'
    }))
    expect(dateElement).toBeInTheDocument()
  })

  it('renders mobile navigation', () => {
    render(<Navigation />)
    
    // 모바일 네비게이션에서도 모든 메뉴 항목이 있는지 확인
    const dashboardLinks = screen.getAllByText('대시보드')
    expect(dashboardLinks).toHaveLength(2) // 데스크톱 + 모바일
  })
})
