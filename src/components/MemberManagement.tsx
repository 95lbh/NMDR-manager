'use client';

import { useState } from 'react';
import { PlusIcon, PencilIcon, TrashIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { Member } from '@/types';
import MemberForm from './MemberForm';
import { getSkillLevelColor, calculateWinRate } from '@/lib/mmr';
import { useApp } from '@/contexts/AppContext';



const genderLabels = {
  male: '남성',
  female: '여성'
};

export default function MemberManagement() {
  const { state, actions } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const { members, loading, error } = state;

  const filteredMembers = members.filter(member =>
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
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <PlusIcon className="h-5 w-5" />
          <span>새 회원 추가</span>
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
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  이름
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  나이/성별
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  실력등급
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  전적
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  가입일
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  작업
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
                filteredMembers.map((member) => (
                  <tr key={member.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{member.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {getCurrentAge(member.birthYear)}세 / {genderLabels[member.gender]}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSkillLevelColor(member.skillLevel)}`}>
                        {member.skillLevel}조
                      </span>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>
                        <div>{member.gamesWon}승 {member.gamesPlayed - member.gamesWon}패</div>
                        <div className="text-xs text-gray-500">
                          승률 {calculateWinRate(member.gamesWon, member.gamesPlayed)}%
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {member.createdAt.toLocaleDateString('ko-KR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => handleEditMember(member)}
                          className="text-blue-600 hover:text-blue-900 p-1"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteMember(member.id)}
                          className="text-red-600 hover:text-red-900 p-1"
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
          
          {filteredMembers.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">검색 결과가 없습니다.</p>
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
