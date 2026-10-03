import { FlatCompat } from '@eslint/eslintrc';
import { createRequire } from 'node:module';
import { dirname } from 'node:path';
const require = createRequire(import.meta.url);
const compat = new FlatCompat({ baseDirectory: import.meta.dirname, resolvePluginsRelativeTo: dirname(require.resolve('eslint-config-next')) });
const config = [{ ignores: ['.next/**', 'node_modules/**', 'next-env.d.ts'] }, ...compat.extends('next/core-web-vitals', 'next/typescript')];
export default config;
