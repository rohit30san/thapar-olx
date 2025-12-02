import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { db } from "../firebase";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
  addDoc,
} from "firebase/firestore";
import { useNavigate } from "react-router-dom";

export default function Deals() {
  const { currentUser } = useAuth();
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // 🔹 Helper: find or create conversation between buyer & seller for a listing
  const getOrCreateConversation = async (deal) => {
    if (!currentUser) return null;

    const convRef = collection(db, "conversations");

    // No composite index: only filter by participants, then filter by listingId in JS
    const qConv = query(
      convRef,
      where("participants", "array-contains", currentUser.uid)
    );
    const snap = await getDocs(qConv);

    let convId = null;
    snap.forEach((d) => {
      const data = d.data();
      if (
        data.listingId === deal.listingId &&
        data.participants.includes(deal.buyerId) &&
        data.participants.includes(deal.sellerId)
      ) {
        convId = d.id;
      }
    });

    if (!convId) {
      const newDoc = await addDoc(convRef, {
        listingId: deal.listingId,
        participants: [deal.buyerId, deal.sellerId],
        createdAt: serverTimestamp(),
      });
      convId = newDoc.id;
    }

    return convId;
  };

  useEffect(() => {
    if (!currentUser) return;

    const loadDeals = async () => {
      try {
        setLoading(true);
        const dealsRef = collection(db, "deals");

        const [asBuyerSnap, asSellerSnap] = await Promise.all([
          getDocs(query(dealsRef, where("buyerId", "==", currentUser.uid))),
          getDocs(query(dealsRef, where("sellerId", "==", currentUser.uid))),
        ]);

        const map = new Map();

        asBuyerSnap.forEach((d) => {
          map.set(d.id, { id: d.id, role: "buyer", ...d.data() });
        });

        asSellerSnap.forEach((d) => {
          const existing = map.get(d.id) || { id: d.id, ...d.data() };
          map.set(d.id, { ...existing, role: existing.role || "seller" });
        });

        const arr = Array.from(map.values());

        const withListing = await Promise.all(
          arr.map(async (deal) => {
            let title = "Listing";
            let image = null;
            try {
              const lSnap = await getDoc(doc(db, "listings", deal.listingId));
              if (lSnap.exists()) {
                const l = lSnap.data();
                title = l.title || "Listing";
                image = l.images?.[0] || null;
              }
            } catch (err) {
              console.error("Error loading listing:", err);
            }
            return { ...deal, listingTitle: title, listingImage: image };
          })
        );

        withListing.sort((a, b) => {
          const ta = a.createdAt?.seconds || 0;
          const tb = b.createdAt?.seconds || 0;
          return tb - ta;
        });

        setDeals(withListing);
      } catch (err) {
        console.error("Error loading deals:", err);
      } finally {
        setLoading(false);
      }
    };

    loadDeals();
  }, [currentUser]);

  if (!currentUser) {
    navigate("/login");
    return null;
  }

  const handleUpdateStatus = async (deal, newStatus) => {
    try {
      const isSeller = deal.role === "seller";
      const isBuyer = deal.role === "buyer";

      // 1) Update deal status
      await updateDoc(doc(db, "deals", deal.id), {
        status: newStatus,
        updatedAt: serverTimestamp(),
      });

      // 2) Update local UI immediately
      setDeals((prev) =>
        prev.map((d) =>
          d.id === deal.id ? { ...d, status: newStatus } : d
        )
      );

      // 3) Listing status changes – only seller is allowed to change listing
      if (isSeller) {
        if (newStatus === "completed") {
          await updateDoc(doc(db, "listings", deal.listingId), {
            status: "sold",
          });
        } else if (newStatus === "rejected") {
          await updateDoc(doc(db, "listings", deal.listingId), {
            status: "available",
          });
        }
        // For "cancelled" by buyer we leave listing as-is,
        // or you can later add seller-side cleanup if needed.
      }

      // 4) Send system message in chat
      const convId = await getOrCreateConversation(deal);
      if (convId) {
        let msg = "";

        if (newStatus === "accepted" && isSeller) {
          msg = "Seller has accepted your deal request.";
        } else if (newStatus === "rejected" && isSeller) {
          msg = "Seller has rejected your deal request.";
        } else if (newStatus === "completed" && isSeller) {
          msg = "Seller marked the deal as completed.";
        } else if (newStatus === "cancelled" && isBuyer) {
          msg = "Buyer cancelled the deal.";
        }

        if (msg) {
          await addDoc(collection(db, "conversations", convId, "messages"), {
            senderId: currentUser.uid,
            text: msg,
            type: "system",
            createdAt: serverTimestamp(),
          });
        }
      }
    } catch (err) {
      console.error("Error updating deal:", err);
      alert("Error updating deal (check console).");
    }
  };

  const statusBadgeClass = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-700";
      case "accepted":
        return "bg-blue-100 text-blue-700";
      case "rejected":
      case "cancelled":
        return "bg-red-100 text-red-700";
      case "completed":
        return "bg-green-100 text-green-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-semibold mb-2">Deals</h1>
      <p className="text-sm text-gray-600 mb-4">
        All Buy now requests between you and other students.
      </p>

      {loading ? (
        <p className="text-sm text-gray-500">Loading deals…</p>
      ) : deals.length === 0 ? (
        <p className="text-sm text-gray-500">
          No deals yet. Click &quot;Buy now&quot; on a listing to start one.
        </p>
      ) : (
        <div className="space-y-3">
          {deals.map((deal) => {
            const isSeller = deal.role === "seller";
            const isBuyer = deal.role === "buyer";

            return (
              <div
                key={deal.id}
                className="bg-white rounded-2xl shadow-sm p-3 flex gap-3"
              >
                <div className="w-24 h-20 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
                  {deal.listingImage ? (
                    <img
                      src={deal.listingImage}
                      alt={deal.listingTitle}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-400">
                      No image
                    </div>
                  )}
                </div>

                <div className="flex-1 flex flex-col gap-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-semibold line-clamp-1">
                        {deal.listingTitle}
                      </p>
                      <p className="text-xs text-gray-500">
                        ₹ {deal.price} ·{" "}
                        {isBuyer ? "You are the buyer" : "You are the seller"}
                      </p>
                    </div>
                    <span
                      className={
                        "text-[11px] px-2 py-0.5 rounded-full " +
                        statusBadgeClass(deal.status)
                      }
                    >
                      {deal.status}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {isSeller && deal.status === "pending" && (
                      <>
                        <button
                          onClick={() =>
                            handleUpdateStatus(deal, "accepted")
                          }
                          className="text-xs px-2 py-1 rounded-full bg-blue-600 text-white hover:bg-blue-700"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() =>
                            handleUpdateStatus(deal, "rejected")
                          }
                          className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-700 hover:bg-red-200"
                        >
                          Reject
                        </button>
                      </>
                    )}

                    {isSeller && deal.status === "accepted" && (
                      <button
                        onClick={() =>
                          handleUpdateStatus(deal, "completed")
                        }
                        className="text-xs px-2 py-1 rounded-full bg-green-600 text-white hover:bg-green-700"
                      >
                        Mark as completed
                      </button>
                    )}

                    {isBuyer &&
                      (deal.status === "pending" ||
                        deal.status === "accepted") && (
                        <button
                          onClick={() =>
                            handleUpdateStatus(deal, "cancelled")
                          }
                          className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200"
                        >
                          Cancel deal
                        </button>
                      )}
                  </div>

                  <p className="text-[11px] text-gray-400 mt-1">
                    Payment method: {deal.paymentMethod || "UPI / Cash"}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
