require("dotenv").config();
const { Client, GatewayIntentBits } = require("discord.js");
const {
  joinVoiceChannel,
  getVoiceConnection,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
} = require("@discordjs/voice");
const { createReadStream } = require("fs");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const botName = process.env.DISCORD_BOT_NAME;
var channelName = null;

client.on("ready", () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  if (message.member.voice.channel) {
    if (message.content.toLowerCase() === "!join") {
      const channel = message.member.voice.channel;
      channelName = channel.name;

      try {
        joinVoiceChannel({
          channelId: channel.id,
          guildId: message.guild.id,
          adapterCreator: message.guild.voiceAdapterCreator,
        });
      } catch (error) {
        console.error("Error: ", error);
      }
    } else if (message.content.toLowerCase() === "!leave") {
      const connection = getVoiceConnection(message.guild.id);
      const userChannel = message.member.voice.channel;

      if (connection && userChannel && userChannel.id === connection.joinConfig.channelId) {
        connection.destroy();
      }      
    }
  }
});

client.on("voiceStateUpdate", async (oldState, newState) => {
  if (oldState.member.user.username != botName) {
    if (oldState.channel !== newState.channel) {
      if (oldState.channel && oldState.channel.name === channelName) {
        play(oldState.channel, "./sounds/disconnected.wav");
      }

      if (newState.channel && newState.channel.name === channelName) {
        const havingAGoodTime = Math.random() <= 0.05;
        const file = havingAGoodTime
          ? "./sounds/connected-but-its-loud-af.mp3"
          : "./sounds/connected.wav";
        play(newState.channel, file);
      }
    }

    if (oldState.selfDeaf && !newState.selfDeaf) {
      play(oldState.channel, "./sounds/talkpower_granted.wav");
    }
  }
});

client.login(process.env.DISCORD_BOT_TOKEN);

async function play(channel, file) {
  try {
    if (channel && channel.joinable) {
      const connection = joinVoiceChannel({
        channelId: channel.id,
        guildId: channel.guild.id,
        adapterCreator: channel.guild.voiceAdapterCreator,
      });
      const resource = createAudioResource(createReadStream(file));

      const player = createAudioPlayer();
      player.play(resource);
      connection.subscribe(player);
    }
  } catch (error) {
    console.error("Error: ", error);
  }
}
