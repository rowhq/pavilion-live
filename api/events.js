// Vercel Serverless Function to serve events
import { kv } from '@vercel/kv';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Try to get events from Vercel KV
    const cachedEvents = await kv.get('pavilion-events');
    
    if (cachedEvents) {
      return res.status(200).json({
        source: 'cache',
        lastUpdated: cachedEvents.lastUpdated,
        events: cachedEvents.events
      });
    }

    // If no cache, return fallback data
    const fallbackEvents = getFallbackEvents();
    
    return res.status(200).json({
      source: 'fallback',
      lastUpdated: new Date().toISOString(),
      events: fallbackEvents
    });

  } catch (error) {
    console.error('Error fetching events:', error);
    
    // Return fallback data on error
    return res.status(200).json({
      source: 'fallback',
      lastUpdated: new Date().toISOString(),
      events: getFallbackEvents()
    });
  }
}

function getFallbackEvents() {
  return [
    {
      id: '3A006132D7DB5895',
      name: '"Weird Al" Yankovic: Bigger & Weirder 2025 Tour',
      date: '2025-08-01T20:00:00',
      artist: '"Weird Al" Yankovic',
      genre: 'Comedy',
      url: 'https://www.ticketmaster.com/event/3A006132D7DB5895'
    },
    {
      id: '3A0062AFB5E23EBB',
      name: 'Falling In Reverse: God Is A Weapon Tour',
      date: '2025-08-14T18:15:00',
      artist: 'Falling In Reverse',
      genre: 'Rock',
      url: 'https://www.ticketmaster.com/event/3A0062AFB5E23EBB'
    },
    {
      id: '3A006231E6515041',
      name: 'Jason Aldean: Full Throttle Tour 2025',
      date: '2025-08-15T19:30:00',
      artist: 'Jason Aldean',
      genre: 'Country',
      url: 'https://www.ticketmaster.com/event/3A006231E6515041'
    },
    {
      id: '3A006252AD863971',
      name: 'Big Time Rush: In Real Life Worldwide',
      date: '2025-08-17T19:00:00',
      artist: 'Big Time Rush',
      genre: 'Pop',
      url: 'https://www.ticketmaster.com/event/3A006252AD863971'
    },
    {
      id: '3A006259DC044577',
      name: 'The Offspring: SUPERCHARGED Worldwide in \'25',
      date: '2025-08-23T19:00:00',
      artist: 'The Offspring',
      genre: 'Rock',
      url: 'https://www.ticketmaster.com/event/3A006259DC044577'
    }
  ];
}