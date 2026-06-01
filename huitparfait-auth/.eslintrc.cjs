module.exports = {
    root: true,
    env: {
        es2022: true,
        node: true,
    },
    parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
    },
    ignorePatterns: ['src/infra/config.js'],
    rules: {
        'no-unused-vars': ['warn', { argsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' }],
    },
}
