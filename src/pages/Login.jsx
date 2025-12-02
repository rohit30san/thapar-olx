import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      setLoading(true);
      const res = await signInWithEmailAndPassword(auth, email, password);
      if (!res.user.emailVerified) {
        alert("Please verify your email before posting items.");
      }
      navigate("/");
    } catch (err) {
      console.error(err);
      setError("Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 bg-white p-6 rounded-2xl shadow">
      <h1 className="text-2xl font-semibold mb-4">Log in</h1>
      {error && (
        <div className="mb-3 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-xl">
          {error}
        </div>
      )}
      <form onSubmit={handleLogin} className="space-y-3">
        <div>
          <label className="text-sm block mb-1">Email</label>
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
          />
        </div>
        <button
          disabled={loading}
          className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 rounded-xl disabled:opacity-60"
        >
          {loading ? "Logging in..." : "Log in"}
        </button>
      </form>
      <p className="mt-4 text-xs text-gray-600">
        New here?{" "}
        <Link to="/signup" className="text-blue-600 hover:underline">
          Create account
        </Link>
      </p>
    </div>
  );
}
