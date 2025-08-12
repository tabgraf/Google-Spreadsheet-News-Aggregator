// --- Constants ---
// Name of the sheet containing the RSS feed URLs
const RSS_FEEDS_SHEET_NAME = 'RSS Feeds';

// Name of the sheet to display the news
const NEWS_SHEET_NAME = 'News Dashboard';

// Maximum number of RSS feeds to process from the sheet
const MAX_FEEDS = 50;

// User property key for storing the auto-refresh interval
const AUTO_REFRESH_INTERVAL_KEY = 'autoRefreshIntervalMinutes';

// Default auto-refresh interval in minutes if not set
const DEFAULT_AUTO_REFRESH_INTERVAL = 5; // Keeping the previous default of 5 minutes

// Similarity threshold for grouping news titles (percentage)
const SIMILARITY_THRESHOLD = 50; // Changed similarity threshold to 50%

// Background colors for repeated news based on count
const REPEAT_COLORS = {
  LOW: '#ffcbd1',    // Light red for lower counts
  MEDIUM: '#f69697', // Medium red for medium counts
  HIGH: '#ee6b6e'    // Dark red for higher counts
};

// Thresholds for applying repeat colors
const REPEAT_THRESHOLDS = {
  MEDIUM: 4, // Apply MEDIUM color for count >= 4
  HIGH: 6    // Apply HIGH color for count >= 6
};


// --- Functions ---

/**
 * Creates a custom menu in the Google Sheet UI.
 * This function runs automatically when the spreadsheet is opened.
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('Echo Feeds')
      .addItem('Run Once', 'runUpdateOnce')
      .addItem('Setup Auto refresh timing', 'setupAutoRefreshTiming')
      .addToUi();
}

/**
 * Wrapper function to run the news update manually.
 * Called from the custom menu.
 */
function runUpdateOnce() {
  updateNewsSheet();
}


/**
 * Prompts the user to set the auto-refresh interval in minutes
 * and stores the value in User Properties.
 */
function setupAutoRefreshTiming() {
  const ui = SpreadsheetApp.getUi();
  const userProperties = PropertiesService.getUserProperties();

  // Get the previously saved interval, or use the default
  const savedInterval = userProperties.getProperty(AUTO_REFRESH_INTERVAL_KEY);
  const defaultPromptValue = savedInterval ? savedInterval : DEFAULT_AUTO_REFRESH_INTERVAL;

  const response = ui.prompt(
      'Setup Auto Refresh Timing',
      `Enter the auto refresh interval in minutes (current: ${defaultPromptValue}):`,
      ui.ButtonSet.OK_CANCEL);

  // Process the user's response
  if (response.getSelectedButton() == ui.Button.OK) {
    const interval = parseInt(response.getResponseText());
    if (!isNaN(interval) && interval > 0) {
      userProperties.setProperty(AUTO_REFRESH_INTERVAL_KEY, interval.toString());
      ui.alert(`Auto refresh interval set to ${interval} minutes.`);
      // Recreate the trigger with the new interval
      createTimeDrivenTrigger();
    } else {
      ui.alert('Invalid input. Please enter a positive number for the interval.');
    }
  } else {
    ui.alert('Auto refresh setup cancelled.');
  }
}


/**
 * Reads RSS feed URLs from the specified sheet.
 * Assumes the URLs are in the first column of the sheet, starting from the second row (skipping header).
 * Limits the number of feeds read to MAX_FEEDS.
 * @returns {Array<string>} An array of RSS feed URLs.
 */
