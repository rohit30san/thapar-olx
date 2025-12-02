import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { db } from "../firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
} from "firebase/firestore";
import { Link, useNavigate } from "react-router-dom";

export default function Profile() {
  const { currentUser } = useAuth();
  const [myListings, setMyListings] = useState([]);
  const [reviewsAboutMe, setReviewsAboutMe] = useState([]);   // sellerId == me
  const [reviewsIGave, setReviewsIGave] = useState([]);       // reviewerId == me
  const [loadingListings, setLoadingListings] = useState(true);
  const [loadingReviewsAbout, setLoadingReviewsAbout] = useState(true);
  const [loadingReviewsIGave, setLoadingReviewsIGave] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser) return;

    // 🔹 My listings (where I am the seller)
    const qListings = query(
      collection(db, "listings"),
      where("sellerId", "==", currentUser.uid)
    );
    const unsubListings = onSnapshot(
      qListings,
      (snap) => {
        setMyListings(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoadingListings(false);
      },
      (err) => {
        console.error("Error loading my listings:", err);
        setLoadingListings(false);
      }
    );

    // 🔹 Reviews about me (where I am the seller)
    const qAboutMe = query(
      collection(db, "reviews"),
      where("sellerId", "==", currentUser.uid)
    );
    const unsubAboutMe = onSnapshot(
      qAboutMe,
      (snap) => {
        setReviewsAboutMe(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoadingReviewsAbout(false);
      },
      (err) => {
        console.error("Error loading reviews about me:", err);
        setLoadingReviewsAbout(false);
      }
    );

    // 🔹 Reviews I wrote (where I am the reviewer)
    const qIGave = query(
      collection(db, "reviews"),
      where("reviewerId", "==", currentUser.uid)
    );
    const unsubIGave = onSnapshot(
      qIGave,
      (snap) => {
        setReviewsIGave(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoadingReviewsIGave(false);
      },
      (err) => {
        console.error("Error loading reviews I gave:", err);
        setLoadingReviewsIGave(false);
      }
    );

    return () => {
      unsubListings();
      unsubAboutMe();
      unsubIGave();
    };
  }, [currentUser]);

  const averageRating =
    reviewsAboutMe.length > 0
      ? (
          reviewsAboutMe.reduce((sum, r) => sum + (r.rating || 0), 0) /
          reviewsAboutMe.length
        ).toFixed(1)
      : null;

  if (!currentUser) {
    navigate("/login");
    return null;
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Top profile card */}
      <div className="bg-white rounded-2xl shadow p-5 mb-5">
        <h1 className="text-2xl font-semibold mb-1">My profile</h1>
        <p className="text-sm text-gray-600 mb-1">{currentUser.email}</p>

        {averageRating && (
          <p className="text-sm text-yellow-600 font-medium">
            ★ {averageRating} / 5 ({reviewsAboutMe.length} review
            {reviewsAboutMe.length > 1 ? "s" : ""})
          </p>
        )}

        <Link
          to={`/user/${currentUser.uid}`}
          className="inline-block text-xs text-blue-600 hover:underline mt-2"
        >
          View my public seller profile
        </Link>
      </div>

      {/* My listings */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">My listings</h2>
        {loadingListings ? (
          <p className="text-sm text-gray-500">Loading…</p>
        ) : myListings.length === 0 ? (
          <p className="text-sm text-gray-500">
            You haven&apos;t posted any items yet.
          </p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {myListings.map((l) => (
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

      {/* Reviews ABOUT me */}
      <div className="bg-white rounded-2xl shadow p-5 mb-5">
        <h2 className="text-lg font-semibold mb-3">
          What buyers say about you
        </h2>

        {loadingReviewsAbout ? (
          <p className="text-sm text-gray-500">Loading…</p>
        ) : reviewsAboutMe.length === 0 ? (
          <p className="text-sm text-gray-500">
            No one has reviewed you yet.
          </p>
        ) : (
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {reviewsAboutMe.map((r) => (
              <div key={r.id} className="border rounded-2xl px-3 py-2 text-sm">
                <div className="flex items-center justify-between mb-1">
                  <p className="font-medium">{r.reviewerName}</p>
                  <p className="text-xs text-yellow-600">★ {r.rating}/5</p>
                </div>
                <p className="text-xs text-gray-700">{r.comment}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reviews I have given */}
      <div className="bg-white rounded-2xl shadow p-5">
        <h2 className="text-lg font-semibold mb-3">Reviews you’ve written</h2>

        {loadingReviewsIGave ? (
          <p className="text-sm text-gray-500">Loading…</p>
        ) : reviewsIGave.length === 0 ? (
          <p className="text-sm text-gray-500">
            You haven&apos;t written any reviews yet.
          </p>
        ) : (
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {reviewsIGave.map((r) => (
              <div key={r.id} className="border rounded-2xl px-3 py-2 text-sm">
                <div className="flex items-center justify-between mb-1">
                  <p className="font-medium">{r.comment?.slice(0, 25)}...</p>
                  <p className="text-xs text-yellow-600">★ {r.rating}/5</p>
                </div>
                <p className="text-[11px] text-gray-500">
                  You reviewed seller: {r.sellerId}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
