'use client';

import { useState } from 'react';
import {
  UserPlusIcon,
  MagnifyingGlassIcon,
  ClockIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';
import { Member } from '@/types';
import { useApp } from '@/contexts/AppContext';
import GuestForm from './GuestForm';



export default function AttendanceCheck() {
  const { state, actions } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [showGuestForm, setShowGuestForm] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [isShuttlecockModalOpen, setIsShuttlecockModalOpen] = useState(false);
  const [selectedAttendance, setSelectedAttendance] = useState<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any
  const [isEditShuttlecockModalOpen, setIsEditShuttlecockModalOpen] = useState(false);

  const { members, attendance } = state;

  const attendedMemberIds = attendance.map(a => a.memberId);
  const unattendedMembers = members.filter(m => !attendedMemberIds.includes(m.id));
  
  const filteredUnattendedMembers = unattendedMembers.filter(member =>
    member.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCheckIn = (member: Member) => {
    setSelectedMember(member);
    setIsShuttlecockModalOpen(true);
  };

  const handleShuttlecockSelect = async (count: number) => {
    if (!selectedMember) return;

    try {
      await actions.addAttendance(selectedMember.id, selectedMember.name, count);
      setIsShuttlecockModalOpen(false);
      setSelectedMember(null);
    } catch (error) {
      console.error('출석 체크 실패:', error);
      alert('출석 체크에 실패했습니다.');
    }
  };

  const handleShuttlecockModalClose = () => {
    setIsShuttlecockModalOpen(false);
    setSelectedMember(null);
  };

  const handleGuestCheckIn = async (guestData: { name: string; shuttlecockCount: number; gender: string; skillLevel: string; birthYear: number }) => {
    try {
      const guestId = `guest-${Date.now()}`;
      const guestName = `${guestData.name}`;

      // 게스트 정보를 포함한 출석 데이터 생성
      await actions.addAttendance(guestId, guestName, guestData.shuttlecockCount, {
        gender: guestData.gender,
        skillLevel: guestData.skillLevel,
        birthYear: guestData.birthYear
      });
      setShowGuestForm(false);
    } catch (error) {
      console.error('게스트 출석 실패:', error);
      alert('게스트 출석에 실패했습니다.');
    }
  };

  const handleUpdateShuttlecockCount = (attendanceId: string) => {
    const currentAttendance = attendance.find(a => a.id === attendanceId);
    if (!currentAttendance) return;

    setSelectedAttendance(currentAttendance);
    setIsEditShuttlecockModalOpen(true);
  };

  const handleEditShuttlecockSelect = async (count: number) => {
    if (!selectedAttendance) return;

    try {
      await actions.updateAttendance(selectedAttendance.id, { shuttlecockCount: count });
      setIsEditShuttlecockModalOpen(false);
      setSelectedAttendance(null);
    } catch (error) {
      console.error('셔틀콕 개수 수정 실패:', error);
      alert('셔틀콕 개수 수정에 실패했습니다.');
    }
  };

  const handleEditShuttlecockModalClose = () => {
    setIsEditShuttlecockModalOpen(false);
    setSelectedAttendance(null);
  };

  const handleRemoveAttendance = async (attendanceId: string) => {
    if (confirm('출석을 취소하시겠습니까?')) {
      try {
        await actions.deleteAttendance(attendanceId);
      } catch (error) {
        console.error('출석 취소 실패:', error);
        alert('출석 취소에 실패했습니다.');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">출석 체크</h1>
        <div className="text-sm text-gray-600">
          {new Date().toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'long'
          })}
        </div>
      </div>

      {/* 통계 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <UserGroupIcon className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">오늘 출석자</p>
              <p className="text-2xl font-bold text-gray-900">{attendance.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold">🏸</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">셔틀콕 개수</p>
              <p className="text-2xl font-bold text-gray-900">
                {attendance.reduce((sum, a) => sum + a.shuttlecockCount, 0)}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <ClockIcon className="h-8 w-8 text-yellow-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">미출석자</p>
              <p className="text-2xl font-bold text-gray-900">{unattendedMembers.length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 출석 체크 */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">출석 체크</h2>
            <button
              onClick={() => setShowGuestForm(true)}
              className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm flex items-center space-x-1"
            >
              <UserPlusIcon className="h-4 w-4" />
              <span>게스트 출석</span>
            </button>
          </div>

          {/* 검색 */}
          <div className="relative mb-4">
            <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="회원 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>



          {/* 미출석 회원 목록 */}
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredUnattendedMembers.map((member) => (
              <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{member.name}</p>
                  <p className="text-sm text-gray-600">{member.skillLevel}조</p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleCheckIn(member)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
                  >
                    출석
                  </button>
                </div>
              </div>
            ))}
            
            {filteredUnattendedMembers.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500">
                  {searchTerm ? '검색 결과가 없습니다.' : '모든 회원이 출석했습니다!'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* 오늘 출석자 */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">오늘 출석자</h2>
          
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {attendance.map((attendee) => (
              <div key={attendee.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{attendee.memberName}</p>
                  <p className="text-sm text-gray-600">
                    출석시간: {attendee.createdAt.toLocaleTimeString()}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="text-center">
                    <button
                      onClick={() => handleUpdateShuttlecockCount(attendee.id)}
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        attendee.shuttlecockCount > 0
                          ? 'bg-green-100 text-green-800 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                      }`}
                      title="셔틀콕 개수 수정"
                    >
                      🏸 {attendee.shuttlecockCount}개
                    </button>
                  </div>
                  <button
                    onClick={() => handleRemoveAttendance(attendee.id)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    취소
                  </button>
                </div>
              </div>
            ))}
            
            {attendance.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500">아직 출석한 사람이 없습니다.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 게스트 출석 폼 */}
      {showGuestForm && (
        <GuestForm
          onSave={handleGuestCheckIn}
          onCancel={() => setShowGuestForm(false)}
        />
      )}

      {/* 셔틀콕 개수 선택 모달 */}
      {isShuttlecockModalOpen && selectedMember && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                셔틀콕 개수 선택
              </h3>
              <p className="text-sm text-gray-600">
                <span className="font-medium text-blue-600">{selectedMember.name}</span>님이 제출할 셔틀콕 개수를 선택해주세요.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-6">
              {[0, 1, 2, 3, 4, 5].map((count) => (
                <button
                  key={count}
                  onClick={() => handleShuttlecockSelect(count)}
                  className="flex flex-col items-center justify-center p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 group"
                >
                  <div className="text-2xl font-bold text-gray-700 group-hover:text-blue-600 mb-1">
                    {count}
                  </div>
                  <div className="text-xs text-gray-500 group-hover:text-blue-500">
                    {count === 0 ? '없음' : count === 1 ? '개' : '개'}
                  </div>
                </button>
              ))}
            </div>

            <div className="flex justify-center">
              <button
                onClick={handleShuttlecockModalClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 셔틀콕 개수 수정 모달 */}
      {isEditShuttlecockModalOpen && selectedAttendance && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                셔틀콕 개수 수정
              </h3>
              <p className="text-sm text-gray-600">
                <span className="font-medium text-blue-600">{selectedAttendance.memberName}</span>님의 셔틀콕 개수를 수정해주세요.
              </p>
              <p className="text-xs text-gray-500 mt-1">
                현재: <span className="font-medium">{selectedAttendance.shuttlecockCount}개</span>
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-6">
              {[0, 1, 2, 3, 4, 5].map((count) => (
                <button
                  key={count}
                  onClick={() => handleEditShuttlecockSelect(count)}
                  className={`flex flex-col items-center justify-center p-4 border-2 rounded-lg transition-all duration-200 group ${
                    count === selectedAttendance.shuttlecockCount
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-500 hover:bg-blue-50'
                  }`}
                >
                  <div className={`text-2xl font-bold mb-1 ${
                    count === selectedAttendance.shuttlecockCount
                      ? 'text-blue-600'
                      : 'text-gray-700 group-hover:text-blue-600'
                  }`}>
                    {count}
                  </div>
                  <div className={`text-xs ${
                    count === selectedAttendance.shuttlecockCount
                      ? 'text-blue-500'
                      : 'text-gray-500 group-hover:text-blue-500'
                  }`}>
                    {count === 0 ? '없음' : count === 1 ? '개' : '개'}
                  </div>
                </button>
              ))}
            </div>

            <div className="flex justify-center">
              <button
                onClick={handleEditShuttlecockModalClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
