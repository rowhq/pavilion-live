// App configuration
const CONFIG = {
    // API endpoint - will use Vercel function in production, local data in dev
    API_ENDPOINT: window.location.hostname === 'localhost' 
        ? './data/events-light.json' 
        : '/api/events',
    
    // Optional API keys - app works without them
    WEATHER_API_KEY: localStorage.getItem('weatherApiKey') || '',
    SPOTIFY_CLIENT_ID: localStorage.getItem('spotifyClientId') || '',
    YOUTUBE_API_KEY: localStorage.getItem('youtubeApiKey') || '',
    
    // Venue information
    VENUE_LOCATION: {
        lat: 30.16191,
        lng: -95.46435,
        address: '2005 Lake Robbins Dr, The Woodlands, TX 77380'
    },
    
    // Feature flags based on API key availability
    features: {
        weather: false,
        spotifyAuth: false,
        youtubeSearch: false
    }
};

// Check which features are available
CONFIG.features.weather = !!CONFIG.WEATHER_API_KEY;
CONFIG.features.spotifyAuth = !!CONFIG.SPOTIFY_CLIENT_ID;
CONFIG.features.youtubeSearch = !!CONFIG.YOUTUBE_API_KEY;

// State management
const state = {
    allEvents: [],
    filteredEvents: [],
    currentView: 'grid',
    sortBy: 'date',
    selectedGenres: new Set(),
    selectedDays: new Set(),
    theme: localStorage.getItem('theme') || 'light',
    favorites: JSON.parse(localStorage.getItem('favorites') || '[]'),
    priceAlerts: JSON.parse(localStorage.getItem('priceAlerts') || '[]')
};

// Genre mapping for events
const GENRE_MAP = {
    'Rock': ['rock', 'alternative', 'indie', 'punk', 'metal'],
    'Pop': ['pop', 'top 40', 'mainstream'],
    'Country': ['country', 'americana', 'bluegrass'],
    'Hip Hop': ['hip hop', 'rap', 'r&b', 'urban'],
    'Electronic': ['electronic', 'edm', 'dance', 'house'],
    'Classical': ['classical', 'orchestra', 'symphony'],
    'Jazz': ['jazz', 'blues', 'soul'],
    'Comedy': ['comedy', 'stand-up', 'humor'],
    'Family': ['family', 'kids', 'children']
};

// Initialize app
async function init() {
    // Apply saved theme
    if (state.theme === 'dark') {
        document.body.setAttribute('data-theme', 'dark');
        document.getElementById('themeToggle').innerHTML = '<i class="fas fa-sun"></i>';
    }
    
    // Fetch events
    showLoading();
    try {
        await fetchEvents();
        await fetchWeather();
        updateStats();
        setupEventListeners();
        renderGenreTags();
        renderEvents();
    } catch (error) {
        console.error('Initialization error:', error);
        showError('Failed to load events. Please refresh the page.');
    }
}

// Show loading state
function showLoading() {
    document.getElementById('eventsContainer').innerHTML = `
        <div class="loading">
            <div class="spinner"></div>
            <p>Loading amazing events...</p>
        </div>
    `;
}

// Show error state
function showError(message) {
    document.getElementById('eventsContainer').innerHTML = `
        <div class="error">
            <i class="fas fa-exclamation-triangle"></i>
            <p>${message}</p>
        </div>
    `;
}

// Fetch events from API or local data
async function fetchEvents() {
    try {
        const response = await fetch(CONFIG.API_ENDPOINT);
        const data = await response.json();
        
        // Handle API response format
        if (data.events) {
            // API response from Vercel function
            state.allEvents = data.events.map(event => ({
                ...event,
                startDate: event.date,
                '@type': event.eventType || 'MusicEvent',
                location: { 
                    name: event.venue || 'The Cynthia Woods Mitchell Pavilion', 
                    address: event.address || CONFIG.VENUE_LOCATION.address 
                }
            }));
            state.allEvents = processEvents(state.allEvents);
        } else if (Array.isArray(data)) {
            // Direct array of events (local file)
            state.allEvents = data.map(event => ({
                ...event,
                startDate: event.date,
                '@type': 'MusicEvent',
                location: { 
                    name: 'The Cynthia Woods Mitchell Pavilion', 
                    address: CONFIG.VENUE_LOCATION.address 
                }
            }));
            state.allEvents = processEvents(state.allEvents);
        } else {
            throw new Error('Invalid data format');
        }
    } catch (error) {
        console.error('Failed to fetch events:', error);
        // Use fallback data
        await loadFallbackEvents();
    }
}

