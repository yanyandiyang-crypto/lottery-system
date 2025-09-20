module.exports = {
  extends: [
    'react-app',
    'react-app/jest'
  ],
  rules: {
    'no-unused-vars': 'warn',
    'no-use-before-define': 'warn',
    'react-hooks/exhaustive-deps': 'warn',
    'no-empty-pattern': 'warn'
  }
};
