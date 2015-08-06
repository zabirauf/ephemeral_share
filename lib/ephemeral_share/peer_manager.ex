defmodule EphemeralShare.PeerManager do

  def add_peer(peer_id) do
    EphemeralShare.PeerState.start_link(peer_id)
  end

  def exists?(peer_id) do
    exists = EphemeralShare.PeerState.peer_state_proc_id(peer_id)
    |> :global.whereis_name

    case exists do
      :undefined -> false
      _ -> true
    end
  end

  def remove_peer(peer_id) do
    EphemeralShare.PeerState.stop(peer_id)
  end
end
