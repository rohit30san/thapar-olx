import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { db } from "../firebase";
import {
  collection,
  query,
  onSnapshot,
  orderBy,
  doc,
  updateDoc,
  getDocs,
  where,
} from "firebase/firestore";
import { Link, useNavigate } from "react-router-dom";

const ADMIN_EMAIL = "rrohit_be23@thapar.edu";

export default function AdminReports() {
  const { currentUser } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser || currentUser.email !== ADMIN_EMAIL) {
      navigate("/");
      return;
    }

    const qReports = query(
      collection(db, "reports"),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(
      qReports,
      (snap) => {
        setReports(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      () => setLoading(false)
    );

    return () => unsub();
  }, [currentUser, navigate]);

  if (!currentUser || currentUser.email !== ADMIN_EMAIL) {
    return null;
  }

  const handleMarkResolved = async (reportId) => {
    try {
      await updateDoc(doc(db, "reports", reportId), {
        status: "resolved",
      });
    } catch (err) {
      console.error("Error marking resolved:", err);
      alert("Error marking resolved.");
    }
  };

  const handleDisableUser = async (sellerId) => {
    if (!window.confirm("Disable this user? They will appear flagged in the app.")) return;

    try {
      await updateDoc(doc(db, "users", sellerId), {
        disabled: true,
      });
      alert("User disabled (flagged).");
    } catch (err) {
      console.error("Error disabling user:", err);
      alert("Error disabling user.");
    }
  };

  const handleHideListings = async (sellerId) => {
    if (!window.confirm("Hide all listings from this user?")) return;

    try {
      const qListings = query(
        collection(db, "listings"),
        where("sellerId", "==", sellerId)
      );
      const snap = await getDocs(qListings);
      const promises = snap.docs.map((d) =>
        updateDoc(doc(db, "listings", d.id), { status: "removed" })
      );
      await Promise.all(promises);
      alert("All listings from this user set to 'removed'.");
    } catch (err) {
      console.error("Error hiding listings:", err);
      alert("Error hiding listings.");
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-semibold mb-2">Admin reports</h1>
      <p className="text-sm text-gray-600 mb-4">
        Review scam/abuse reports and take action on users and listings.
      </p>

      {loading ? (
        <p className="text-sm text-gray-500">Loading reports…</p>
      ) : reports.length === 0 ? (
        <p className="text-sm text-gray-500">No reports yet.</p>
      ) : (
        <div className="space-y-3">
          {reports.map((r) => (
            <div
              key={r.id}
              className="bg-white rounded-2xl shadow-sm p-3 flex flex-col gap-2"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-semibold">
                    Seller ID:{" "}
                    <Link
                      to={`/user/${r.sellerId}`}
                      className="text-blue-600 hover:underline"
                    >
                      {r.sellerId}
                    </Link>
                  </p>
                  <p className="text-xs text-gray-500">
                    Reported by: {r.reporterEmail || r.reporterId}
                  </p>
                </div>
                <span
                  className={
                    "text-[11px] px-2 py-0.5 rounded-full " +
                    (r.status === "resolved"
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700")
                  }
                >
                  {r.status || "open"}
                </span>
              </div>

              <p className="text-xs text-gray-700">{r.reason}</p>

              <div className="flex gap-2 mt-1 flex-wrap">
                {r.status !== "resolved" && (
                  <button
                    onClick={() => handleMarkResolved(r.id)}
                    className="text-xs px-2 py-1 rounded-full bg-green-600 text-white hover:bg-green-700"
                  >
                    Mark resolved
                  </button>
                )}

                <button
                  onClick={() => handleDisableUser(r.sellerId)}
                  className="text-xs px-2 py-1 rounded-full bg-red-600 text-white hover:bg-red-700"
                >
                  Disable user
                </button>

                <button
                  onClick={() => handleHideListings(r.sellerId)}
                  className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-700 hover:bg-red-200"
                >
                  Hide user listings
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
