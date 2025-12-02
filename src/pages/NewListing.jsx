import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { useAuth } from "../context/AuthContext.jsx";

const CLOUD_NAME = "dbbkrmlxu";
const UPLOAD_PRESET = "thaparolx";

export default function NewListing() {
  const { currentUser } = useAuth();
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("Mobiles");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("Thapar Campus");
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleFiles = (e) => {
    setFiles(Array.from(e.target.files || []));
  };

  const uploadImages = async () => {
    const urls = [];
    for (const file of files) {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", UPLOAD_PRESET);

      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
        {
          method: "POST",
          body: formData,
        }
      );
      const data = await res.json();
      if (data.secure_url) {
        urls.push(data.secure_url);
      }
    }
    return urls;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser.emailVerified) {
      alert("Please verify your email before posting listings.");
      return;
    }
    try {
      setLoading(true);
      const imageUrls = await uploadImages();
      const docRef = await addDoc(collection(db, "listings"), {
        title,
        price: Number(price),
        category,
        description,
        location,
        images: imageUrls,
        sellerId: currentUser.uid,
        createdAt: serverTimestamp(),
        status: "available",
      });
      navigate(`/listing/${docRef.id}`);
    } catch (err) {
      console.error(err);
      alert("Error creating listing.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Post a new item</h1>
      <form
        onSubmit={handleSubmit}
        className="bg-white p-5 rounded-2xl shadow space-y-3"
      >
        <div>
          <label className="text-sm block mb-1">Title</label>
          <input
            className="w-full border rounded-xl px-3 py-2 text-sm"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. iPhone 11, 128GB"
          />
        </div>
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="text-sm block mb-1">Price (₹)</label>
            <input
              className="w-full border rounded-xl px-3 py-2 text-sm"
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </div>
          <div className="flex-1">
            <label className="text-sm block mb-1">Category</label>
            <select
              className="w-full border rounded-xl px-3 py-2 text-sm"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option>Mobiles</option>
              <option>Laptops</option>
              <option>Books</option>
              <option>Hostel Essentials</option>
              <option>Others</option>
            </select>
          </div>
        </div>
        <div>
          <label className="text-sm block mb-1">Location</label>
          <input
            className="w-full border rounded-xl px-3 py-2 text-sm"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </div>
        <div>
          <label className="text-sm block mb-1">Description</label>
          <textarea
            className="w-full border rounded-xl px-3 py-2 text-sm min-h-[80px]"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Condition, usage, reason for selling, etc."
          />
        </div>
        <div>
          <label className="text-sm block mb-1">Images (up to 4)</label>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleFiles}
            className="text-sm"
          />
        </div>
        <button
          disabled={loading}
          className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 rounded-xl disabled:opacity-60"
        >
          {loading ? "Posting..." : "Post listing"}
        </button>
      </form>
    </div>
  );
}
