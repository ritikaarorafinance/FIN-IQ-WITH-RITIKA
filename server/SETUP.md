# Feedback System Setup Guide

## Quick Start

The feedback system requires a backend server to send emails directly to your inbox.

### Step 1: Generate Gmail App Password

1. Go to your Google Account: https://myaccount.google.com/
2. Click "Security" in the left menu
3. Scroll down to "App passwords" (you need 2FA enabled first)
4. Select "Mail" and "Windows Computer"
5. Google will generate a 16-character password - copy it

### Step 2: Configure Environment Variables

1. Open `server/.env` file
2. Replace `your-16-char-app-password-here` with the password from Step 1
3. Keep `EMAIL_USER=ritika.arora@fostiima.org`
4. Save the file

### Step 3: Run the Backend Server

Open a NEW terminal and run:

```bash
cd server
npm start
```

You should see: `Server running on http://localhost:3001`

### Step 4: Start the Frontend

Keep your existing Vite dev server running on http://localhost:5174 (or your current port)

### Step 5: Test the Feedback Form

1. Navigate to http://localhost:5174/feedback
2. Fill out the form with test data
3. Click "Send Feedback"
4. The email should arrive at ritika.arora@fostiima.org within seconds

## Troubleshooting

- **"Is the server running on port 3001?"** → Run `npm start` in the `server` folder
- **"Failed to send feedback"** → Check if your Gmail App Password is correct in `.env`
- **Still not working?** → Check server console for error messages

## Production Deployment

When deploying to production:
1. Update the frontend to use your production server URL instead of `localhost:3001`
2. Ensure your production server has the correct `.env` variables set
3. Consider using a service like Heroku, Railway, or Vercel for the backend
