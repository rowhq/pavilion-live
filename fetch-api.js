// Script to test the visitthewoodlands.com API
const fetch = require('node-fetch');

async function fetchEvents() {
    // First, let's try to get a simple token
    try {
        // Try the API endpoint we found
        const filter = {
            date_range: {
                start: new Date().toISOString(),
                end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
            }
        };
        
        const options = {
            limit: 50,
            sort: { date: 1, rank: 1, title_sort: 1 }
        };
        
        const url = 'https://www.visitthewoodlands.com/includes/rest_v2/plugins_events_events_by_date/find/';
        const params = new URLSearchParams({
            json: JSON.stringify({ filter, options }),
            token: 'simpleToken' // This might need to be generated
        });
        
        console.log('Fetching from:', url);
        console.log('With params:', params.toString());
        
        const response = await fetch(`${url}?${params}`, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'application/json',
                'Referer': 'https://www.visitthewoodlands.com/events/cynthia-woods-mitchell-pavilion/'
            }
        });
        
        console.log('Status:', response.status);
        const text = await response.text();
        console.log('Response:', text.substring(0, 500));
        
        if (response.ok) {
            const data = JSON.parse(text);
            console.log('Success! Found events:', data);
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

fetchEvents();