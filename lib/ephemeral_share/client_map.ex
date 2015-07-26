defmodule EphemeralShare.ClientMap do

  require Logger

  def start_link() do
    Agent.start_link(fn -> HashDict.new end, name: __MODULE__)
  end

  def add_client(key, socket) do
    Logger.debug "ClientMap: Add: #{key}"
    Agent.update(__MODULE__, fn(h) ->
      Dict.put(h, key, socket)
    end)
  end

  def get_client(key) do
    Logger.debug "ClientMap: Get: Start: #{key}"
    value = Agent.get(__MODULE__, fn(h) ->
      Dict.get(h, key, :not_found)
    end)

    value
  end

  def remove_client(key) do
    Logger.debug "ClientMap: Delete: #{key}"
    Agent.get_and_update(__MODULE__, fn(h) ->
      {Dict.get(h, key, :not_found), Dict.delete(h, key)}
    end)
  end

end
