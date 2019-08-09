FROM elixir:1.9.1

RUN mkdir /app
COPY . /app
WORKDIR /app

RUN mix local.hex --force \
    && mix archive.install --force hex phx_new 1.4.9 \
    && apt-get update \
    && curl -sL https://deb.nodesource.com/setup_10.x | bash \
    && apt-get install -y apt-utils \
    && apt-get install -y nodejs \
    && apt-get install -y build-essential \
    && mix local.rebar --force

ENV PORT 4001
ENV HOST localhost
ENV MIX_ENV prod

EXPOSE 4001

RUN npm install --prefix ./assets

RUN mix compile \
    && npm run deploy --prefix ./assets \
    && mix phx.digest

CMD mix phx.server