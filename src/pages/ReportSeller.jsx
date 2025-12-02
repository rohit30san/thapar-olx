import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { db } from "../firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";

export default function ReportSeller() {
  const { sellerId } = useParams();
  const { currentUser } = useAuth();
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      alert("Please log in to report.");
      navigate("/login");
      return;
    }
    if (!reason.trim()) {
      alert("Please describe the issue.");
      return;
    }

    try {
      setLoading(true);
      await addDoc(collection(db, "reports"), {
        sellerId,
        reporterId: currentUser.uid,
        reporterEmail: currentUser.email,
        reason: reason.trim(),
        status: "open", // important for admin notifications
        createdAt: serverTimestamp(),
      });

      alert("Report submitted. Admin will review it.");
      navigate("/");
    } catch (err) {
      console.error(err);
      alert("Error submitting report.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-8 bg-white rounded-2xl shadow p-5">
      <h1 className="text-xl font-semibold mb-2">Report seller</h1>
      <p className="text-xs text-gray-600 mb-3">
        This is only for serious issues (scam, fake product, harassment, etc.).
        Admin will review your report.
      </p>

      <form onSubmit={handleSubmit} className="space-y-3">
        <textarea
          className="w-full border rounded-xl px-3 py-2 text-sm"
          rows={4}
          placeholder="Describe what happened..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />

        <button
          disabled={loading}
          className="w-full text-sm py-2 rounded-xl bg-red-600 text-white hover:bg-red-700 disabled:opacity-60"
        >
          {loading ? "Submitting..." : "Submit report"}
        </button>
      </form>
    </div>
  );
}