// Process raw event data
function processEvents(rawEvents) {
    return rawEvents.map((event, index) => {
        const eventDate = new Date(event.startDate);
        const artist = extractArtistFromEvent(event);
        const genre = guessGenre(artist, event.name);
        
        return {
            id: event.url?.split('/').pop() || `event-${index}`,
            name: event.name,
            description: event.description,
            date: eventDate,
            dateStr: formatDate(eventDate),
            time: formatTime(eventDate),
            dayOfWeek: eventDate.getDay(),
            artist: artist,
            genre: genre,
            ticketUrl: event.url,
            venue: event.location?.name || 'The Cynthia Woods Mitchell Pavilion',
            address: event.location?.address || CONFIG.VENUE_LOCATION.address,
            eventType: event['@type'],
            status: event.eventStatus,
            availability: event.offers?.availability,
            availableFrom: event.offers?.validFrom,
            isHot: Math.random() > 0.7, // Simulate trending events
            popularity: Math.floor(Math.random() * 100) + 1
        };
    }).sort((a, b) => a.date - b.date);
}

// Extract artist from event name
function extractArtistFromEvent(event) {
    const name = event.name || '';
    
    // Common patterns
    const patterns = [
        /^([^:]+):/,  // "Artist: Tour Name"
        /^([^-]+) -/, // "Artist - Tour Name"
        /^(.+?)\s+(?:with|w\/|feat\.|featuring)/i, // "Artist with Supporting Act"
        /^(.+?)\s+(?:&|and)\s+/i // "Artist & Artist"
    ];
    
    for (const pattern of patterns) {
        const match = name.match(pattern);
        if (match) {
            return match[1].trim();
        }
    }
    
    return name.split(' ').slice(0, 3).join(' ');
}

// Guess genre based on artist name and event info
function guessGenre(artist, eventName) {
    const text = `${artist} ${eventName}`.toLowerCase();
    
    for (const [genre, keywords] of Object.entries(GENRE_MAP)) {
        if (keywords.some(keyword => text.includes(keyword))) {
            return genre;
        }
    }
    
    // Default genres based on common patterns
    if (text.includes('tour')) return 'Rock';
    if (text.includes('fest')) return 'Pop';
    if (text.includes('symphony')) return 'Classical';
    
    return 'Pop'; // Default
}

