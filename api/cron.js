// Vercel Cron Job to fetch and cache events
import { kv } from '@vercel/kv';
import fetch from 'node-fetch';

export default async function handler(req, res) {
  // Verify cron secret to prevent unauthorized calls
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    console.log('Starting event fetch cron job...');
    
    // Fetch events from Ticketmaster
    const events = await fetchTicketmasterEvents();
    
    // Store in Vercel KV with 24 hour expiration
    await kv.set('pavilion-events', {
      lastUpdated: new Date().toISOString(),
      events: events
    }, {
      ex: 86400 // 24 hours in seconds
    });
    
    console.log(`Successfully cached ${events.length} events`);
    
    return res.status(200).json({
      success: true,
      message: `Cached ${events.length} events`,
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    console.error('Cron job error:', error);
    return res.status(500).json({
      error: 'Failed to update events',
      message: error.message
    });
  }
}

async function fetchTicketmasterEvents() {
  const allEvents = [];
  const venueUrl = 'https://www.ticketmaster.com/the-cynthia-woods-mitchell-pavilion-sponsored-tickets-the-woodlands/venue/475245';
  
  try {
    // Fetch the venue page
    const response = await fetch(venueUrl);
    const html = await response.text();
    
    // Extract JSON-LD data
    const jsonLdMatches = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g);
    
    if (jsonLdMatches) {
      jsonLdMatches.forEach(match => {
        try {
          const jsonStr = match.replace(/<script type="application\/ld\+json">|<\/script>/g, '');
          const data = JSON.parse(jsonStr);
          
          if (Array.isArray(data)) {
            data.forEach(event => {
              if (event['@type'] && event['@type'].includes('Event')) {
                const processedEvent = processEvent(event);
                if (!allEvents.find(e => e.id === processedEvent.id)) {
                  allEvents.push(processedEvent);
                }
              }
            });
          }
        } catch (e) {
          // Skip invalid JSON
        }
      });
    }
    
    // Sort by date
    allEvents.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    return allEvents;
    
  } catch (error) {
    console.error('Error fetching Ticketmaster events:', error);
    throw error;
  }
}

function processEvent(event) {
  const eventDate = new Date(event.startDate);
  const artist = extractArtist(event);
  const genre = guessGenre(artist, event.name);
  
  return {
    id: event.url?.split('/').pop() || generateId(),
    name: event.name,
    date: event.startDate,
    artist: artist,
    genre: genre,
    url: event.url,
    description: event.description,
    venue: event.location?.name || 'The Cynthia Woods Mitchell Pavilion',
    address: event.location?.address || '2005 Lake Robbins Dr, The Woodlands, TX 77380',
    eventType: event['@type'],
    status: event.eventStatus,
    availability: event.offers?.availability
  };
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
    'Rock': ['rock', 'alternative', 'punk', 'metal', 'judas priest', 'alice cooper', 'offspring', 'falling in reverse'],
    'Country': ['country', 'aldean', 'mccollum', 'whiskey myers', 'lainey wilson', 'keith urban'],
    'Hip Hop': ['hip hop', 'rap', 'nelly', 'ja rule', 'lil wayne', 'thuggish'],
    'Pop': ['pop', 'big time rush'],
    'Comedy': ['weird al', 'yankovic', 'comedy'],
    'Family': ['kidz bop', 'kids', 'family'],
    'R&B': ['r&b', 'r & b', 'cookout', 'charlie', 'leon bridges'],
    'Folk': ['lumineers', 'folk'],
    'Regional Mexican': ['junior h', 'mexican'],
    'Alternative': ['day to remember', 'yellowcard']
  };
  
  for (const [genre, keywords] of Object.entries(genreMap)) {
    if (keywords.some(keyword => text.includes(keyword))) {
      return genre;
    }
  }
  
  return 'Rock';
}

function generateId() {
  return 'event-' + Math.random().toString(36).substr(2, 9);
}