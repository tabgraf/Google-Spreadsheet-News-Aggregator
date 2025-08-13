
# 📰 Google Apps Script RSS Feed Aggregator

This Google Apps Script application helps you **aggregate news articles from multiple RSS feeds** and automatically store them in a **Google Sheet**. It offers options for both automatic syncing at a specified interval and manual refresh at the click of a button. Each article entry includes a **popularity metric**, making it easy to track trending news.

## 📌 Features

- 🔄 **Auto-Sync**: Automatically fetches news at custom time intervals (in minutes).
- 🔘 **Manual Refresh**: Instantly update your feed using a custom menu or sidebar button.
- 📈 **Popularity Tracking**: Includes popularity metrics for each article.
- 📋 **Clean Output**: News articles are neatly stored in a Google Sheet with structured data.
<img width="1513" height="676" alt="news-aggregator" src="https://github.com/user-attachments/assets/3545df03-b29c-4bb1-847e-f083370b4efb" />


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

### OR

1. Open the following Google Sheet:  
   [Click here to open](https://docs.google.com/spreadsheets/d/1fNpB8YqhQ-FhLeih76sRynfJ4DQ9wWDreKtHkk1H4cw/edit?gid=987882469#gid=987882469)

2. Go to **File → Make a copy**.

3. Save it to your own Google Drive.  
   This will create your own copy of the News Aggregator sheet along with its Google Apps Script code.


### 2. **Setup Your Google Sheet**
- Create a Google Sheet to store the RSS data
- Link the script to the Sheet (via `Extensions → Apps Script`)

### 3. Adding RSS Feed Links

In the spreadsheet, there’s a tab named **`RSS Feeds`**.  
Add all the RSS feed URLs in this tab from which you want the news to be aggregated.  

**Example:**

| RSS |
|----------|
| https://example.com/rss |
| https://news.example.com/feed |
| https://another-site.com/rss.xml |

### 4. Setting Up Auto Refresh

1. In the spreadsheet, go to **`News Aggregator`** in the menu bar.  
2. Click **`Setup Auto Refresh Timing`**.  
3. This will create a time-driven trigger using `createTimeDrivenTrigger` to refresh news at your chosen interval.


### 5. Manual Refresh

If you want to refresh the news manually:  

1. In the spreadsheet, go to **`News Aggregator`** in the menu bar.  
2. Click **`Run Once`**.  

This will execute `runUpdateOnce`, updating the sheet with the latest feed items.

## 🔐 Permissions
This script may ask for permission to:

Access your spreadsheet

Connect to external services (to fetch RSS data)

If you're comfortable, grant permissions, or clone and deploy it within your system.

## 📄 License
MIT License. See LICENSE file for details.

---

### 💼 Hire Us

Need a custom solution using **Google Apps Script** for your workflow or automation needs?

📬 **Email us:** [support@tabgraf.com](mailto:support@tabgraf.com)  
🌐 **Website:** [https://tabgraf.com](https://tabgraf.com)

---
