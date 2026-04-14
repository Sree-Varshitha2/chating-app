import React, { useEffect, useRef, useState } from "react";
import EmojiPicker from "emoji-picker-react";

function Chat({ user }) {
  const [socket, setSocket] = useState(null);
  const [msg, setMsg] = useState("");
  const [messages, setMessages] = useState([]);
  const [showEmoji, setShowEmoji] = useState(false);
  const [typing, setTyping] = useState("");
  const [darkMode, setDarkMode] = useState(false);

  // 📸 IMAGE
  const [file, setFile] = useState(null);

  // 📞 CALL
  const [incomingCall, setIncomingCall] = useState(false);
  const [callerOffer, setCallerOffer] = useState(null);
  const [peer, setPeer] = useState(null);
  const [localStream, setLocalStream] = useState(null);
  const [isAudioCall, setIsAudioCall] = useState(false);

  // 📜 CALL HISTORY
  const [callHistory, setCallHistory] = useState([]);

  const bottomRef = useRef();

  useEffect(() => {
    const ws = new WebSocket("wss://chatting-app-7-ac7f.onrender.com");

    ws.onmessage = async (event) => {
      const data = JSON.parse(event.data);

      if (data.type === "offer") {
        setIncomingCall(true);
        setCallerOffer(data.offer);
        setIsAudioCall(data.audio);
        setCallHistory(prev => [...prev, "📥 Incoming Call"]);
      } 
      else if (data.type === "answer") {
        await peer?.setRemoteDescription(data.answer);
      } 
      else if (data.typing) {
        setTyping(data.user + " is typing...");
        setTimeout(() => setTyping(""), 1000);
      } 
      else {
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

  // 💬 SEND MESSAGE
  const sendMessage = () => {
    if (msg.trim() && socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ user, text: msg }));
      setMsg("");
    }
  };

  // ✍️ TYPING
  const handleTyping = (e) => {
    setMsg(e.target.value);
    socket?.send(JSON.stringify({ user, typing: true }));
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

  // 🎥 / 🎤 START MEDIA
  const startMedia = async (audioOnly = false) => {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: !audioOnly,
      audio: true
    });

    setLocalStream(stream);

    if (!audioOnly) {
      document.getElementById("localVideo").srcObject = stream;
    }
  };

  // 📞 START CALL
  const startCall = async () => {
    if (!localStream) return alert("Start camera/audio first!");

    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
    });

    localStream.getTracks().forEach(track => pc.addTrack(track, localStream));

    pc.ontrack = (e) => {
      if (!isAudioCall) {
        document.getElementById("remoteVideo").srcObject = e.streams[0];
      }
    };

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    socket.send(JSON.stringify({
      type: "offer",
      offer,
      audio: isAudioCall
    }));

    setPeer(pc);
    setCallHistory(prev => [...prev, "📤 Outgoing Call"]);
  };

  // ✅ ACCEPT CALL
  const acceptCall = async () => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
    });

    localStream.getTracks().forEach(track => pc.addTrack(track, localStream));

    pc.ontrack = (e) => {
      if (!isAudioCall) {
        document.getElementById("remoteVideo").srcObject = e.streams[0];
      }
    };

    await pc.setRemoteDescription(callerOffer);

    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    socket.send(JSON.stringify({ type: "answer", answer }));

    setPeer(pc);
    setIncomingCall(false);
  };

  // ❌ REJECT
  const rejectCall = () => setIncomingCall(false);

  return (
    <div className={darkMode ? "chat dark" : "chat"}>

      {/* HEADER */}
      <div className="header">
        Chatify 💬 <br />
        <small>Connect instantly</small>
        <button onClick={() => setDarkMode(!darkMode)}>🌙</button>
      </div>

      {/* 📜 CALL HISTORY */}
      <div style={{ margin: 10 }}>
        <h4>📜 Call History</h4>
        {callHistory.map((c, i) => <p key={i}>{c}</p>)}
      </div>

      {/* 📞 BUTTONS */}
      <div style={{ margin: 10 }}>
        <button onClick={() => startMedia(false)}>🎥 Camera</button>
        <button onClick={() => {
          setIsAudioCall(true);
          startMedia(true);
        }}>📞 Audio</button>
        <button onClick={() => {
          setIsAudioCall(false);
          startCall();
        }}>📞 Video Call</button>
      </div>

      {/* 📞 INCOMING */}
      {incomingCall && (
        <div>
          <p>Incoming Call...</p>
          <button onClick={acceptCall}>Accept</button>
          <button onClick={rejectCall}>Reject</button>
        </div>
      )}

      {/* 🎥 VIDEO */}
      <video id="localVideo" autoPlay muted width="120"></video>
      <video id="remoteVideo" autoPlay width="120"></video>

      {/* 💬 MESSAGES */}
      <div className="messages">
        {messages.map((m, i) => {
          const isMe = m.user === user;

          return (
            <div key={i} className={`msg-row ${isMe ? "right" : ""}`}>
              <div className={`bubble ${isMe ? "you" : "other"}`}>
                <b>{isMe ? "You" : m.user}</b><br />

                {m.text && <span>{m.text}</span>}

                {m.image && (
                  <img src={m.image} alt="" width="150" />
                )}

                {isMe && (
                  <button onClick={() =>
                    setMessages(messages.filter((_, index) => index !== i))
                  }>
                    ❌
                  </button>
                )}
              </div>
            </div>
          );
        })}

        <div className="typing">{typing}</div>
        <div ref={bottomRef}></div>
      </div>

      {/* INPUT */}
      <div className="input">
        <button onClick={() => setShowEmoji(!showEmoji)}>😊</button>

        <input type="file" accept="image/*"
          onChange={(e) => setFile(e.target.files[0])} />

        <button onClick={sendImage}>📷</button>

        <input value={msg} onChange={handleTyping} />

        <button onClick={sendMessage}>Send</button>
      </div>

      {showEmoji && (
        <EmojiPicker onEmojiClick={(e) =>
          setMsg(prev => prev + e.emoji)
        } />
      )}
    </div>
  );
}

export default Chat;
