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

  // 🎤 VOICE
  const [recording, setRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

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

  // AUTO SCROLL
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // TEXT
  const sendMessage = () => {
    if (msg.trim() && socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ user, text: msg }));
      setMsg("");
    }
  };

  // IMAGE
  const sendImage = () => {
    if (!file || !socket) return;

    const reader = new FileReader();
    reader.onload = () => {
      socket.send(JSON.stringify({ user, image: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  // TYPING
  const handleTyping = (e) => {
    setMsg(e.target.value);

    socket?.send(JSON.stringify({ user, typing: true }));
  };

  // 🎤 START
  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    const mediaRecorder = new MediaRecorder(stream);
    mediaRecorderRef.current = mediaRecorder;

    audioChunksRef.current = [];

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) audioChunksRef.current.push(e.data);
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(audioChunksRef.current, {
        type: "audio/webm",
      });

      const reader = new FileReader();
      reader.onload = () => {
        socket?.send(
          JSON.stringify({
            user,
            audio: reader.result,
          })
        );
      };
      reader.readAsDataURL(blob);
    };

    mediaRecorder.start();
    setRecording(true);
  };

  // ⏹ STOP
  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
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
              {!isMe && <div className="avatar">{m.user[0]}</div>}

              <div className={`bubble ${isMe ? "you" : "other"}`}>
                <b>{isMe ? "You" : m.user}</b><br />

                {m.text && <span>{m.text}</span>}
                {m.image && <img src={m.image} alt="img" />}
                {m.audio && (
                  <audio controls>
                    <source src={m.audio} type="audio/webm" />
                  </audio>
                )}
              </div>

              {isMe && <div className="avatar">{user[0]}</div>}
            </div>
          );
        })}

        <div className="typing">{typing}</div>
        <div ref={bottomRef}></div>
      </div>

      {/* INPUT WRAPPER (IMPORTANT FIX) */}
      <div className="input-wrapper">

        <div className="input-bar">

          {/* EMOJI */}
          <button onClick={() => setShowEmoji(!showEmoji)}>
            😊
          </button>

          {/* CAMERA */}
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
          <button onClick={sendMessage}>➤</button>

          {/* 🎤 MIC */}
          <button
            onMouseDown={startRecording}
            onMouseUp={stopRecording}
            onTouchStart={startRecording}
            onTouchEnd={stopRecording}
            style={{ color: recording ? "red" : "black" }}
          >
            🎤
          </button>
        </div>

        {/* EMOJI FLOAT (DOES NOT MOVE UI) */}
        {showEmoji && (
          <div className="emoji-popup">
            <EmojiPicker
              onEmojiClick={(e) =>
                setMsg((prev) => prev + e.emoji)
              }
            />
          </div>
        )}

      </div>

    </div>
  );
}

export default Chat;
