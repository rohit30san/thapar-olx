import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { signOut } from "firebase/auth";
import { auth, db } from "../firebase";
import { ADMIN_EMAIL } from "../config.js";
import {
  collection,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import { useEffect, useState } from "react";

export default function Navbar() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);

  const [dealCount, setDealCount] = useState(0);
  const [msgCount, setMsgCount] = useState(0);
  const [reportCount, setReportCount] = useState(0);

  // DEALS badge
  useEffect(() => {
    if (!currentUser) return setDealCount(0);

    const dealsRef = collection(db, "deals");

    const qBuyer = query(
      dealsRef,
      where("buyerId", "==", currentUser.uid)
    );
    const qSeller = query(
      dealsRef,
      where("sellerId", "==", currentUser.uid)
    );

    let buyerCount = 0;

    const unsubBuyer = onSnapshot(qBuyer, (snap) => {
      buyerCount = snap.docs.filter((d) => {
        const st = d.data().status;
        return st === "pending" || st === "accepted";
      }).length;
      setDealCount((prev) => buyerCount);
    });

    const unsubSeller = onSnapshot(qSeller, (snap) => {
      const sellerCount = snap.docs.filter((d) => {
        const st = d.data().status;
        return st === "pending" || st === "accepted";
      }).length;
      setDealCount(buyerCount + sellerCount);
    });

    return () => {
      unsubBuyer();
      unsubSeller();
    };
  }, [currentUser]);

  // MESSAGES badge
  useEffect(() => {
    if (!currentUser) return setMsgCount(0);

    const convRef = collection(db, "conversations");
    const qConv = query(
      convRef,
      where("participants", "array-contains", currentUser.uid)
    );

    const unsub = onSnapshot(qConv, (snap) => {
      setMsgCount(snap.size);
    });

    return () => unsub();
  }, [currentUser]);

  // REPORTS badge (admin only)
  useEffect(() => {
    if (!currentUser || currentUser.email !== ADMIN_EMAIL) {
      return setReportCount(0);
    }

    const repRef = collection(db, "reports");
    const qReports = query(repRef, where("status", "==", "open"));

    const unsub = onSnapshot(qReports, (snap) => {
      setReportCount(snap.size);
    });

    return () => unsub();
  }, [currentUser]);

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/login");
    setMenuOpen(false);
  };

  return (
    <nav className="w-full border-b border-red-100 bg-white/95 backdrop-blur sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">

        {/* LOGO */}
        <Link to="/" className="flex items-center gap-2" onClick={() => setMenuOpen(false)}>
          <div className="h-8 w-8 rounded-xl bg-red-600 flex items-center justify-center text-white font-bold shadow-sm">
            T
          </div>
          <div className="flex flex-col leading-tight">
            <span className="font-semibold text-lg text-slate-900">Thapar OLX</span>
            <span className="text-[10px] uppercase tracking-[0.18em] text-red-500">
              Campus only
            </span>
          </div>
        </Link>

        {/* HAMBURGER BUTTON (MOBILE) */}
        <button
          className="md:hidden flex flex-col gap-1.5 p-2"
          onClick={() => setMenuOpen((prev) => !prev)}
        >
          <div className={`w-6 h-0.5 bg-red-600 transition ${menuOpen && "rotate-45 translate-y-1.5"}`}></div>
          <div className={`w-6 h-0.5 bg-red-600 transition ${menuOpen && "opacity-0"}`}></div>
          <div className={`w-6 h-0.5 bg-red-600 transition ${menuOpen && "-rotate-45 -translate-y-1.5"}`}></div>
        </button>

        {/* DESKTOP MENU */}
        <div className="hidden md:flex items-center gap-3">
          <Link to="/" className="text-sm text-slate-700 hover:text-red-600">
            Home
          </Link>

          {currentUser && (
            <Link to="/new" className="text-sm px-3 py-1.5 rounded-full bg-red-600 text-white hover:bg-red-700 shadow-sm">
              + Post
            </Link>
          )}

          {currentUser && (
            <Link to="/messages" className="relative text-sm px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200 hover:bg-slate-100">
              Messages
              {msgCount > 0 && (
                <span className="absolute -top-1 -right-2 text-[10px] px-1.5 py-0.5 rounded-full bg-slate-900 text-white">
                  {msgCount}
                </span>
              )}
            </Link>
          )}

          {currentUser && (
            <Link to="/deals" className="relative text-sm px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200 hover:bg-slate-100">
              Deals
              {dealCount > 0 && (
                <span className="absolute -top-1 -right-2 text-[10px] px-1.5 py-0.5 rounded-full bg-red-600 text-white">
                  {dealCount}
                </span>
              )}
            </Link>
          )}

          {currentUser && currentUser.email === ADMIN_EMAIL && (
            <Link to="/admin" className="relative text-xs px-3 py-1.5 rounded-full bg-red-50 text-red-700 hover:bg-red-100 border border-red-100">
              Admin
              {reportCount > 0 && (
                <span className="absolute -top-1 -right-2 text-[10px] px-1 py-0.5 rounded-full bg-red-600 text-white">
                  {reportCount}
                </span>
              )}
            </Link>
          )}

          {currentUser ? (
            <>
              <Link
                to="/profile"
                className="text-sm px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200 hover:bg-slate-100 max-w-[120px] truncate"
              >
                {currentUser.displayName || currentUser.email.split("@")[0]}
              </Link>
              <button onClick={handleLogout} className="text-xs text-red-500 hover:text-red-600">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm px-3 py-1.5 rounded-full border border-slate-300 hover:bg-slate-50">
                Login
              </Link>
              <Link to="/signup" className="text-sm px-3 py-1.5 rounded-full bg-red-600 text-white hover:bg-red-700 shadow-sm">
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>

      {/* MOBILE MENU PANEL */}
      {menuOpen && (
        <div className="md:hidden px-6 py-4 bg-white border-t border-red-100 flex flex-col gap-3">

          <Link to="/" onClick={() => setMenuOpen(false)} className="text-sm hover:text-red-600">
            Home
          </Link>

          {currentUser && (
            <Link to="/new" onClick={() => setMenuOpen(false)} className="text-sm px-3 py-1.5 rounded-full bg-red-600 text-white hover:bg-red-700 w-fit">
              + Post an item
            </Link>
          )}

          {currentUser && (
            <Link to="/messages" onClick={() => setMenuOpen(false)} className="relative text-sm">
              Messages
              {msgCount > 0 && (
                <span className="ml-2 px-2 py-0.5 rounded-full bg-slate-900 text-white text-[10px]">
                  {msgCount}
                </span>
              )}
            </Link>
          )}

          {currentUser && (
            <Link to="/deals" onClick={() => setMenuOpen(false)} className="relative text-sm">
              Deals
              {dealCount > 0 && (
                <span className="ml-2 px-2 py-0.5 rounded-full bg-red-600 text-white text-[10px]">
                  {dealCount}
                </span>
              )}
            </Link>
          )}

          {currentUser && currentUser.email === ADMIN_EMAIL && (
            <Link to="/admin" onClick={() => setMenuOpen(false)} className="relative text-sm">
              Admin
              {reportCount > 0 && (
                <span className="ml-2 px-2 py-0.5 rounded-full bg-red-600 text-white text-[10px]">
                  {reportCount}
                </span>
              )}
            </Link>
          )}

          {currentUser ? (
            <>
              <Link to="/profile" onClick={() => setMenuOpen(false)} className="text-sm">
                Profile
              </Link>
              <button onClick={handleLogout} className="text-sm text-red-500 text-left">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" onClick={() => setMenuOpen(false)} className="text-sm">
                Login
              </Link>
              <Link to="/signup" onClick={() => setMenuOpen(false)} className="text-sm text-red-600 font-medium">
                Sign up
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
