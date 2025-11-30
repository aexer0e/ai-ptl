import js from '@eslint/js';
import tsEslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import eslintConfigPrettier from 'eslint-config-prettier';
import minecraftLinting from 'eslint-plugin-minecraft-linting';
import tseslint from 'typescript-eslint';

export default [
    eslintConfigPrettier,
    js.configs.recommended,
    ...tseslint.configs.recommended,
    {
        files: ['BP/**/*.ts'],
        languageOptions: {
            parser: tsParser,
            parserOptions: {
                ecmaVersion: 'latest',
                sourceType: 'module'
            }
        },
        plugins: {
            tsEslint,
            'minecraft-linting': minecraftLinting
        },
        rules: {
            ...tsEslint.configs['eslint-recommended'].rules,
            ...tsEslint.configs['recommended'].rules,
            "no-unused-vars": "off",
            "@typescript-eslint/no-unused-vars": [ "error", { "args": "all", "ignoreRestSiblings": true, "argsIgnorePattern": "^_" }],
            "@typescript-eslint/no-loss-of-precision": "off",
            "@typescript-eslint/ban-ts-comment": "off",
            "indent": "off",
            "linebreak-style": "off",
            "quotes": [ "error", "double", { "avoidEscape": true }],
            "semi": "off",
            "no-empty": [ "error", { "allowEmptyCatch": true }],
            "@typescript-eslint/semi": [ "error" ],
            "minecraft-linting/avoid-unnecessary-command": "error"
        }

    }
]