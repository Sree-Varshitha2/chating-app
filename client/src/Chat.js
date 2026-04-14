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
  const [incomingCall, setIncomingCall] = useState(false);
  const [inCall, setInCall] = useState(false);

  const bottomRef = useRef();

  // 🔌 SOCKET
  useEffect(() => {
    const ws = new WebSocket("wss://chatting-app-7-ac7f.onrender.com");

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.call) {
        setIncomingCall(true);
        return;
      }

      if (data.typing) {
        setTyping(`${data.user} is typing...`);
        setTimeout(() => setTyping(""), 1000);
        return;
      }

      setMessages((prev) => [...prev, data]);
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
    if (!socket || msg.trim() === "") return;

    socket.send(JSON.stringify({ user, text: msg }));
    setMsg("");
  };

  // 📸 SEND IMAGE
  const sendImage = () => {
    if (!file || !socket) return;

    const reader = new FileReader();
    reader.onload = () => {
      socket.send(JSON.stringify({ user, image: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  // ✍️ TYPING
  const handleTyping = (e) => {
    setMsg(e.target.value);

    if (socket?.readyState === 1) {
      socket.send(JSON.stringify({ user, typing: true }));
    }
  };

  return (
    <div className={darkMode ? "chat dark" : "chat"}>

      {/* HEADER */}
      <div className="header">
        <span>Chatify 💬</span>

        <div className="header-buttons">
          <button onClick={() => setDarkMode(!darkMode)}>
            {darkMode ? "☀️" : "🌙"}
          </button>

          <button onClick={() => socket?.send(JSON.stringify({ call: "video" }))}>
            🎥
          </button>

          <button onClick={() => socket?.send(JSON.stringify({ call: "audio" }))}>
            📞
          </button>
        </div>
      </div>

      {/* MESSAGES */}
      <div className="messages">
        {messages.map((m, i) => {
          const isMe = m.user === user;

          return (
            <div key={i} className={`msg-row ${isMe ? "right" : ""}`}>
              {!isMe && <div className="avatar">{m.user?.[0]}</div>}

              <div className={`bubble ${isMe ? "you" : "other"}`}>
                <b>{m.user}</b>
                <br />

                {m.text && <p>{m.text}</p>}
                {m.image && <img src={m.image} alt="img" />}

                {m.audio && (
                  <audio controls src={m.audio} />
                )}
              </div>

              {isMe && <div className="avatar">{user?.[0]}</div>}
            </div>
          );
        })}

        <div ref={bottomRef}></div>
      </div>

      {/* INPUT */}
      <div className="input-bar">

        <button onClick={() => setShowEmoji(!showEmoji)}>😊</button>

        <button onClick={() => document.getElementById("file").click()}>
          📷
        </button>

        <input
          id="file"
          type="file"
          hidden
          onChange={(e) => {
            setFile(e.target.files[0]);
            setTimeout(sendImage, 200);
          }}
        />

        <input
          value={msg}
          onChange={handleTyping}
          placeholder="Type message..."
        />

        <button onClick={sendMessage}>➤</button>
      </div>

      {/* EMOJI */}
      {showEmoji && (
        <div style={{ position: "absolute", bottom: "70px" }}>
          <EmojiPicker
            onEmojiClick={(e) =>
              setMsg((prev) => prev + e.emoji)
            }
          />
        </div>
      )}
    </div>
  );
}

export default Chat;
