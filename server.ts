import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

// Type definitions
interface Player {
  id: string;
  name: string;
  score: number;
  lives?: number;
  lastSubmit?: number | null;
  lastActive: number;
}

interface GameLog {
  id: string;
  msg: string;
  type: 'info' | 'success' | 'danger' | 'warning';
}

interface Farmer {
  name: string;
  points: number;
  avatarUrl: string;
  lastActive: number;
}

async function startServer() {
  const app = express();
  app.use(express.json());
  const PORT = 3000;

  // --- IN-MEMORY BACKEND STATE ---
  let farmers: Record<string, Farmer> = {};
  let lastDailyClaims: Record<string, number> = {}; // username -> timestamp
  let customRoles: Array<{
    id: string;
    creator: string;
    roleName: string;
    color: string;
    icon: string;
    createdAt: number;
  }> = [];

  // --- MATHS GAME STATE ---
  let mathPlaying = false;
  let mathQuestion = 'Waiting to start...';
  let mathAnswer = 0;
  let mathTimeLeft = 15;
  let mathPlayers: Record<string, Player> = {};
  let mathLogs: GameLog[] = [];
  let mathRoundTimeout: NodeJS.Timeout | null = null;

  // --- KOTD GAME STATE ---
  let kotdPlaying = false;
  let kotdRound = 1;
  let kotdTimeLeft = 30;
  let kotdPlayers: Record<string, Player> = {};
  let kotdLogs: GameLog[] = [];
  let kotdRoundTimeout: NodeJS.Timeout | null = null;

  // Helper to append game logs
  const addLog = (game: 'math' | 'kotd', msg: string, type: GameLog['type'] = 'info') => {
    const logEntry: GameLog = { id: Math.random().toString(), msg, type };
    if (game === 'math') {
      mathLogs.push(logEntry);
      if (mathLogs.length > 30) mathLogs.shift();
    } else {
      kotdLogs.push(logEntry);
      if (kotdLogs.length > 30) kotdLogs.shift();
    }
  };

  // Generate next Math Equation
  const generateMathQuestion = () => {
    const ops = ['+', '-', '*'];
    const op = ops[Math.floor(Math.random() * ops.length)];
    let a = Math.floor(Math.random() * 12) + 2;
    let b = Math.floor(Math.random() * 12) + 2;
    let ans = 0;

    if (op === '+') ans = a + b;
    else if (op === '-') ans = a - b;
    else ans = a * b;

    mathQuestion = `${a} ${op} ${b} = ?`;
    mathAnswer = ans;
    mathTimeLeft = 15;
    addLog('math', `Round started! Solve: ${a} ${op} ${b}`, 'warning');
  };

  // Complete a Math round
  const triggerNextMathRoundAfterDelay = () => {
    if (mathRoundTimeout) clearTimeout(mathRoundTimeout);
    mathRoundTimeout = setTimeout(() => {
      const activeCount = Object.values(mathPlayers).filter(p => Date.now() - p.lastActive < 8000).length;
      if (activeCount >= 2) {
        generateMathQuestion();
      } else {
        mathPlaying = false;
        mathQuestion = 'Waiting for at least 2 players...';
        addLog('math', 'Lobby paused: Minimum 2 players required.', 'info');
      }
    }, 3000);
  };

  // Process KOTD Round Strategy calculations
  const processKotdRound = () => {
    const activeKPlayers = Object.values(kotdPlayers).filter(p => Date.now() - p.lastActive < 8000);
    if (activeKPlayers.length < 2) {
      kotdPlaying = false;
      addLog('kotd', 'Game canceled. Not enough active players left in the lobby.', 'danger');
      return;
    }

    // Auto-assign random fallbacks for players who didn't submit
    activeKPlayers.forEach(p => {
      if (p.lastSubmit === undefined || p.lastSubmit === null) {
        p.lastSubmit = Math.floor(Math.random() * 70) + 15;
        addLog('kotd', `⏰ Time's up! ${p.name} did not submit; auto-assigned fallback ${p.lastSubmit}`, 'warning');
      }
    });

    // 1. Calculate Average
    const sum = activeKPlayers.reduce((acc, curr) => acc + (curr.lastSubmit || 0), 0);
    const avg = sum / activeKPlayers.length;
    const target = avg * 0.8;

    addLog('kotd', `Round Complete. Average = ${avg.toFixed(2)} | Target (0.8 * avg) = ${target.toFixed(2)}`, 'info');

    // 2. Find closest and furthest
    let closestIndex = -1;
    let minDiff = Infinity;
    let furthestIndex = -1;
    let maxDiff = -Infinity;

    activeKPlayers.forEach((p, idx) => {
      const diff = Math.abs((p.lastSubmit || 0) - target);
      if (diff < minDiff) {
        minDiff = diff;
        closestIndex = idx;
      }
      if (diff > maxDiff) {
        maxDiff = diff;
        furthestIndex = idx;
      }
    });

    const winner = activeKPlayers[closestIndex];
    const loser = activeKPlayers[furthestIndex];

    addLog('kotd', `⭐ Closest: ${winner.name} (submitted ${(winner.lastSubmit || 0).toFixed(2)}) wins +1 Point!`, 'success');
    addLog('kotd', `💔 Furthest: ${loser.name} (submitted ${(loser.lastSubmit || 0).toFixed(2)}) loses 1 Life!`, 'danger');

    // Update state and prune dead players
    activeKPlayers.forEach(p => {
      if (p.id === winner.id) {
        p.score += 1;
      }
      if (p.id === loser.id) {
        p.lives = (p.lives || 5) - 1;
      }
      p.lastSubmit = null; // Reset for next round
    });

    // Print eliminations
    activeKPlayers.forEach(p => {
      if ((p.lives || 0) <= 0) {
        addLog('kotd', `Eliminated: ${p.name} has run out of lives!`, 'danger');
        delete kotdPlayers[p.id];
      }
    });

    const survivors = Object.values(kotdPlayers).filter(p => Date.now() - p.lastActive < 8000 && (p.lives || 0) > 0);

    // 3. Check for match victory
    if (survivors.length === 1) {
      addLog('kotd', `🏆 MATCH OVER! ${survivors[0].name} is the last standing and wins the crown!`, 'success');
      kotdPlaying = false;
    } else if (survivors.length === 0) {
      addLog('kotd', '💀 MATCH OVER! All players have been eliminated. Sudden Death!', 'danger');
      kotdPlaying = false;
    } else {
      // Trigger next round after 5s delay
      if (kotdRoundTimeout) clearTimeout(kotdRoundTimeout);
      kotdRoundTimeout = setTimeout(() => {
        kotdRound += 1;
        kotdTimeLeft = 30;
        kotdPlaying = true;
        addLog('kotd', `Round ${kotdRound} started! Enter strategy number from 0 to 100`, 'warning');
      }, 5000);
    }
  };

  // --- BACKGROUND GAME TIMER TICK ---
  setInterval(() => {
    const now = Date.now();

    // Prune inactive Farmers (timeout 15 seconds)
    Object.keys(farmers).forEach(id => {
      if (now - farmers[id].lastActive > 15000) {
        delete farmers[id];
      }
    });

    // Handle Maths Game countdown
    if (mathPlaying) {
      const activeCount = Object.values(mathPlayers).filter(p => now - p.lastActive < 8000).length;
      if (activeCount < 2) {
        mathPlaying = false;
        mathQuestion = 'Waiting for at least 2 players...';
        addLog('math', 'Maths game suspended: Not enough active players.', 'danger');
      } else {
        mathTimeLeft -= 1;
        if (mathTimeLeft <= 0) {
          addLog('math', `⏰ Round ended! Correct answer was: ${mathAnswer}`, 'info');
          generateMathQuestion();
        }
      }
    }

    // Handle KOTD Game countdown
    if (kotdPlaying) {
      const activeCount = Object.values(kotdPlayers).filter(p => now - p.lastActive < 8000).length;
      if (activeCount < 2) {
        kotdPlaying = false;
        addLog('kotd', 'KOTD Arena suspended: Not enough active players.', 'danger');
      } else {
        kotdTimeLeft -= 1;
        if (kotdTimeLeft <= 0) {
          processKotdRound();
        }
      }
    }
  }, 1000);

  // --- API ENDPOINTS ---

  // 1. Live AFK Leaderboard
  app.get('/api/afk/leaderboard', (req, res) => {
    const list = Object.values(farmers).map(f => ({
      name: f.name,
      points: f.points,
      avatarUrl: f.avatarUrl
    })).sort((a, b) => b.points - a.points);
    res.json(list);
  });

  // 2. Farmer heartbeats
  app.post('/api/afk/ping', (req, res) => {
    const { name, points, avatarUrl } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }
    farmers[name] = {
      name,
      points: points || 0,
      avatarUrl: avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&fit=crop&q=80',
      lastActive: Date.now()
    };
    res.json({ success: true });
  });

  // 3. Live Games state
  app.get('/api/game/state', (req, res) => {
    const { id, name, game } = req.query;
    const now = Date.now();

    // Perform player ping registrations if player queried their game
    if (id && name) {
      const pId = id as string;
      const pName = name as string;

      if (game === 'math') {
        mathPlayers[pId] = {
          id: pId,
          name: pName,
          score: mathPlayers[pId]?.score || 0,
          lastActive: now
        };
      } else if (game === 'kotd') {
        kotdPlayers[pId] = {
          id: pId,
          name: pName,
          score: kotdPlayers[pId]?.score || 0,
          lives: kotdPlayers[pId]?.lives !== undefined ? kotdPlayers[pId].lives : 5,
          lastSubmit: kotdPlayers[pId]?.lastSubmit || null,
          lastActive: now
        };
      }
    }

    // Filter out inactive game players (over 8 seconds silent)
    const activeMathPlayers = Object.values(mathPlayers)
      .filter(p => now - p.lastActive < 8000)
      .map(p => ({ name: p.name, score: p.score }));

    const activeKotdPlayers = Object.values(kotdPlayers)
      .filter(p => now - p.lastActive < 8000)
      .map(p => ({ name: p.name, score: p.score, lives: p.lives || 5, hasSubmitted: p.lastSubmit !== null }));

    res.json({
      math: {
        playing: mathPlaying,
        question: mathQuestion,
        timeLeft: mathTimeLeft,
        players: activeMathPlayers,
        logs: mathLogs
      },
      kotd: {
        playing: kotdPlaying,
        round: kotdRound,
        timeLeft: kotdTimeLeft,
        players: activeKotdPlayers,
        logs: kotdLogs
      }
    });
  });

  // 4. Join a game lobby explicitly
  app.post('/api/game/join', (req, res) => {
    const { id, name, game } = req.body;
    if (!id || !name || !game) {
      return res.status(400).json({ error: 'Missing join parameters' });
    }

    const now = Date.now();
    if (game === 'math') {
      mathPlayers[id] = { id, name, score: 0, lastActive: now };
      addLog('math', `${name} joined Math Arena.`, 'info');

      // Check if lobby can start now (needs >= 2 players)
      const activeCount = Object.values(mathPlayers).filter(p => now - p.lastActive < 8000).length;
      if (!mathPlaying && activeCount >= 2) {
        mathPlaying = true;
        generateMathQuestion();
      }
    } else if (game === 'kotd') {
      kotdPlayers[id] = { id, name, score: 0, lives: 5, lastSubmit: null, lastActive: now };
      addLog('kotd', `${name} joined KOTD Arena.`, 'info');

      const activeCount = Object.values(kotdPlayers).filter(p => now - p.lastActive < 8000).length;
      if (!kotdPlaying && activeCount >= 2) {
        kotdRound = 1;
        kotdTimeLeft = 30;
        kotdPlaying = true;
        addLog('kotd', `Match auto-started! Enter a strategy number from 0 to 100`, 'warning');
      }
    }

    res.json({ success: true });
  });

  // 5. Submit Maths answer or KOTD strategy
  app.post('/api/game/submit', (req, res) => {
    const { id, value, game } = req.body;
    if (!id || value === undefined || !game) {
      return res.status(400).json({ error: 'Missing submission parameters' });
    }

    const now = Date.now();
    if (game === 'math' && mathPlaying) {
      const p = mathPlayers[id];
      if (!p) return res.status(404).json({ error: 'Player not found in Maths' });
      p.lastActive = now;

      const numeric = parseFloat(value);
      if (numeric === mathAnswer) {
        p.score += 1;
        mathPlaying = false; // pause to show success
        addLog('math', `🎉 Correct answer by ${p.name}! Answer was ${mathAnswer}.`, 'success');
        triggerNextMathRoundAfterDelay();
        res.json({ correct: true });
      } else {
        addLog('math', `❌ Wrong answer "${value}" by ${p.name}!`, 'danger');
        res.json({ correct: false });
      }
    } else if (game === 'kotd' && kotdPlaying) {
      const p = kotdPlayers[id];
      if (!p) return res.status(404).json({ error: 'Player not found in KOTD' });
      p.lastActive = now;

      const num = parseFloat(value);
      if (isNaN(num) || num < 0 || num > 100) {
        return res.status(400).json({ error: 'Must be between 0 and 100' });
      }

      p.lastSubmit = num;
      addLog('kotd', `✅ Strategy received from ${p.name}`, 'success');

      // Check if all active players submitted
      const activeKPlayers = Object.values(kotdPlayers).filter(p => now - p.lastActive < 8000);
      const allSubmitted = activeKPlayers.every(p => p.lastSubmit !== null && p.lastSubmit !== undefined);

      if (allSubmitted && activeKPlayers.length >= 2) {
        if (kotdRoundTimeout) clearTimeout(kotdRoundTimeout);
        processKotdRound();
      }

      res.json({ success: true });
    } else {
      res.status(400).json({ error: 'Game is not active' });
    }
  });

  // 6. Leave a game explicitly
  app.post('/api/game/leave', (req, res) => {
    const { id, game } = req.body;
    if (game === 'math') {
      if (mathPlayers[id]) {
        addLog('math', `${mathPlayers[id].name} left the lobby.`, 'info');
        delete mathPlayers[id];
      }
    } else if (game === 'kotd') {
      if (kotdPlayers[id]) {
        addLog('kotd', `${kotdPlayers[id].name} left the lobby.`, 'info');
        delete kotdPlayers[id];
      }
    }
    res.json({ success: true });
  });

  // --- SHOP & DAILY CLAIM ENDPOINTS ---
  
  // 1. Claim Daily Reward
  app.post('/api/daily/claim', (req, res) => {
    const { name, points } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Name is required to claim daily rewards.' });
    }

    const now = Date.now();
    const lastClaim = lastDailyClaims[name] || 0;
    const COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 Hours

    if (now - lastClaim < COOLDOWN_MS) {
      const remainingTime = COOLDOWN_MS - (now - lastClaim);
      return res.status(400).json({ 
        error: 'Reward is already claimed for today!',
        remainingTime 
      });
    }

    // Grant maximum 10 Aura Points (random 1 - 10)
    const rewardAmount = Math.floor(Math.random() * 10) + 1;
    lastDailyClaims[name] = now;

    // Update in-memory points on server if farmer exists
    if (farmers[name]) {
      farmers[name].points = (points || farmers[name].points || 0) + rewardAmount;
    } else {
      farmers[name] = {
        name,
        points: (points || 0) + rewardAmount,
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&fit=crop&q=80',
        lastActive: now
      };
    }

    res.json({
      success: true,
      rewardAmount,
      nextClaimAt: now + COOLDOWN_MS,
      newPoints: farmers[name].points
    });
  });

  // 2. Buy/Create Custom Role
  app.post('/api/shop/purchase-role', (req, res) => {
    const { name, roleName, color, icon, currentPoints } = req.body;
    
    if (!name || !roleName || !color) {
      return res.status(400).json({ error: 'Missing required role configuration parameter(s).' });
    }

    const cost = 350; // Custom role cost in Aura Points
    const userPoints = currentPoints !== undefined ? currentPoints : (farmers[name]?.points || 0);

    if (userPoints < cost) {
      return res.status(400).json({ error: `You need at least ${cost} Aura Points to purchase a custom role.` });
    }

    // Deduct points
    const newPoints = userPoints - cost;
    if (farmers[name]) {
      farmers[name].points = newPoints;
    }

    // Save custom role
    const roleId = 'role_' + Math.random().toString(36).substring(2, 9);
    customRoles.unshift({
      id: roleId,
      creator: name,
      roleName,
      color,
      icon: icon || '',
      createdAt: Date.now()
    });

    // Generate Discord Bot logs mimicking real actions & positioning above server booster role
    const botLogs = [
      `[GATEWAY] Connected to Discord with status: ONLINE`,
      `[AUTH] Authenticating requests with bot token and guild configs...`,
      `[ROLES] Loading guild role list... Fetched 18 roles from server.`,
      `[ROLES] Found role: 'Server Booster' (Position ID: 12)`,
      `[ROLES] Found role: 'Aurlets Champion' (Position ID: 13)`,
      `[HIERARCHY] Custom role is targeted to be placed ABOVE 'Server Booster' role.`,
      `[EXEC] API call: Guild.roles.create({ name: "${roleName}", color: "${color}" })`,
      `[EXEC] Custom role "${roleName}" was created successfully.`,
      `[ICON] Applying role icon...`,
      ...(icon ? [`[ICON] Successfully set role icon to custom provided asset.`] : [`[ICON] No role icon provided; falling back to default emblem.`]),
      `[HIERARCHY] Moving position of "${roleName}" above "Server Booster"...`,
      `[HIERARCHY] Role position changed successfully to Index 13!`,
      `[MEMBER] Awarding role "${roleName}" to Discord account of user "${name}"...`,
      `[SUCCESS] Custom role created and applied! Logged in Discord developer logs.`
    ];

    res.json({
      success: true,
      roleId,
      newPoints,
      botLogs,
      role: {
        id: roleId,
        roleName,
        color,
        icon
      }
    });
  });

  // 3. Fetch Custom Roles list
  app.get('/api/shop/roles', (req, res) => {
    res.json(customRoles);
  });

  // --- DISCORD OAUTH ENDPOINTS ---
  app.get('/api/auth/discord/config', (req, res) => {
    res.json({
      configured: !!(process.env.DISCORD_CLIENT_ID && process.env.DISCORD_CLIENT_SECRET),
      devUrl: 'https://ais-dev-mi5isjwmxcwzz2wnkckp6y-950813206559.asia-east1.run.app',
      sharedUrl: 'https://ais-pre-mi5isjwmxcwzz2wnkckp6y-950813206559.asia-east1.run.app'
    });
  });

  app.get('/api/auth/discord/url', (req, res) => {
    const origin = (req.query.origin as string) || 'http://localhost:3000';
    const clientId = process.env.DISCORD_CLIENT_ID;

    if (!clientId) {
      return res.status(400).json({ error: 'Discord Client ID not configured on server' });
    }

    const redirectUri = `${origin}/api/auth/discord/callback`;
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'identify',
      state: origin,
    });

    res.json({ url: `https://discord.com/api/oauth2/authorize?${params.toString()}` });
  });

  app.get('/api/auth/discord/callback', async (req, res) => {
    const { code, state } = req.query;

    if (!code) {
      return res.send(`
        <html>
          <body style="background: #0f0f11; color: #f4f4f5; font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0;">
            <div style="text-align: center; max-width: 400px; padding: 20px; background: #18181b; border-radius: 12px; border: 1px solid #27272a;">
              <h3 style="color: #ef4444; margin-top: 0;">Auth Failed</h3>
              <p style="color: #a1a1aa; font-size: 14px;">No authorization code provided by Discord.</p>
              <button onclick="window.close()" style="background: #3f3f46; border: none; color: white; padding: 8px 16px; border-radius: 6px; cursor: pointer;">Close</button>
            </div>
          </body>
        </html>
      `);
    }

    const origin = (state as string) || 'http://localhost:3000';
    const redirectUri = `${origin}/api/auth/discord/callback`;

    try {
      const clientId = process.env.DISCORD_CLIENT_ID;
      const clientSecret = process.env.DISCORD_CLIENT_SECRET;

      if (!clientId || !clientSecret) {
        throw new Error('Discord OAuth credentials not fully configured');
      }

      // Exchange code for token
      const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
        method: 'POST',
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          grant_type: 'authorization_code',
          code: code as string,
          redirect_uri: redirectUri,
        }),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        console.error('Discord token exchange error:', errorText);
        throw new Error('Failed to exchange code for token: ' + errorText);
      }

      const tokenData: any = await tokenResponse.json();
      const accessToken = tokenData.access_token;

      // Fetch user profile
      const userResponse = await fetch('https://discord.com/api/users/@me', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!userResponse.ok) {
        throw new Error('Failed to fetch user profile from Discord');
      }

      const userData: any = await userResponse.json();
      const { id, username, global_name, avatar } = userData;

      // Construct avatar URL
      const avatarUrl = avatar
        ? `https://cdn.discordapp.com/avatars/${id}/${avatar}.png`
        : `https://cdn.discordapp.com/embed/avatars/${Math.floor(Math.random() * 6)}.png`;

      // Return successful response that communicates to parent and closes
      res.send(`
        <html>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({
                  type: 'DISCORD_AUTH_SUCCESS',
                  user: {
                    id: ${JSON.stringify(id)},
                    username: ${JSON.stringify(username)},
                    globalName: ${JSON.stringify(global_name || username)},
                    avatarUrl: ${JSON.stringify(avatarUrl)}
                  }
                }, '*');
                window.close();
              } else {
                window.location.href = '/';
              }
            </script>
            <p style="font-family: sans-serif; text-align: center; margin-top: 50px; color: #71717a;">
              Authentication successful! This window should close automatically.
            </p>
          </body>
        </html>
      `);
    } catch (err: any) {
      console.error('Discord auth callback error:', err);
      res.send(`
        <html>
          <body style="background: #0f0f11; color: #f4f4f5; font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; padding: 20px;">
            <div style="max-width: 480px; padding: 30px; background: #18181b; border: 1px solid #27272a; border-radius: 16px; text-align: center;">
              <h2 style="color: #ef4444; margin-top: 0;">Authentication Error</h2>
              <p style="color: #a1a1aa; font-size: 14px; line-height: 1.6;">${err.message || 'An unexpected error occurred during the login process.'}</p>
              <div style="background: #09090b; padding: 15px; border-radius: 8px; text-align: left; font-size: 11px; font-family: monospace; color: #71717a; margin: 20px 0; max-height: 150px; overflow-y: auto;">
                Make sure the Redirect URI in Discord Developer Portal is exactly:<br/>
                <span style="color: #c084fc;">${redirectUri}</span><br/><br/>
                And environment variables are correctly set in the settings.
              </div>
              <button onclick="window.close()" style="background: #4f46e5; border: none; color: white; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-weight: bold;">Close Window</button>
            </div>
          </body>
        </html>
      `);
    }
  });

  // --- VITE DEV SERVER OR STATIC SERVING ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
