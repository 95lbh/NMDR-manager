/** @type {import('next').NextConfig} */
const nextConfig = {
  // React Strict Mode 활성화
  reactStrictMode: true,

  // 서버 외부 패키지 설정
  serverExternalPackages: [],

  // 실험적 기능 설정
  experimental: {
    // 번들링 최적화
    optimizePackageImports: ['@heroicons/react'],
  },

  // 웹팩 설정
  webpack: (config, { isServer }) => {
    // 클라이언트 사이드에서 Node.js 모듈 제외
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      }
    }

    return config
  },
  
  // 이미지 최적화 설정
  images: {
    domains: [],
    formats: ['image/webp', 'image/avif'],
  },
  
  // 환경 변수 설정
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  
  // 개발 서버 설정
  ...(process.env.NODE_ENV === 'development' && {
    // 개발 모드에서만 적용되는 설정
    onDemandEntries: {
      // 페이지가 메모리에 유지되는 시간 (ms)
      maxInactiveAge: 25 * 1000,
      // 동시에 메모리에 유지할 페이지 수
      pagesBufferLength: 2,
    },
  }),
}

module.exports = nextConfig
