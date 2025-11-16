# 🛒 Our Shopping List

A shared shopping list web app for couples, built with React and Firebase. Real-time synchronization allows both partners to add, check off, and manage items together.

## 🌟 Features

- ✅ Add and remove shopping items
- ✅ Check off completed items
- ✅ Real-time synchronization via Firebase
- ✅ Clean, modern, mobile-friendly design
- ✅ Clear completed items in bulk
- 🔮 Future: Shared calendar
- 🔮 Future: Expense tracking (Splitwise-style)

## 🚀 Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Firebase

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project (or use an existing one)
3. Add a web app to your project
4. Enable **Realtime Database**:
   - Go to Build → Realtime Database
   - Click "Create Database"
   - Start in **test mode** for development (remember to secure it later!)
5. Copy your Firebase configuration
6. Update `src/firebaseConfig.js` with your credentials:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

### 3. Run Locally

```bash
npm run dev
```

Visit `http://localhost:5173` to see your app!

### 4. Deploy to GitHub Pages

1. Go to your GitHub repository settings
2. Navigate to **Pages** under "Code and automation"
3. Under "Build and deployment", select **GitHub Actions** as the source
4. Push your code to the `main` branch
5. The GitHub Action will automatically build and deploy your site
6. Your site will be available at: `https://yourusername.github.io/couple-shopping-list/`

**Note:** If your repository name is different, update the `base` property in `vite.config.js` to match your repository name.

## 🔐 Security Considerations

Before going to production, secure your Firebase database:

1. Go to Firebase Console → Realtime Database → Rules
2. Replace the default rules with proper authentication rules
3. Consider implementing Firebase Authentication for better security

Example rules (after implementing auth):
```json
{
  "rules": {
    "shoppingList": {
      ".read": "auth != null",
      ".write": "auth != null"
    }
  }
}
```

## 🛠️ Tech Stack

- **Frontend:** React 18 + Vite
- **Database:** Firebase Realtime Database
- **Hosting:** GitHub Pages
- **Styling:** CSS3 with modern gradients

## 📱 Mobile Friendly

The app is fully responsive and works great on mobile devices!

## 🎨 Customization

Feel free to customize:
- Colors in `src/App.css` and `src/index.css`
- Title and subtitle in `src/App.jsx`
- Favicon in `public/shopping-cart.svg`

## 🤝 Contributing

This is a personal project, but feel free to fork it and make it your own!

## 📄 License

MIT
website to create a shared shopping list and potential features like expenses and shared calendar
