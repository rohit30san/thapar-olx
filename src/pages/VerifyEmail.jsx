import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { auth } from "../firebase";
import { sendEmailVerification, reload } from "firebase/auth";

export default function VerifyEmail() {
  const { currentUser } = useAuth();
  const [sending, setSending] = useState(false);
  const [checking, setChecking] = useState(false);
  const navigate = useNavigate();

  if (!currentUser) {
    // if somehow no user, go back to login
    navigate("/login");
  }

  const handleResend = async () => {
    if (!currentUser) return;
    try {
      setSending(true);
      await sendEmailVerification(currentUser);
      alert("Verification email sent! Check your inbox and spam folder.");
    } catch (err) {
      console.error(err);
      alert("Could not send email. Try again in a bit.");
    } finally {
      setSending(false);
    }
  };

  const handleIHaveVerified = async () => {
    if (!currentUser) return;
    try {
      setChecking(true);
      await reload(auth.currentUser); // refresh user info
      if (auth.currentUser.emailVerified) {
        alert("Email verified! You can now use the app.");
        navigate("/");
      } else {
        alert("Still not verified. Please click the link in the email and check spam folder too.");
      }
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 bg-white p-6 rounded-2xl shadow">
      <h1 className="text-2xl font-semibold mb-3">Verify your email</h1>
      <p className="text-sm text-gray-700 mb-2">
        We’ve sent a verification link to:
      </p>
      <p className="text-sm font-medium mb-3">
        {currentUser?.email}
      </p>
      <p className="text-xs text-gray-600 mb-4">
        Please open your email and click on the verification link.
        Don’t forget to check your <span className="font-semibold">Spam</span> /
        <span className="font-semibold"> Promotions</span> tab as well.
      </p>

      <div className="space-y-2">
        <button
          onClick={handleIHaveVerified}
          disabled={checking}
          className="w-full text-sm py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {checking ? "Checking..." : "I have verified my email"}
        </button>
        <button
          onClick={handleResend}
          disabled={sending}
          className="w-full text-sm py-2 rounded-xl bg-gray-100 hover:bg-gray-200 disabled:opacity-60"
        >
          {sending ? "Sending..." : "Resend verification email"}
        </button>
      </div>
    </div>
  );
}
