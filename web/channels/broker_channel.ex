defmodule EphemeralShare.BrokerChannel do
  use Phoenix.Channel

  alias EphemeralShare.ClientMap

  def join("broker:match", _auth_msg, socket) do
    {:ok, socket}
  end

  def join("broker:" <> _sub_topic, _auth_msg, socket) do
    {:error, %{reason: "Invalid subchannel"}}
  end

  def terminate(_msg, socket) do
    ClientMap.remove_client(socket.assigns[:id])
    {:shutdown, :left}
  end

  def handle_in("register", _, socket) do
    id = UUID.uuid4()
    ClientMap.add_client(id, socket)
    assign(socket, :id, id)

    push socket, "registered", %{"id": id}
    {:no_reply, socket}
  end

  def handle_in("connect", %{"peer_id": peer_id, "sender_id": sender_id}, socket) do
    send_to_peer(peer_id, "peer_connect", %{"peer_id": sender_id})
    {:noreply, socket}
  end

  def handle_in("offer", %{"offer": offer, "peer_id": peer_id, "sender_id": sender_id}, socket) do
    send_to_peer(peer_id, "offer", %{"offer": offer, "peer_id": sender_id})
    {:noreply, socket}
  end

  def handle_in("answer", %{"answer": answer, "peer_id": peer_id, "sender_id": sender_id}, socket) do
    send_to_peer(peer_id, "answer", %{"answer": answer, "peer_id": sender_id})
    {:noreply, socket}
  end

  defp send_to_peer(peer_id, topic, msg) do
    case ClientMap.get_client(peer_id) do
      :not_found ->
        {:error, %{"reason": "No such client exists"}}
      peer_socket ->
        push peer_socket, topic, msg
    end
  end

end
