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

  // 🎤 Voice recording
  const [isRecording, setIsRecording] = useState(false);
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
        return;
      }

      setMessages((prev) => [...prev, data]);
    };

    setSocket(ws);
    return () => ws.close();
  }, []);

  // 🔽 SCROLL
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 💬 SEND TEXT
  const sendMessage = () => {
    if (!socket || msg.trim() === "") return;

    socket.send(JSON.stringify({ user, text: msg }));
    setMsg("");
  };

  // 📸 IMAGE
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

  // 🎤 START RECORD
  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    mediaRecorderRef.current = new MediaRecorder(stream);
    audioChunksRef.current = [];

    mediaRecorderRef.current.ondataavailable = (e) => {
      audioChunksRef.current.push(e.data);
    };

    mediaRecorderRef.current.onstop = () => {
      const audioBlob = new Blob(audioChunksRef.current, {
        type: "audio/webm",
      });

      const reader = new FileReader();

      reader.onloadend = () => {
        socket?.send(
          JSON.stringify({
            user,
            audio: reader.result,
          })
        );
      };

      reader.readAsDataURL(audioBlob);
    };

    mediaRecorderRef.current.start();
    setIsRecording(true);
  };

  // ⏹ STOP RECORD
  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };

  return (
    <div className={darkMode ? "chat dark" : "chat"}>

      {/* HEADER */}
      <div className="header">
        <span>Chatify 💬</span>

        <button onClick={() => setDarkMode(!darkMode)}>
          {darkMode ? "☀️" : "🌙"}
        </button>
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

                {m.text && <p>{m.text}</p>}
                {m.image && <img src={m.image} alt="" />}
                {m.audio && <audio controls src={m.audio} />}
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

        {/* 🎤 MIC */}
        <button
          className={`mic-btn ${isRecording ? "recording" : ""}`}
          onMouseDown={startRecording}
          onMouseUp={stopRecording}
          onTouchStart={startRecording}
          onTouchEnd={stopRecording}
        >
          🎤
        </button>
      </div>

      {/* EMOJI */}
      {showEmoji && (
        <EmojiPicker
          onEmojiClick={(e) => setMsg((prev) => prev + e.emoji)}
        />
      )}
    </div>
  );
}

export default Chat;