// Load fallback event data
async function loadFallbackEvents() {
    try {
        // Try to load from saved data file first
        const response = await fetch('./data/events-light.json');
        if (response.ok) {
            const savedEvents = await response.json();
            const fallbackEvents = savedEvents.map(event => ({
                ...event,
                startDate: event.date,
                '@type': 'MusicEvent',
                location: { name: 'The Cynthia Woods Mitchell Pavilion', address: CONFIG.VENUE_LOCATION.address }
            }));
            state.allEvents = processEvents(fallbackEvents);
            return;
        }
    } catch (e) {
        console.log('Could not load saved events, using hardcoded fallback');
    }
    
    // Hardcoded fallback with all 20 events
    const fallbackEvents = [
        { name: '"Weird Al" Yankovic: Bigger & Weirder 2025 Tour', startDate: '2025-08-01T20:00:00', url: 'https://www.ticketmaster.com/event/3A006132D7DB5895' },
        { name: 'Falling In Reverse: God Is A Weapon Tour', startDate: '2025-08-14T18:15:00', url: 'https://www.ticketmaster.com/event/3A0062AFB5E23EBB' },
        { name: 'Jason Aldean: Full Throttle Tour 2025', startDate: '2025-08-15T19:30:00', url: 'https://www.ticketmaster.com/event/3A006231E6515041' },
        { name: 'Big Time Rush: In Real Life Worldwide', startDate: '2025-08-17T19:00:00', url: 'https://www.ticketmaster.com/event/3A006252AD863971' },
        { name: 'The Offspring: SUPERCHARGED Worldwide in \'25', startDate: '2025-08-23T19:00:00', url: 'https://www.ticketmaster.com/event/3A006259DC044577' },
        { name: 'Nelly with Ja Rule & Special Guests: Where The Party At Tour', startDate: '2025-09-04T19:30:00', url: 'https://www.ticketmaster.com/event/3A006185A749284B' },
        { name: 'Parker McCollum Tour', startDate: '2025-09-06T19:30:00', url: 'https://www.ticketmaster.com/event/3A006288949A1BB2' },
        { name: 'KIDZ BOP LIVE Certified BOP Tour', startDate: '2025-09-07T16:00:00', url: 'https://www.ticketmaster.com/event/3A006247E9A46D3E' },
        { name: 'Lil Wayne: Tha Carter VI Tour', startDate: '2025-09-18T19:00:00', url: 'https://www.ticketmaster.com/event/3A0062BF4F2C7363' },
        { name: 'Lainey Wilson: Whirlwind World Tour', startDate: '2025-09-20T19:00:00', url: 'https://www.ticketmaster.com/event/3A00623EE55B71CD' },
        { name: 'The Crooner & The Cowboy: Leon Bridges with Charley Crockett', startDate: '2025-09-21T19:00:00', url: 'https://www.ticketmaster.com/event/3A006272D31F3C8E' },
        { name: 'A Day To Remember & Yellowcard - Maximum Fun Tour', startDate: '2025-09-23T18:15:00', url: 'https://www.ticketmaster.com/event/3A0062BF0DD073CA' },
        { name: 'Uncle Charlie\'s R & B Cookout', startDate: '2025-09-26T19:00:00', url: 'https://www.ticketmaster.com/event/3A006286C24759E2' },
        { name: 'Whiskey Myers: WHAT WE WERE BORN TO DO TOUR', startDate: '2025-09-27T18:30:00', url: 'https://www.ticketmaster.com/event/3A006296AB343E3F' },
        { name: 'The Thuggish-Ruggish-Mafia Tour', startDate: '2025-09-28T19:30:00', url: 'https://www.ticketmaster.com/event/3A0062C64E1F6C2E' },
        { name: 'Junior H - $AD BOYZ LIVE & BROKEN TOUR', startDate: '2025-10-04T20:00:00', url: 'https://www.ticketmaster.com/event/3A0062F89D842B4A' },
        { name: 'The Lumineers: The Automatic World Tour', startDate: '2025-10-10T19:30:00', url: 'https://www.ticketmaster.com/event/3A00624AD74F46E7' },
        { name: 'Keith Urban: High and Alive World Tour', startDate: '2025-10-11T19:00:00', url: 'https://www.ticketmaster.com/event/3A006184AE133C25' },
        { name: 'Majic Under The Stars', startDate: '2025-10-25T18:00:00', url: 'https://www.ticketmaster.com/event/3A0062B7E35C5C77' },
        { name: 'Alice Cooper & Judas Priest Live', startDate: '2025-10-26T18:45:00', url: 'https://www.ticketmaster.com/event/3A00628AE4804057' }
    ].map(event => ({
        ...event,
        '@type': 'MusicEvent',
        location: { name: 'The Cynthia Woods Mitchell Pavilion', address: CONFIG.VENUE_LOCATION.address }
    }));
    
    state.allEvents = processEvents(fallbackEvents);
}

