require('dotenv').config();
const Discord = require('discord.js');
const fs = require('fs');
const path = require('path');

const client = new Discord.Client();
const guilds = {}

function getLogfile(evt, guildId) {
  const folder = process.env.LOGFOLDER;
  const fmt = new Date().toISOString().substring(0, 7);
  return `${process.env.LOGFOLDER}/${guildId}/${fmt}.log`;
}

function getGuildId(evt) {
  if (evt.t === 'GUILD_CREATE') return evt.d.id;
  return evt.d.guild_id;
}

function write(evt, guildId) {
  const logfile = getLogfile(evt, guildId);

  if (guilds[guildId] == null || guilds[guildId].logfile !== logfile) {
    if (guilds[guildId] != null) {
      guilds[guildId].stream.end();
      console.info(`File ${guilds[guildId].logfile} has been closed`);
    }

    ensureDir(logfile);
    let stream = fs.createWriteStream(logfile, { flags: 'a' });
    guilds[guildId] = {
      stream: stream,
      logfile: logfile,
    }
    console.info(`File ${logfile} has been opened`);
  }

  if (evt.d.timestamp == null)
    evt.d.timestamp = new Date();

  const txt = JSON.stringify(evt);
  guilds[guildId].stream.write(txt + '\n');
}

function kill() {
  console.info('Termination signal received.');
  Object.keys(guilds).forEach(key => {
    guilds[key].stream.end();
    console.info(`File ${guilds[key].logfile} has been closed`);
  });
  process.exit(0);
}

function ensureDir(filepath) {
  const dirname = path.dirname(filepath)
  if (fs.existsSync(dirname)) return;

  console.info(`Directory ${dirname} does not exist. Creating...`);
  fs.mkdirSync(dirname, { recursive: true });
}

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on('raw', (evt) => {
  if (evt.op !== 0) return;

  const guildId = getGuildId(evt);
  if (guildId == null) return;

  write(evt, guildId);
});

process.on('SIGTERM', () => {
  kill();
});

process.on('SIGINT', () => {
  kill();
});

client.login(process.env.TOKEN).catch(console.err);
