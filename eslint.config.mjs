import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import eslintConfigPrettier from 'eslint-config-prettier/flat';
import simpleImportSort from 'eslint-plugin-simple-import-sort';

const interactionPolicy = {
  rules: {
    'no-transition-all': {
      meta: {
        type: 'problem',
        docs: { description: 'forbid broad transition-all motion in production UI' },
        schema: [],
        messages: { forbidden: 'Use an explicit transition property, never transition-all.' },
      },
      create(context) {
        if (
          context.filename.endsWith('.test.ts') ||
          context.filename.endsWith('.test.tsx') ||
          context.filename.endsWith('eslint.config.mjs')
        ) {
          return {};
        }
        return {
          Literal(node) {
            if (typeof node.value === 'string' && /(^|\s)transition-all(\s|$)/.test(node.value)) {
              context.report({ node, messageId: 'forbidden' });
            }
          },
        };
      },
    },
    'no-native-ui-formatting': {
      meta: {
        type: 'problem',
        docs: { description: 'require shared locale adapters for user-facing formatting' },
        schema: [],
        messages: { forbidden: 'Use the shared locale formatter adapters for user-facing values.' },
      },
      create(context) {
        const allowed =
          context.filename.endsWith('shared/lib/formatters.ts') ||
          context.filename.endsWith('components/ui/calendar.tsx') ||
          context.filename.includes('.test.');
        if (allowed) return {};
        return {
          NewExpression(node) {
            if (
              node.callee.type === 'MemberExpression' &&
              node.callee.object.type === 'Identifier' &&
              node.callee.object.name === 'Intl'
            ) {
              context.report({ node, messageId: 'forbidden' });
            }
          },
          MemberExpression(node) {
            if (
              node.property.type === 'Identifier' &&
              (node.property.name === 'toLocaleString' ||
                node.property.name === 'toLocaleDateString')
            ) {
              context.report({ node, messageId: 'forbidden' });
            }
          },
        };
      },
    },
    'no-direct-calculation-endpoint': {
      meta: {
        type: 'problem',
        docs: { description: 'keep calculation endpoint literals in the endpoint registry' },
        schema: [],
        messages: {
          forbidden: 'Use getCalculationEndpoint instead of a calculation route literal.',
        },
      },
      create(context) {
        if (
          context.filename.endsWith('shared/lib/calculation-endpoints.ts') ||
          context.filename.includes('.test.')
        ) {
          return {};
        }
        return {
          Literal(node) {
            if (
              typeof node.value === 'string' &&
              /^\/api\/calculate\/(single|regular|compare|optimize|retirement)$/.test(node.value)
            ) {
              context.report({ node, messageId: 'forbidden' });
            }
          },
        };
      },
    },
  },
};

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    plugins: {
      'simple-import-sort': simpleImportSort,
      'interaction-policy': interactionPolicy,
    },
    rules: {
      // Existing data-loading effects intentionally update local state.
      // Migrate them incrementally instead of making the Next upgrade block lint.
      'react-hooks/set-state-in-effect': 'off',
      'simple-import-sort/imports': [
        'warn',
        {
          groups: [
            ['^\\u0000'],
            [
              '^(node:|assert|buffer|child_process|crypto|events|fs|http|https|os|path|process|stream|url|util|zlib)',
            ],
            ['^@?\\w'],
            ['^@/'],
            ['^\\.\\.(?!/?$)', '^\\.\\./?$'],
            ['^\\./(?=.*/)(?!/?$)', '^\\.(?!/?$)', '^\\./?$'],
            ['^.+\\.(css|scss|sass)$'],
          ],
        },
      ],
      'simple-import-sort/exports': 'warn',
      'interaction-policy/no-transition-all': 'error',
      'interaction-policy/no-native-ui-formatting': 'error',
      'interaction-policy/no-direct-calculation-endpoint': 'error',
    },
  },
  {
    files: ['app/**/*.{ts,tsx}', 'features/**/*.{ts,tsx}', 'shared/**/*.{ts,tsx}', 'lib/**/*.ts'],
    ignores: ['**/*.test.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@/db',
              message:
                'Use a data or server-persistence adapter instead of direct database access.',
            },
          ],
        },
      ],
    },
  },
  {
    files: [
      'lib/data/**/*.{ts,tsx}',
      'lib/sync/**/*.{ts,tsx}',
      'lib/server/**/*repository.ts',
      'lib/server/admin/audit.ts',
      'lib/server/http/api-handler.ts',
      'lib/server/http/postgres-rate-limit-store.ts',
      'lib/server/observability/vital-aggregates.ts',
      'lib/server/portfolio/access.ts',
      'lib/server/sync/sync-lock.ts',
    ],
    rules: { 'no-restricted-imports': 'off' },
  },
  eslintConfigPrettier,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
  ]),
]);

export default eslintConfig;
