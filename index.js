require('dotenv').config();
const Discord = require('discord.js');
const fs = require('fs');
const path = require('path');

const client = new Discord.Client();
const guilds = {}

function getLogfile(evt) {
  const folder = process.env.LOGFOLDER;
  const fmt = new Date().toISOString().substring(0, 7);
  const guildId = evt.d.guild_id;
  return `${process.env.LOGFOLDER}/${guildId}/${fmt}.log`;
}

function write(evt) {
  const logfile = getLogfile(evt);
  const guildId = evt.d.guild_id;

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

client.login(process.env.TOKEN);

client.on('raw', (evt) => {
  if (evt.t == null) return;
  if (evt.d == null || evt.d.guild_id == null) return;

  write(evt, evt.d.guild_id);
});

process.on('SIGTERM', () => {
  kill();
});

process.on('SIGINT', () => {
  kill();
});
