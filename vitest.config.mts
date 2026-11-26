import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: 'node',
    setupFiles: ['./vitest.setup.ts'],
    include: ['tests/unit/**/*.test.ts', 'tests/unit/**/*.test.tsx', 'tests/int/**/*.int.test.ts'],
    testTimeout: 60_000,
    hookTimeout: 120_000,
    // Test tích hợp dùng chung một DB test → chạy tuần tự
    fileParallelism: false,
  },
})
