const getJestConfig = () => {
  return `const {
  name
} = require('./package.json');

const {
  pathsToModuleNameMapper
} = require('ts-jest');

const {
  compilerOptions
} = require('../../tsconfig.json');

module.exports = {
  rootDir: 'src',
  displayName: name,
  name,
  preset: 'ts-jest',
  coveragePathIgnorePatterns: ['main.ts', 'swagger.ts', 'node_modules', 'module.ts', 'interface.ts'],
  setupFilesAfterEnv: ['../../../tests/common-initialization.js', '../tests/initialization.js'],
  moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, {
    prefix: '<rootDir>/../../../',
  }),
};
`
}

const getTsconfigBuild = () => {
  return `{
  "extends": "../../tsconfig.json",
  "exclude": ["node_modules", "dist", "**/*spec.ts"]
}
`
}

const getTsconfig = (name) => {
  return `{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "declaration": false,
    "outDir": "../../dist/apps/${name}"
},
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
`
}

const getPackage = (name) => {
  return `{
  "name": "@app/${name}",
  "version": "v0.0.1",
  "description": "monorepo ${name}",
  "author": {
    "name": "Marcio Sales",
    "email": "marcionsales@hotmail.com"
  },
  "scripts": {
    "format": "../../tools/eslint/node_modules/.bin/prettier --write \''**/*.{ts, js, json}\''",
    "test": "../../node_modules/jest/bin/jest.js --maxWorkers=50%",
    "lint": "yarn format && ../../tools/eslint/node_modules/.bin/eslint \''src/**/*.{ts, js, json}\'' --fix"
  },
  "engines": {
    "node": ">=18 <=20"
  },
  "license": "MIT",
  "dependencies": {},
  "devDependencies": {}
}
`
}

const getDockerFile = (name) => {
  return `FROM node:14

ADD . /app

WORKDIR /app

RUN ls /app -al

RUN yarn && yarn build @app/${name}

COPY apps/${name}/package.json dist/apps/${name}/
COPY apps/${name}/tsconfig.build.json dist/apps/${name}/
COPY apps/${name}/tsconfig.json dist/apps/${name}/

EXPOSE 4000

RUN yarn --cwd dist/apps/${name}
RUN yarn --cwd dist/apps/libs/modules
RUN yarn --cwd dist/apps/libs/utils
RUN yarn --cwd dist/apps/libs/core

RUN ls dist/apps/${name} -al

RUN ls /app -al

RUN yarn

CMD yarn --cwd apps start:${name}:prd
`
}

const getEslintIgonre = () => {
  return `# dependencies
node_modules

# git, vs config
.vscode
.gitignore
`
}

const getEslint = () => {
  return `const config = require('@tools/eslint.config');

  module.exports = config;`
}

const getDockerignore = () => {
  return `../*
  jest.config.js
  node_modules/
  tests/
`
}

const vsCode = (name) => {
  return {
    extensions: `{
  "recommendations": [
    "firsttris.vscode-jest-runner"
  ]
}`,
    launch: `{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "App: @app/${name}.api",
      "type": "node",
      "request": "launch",
      "localRoot": "##{workspaceFolder}/../../",
      "runtimeExecutable": "yarn",
      "runtimeArgs": [
        "start:${name}:dev"
      ],
      "console": "integratedTerminal",
      "smartStep": true,
      "sourceMaps": true,
      "remoteRoot": "##{workspaceFolder}/src",
      "skipFiles": [
        "<node_internals>/**"
      ]
    },
    {
      "name": "Test: @app/${name}.api",
      "type": "node",
      "args": [
        "--runInBand",
        "--config=##{workspaceFolder}/jest.config.js"
      ],
      "request": "launch",
      "console": "integratedTerminal",
      "runtimeExecutable": "yarn",
      "cwd": "##{workspaceFolder}",
      "runtimeArgs": [
        "test"
      ],
      "sourceMaps": true
    }
  ]
}`,
    settings: `{
  "editor.tabSize": 2,
  "editor.codeActionsOnSave": {
    "source.fixAll": true
  },
  "[typescript]": {
    "editor.codeActionsOnSave": {
      "source.fixAll": true
    },
    "editor.formatOnSave": true
  },
  "[javascript]": {
    "editor.codeActionsOnSave": {
      "source.fixAll": true
    },
    "editor.formatOnSave": true
  },
  "editor.formatOnSave": true,
  "eslint.validate": ["javascript"],
  "files.exclude": {
    "**/node_modules": true,
    "**/*dist*": true,
    "**/*coverage*": true,
    "**/*node_modules": true,
    "**/*package-lock.json*": true,
    "**/*yarn.lock*": true
  },
  "javascript.format.insertSpaceAfterOpeningAndBeforeClosingEmptyBraces": false,
  "typescript.format.insertSpaceAfterOpeningAndBeforeClosingEmptyBraces": false
}
`,
  }
}

module.exports = { getJestConfig, getTsconfigBuild, getTsconfig, getPackage, getDockerFile, getDockerignore, getEslintIgonre, vsCode, getEslint }