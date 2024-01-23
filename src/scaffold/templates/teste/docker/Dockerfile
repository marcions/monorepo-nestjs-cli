FROM node:20

ADD . /app

WORKDIR /app

RUN ls /app -al

RUN yarn && yarn build @app/teste

COPY apps/teste/package.json dist/apps/teste/
COPY apps/teste/tsconfig.build.json dist/apps/teste/
COPY apps/teste/tsconfig.json dist/apps/teste/

EXPOSE 4000

RUN yarn --cwd dist/apps/teste
RUN yarn --cwd dist/apps/libs/auth
RUN yarn --cwd dist/apps/libs/core
RUN yarn --cwd dist/apps/libs/infra
RUN yarn --cwd dist/apps/libs/utils

RUN ls dist/apps/teste -al

RUN ls /app -al

RUN yarn

CMD yarn --cwd apps start:teste:prd
