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

  // 🎤 VOICE RECORDING STATES
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

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

  // 🎤 START RECORDING
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

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
    } catch (err) {
      console.log("Mic error:", err);
    }
  };

  // ⏹ STOP RECORDING
  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
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
              {!isMe && <div className="avatar">{m.user[0]}</div>}

              <div className={`bubble ${isMe ? "you" : "other"}`}>
                <b>{isMe ? "You" : m.user}</b>
                <br />

                {m.text && <span>{m.text}</span>}
                {m.image && <img src={m.image} alt="img" />}

                {/* 🎤 AUDIO MESSAGE */}
                {m.audio && (
                  <audio controls src={m.audio} style={{ marginTop: 5 }} />
                )}
              </div>

              {isMe && <div className="avatar">{user[0]}</div>}
            </div>
          );
        })}

        {/* TYPING */}
        <div className="typing">{typing}</div>

        <div ref={bottomRef}></div>
      </div>

      {/* INPUT BAR */}
      <div className="input-bar">
        {/* EMOJI */}
        <button onClick={() => setShowEmoji(!showEmoji)}>😊</button>

        {/* CAMERA */}
        <button onClick={() => document.getElementById("imgInput").click()}>
          📷
        </button>

        <input
          id="imgInput"
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={(e) => {
            setFile(e.target.files[0]);
            setTimeout(sendImage, 200);
          }}
        />

        {/* TEXT */}
        <input
          value={msg}
          onChange={handleTyping}
          placeholder="Type message..."
        />

        {/* ➤ SEND + 🎤 VOICE BUTTON (RIGHT SIDE) */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <button className="send-btn" onClick={sendMessage}>
            ➤
          </button>

          <button
            onMouseDown={startRecording}
            onMouseUp={stopRecording}
            onTouchStart={startRecording}
            onTouchEnd={stopRecording}
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              background: isRecording ? "red" : "#ddd",
              border: "none",
              cursor: "pointer",
            }}
          >
            🎤
          </button>
        </div>
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
