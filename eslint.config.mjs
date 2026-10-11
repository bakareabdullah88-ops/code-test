import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

const rawHex = {
  selector: "Literal[value=/^#[0-9a-fA-F]{3,8}$/]",
  message: 'Use design tokens (see src/styles/tokens.css), not raw hex colours.',
};

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores(['.next/**', 'node_modules/**', 'next-env.d.ts', 'playwright-report/**', 'test-results/**', '.screenshots/**']),
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/ban-ts-comment': ['error', { 'ts-expect-error': 'allow-with-description', 'ts-ignore': true }],
      'no-console': 'error',
      'no-restricted-syntax': ['error', rawHex],
    },
  },
  {
    // The UI never touches the mock server or IndexedDB directly.
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/lib/api/**', 'src/mock-server/**'],
    rules: {
      'no-restricted-imports': ['error', { patterns: [
        { group: ['@/mock-server', '@/mock-server/*', 'idb'], message: 'Go through src/lib/services; only lib/api may load the mock server.' },
      ] }],
    },
  },
  {
    // Boundaries: primitives and patterns never reach into data, features or the API.
    files: ['src/components/ui/**', 'src/components/patterns/**'],
    // Declared after the general block so these patterns apply in full (flat config replaces, not merges).
    rules: {
      'no-restricted-imports': ['error', { patterns: [
        { group: ['@/features/*', '@/lib/services/*', '@/lib/api/*', '@/mock-server', '@/mock-server/*', 'idb'], message: 'Primitives and patterns must not import data or feature code.' },
      ] }],
    },
  },
  {
    // Token definitions and brand config legitimately hold colour values; tests and scripts are exempt.
    files: ['src/config/brand.ts', '**/*.test.{ts,tsx}', 'scripts/**', 'e2e/**'],
    rules: { 'no-restricted-syntax': 'off', 'no-console': 'off' },
  },
]);
