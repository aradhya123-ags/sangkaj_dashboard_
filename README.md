# BI Application - Quick Start Guide

## 🚀 How to Run

**Option 1: One-Click Start (Recommended)**
1. Double-click `START.bat`
2. Wait for both servers to start
3. Open browser to: http://localhost:5173

**Option 2: Manual Start**
1. Open terminal in `server` folder → Run: `node index.js`
2. Open terminal in `client` folder → Run: `npm run dev`
3. Open browser to: http://localhost:5173

## 🔐 Login

- **Email**: manoj.gulhane@sangkaj.com
- **Password**: Sangkaj@2026

## 📊 Features

1. **Upload Excel Files** - Upload monthly planning data
2. **View & Update** - View and edit existing records
3. **Dashboard** - See statistics and breakdowns

## 🗄️ Database

- **Table**: Monthly Plan
- **Login Table**: login_details (encrypted passwords)

## ⚠️ Important Notes

- Both backend (port 5000) and frontend (port 5173) must be running
- The backend is required to connect to the SQL Server database
- All passwords are encrypted using bcrypt for security

## 🛑 How to Stop

- If using START.bat: Press any key in the command window
- If manual: Press Ctrl+C in both terminal windows
