function getPlaylistPassword() {
  return process.env.PLAYLIST_ADMIN_PASSWORD || process.env.AUTH_SECRET || 'lunar-admin';
}

function hasPlaylistAuth(req) {
  const cookieHeader = req.headers.cookie || '';
  const cookies = cookieHeader.split(';').map((cookie) => cookie.trim());
  return cookies.some((cookie) => cookie.startsWith('playlist_admin_auth=authenticated'));
}

function requirePlaylistAuth(req, res, next) {
  if (hasPlaylistAuth(req)) {
    return next();
  }

  const bodyPassword = req.body && req.body.password;
  const queryPassword = req.query && req.query.password;
  const headerPassword = req.headers['x-playlist-password'] || req.headers['x-playlist-admin-password'];
  const providedPassword = bodyPassword || queryPassword || headerPassword;

  if (providedPassword === getPlaylistPassword()) {
    res.cookie('playlist_admin_auth', 'authenticated', {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60 * 12
    });
    return next();
  }

  return res.status(401).json({ error: 'Unauthorized. Please provide the playlist admin password.' });
}

module.exports = {
  getPlaylistPassword,
  hasPlaylistAuth,
  requirePlaylistAuth
};
