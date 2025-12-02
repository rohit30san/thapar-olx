import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  doc,
  getDoc,
  updateDoc,
  addDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext.jsx";

const ADMIN_EMAIL = "rrohit_be23@thapar.edu"; // your admin email

export default function ListingDetail() {
  const { id } = useParams();
  const [listing, setListing] = useState(null);
  const [seller, setSeller] = useState(null); // includes avgRating + reviewCount
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        const docRef = doc(db, "listings", id);
        const snap = await getDoc(docRef);
        if (!snap.exists()) {
          setListing(null);
          return;
        }

        const data = { id: snap.id, ...snap.data() };
        setListing(data);

        if (data.sellerId) {
          // basic seller info
          const sellerRef = doc(db, "users", data.sellerId);
          const sellerSnap = await getDoc(sellerRef);

          let sellerData = null;
          if (sellerSnap.exists()) {
            sellerData = sellerSnap.data();
          }

          // compute average rating from reviews
          const revQ = query(
            collection(db, "reviews"),
            where("sellerId", "==", data.sellerId)
          );
          const revSnap = await getDocs(revQ);

          if (!revSnap.empty) {
            let sum = 0;
            let count = 0;
            revSnap.forEach((r) => {
              const rd = r.data();
              if (typeof rd.rating === "number") {
                sum += rd.rating;
                count++;
              }
            });
            if (count > 0) {
              const avg = sum / count;
              sellerData = {
                ...(sellerData || {}),
                avgRating: avg,
                reviewCount: count,
              };
            }
          }

          if (sellerData) setSeller(sellerData);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleDelete = async () => {
    if (!currentUser) return;
    if (!window.confirm("Are you sure you want to delete this listing?")) return;

    try {
      await deleteDoc(doc(db, "listings", id));
      alert("Listing deleted.");
      navigate("/");
    } catch (err) {
      console.error(err);
      alert("Error deleting listing.");
    }
  };

  // ✅ NEW: Buy now => create deal + reserve listing
  const handleBuy = async () => {
  if (!currentUser) {
    navigate("/login");
    return;
  }

  if (currentUser.uid === listing.sellerId) {
    alert("You can't buy your own item.");
    return;
  }

  if (listing.status === "sold") {
    alert("Item already sold.");
    return;
  }

  try {
    const dealsRef = collection(db, "deals");

    // Check ALL deals for THIS buyer + THIS listing
    const existingQ = query(
      dealsRef,
      where("listingId", "==", id),
      where("buyerId", "==", currentUser.uid)
    );
    const existingSnap = await getDocs(existingQ);

    // Only block if there's an OPEN deal (pending/accepted)
    const hasOpenDeal = existingSnap.docs.some((d) => {
      const st = d.data().status;
      return st === "pending" || st === "accepted";
    });

    if (hasOpenDeal) {
      alert(
        "You already have an active deal for this item. Check your Deals page."
      );
      navigate("/deals");
      return;
    }

    // ✅ NO listing update here (buyer not allowed by rules)
    // Just create a new deal
    const newDealRef = await addDoc(dealsRef, {
      listingId: id,
      buyerId: currentUser.uid,
      sellerId: listing.sellerId,
      price: listing.price,
      status: "pending", // pending | accepted | rejected | completed | cancelled
      meetingPlace: "",
      meetingTime: null,
      paymentMethod: "UPI / Cash",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // Ensure conversation + system message
    const convRef = collection(db, "conversations");
    const qConv = query(
      convRef,
      where("participants", "array-contains", currentUser.uid)
    );
    const convSnap = await getDocs(qConv);

    let convId = null;
    convSnap.forEach((d) => {
      const data = d.data();
      if (
        data.listingId === id &&
        data.participants.includes(currentUser.uid) &&
        data.participants.includes(listing.sellerId)
      ) {
        convId = d.id;
      }
    });

    if (!convId) {
      const newConv = await addDoc(convRef, {
        listingId: id,
        participants: [currentUser.uid, listing.sellerId],
        createdAt: serverTimestamp(),
      });
      convId = newConv.id;
    }

    if (convId) {
      await addDoc(
        collection(db, "conversations", convId, "messages"),
        {
          senderId: currentUser.uid,
          text: "Buyer started a deal (Buy now) for this item.",
          type: "system",
          createdAt: serverTimestamp(),
        }
      );
    }

    alert(
      "Deal request sent to the seller! You can track it in the Deals section."
    );
    navigate("/deals");
  } catch (err) {
    console.error(err);
    alert("Error creating deal.");
  }
};




  const handleMessageSeller = async () => {
    if (!currentUser) {
      navigate("/login");
      return;
    }
    if (currentUser.uid === listing.sellerId) {
      alert("You are the seller.");
      return;
    }

    const convRef = collection(db, "conversations");

    // only conversations where current user is a participant
    const qConv = query(
      convRef,
      where("listingId", "==", id),
      where("participants", "array-contains", currentUser.uid)
    );

    const snap = await getDocs(qConv);
    let convId = null;

    snap.forEach((docSnap) => {
      const data = docSnap.data();
      if (
        data.participants.includes(currentUser.uid) &&
        data.participants.includes(listing.sellerId)
      ) {
        convId = docSnap.id;
      }
    });

    if (!convId) {
      const newDoc = await addDoc(convRef, {
        listingId: id,
        participants: [currentUser.uid, listing.sellerId],
        createdAt: serverTimestamp(),
      });
      convId = newDoc.id;
    }

    navigate(`/chat/${convId}`);
  };

  // keep your existing imports & logic at top (handleBuy, handleMessageSeller, etc.)
// just ensure the render/return looks like this:

  if (loading) return <div className="app-shell mt-6">Loading...</div>;
  if (!listing) return <div className="app-shell mt-6">Listing not found.</div>;

  const isOwner = currentUser && currentUser.uid === listing.sellerId;
  const canDelete =
    currentUser &&
    (currentUser.uid === listing.sellerId ||
      currentUser.email === ADMIN_EMAIL);

  return (
    <div className="app-shell mt-4 flex flex-col md:flex-row gap-6">
      {/* Left: Image */}
      <div className="flex-1">
        <div className="w-full aspect-video bg-slate-100 rounded-3xl overflow-hidden shadow-sm">
          {listing.images?.[0] ? (
            <img
              src={listing.images[0]}
              alt={listing.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-sm text-slate-400">
              No image available
            </div>
          )}
        </div>

        {/* Description box */}
        <div className="mt-4 bg-white rounded-3xl shadow-sm p-4">
          <h2 className="text-sm font-semibold text-slate-900 mb-1">
            Description
          </h2>
          <p className="text-sm text-slate-700">
            {listing.description || "No description provided."}
          </p>
        </div>
      </div>

      {/* Right: Info card */}
      <div className="w-full md:w-80 bg-white rounded-3xl shadow-sm p-4 flex flex-col gap-3 border border-red-50">
        <h1 className="text-xl font-semibold text-slate-900">
          {listing.title}
        </h1>
        <p className="text-2xl font-bold text-red-600">₹ {listing.price}</p>

        <div className="flex items-center gap-2 text-xs">
          <span className="px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-100">
            {listing.category || "General"}
          </span>
          <span className="px-2 py-0.5 rounded-full bg-slate-50 text-slate-600 border border-slate-100 capitalize">
            {listing.status}
          </span>
        </div>

        <p className="text-xs text-slate-500">
          Location:{" "}
          <span className="font-medium">
            {listing.location || "Thapar Campus"}
          </span>
        </p>

        {seller && (
          <div className="mt-2 border-t border-slate-100 pt-3">
            <p className="text-[11px] text-slate-500 mb-1">Seller</p>

            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <Link
                  to={`/user/${listing.sellerId}`}
                  className="text-sm font-semibold text-slate-900 hover:text-red-600 hover:underline"
                >
                  {seller.displayName || seller.email}
                </Link>
                <p className="text-[11px] text-slate-500">{seller.email}</p>
              </div>

              {typeof seller.avgRating === "number" &&
                seller.reviewCount > 0 && (
                  <div className="text-right">
                    <p className="text-xs text-amber-600 font-semibold">
                      ★ {seller.avgRating.toFixed(1)}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {seller.reviewCount} review
                      {seller.reviewCount > 1 ? "s" : ""}
                    </p>
                  </div>
                )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="mt-3 flex flex-col gap-2">
          {currentUser && !isOwner && (
            <>
              <button
                onClick={handleMessageSeller}
                className="w-full text-sm py-2 rounded-full bg-slate-900 text-white hover:bg-black"
              >
                Chat with seller
              </button>

              <button
                onClick={handleBuy}
                disabled={listing.status === "sold"}
                className="w-full text-sm py-2 rounded-full bg-red-600 text-white hover:bg-red-700 disabled:opacity-60"
              >
                {listing.status === "sold"
                  ? "Item sold"
                  : "Buy now (create deal)"}
              </button>

              <button
                onClick={() => navigate(`/report-seller/${listing.sellerId}`)}
                className="w-full text-sm py-2 rounded-full bg-red-50 text-red-700 hover:bg-red-100"
              >
                Report seller
              </button>
            </>
          )}

          {canDelete && (
            <button
              onClick={handleDelete}
              className="w-full text-sm py-2 rounded-full bg-slate-100 text-red-700 hover:bg-slate-200"
            >
              Delete listing
            </button>
          )}

          <Link
            to="/"
            className="w-full text-center text-xs text-slate-500 hover:underline mt-1"
          >
            ← Back to listings
          </Link>
        </div>
      </div>
    </div>
  );
}