function getRssFeedUrls() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = spreadsheet.getSheetByName(RSS_FEEDS_SHEET_NAME);

  if (!sheet) {
    Logger.log(`Error: Sheet "${RSS_FEEDS_SHEET_NAME}" not found.`);
    return []; // Return empty array if sheet doesn't exist
  }

  // Get the last row with content
  const lastRow = sheet.getLastRow();

  // If there's only a header row or no data, return empty array
  if (lastRow < 2) {
      Logger.log(`Sheet "${RSS_FEEDS_SHEET_NAME}" is empty or only contains a header.`);
      return [];
  }

  // Get all data from the first column, starting from the second row (A2)
  const range = sheet.getRange('A2:A' + lastRow);
  const values = range.getValues();

  const feedUrls = [];
  for (let i = 0; i < values.length; i++) {
    const url = values[i][0];
    if (url && typeof url === 'string' && url.startsWith('http')) {
      feedUrls.push(url.trim());
      // Stop reading if MAX_FEEDS is reached
      if (feedUrls.length >= MAX_FEEDS) {
        Logger.log(`Warning: Reached maximum of ${MAX_FEEDS} feeds. Skipping remaining URLs.`);
        break;
      }
    }
  }
  Logger.log(`Read ${feedUrls.length} valid feed URLs from "${RSS_FEEDS_SHEET_NAME}".`);
  return feedUrls;
}


/**
 * Attempts to extract an image URL from an RSS/Atom feed item.
 * This function looks for common tags like media:content, enclosure, or img tags in description/content.
 * @param {XmlService.Element} item The XML element for a news item (item or entry).
 * @param {XmlService.Namespace} atomNamespace The Atom namespace if applicable.
 * @returns {string|null} The extracted image URL or null if none is found.
 */
function extractImageUrl(item, atomNamespace) {
  let imageUrl = null;

  try {
    // 1. Check for media:content tag (common for media RSS)
    const mediaNamespace = XmlService.getNamespace('http://search.yahoo.com/mrss/');
    const mediaContent = item.getChild('content', mediaNamespace);
    if (mediaContent) {
      const urlAttribute = mediaContent.getAttribute('url');
      if (urlAttribute) {
        imageUrl = urlAttribute.getValue();
        // Logger.log(`Found media:content URL: ${imageUrl}`); // Log only if needed for debugging
        return imageUrl; // Return the first one found
      }
    }

    // 2. Check for enclosure tag (common in standard RSS)
    const enclosure = item.getChild('enclosure');
    if (enclosure) {
      const urlAttribute = enclosure.getAttribute('url');
      if (urlAttribute) {
        imageUrl = urlAttribute.getValue();
         // Logger.log(`Found enclosure URL: ${imageUrl}`); // Log only if needed for debugging
        return imageUrl; // Return the first one found
      }
    }

    // 3. Check within description or content tags for <img> tags
    const descriptionElement = item.getChild('description');
    const contentElement = item.getChild('content', atomNamespace); // Check content for Atom feeds

    if (descriptionElement) {
      const description = descriptionElement.getText();
      // Simple regex to find the first img src
      const imgMatch = description.match(/<img[^>]+src="([^">]+)"/);
      if (imgMatch && imgMatch[1]) {
        imageUrl = imgMatch[1];
         // Logger.log(`Found img tag in description URL: ${imageUrl}`); // Log only if needed for debugging
        return imageUrl; // Return the first one found
      }
    }

     if (contentElement) {
      const content = contentElement.getText();
      // Simple regex to find the first img src
      const imgMatch = content.match(/<img[^>]+src="([^">]+)"/);
      if (imgMatch && imgMatch[1]) {
        imageUrl = imgMatch[1];
         // Logger.log(`Found img tag in content URL: ${imageUrl}`); // Log only if needed for debugging
        return imageUrl; // Return the first one found
      }
    }


  } catch (e) {
    Logger.log(`Error extracting image URL: ${e}`);
  }

  return imageUrl; // Return null if no image URL was found
}


/**
 * Fetches and parses an RSS feed from a given URL.
 * @param {string} feedUrl The URL of the RSS feed.
 * @returns {Array<Object>} An array of news items, each with title, link, description,
 * publication date, source, and imageUrl. Returns an empty array on error.
 */
