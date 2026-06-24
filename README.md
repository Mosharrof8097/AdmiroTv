# AdmiroTV - Premium Free Live TV Portal 📺

Welcome to **AdmiroTV**, a highly optimized, fully autonomous Free Live TV streaming portal built with modern web technologies. AdmiroTV provides access to over 1,000+ live premium TV channels from across the globe, wrapped in an ultra-premium "Glassmorphism" user interface.

## ✨ Key Features

- **1,000+ Live Channels:** Stream sports, news, kids, and entertainment channels for free.
- **100% Autonomous (Self-Healing):** Powered by a custom Node.js automation script and GitHub Actions. Every 12 hours, the system automatically fetches thousands of IPTV links, deep-pings them to verify they are live (bypassing CDN blocks), and updates the database. Dead links are automatically removed!
- **Premium UI/UX:** Stunning Dark Mode Glassmorphism design optimized for both Desktop and Mobile devices.
- **Robust Video Player:** Built with `hls.js` featuring auto-buffering UI, fatal error handling (CORS/Geo-block detection), and smooth stream rendering.
- **Smart Monetization:** Strategically placed, non-intrusive ad placeholders (728x90, 300x250, and timed overlay banners) tailored for Adsterra/Monetag. No annoying full-screen pop-ups on channel switches!
- **SEO Optimized:** Fully configured with `robots.txt`, `sitemap.xml`, Open Graph tags, and standard metadata for Google Search indexing.

## 🛠 Technology Stack

- **Framework:** Next.js (App Router)
- **Styling:** Tailwind CSS (Responsive Glassmorphism)
- **Language:** TypeScript
- **Video Streaming:** HLS.js
- **Automation:** Node.js (Fetch & Deep Ping validation)
- **CI/CD:** GitHub Actions & Netlify (Auto Deploy)

## 🚀 How It Works (The Automation)

1. The `.github/workflows/update-channels.yml` file runs a cron job every 12 hours.
2. It executes `scripts/update-channels.mjs` which fetches raw M3U lists from open-source IPTV repositories.
3. The script tests each stream asynchronously using an `AbortController` and custom User-Agents to verify if the stream is truly playable.
4. Only 100% active streams are formatted and saved to `public/channels.json`.
5. GitHub Actions commits the updated JSON file to the `main` branch.
6. Netlify detects the commit, rebuilds the site, and deploys the fresh channel list automatically.

## 💻 Local Development Setup

To run AdmiroTV locally on your machine:

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Mosharrof8097/AdmiroTv.git
   cd AdmiroTv
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Fetch initial live channels:**
   ```bash
   node scripts/update-channels.mjs
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser to watch live TV!

## 📜 License & Disclaimer

This project is built for educational purposes. It utilizes publicly available, free-to-air IPTV links from the internet. The developers do not host, store, or distribute any copyrighted media.

---
*Developed by Md. Mosharrof Hossain (AdmiroTech)*
