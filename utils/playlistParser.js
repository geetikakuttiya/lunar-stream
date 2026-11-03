const { normalizeChannel } = require('./playlistStore');

function extractAttributes(text) {
  const attributes = {};
  const matcher = /([A-Za-z0-9_-]+)="([^"]*)"/g;
  let match; 

  while ((match = matcher.exec(text)) !== null) {
    attributes[match[1]] = match[2];
  }

  return attributes;
}

function parseM3u(content) {
  if (typeof content !== 'string' || !content.trim()) {
    return [];
  }

  const lines = content
    .replace(/\r/g, '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const channels = [];
  let current = null;

  for (const line of lines) {
    if (line.startsWith('#EXTM3U')) {
      continue;
    }

    if (line.startsWith('#EXTINF')) {
      const attributes = extractAttributes(line);
      const lastCommaIndex = line.lastIndexOf(',');
      const nameFromLabel = lastCommaIndex >= 0 ? line.slice(lastCommaIndex + 1).trim() : '';

      current = {
        name: nameFromLabel || attributes['tvg-name'] || `Channel ${channels.length + 1}`,
        group: attributes['group-title'] || '',
        logo: attributes['tvg-logo'] || attributes.logo || '',
        url: '',
        hidden: false,
        tvgId: attributes['tvg-id'] || '',
        tvgName: attributes['tvg-name'] || nameFromLabel || `Channel ${channels.length + 1}`
      };
      continue;
    }

    if (line.startsWith('#EXTGRP:')) {
      if (current) {
        current.group = line.replace('#EXTGRP:', '').trim() || current.group;
      }
      continue;
    }

    if (line.startsWith('#')) {
      continue;
    }

    if (!line) {
      continue;
    }

    if (current) {
      current.url = line;
      channels.push(normalizeChannel(current, channels.length));
      current = null;
      continue;
    }

    if (/^(https?:|rtmp:|udp:|rtsp:|http:|https:)/i.test(line)) {
      channels.push(normalizeChannel({
        name: `Channel ${channels.length + 1}`,
        url: line,
        hidden: false
      }, channels.length));
    }
  }

  return channels;
}

module.exports = {
  parseM3u
};