function fetchRssFeed(feedUrl) {
  const newsItems = [];
  try {
    const response = UrlFetchApp.fetch(feedUrl);
    const xmlContent = response.getContentText();
    const document = XmlService.parse(xmlContent);
    const root = document.getRootElement();
    // Handle both RSS (channel/item) and Atom (feed/entry) formats
    const channel = root.getChild('channel');
    const atomNamespace = XmlService.getNamespace('http://www.w3.org/2005/Atom');
    const feed = root.getChild('feed', atomNamespace); // Atom namespace

    let items = [];
    if (channel) {
      items = channel.getChildren('item');
    } else if (feed) {
      items = feed.getChildren('entry', atomNamespace);
    } else {
      Logger.log(`Could not find channel or feed element in ${feedUrl}`);
      return newsItems; // Return empty array if format is not recognized
    }


    items.forEach(item => {
      try {
        let titleElement, linkElement, descriptionElement, pubDateElement;

        if (channel) { // RSS format
          titleElement = item.getChild('title');
          linkElement = item.getChild('link');
          descriptionElement = item.getChild('description');
          pubDateElement = item.getChild('pubDate');
        } else if (feed) { // Atom format
           titleElement = item.getChild('title', atomNamespace);
           linkElement = item.getChild('link', atomNamespace);
           // For Atom, summary or content is often used instead of description
           descriptionElement = item.getChild('summary', atomNamespace) || item.getChild('content', atomNamespace);
           pubDateElement = item.getChild('published', atomNamespace) || item.getChild('updated', atomNamespace);
           // Atom links can be more complex, try to get the href attribute
           if (linkElement) {
             const linkHref = linkElement.getAttribute('href');
             if (linkHref) {
               linkElement = { getText: () => linkHref.getValue() }; // Create a mock element with getText
             } else {
               linkElement = null; // No href found
             }
           }
        }


        // Basic check if required elements exist
        if (titleElement && linkElement) {
          let pubDate = null;
          if (pubDateElement) {
            try {
               pubDate = new Date(pubDateElement.getText());
               // Check if date is valid
               if (isNaN(pubDate.getTime())) {
                 pubDate = null; // Invalid date
               }
            } catch (dateError) {
               Logger.log(`Could not parse date "${pubDateElement.getText()}" from ${feedUrl}: ${dateError}`);
               pubDate = null;
            }
          }

          // Extract image URL
          const imageUrl = extractImageUrl(item, atomNamespace);

          // Get description, strip HTML tags, replace multiple spaces, and trim whitespace
          let descriptionText = 'No description available';
          if (descriptionElement) {
            descriptionText = descriptionElement.getText()
                                .replace(/<[^>]*>/g, '') // Strip HTML tags
                                .replace(/\s+/g, ' ') // Replace multiple whitespace characters with a single space
                                .trim(); // Trim leading/trailing whitespace
          }


          newsItems.push({
            title: titleElement.getText(),
            link: linkElement.getText(), // Keep the link internally
            description: descriptionText, // Use the cleaned description
            pubDate: pubDate,
            source: feedUrl, // Keep the source feed URL internally for reference if needed
            imageUrl: imageUrl // Add the extracted image URL
          });
        } else {
             Logger.log(`Missing title or link in item from ${feedUrl}`);
        }
      } catch (e) {
        Logger.log(`Error processing item from ${feedUrl}: ${e}`);
      }
    });
  } catch (e) {
     Logger.log(`Error fetching or parsing feed ${feedUrl}: ${e}`);
  }
  return newsItems;
}

/**
 * Calculates the relative time string from a given date.
 * @param {Date} date The date to calculate the relative time from.
 * @returns {string} A string representing the time ago (e.g., "5 minutes ago", "2 hours ago").
 */
function getRelativeTime(date) {
  if (!date) return 'Date not available';

  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);

  if (seconds < 60) {
    return seconds <= 1 ? 'just now' : seconds + ' seconds ago';
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    return minutes === 1 ? '1 minute ago' : minutes + ' minutes ago';
  } else if (seconds < 86400) {
    const hours = Math.floor(seconds / 3600);
    return hours === 1 ? '1 hour ago' : hours + ' hours ago';
  } else if (seconds < 2592000) { // Approx 30 days
    const days = Math.floor(seconds / 86400);
    return days === 1 ? '1 day ago' : days + ' days ago';
  } else if (seconds < 31536000) { // Approx 365 days
    const months = Math.floor(seconds / 2592000);
    return months === 1 ? '1 month ago' : months + ' months ago';
  } else {
    const years = Math.floor(seconds / 31536000);
    return years === 1 ? '1 year ago' : years + ' years ago';
  }
}


