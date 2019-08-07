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

EXPOSE 4000

RUN MIX_ENV=prod mix compile \
    && npm run deploy --prefix ./assets \
    && mix phx.digest

CMD PORT=4001 MIX_ENV=prod mix phx.server