'use client';

import { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Member } from '@/types';
// MMR 시스템 제거됨

interface MemberFormProps {
  member?: Member | null;
  isEditing: boolean;
  onSave: (memberData: Omit<Member, 'id' | 'createdAt' | 'updatedAt' | 'gamesPlayed' | 'gamesWon'>) => Promise<void>;
  onCancel: () => void;
}

export default function MemberForm({ member, isEditing, onSave, onCancel }: MemberFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    birthYear: '',
    gender: 'male' as 'male' | 'female',
    skillLevel: 'F' as Member['skillLevel']
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (member && isEditing) {
      setFormData({
        name: member.name,
        birthYear: member.birthYear.toString(),
        gender: member.gender,
        skillLevel: member.skillLevel
      });
    }
  }, [member, isEditing]);

  // 실력 등급 변경
  const handleSkillLevelChange = (skillLevel: Member['skillLevel']) => {
    setFormData({
      ...formData,
      skillLevel
    });
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = '이름은 필수입니다.';
    }

    const currentYear = new Date().getFullYear();
    const birthYear = parseInt(formData.birthYear);
    if (!formData.birthYear || birthYear < 1950 || birthYear > currentYear) {
      newErrors.birthYear = `올바른 태어난 년도를 입력해주세요. (1950-${currentYear})`;
    }

    // MMR 검증 제거됨

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      await onSave({
        name: formData.name.trim(),
        birthYear: parseInt(formData.birthYear),
        gender: formData.gender,
        skillLevel: formData.skillLevel
      });
    } catch (error) {
      console.error('회원 저장 실패:', error);
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {isEditing ? '회원 정보 수정' : '새 회원 등록'}
          </h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* 이름 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              이름 *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.name ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="이름을 입력하세요"
            />
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
          </div>

          {/* 태어난 년도 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              태어난 년도 *
            </label>
            <input
              type="number"
              value={formData.birthYear}
              onChange={(e) => setFormData({ ...formData, birthYear: e.target.value })}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.birthYear ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="예: 1990"
              min="1950"
              max={new Date().getFullYear()}
            />
            {errors.birthYear && <p className="text-red-500 text-sm mt-1">{errors.birthYear}</p>}
          </div>

          {/* 성별 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              성별 *
            </label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="male"
                  checked={formData.gender === 'male'}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value as 'male' | 'female' })}
                  className="mr-2"
                />
                남성
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="female"
                  checked={formData.gender === 'female'}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value as 'male' | 'female' })}
                  className="mr-2"
                />
                여성
              </label>
            </div>
          </div>

          {/* 실력 등급 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              실력 등급 *
            </label>
            <select
              value={formData.skillLevel}
              onChange={(e) => handleSkillLevelChange(e.target.value as Member['skillLevel'])}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {['S', 'A', 'B', 'C', 'D', 'E', 'F'].map((level) => (
                <option key={level} value={level}>
                  {level}조
                </option>
              ))}
            </select>
          </div>

          {/* MMR 시스템 제거됨 */}



          {/* 버튼 */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors"
            >
              {loading ? '저장 중...' : (isEditing ? '수정' : '등록')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