/**
 * Interpolates between two colors based on a value between 0 and 1.
 * @param {string} color1 Hex code for the start color (e.g., '#RRGGBB').
 * @param {string} color2 Hex code for the end color (e.g., '#RRGGBB').
 * @param {number} factor Interpolation factor (0 to 1).
 * @returns {string} The interpolated color as a hex code.
 */
function interpolateColor(color1, color2, factor) {
  const result = color1.slice(1).match(/.{2}/g).map((hex, i) => {
    const c1 = parseInt(hex, 16);
    const c2 = parseInt(color2.slice(1).match(/.{2}/g)[i], 16);
    const c = Math.round(c1 + factor * (c2 - c1));
    return c.toString(16).padStart(2, '0');
  });
  return '#' + result.join('');
}

/**
 * Calculates the word similarity percentage between two strings (considering title and description).
 * @param {Object} item1 The first news item object.
 * @param {Object} item2 The second news item object.
 * @returns {number} The similarity percentage (0-100).
 */
function calculateSimilarity(item1, item2) {
  // Combine title and description for similarity comparison
  const text1 = `${item1.title} ${item1.description}`;
  const text2 = `${item2.title} ${item2.description}`;

  // Convert to lowercase, remove punctuation, replace multiple spaces, and trim
  const cleanText = (text) => text.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"").replace(/\s+/g, ' ').trim();

  const cleanedText1 = cleanText(text1);
  const cleanedText2 = cleanText(text2);

  if (cleanedText1 === "" || cleanedText2 === "") {
    return 0; // Cannot compare empty strings
  }

  const words1 = cleanedText1.split(' ');
  const words2 = cleanedText2.split(' ');

  const set1 = new Set(words1);
  const set2 = new Set(words2);

  // Find intersection of words
  const intersection = new Set([...set1].filter(word => set2.has(word)));

  // Calculate similarity percentage using the size of the smaller set as the denominator
  const smallerSize = Math.min(set1.size, set2.size);
  if (smallerSize === 0) {
      return 0;
  }
  const similarity = (intersection.size / smallerSize) * 100;

  return similarity;
}


/**
 * Main function to fetch, process, and display news in the Google Sheet.
 */