// Fetch weather data
async function fetchWeather() {
    try {
        if (CONFIG.features.weather && CONFIG.WEATHER_API_KEY) {
            // Fetch real weather data
            const response = await fetch(
                `https://api.openweathermap.org/data/2.5/weather?q=The+Woodlands,TX&appid=${CONFIG.WEATHER_API_KEY}&units=imperial`
            );
            
            if (response.ok) {
                const data = await response.json();
                updateWeatherWidget({
                    temp: Math.round(data.main.temp),
                    description: data.weather[0].main,
                    icon: getWeatherIcon(data.weather[0].main)
                });
                return;
            }
        }
        
        // Use static weather as fallback
        const now = new Date();
        const month = now.getMonth();
        const typicalWeather = getTypicalWeather(month);
        
        updateWeatherWidget({
            temp: typicalWeather.temp,
            description: typicalWeather.condition,
            icon: typicalWeather.icon
        });
    } catch (error) {
        console.error('Weather fetch failed:', error);
        // Show default weather
        updateWeatherWidget({
            temp: 78,
            description: 'Typical',
            icon: 'fa-cloud-sun'
        });
    }
}

// Get weather icon based on condition
function getWeatherIcon(condition) {
    const icons = {
        'Clear': 'fa-sun',
        'Clouds': 'fa-cloud',
        'Rain': 'fa-cloud-rain',
        'Drizzle': 'fa-cloud-rain',
        'Thunderstorm': 'fa-bolt',
        'Snow': 'fa-snowflake',
        'Mist': 'fa-smog',
        'Fog': 'fa-smog'
    };
    return icons[condition] || 'fa-cloud-sun';
}

// Get typical weather by month
function getTypicalWeather(month) {
    const weather = {
        0: { temp: 55, condition: 'Cool', icon: 'fa-cloud' },
        1: { temp: 58, condition: 'Cool', icon: 'fa-cloud' },
        2: { temp: 65, condition: 'Mild', icon: 'fa-cloud-sun' },
        3: { temp: 72, condition: 'Pleasant', icon: 'fa-sun' },
        4: { temp: 79, condition: 'Warm', icon: 'fa-sun' },
        5: { temp: 85, condition: 'Hot', icon: 'fa-sun' },
        6: { temp: 89, condition: 'Hot', icon: 'fa-sun' },
        7: { temp: 90, condition: 'Hot', icon: 'fa-sun' },
        8: { temp: 86, condition: 'Hot', icon: 'fa-sun' },
        9: { temp: 78, condition: 'Pleasant', icon: 'fa-cloud-sun' },
        10: { temp: 68, condition: 'Mild', icon: 'fa-cloud-sun' },
        11: { temp: 58, condition: 'Cool', icon: 'fa-cloud' }
    };
    
    return weather[month] || { temp: 75, condition: 'Mild', icon: 'fa-cloud-sun' };
}

// Update weather widget
function updateWeatherWidget(weather) {
    document.getElementById('weatherWidget').innerHTML = `
        <i class="fas ${weather.icon}"></i>
        <span>${weather.temp}°F - ${weather.description}</span>
    `;
}

// Update statistics
function updateStats() {
    const now = new Date();
    const currentMonth = now.getMonth();
    
    const thisMonthEvents = state.allEvents.filter(event => 
        event.date.getMonth() === currentMonth
    ).length;
    
    const hotEvents = state.allEvents.filter(event => event.isHot).length;
    
    document.getElementById('totalEvents').textContent = state.allEvents.length;
    document.getElementById('thisMonth').textContent = thisMonthEvents;
    document.getElementById('hotEvents').textContent = hotEvents;
}

