import { useEffect, useState } from "react";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext.jsx";
import { useNavigate } from "react-router-dom";

export default function Messages() {
  const { currentUser } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser) return;

    const loadConversations = async () => {
      try {
        const convRef = collection(db, "conversations");
        const q = query(
          convRef,
          where("participants", "array-contains", currentUser.uid)
        );

        const snap = await getDocs(q);

        const items = await Promise.all(
          snap.docs.map(async (d) => {
            const data = { id: d.id, ...d.data() };

            // Listing title
            let listingTitle = "Listing";
            if (data.listingId) {
              try {
                const listingSnap = await getDoc(
                  doc(db, "listings", data.listingId)
                );
                if (listingSnap.exists()) {
                  listingTitle = listingSnap.data().title || "Listing";
                }
              } catch (err) {
                console.error("Error loading listing:", err);
              }
            }

            // Other user
            let otherUserName = "Chat";
            const otherUserId = data.participants?.find(
              (p) => p !== currentUser.uid
            );
            if (otherUserId) {
              try {
                const userSnap = await getDoc(doc(db, "users", otherUserId));
                if (userSnap.exists()) {
                  const u = userSnap.data();
                  otherUserName =
                    u.displayName || u.email || otherUserName;
                }
              } catch (err) {
                console.error("Error loading user:", err);
              }
            }

            return {
              ...data,
              listingTitle,
              otherUserName,
            };
          })
        );

        setConversations(items);
      } catch (err) {
        console.error("Error loading conversations:", err);
      } finally {
        setLoading(false);
      }
    };

    loadConversations();
  }, [currentUser]);

  if (!currentUser) {
    navigate("/login");
    return null;
  }

  const handleOpenChat = (id) => {
    navigate(`/chat/${id}`);
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-3">Messages</h1>
      <p className="text-sm text-gray-600 mb-4">
        All conversations related to your listings and purchases.
      </p>

      {loading ? (
        <p className="text-sm text-gray-500">Loading conversations...</p>
      ) : conversations.length === 0 ? (
        <p className="text-sm text-gray-500">
          No conversations yet. Messages will appear here when someone chats
          with you.
        </p>
      ) : (
        <div className="space-y-3">
          {conversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => handleOpenChat(conv.id)}
              className="w-full text-left bg-white rounded-2xl shadow-sm p-3 hover:shadow-md transition flex flex-col"
            >
              <p className="text-sm font-semibold line-clamp-1">
                {conv.listingTitle}
              </p>
              <p className="text-xs text-gray-600 mt-1">
                Chat with{" "}
                <span className="font-medium">{conv.otherUserName}</span>
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
