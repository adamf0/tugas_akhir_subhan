# 🧱 ASJ RBAC

**Role-Based Access Control (RBAC) System** menggunakan **React + Vite + TailwindCSS**, dirancang untuk performa tinggi dan kemudahan pengembangan.  <br><br>
demo: https://adamf0.github.io/asj_rbac <br>
note: <br>
akun login tidak ada karena masih prototype, yang penting masukkan email dengan format benar dan password dengan panjang 6 karakter

---

## ⚙️ Teknologi Utama

- ⚛️ **React 19**  
- ⚡ **Vite 7**  
- 🎨 **TailwindCSS 4**  
- 🧩 **Radix UI + Lucide Icons**  
- 🎭 **Framer Motion**  
- 🧠 **React Hook Form**  
- 🧹 **ESLint 9**

---

## 🧰 Persiapan Awal

Pastikan Anda sudah menginstal:

- [Node.js](https://nodejs.org/) versi **22.13.1** atau lebih baru

---

## 📥 Instalasi

Langkah-langkah untuk menjalankan proyek di mode developer:

```bash
# 1️⃣ Clone repository
git clone https://github.com/adamf0/asj_rbac.git

# 2️⃣ Masuk ke folder project
cd asj_rbac

# 3️⃣ Install dependencies
npm install

# 4️⃣ Jalankan project di mode development
npm run dev
```

---

## 🚀 Deploy Production

Langkah-langkah untuk menjalankan proyek di mode production:

```bash
# 1️⃣ build project
npm run build

# 2️⃣ Install dependencies untuk runner
npm install -g serve

# 3️⃣ jalankan project
serve -s dist -l 3000 --single
```

buka url http://localhost:3000 untuk akses project

---

Langkah-langkah untuk menjalankan proyek di mode production (versi docker):

```bash
docker compose up -d
```

nginx.conf :
```bash
server {
    listen 80;
    server_name _;

    # Reverse proxy ke container React (port 3000)
    location / {
        proxy_pass http://frontend:3000;
        proxy_http_version 1.1;

        # Header standar agar React Router tidak error
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Cegah cache & dukung WebSocket (jika dibutuhkan)
        proxy_cache_bypass $http_upgrade;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        # React Router fallback: semua path diarahkan ke index.html
        error_page 404 /index.html;
    }
}
```

buka url http://localhost:3000 untuk akses project