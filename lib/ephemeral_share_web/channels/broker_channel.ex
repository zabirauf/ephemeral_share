defmodule EphemeralShare.BrokerChannel do
  use Phoenix.Channel

  require Logger
  alias EphemeralShare.ClientMap

  def join("broker:match", _auth_msg, socket) do
    {:ok, socket}
  end

  def join("broker:" <> _sub_topic, _auth_msg, socket) do
    {:error, %{reason: "Invalid subchannel"}}
  end

  def terminate(_msg, socket) do
    {:shutdown, :left}
  end

  def handle_in("register", %{}, socket) do
    id = socket.assigns.peer_id
    push(socket, "registered", %{id: id})
    {:noreply, socket}
  end
end
