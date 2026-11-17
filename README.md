# YouTube Data API Setup Guide

To run the `fetch_courses.py` script, you need a free YouTube Data API v3 Key. Here's how to get one:

## 1. Create a Google Cloud Project
1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Sign in with your Google account.
3. Click the project dropdown near the top-left (next to the Google Cloud logo) and click **New Project**.
4. Name your project (e.g., "Coursai API") and click **Create**.

## 2. Enable the YouTube Data API v3
1. Make sure your new project is selected in the top-left dropdown.
2. In the left-hand menu, go to **APIs & Services > Library**.
3. In the search bar, type `YouTube Data API v3` and press Enter.
4. Click on the `YouTube Data API v3` result.
5. Click the blue **Enable** button.

## 3. Generate the API Key
1. In the left-hand menu, go to **APIs & Services > Credentials**.
2. Click the **+ CREATE CREDENTIALS** button at the top.
3. Select **API key** from the dropdown.
4. A popup will appear with your new API key. Copy this key.
   *(Optional but recommended: Click "Edit API key", restrict it to "YouTube Data API v3", to prevent abuse).*

## 4. Run the Script
The script expects the key in an environment variable named `YOUTUBE_API_KEY`.

**On Windows (Command Prompt):**
```cmd
set YOUTUBE_API_KEY=your_api_key_here
python fetch_courses.py
```

**On Windows (PowerShell):**
```powershell
$env:YOUTUBE_API_KEY="your_api_key_here"
python fetch_courses.py
```

**On Mac/Linux:**
```bash
export YOUTUBE_API_KEY="your_api_key_here"
python fetch_courses.py
```

## Important Notes on Quotas
- A free Google Cloud project starts with a **10,000 units/day** quota for the YouTube API.
- A search request costs **100 units**. Fetching video details or playlists costs **1 unit** per page.
- The script uses about ~200-250 units per topic. It keeps track of the quota and will stop safely at 9,500 units.
- If it stops, wait until midnight Pacific Time (when quotas reset) and run it again. It automatically reads the existing JSON file, skips what it already found, and continues!
