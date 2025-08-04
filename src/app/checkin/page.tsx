'use client';

import { useState } from 'react';
import { useApp } from '@/contexts/AppContext';
import { CheckIcon } from '@heroicons/react/24/outline';

export default function CheckInPage() {
  const { state, actions } = useApp();
  const [selectedMember, setSelectedMember] = useState<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any
  const [shuttlecockCount, setShuttlecockCount] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSignup, setShowSignup] = useState(false);
  const [signupData, setSignupData] = useState({
    name: '',
    birthYear: '',
    gender: 'male' as 'male' | 'female',
    skillLevel: 'C' as 'S' | 'A' | 'B' | 'C' | 'D' | 'E' | 'F'
  });
  const [signupErrors, setSignupErrors] = useState<{[key: string]: string}>({});

  const { members, attendance } = state;

  // 오늘 날짜 필터링 함수
  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  // 오늘 출석한 사람들만 필터링
  const todayAttendance = attendance.filter((attendee: any) => // eslint-disable-line @typescript-eslint/no-explicit-any
    isToday(new Date(attendee.date))
  );

  // 검색 필터링된 회원 목록
  const filteredMembers = members.filter(member => 
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    !todayAttendance.some(att => att.memberId === member.id)
  );

  const handleSubmit = async () => {
    if (!selectedMember || shuttlecockCount === null) return;

    setIsSubmitting(true);
    try {
      await actions.addAttendance(
        selectedMember.id,
        selectedMember.name,
        shuttlecockCount
      );
      setIsSuccess(true);

      // 3초 후 초기화
      setTimeout(() => {
        setSelectedMember(null);
        setShuttlecockCount(null);
        setIsSuccess(false);
        setSearchTerm('');
      }, 3000);
    } catch (error) {
      console.error('출석체크 실패:', error);
      alert('출석체크에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const validateSignup = () => {
    const errors: {[key: string]: string} = {};

    if (!signupData.name.trim()) {
      errors.name = '이름을 입력해주세요.';
    }

    if (!signupData.birthYear) {
      errors.birthYear = '태어난 년도를 입력해주세요.';
    } else {
      const year = parseInt(signupData.birthYear);
      if (year < 1980 || year > new Date().getFullYear()) {
        errors.birthYear = '올바른 년도를 입력해주세요.';
      }
    }

    setSignupErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSignup = async () => {
    if (!validateSignup()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const newMember = await actions.addMember({
        name: signupData.name.trim(),
        birthYear: parseInt(signupData.birthYear),
        gender: signupData.gender,
        skillLevel: signupData.skillLevel
      });

      // 회원가입 성공 후 바로 해당 회원 선택
      setSelectedMember(newMember);
      setShowSignup(false);
      setSignupData({ name: '', birthYear: '', gender: 'male', skillLevel: 'C' });
      setSignupErrors({});

      alert(`${signupData.name}님, 회원가입이 완료되었습니다! 이제 셔틀콕 개수를 선택해주세요.`);
    } catch (error) {
      console.error('회원가입 실패:', error);
      alert('회원가입에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-400 via-emerald-500 to-teal-600 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="bg-green-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
            <CheckIcon className="h-10 w-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">출석체크 완료!</h1>
          <p className="text-gray-600 mb-4">
            <span className="font-semibold text-green-600">{selectedMember?.name}</span>님의 출석이 등록되었습니다.
          </p>
          <p className="text-sm text-gray-500">
            셔틀콕 {shuttlecockCount}개 · {new Date().toLocaleTimeString('ko-KR')}
          </p>
          <div className="mt-6">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600 mx-auto"></div>
            <p className="text-xs text-gray-400 mt-2">잠시 후 자동으로 돌아갑니다...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-400 via-green-500 to-teal-600 p-4">
      <div className="max-w-2xl mx-auto">
        {/* 헤더 */}
        <div className="text-center mb-8 pt-8">
          <div className="bg-white bg-opacity-20 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
            <svg className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-5xl font-bold text-white mb-2 drop-shadow-lg">내맘대로 배드민턴</h1>
          <p className="text-left text-white text-opacity-80 text-l">1. 처음 오신 분은 "+ 회원 추가" 후 출석체크하세요 </p>
          <p className="text-left text-white text-opacity-80 text-l">2. 이름과 셔틀콕 개수를 선택 후 "출석체크 완료" 클릭!</p>
        </div>

        {/* 출석 현황 */}
        <div className="bg-white bg-opacity-20 rounded-2xl p-4 mb-6 backdrop-blur-sm">
          <div className="flex justify-between items-center text-black">
            <div className="text-center w-1/3">
              <div className="text-2xl font-bold">{todayAttendance.length}</div>
              <div className="text-sm opacity-90">출석 완료</div>
            </div>
            <div className="text-center w-1/3">
              <div className="text-2xl font-bold">{members.length - todayAttendance.length}</div>
              <div className="text-sm opacity-90">미출석</div>
            </div>
            <div className="text-center w-1/3">
              <div className="text-2xl font-bold">{new Date().toLocaleDateString('ko-KR')}</div>
              <div className="text-sm opacity-90">오늘</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* 단계 1: 이름 선택 */}
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-4">1. 이름을 선택하세요</h2>
            
            {/* 검색 */}
            <div className="mb-4">
              <input
                type="text"
                placeholder="이름 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* 회원 목록 */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-60 overflow-y-auto">
              {filteredMembers.map((member) => (
                <button
                  key={member.id}
                  onClick={() => setSelectedMember(member)}
                  className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                    selectedMember?.id === member.id
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="font-semibold text-lg">{member.name}</div>
                  <div className="text-xs text-gray-500">
                    {member.gender === 'male' ? '남' : '여'} · {member.skillLevel}
                  </div>
                </button>
              ))}
            </div>

            {filteredMembers.length === 0 && (
              <div className="text-center py-8">
                <div className="text-gray-500 mb-4">
                  {searchTerm ? '검색 결과가 없습니다.' : '출석 가능한 회원이 없습니다.'}
                </div>
                {!searchTerm && (
                  <button
                    onClick={() => setShowSignup(true)}
                    className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
                  >
                    + 새 회원으로 가입하기
                  </button>
                )}
              </div>
            )}

            {/* 회원가입 버튼 (항상 표시) */}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <button
                onClick={() => setShowSignup(true)}
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-center space-x-2"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span>회원 추가</span>
              </button>
            </div>
          </div>

          {/* 단계 2: 셔틀콕 개수 선택 */}
          <div className="p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">2. 제출할 셔틀콕 개수를 선택하세요</h2>
            
            <div className="grid grid-cols-3 gap-3 mb-6">
              {[0, 1, 2, 3, 4, 5].map((count) => (
                <button
                  key={count}
                  onClick={() => setShuttlecockCount(count)}
                  disabled={!selectedMember}
                  className={`p-4 rounded-xl border-2 transition-all duration-200 text-lg font-bold ${
                    shuttlecockCount === count
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : selectedMember
                      ? 'border-gray-200 hover:border-green-300 hover:bg-gray-50'
                      : 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {count}개
                </button>
              ))}
            </div>

            {/* 제출 버튼 */}
            <button
              onClick={handleSubmit}
              disabled={!selectedMember || shuttlecockCount === null || isSubmitting}
              className={`w-full py-4 rounded-xl font-bold text-lg transition-all duration-200 ${
                selectedMember && shuttlecockCount !== null && !isSubmitting
                  ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transform hover:scale-[1.02]'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>처리 중...</span>
                </div>
              ) : (
                '출석체크 완료'
              )}
            </button>

            {selectedMember && shuttlecockCount !== null && (
              <div className="mt-4 p-4 bg-blue-50 rounded-xl">
                <p className="text-sm text-blue-700">
                  <span className="font-semibold">{selectedMember.name}</span>님이 
                  <span className="font-semibold"> 셔틀콕 {shuttlecockCount}개</span>로 출석체크됩니다.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 회원가입 모달 */}
      {showSignup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">새 회원 등록</h2>
              <button
                onClick={() => {
                  setShowSignup(false);
                  setSignupErrors({});
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleSignup(); }} className="p-6 space-y-4">
              <div className="space-y-4">
                {/* 이름 입력 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">이름 *</label>
                  <input
                    type="text"
                    value={signupData.name}
                    onChange={(e) => setSignupData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="이름을 입력하세요"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      signupErrors.name ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {signupErrors.name && <p className="text-red-500 text-sm mt-1">{signupErrors.name}</p>}
                </div>

                {/* 태어난 년도 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">태어난 년도 *</label>
                  <input
                    type="number"
                    value={signupData.birthYear}
                    onChange={(e) => setSignupData(prev => ({ ...prev, birthYear: e.target.value }))}
                    placeholder="예: 1995"
                    min="1980"
                    max={new Date().getFullYear()}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      signupErrors.birthYear ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {signupErrors.birthYear && <p className="text-red-500 text-sm mt-1">{signupErrors.birthYear}</p>}
                </div>

                {/* 성별 선택 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">성별 *</label>
                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="male"
                        checked={signupData.gender === 'male'}
                        onChange={(e) => setSignupData(prev => ({ ...prev, gender: e.target.value as 'male' | 'female' }))}
                        className="mr-2"
                      />
                      남성
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="female"
                        checked={signupData.gender === 'female'}
                        onChange={(e) => setSignupData(prev => ({ ...prev, gender: e.target.value as 'male' | 'female' }))}
                        className="mr-2"
                      />
                      여성
                    </label>
                  </div>
                </div>

                {/* 실력 등급 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">실력 등급 *</label>
                  <select
                    value={signupData.skillLevel}
                    onChange={(e) => setSignupData(prev => ({ ...prev, skillLevel: e.target.value as 'S' | 'A' | 'B' | 'C' | 'D' | 'E' | 'F' }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {['S', 'A', 'B', 'C', 'D', 'E', 'F'].map((level) => (
                      <option key={level} value={level}>
                        {level}조
                      </option>
                    ))}
                  </select>
                </div>

                {/* 안내 메시지 */}
                <div className="bg-blue-50 rounded-lg p-3">
                  <div className="text-sm text-blue-700">
                    <div className="font-semibold mb-1">📝 안내사항</div>
                    <ul className="space-y-1 text-xs">
                      <li>• 입력한 정보는 나중에 수정 가능합니다. </li>
                      <li>• 가입 후 바로 출석체크가 가능합니다</li>
                    </ul>
                  </div>
                </div>

                {/* 버튼들 */}
                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowSignup(false);
                      setSignupErrors({});
                    }}
                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-lg transition-colors"
                  >
                    취소
                  </button>
                  <button
                    type="button"
                    onClick={handleSignup}
                    disabled={isSubmitting}
                    className={`flex-1 font-medium py-2 px-4 rounded-lg transition-colors ${
                      isSubmitting
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    {isSubmitting ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>등록 중...</span>
                      </div>
                    ) : (
                      '등록하기'
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
