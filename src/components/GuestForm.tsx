'use client';

import { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { SKILL_LEVEL_RANGES } from '@/lib/mmr';

interface GuestData {
  name: string;
  birthYear: number;
  gender: 'male' | 'female';
  skillLevel: 'S' | 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
  shuttlecockCount: number;
}

interface GuestFormProps {
  onSave: (guestData: GuestData) => Promise<void>;
  onCancel: () => void;
}

export default function GuestForm({ onSave, onCancel }: GuestFormProps) {
  const [formData, setFormData] = useState<GuestData>({
    name: '',
    birthYear: new Date().getFullYear() - 25,
    gender: 'male',
    skillLevel: 'C',
    shuttlecockCount: 0
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = '이름을 입력해주세요.';
    }

    if (formData.birthYear < 1900 || formData.birthYear > new Date().getFullYear()) {
      newErrors.birthYear = '올바른 출생년도를 입력해주세요.';
    }

    if (formData.shuttlecockCount < 0) {
      newErrors.shuttlecockCount = '셔틀콕 개수는 0개 이상이어야 합니다.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      await onSave(formData);
    } catch (error) {
      console.error('게스트 출석 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            게스트 출석
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
                errors.name ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="이름을 입력하세요"
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
          </div>

          {/* 출생년도 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              출생년도 *
            </label>
            <input
              type="number"
              value={formData.birthYear}
              onChange={(e) => setFormData({ ...formData, birthYear: parseInt(e.target.value) || 0 })}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.birthYear ? 'border-red-300' : 'border-gray-300'
              }`}
              min="1900"
              max={new Date().getFullYear()}
            />
            {errors.birthYear && <p className="text-red-500 text-xs mt-1">{errors.birthYear}</p>}
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

          {/* 실력 수준 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              실력 수준 *
            </label>
            <select
              value={formData.skillLevel}
              onChange={(e) => setFormData({ ...formData, skillLevel: e.target.value as 'S' | 'A' | 'B' | 'C' | 'D' | 'E' | 'F' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {Object.entries(SKILL_LEVEL_RANGES).map(([level]) => (
                <option key={level} value={level}>
                  {level}조
                </option>
              ))}
            </select>
          </div>

          {/* 셔틀콕 개수 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              셔틀콕 개수
            </label>
            <div className="grid grid-cols-3 gap-2 mb-2">
              {[0, 1, 2, 3, 4, 5].map((count) => (
                <button
                  key={count}
                  type="button"
                  onClick={() => setFormData({ ...formData, shuttlecockCount: count })}
                  className={`flex flex-col items-center justify-center p-3 border-2 rounded-lg transition-all duration-200 ${
                    formData.shuttlecockCount === count
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                  }`}
                >
                  <div className={`text-lg font-bold mb-1 ${
                    formData.shuttlecockCount === count ? 'text-blue-700' : 'text-gray-700'
                  }`}>
                    {count}
                  </div>
                  <div className={`text-xs ${
                    formData.shuttlecockCount === count ? 'text-blue-600' : 'text-gray-500'
                  }`}>
                    {count === 0 ? '없음' : '개'}
                  </div>
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500">
              선택된 개수: <span className="font-medium text-blue-600">{formData.shuttlecockCount}개</span>
            </p>
            {errors.shuttlecockCount && <p className="text-red-500 text-xs mt-1">{errors.shuttlecockCount}</p>}
          </div>

          {/* 안내 메시지 */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-yellow-800 text-sm">
              💡 게스트 정보는 오늘 하루만 유지되며, 내일 자동으로 삭제됩니다.
            </p>
          </div>

          {/* 버튼 */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg"
            >
              {loading ? '출석 중...' : '게스트 출석'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
