# Deployment Guide for Couple Shopping List

This guide will walk you through deploying the Couple Shopping List application to GitHub Pages with Firebase backend.

## Prerequisites

- A GitHub account
- A Firebase account (free tier is sufficient)
- Git installed on your computer
- Node.js (v14 or higher) installed

## Step 1: Set Up Firebase Project

1. **Go to Firebase Console**
   - Visit [https://console.firebase.google.com/](https://console.firebase.google.com/)
   - Click "Add project" or "Create a project"

2. **Create a New Project**
   - Enter a project name (e.g., "couple-shopping-list")
   - Accept the Firebase terms
   - You can disable Google Analytics for this project
   - Click "Create project"

3. **Register Your Web App**
   - In your Firebase project dashboard, click the web icon (</>) to add a web app
   - Give your app a nickname (e.g., "Shopping List Web")
   - Check "Also set up Firebase Hosting" (optional)
   - Click "Register app"

4. **Copy Firebase Configuration**
   - Firebase will show you a configuration object that looks like this:
   ```javascript
   const firebaseConfig = {
     apiKey: "AIza...",
     authDomain: "your-project.firebaseapp.com",
     databaseURL: "https://your-project-default-rtdb.firebaseio.com",
     projectId: "your-project",
     storageBucket: "your-project.appspot.com",
     messagingSenderId: "123456789",
     appId: "1:123456789:web:abc123"
   };
   ```
   - **SAVE THESE VALUES** - you'll need them later

5. **Enable Authentication**
   - In the left sidebar, click "Build" → "Authentication"
   - Click "Get started"
   - Click on "Email/Password" in the sign-in providers list
   - Toggle "Email/Password" to **Enabled**
   - Click "Save"

6. **Create Realtime Database**
   - In the left sidebar, click "Build" → "Realtime Database"
   - Click "Create Database"
   - Choose a location (select one close to you)
   - Start in **test mode** for now (we'll secure it later)
   - Click "Enable"

7. **Set Up Security Rules (Important!)**
   - In the Realtime Database page, click on the "Rules" tab
   - Replace the default rules with:
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
   - Click "Publish"
   - These rules ensure only authenticated users can access the shopping list

## Step 2: Configure GitHub Repository

1. **Fork or Clone the Repository**
   - If you haven't already, clone this repository to your local machine

2. **Add Firebase Configuration to GitHub Secrets**
   - Go to your GitHub repository
   - Click "Settings" → "Secrets and variables" → "Actions"
   - Click "New repository secret"
   - Add the following secrets (one at a time) using the values from your Firebase config:
     - `REACT_APP_FIREBASE_API_KEY` = your apiKey
     - `REACT_APP_FIREBASE_AUTH_DOMAIN` = your authDomain
     - `REACT_APP_FIREBASE_DATABASE_URL` = your databaseURL
     - `REACT_APP_FIREBASE_PROJECT_ID` = your projectId
     - `REACT_APP_FIREBASE_STORAGE_BUCKET` = your storageBucket
     - `REACT_APP_FIREBASE_MESSAGING_SENDER_ID` = your messagingSenderId
     - `REACT_APP_FIREBASE_APP_ID` = your appId

3. **Enable GitHub Pages**
   - Go to "Settings" → "Pages"
   - Under "Build and deployment":
     - Source: "GitHub Actions"
   - This is already configured by the workflow file

## Step 3: Local Development Setup

1. **Create Local Environment File**
   ```bash
   cp .env.example .env.local
   ```

2. **Edit `.env.local`**
   - Open the file and replace the placeholder values with your Firebase config values
   - Example:
   ```env
   REACT_APP_FIREBASE_API_KEY=AIza...
   REACT_APP_FIREBASE_AUTH_DOMAIN=couple-shopping-list-abc.firebaseapp.com
   REACT_APP_FIREBASE_DATABASE_URL=https://couple-shopping-list-abc-default-rtdb.firebaseio.com
   REACT_APP_FIREBASE_PROJECT_ID=couple-shopping-list-abc
   REACT_APP_FIREBASE_STORAGE_BUCKET=couple-shopping-list-abc.appspot.com
   REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789012
   REACT_APP_FIREBASE_APP_ID=1:123456789012:web:abc123def456
   ```

3. **Install Dependencies**
   ```bash
   npm install
   ```

4. **Test Locally**
   ```bash
   npm start
   ```
   - Open [http://localhost:3000](http://localhost:3000)
   - Create an account and test the functionality

## Step 4: Deploy to GitHub Pages

### Automatic Deployment (Recommended)

1. **Commit and Push to Main Branch**
   ```bash
   git add .
   git commit -m "Configure deployment"
   git push origin main
   ```

2. **Check GitHub Actions**
   - Go to your repository on GitHub
   - Click on the "Actions" tab
   - You should see a workflow running called "Deploy to GitHub Pages"
   - Wait for it to complete (usually takes 2-3 minutes)

3. **Access Your App**
   - Once deployed, your app will be available at:
   - `https://[your-username].github.io/couple-shopping-list/`
   - For example: `https://schmoeppel.github.io/couple-shopping-list/`

### Manual Deployment (Alternative)

If you prefer to deploy manually using gh-pages:

1. **Build the App**
   ```bash
   npm run build
   ```

2. **Deploy**
   ```bash
   npm run deploy
   ```

This will build and push to the `gh-pages` branch.

## Step 5: First Time Usage

1. **Create Accounts**
   - Have both users (you and your partner) visit the deployed URL
   - Each person should create an account using their email and password
   - Use strong passwords (minimum 6 characters)

2. **Start Using the Shopping List**
   - Sign in with your credentials
   - Add items to the shopping list
   - Changes will appear in real-time for both users
   - Check off items as you shop
   - Delete items when no longer needed

## Troubleshooting

### "Cannot parse Firebase url" Error
- Make sure your `REACT_APP_FIREBASE_DATABASE_URL` is correct
- It should look like: `https://your-project-default-rtdb.firebaseio.com`

### Authentication Not Working
- Check that Email/Password authentication is enabled in Firebase Console
- Verify your Firebase config values are correct

### Can't Write to Database
- Check your Firebase Realtime Database rules
- Make sure you're signed in
- Verify the rules allow authenticated users to write

### GitHub Pages Not Deploying
- Check the Actions tab for any errors
- Verify all GitHub Secrets are set correctly
- Make sure GitHub Pages is enabled in repository settings

### App Shows "Loading..." Forever
- Open browser console (F12) to check for errors
- Verify Firebase configuration is correct
- Check that the database URL is valid

## Security Best Practices

1. **Never commit `.env.local` to Git**
   - It's already in `.gitignore`, but double-check

2. **Use Strong Passwords**
   - Firebase requires minimum 6 characters
   - Use unique passwords for each user

3. **Firebase Security Rules**
   - The provided rules only allow authenticated users to access data
   - For production, you might want to add more specific rules

4. **Keep Secrets Safe**
   - GitHub Secrets are encrypted and only accessible during workflow runs
   - Never share your Firebase API keys publicly

## Updating the App

1. Make changes to your code
2. Commit and push to the main branch
3. GitHub Actions will automatically rebuild and deploy

Or manually:
```bash
npm run deploy
```

## Cost Considerations

- **Firebase Free Tier (Spark Plan)** includes:
  - 100 simultaneous connections
  - 1GB storage
  - 10GB/month download
  - This is more than enough for a couple's shopping list

- **GitHub Pages** is free for public repositories

## Support

If you encounter issues:
1. Check the Firebase Console for any error messages
2. Check GitHub Actions logs for deployment issues
3. Open browser console (F12) to see client-side errors
4. Review Firebase documentation: https://firebase.google.com/docs

## Next Steps

Now that your shopping list is deployed, you might want to:
- Customize the styling (edit CSS files)
- Add more features (categories, notes, etc.)
- Set up Firebase analytics to track usage
- Add push notifications
- Implement the expense tracking feature
- Add the shared calendar feature

Enjoy your shared shopping list! 🛒
