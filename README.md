# Pavilion Live - The Ultimate Concert Experience

A beautiful, feature-rich web app for browsing and discovering events at The Cynthia Woods Mitchell Pavilion in The Woodlands, Texas.

## Features

### Core Features
- 📅 **Live Event Listings** - Real-time event data from multiple sources
- 🎵 **Music Preview** - Listen to artists via Spotify integration
- 🌙 **Dark/Light Mode** - Beautiful themes for any time of day
- 📱 **Fully Responsive** - Works perfectly on all devices
- 🔍 **Smart Search** - Find events by artist, genre, or date
- 📊 **Advanced Filters** - Filter by month, genre, day of week

### Enhanced Features
- 🔥 **Trending Events** - See what's hot
- ☀️ **Weather Integration** - Outdoor venue weather awareness
- 💰 **Cost Calculator** - Estimate total event costs
- 📍 **Venue Information** - Tips, parking, seating info
- 🎸 **Genre Detection** - Automatic event categorization
- 📈 **Popularity Scores** - See which shows are in demand

### Music Discovery
- 🎧 **Spotify Integration** - Preview artist tracks
- 📺 **YouTube Links** - Watch live performances
- 🎤 **Artist Information** - Learn about performers
- 🎵 **Similar Artists** - Discover new music
- 📝 **Predicted Setlists** - Know what to expect

## Quick Start

1. Clone the repository
2. Open `index.html` in your browser
3. Or run a local server:
   ```bash
   python -m http.server 8000
   # or
   npx http-server
   ```

## Data Sources

The app fetches event data from:
- Ticketmaster venue pages (via CORS proxy)
- Local JSON data (fallback)
- Can be extended to use official APIs

## Technical Stack

- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Icons**: Font Awesome 6
- **Music**: Spotify Web Embeds
- **Data**: JSON, REST APIs
- **Storage**: LocalStorage for preferences

## Customization

### API Keys
To enable full features, add your API keys in `app.js`:
- Spotify Client ID
- YouTube API Key
- Weather API Key
- Ticketmaster API Key

### Styling
The app uses CSS custom properties for easy theming:
- Edit color schemes in `style.css`
- Fully customizable with CSS variables
- Responsive breakpoints included

## Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge
- Mobile browsers

## Future Enhancements

- Push notifications for new events
- Social sharing features
- Ticket price tracking
- Calendar integration
- Offline support with PWA

## License

MIT License - feel free to use and modify!