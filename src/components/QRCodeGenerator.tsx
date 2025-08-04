'use client';

import { useState } from 'react';
import Image from 'next/image';
import { QrCodeIcon, ClipboardIcon, CheckIcon } from '@heroicons/react/24/outline';

interface QRCodeGeneratorProps {
  url: string;
  title: string;
}

export default function QRCodeGenerator({ url, title }: QRCodeGeneratorProps) {
  const [copied, setCopied] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [currentQRUrl, setCurrentQRUrl] = useState(0);

  // QR 코드 생성 URL (여러 서비스 대체 가능)
  const qrCodeUrls = [
    `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`,
    `https://chart.googleapis.com/chart?chs=200x200&cht=qr&chl=${encodeURIComponent(url)}`
  ];

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('클립보드 복사 실패:', err);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 max-w-sm mx-auto">
      <div className="text-center mb-4">
        <div className="bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
          <QrCodeIcon className="h-6 w-6 text-blue-600" />
        </div>
        <h3 className="text-lg font-bold text-gray-900">{title}</h3>
        <p className="text-sm text-gray-600">QR 코드를 스캔하거나 링크를 공유하세요</p>
      </div>

      {/* QR 코드 */}
      <div className="bg-gray-50 rounded-xl p-4 mb-4">
        <div className="bg-white rounded-lg p-4 flex justify-center">
          {!imageError ? (
            <Image
              src={qrCodeUrls[currentQRUrl]}
              alt="QR Code"
              width={192}
              height={192}
              className="w-48 h-48"
              onError={() => {
                if (currentQRUrl < qrCodeUrls.length - 1) {
                  setCurrentQRUrl(currentQRUrl + 1);
                } else {
                  setImageError(true);
                }
              }}
              unoptimized={true}
            />
          ) : (
            <div className="w-48 h-48 bg-gray-200 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <div className="text-4xl mb-2">📱</div>
                <div className="text-sm text-gray-600 mb-2">QR 코드</div>
                <div className="text-xs text-gray-500">
                  이미지 로드 실패
                </div>
                <button
                  onClick={() => {
                    setImageError(false);
                    setCurrentQRUrl(0);
                  }}
                  className="mt-2 text-xs text-blue-600 hover:text-blue-800 underline"
                >
                  다시 시도
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* URL 복사 */}
      <div className="space-y-3">
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-xs text-gray-500 mb-1">링크 주소</div>
          <div className="text-sm text-gray-800 break-all font-mono">{url}</div>
        </div>

        <button
          onClick={copyToClipboard}
          className={`w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
            copied
              ? 'bg-green-100 text-green-700 border border-green-200'
              : 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100'
          }`}
        >
          {copied ? (
            <>
              <CheckIcon className="h-5 w-5" />
              <span>복사 완료!</span>
            </>
          ) : (
            <>
              <ClipboardIcon className="h-5 w-5" />
              <span>링크 복사</span>
            </>
          )}
        </button>
      </div>

      {/* 사용 안내 */}
      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <div className="text-xs text-blue-700">
          <div className="font-semibold mb-1">사용 방법:</div>
          <ul className="space-y-1">
            <li>• QR 코드를 휴대폰으로 스캔</li>
            <li>• 또는 링크를 복사해서 공유</li>
            <li>• 각자 편한 시간에 출석체크</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
