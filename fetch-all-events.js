// Script to fetch ALL events from Ticketmaster
const fetch = require('node-fetch');
const fs = require('fs');

async function fetchAllEvents() {
    console.log('Fetching ALL events from Ticketmaster...');
    
    const allEvents = [];
    let page = 0;
    let hasMore = true;
    
    while (hasMore && page < 10) { // Safety limit
        try {
            const url = `https://www.ticketmaster.com/the-cynthia-woods-mitchell-pavilion-sponsored-tickets-the-woodlands/venue/475245?page=${page}`;
            console.log(`Fetching page ${page}...`);
            
            const response = await fetch(url);
            const html = await response.text();
            
            // Extract all JSON-LD scripts
            const jsonLdMatches = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g);
            
            if (!jsonLdMatches || jsonLdMatches.length === 0) {
                console.log(`No more events on page ${page}`);
                hasMore = false;
                break;
            }
            
            // Parse each JSON-LD block
            jsonLdMatches.forEach(match => {
                try {
                    const jsonStr = match.replace(/<script type="application\/ld\+json">|<\/script>/g, '');
                    const data = JSON.parse(jsonStr);
                    
                    if (Array.isArray(data)) {
                        data.forEach(event => {
                            if (event['@type'] && event['@type'].includes('Event') && event.url) {
                                // Check if we already have this event
                                if (!allEvents.find(e => e.url === event.url)) {
                                    allEvents.push(event);
                                }
                            }
                        });
                    }
                } catch (e) {
                    // Skip invalid JSON
                }
            });
            
            // Check if there's a next page
            if (html.includes('rel="next"')) {
                page++;
            } else {
                hasMore = false;
            }
            
        } catch (error) {
            console.error(`Error fetching page ${page}:`, error);
            hasMore = false;
        }
    }
    
    console.log(`Found ${allEvents.length} total events!`);
    
    // Process and save
    const processedEvents = allEvents.map((event, index) => {
        const eventDate = new Date(event.startDate);
        const artist = extractArtist(event);
        
        return {
            id: event.url.split('/').pop() || `event-${index}`,
            name: event.name,
            date: event.startDate,
            artist: artist,
            genre: guessGenre(artist, event.name),
            url: event.url,
            description: event.description,
            eventType: event['@type'],
            venue: event.location?.name || 'The Cynthia Woods Mitchell Pavilion'
        };
    }).sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // Save full data
    fs.writeFileSync('./data/all-events.json', JSON.stringify(processedEvents, null, 2));
    console.log(`Saved ${processedEvents.length} events to all-events.json`);
    
    return processedEvents;
}

function extractArtist(event) {
    const name = event.name || '';
    
    const patterns = [
        /^([^:]+):/,
        /^([^-]+) -/,
        /^(.+?)\s+(?:with|w\/|feat\.|featuring)/i,
        /^(.+?)\s+(?:&|and)\s+/i
    ];
    
    for (const pattern of patterns) {
        const match = name.match(pattern);
        if (match) {
            return match[1].trim();
        }
    }
    
    return name;
}

function guessGenre(artist, eventName) {
    const text = `${artist} ${eventName}`.toLowerCase();
    
    const genreMap = {
        'Rock': ['rock', 'alternative', 'punk', 'metal', 'judas priest', 'alice cooper', 'offspring'],
        'Country': ['country', 'aldean', 'mccollum', 'whiskey myers', 'lainey wilson'],
        'Hip Hop': ['hip hop', 'rap', 'nelly', 'ja rule', 'lil wayne', 'thuggish'],
        'Pop': ['pop', 'big time rush'],
        'Comedy': ['weird al', 'yankovic', 'comedy'],
        'Family': ['kidz bop', 'kids', 'family'],
        'R&B': ['r&b', 'r & b', 'cookout', 'charlie'],
        'Folk': ['lumineers', 'folk'],
        'Regional Mexican': ['junior h', 'mexican'],
        'Alternative': ['falling in reverse', 'day to remember', 'yellowcard']
    };
    
    for (const [genre, keywords] of Object.entries(genreMap)) {
        if (keywords.some(keyword => text.includes(keyword))) {
            return genre;
        }
    }
    
    return 'Rock';
}

// Run it
fetchAllEvents();