// Setup event listeners
function setupEventListeners() {
    // Theme toggle
    document.getElementById('themeToggle').addEventListener('click', toggleTheme);
    
    // Settings
    document.getElementById('settingsBtn').addEventListener('click', openSettings);
    document.getElementById('closeSettingsModal').addEventListener('click', closeSettings);
    document.getElementById('saveSettings').addEventListener('click', saveSettings);
    document.getElementById('clearSettings').addEventListener('click', clearSettings);
    
    // View toggle
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', () => changeView(btn.dataset.view));
    });
    
    // Search
    document.getElementById('searchInput').addEventListener('input', debounce(filterEvents, 300));
    
    // Filters
    document.getElementById('monthFilter').addEventListener('change', filterEvents);
    document.getElementById('sortBy').addEventListener('change', sortEvents);
    document.getElementById('filterToggle').addEventListener('click', toggleAdvancedFilters);
    
    // Day filters
    document.querySelectorAll('.day-btn').forEach(btn => {
        btn.addEventListener('click', () => toggleDayFilter(btn));
    });
    
    // Modal close buttons
    document.getElementById('closeModal').addEventListener('click', closeMusicModal);
    document.getElementById('closeEventModal').addEventListener('click', closeEventModal);
    
    // Tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });
    
    // Click outside modal to close
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('music-modal') || 
            e.target.classList.contains('event-modal') ||
            e.target.classList.contains('settings-modal')) {
            closeMusicModal();
            closeEventModal();
            closeSettings();
        }
    });
    
    // Load saved API keys
    loadApiKeys();
}

// Theme toggle
function toggleTheme() {
    const isDark = document.body.getAttribute('data-theme') === 'dark';
    
    if (isDark) {
        document.body.removeAttribute('data-theme');
        document.getElementById('themeToggle').innerHTML = '<i class="fas fa-moon"></i>';
        state.theme = 'light';
    } else {
        document.body.setAttribute('data-theme', 'dark');
        document.getElementById('themeToggle').innerHTML = '<i class="fas fa-sun"></i>';
        state.theme = 'dark';
    }
    
    localStorage.setItem('theme', state.theme);
}

// Change view
function changeView(view) {
    state.currentView = view;
    
    // Update buttons
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.view === view);
    });
    
    // Update container class
    const container = document.getElementById('eventsContainer');
    container.className = view === 'grid' ? 'events-grid' : 'events-list';
    
    renderEvents();
}

// Toggle advanced filters
function toggleAdvancedFilters() {
    document.getElementById('advancedFilters').classList.toggle('show');
}

// Render genre tags
function renderGenreTags() {
    const container = document.getElementById('genreTags');
    const genres = Object.keys(GENRE_MAP);
    
    container.innerHTML = genres.map(genre => `
        <button class="genre-tag" data-genre="${genre}">${genre}</button>
    `).join('');
    
    // Add click listeners
    container.querySelectorAll('.genre-tag').forEach(tag => {
        tag.addEventListener('click', () => toggleGenreFilter(tag));
    });
}

// Toggle genre filter
function toggleGenreFilter(tag) {
    const genre = tag.dataset.genre;
    
    if (state.selectedGenres.has(genre)) {
        state.selectedGenres.delete(genre);
        tag.classList.remove('active');
    } else {
        state.selectedGenres.add(genre);
        tag.classList.add('active');
    }
    
    filterEvents();
}

// Toggle day filter
function toggleDayFilter(btn) {
    const day = parseInt(btn.dataset.day);
    
    if (state.selectedDays.has(day)) {
        state.selectedDays.delete(day);
        btn.classList.remove('active');
    } else {
        state.selectedDays.add(day);
        btn.classList.add('active');
    }
    
    filterEvents();
}

// Filter events
function filterEvents() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const selectedMonth = document.getElementById('monthFilter').value;
    
    state.filteredEvents = state.allEvents.filter(event => {
        // Search filter
        const matchesSearch = !searchTerm || 
            event.name.toLowerCase().includes(searchTerm) ||
            event.artist.toLowerCase().includes(searchTerm) ||
            event.genre.toLowerCase().includes(searchTerm);
        
        // Month filter
        const eventMonth = String(event.date.getMonth() + 1).padStart(2, '0');
        const matchesMonth = !selectedMonth || eventMonth === selectedMonth;
        
        // Genre filter
        const matchesGenre = state.selectedGenres.size === 0 || 
            state.selectedGenres.has(event.genre);
        
        // Day filter
        const matchesDay = state.selectedDays.size === 0 || 
            state.selectedDays.has(event.dayOfWeek);
        
        return matchesSearch && matchesMonth && matchesGenre && matchesDay;
    });
    
    sortEvents();
}

