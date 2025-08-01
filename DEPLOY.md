# Deployment Guide for Pavilion Live

## Quick Deploy to Vercel

### 1. Prerequisites
- GitHub account
- Vercel account (free at vercel.com)

### 2. Deploy Steps

1. **Fork/Clone this repository**
   ```bash
   git clone <your-repo-url>
   cd pavilion-events
   ```

2. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

3. **Deploy to Vercel**
   ```bash
   vercel
   ```
   Follow the prompts to link your project.

### 3. Set up Vercel KV (for automatic updates)

1. Go to your project in Vercel Dashboard
2. Navigate to "Storage" tab
3. Create a new KV database
4. Copy the environment variables

### 4. Configure Environment Variables

In Vercel Dashboard > Settings > Environment Variables, add:

```
# Required for cron job
CRON_SECRET=<generate-random-string>

# From Vercel KV
KV_URL=<from-vercel-kv>
KV_REST_API_URL=<from-vercel-kv>
KV_REST_API_TOKEN=<from-vercel-kv>
KV_REST_API_READ_ONLY_TOKEN=<from-vercel-kv>

# Optional API Keys (app works without these)
WEATHER_API_KEY=<your-openweather-key>
SPOTIFY_CLIENT_ID=<your-spotify-id>
SPOTIFY_CLIENT_SECRET=<your-spotify-secret>
YOUTUBE_API_KEY=<your-youtube-key>
```

### 5. Enable Cron Job

The cron job runs every 6 hours to update events automatically:
- Edit `vercel.json` to adjust the schedule if needed
- The cron endpoint is protected by `CRON_SECRET`

## Local Development

```bash
npm install
npm run dev
# Visit http://localhost:3000
```

## Production Features

### Works Without API Keys
- ✅ Shows all events from cached data
- ✅ Basic Spotify embeds
- ✅ Typical weather for the month
- ✅ All filtering and search features

### Enhanced with API Keys
- 🔑 Real-time weather data
- 🔑 Advanced Spotify features
- 🔑 YouTube video search
- 🔑 Future: Ticketmaster pricing

### Data Updates
- Automatic: Every 6 hours via Vercel cron
- Manual: Run `npm run fetch-events`
- Fallback: Static data if all else fails

## Custom Domain

1. In Vercel Dashboard > Settings > Domains
2. Add your custom domain
3. Follow DNS configuration instructions

## Security

- API keys are stored in browser localStorage
- Server-side keys are in environment variables
- No keys are exposed in client code
- CORS proxy prevents direct API access

## Monitoring

- Check Vercel Dashboard > Functions for logs
- Monitor cron job execution
- Set up alerts for failures

## Troubleshooting

### Events not updating
1. Check cron job logs in Vercel
2. Verify KV database is connected
3. Check CRON_SECRET matches

### API features not working
1. Verify API keys in Settings modal
2. Check browser console for errors
3. Ensure CORS is enabled for APIs

## Support

- File issues on GitHub
- Check Vercel status page
- Review API documentation for each service