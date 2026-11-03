const fs = require('fs');
const path = require('path');

const PLAYLIST_PATH = path.join(__dirname, '..', 'data', 'playlist.json');

const DEMO_CHANNEL_URL = 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8';

const emptyPlaylist = () => ({
  name: 'Playlist',
  channels: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
});

function getFallbackChannels() {
  return [{
    id: 'demo-channel',
    name: 'Demo Stream',
    url: DEMO_CHANNEL_URL,
    group: 'Demo',
    logo: '',
    hidden: false,
    tvgId: 'demo-stream',
    tvgName: 'Demo Stream',
    sortOrder: 0
  }];
}

function ensurePlaylistFile() {
  const dir = path.dirname(PLAYLIST_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  if (!fs.existsSync(PLAYLIST_PATH)) {
    fs.writeFileSync(PLAYLIST_PATH, JSON.stringify(emptyPlaylist(), null, 2));
  }
}

function readPlaylist() {
  ensurePlaylistFile();

  try {
    const raw = fs.readFileSync(PLAYLIST_PATH, 'utf8');
    const parsed = raw ? JSON.parse(raw) : emptyPlaylist();

    if (!parsed || typeof parsed !== 'object') {
      return emptyPlaylist();
    }

    if (!Array.isArray(parsed.channels)) {
      parsed.channels = [];
    }

    if (!parsed.createdAt) {
      parsed.createdAt = new Date().toISOString();
    }

    parsed.updatedAt = new Date().toISOString();
    return parsed;
  } catch (error) {
    console.error('Failed to read playlist JSON:', error.message);
    return emptyPlaylist();
  }
}

function normalizeChannel(channel, index = 0) {
  const url = typeof channel?.url === 'string' ? channel.url.trim() : '';
  const name = typeof channel?.name === 'string' && channel.name.trim()
    ? channel.name.trim()
    : `Channel ${index + 1}`;

  return {
    id: channel?.id || `channel-${Date.now()}-${Math.random().toString(16).slice(2)}-${index}`,
    name,
    url,
    group: typeof channel?.group === 'string' ? channel.group.trim() : '',
    logo: typeof channel?.logo === 'string' ? channel.logo.trim() : '',
    hidden: Boolean(channel?.hidden),
    tvgId: typeof channel?.tvgId === 'string' ? channel.tvgId.trim() : '',
    tvgName: typeof channel?.tvgName === 'string' ? channel.tvgName.trim() : name,
    sortOrder: typeof channel?.sortOrder === 'number' ? channel.sortOrder : index
  };
}

function writePlaylist(data) {
  ensurePlaylistFile();

  const safeData = data && typeof data === 'object' ? data : emptyPlaylist();
  safeData.channels = Array.isArray(safeData.channels) ? safeData.channels.map((channel, index) => normalizeChannel(channel, index)) : [];
  safeData.updatedAt = new Date().toISOString();

  fs.writeFileSync(PLAYLIST_PATH, JSON.stringify(safeData, null, 2));
  return safeData;
}

function getPublicChannels() {
  const playlist = readPlaylist();
  const channels = (playlist.channels || []).filter((channel) => channel && channel.url && !channel.hidden);

  if (channels.length) {
    return channels;
  }

  return getFallbackChannels();
}

module.exports = {
  PLAYLIST_PATH,
  emptyPlaylist,
  normalizeChannel,
  readPlaylist,
  getPublicChannels,
  writePlaylist,
  getFallbackChannels
};