// Sort events
function sortEvents() {
    const sortBy = document.getElementById('sortBy').value;
    
    switch (sortBy) {
        case 'name':
            state.filteredEvents.sort((a, b) => a.name.localeCompare(b.name));
            break;
        case 'popularity':
            state.filteredEvents.sort((a, b) => b.popularity - a.popularity);
            break;
        default: // date
            state.filteredEvents.sort((a, b) => a.date - b.date);
    }
    
    renderEvents();
}

// Render events
function renderEvents() {
    const container = document.getElementById('eventsContainer');
    const events = state.filteredEvents.length > 0 ? state.filteredEvents : state.allEvents;
    
    if (events.length === 0) {
        container.innerHTML = `
            <div class="no-events">
                <i class="fas fa-calendar-times"></i>
                <h3>No events found</h3>
                <p>Try adjusting your filters</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = events.map(event => createEventCard(event)).join('');
    
    // Add fade-in animation
    container.querySelectorAll('.event-card').forEach((card, index) => {
        setTimeout(() => card.classList.add('fade-in'), index * 50);
    });
}

// Create event card HTML
function createEventCard(event) {
    const isFavorite = state.favorites.includes(event.id);
    const hasAlert = state.priceAlerts.includes(event.id);
    
    return `
        <div class="event-card" data-event-id="${event.id}">
            <div class="event-image">
                <i class="fas fa-music"></i>
                ${event.isHot ? '<span class="hot-badge">🔥 HOT</span>' : ''}
            </div>
            <div class="event-content">
                <div class="event-header-info">
                    <div>
                        <h3 class="event-title">${event.name}</h3>
                        <p class="event-artist">${event.artist}</p>
                    </div>
                    <div class="event-datetime">
                        <p class="event-date">${event.dateStr}</p>
                        <p class="event-time">${event.time}</p>
                    </div>
                </div>
                
                <div class="event-meta">
                    <span class="meta-item">
                        <i class="fas fa-tag"></i> ${event.genre}
                    </span>
                    <span class="meta-item">
                        <i class="fas fa-fire-alt"></i> ${event.popularity}% Popular
                    </span>
                    <span class="meta-item">
                        <i class="fas fa-calendar-day"></i> ${getDayName(event.dayOfWeek)}
                    </span>
                </div>
                
                <div class="event-actions">
                    <button class="btn btn-primary" onclick="openMusicModal('${event.id}')">
                        <i class="fas fa-play"></i> Listen
                    </button>
                    <a href="${event.ticketUrl}" target="_blank" class="btn btn-secondary">
                        <i class="fas fa-ticket-alt"></i> Tickets
                    </a>
                    <button class="btn btn-secondary" onclick="showEventDetails('${event.id}')">
                        <i class="fas fa-info-circle"></i>
                    </button>
                </div>
            </div>
        </div>
    `;
}

// Open music modal
function openMusicModal(eventId) {
    const event = state.allEvents.find(e => e.id === eventId);
    if (!event) return;
    
    // Update modal content
    document.getElementById('modalArtist').textContent = event.artist;
    document.getElementById('modalEvent').textContent = event.name;
    
    // Load music players
    loadSpotifyPlayer(event.artist);
    loadYouTubePlayer(event.artist);
    
    // Load artist info
    loadArtistInfo(event.artist);
    
    // Show modal
    document.getElementById('musicModal').classList.add('show');
}

// Load Spotify player
function loadSpotifyPlayer(artist) {
    const container = document.getElementById('spotifyPlayer');
    const encodedArtist = encodeURIComponent(artist);
    
    // Spotify embed
    container.innerHTML = `
        <iframe 
            src="https://open.spotify.com/embed/search/${encodedArtist}" 
            width="100%" 
            height="400" 
            frameBorder="0" 
            allowtransparency="true" 
            allow="encrypted-media">
        </iframe>
    `;
}

// Load YouTube player
function loadYouTubePlayer(artist) {
    const container = document.getElementById('youtubePlayer');
    
    // For demo, show placeholder
    container.innerHTML = `
        <div style="padding: 2rem; text-align: center;">
            <i class="fab fa-youtube" style="font-size: 3rem; margin-bottom: 1rem;"></i>
            <p>Search "${artist}" on YouTube for live performances</p>
            <a href="https://www.youtube.com/results?search_query=${encodeURIComponent(artist + ' live')}" 
               target="_blank" 
               class="btn btn-primary" 
               style="margin-top: 1rem;">
                <i class="fas fa-external-link-alt"></i> Open YouTube
            </a>
        </div>
    `;
}

// Load artist info
function loadArtistInfo(artist) {
    // Simulate artist info
    const info = {
        about: `${artist} is an amazing artist performing at The Cynthia Woods Mitchell Pavilion. Don't miss this incredible show!`,
        similar: ['Artist 1', 'Artist 2', 'Artist 3'],
        setlist: [
            'Hit Song 1',
            'Hit Song 2',
            'Fan Favorite',
            'New Single',
            'Classic Hit'
        ]
    };
    
    updateTabContent('about', `
        <p>${info.about}</p>
        <p style="margin-top: 1rem;">
            <strong>Genre:</strong> Rock<br>
            <strong>Years Active:</strong> 2000 - Present<br>
            <strong>Albums:</strong> 10+ Studio Albums
        </p>
    `);
}

