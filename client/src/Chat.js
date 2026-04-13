import React, { useEffect, useRef, useState } from "react";
import EmojiPicker from "emoji-picker-react";

function Chat({ user }) {
  const [socket, setSocket] = useState(null);
  const [msg, setMsg] = useState("");
  const [messages, setMessages] = useState([]);
  const [showEmoji, setShowEmoji] = useState(false);
  const [typing, setTyping] = useState("");
  const [darkMode, setDarkMode] = useState(false);

  const bottomRef = useRef();

  useEffect(() => {
    const ws = new WebSocket("wss://chatting-app-7-ac7f.onrender.com");

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

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

  // AUTO SCROLL
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    if (msg.trim() && socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ user, text: msg }));
      setMsg("");
    }
  };

  // TYPING EVENT
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
        Chat App
        <button onClick={() => setDarkMode(!darkMode)} style={{ marginLeft: 10 }}>
          🌙
        </button>
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
                {m.text}
              </div>

              {isMe && <div className="avatar">{user[0]}</div>}
            </div>
          );
        })}

        <div className="typing">{typing}</div>
        <div ref={bottomRef}></div>
      </div>

      {/* INPUT */}
      <div className="input">
        <button onClick={() => setShowEmoji(!showEmoji)}>😊</button>

        <input
          value={msg}
          onChange={handleTyping}
          placeholder="Type message..."
        />

        <button onClick={sendMessage}>Send</button>
      </div>

      {/* EMOJI PICKER */}
      {showEmoji && (
        <EmojiPicker
          onEmojiClick={(e) => setMsg((prev) => prev + e.emoji)}
        />
      )}
    </div>
  );
}

export default Chat;