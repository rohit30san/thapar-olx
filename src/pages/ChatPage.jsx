import { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import {
  collection,
  doc,
  getDoc,
  addDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext.jsx";

export default function ChatPage() {
  const { conversationId } = useParams();
  const { currentUser } = useAuth();
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const bottomRef = useRef(null);

  useEffect(() => {
    const loadConv = async () => {
      const convRef = doc(db, "conversations", conversationId);
      const snap = await getDoc(convRef);
      if (snap.exists()) {
        setConversation({ id: snap.id, ...snap.data() });
      }
    };
    loadConv();
  }, [conversationId]);

  useEffect(() => {
    const msgsRef = collection(db, "conversations", conversationId, "messages");
    const q = query(msgsRef, orderBy("createdAt", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      setMessages(data);
    });
    return () => unsub();
  }, [conversationId]);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    const msgsRef = collection(db, "conversations", conversationId, "messages");
    await addDoc(msgsRef, {
      text: input.trim(),
      senderId: currentUser.uid,
      createdAt: serverTimestamp(),
    });
    setInput("");
  };

  if (!conversation) {
    return <div>Loading chat...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow flex flex-col h-[70vh]">
      <div className="px-4 py-3 border-b flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">Chat</p>
          <p className="text-xs text-gray-500">
            Listing:{" "}
            <Link
              to={`/listing/${conversation.listingId}`}
              className="text-blue-600 hover:underline"
            >
              {conversation.listingId}
            </Link>
          </p>
        </div>
        <Link to="/" className="text-xs text-gray-500 hover:underline">
          Back
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {messages.map((msg) => {
          const isMe = msg.senderId === currentUser.uid;
          return (
            <div
              key={msg.id}
              className={`flex ${isMe ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[70%] px-3 py-2 rounded-2xl text-sm ${
                  isMe
                    ? "bg-blue-600 text-white rounded-br-sm"
                    : "bg-gray-100 text-gray-900 rounded-bl-sm"
                }`}
              >
                {msg.text}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={handleSend}
        className="border-t px-3 py-2 flex items-center gap-2"
      >
        <input
          className="flex-1 border rounded-xl px-3 py-2 text-sm"
          placeholder="Type a message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button className="px-3 py-2 text-sm bg-blue-600 text-white rounded-xl">
          Send
        </button>
      </form>
    </div>
  );
}
