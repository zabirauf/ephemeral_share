defmodule EphemeralShareWeb.PageController do
  use EphemeralShareWeb, :controller

  def index(conn, _params) do
    render(conn, "index.html")
  end
end
