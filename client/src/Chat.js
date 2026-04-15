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

  // SOCKET CONNECTION
  useEffect(() => {
    const ws = new WebSocket("wss://chat-app-7-0twn.onrender.com");

ws.onopen = () => {
  console.log("WebSocket connected");
};

ws.onerror = (e) => console.log("Socket error", e);

ws.onclose = () => console.log("Socket closed");

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);

  if (data.call) {
    setIncomingCall(true);
    return;
  }

  if (data.typing) {
    setTyping(data.user + " is typing...");
    setTimeout(() => setTyping(""), 1000);
    return;
  }

  setMessages((prev) => [...prev, data]);
};

setSocket(ws);

return () => ws.close();


  // AUTO SCROLL
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // SEND TEXT
  const sendMessage = () => {
    if (!socket) return;
    if (socket.readyState !== 1) {
    console.log("Socket not connected");
    return;
  }

  if (msg.trim()) {
    socket.send(JSON.stringify({ user, text: msg }));
    setMsg("");
  }
};
  
  // SEND IMAGE
  const sendImage = () => {
    if (!socket || !file) return;

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

  // TYPING
  const handleTyping = (e) => {
    setMsg(e.target.value);

    if (socket && socket.readyState === 1) {
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
                <b>{isMe ? "You" : m.user}</b>
                <br />
                {m.text && <span>{m.text}</span>}
                {m.image && <img src={m.image} alt="img" />}
              </div>

              {isMe && <div className="avatar">{user?.[0]}</div>}
            </div>
          );
        })}

        {/* CALL POPUP */}
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

        {/* CALL SCREEN */}
        {inCall && (
          <div className="call-screen">
            <h2>In Call...</h2>
            <video autoPlay playsInline className="video-box"></video>
            <button onClick={() => setInCall(false)}>End Call</button>
          </div>
        )}

        <div className="typing">{typing}</div>
        <div ref={bottomRef}></div>
      </div>

      {/* INPUT BAR */}
      <div className="input-bar">

        <button onClick={() => setShowEmoji(!showEmoji)}>😊</button>

        <button onClick={() => document.getElementById("imgInput").click()}>
          📷
        </button>

        <input
          id="imgInput"
          type="file"
          accept="image/*"
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

        <button className="send-btn" onClick={sendMessage}>
          ➤
        </button>
      </div>

      {/* EMOJI */}
      {showEmoji && (
        <div style={{ position: "absolute", bottom: "80px" }}>
          <EmojiPicker
            onEmojiClick={(e) => setMsg((prev) => prev + e.emoji)}
          />
        </div>
      )}
    </div>
  );
}

export default Chat;
