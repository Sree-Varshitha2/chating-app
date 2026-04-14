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

  // 🔌 CONNECT WEBSOCKET
  useEffect(() => {
    const ws = new WebSocket("wss://chatting-app-7-ac7f.onrender.com");

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      // 📞 CALL
      if (data.call) {
        setIncomingCall(true);
        return;
      }

      // ✍️ TYPING
      if (data.typing) {
        setTyping(data.user + " is typing...");
        setTimeout(() => setTyping(""), 1000);
      } else {
        setMessages((prev) => [...prev, data]);

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
    if (msg.trim() && socket?.readyState === WebSocket.OPEN) {
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
        <span>Chatify 💬</span>

        <div className="header-buttons">

          {/* 🌙 DARK MODE */}
          <button
            className="icon-btn"
            onClick={() => setDarkMode(!darkMode)}
          >
            {darkMode ? "☀️" : "🌙"}
          </button>

          {/* 🎥 VIDEO */}
          <button
            className="icon-btn"
            onClick={() => socket?.send(JSON.stringify({ call: "video" }))}
          >
            🎥
          </button>

          {/* 📞 AUDIO */}
          <button
            className="icon-btn"
            onClick={() => socket?.send(JSON.stringify({ call: "audio" }))}
          >
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

        {/* 📞 INCOMING CALL */}
        {incomingCall && !inCall && (
          <div className="call-popup">
            <p>📞 Incoming Call...</p>

            <button onClick={() => {
              setInCall(true);
              setIncomingCall(false);
            }}>
              Accept
            </button>

            <button onClick={() => setIncomingCall(false)}>
              Reject
            </button>
          </div>
        )}

        {/* 📞 CALL SCREEN */}
        {inCall && (
          <div className="call-screen">
            <h2>In Call...</h2>
            <video autoPlay playsInline className="video-box"></video>
            <button onClick={() => setInCall(false)}>End Call</button>
          </div>
        )}

        {/* ✍️ TYPING */}
        <div className="typing">{typing}</div>

        <div ref={bottomRef}></div>
      </div>

      {/* INPUT BAR */}
<div className="input-bar">

  {/* EMOJI */}
  <button
    className="icon-btn"
    onClick={() => setShowEmoji(!showEmoji)}
  >
    😊
  </button>

  {/* CAMERA */}
  <button
    className="icon-btn"
    onClick={() => document.getElementById("imgInput").click()}
  >
    📷
  </button>

  <input
    id="imgInput"
    type="file"
    accept="image/*"
    style={{ display: "none" }}
    onChange={(e) => {
      setFile(e.target.files[0]);
      sendImage();
    }}
  />

  {/* TEXT */}
  <input
    value={msg}
    onChange={handleTyping}
    placeholder="Type message..."
  />

  {/* SEND */}
  <button
    className="send-btn"
    onClick={() => {
      sendMessage();
      setShowEmoji(false); // close emoji after send
    }}
  >
    ➤
  </button>

</div>

{/* EMOJI PICKER */}
{showEmoji && (
  <div className="emoji-box">
    <EmojiPicker
      onEmojiClick={(e) => setMsg((prev) => prev + e.emoji)}
    />
  </div>
)}
