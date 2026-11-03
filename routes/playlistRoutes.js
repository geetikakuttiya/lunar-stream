const express = require('express');
const axios = require('axios');
const multer = require('multer');
const path = require('path');

const { readPlaylist, writePlaylist, getPublicChannels, normalizeChannel } = require('../utils/playlistStore');
const { parseM3u } = require('../utils/playlistParser');
const { getPlaylistPassword, requirePlaylistAuth, hasPlaylistAuth } = require('../middlewares/playlistAuth');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

function escapeAttribute(value) {
  return String(value || '').replace(/"/g, '\\"');
}

function buildPublicPlaylist() {
  const playlist = readPlaylist();
  const lines = ['#EXTM3U'];

  for (const channel of getPublicChannels()) {
    const name = String(channel.name || 'Unknown Channel').replace(/\s+/g, ' ').trim();
    const group = channel.group ? ` group-title="${escapeAttribute(channel.group)}"` : '';
    const logo = channel.logo ? ` tvg-logo="${escapeAttribute(channel.logo)}"` : '';
    const tvgId = channel.tvgId ? ` tvg-id="${escapeAttribute(channel.tvgId)}"` : '';
    const tvgName = channel.tvgName ? ` tvg-name="${escapeAttribute(channel.tvgName)}"` : '';

    lines.push(`#EXTINF:-1${tvgId}${tvgName}${logo}${group},${name}`);
    lines.push(channel.url);
  }

  return lines.join('\n');
}

router.get('/playlist-admin', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'playlist-admin.html'));
});

router.get('/playlist', (req, res) => {
  res.type('application/vnd.apple.mpegurl').send(buildPublicPlaylist());
});

router.get('/playlist.m3u', (req, res) => {
  res.type('application/vnd.apple.mpegurl').send(buildPublicPlaylist());
});

router.get('/playlist.json', (req, res) => {
  res.json(readPlaylist());
});

router.get('/api/playlist/status', (req, res) => {
  res.json({
    authenticated: hasPlaylistAuth(req),
    passwordConfigured: Boolean(getPlaylistPassword()),
    channels: readPlaylist().channels.length
  });
});

router.post('/api/playlist/auth', (req, res) => {
  const password = req.body && req.body.password;

  if (password !== getPlaylistPassword()) {
    return res.status(401).json({ error: 'Invalid password' });
  }

  res.cookie('playlist_admin_auth', 'authenticated', {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 1000 * 60 * 60 * 12
  });

  return res.json({ ok: true });
});

router.use('/api/playlist', requirePlaylistAuth);

router.get('/api/playlist', (req, res) => {
  res.json(readPlaylist());
});

router.get('/api/playlist/public', (req, res) => {
  res.json({ channels: getPublicChannels() });
});

router.post('/api/playlist/channels', (req, res) => {
  const playlist = readPlaylist();
  const item = normalizeChannel({
    ...req.body,
    hidden: Boolean(req.body && req.body.hidden)
  }, playlist.channels.length);

  playlist.channels.push(item);
  writePlaylist(playlist);
  res.status(201).json(item);
});

router.put('/api/playlist/channels/:id', (req, res) => {
  const playlist = readPlaylist();
  const index = playlist.channels.findIndex((channel) => channel.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({ error: 'Channel not found' });
  }

  const updated = normalizeChannel({
    ...playlist.channels[index],
    ...req.body,
    hidden: Boolean(req.body && req.body.hidden)
  }, index);

  playlist.channels[index] = updated;
  writePlaylist(playlist);
  return res.json(updated);
});

router.delete('/api/playlist/channels/:id', (req, res) => {
  const playlist = readPlaylist();
  const originalLength = playlist.channels.length;
  playlist.channels = playlist.channels.filter((channel) => channel.id !== req.params.id);

  if (playlist.channels.length === originalLength) {
    return res.status(404).json({ error: 'Channel not found' });
  }

  writePlaylist(playlist);
  return res.json({ ok: true, deletedId: req.params.id });
});

router.delete('/api/playlist/clear', (req, res) => {
  const playlist = readPlaylist();
  playlist.channels = [];
  playlist.name = 'Playlist';
  writePlaylist(playlist);
  return res.json({ ok: true, cleared: true });
});

router.post('/api/playlist/reorder', (req, res) => {
  const playlist = readPlaylist();
  const order = Array.isArray(req.body && req.body.order) ? req.body.order : [];

  if (!order.length) {
    return res.status(400).json({ error: 'Order list is required' });
  }

  const map = new Map(playlist.channels.map((channel) => [channel.id, channel]));
  const reordered = order
    .map((channelId) => map.get(channelId))
    .filter(Boolean)
    .concat(playlist.channels.filter((channel) => !order.includes(channel.id)));

  playlist.channels = reordered.map((channel, index) => normalizeChannel({ ...channel, sortOrder: index }, index));
  writePlaylist(playlist);
  return res.json({ ok: true, channels: playlist.channels });
});

router.post('/api/playlist/import-url', async (req, res) => {
  const url = req.body && req.body.url;

  if (!url) {
    return res.status(400).json({ error: 'Playlist URL is required' });
  }

  try {
    const response = await axios.get(url, {
      timeout: 20000,
      responseType: 'text'
    });

    const channels = parseM3u(response.data || '');

    if (!channels.length) {
      return res.status(400).json({ error: 'No playable channels were found in the playlist.' });
    }

    const playlist = readPlaylist();
    playlist.name = req.body && req.body.name ? req.body.name : 'Imported Playlist';
    playlist.channels = channels.map((channel, index) => normalizeChannel({ ...channel, hidden: false }, index));
    writePlaylist(playlist);

    return res.json({ ok: true, channels: playlist.channels, source: url });
  } catch (error) {
    console.error('Playlist import failed:', error.message);
    return res.status(400).json({ error: 'Failed to import playlist from the provided URL.' });
  }
});

router.post('/api/playlist/import-file', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No playlist file was uploaded.' });
  }

  try {
    const text = req.file.buffer.toString('utf8');
    const channels = parseM3u(text);

    if (!channels.length) {
      return res.status(400).json({ error: 'No channels were detected in the uploaded playlist.' });
    }

    const playlist = readPlaylist();
    playlist.name = req.file.originalname || 'Uploaded Playlist';
    playlist.channels = channels.map((channel, index) => normalizeChannel({ ...channel, hidden: false }, index));
    writePlaylist(playlist);

    return res.json({ ok: true, channels: playlist.channels, source: req.file.originalname });
  } catch (error) {
    console.error('File import failed:', error.message);
    return res.status(400).json({ error: 'Failed to parse the uploaded playlist file.' });
  }
});

module.exports = router;