// Switch tabs
function switchTab(tab) {
    // Update active tab
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tab);
    });
    
    // Update content based on tab
    switch (tab) {
        case 'similar':
            updateTabContent(tab, `
                <h4>Artists you might also like:</h4>
                <ul style="list-style: none; padding: 0;">
                    <li style="padding: 0.5rem 0;"><i class="fas fa-user"></i> Similar Artist 1</li>
                    <li style="padding: 0.5rem 0;"><i class="fas fa-user"></i> Similar Artist 2</li>
                    <li style="padding: 0.5rem 0;"><i class="fas fa-user"></i> Similar Artist 3</li>
                </ul>
            `);
            break;
        case 'setlist':
            updateTabContent(tab, `
                <h4>Possible setlist based on recent shows:</h4>
                <ol>
                    <li>Opening Song</li>
                    <li>Popular Hit</li>
                    <li>Fan Favorite</li>
                    <li>New Material</li>
                    <li>Encore: Biggest Hit</li>
                </ol>
            `);
            break;
        default:
            // About tab is loaded by loadArtistInfo
            break;
    }
}

// Update tab content
function updateTabContent(tab, content) {
    document.getElementById('tabContent').innerHTML = content;
}

// Show event details
function showEventDetails(eventId) {
    const event = state.allEvents.find(e => e.id === eventId);
    if (!event) return;
    
    const detailsContainer = document.getElementById('eventDetails');
    detailsContainer.innerHTML = `
        <div class="detail-header">
            <div class="detail-image">
                <i class="fas fa-music" style="font-size: 4rem;"></i>
            </div>
            <div class="detail-info">
                <h2>${event.name}</h2>
                <div class="detail-meta">
                    <p><i class="fas fa-user"></i> <strong>${event.artist}</strong></p>
                    <p><i class="fas fa-calendar"></i> ${event.dateStr}</p>
                    <p><i class="fas fa-clock"></i> ${event.time}</p>
                    <p><i class="fas fa-map-marker-alt"></i> ${event.venue}</p>
                </div>
                <div style="margin-top: 1rem;">
                    <a href="${event.ticketUrl}" target="_blank" class="btn btn-primary">
                        <i class="fas fa-ticket-alt"></i> Get Tickets
                    </a>
                </div>
            </div>
        </div>
        
        <div class="venue-section">
            <h3><i class="fas fa-building"></i> Venue Information</h3>
            <p><strong>The Cynthia Woods Mitchell Pavilion</strong></p>
            <p>${CONFIG.VENUE_LOCATION.address}</p>
            <p>Capacity: 16,500 (3,000 covered seats + 13,500 lawn)</p>
            <p>One of the top outdoor amphitheaters in the world!</p>
        </div>
        
        <div class="tips-section">
            <h3><i class="fas fa-lightbulb"></i> Event Tips</h3>
            <ul>
                <li>Arrive early to avoid traffic and find good parking</li>
                <li>Bring a blanket or low chair for lawn seating</li>
                <li>Check weather forecast - venue has partial coverage</li>
                <li>No outside food or drinks allowed</li>
                <li>Parking is $20 cash only</li>
            </ul>
        </div>
        
        <div class="pricing-section">
            <h3><i class="fas fa-dollar-sign"></i> Estimated Costs</h3>
            <p><strong>Tickets:</strong> $45 - $150+</p>
            <p><strong>Parking:</strong> $20</p>
            <p><strong>Concessions:</strong> $15-20 per item</p>
            <p><strong>Total for 2:</strong> ~$200-400</p>
        </div>
    `;
    
    document.getElementById('eventModal').classList.add('show');
}