function updateNewsSheet() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName(NEWS_SHEET_NAME);

  // Create the sheet if it doesn't exist
  if (!sheet) {
    sheet = spreadsheet.insertSheet(NEWS_SHEET_NAME);
  }

  // Get RSS feed URLs from the specified sheet
  const rssFeedUrls = getRssFeedUrls();

  if (rssFeedUrls.length === 0) {
      Logger.log("No valid RSS feed URLs found in the 'RSS Feeds' sheet.");
      // Optionally add a message to the sheet
      sheet.getRange('A1').setValue("No valid RSS feed URLs found in the 'RSS Feeds' sheet.");
      // Clear content, notes, and backgrounds here if no feeds are found
      sheet.clearContents();
      sheet.clearNotes();
      const lastRow = sheet.getLastRow();
      if (lastRow >= 2) {
           sheet.getRange(2, 1, lastRow - 1, 13).setBackground(null);
      }
      return; // Exit if no feeds are found
  }


  // Fetch news from all feeds
  const allNews = rssFeedUrls.map(feedUrl => fetchRssFeed(feedUrl));

  // Flatten the array of arrays into a single array of all news items
  const flattenedNews = allNews.flat();

  // Group news items based on similarity
  // Store all items in the group for later access to their links
  const groupedNews = []; // Array of { representativeItem: item, count: N, latestItem: item, allItems: [...] }

  flattenedNews.forEach(currentItem => {
    let foundGroup = false;
    for (let i = 0; i < groupedNews.length; i++) {
      const group = groupedNews[i];
      // Use the modified calculateSimilarity function that takes item objects
      const similarity = calculateSimilarity(currentItem, group.representativeItem);

      // Log similarity for debugging
      // Logger.log(`Comparing "${currentItem.title}" and "${group.representativeItem.title}": Similarity = ${similarity.toFixed(2)}%`);


      if (similarity >= SIMILARITY_THRESHOLD) {
        group.count++; // Increment count for the group
        group.allItems.push(currentItem); // Add the current item to the group's items
        // Update the latest item in the group if the current item is newer
        if (!group.latestItem.pubDate || (currentItem.pubDate && currentItem.pubDate > group.latestItem.pubDate)) {
          group.latestItem = currentItem;
        }
        foundGroup = true;
        break; // Found a group for this item, move to the next flattenedNews item
      }
    }

    // If no similar group was found, create a new group
    if (!foundGroup) {
      groupedNews.push({
        representativeItem: currentItem,
        count: 1,
        latestItem: currentItem,
        allItems: [currentItem] // Initialize with the current item
      });
    }
  });

  // Create an array of news items to display from the grouped news
  // Include allItems for accessing links later
  const displayedNews = groupedNews.map(group => ({
      ...group.latestItem, // Use the latest item's details for display
      repeatCount: group.count, // Add the total repeat count from the group
      isCommon: group.count > 1, // Mark as common if count > 1
      allItems: group.allItems // Include all items in the group
  }));

  // Calculate max repeat count for formatting (only for repeated news)
  let maxRepeatCount = 0;
   displayedNews.filter(item => item.isCommon).forEach(item => {
      maxRepeatCount = Math.max(maxRepeatCount, item.repeatCount);
  });


  // Sort displayed news by publication date (latest first)
  // Items without a date are placed at the end (treated as older)
  displayedNews.sort((a, b) => (b.pubDate ? b.pubDate.getTime() : 0) - (a.pubDate ? a.pubDate.getTime() : 0));

  // Separate repeated and unique news after sorting
  const repeatedNews = displayedNews.filter(item => item.isCommon);
  const uniqueNews = displayedNews.filter(item => !item.isCommon);


  // Prepare data for the sheet in side-by-side format
  const headerRow = ['Title', 'Description', 'Source', 'Time Ago', 'Count', 'Image', '', 'Title', 'Description', 'Source', 'Time Ago', 'Count', 'Image'];
  const numColumns = headerRow.length; // Total columns needed

  // Determine the maximum number of rows needed based on the larger group
  const maxDataRows = Math.max(repeatedNews.length, uniqueNews.length);


  // Initialize data array with empty cells
  const data = Array(maxDataRows).fill(0).map(() => Array(numColumns).fill(''));

  // Populate the data array: repeated news on the left, unique on the right
  for (let i = 0; i < maxDataRows; i++) {
      // Populate left side with repeated news
      if (i < repeatedNews.length) {
          const item = repeatedNews[i];
          data[i][0] = item.title;
          data[i][1] = item.description;
          data[i][2] = item.link; // Use the article link
          data[i][3] = getRelativeTime(item.pubDate);
          data[i][4] = item.repeatCount; // Count column
          data[i][5] = item.imageUrl ? `=IMAGE("${item.imageUrl}")` : ''; // Image column
      }

      // Populate right side with unique news
      if (i < uniqueNews.length) {
          const item = uniqueNews[i];
          data[i][7] = item.title;
          data[i][8] = item.description;
          data[i][9] = item.link; // Use the article link
          data[i][10] = getRelativeTime(item.pubDate);
          data[i][11] = item.repeatCount; // Count column (will always be 1 for unique news)
          data[i][12] = item.imageUrl ? `=IMAGE("${item.imageUrl}")` : ''; // Image column
      }
  }

  // Clear existing content, notes, and background colors just before writing the new data
  sheet.clearContents();
  sheet.clearNotes();
  // Clear background colors for the potential data range (from row 2 to last row, columns A to M)
  // Get the last row *before* clearing content
  const lastRowBeforeClear = sheet.getLastRow();
  if (lastRowBeforeClear >= 2) { // Only clear if there was data beyond the header before clearing content
       sheet.getRange(2, 1, lastRowBeforeClear - 1, 13).setBackground(null);
  }


  // Write header
  sheet.getRange(1, 1, 1, numColumns).setValues([headerRow]);

  // Write data
  if (data.length > 0) {
    sheet.getRange(2, 1, data.length, numColumns).setValues(data);

    // Apply background color to the repeated news rows (columns A-F)
    // And add notes with other source links to the Count column (E)
    for (let i = 0; i < repeatedNews.length; i++) {
        const item = repeatedNews[i];
        const repeatCount = item.repeatCount; // This will always be > 1 for repeatedNews

        const sheetRow = i + 2; // 1-indexed row in the sheet
        const countCol = 5; // Column E (5) - 1-indexed in sheet

        // Determine background color based on repeat count
        let backgroundColor = REPEAT_COLORS.LOW; // Default to lowest color
        if (repeatCount >= REPEAT_THRESHOLDS.HIGH) {
            backgroundColor = REPEAT_COLORS.HIGH;
        } else if (repeatCount >= REPEAT_THRESHOLDS.MEDIUM) {
            backgroundColor = REPEAT_COLORS.MEDIUM;
        }


        // Apply background color to the entire row block (A-F)
        sheet.getRange(sheetRow, 1, 1, 6).setBackground(backgroundColor);

         // Set font color to white for darker backgrounds (High color)
        if (backgroundColor === REPEAT_COLORS.HIGH) {
             sheet.getRange(sheetRow, 1, 1, 6).setFontColor('#FFFFFF'); // White
        } else {
             sheet.getRange(sheetRow, 1, 1, 6).setFontColor(null); // Default font color
        }

        // Create the note with other source links
        const otherLinks = item.allItems
            .filter(otherItem => otherItem.link !== item.link) // Exclude the link already in the Source column
            .map(otherItem => otherItem.link); // Get just the links

        if (otherLinks.length > 0) {
            const noteText = "Other sources:\n" + otherLinks.join('\n');
            sheet.getRange(sheetRow, countCol).setNote(noteText);
        }
    }

    // For unique news (on the right), ensure no background color or notes
    // This loop is less critical now that we clear backgrounds just before writing,
    // but good for explicitly clearing notes on unique items.
    for (let i = 0; i < uniqueNews.length; i++) {
        const sheetRow = i + 2; // 1-indexed row in the sheet
        const countCol = 12; // Column L (12) - 1-indexed in sheet

        // Ensure no note is present for unique items
        sheet.getRange(sheetRow, countCol).clearNote();
    }
  }


  Logger.log('News sheet updated successfully.');
}

