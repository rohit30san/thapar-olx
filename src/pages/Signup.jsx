import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  updateProfile,
} from "firebase/auth";
import { auth, db } from "../firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

export default function Signup() {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");

    if (!email.endsWith("@thapar.edu")) {
      setError("Only @thapar.edu email IDs are allowed.");
      return;
    }

    if (!displayName.trim()) {
      setError("Please enter your name.");
      return;
    }

    try {
      setLoading(true);

      // Create auth user
      const res = await createUserWithEmailAndPassword(auth, email, password);

      // Set displayName in Firebase Auth
      await updateProfile(res.user, {
        displayName: displayName.trim(),
      });

      // Create user doc in Firestore
      await setDoc(doc(db, "users", res.user.uid), {
        uid: res.user.uid,
        email: res.user.email,
        displayName: displayName.trim(),
        createdAt: serverTimestamp(),
      });

      // Send verification email
      await sendEmailVerification(res.user);

      alert(
        "Account created! We have sent a verification link to your email. " +
          "Please verify before using the app. Also check your Spam/Promotions folder."
      );
      navigate("/verify-email");
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 bg-white p-6 rounded-2xl shadow">
      <h1 className="text-2xl font-semibold mb-4">
        Create a Thapar OLX account
      </h1>
      {error && (
        <div className="mb-3 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-xl">
          {error}
        </div>
      )}
      <form onSubmit={handleSignup} className="space-y-3">
        <div>
          <label className="text-sm block mb-1">Name</label>
          <input
            className="w-full border rounded-xl px-3 py-2 text-sm"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Your name"
          />
        </div>
        <div>
          <label className="text-sm block mb-1">Thapar email</label>
          <input
            className="w-full border rounded-xl px-3 py-2 text-sm"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value.trim())}
            placeholder="you@thapar.edu"
          />
        </div>
        <div>
          <label className="text-sm block mb-1">Password</label>
          <input
            className="w-full border rounded-xl px-3 py-2 text-sm"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 6 characters"
          />
        </div>
        <button
          disabled={loading}
          className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 rounded-xl disabled:opacity-60"
        >
          {loading ? "Creating account..." : "Sign up"}
        </button>
      </form>
      <p className="mt-4 text-xs text-gray-600">
        Already have an account?{" "}
        <Link to="/login" className="text-blue-600 hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
