import React, { useEffect, useState } from "react";

function Chat({ user }) {
  const [socket, setSocket] = useState(null);
  const [msg, setMsg] = useState("");
  const [messages, setMessages] = useState([]);
  const [file, setFile] = useState(null);

  // 🔌 CONNECT WEBSOCKET
  useEffect(() => {
    const ws = new WebSocket("wss://chatting-app-7-ac7f.onrender.com");

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setMessages((prev) => [...prev, data]);
    };

    setSocket(ws);

    return () => ws.close();
  }, []);

  // 💬 SEND TEXT
  const sendMessage = () => {
    if (msg.trim() && socket) {
      socket.send(JSON.stringify({ user, text: msg }));
      setMsg("");
    }
  };

  // 📸 SEND IMAGE
  const sendImage = () => {
    if (!file || !socket) return;

    const reader = new FileReader();

    reader.onload = () => {
      socket.send(
        JSON.stringify({
          user,
          image: reader.result,
        })
      );
    };

    reader.readAsDataURL(file);
  };

  return (
    <div className="chat-container">

      {/* HEADER */}
      <div className="header">
        Chatify 💬
      </div>

      {/* MESSAGES */}
      <div className="messages">
        {messages.map((m, i) => {
          const isMe = m.user === user;

          return (
            <div key={i} className={`msg ${isMe ? "right" : "left"}`}>
              <div className={`bubble ${isMe ? "you" : "other"}`}>
                <b>{isMe ? "You" : m.user}</b><br />

                {m.text && <span>{m.text}</span>}

                {m.image && <img src={m.image} alt="img" />}
              </div>
            </div>
          );
        })}
      </div>

      {/* INPUT AREA */}
      <div className="input-area">

        <input
          type="text"
          value={msg}
          onChange={(e) => setMsg(e.target.value)}
          placeholder="Type message..."
        />

        <button onClick={sendMessage}>➤</button>

        <input
          type="file"
          accept="image/*"
          onChange={(e) => setFile(e.target.files[0])}
        />

        <button onClick={sendImage}>📷</button>

      </div>

    </div>
  );
}

export default Chat;