/**
 * Sets up a time-driven trigger to run updateNewsSheet based on the saved interval.
 * Deletes existing triggers for this function before creating a new one.
 * Run this function after setting the auto-refresh timing.
 */
function createTimeDrivenTrigger() {
  // Delete existing triggers for this function to avoid duplicates
  ScriptApp.getProjectTriggers().forEach(trigger => {
    if (trigger.getHandlerFunction() === 'updateNewsSheet') {
      ScriptApp.deleteTrigger(trigger);
    }
  });

  const userProperties = PropertiesService.getUserProperties();
  const interval = parseInt(userProperties.getProperty(AUTO_REFRESH_INTERVAL_KEY) || DEFAULT_AUTO_REFRESH_INTERVAL);

  // Create a new trigger that runs every 'interval' minutes
  ScriptApp.newTrigger('updateNewsSheet')
      .timeBased()
      .everyMinutes(interval)
      .create();

  Logger.log(`Time-driven trigger created for updateNewsSheet to run every ${interval} minutes.`);
}

/**
 * Deletes all triggers associated with this script.
 * Run this function if you need to remove the trigger.
 */
function deleteAllTriggers() {
  ScriptApp.getProjectTriggers().forEach(trigger => {
    ScriptApp.deleteTrigger(trigger);
  });
  Logger.log('All triggers deleted.');
}
