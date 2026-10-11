import eslint from '@eslint/js';
import tseslintPlugin from '@typescript-eslint/eslint-plugin';
import tseslintParser from '@typescript-eslint/parser';
import reactHooksPlugin from 'eslint-plugin-react-hooks';

export default [
  eslint.configs.recommended,
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: {
      parser: tseslintParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      '@typescript-eslint': tseslintPlugin,
      'react-hooks': reactHooksPlugin,
    },
    rules: {
      'no-undef': 'off', // TypeScript checks this
      'no-unused-vars': 'off', // Covered by @typescript-eslint/no-unused-vars
      ...reactHooksPlugin.configs.recommended.rules,
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-console': 'warn',
    },
  },
  {
    ignores: ['dist/**', 'node_modules/**', 'vite.config.ts', 'vitest.config.ts'],
  },
];
