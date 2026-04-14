import React, { useEffect, useRef, useState } from "react";
import EmojiPicker from "emoji-picker-react";

function Chat({ user }) {
  const [socket, setSocket] = useState(null);
  const [msg, setMsg] = useState("");
  const [messages, setMessages] = useState([]);
  const [file, setFile] = useState(null);
  const [showEmoji, setShowEmoji] = useState(false);
  const [typing, setTyping] = useState("");
  const [darkMode, setDarkMode] = useState(false);

  const bottomRef = useRef();

  // 🔌 CONNECT WEBSOCKET
  useEffect(() => {
    const ws = new WebSocket("wss://chatting-app-7-ac7f.onrender.com");

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      // ✍️ typing
      if (data.typing) {
        setTyping(data.user + " is typing...");
        setTimeout(() => setTyping(""), 1000);
      } else {
        setMessages((prev) => [...prev, data]);

        // 🔔 sound
        const audio = new Audio(
          "https://www.soundjay.com/buttons/sounds/button-3.mp3"
        );
        audio.play();
      }
    };

    setSocket(ws);

    return () => ws.close();
  }, []);

  // 🔽 AUTO SCROLL
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 💬 SEND TEXT
  const sendMessage = () => {
    if (msg.trim() && socket && socket.readyState === WebSocket.OPEN) {
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

  // ✍️ TYPING
  const handleTyping = (e) => {
    setMsg(e.target.value);

    if (socket) {
      socket.send(JSON.stringify({ user, typing: true }));
    }
  };

  return (
    <div className={darkMode ? "chat dark" : "chat"}>

      {/* HEADER */}
      <div className="header">
        Chatify 💬

        <div className="header-buttons">
          <button onClick={() => setDarkMode(!darkMode)}>🌙</button>
          <button>🎥</button>
          <button>📞</button>
        </div>
      </div>

      {/* MESSAGES */}
      <div className="messages">
        {messages.map((m, i) => {
          const isMe = m.user === user;

          return (
            <div key={i} className={`msg-row ${isMe ? "right" : ""}`}>
              
              {!isMe && <div className="avatar">{m.user[0]}</div>}

              <div className={`bubble ${isMe ? "you" : "other"}`}>
                <b>{isMe ? "You" : m.user}</b><br />

                {m.text && <span>{m.text}</span>}

                {m.image && <img src={m.image} alt="img" />}
              </div>

              {isMe && <div className="avatar">{user[0]}</div>}
            </div>
          );
        })}

        {/* TYPING */}
        <div className="typing">{typing}</div>

        <div ref={bottomRef}></div>
      </div>

      <div className="input-bar">

  {/* EMOJI */}
  <button className="icon-btn" onClick={() => setShowEmoji(!showEmoji)}>😊</button>

  {/* CAMERA */}
  <label className="icon-btn">
    📷
    <input
      type="file"
      accept="image/*"
      onChange={(e) => setFile(e.target.files[0])}
      hidden
    />
  </label>

  {/* TEXT */}
  <input
    value={msg}
    onChange={handleTyping}
    placeholder="Type message..."
  />

  {/* SEND */}
  <button className="send-btn" onClick={sendMessage}>➤</button>

</div>

      {/* EMOJI PICKER */}
      {showEmoji && (
        <div style={{ position: "absolute", bottom: "70px" }}>
          <EmojiPicker
            onEmojiClick={(e) => setMsg((prev) => prev + e.emoji)}
          />
        </div>
      )}
    </div>
  );
}

export default Chat;
