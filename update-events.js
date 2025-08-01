// Script to update events data from multiple sources
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

// Configuration
const VENUE_ID = 'KovZpZAE6k6A'; // The Cynthia Woods Mitchell Pavilion
const TICKETMASTER_API = 'https://app.ticketmaster.com/discovery/v2/events.json';
const API_KEY = 'YOUR_API_KEY_HERE'; // You'll need to get this from Ticketmaster

async function fetchTicketmasterEvents() {
    try {
        console.log('Fetching from Ticketmaster Discovery API...');
        
        // For demo, we'll use the data we already scraped
        const demoEvents = [
            {
                name: '"Weird Al" Yankovic: Bigger & Weirder 2025 Tour',
                startDate: '2025-08-01T20:00:00',
                url: 'https://www.ticketmaster.com/event/3A006132D7DB5895',
                artist: '"Weird Al" Yankovic',
                genre: 'Comedy'
            },
            {
                name: 'Falling In Reverse: God Is A Weapon Tour',
                startDate: '2025-08-14T18:15:00',
                url: 'https://www.ticketmaster.com/event/3A0062AFB5E23EBB',
                artist: 'Falling In Reverse',
                genre: 'Rock'
            },
            {
                name: 'Jason Aldean: Full Throttle Tour 2025',
                startDate: '2025-08-15T19:30:00',
                url: 'https://www.ticketmaster.com/event/3A006231E6515041',
                artist: 'Jason Aldean',
                genre: 'Country'
            },
            {
                name: 'Big Time Rush: In Real Life Worldwide',
                startDate: '2025-08-17T19:00:00',
                url: 'https://www.ticketmaster.com/event/3A006252AD863971',
                artist: 'Big Time Rush',
                genre: 'Pop'
            },
            {
                name: 'The Offspring: SUPERCHARGED Worldwide in \'25',
                startDate: '2025-08-23T19:00:00',
                url: 'https://www.ticketmaster.com/event/3A006259DC044577',
                artist: 'The Offspring',
                genre: 'Rock'
            },
            {
                name: 'Nelly with Ja Rule & Special Guests: Where The Party At Tour',
                startDate: '2025-09-04T19:30:00',
                url: 'https://www.ticketmaster.com/event/3A006185A749284B',
                artist: 'Nelly',
                genre: 'Hip Hop'
            },
            {
                name: 'Parker McCollum Tour',
                startDate: '2025-09-06T19:30:00',
                url: 'https://www.ticketmaster.com/event/3A006288949A1BB2',
                artist: 'Parker McCollum',
                genre: 'Country'
            },
            {
                name: 'KIDZ BOP LIVE Certified BOP Tour',
                startDate: '2025-09-07T16:00:00',
                url: 'https://www.ticketmaster.com/event/3A006247E9A46D3E',
                artist: 'KIDZ BOP',
                genre: 'Family'
            },
            {
                name: 'Lil Wayne: Tha Carter VI Tour',
                startDate: '2025-09-18T19:00:00',
                url: 'https://www.ticketmaster.com/event/3A0062BF4F2C7363',
                artist: 'Lil Wayne',
                genre: 'Hip Hop'
            },
            {
                name: 'Lainey Wilson: Whirlwind World Tour',
                startDate: '2025-09-20T19:00:00',
                url: 'https://www.ticketmaster.com/event/3A00623EE55B71CD',
                artist: 'Lainey Wilson',
                genre: 'Country'
            },
            {
                name: 'The Crooner & The Cowboy: Leon Bridges with Charley Crockett',
                startDate: '2025-09-21T19:00:00',
                url: 'https://www.ticketmaster.com/event/3A006272D31F3C8E',
                artist: 'Leon Bridges',
                genre: 'Soul'
            },
            {
                name: 'A Day To Remember & Yellowcard - Maximum Fun Tour',
                startDate: '2025-09-23T18:15:00',
                url: 'https://www.ticketmaster.com/event/3A0062BF0DD073CA',
                artist: 'A Day To Remember',
                genre: 'Rock'
            },
            {
                name: 'Uncle Charlie\'s R & B Cookout',
                startDate: '2025-09-26T19:00:00',
                url: 'https://www.ticketmaster.com/event/3A006286C24759E2',
                artist: 'Charlie Wilson',
                genre: 'R&B'
            },
            {
                name: 'Whiskey Myers: WHAT WE WERE BORN TO DO TOUR',
                startDate: '2025-09-27T18:30:00',
                url: 'https://www.ticketmaster.com/event/3A006296AB343E3F',
                artist: 'Whiskey Myers',
                genre: 'Country'
            },
            {
                name: 'The Thuggish-Ruggish-Mafia Tour',
                startDate: '2025-09-28T19:30:00',
                url: 'https://www.ticketmaster.com/event/3A0062C64E1F6C2E',
                artist: 'Bone Thugs-N-Harmony',
                genre: 'Hip Hop'
            },
            {
                name: 'Junior H - $AD BOYZ LIVE & BROKEN TOUR',
                startDate: '2025-10-04T20:00:00',
                url: 'https://www.ticketmaster.com/event/3A0062F89D842B4A',
                artist: 'Junior H',
                genre: 'Regional Mexican'
            },
            {
                name: 'The Lumineers: The Automatic World Tour',
                startDate: '2025-10-10T19:30:00',
                url: 'https://www.ticketmaster.com/event/3A00624AD74F46E7',
                artist: 'The Lumineers',
                genre: 'Folk'
            },
            {
                name: 'Keith Urban: High and Alive World Tour',
                startDate: '2025-10-11T19:00:00',
                url: 'https://www.ticketmaster.com/event/3A006184AE133C25',
                artist: 'Keith Urban',
                genre: 'Country'
            },
            {
                name: 'Majic Under The Stars',
                startDate: '2025-10-25T18:00:00',
                url: 'https://www.ticketmaster.com/event/3A0062B7E35C5C77',
                artist: 'Various Artists',
                genre: 'R&B'
            },
            {
                name: 'Alice Cooper & Judas Priest Live',
                startDate: '2025-10-26T18:45:00',
                url: 'https://www.ticketmaster.com/event/3A00628AE4804057',
                artist: 'Alice Cooper',
                genre: 'Rock'
            }
        ];
        
        return demoEvents;
        
    } catch (error) {
        console.error('Failed to fetch from Ticketmaster:', error);
        return [];
    }
}

