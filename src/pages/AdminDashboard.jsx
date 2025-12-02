import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { db } from "../firebase";
import { ADMIN_EMAIL } from "../config.js";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";

export default function Admin() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    users: 0,
    listings: 0,
    openReports: 0,
    openDeals: 0,
  });
  const [recentListings, setRecentListings] = useState([]);
  const [openReports, setOpenReports] = useState([]);
  const [disabledUsers, setDisabledUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Only admin can view
  useEffect(() => {
    if (!currentUser) return;
    if (currentUser.email !== ADMIN_EMAIL) {
      navigate("/");
      return;
    }

    const load = async () => {
      try {
        setLoading(true);

        const usersRef = collection(db, "users");
        const listingsRef = collection(db, "listings");
        const dealsRef = collection(db, "deals");
        const reportsRef = collection(db, "reports");

        const [
          usersSnap,
          listingsSnap,
          dealsSnap,
          openReportsSnap,
          recentListingsSnap,
          disabledUsersSnap,
        ] = await Promise.all([
          getDocs(usersRef),
          getDocs(listingsRef),
          getDocs(dealsRef),
          getDocs(query(reportsRef, where("status", "==", "open"))),
          getDocs(
            query(listingsRef, orderBy("createdAt", "desc"), limit(5))
          ),
          getDocs(query(usersRef, where("disabled", "==", true))),
        ]);

        const allDeals = dealsSnap.docs.map((d) => d.data());
        const openDeals = allDeals.filter(
          (d) => d.status === "pending" || d.status === "accepted"
        ).length;

        setStats({
          users: usersSnap.size,
          listings: listingsSnap.size,
          openReports: openReportsSnap.size,
          openDeals,
        });

        const listings = recentListingsSnap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));
        setRecentListings(listings);

        const reports = openReportsSnap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));
        setOpenReports(reports);

        const disabled = disabledUsersSnap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));
        setDisabledUsers(disabled);
      } catch (err) {
        console.error("Error loading admin dashboard:", err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [currentUser, navigate]);

  if (!currentUser || currentUser.email !== ADMIN_EMAIL) {
    return null;
  }

  // Delete listing + related chats + deals + notify seller
  const handleRemoveListing = async (listingId, sellerId, listingTitle) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this listing and its chats?"
      )
    )
      return;

    try {
      await deleteDoc(doc(db, "listings", listingId));

      const dealsRef = collection(db, "deals");
      const dealsSnap = await getDocs(
        query(dealsRef, where("listingId", "==", listingId))
      );
      const dealDeletes = dealsSnap.docs.map((d) => deleteDoc(d.ref));
      await Promise.all(dealDeletes);

      const convRef = collection(db, "conversations");
      const convSnap = await getDocs(
        query(convRef, where("listingId", "==", listingId))
      );

      const convDeletes = convSnap.docs.map(async (c) => {
        const msgsRef = collection(db, "conversations", c.id, "messages");
        const msgsSnap = await getDocs(msgsRef);
        const msgDeletes = msgsSnap.docs.map((m) => deleteDoc(m.ref));
        await Promise.all(msgDeletes);
        await deleteDoc(c.ref);
      });

      await Promise.all(convDeletes);

      const adminSellerConvRef = collection(db, "conversations");
      const qAdminConv = query(
        adminSellerConvRef,
        where("participants", "array-contains", currentUser.uid)
      );
      const adminConvSnap = await getDocs(qAdminConv);

      let adminConvId = null;
      adminConvSnap.forEach((d) => {
        const data = d.data();
        if (
          data.participants.includes(sellerId) &&
          data.participants.includes(currentUser.uid)
        ) {
          adminConvId = d.id;
        }
      });

      if (!adminConvId) {
        const newConv = await addDoc(adminSellerConvRef, {
          listingId: null,
          participants: [currentUser.uid, sellerId],
          createdAt: serverTimestamp(),
        });
        adminConvId = newConv.id;
      }

      await addDoc(
        collection(db, "conversations", adminConvId, "messages"),
        {
          senderId: currentUser.uid,
          type: "system",
          text: `Your listing "${listingTitle}" was removed by the admin for violating Thapar OLX rules.`,
          createdAt: serverTimestamp(),
        }
      );

      setRecentListings((prev) => prev.filter((l) => l.id !== listingId));

      alert("Listing deleted, related chats removed, and seller notified.");
    } catch (err) {
      console.error("Error deleting listing:", err);
      alert("Error deleting listing (check console).");
    }
  };

  const handleEnableUser = async (userId) => {
    if (!window.confirm("Re-enable this user?")) return;
    try {
      await updateDoc(doc(db, "users", userId), {
        disabled: false,
      });
      setDisabledUsers((prev) => prev.filter((u) => u.id !== userId));
    } catch (err) {
      console.error("Error enabling user:", err);
      alert("Error enabling user.");
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-2 sm:px-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div>
          <h1 className="text-2xl font-semibold">Admin dashboard</h1>
          <p className="text-sm text-gray-600">
            Overview of Thapar OLX activity, reports, and moderation tools.
          </p>
        </div>
        <Link
          to="/admin/reports"
          className="self-start sm:self-auto text-xs px-3 py-1.5 rounded-full bg-red-50 text-red-700 hover:bg-red-100"
        >
          View all reports
        </Link>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="bg-white rounded-2xl shadow-sm p-3">
          <p className="text-[11px] text-gray-500">Total users</p>
          <p className="text-xl font-semibold">{stats.users}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-3">
          <p className="text-[11px] text-gray-500">Total listings</p>
          <p className="text-xl font-semibold">{stats.listings}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-3">
          <p className="text-[11px] text-gray-500">Open reports</p>
          <p className="text-xl font-semibold text-red-600">
            {stats.openReports}
          </p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-3">
          <p className="text-[11px] text-gray-500">Active deals</p>
          <p className="text-xl font-semibold text-blue-600">
            {stats.openDeals}
          </p>
        </div>
      </div>

      {loading && (
        <p className="text-sm text-gray-500 mb-4">Loading dashboard…</p>
      )}

      {/* Main layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Recent listings & moderation */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-3">
            <h2 className="text-sm font-semibold">Recent listings</h2>
            <span className="text-[11px] text-gray-400">
              Latest 5 by created date
            </span>
          </div>
          {recentListings.length === 0 ? (
            <p className="text-xs text-gray-500">
              No listings available yet.
            </p>
          ) : (
            <div className="space-y-2">
              {recentListings.map((l) => (
                <div
                  key={l.id}
                  className="border rounded-2xl px-3 py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-16 h-12 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0">
                      {l.images?.[0] && (
                        <img
                          src={l.images[0]}
                          alt={l.title}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <div className="min-w-0">
                      <Link
                        to={`/listing/${l.id}`}
                        className="font-medium line-clamp-1 hover:underline"
                      >
                        {l.title}
                      </Link>
                      <p className="text-[11px] text-gray-500">
                        Seller:{" "}
                        <Link
                          to={`/user/${l.sellerId}`}
                          className="text-blue-600 hover:underline"
                        >
                          {l.sellerId}
                        </Link>{" "}
                        · Status:{" "}
                        <span className="capitalize">{l.status}</span>
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      handleRemoveListing(l.id, l.sellerId, l.title)
                    }
                    className="w-full sm:w-auto text-center text-[11px] px-2 py-1 rounded-full bg-red-50 text-red-600 hover:bg-red-100"
                  >
                    Delete listing
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right column: reports + disabled users */}
        <div className="space-y-4">
          {/* Open reports preview */}
          <div className="bg-white rounded-2xl shadow p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-2">
              <h2 className="text-sm font-semibold">Open reports</h2>
              <Link
                to="/admin/reports"
                className="text-[11px] text-blue-600 hover:underline"
              >
                Manage all
              </Link>
            </div>
            {openReports.length === 0 ? (
              <p className="text-xs text-gray-500">No open reports.</p>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto">
                {openReports.slice(0, 5).map((r) => (
                  <div
                    key={r.id}
                    className="border rounded-2xl px-3 py-2 text-xs"
                  >
                    <p className="font-medium mb-1">
                      Seller:{" "}
                      <Link
                        to={`/user/${r.sellerId}`}
                        className="text-blue-600 hover:underline"
                      >
                        {r.sellerId}
                      </Link>
                    </p>
                    <p className="text-gray-700 line-clamp-3">{r.reason}</p>
                    <p className="text-[10px] text-gray-400 mt-1">
                      By: {r.reporterEmail || r.reporterId}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Disabled users */}
          <div className="bg-white rounded-2xl shadow p-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold">Disabled users</h2>
            </div>
            {disabledUsers.length === 0 ? (
              <p className="text-xs text-gray-500">
                No users are disabled currently.
              </p>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto">
                {disabledUsers.map((u) => (
                  <div
                    key={u.id}
                    className="border rounded-2xl px-3 py-2 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div>
                      <p className="font-medium">
                        {u.displayName || u.email || u.id}
                      </p>
                      <p className="text-[10px] text-gray-500">{u.email}</p>
                    </div>
                    <button
                      onClick={() => handleEnableUser(u.id)}
                      className="w-full sm:w-auto text-[11px] px-2 py-1 rounded-full bg-green-50 text-green-700 hover:bg-green-100 text-center"
                    >
                      Re-enable
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
