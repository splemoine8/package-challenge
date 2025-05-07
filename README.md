# Denny's Pancake Challenge Tracker

A real-time web application for tracking a 24-hour pancake eating challenge at Denny's. The app allows one user to log food items eaten during the challenge while others can watch the countdown update live.

## Features

- Real-time updates using Firebase
- Track pancakes, bacon strips, and helper pancakes
- Automatic time reduction based on food items:
  - Each pancake: -1 hour
  - Every 2 bacon/sausage strips: -15 minutes
  - Each helper pancake: -30 minutes
- Live countdown timer
- Anonymous authentication for viewers

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a Firebase project and enable:
   - Firestore Database
   - Anonymous Authentication
4. Copy your Firebase configuration to `.env`:
   ```
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```
5. Start the development server:
   ```bash
   npm run dev
   ```

## Deployment

The app can be deployed to Vercel:

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add your environment variables in the Vercel dashboard
4. Deploy!

## Usage

1. Open the app in your browser
2. Click "Start Challenge" to begin
3. Use the buttons to log food items as they're eaten
4. Share the URL with friends to let them watch the progress

## Tech Stack

- Frontend: React + Vite
- UI: Chakra UI
- Database: Firebase Firestore
- Authentication: Firebase Anonymous Auth
- Hosting: Vercel

## Adding the Football Player Image

The app is configured to display a football player image next to the title. To use your own image:

1. Save your image as `player-image.png` in the `public` folder of the project.
2. The image will automatically appear next to the title.

For best results, use an image with a transparent background and appropriate height (approximately 120px tall).
