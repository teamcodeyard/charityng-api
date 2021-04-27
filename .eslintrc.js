module.exports = {
  root: true,
  env: {
    node: true,
  },
  extends: [
    'plugin:vue/essential',
    '@vue/airbnb',
  ],
  parserOptions: {
    parser: 'babel-eslint',
  },
  rules: {
    'linebreak-style': 'off',
    'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    'template-curly-spacing': 'off',
    indent: 'off',
  },
  plugins: ['vue'],
  overrides: [
    {
      files: 'src/**',
      excludedFiles: '',
      rules: {
        'max-len': [2, 120, 4, { ignoreUrls: true }],
      },
    },
  ],
};
