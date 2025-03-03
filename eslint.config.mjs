import globals from "globals";
import eslintPluginMocha from "eslint-plugin-mocha";
import babelEslintParser from "@babel/eslint-parser";

export default [
  {
    languageOptions: {
      parser: babelEslintParser,
      parserOptions: {
        requireConfigFile: false, // No need for a Babel config file
        babelOptions: {
          presets: [["@babel/preset-env", { targets: "ie 11" }]], // Ensure ES5 compatibility
        },
      },
      ecmaVersion: 5, // Keep ES5 syntax
      sourceType: "script", // Use "script" mode for non-module environments
      globals: {
        ...globals.node,
        ...globals.mocha,
      },
    },
    plugins: {
      mocha: eslintPluginMocha
    },
    rules: {
      semi: "error"
    },
  },
];

