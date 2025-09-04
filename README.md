# 📈 Samriddhi – Rural Bond Liquidity Platform  

### 📌 Overview  
Samriddhi is an MVP built for the **Securities Market Hackathon organized by SEBI**.  
It addresses the chronic liquidity challenge in India’s bond markets by connecting rural investors — both individuals and Self-Help Groups (SHGs) — to government bonds.  

The platform demonstrates how rural participation can:  
- Unlock new retail liquidity pools  
- Empower excluded communities with better returns  
- Improve market efficiency through stronger price discovery  

---

## 🎥 Demo  

[![Watch the Demo](https://img.youtube.com/vi/iZXWBR711Yg/0.jpg)](https://youtu.be/iZXWBR711Yg)  

---

## 🚩 Problem  
- Indian bond markets suffer from **low liquidity**, making it difficult for institutions to exit positions due to weak retail participation.  
- At the same time, **800M+ rural Indians** remain excluded from formal investments, with over ₹15 lakh crore in savings earning less than 4% annually.  

---

## 💡 Solution  
Samriddhi bridges this gap by:  
- Enabling rural investors and SHGs to **buy and sell government bonds**  
- Providing **simple authentication** (OTP + 4-digit PIN)  
- Offering a **bilingual interface** (Hindi/English) for accessibility  
- Supporting **democratic SHG voting** for group decisions  
- Delivering **portfolio tracking, KYC management, and financial literacy modules**  

---

## 🛠️ Tech Stack  

**Database & ORM**  
- PostgreSQL (configured for production)  
- SQLite (for local development/testing)  
- Prisma ORM for schema management and queries  

**Backend**  
- Node.js + Express.js  
- JWT authentication, bcryptjs for password/PIN hashing  
- Twilio for OTP (SMS/WhatsApp)  
- Helmet, CORS, and Express rate limiting for security  
- Axios for external API calls  

**Frontend**  
- Vanilla JavaScript, HTML, CSS  
- Progressive Web App (PWA) with service worker  
- Responsive, mobile-first design  
- Bilingual support (Hindi/English)  
- Local storage for sessions  

**Current Stage**  
- Runs locally as an **MVP prototype**  
- Demonstrates account creation, bond browsing, SHG voting, and portfolio tracking  

---

## 👥 Team  
- **Kanchan Shukla**  
- **Shivam Wahi**  

---

## ⚠️ Disclaimer  
This is an MVP created for demonstration as part of the **Securities Market Hackathon organized by SEBI**.  
It is not a production-ready application.  
