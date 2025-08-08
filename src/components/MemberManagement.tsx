'use client';

import { useState } from 'react';
import { PlusIcon, PencilIcon, TrashIcon, MagnifyingGlassIcon, ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { Member } from '@/types';
import MemberForm from './MemberForm';
import { getSkillLevelColor, calculateWinRate } from '@/lib/mmr';
import { useApp } from '@/contexts/AppContext';



const genderLabels = {
  male: '남성',
  female: '여성'
};

// 정렬 타입 정의
type SortField = 'name' | 'age' | 'gender' | 'skillLevel' | 'winRate' | 'createdAt';
type SortDirection = 'asc' | 'desc';

export default function MemberManagement() {
  const { state, actions } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const { members, loading, error } = state;

  // 정렬 핸들러
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // 같은 필드를 클릭하면 방향 변경
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // 다른 필드를 클릭하면 해당 필드로 오름차순 정렬
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // 정렬된 회원 목록
  const sortedMembers = [...members].sort((a, b) => {
    let aValue: string | number;
    let bValue: string | number;

    switch (sortField) {
      case 'name':
        aValue = a.name;
        bValue = b.name;
        break;
      case 'age':
        aValue = new Date().getFullYear() - a.birthYear;
        bValue = new Date().getFullYear() - b.birthYear;
        break;
      case 'gender':
        aValue = a.gender;
        bValue = b.gender;
        break;
      case 'skillLevel':
        // 실력등급은 S > A > B > C > D > E > F 순으로 정렬
        const skillOrder = { S: 7, A: 6, B: 5, C: 4, D: 3, E: 2, F: 1 };
        aValue = skillOrder[a.skillLevel];
        bValue = skillOrder[b.skillLevel];
        break;
      case 'winRate':
        aValue = calculateWinRate(a.gamesWon, a.gamesPlayed);
        bValue = calculateWinRate(b.gamesWon, b.gamesPlayed);
        break;
      case 'createdAt':
        aValue = a.createdAt.getTime();
        bValue = b.createdAt.getTime();
        break;
      default:
        aValue = a.name;
        bValue = b.name;
    }

    if (aValue < bValue) {
      return sortDirection === 'asc' ? -1 : 1;
    }
    if (aValue > bValue) {
      return sortDirection === 'asc' ? 1 : -1;
    }
    return 0;
  });

  // 검색 필터 적용
  const filteredMembers = sortedMembers.filter(member =>
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.skillLevel.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddMember = () => {
    setSelectedMember(null);
    setIsEditing(false);
    setIsFormOpen(true);
  };

  const handleEditMember = (member: Member) => {
    setSelectedMember(member);
    setIsEditing(true);
    setIsFormOpen(true);
  };

  const handleDeleteMember = async (memberId: string) => {
    if (confirm('정말로 이 회원을 삭제하시겠습니까?')) {
      try {
        await actions.deleteMember(memberId);
      } catch (err) {
        console.error('회원 삭제 실패:', err);
        alert('회원 삭제에 실패했습니다.');
      }
    }
  };

  const handleSaveMember = async (memberData: Omit<Member, 'id' | 'createdAt' | 'updatedAt' | 'gamesPlayed' | 'gamesWon'>) => {
    try {
      if (isEditing && selectedMember) {
        // 수정
        await actions.updateMember(selectedMember.id, { ...memberData, gamesPlayed: selectedMember.gamesPlayed, gamesWon: selectedMember.gamesWon });
      } else {
        // 새 회원 추가
        await actions.addMember(memberData);
      }
      setIsFormOpen(false);
      setSelectedMember(null);
    } catch (err) {
      console.error('회원 저장 실패:', err);
      alert('회원 정보 저장에 실패했습니다.');
    }
  };

  const getCurrentAge = (birthYear: number) => {
    return new Date().getFullYear() - birthYear;
  };

  // 정렬 아이콘 컴포넌트
  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <div className="w-4 h-4" />; // 빈 공간
    }

    return sortDirection === 'asc' ? (
      <ChevronUpIcon className="w-4 h-4" />
    ) : (
      <ChevronDownIcon className="w-4 h-4" />
    );
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">회원 관리</h1>
          {error && (
            <p className="text-red-600 text-sm mt-1">{error}</p>
          )}
        </div>
        <button
          onClick={handleAddMember}
          disabled={loading.members}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-7 py-3 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <PlusIcon className="h-5 w-5" />
          <span>회원 추가</span>
        </button>
      </div>

      {/* 검색 */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="relative">
          <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="이름으로 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* 회원 목록 */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            전체 회원 ({filteredMembers.length}명)
          </h2>
        </div>
        
        <div className="overflow-auto rounded-lg border border-gray-200 max-h-[650px]">
          <table className="min-w-full divide-y divide-gray-200 table-fixed">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200 sticky top-0 z-10 shadow-sm">
              <tr>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center space-x-1">
                    <span>이름</span>
                    <SortIcon field="name" />
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center space-x-2">
                    <button
                      className="flex items-center space-x-1 hover:bg-gray-200 px-2 py-1 rounded cursor-pointer select-none"
                      onClick={() => handleSort('age')}
                    >
                      <span>나이</span>
                      <SortIcon field="age" />
                    </button>
                    <span>/</span>
                    <button
                      className="flex items-center space-x-1 hover:bg-gray-200 px-2 py-1 rounded cursor-pointer select-none"
                      onClick={() => handleSort('gender')}
                    >
                      <span>성별</span>
                      <SortIcon field="gender" />
                    </button>
                  </div>
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                  onClick={() => handleSort('skillLevel')}
                >
                  <div className="flex items-center space-x-1">
                    <span>실력등급</span>
                    <SortIcon field="skillLevel" />
                  </div>
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                  onClick={() => handleSort('winRate')}
                >
                  <div className="flex items-center space-x-1">
                    <span>전적</span>
                    <SortIcon field="winRate" />
                  </div>
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
                  onClick={() => handleSort('createdAt')}
                >
                  <div className="flex items-center space-x-1">
                    <span>가입일</span>
                    <SortIcon field="createdAt" />
                  </div>
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  수정/삭제
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading.members ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex justify-center items-center space-x-2">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                      <span className="text-gray-500">회원 데이터를 불러오는 중...</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredMembers.map((member, index) => (
                  <tr
                    key={member.id}
                    className={`
                      transition-colors duration-150 ease-in-out
                      ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}
                      hover:bg-blue-50 hover:shadow-sm
                      border-b border-gray-100
                    `}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8">
                          <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-400 to-blue-600 flex items-center justify-center text-white text-sm font-medium">
                            {member.name.charAt(0)}
                          </div>
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">{member.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-900">
                          {getCurrentAge(member.birthYear)}세
                        </span>
                        <span className="text-gray-400">•</span>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          member.gender === 'male'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-pink-100 text-pink-800'
                        }`}>
                          {genderLabels[member.gender]}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSkillLevelColor(member.skillLevel)}`}>
                        {member.skillLevel}조
                      </span>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {member.gamesWon}승
                          </span>
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            {member.gamesPlayed - member.gamesWon}패
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full transition-all duration-300"
                              style={{
                                width: `${calculateWinRate(member.gamesWon, member.gamesPlayed)}%`
                              }}
                            ></div>
                          </div>
                          <span className="text-xs font-medium text-gray-600">
                            {calculateWinRate(member.gamesWon, member.gamesPlayed)}%
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {member.createdAt.toLocaleDateString('ko-KR')}
                      </div>
                      <div className="text-xs text-gray-500">
                        {(() => {
                          const days = Math.floor((new Date().getTime() - member.createdAt.getTime()) / (1000 * 60 * 60 * 24));
                          if (days === 0) return '오늘 가입';
                          if (days === 1) return '1일 전';
                          if (days < 30) return `${days}일 전`;
                          if (days < 365) return `${Math.floor(days / 30)}개월 전`;
                          return `${Math.floor(days / 365)}년 전`;
                        })()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-1">
                        <button
                          onClick={() => handleEditMember(member)}
                          className="inline-flex items-center p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-lg transition-colors duration-150"
                          title="회원 정보 수정"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteMember(member.id)}
                          className="inline-flex items-center p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-lg transition-colors duration-150"
                          title="회원 삭제"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          
          {filteredMembers.length === 0 && !loading.members && (
            <div className="text-center py-16 bg-gray-50">
              <div className="mx-auto max-w-md">
                <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchTerm ? '검색 결과가 없습니다' : '등록된 회원이 없습니다'}
                </h3>
                <p className="text-gray-500 mb-6">
                  {searchTerm
                    ? '다른 검색어로 시도해보세요.'
                    : '새로운 회원을 추가해보세요.'
                  }
                </p>
                {!searchTerm && (
                  <button
                    onClick={handleAddMember}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors duration-150"
                  >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    첫 번째 회원 추가
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 회원 등록/수정 폼 모달 */}
      {isFormOpen && (
        <MemberForm
          member={selectedMember}
          isEditing={isEditing}
          onSave={handleSaveMember}
          onCancel={() => setIsFormOpen(false)}
        />
      )}
    </div>
  );
}
