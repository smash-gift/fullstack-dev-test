/** @type {import('ts-jest').JestConfigWithTsJest} **/
export default {
  preset: 'ts-jest/presets/default-esm', // Suporte ESM
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1', // Trata .js como extensões opcionais se existirem
  },
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        useESM: true,
        diagnostics: {
          ignoreCodes: [5107], // Ignora o erro de depreciação do moduleResolution
        },
      },
    ],
  },
  verbose: true,
};
