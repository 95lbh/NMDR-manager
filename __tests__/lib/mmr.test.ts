import {
  getSkillLevelFromMMR,
  getDefaultMMRForSkillLevel,
  calculateNewMMR,
  calculateWinRate,
  getSkillLevelColor,
  calculateTeamBalance,
  SKILL_LEVEL_RANGES
} from '@/lib/mmr'
import { Member } from '@/types'

describe('MMR Utils', () => {
  describe('getSkillLevelFromMMR', () => {
    it('returns correct skill level for different MMR values', () => {
      expect(getSkillLevelFromMMR(2500)).toBe('S')
      expect(getSkillLevelFromMMR(2200)).toBe('A')
      expect(getSkillLevelFromMMR(1800)).toBe('B')
      expect(getSkillLevelFromMMR(1400)).toBe('C')
      expect(getSkillLevelFromMMR(1000)).toBe('D')
      expect(getSkillLevelFromMMR(600)).toBe('E')
      expect(getSkillLevelFromMMR(200)).toBe('F')
    })

    it('handles boundary values correctly', () => {
      expect(getSkillLevelFromMMR(2400)).toBe('S')
      expect(getSkillLevelFromMMR(2399)).toBe('A')
      expect(getSkillLevelFromMMR(2000)).toBe('A')
      expect(getSkillLevelFromMMR(1999)).toBe('B')
      expect(getSkillLevelFromMMR(0)).toBe('F')
    })
  })

  describe('getDefaultMMRForSkillLevel', () => {
    it('returns middle value of skill level range', () => {
      expect(getDefaultMMRForSkillLevel('S')).toBe(2700) // (2400 + 3000) / 2
      expect(getDefaultMMRForSkillLevel('A')).toBe(2199) // (2000 + 2399) / 2
      expect(getDefaultMMRForSkillLevel('C')).toBe(1399) // (1200 + 1599) / 2
      expect(getDefaultMMRForSkillLevel('F')).toBe(199)  // (0 + 399) / 2
    })
  })

  describe('calculateNewMMR', () => {
    it('calculates MMR correctly for wins and losses', () => {
      // 동등한 실력의 플레이어들 (1500 vs 1500)
      const playerMMR = 1500
      const opponentMMR = 1500
      
      // 승리 시 MMR 증가
      const newMMRWin = calculateNewMMR(playerMMR, opponentMMR, true)
      expect(newMMRWin).toBeGreaterThan(playerMMR)
      
      // 패배 시 MMR 감소
      const newMMRLoss = calculateNewMMR(playerMMR, opponentMMR, false)
      expect(newMMRLoss).toBeLessThan(playerMMR)
    })

    it('handles underdog wins correctly', () => {
      // 약한 플레이어가 강한 플레이어를 이겼을 때
      const weakPlayerMMR = 1200
      const strongPlayerMMR = 1800
      
      const newMMR = calculateNewMMR(weakPlayerMMR, strongPlayerMMR, true)
      // 약한 플레이어가 이기면 더 많은 MMR을 얻어야 함
      expect(newMMR - weakPlayerMMR).toBeGreaterThan(16) // 기본 K-factor의 절반보다 많이
    })

    it('prevents MMR from going below 0', () => {
      const newMMR = calculateNewMMR(50, 2000, false)
      expect(newMMR).toBeGreaterThanOrEqual(0)
    })

    it('uses custom K-factor correctly', () => {
      const playerMMR = 1500
      const opponentMMR = 1500
      const customKFactor = 64
      
      const newMMRCustom = calculateNewMMR(playerMMR, opponentMMR, true, customKFactor)
      const newMMRDefault = calculateNewMMR(playerMMR, opponentMMR, true)
      
      // 더 높은 K-factor는 더 큰 변화를 만들어야 함
      expect(Math.abs(newMMRCustom - playerMMR)).toBeGreaterThan(Math.abs(newMMRDefault - playerMMR))
    })
  })

  describe('calculateWinRate', () => {
    it('calculates win rate correctly', () => {
      expect(calculateWinRate(7, 10)).toBe(70)
      expect(calculateWinRate(3, 5)).toBe(60)
      expect(calculateWinRate(0, 5)).toBe(0)
      expect(calculateWinRate(5, 5)).toBe(100)
    })

    it('handles zero games played', () => {
      expect(calculateWinRate(0, 0)).toBe(0)
    })

    it('rounds to nearest integer', () => {
      expect(calculateWinRate(1, 3)).toBe(33) // 33.33... -> 33
      expect(calculateWinRate(2, 3)).toBe(67) // 66.66... -> 67
    })
  })

  describe('getSkillLevelColor', () => {
    it('returns correct colors for each skill level', () => {
      expect(getSkillLevelColor('S')).toBe('bg-purple-100 text-purple-800')
      expect(getSkillLevelColor('A')).toBe('bg-red-100 text-red-800')
      expect(getSkillLevelColor('B')).toBe('bg-orange-100 text-orange-800')
      expect(getSkillLevelColor('C')).toBe('bg-yellow-100 text-yellow-800')
      expect(getSkillLevelColor('D')).toBe('bg-green-100 text-green-800')
      expect(getSkillLevelColor('E')).toBe('bg-blue-100 text-blue-800')
      expect(getSkillLevelColor('F')).toBe('bg-gray-100 text-gray-800')
    })

    it('returns default color for invalid skill level', () => {
      expect(getSkillLevelColor('X' as any)).toBe('bg-gray-100 text-gray-800')
    })
  })

  describe('calculateTeamBalance', () => {
    const mockMembers: Member[] = [
      { id: '1', mmr: 1500 } as Member,
      { id: '2', mmr: 1600 } as Member,
    ]

    it('returns default values when MMR system is disabled', () => {
      const balance = calculateTeamBalance(mockMembers, mockMembers)
      
      expect(balance).toEqual({
        team1AvgMMR: 0,
        team2AvgMMR: 0,
        mmrDifference: 0,
        isBalanced: true
      })
    })
  })

  describe('SKILL_LEVEL_RANGES', () => {
    it('has correct range definitions', () => {
      expect(SKILL_LEVEL_RANGES.S).toEqual({ min: 2400, max: 3000, label: '준프로' })
      expect(SKILL_LEVEL_RANGES.A).toEqual({ min: 2000, max: 2399, label: '고수' })
      expect(SKILL_LEVEL_RANGES.F).toEqual({ min: 0, max: 399, label: '완전 초보' })
    })

    it('has no gaps between ranges', () => {
      const levels = ['F', 'E', 'D', 'C', 'B', 'A', 'S'] as const
      
      for (let i = 0; i < levels.length - 1; i++) {
        const currentLevel = levels[i]
        const nextLevel = levels[i + 1]
        
        expect(SKILL_LEVEL_RANGES[currentLevel].max + 1).toBe(SKILL_LEVEL_RANGES[nextLevel].min)
      }
    })
  })
})