// Close modals
function closeMusicModal() {
    document.getElementById('musicModal').classList.remove('show');
    // Stop any playing media
    document.getElementById('spotifyPlayer').innerHTML = '';
    document.getElementById('youtubePlayer').innerHTML = '';
}

function closeEventModal() {
    document.getElementById('eventModal').classList.remove('show');
}

// Helper functions
function formatDate(date) {
    const options = { weekday: 'short', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

function formatTime(date) {
    return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
    });
}

function getDayName(dayIndex) {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days[dayIndex];
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Settings functions
function openSettings() {
    document.getElementById('settingsModal').classList.add('show');
}

function closeSettings() {
    document.getElementById('settingsModal').classList.remove('show');
}

function loadApiKeys() {
    // Load saved keys into input fields
    document.getElementById('weatherApiKey').value = CONFIG.WEATHER_API_KEY || '';
    document.getElementById('spotifyClientId').value = CONFIG.SPOTIFY_CLIENT_ID || '';
    document.getElementById('youtubeApiKey').value = CONFIG.YOUTUBE_API_KEY || '';
}

function saveSettings() {
    // Get values from inputs
    const weatherKey = document.getElementById('weatherApiKey').value.trim();
    const spotifyId = document.getElementById('spotifyClientId').value.trim();
    const youtubeKey = document.getElementById('youtubeApiKey').value.trim();
    
    // Save to localStorage
    if (weatherKey) localStorage.setItem('weatherApiKey', weatherKey);
    else localStorage.removeItem('weatherApiKey');
    
    if (spotifyId) localStorage.setItem('spotifyClientId', spotifyId);
    else localStorage.removeItem('spotifyClientId');
    
    if (youtubeKey) localStorage.setItem('youtubeApiKey', youtubeKey);
    else localStorage.removeItem('youtubeApiKey');
    
    // Update CONFIG
    CONFIG.WEATHER_API_KEY = weatherKey;
    CONFIG.SPOTIFY_CLIENT_ID = spotifyId;
    CONFIG.YOUTUBE_API_KEY = youtubeKey;
    
    // Update feature flags
    CONFIG.features.weather = !!weatherKey;
    CONFIG.features.spotifyAuth = !!spotifyId;
    CONFIG.features.youtubeSearch = !!youtubeKey;
    
    // Refresh weather if key was added
    if (CONFIG.features.weather) {
        fetchWeather();
    }
    
    alert('Settings saved! The app will use the new API keys.');
    closeSettings();
}

function clearSettings() {
    if (confirm('Clear all API keys?')) {
        localStorage.removeItem('weatherApiKey');
        localStorage.removeItem('spotifyClientId');
        localStorage.removeItem('youtubeApiKey');
        
        CONFIG.WEATHER_API_KEY = '';
        CONFIG.SPOTIFY_CLIENT_ID = '';
        CONFIG.YOUTUBE_API_KEY = '';
        
        CONFIG.features.weather = false;
        CONFIG.features.spotifyAuth = false;
        CONFIG.features.youtubeSearch = false;
        
        loadApiKeys();
        alert('All API keys cleared.');
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', init);