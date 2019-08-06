defmodule EphemeralShare.Repo do
  use Ecto.Repo,
    otp_app: :ephemeral_share,
    adapter: Ecto.Adapters.Postgres
end