async function updateEventsData() {
    console.log('Updating events data...');
    
    // Fetch events
    const events = await fetchTicketmasterEvents();
    
    if (events.length === 0) {
        console.log('No events found');
        return;
    }
    
    // Process and enhance event data
    const processedEvents = events.map((event, index) => {
        const eventDate = new Date(event.startDate);
        
        return {
            id: event.url?.split('/').pop() || `event-${index}`,
            name: event.name,
            date: event.startDate,
            artist: event.artist,
            genre: event.genre,
            ticketUrl: event.url,
            venue: 'The Cynthia Woods Mitchell Pavilion',
            address: '2005 Lake Robbins Dr, The Woodlands, TX 77380',
            capacity: '16,500',
            weather: {
                typical: getTypicalWeather(eventDate.getMonth())
            },
            tips: getEventTips(event.genre),
            estimatedCosts: {
                tickets: getPriceRange(event.genre),
                parking: 20,
                concessions: 40
            }
        };
    });
    
    // Save to file
    const dataPath = path.join(__dirname, 'data', 'events.json');
    fs.mkdirSync(path.dirname(dataPath), { recursive: true });
    fs.writeFileSync(dataPath, JSON.stringify(processedEvents, null, 2));
    
    console.log(`Saved ${processedEvents.length} events to ${dataPath}`);
    
    // Also create a lightweight version for the app
    const lightEvents = processedEvents.map(e => ({
        id: e.id,
        name: e.name,
        date: e.date,
        artist: e.artist,
        genre: e.genre,
        url: e.ticketUrl
    }));
    
    fs.writeFileSync(
        path.join(__dirname, 'data', 'events-light.json'),
        JSON.stringify(lightEvents, null, 2)
    );
}

function getTypicalWeather(month) {
    const weather = {
        0: { temp: 55, condition: 'Cool' },
        1: { temp: 58, condition: 'Cool' },
        2: { temp: 65, condition: 'Mild' },
        3: { temp: 72, condition: 'Pleasant' },
        4: { temp: 79, condition: 'Warm' },
        5: { temp: 85, condition: 'Hot' },
        6: { temp: 89, condition: 'Hot' },
        7: { temp: 90, condition: 'Hot' },
        8: { temp: 86, condition: 'Hot' },
        9: { temp: 78, condition: 'Pleasant' },
        10: { temp: 68, condition: 'Mild' },
        11: { temp: 58, condition: 'Cool' }
    };
    
    return weather[month] || { temp: 75, condition: 'Mild' };
}

function getPriceRange(genre) {
    const ranges = {
        'Rock': '$45-$150',
        'Country': '$50-$175',
        'Pop': '$60-$200',
        'Hip Hop': '$55-$180',
        'Comedy': '$45-$125',
        'Family': '$25-$75',
        'R&B': '$50-$150',
        'Folk': '$40-$120',
        'Soul': '$45-$130',
        'Regional Mexican': '$40-$100'
    };
    
    return ranges[genre] || '$45-$150';
}

function getEventTips(genre) {
    const baseTips = [
        'Arrive early to avoid traffic',
        'Parking is $20 cash only',
        'No outside food or drinks',
        'Venue has partial weather coverage'
    ];
    
    const genreTips = {
        'Rock': ['Ear protection recommended', 'Standing room on lawn'],
        'Country': ['Cowboy boots welcome', 'Line dancing space on lawn'],
        'Family': ['Kid-friendly concessions available', 'Family restrooms'],
        'Comedy': ['No recording devices', 'Late seating restricted']
    };
    
    return [...baseTips, ...(genreTips[genre] || [])];
}

// Run the update
updateEventsData();