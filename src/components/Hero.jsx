import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Hero() {
  const { currentUser } = useAuth();

  return (
    <section className="relative w-full overflow-hidden rounded-3xl shadow-sm border border-red-200 mt-5">

      {/* Background Image (Thapar campus) */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage:
            "url('https://api.architectuul.org/media/5bf6a6c7-4314-4aaa-9b05-2e6c6d7b5e1b/1312x.jpg')", // You can replace with any Thapar image
        }}
      ></div>

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/50"></div>

      {/* Content */}
      <div className="relative z-10 px-6 py-14 md:px-12 md:py-20 text-white">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold leading-tight drop-shadow-xl break-words">
  <span className="block">A Safer Marketplace,</span>
  <span className="block">
    Exclusively for{" "}
    <span className="text-red-400">Thapar Students</span>
  </span>
</h1>


        <p className="mt-3 text-sm md:text-base text-gray-200 max-w-xl drop-shadow-md">
          Buy, sell, chat and finalize deals within the Thapar community — 
          verified @thapar.edu users only.
        </p>

        <div className="mt-6 flex gap-3">
          {currentUser ? (
            <>
              <Link
                to="/new"
                className="px-4 py-2 rounded-full bg-red-600 text-white text-sm hover:bg-red-700 shadow-lg"
              >
                + Post Item
              </Link>

              <Link
                to="/deals"
                className="px-4 py-2 rounded-full bg-white/20 border border-white/30 text-white text-sm hover:bg-white/30 backdrop-blur-sm shadow-md"
              >
                View Deals
              </Link>
            </>
          ) : (
            <>
              <Link
                to="/signup"
                className="px-4 py-2 rounded-full bg-red-600 text-white text-sm hover:bg-red-700 shadow-lg"
              >
                Create Account
              </Link>

              <Link
                to="/login"
                className="px-4 py-2 rounded-full bg-white/20 border border-white/30 text-white text-sm hover:bg-white/30 backdrop-blur-sm shadow-md"
              >
                Login
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Fade bottom edge */}
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#fff7f7] to-transparent"></div>
    </section>
  );
}
