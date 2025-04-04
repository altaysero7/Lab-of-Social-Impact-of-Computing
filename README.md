# Sustainable Image Optimization with CDN & Browser Extension

A system that detects and optimizes unnecessarily heavy images by redirecting them through a CDN server, converting them to lighter formats like WebP, and providing real‑time impact visualization. The project consists of a browser extension, a CDN server, and a dashboard to track environmental and performance benefits. This project was developed as part of the Lab of Social Impact of Computing course at Trento University, Italy.

---

## 🌍 Project Overview

Many websites serve images in outdated or excessively high‑quality formats, leading to unnecessary data transfer, increased energy consumption, and slower load times. This system addresses these issues by:

- **Intercepting image requests** via a browser extension that dynamically injects a unique, anonymous client ID.
- **Redirecting images** through a CDN server that optimizes them.
- **Converting images** into more efficient formats (e.g., WebP) only when the conversion produces smaller file sizes.
- **Persisting and tracking statistics** over time (including per‑user usage) to evaluate data savings and overall sustainability impact.
- **Visualizing real‑time insights** in a dashboard with human‑readable formats (e.g., bytes in KB/MB, energy in kJ/MJ, and time in minutes/hours).

---

## 🛠️ Technologies Used

- **CDN Server:**
  Express.js, Sharp, Socket.IO, Fetch API
  *(Persists overall stats and a time-series history to JSON files for moderate, single‑instance usage. For production, a database or cloud storage service is recommended.)*

- **Browser Extension:**
  WebExtensions API (Manifest V3), Declarative Net Request, chrome.storage
  *(Generates a random anonymous client ID to track unique usage while preserving privacy.)*

- **Dashboard:**
  Chart.js, JavaScript, HTML, CSS
  *(Displays key metrics with human‑readable formatting and a slider to navigate historical data.)*

---

## ⚙️ Installation & Setup

### 1️⃣ Set Up the CDN Server

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/yourusername/sustainable-image-optimization.git
   cd sustainable-image-optimization/cdn-server
