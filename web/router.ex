defmodule EphemeralShare.Router do
  use EphemeralShare.Web, :router

  pipeline :browser do
    plug :accepts, ["html"]
    plug :fetch_session
    plug :fetch_flash
    plug :protect_from_forgery
  end

  pipeline :api do
    plug :accepts, ["json"]
  end

  scope "/", EphemeralShare do
    pipe_through :browser # Use the default browser stack

    get "/", PageController, :index
  end

  socket "/ws", EphemeralShare do
    channel "broker:*", BrokerChannel
  end

  # Other scopes may use custom stacks.
  # scope "/api", EphemeralShare do
  #   pipe_through :api
  # end
end
