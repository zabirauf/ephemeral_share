defmodule EphemeralShare.PeerState do
  require Logger
  use GenServer

  def start_link(peer_id) do
    GenServer.start_link(__MODULE__, [peer_id], name: {:global, peer_state_proc_id(peer_id)})
  end

  def stop(peer_id) do
    peer_id
    |> peer_state_proc_id
    |> :global.whereis_name()
    |> GenServer.cast(:shutdown)
  end

  def peer_state_proc_id(peer_id) do
    "peer_state:" <> peer_id
  end

  # Server (callbacks)

  def init(args) do
    {:ok, args}
  end

  def handle_cast(:shutdown, state) do
    Logger.debug("Shutdown peer state #{inspect(state)}")
    {:stop, :shutdown, state}
  end
end
