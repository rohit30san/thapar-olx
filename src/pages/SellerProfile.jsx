import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  where,
  addDoc,
  serverTimestamp,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext.jsx";

const ADMIN_EMAIL = "rrohit_be23@thapar.edu"; // your admin email

export default function SellerProfile() {
  const { uid } = useParams(); // seller's UID from /user/:uid
  const { currentUser } = useAuth();

  const [seller, setSeller] = useState(null);
  const [listings, setListings] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  const isMyProfile = currentUser && currentUser.uid === uid;

  // Load seller basic info
  useEffect(() => {
    const loadSeller = async () => {
      try {
        const uRef = doc(db, "users", uid);
        const snap = await getDoc(uRef);
        if (snap.exists()) {
          setSeller(snap.data());
        }
      } catch (err) {
        console.error("Error loading seller:", err);
      } finally {
        setLoading(false);
      }
    };
    loadSeller();
  }, [uid]);

  // Load listings by this seller (no orderBy -> no index needed)
  useEffect(() => {
    const q = query(collection(db, "listings"), where("sellerId", "==", uid));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setListings(items);
      },
      (err) => {
        console.error("Error loading seller listings:", err);
      }
    );
    return () => unsub();
  }, [uid]);

  // Load reviews for this seller (no orderBy -> no index needed)
  useEffect(() => {
    const q = query(collection(db, "reviews"), where("sellerId", "==", uid));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setReviews(items);
      },
      (err) => {
        console.error("Error loading reviews:", err);
      }
    );
    return () => unsub();
  }, [uid]);

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      alert("Please log in to leave a review.");
      return;
    }
    if (currentUser.uid === uid) {
      alert("You cannot review yourself.");
      return;
    }
    if (!comment.trim()) {
      alert("Please write a comment.");
      return;
    }

    try {
      setSubmitting(true);
      await addDoc(collection(db, "reviews"), {
  sellerId: uid,
  reviewerId: currentUser.uid,
  reviewerName:
    currentUser.displayName ||
    currentUser.email.split("@")[0].charAt(0).toUpperCase() +
      currentUser.email.split("@")[0].slice(1),
  rating: Number(rating),
  comment: comment.trim(),
  createdAt: serverTimestamp(),
});

      setComment("");
      setRating(5);
    } catch (err) {
      console.error("Error submitting review:", err);
      alert("Error submitting review (check console for details).");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!currentUser) return;
    if (!window.confirm("Delete this review?")) return;
    try {
      await deleteDoc(doc(db, "reviews", reviewId));
    } catch (err) {
      console.error("Error deleting review:", err);
      alert("Error deleting review.");
    }
  };

  const averageRating =
    reviews.length > 0
      ? (
          reviews.reduce((sum, r) => sum + (r.rating || 0), 0) /
          reviews.length
        ).toFixed(1)
      : null;

  if (loading && !seller) {
    return <div>Loading seller...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-2xl shadow p-5 mb-5">
        <h1 className="text-2xl font-semibold mb-1">
          {seller?.displayName || seller?.email || "Seller"}
        </h1>
        <p className="text-sm text-gray-600 mb-1">{seller?.email}</p>
        {averageRating && (
          <p className="text-sm text-yellow-600 font-medium">
            ★ {averageRating} / 5 ({reviews.length} review
            {reviews.length > 1 ? "s" : ""})
          </p>
        )}
        {isMyProfile && (
          <p className="text-xs text-gray-500 mt-1">
            This is your public profile as seen by other students.
          </p>
        )}
      </div>

      {/* Listings by this seller */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Listings by this seller</h2>
        {listings.length === 0 ? (
          <p className="text-sm text-gray-500">No active listings.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {listings.map((l) => (
              <Link
                key={l.id}
                to={`/listing/${l.id}`}
                className="bg-white rounded-2xl shadow-sm p-3 text-sm"
              >
                <div className="w-full aspect-video bg-gray-100 rounded-xl overflow-hidden mb-2">
                  {l.images?.[0] && (
                    <img
                      src={l.images[0]}
                      alt={l.title}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <p className="font-medium line-clamp-1">{l.title}</p>
                <p className="text-xs text-blue-600 font-semibold">
                  ₹ {l.price}
                </p>
                <p className="text-[11px] text-gray-400 capitalize">
                  {l.status}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Reviews */}
      <div className="bg-white rounded-2xl shadow p-5">
        <h2 className="text-lg font-semibold mb-3">Reviews</h2>

        {reviews.length === 0 && (
          <p className="text-sm text-gray-500 mb-3">
            No reviews yet. Be the first to review this seller.
          </p>
        )}

        {/* Add review form (only if logged in and not self) */}
        {currentUser && currentUser.uid !== uid && (
          <form onSubmit={handleSubmitReview} className="mb-4 space-y-2">
            <div className="flex items-center gap-2">
              <label className="text-sm">Rating:</label>
              <select
                className="border rounded-xl px-2 py-1 text-sm"
                value={rating}
                onChange={(e) => setRating(e.target.value)}
              >
                <option value={5}>5 - Excellent</option>
                <option value={4}>4 - Good</option>
                <option value={3}>3 - Average</option>
                <option value={2}>2 - Poor</option>
                <option value={1}>1 - Scam / Bad</option>
              </select>
            </div>
            <textarea
              className="w-full border rounded-xl px-3 py-2 text-sm"
              placeholder="Share your experience with this seller..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
            <button
              disabled={submitting}
              className="text-sm px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {submitting ? "Submitting..." : "Submit review"}
            </button>
          </form>
        )}

        {/* Reviews list – always visible, even on own profile */}
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {reviews.map((r) => {
            const canDelete =
              currentUser &&
              (currentUser.uid === r.reviewerId ||
                currentUser.email === ADMIN_EMAIL);

            return (
              <div
                key={r.id}
                className="border rounded-2xl px-3 py-2 text-sm flex justify-between gap-3"
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-medium">{r.reviewerName}</p>
                    <p className="text-xs text-yellow-600">★ {r.rating}/5</p>
                  </div>
                  <p className="text-xs text-gray-700">{r.comment}</p>
                </div>

                {canDelete && (
                  <button
                    onClick={() => handleDeleteReview(r.id)}
                    className="self-start text-[11px] text-red-500 hover:underline"
                  >
                    Delete
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
