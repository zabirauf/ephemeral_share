defmodule EphemeralShare.ClientMap do

  def start_link() do
    Agent.start_link(fn -> HashSet.new end, name: __MODULE__)
  end

  def add_client(key, socket) do
    Agent.update(__MODULE__, fn(h) ->
      Dict.put(h, key, socket)
    end)
  end

  def get_client(key) do
    Agent.get(__MODULE__, fn(h) ->
      Dict.get(h, key, :not_found)
    end)
  end

  def remove_client(key) do
    Agent.get_and_update(__MODULE__, fn(h) ->
      {Dict.get(h, key, :not_found), Dict.delete(h, key)}
    end)
  end

end
