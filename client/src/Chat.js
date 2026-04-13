import React, { useEffect, useState } from "react";

function Chat({ user }) {
  const [socket, setSocket] = useState(null);
  const [msg, setMsg] = useState("");
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    const ws = new WebSocket("wss://YOUR-BACKEND-URL");

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setMessages((prev) => [...prev, data]);
    };

    setSocket(ws);

    return () => ws.close();
  }, []);

  const sendMessage = () => {
    if (msg.trim() && socket) {
      socket.send(
        JSON.stringify({
          user: user,
          text: msg,
        })
      );
      setMsg("");
    }
  };

  return (
    <div className="chat">
      <h3>{user}</h3>

      <div className="messages">
        {messages.map((m, i) => (
          <p key={i}>
            <b>{m.user}:</b> {m.text}
          </p>
        ))}
      </div>

      <div className="input">
        <input
          value={msg}
          onChange={(e) => setMsg(e.target.value)}
          placeholder="Type..."
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
}

export default Chat;