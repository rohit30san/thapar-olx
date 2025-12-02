import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  doc,
  getDoc,
  getDocs,
  where,
} from "firebase/firestore";
import { db } from "../firebase";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import Hero from "../components/Hero.jsx";

function ListingCard({ listing }) {
  const hasRating = typeof listing.sellerAvgRating === "number";
  const hasSeller = !!listing.sellerName;

  return (
    <Link
      to={`/listing/${listing.id}`}
      className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow border border-slate-100 overflow-hidden group flex flex-col"
    >
      <div className="w-full aspect-video bg-slate-100 overflow-hidden relative">
        {listing.images?.[0] ? (
          <img
            src={listing.images[0]}
            alt={listing.title}
            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">
            No image
          </div>
        )}
        {listing.status === "sold" && (
          <span className="absolute top-2 left-2 text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full bg-slate-900/80 text-white">
            Sold
          </span>
        )}
      </div>

      <div className="flex-1 px-3 pt-2 pb-3 flex flex-col">
        <h3 className="font-semibold text-sm line-clamp-2 text-slate-900">
          {listing.title}
        </h3>

        <p className="text-red-600 font-bold text-sm mt-1">
          ₹ {listing.price}
        </p>

        {hasSeller && (
          <p className="text-[11px] text-slate-600 mt-0.5">
            {listing.sellerName}
            {hasRating && (
              <span className="text-amber-600">
                {" "}
                · ★ {listing.sellerAvgRating.toFixed(1)}
              </span>
            )}
          </p>
        )}

        <p className="text-[11px] text-slate-500 mt-1">
          {listing.location || "Thapar Campus"}
        </p>

        <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-slate-400">
          {listing.status || "available"}
        </p>
      </div>
    </Link>
  );
}

export default function Home() {
  const [listings, setListings] = useState([]);
  const { currentUser } = useAuth();

  useEffect(() => {
    const q = query(collection(db, "listings"), orderBy("createdAt", "desc"));

    const unsub = onSnapshot(q, async (snap) => {
      const enriched = await Promise.all(
        snap.docs.map(async (d) => {
          const data = { id: d.id, ...d.data() };

          if (!data.sellerId) return data;

          try {
            // seller info
            const sellerRef = doc(db, "users", data.sellerId);
            const sellerSnap = await getDoc(sellerRef);
            if (sellerSnap.exists()) {
              const u = sellerSnap.data();
              data.sellerName = u.displayName || u.email || "";
            }

            // seller rating
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
                data.sellerAvgRating = sum / count;
              }
            }
          } catch (err) {
            console.error("Error loading seller info:", err);
          }

          return data;
        })
      );

      setListings(enriched);
    });

    return () => unsub();
  }, []);

  return (
    <div className="app-shell">
      {/* Hero banner */}
      <Hero />

      {/* Heading + Post button */}
      <div className="flex items-center justify-between mb-4 mt-6">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">
            Latest listings
          </h2>
          <p className="text-sm text-slate-600">
            Find deals from{" "}
            <span className="font-medium text-red-600">Thapar students</span>.
          </p>
        </div>
        {currentUser && (
          <Link
            to="/new"
            className="inline-flex text-sm px-3 py-1.5 rounded-full bg-red-600 text-white hover:bg-red-700 shadow-sm"
          >
            + Post an item
          </Link>
        )}
      </div>

      {/* Listings grid */}
      {listings.length === 0 ? (
        <p className="text-sm text-slate-500 mt-6">
          No listings yet. Be the first to post something!
        </p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}
    </div>
  );
}
