import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import globals from 'globals';

const rawHex = { selector: 'Literal[value=/^#[0-9a-fA-F]{3,8}$/]', message: 'Use design tokens (see src/styles/tokens.css), not raw hex colours.' };

export default tseslint.config(
  { ignores: ['dist/**', 'node_modules/**', 'playwright-report/**', 'test-results/**', '.screenshots/**', 'public/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  jsxA11y.flatConfigs.recommended,
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: { globals: globals.browser },
    plugins: { 'react-hooks': reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/refs': 'off',
      'react-hooks/immutability': 'off',
      'react-hooks/purity': 'off',
      'react-hooks/static-components': 'off',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/ban-ts-comment': ['error', { 'ts-expect-error': 'allow-with-description', 'ts-ignore': true }],
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-console': 'error',
      'no-restricted-syntax': ['error', rawHex],
      'jsx-a11y/no-autofocus': 'off',
    },
  },
  {
    // The UI never touches the mock backend or IndexedDB directly; primitives never reach into data or features.
    files: ['src/components/ui/**', 'src/components/patterns/**'],
    rules: {
      'no-restricted-imports': ['error', { patterns: [{ group: ['@/features/*', '@/lib/services/*', '@/lib/db/*', '@/seed/*', 'idb'], message: 'Primitives and patterns must not import data or feature code.' }] }],
    },
  },
  {
    files: ['src/features/**', 'src/app/**'],
    rules: {
      'no-restricted-imports': ['error', { patterns: [{ group: ['idb', '@/seed', '@/seed/*'], message: 'Go through src/lib/services; the seed belongs to the data layer.' }] }],
    },
  },
  { files: ['src/config/brand.ts', 'src/lib/prefs.ts', '**/*.test.{ts,tsx}', 'scripts/**', 'e2e/**', '*.config.*'], rules: { 'no-restricted-syntax': 'off', 'no-console': 'off' }, languageOptions: { globals: { ...globals.node, ...globals.browser } } },
);
