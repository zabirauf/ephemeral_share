defmodule EphemeralShare.PeerChannel do
  use Phoenix.Channel

  require Logger
  alias EphemeralShare.PeerManager

  @doc """
  Join the topic `peer:<GUID>` and add the peer in the peer manager
  """
  def join("peer:" <> peer_id, _auth_msg, socket) do
    Logger.debug "PeerChannle join peer:#{peer_id}"
    case valid_uuid?(peer_id) do
      true ->
        PeerManager.add_peer(peer_id)
        {:ok, assign(socket, :peer_id, peer_id)}
      false -> {:error, %{reason: "Invalid peer id"}}
    end
  end

  def join(_, _auth_msg, socket) do
    {:error, %{reason: "Invalid subchannel"}}
  end

  @doc """
  The socket connection got terminated, should remove the peer information from the
  peer manager
  """
  def terminate(_msg, socket) do
    PeerManager.remove_peer(socket.assigns[:peer_id])
    {:shutdown, :left}
  end

  # Topic handlers

  @doc """
  Send a request to connect with a peer to the peer with which the `sender_id` peer
  wants to connect.
  """
  def handle_in("connect", %{"peer_id" => peer_id, "sender_id" => sender_id}, socket) do
    Logger.debug "Connect Request #{peer_id}, #{sender_id}"

    case send_to_peer(peer_id, "peer_connect", %{"peer_id": sender_id}) do
      {:error, _} ->
        push socket, "error_connect", %{"id": peer_id}
      :ok ->
        Logger.debug "Sent peer connect request to #{peer_id} from #{sender_id}"
    end
    {:noreply, socket}
  end

  @doc """
  Pass the offer recieved from the initiator to the peer who wants to connect
  """
  def handle_in("offer", %{"offer" => offer, "peer_id" => peer_id, "sender_id" => sender_id}, socket) do
    Logger.debug "Offer Request #{inspect(offer)}, #{peer_id}, #{sender_id}"
    send_to_peer(peer_id, "offer", %{"offer": offer, "peer_id": sender_id})
    {:noreply, socket}
  end

  @doc """
  Pass the answer received from the connecting peer to the initiator
  """
  def handle_in("answer", %{"answer" => answer, "peer_id" => peer_id, "sender_id" => sender_id}, socket) do
    Logger.debug "Answer Request #{inspect(answer)}, #{peer_id}, #{sender_id}"
    send_to_peer(peer_id, "answer", %{"answer": answer, "peer_id": sender_id})
    {:noreply, socket}
  end

  defp send_to_peer(peer_id, event, msg) do
    case PeerManager.exists?(peer_id) do
      false ->
        {:error, %{"reason": "No such client exists"}}
      true ->
        EphemeralShare.Endpoint.broadcast("peer:" <> peer_id, event, msg)
    end
  end

  defp valid_uuid?(id) do
    try do
      UUID.info!(id)
    rescue
        e in ArgumentError -> false
    end

    true
  end
end
