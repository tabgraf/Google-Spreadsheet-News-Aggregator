
# 📰 Google Apps Script RSS Feed Aggregator

This Google Apps Script application helps you **aggregate news articles from multiple RSS feeds** and automatically store them in a **Google Sheet**. It offers options for both automatic syncing at a specified interval and manual refresh at the click of a button. Each article entry includes a **popularity metric**, making it easy to track trending news.

## 📌 Features

- 🔄 **Auto-Sync**: Automatically fetches news at custom time intervals (in minutes).
- 🔘 **Manual Refresh**: Instantly update your feed using a custom menu or sidebar button.
- 📈 **Popularity Tracking**: Includes popularity metrics for each article.
- 📋 **Clean Output**: News articles are neatly stored in a Google Sheet with structured data.

## 📁 Folder Structure

Google-Apps-Script-RSS-Aggregator/
├── code.gs # Main script logic (RSS fetch, sync, scheduling)
├── LICENSE
└── README.md


## 🚀 Getting Started

### 1. **Clone or Open the Script**
- Visit the [Google Apps Script Editor](https://script.google.com/)
- Create a new project and paste the contents of `code.gs` and `UI.html`

### 2. **Setup Your Google Sheet**
- Create a Google Sheet to store the RSS data
- Link the script to the Sheet (via `Extensions → Apps Script`)

### 3. **Configure RSS Feeds**
- In the script, add your list of RSS feed URLs inside a `feedList` array

```js
const feedList = [
  "https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml",
  "https://www.reddit.com/r/worldnews/.rss",
  // Add more feeds here
];
