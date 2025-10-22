# 🚀 Run Locally

### **Prerequisites**
- [Node.js](https://nodejs.org/) (v18 or higher recommended)  
- A **Gemini API key** (Google AI)  
- Access to the **Neo** database *(remote — do not use local or temporary databases)*

---

### **1. Clone the repository**
```bash
git clone https://github.com/your-username/your-repository.git
cd your-repository
```

---

### **2. Install dependencies**
```bash
npm install
```

---

### **3. Set up environment variables**
Create a file named `.env.local` in the root directory and add your Gemini API key:

```
SESSION_SECRET=your_new_session_secret
B2_APP_KEY=your_new_b2_app_key
B2_KEY_ID=your_new_b2_key_id
B2_BUCKET_NAME=DashPanel
B2_ENDPOINT=s3.us-east-005.backblazeb2.com
GOOGLE_CLIENT_ID=your_new_google_client_id
GOOGLE_CLIENT_SECRET=your_new_google_client_secret
GEMINI_API_KEY=your_new_gemini_api_key
DATABASE_URL=your_new_database_url
```

> ⚠️ **Important:**  
> This project uses the **Neo** cloud database.  
> Do **not** use local or temporary databases — all data must be stored in the Neo instance configured on the production environment.

---

### **4. Run the development server**
```bash
npm run dev
```

The app will start at:
```
http://localhost:3000
```

---

### **5. (Optional) Build for production**
```bash
npm run build
npm start
```
