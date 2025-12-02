# 🚀 Thapar OLX — A Campus Marketplace for Thapar University

Thapar OLX is a secure, student-only marketplace for buying, selling, chatting, and managing deals exclusively within the Thapar Institute campus.  
Built using **React (Vite) + Firebase**, the platform ensures that only verified **@thapar.edu** users can participate.

**Live Demo:** https://thaparolx-ccde5.web.app/

---

## 🏆 Features

### 🔐 Authentication
- Only **@thapar.edu** emails allowed  
- Email verification required  
- Login / Signup / Logout  
- User display names support  

---

### 🛒 Listings
- Create, view, and delete listings  
- Upload images  
- “Sold” label for completed deals  
- Seller name + rating on card  
- Safe, student-only buying and selling  
- When admin deletes listing → chats + deals deleted & seller notified  

---

### 💬 Chat System
- Real-time chat using Firestore  
- Auto-creates chat when contacting seller  
- System messages for deal updates  
- Conversations removed when listing is deleted  

---

### 🤝 Deal Management
- Buyer: Create deal  
- Seller: Accept / Reject / Set meeting / Complete  
- Buyer can cancel  
- Automatic system notifications  
- Deal history tracking  

---

### ⭐ Review System
- Buyers can rate sellers (1–5 stars)  
- Reviews visible on seller profiles  
- Average seller rating shown everywhere  
- Reviewer’s display name shown  

---

### 🚫 Report System
- Report suspicious sellers  
- Admin dashboard shows all reports  
- Admin can disable users  
- Admin can delete listings + notify seller  

---

### 🛡️ Admin Dashboard
- Overview: Users, listings, deals, reports  
- Recent listings moderation panel  
- Delete listing (also deletes chats + deals)  
- Disabled-users list  
- Open report viewer  
- One-click user re-enable  

---

### 🎨 UI / UX
- Fully mobile responsive  
- Thapar-themed red/white UI  
- Beautiful Hero banner with campus image  
- Modern cards & shadows  
- Clean layout for mobile + desktop  

---

## 🧰 Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React (Vite) |
| Styling | Tailwind CSS |
| Backend | Firebase Firestore |
| Auth | Firebase Authentication |
| Storage | Firebase Storage |
| Deployment | Firebase Hosting |
| CI/CD | GitHub Actions |
git clone https://github.com/YOUR_USERNAME/thapar-olx.git
cd thapar-olx
