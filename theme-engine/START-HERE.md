# How to Run the Theme Engine

## The Problem
The theme engine cannot load JSON theme files when opened directly in a browser (using `file://` protocol) due to CORS security restrictions.

## The Solution
Run a local web server! This allows the browser to load all files properly.

## Quick Start

### Option 1: Using Node.js (Recommended)

1. Open Command Prompt or Terminal
2. Navigate to this folder:
   ```
   cd C:\Users\rober\Desktop\norcal-trail\theme-engine
   ```
3. Run the server:
   ```
   node server.js
   ```
   OR just double-click `start-server.bat`

4. Open your browser and go to:
   ```
   http://localhost:8000
   ```

5. To stop the server, press `Ctrl+C` in the terminal

### Option 2: Using Python (If you don't have Node.js)

1. Open Command Prompt or Terminal
2. Navigate to this folder:
   ```
   cd C:\Users\rober\Desktop\norcal-trail\theme-engine
   ```
3. Run ONE of these commands (depending on your Python version):
   ```
   python -m http.server 8000
   ```
   OR
   ```
   python3 -m http.server 8000
   ```

4. Open your browser and go to:
   ```
   http://localhost:8000
   ```

5. To stop the server, press `Ctrl+C` in the terminal

## Important Notes

- **DO NOT** open `index.html` directly in your browser by double-clicking it
- **ALWAYS** use the web server (localhost:8000) to run the game
- The server must be running for the game to work properly
- Themes will now load correctly and the party will display!

## Troubleshooting

### "node is not recognized" error
You need to install Node.js first. Download from: https://nodejs.org/

### "python is not recognized" error
You need to install Python first. Download from: https://www.python.org/

### Port 8000 is already in use
Change the PORT number in `server.js` (line 5) to something else like 8001, 8080, etc.
