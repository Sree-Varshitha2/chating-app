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

  // 🎙️ HOLD TO RECORD STATES
  const [isRecording, setIsRecording] = useState(false);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null);

  const bottomRef = useRef();

  // 🔌 SOCKET
  useEffect(() => {
    const ws = new WebSocket("wss://chatting-app-7-ac7f.onrender.com");

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.typing) {
        setTyping(`${data.user} is typing...`);
        setTimeout(() => setTyping(""), 1000);
        return;
      }

      setMessages((prev) => [...prev, data]);

      const audio = new Audio(
        "https://www.soundjay.com/buttons/sounds/button-3.mp3"
      );
      audio.play();
    };

    setSocket(ws);
    return () => ws.close();
  }, []);

  // 🔽 AUTO SCROLL
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 💬 TEXT
  const sendMessage = () => {
    if (msg.trim() && socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ user, text: msg }));
      setMsg("");
    }
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

  // 🎙️ START RECORDING (ON HOLD)
  const startRecording = async () => {
    try {
      streamRef.current = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      mediaRecorderRef.current = new MediaRecorder(streamRef.current);
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

  // ⏹️ STOP RECORDING
  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }

    // stop mic stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
    }
  };

  // 🎯 HOLD EVENTS (WhatsApp style)
  const handlePressStart = () => {
    startRecording();
  };

  const handlePressEnd = () => {
    stopRecording();
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
                <br />

                {m.text && <span>{m.text}</span>}
                {m.image && <img src={m.image} alt="img" />}

                {m.audio && (
                  <audio controls src={m.audio} style={{ marginTop: 5 }} />
                )}
              </div>

              {isMe && <div className="avatar">{user?.[0]}</div>}
            </div>
          );
        })}

        <div>{typing}</div>
        <div ref={bottomRef}></div>
      </div>

      {/* INPUT BAR */}
      <div className="input-bar">
        {/* EMOJI */}
        <button onClick={() => setShowEmoji(!showEmoji)}>😊</button>

        {/* IMAGE */}
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

        {/* 🎙️ HOLD TO RECORD BUTTON */}
        <button
          className="mic-btn"
          onMouseDown={handlePressStart}
          onMouseUp={handlePressEnd}
          onTouchStart={handlePressStart}
          onTouchEnd={handlePressEnd}
          style={{
            background: isRecording ? "red" : "#ddd",
            borderRadius: "50%",
            width: 45,
            height: 45,
          }}
        >
          🎙️
        </button>

        {/* TEXT */}
        <input
          value={msg}
          onChange={(e) => setMsg(e.target.value)}
          placeholder="Type message..."
        />

        {/* SEND */}
        <button onClick={sendMessage}>➤</button>
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
