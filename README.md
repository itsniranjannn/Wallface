# Aurora — Personal New Tab

> A modern, distraction-free new tab experience for Chromium-based browsers.

Aurora transforms every new tab into a beautiful and personal dashboard. Customize it with your own photos, GIFs, or videos while enjoying a clean interface featuring a greeting, live clock, local weather, and quick access to your favorite websites.

Designed with privacy in mind, Aurora stores everything locally on your device. No accounts, no tracking, no ads.

---

## Features

### 🎥 Beautiful Custom Backgrounds
- Set any image, GIF, or video as your new tab background.
- Supports high-resolution media, including 4K videos.
- Drag & drop support.
- Replace or remove backgrounds anytime.
- Video sound toggle.

### 👋 Personalized Experience
- Dynamic greeting based on the current time.
- Optional personalized name.
- Elegant glassmorphism interface.

### 🕒 Live Clock
- Real-time clock.
- Choose between:
  - 12-hour format
  - 24-hour format

### 🌤 Local Weather
- Automatically detects your location.
- Displays:
  - Current temperature
  - Weather condition
  - Location
- Supports:
  - Celsius (°C)
  - Fahrenheit (°F)

### 🔗 Quick Links
- Create shortcuts to your favorite websites.
- Website favicon support.
- Right-click context menu.
- Edit existing shortcuts.
- Remove shortcuts.
- One-row centered layout.

### 🎨 Customization
- Multiple accent colors
- Adjustable background dimming
- Show or hide Quick Links
- Fully local settings

### 🔒 Privacy First
- No user accounts
- No analytics
- No advertisements
- No cloud storage
- Everything stays on your device

---

# Screenshots
![alt text](image.png)
![alt text](image-1.png)
---

# Installation

## Chrome / Brave / Edge (Developer Mode)

1. Download or clone this repository.

2. Extract the project if downloaded as a ZIP.

3. Open:

```
chrome://extensions
```

or

```
brave://extensions
```

4. Enable **Developer Mode**.

5. Click **Load unpacked**.

6. Select the Aurora project folder.

7. Open a new tab.

Done.

---

# Usage

## Setting a Background

You can:

- Click **Choose a File**
- Drag and drop an image, GIF, or video anywhere on the page

Supported formats include:

- JPG
- PNG
- WebP
- GIF
- MP4
- WebM
- Most browser-supported image/video formats

---

## Settings

Open the settings panel using the gear icon.

Available options include:

- Change your display name
- Replace or remove the background
- Switch between °C and °F
- Toggle 12-hour / 24-hour clock
- Adjust backdrop dimming
- Change accent color
- Show or hide Quick Links

---

## Weather

Aurora requests your location only to retrieve the current weather forecast.

The forecast refreshes automatically every 30 minutes.

You can also click the weather widget to refresh manually.

Your location is **never stored or transmitted** beyond the weather request.

---

# Storage

Aurora stores all data locally.

### Settings

Stored using:

- Chrome Storage Sync
- Local Storage (fallback)

### Background Media

Large images and videos are stored using **IndexedDB**, allowing support for high-resolution media without browser storage limitations.

Only **one background file** is stored at a time. Replacing your background automatically overwrites the previous one.

No unnecessary files accumulate over time.

---

# Project Structure

```
Aurora/
│
├── manifest.json          Extension manifest (Manifest V3)
├── newtab.html            Main new tab page
├── style.css              User interface styling
├── newtab.js              Main application logic
├── db.js                  IndexedDB wrapper
├── icons/                 Extension icons
└── README.md
```

---

# Technologies

- HTML5
- CSS3
- Vanilla JavaScript
- IndexedDB
- Chrome Extension Manifest V3
- Open-Meteo API
- BigDataCloud Reverse Geocoding API

---

# Browser Support

✔ Google Chrome

✔ Brave Browser

✔ Microsoft Edge

✔ Vivaldi

✔ Opera

*(Any Chromium-based browser supporting Manifest V3.)*

---

# Performance

Aurora is designed to remain lightweight while supporting rich media backgrounds.

Features include:

- Hardware-accelerated video playback
- Background video pausing when the tab is inactive
- Efficient IndexedDB media storage
- Local caching for weather data
- Minimal CPU usage when idle

---

# Privacy

Aurora does **not**:

- collect analytics
- track browsing history
- upload your files
- create user accounts
- send personal information to third parties

Everything remains on your local device.

---

# Third-Party Services

Aurora uses the following public services:

### Open-Meteo

Current weather data.

https://open-meteo.com/

### BigDataCloud

Reverse geocoding for displaying your location name.

https://www.bigdatacloud.com/

---

# Roadmap

Planned improvements include:

- Search bar
- Bookmark folders
- Drag-and-drop quick link sorting
- Daily quotes
- Calendar widget
- Notes widget
- Animated theme packs
- More customization options

---

# Contributing

Contributions, feature requests, and bug reports are welcome.

If you'd like to contribute:

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Open a Pull Request

---


# Author

**Niranjan**

Designed and developed for a cleaner, more personal browsing experience.