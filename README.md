# Feel Good Funk Discord bot

A Discord.js bot that joins the voice channel of the person who runs `/play` and loops the included MP3. Run `/stop` to stop playback and leave.

## Requirements

- Node.js 22.12 or newer
- A Discord application/bot with the **bot** and **applications.commands** scopes
- Bot permissions in your server: **View Channels**, **Connect**, and **Speak**

## Setup

1. In the Discord Developer Portal, create an application and add a bot. Copy its bot token.
2. Invite it to your server using OAuth2 URL Generator with the `bot` and `applications.commands` scopes and the permissions listed above.
3. Copy `.env.example` to `.env` and put the token after `DISCORD_TOKEN=`. Keep `.env` private.
4. From this folder, run:

   ```sh
   npm install
   npm start
   ```

5. Join a voice channel and use `/play`. Use `/stop` when finished.

The bot registers its global slash commands at startup; Discord may take a short time to show them the first time. Keep the Node process running while you want music to play. Playback repeats from the beginning whenever the MP3 ends. The project includes `ffmpeg-static` so it can decode the supplied MP3 without a separate system FFmpeg install.

## Audio file

The included track is at `audio/feel-good-funk.mp3`. Replace it with another MP3 at the same path to change the track. The bot runs in memory and stops its session if restarted.
