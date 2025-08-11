module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended'
  ],
  root: true,
  env: {
    node: true,
    jest: true,
  },
  ignorePatterns: ['.eslintrc.js', 'dist/', 'node_modules/'],
  rules: {
    '@typescript-eslint/no-explicit-any': 'off', // Allow any for now
    '@typescript-eslint/no-unused-vars': 'error',
    'no-unused-vars': 'off',
    'no-undef': 'off', // TypeScript handles this
    'prefer-const': 'error',
    'no-var': 'error'
  },
};