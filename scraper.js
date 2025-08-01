// Node.js scraper to get events from visitthewoodlands.com
const fetch = require('node-fetch');

async function scrapeVisitTheWoodlands() {
    try {
        console.log('Fetching events from visitthewoodlands.com...');
        
        // The page uses AJAX to load events, so we need to find the actual API call
        const baseUrl = 'https://www.visitthewoodlands.com';
        
        // Try various endpoints that might work
        const endpoints = [
            '/plugins/events/events/ajax?skip=0&take=50&filter=%7B%7D',
            '/api/events/search?venue=pavilion',
            '/events/cynthia-woods-mitchell-pavilion/feed',
            '/includes/rest_v2/plugins_events_events_by_date/find/'
        ];
        
        for (const endpoint of endpoints) {
            try {
                const url = baseUrl + endpoint;
                console.log(`Trying: ${url}`);
                
                const response = await fetch(url, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                        'Accept': 'application/json, text/html',
                        'Referer': 'https://www.visitthewoodlands.com/events/cynthia-woods-mitchell-pavilion/',
                        'X-Requested-With': 'XMLHttpRequest'
                    }
                });
                
                if (response.ok) {
                    const contentType = response.headers.get('content-type');
                    if (contentType && contentType.includes('json')) {
                        const data = await response.json();
                        console.log('Success! Found JSON data:', data);
                        return data;
                    }
                }
            } catch (e) {
                console.log(`Failed on ${endpoint}:`, e.message);
            }
        }
        
        // If API endpoints don't work, try parsing the HTML
        console.log('API endpoints failed, trying HTML parsing...');
        const pageResponse = await fetch('https://www.visitthewoodlands.com/events/cynthia-woods-mitchell-pavilion/', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });
        
        const html = await pageResponse.text();
        
        // Look for structured data or JavaScript variables
        const scriptMatch = html.match(/var\s+events\s*=\s*(\[[\s\S]*?\]);/);
        if (scriptMatch) {
            const eventsData = JSON.parse(scriptMatch[1]);
            console.log('Found events in page script:', eventsData);
            return eventsData;
        }
        
        console.log('Could not find event data');
        return null;
        
    } catch (error) {
        console.error('Scraping error:', error);
        return null;
    }
}

// Run the scraper
scrapeVisitTheWoodlands();