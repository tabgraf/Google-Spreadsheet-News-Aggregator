
# 📰 Google Apps Script RSS Feed Aggregator

This Google Apps Script application helps you **aggregate news articles from multiple RSS feeds** and automatically store them in a **Google Sheet**. It offers options for both automatic syncing at a specified interval and manual refresh at the click of a button. Each article entry includes a **popularity metric**, making it easy to track trending news.

## 📌 Features

- 🔄 **Auto-Sync**: Automatically fetches news at custom time intervals (in minutes).
- 🔘 **Manual Refresh**: Instantly update your feed using a custom menu or sidebar button.
- 📈 **Popularity Tracking**: Includes popularity metrics for each article.
- 📋 **Clean Output**: News articles are neatly stored in a Google Sheet with structured data.

## 📁 Folder Structure
```
Google-Apps-Script-RSS-Aggregator/
├── code.gs # Main script logic (RSS fetch, sync, scheduling)
├── LICENSE
└── README.md
```

## 🚀 Getting Started

### 1. **Clone or Open the Script**
- Visit the [Google Apps Script Editor](https://script.google.com/)
- Create a new project and paste the contents of `code.gs`.

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

4. Set Auto-Sync Timer
Go to Triggers in the Apps Script UI

Set up a time-driven trigger for fetchRSSFeeds at your desired interval (e.g., every 10 minutes)

5. Manual Refresh Option
Use the custom menu or sidebar button (if included in your UI) to manually trigger the refresh

🔐 Permissions
This script may ask for permission to:

Access your spreadsheet

Connect to external services (to fetch RSS data)

If you're comfortable, grant permissions, or clone and deploy it within your system.

📄 License
MIT License. See LICENSE file for details.

🛠️ Customization Tips
Add filtering options (e.g., by keyword, date, popularity)

Integrate charts or dashboards to visualize trends

Support email/Slack notifications for popular articles
