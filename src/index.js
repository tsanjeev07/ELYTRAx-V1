require('dotenv').config();

const path = require('node:path');
const ffmpegPath = require('ffmpeg-static');
const {
  Client,
  Events,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
} = require('discord.js');
const {
  AudioPlayerStatus,
  NoSubscriberBehavior,
  VoiceConnectionStatus,
  createAudioPlayer,
  createAudioResource,
  entersState,
  joinVoiceChannel,
} = require('@discordjs/voice');

const token = process.env.DISCORD_TOKEN;
if (!token) {
  console.error('Missing DISCORD_TOKEN. Copy .env.example to .env and add your bot token.');
  process.exit(1);
}

const audioPath = path.join(__dirname, '..', 'audio', 'feel-good-funk.mp3');
if (ffmpegPath) process.env.PATH = `${path.dirname(ffmpegPath)}${path.delimiter}${process.env.PATH ?? ''}`;
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates] });
const sessions = new Map();

const commands = [
  new SlashCommandBuilder().setName('play').setDescription('Join your voice channel and loop Feel Good Funk.'),
  new SlashCommandBuilder().setName('stop').setDescription('Stop the music and leave the voice channel.'),
].map((command) => command.toJSON());

async function registerCommands() {
  const rest = new REST({ version: '10' }).setToken(token);
  await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
  console.log('Registered /play and /stop.');
}

function playTrack(player) {
  const resource = createAudioResource(audioPath);
  player.play(resource);
}

client.once(Events.ClientReady, async (readyClient) => {
  console.log(`Ready as ${readyClient.user.tag}`);
  try {
    await registerCommands();
  } catch (error) {
    console.error('Could not register slash commands:', error);
  }
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'play') {
    const channel = interaction.member.voice?.channel;
    if (!channel) {
      await interaction.reply({ content: 'Join a voice channel first, then run `/play`.', ephemeral: true });
      return;
    }

    if (sessions.has(interaction.guildId)) {
      await interaction.reply({ content: 'The track is already looping in this server.', ephemeral: true });
      return;
    }

    await interaction.deferReply();
    try {
      const connection = joinVoiceChannel({
        channelId: channel.id,
        guildId: interaction.guildId,
        adapterCreator: interaction.guild.voiceAdapterCreator,
        selfDeaf: true,
      });
      const player = createAudioPlayer({ behaviors: { noSubscriber: NoSubscriberBehavior.Play } });
      connection.subscribe(player);

      player.on(AudioPlayerStatus.Idle, () => {
        if (sessions.has(interaction.guildId)) playTrack(player);
      });
      player.on('error', (error) => console.error('Audio player error:', error));
      connection.on('error', (error) => console.error('Voice connection error:', error));

      sessions.set(interaction.guildId, { connection, player });
      await entersState(connection, VoiceConnectionStatus.Ready, 30_000);
      playTrack(player);
      await interaction.editReply(`Joined **${channel.name}** and started looping **Feel Good Funk**.`);
    } catch (error) {
      sessions.delete(interaction.guildId);
      console.error('Could not start playback:', error);
      await interaction.editReply('I could not join or start audio. Check my Connect and Speak permissions, then try again.');
    }
    return;
  }

  if (interaction.commandName === 'stop') {
    const session = sessions.get(interaction.guildId);
    if (!session) {
      await interaction.reply({ content: 'There is no music session running in this server.', ephemeral: true });
      return;
    }
    sessions.delete(interaction.guildId);
    session.player.stop(true);
    session.connection.destroy();
    await interaction.reply('Stopped playback and left the voice channel.');
  }
});

client.login(token);
