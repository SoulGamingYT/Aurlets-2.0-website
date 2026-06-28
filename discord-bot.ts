import { 
  Client, 
  GatewayIntentBits, 
  EmbedBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  ActionRowBuilder, 
  ComponentType,
  Message,
  PermissionFlagsBits,
  REST,
  Routes
} from 'discord.js';
import * as fs from 'fs';
import * as path from 'path';

const BOT_CONFIG_PATH = path.join(process.cwd(), 'bot-config.json');

interface BotConfig {
  allowedChannelId?: string;
}

let botConfig: BotConfig = {};

function loadBotConfig() {
  try {
    if (fs.existsSync(BOT_CONFIG_PATH)) {
      const content = fs.readFileSync(BOT_CONFIG_PATH, 'utf-8');
      botConfig = JSON.parse(content);
    }
  } catch (err) {
    console.error('[BOT CONFIG] Failed to load bot config:', err);
  }
}

function saveBotConfig() {
  try {
    fs.writeFileSync(BOT_CONFIG_PATH, JSON.stringify(botConfig, null, 2), 'utf-8');
  } catch (err) {
    console.error('[BOT CONFIG] Failed to save bot config:', err);
  }
}

// Initial load
loadBotConfig();

interface Farmer {
  name: string;
  points: number;
  avatarUrl: string;
  lastActive: number;
  discordId?: string;
  discordUsername?: string;
  streak?: number;
  timeOnWebsite?: number;
  invites?: number;
  invitedBy?: string;
  gamesPlayed?: Record<string, number>;
  totalGamesPlayed?: number;
  discordMessagesCount?: number;
}

interface Giveaway {
  id: string;
  prizeType: 'role' | 'ap' | 'minecraft' | 'other';
  prizeName: string;
  rewardValue?: number;
  requirements: {
    discordMessages?: number;
    gamesPlayed?: number;
  };
  participants: string[];
  winner?: string;
  startedBy: string;
  startedAt: number;
  endedAt?: number;
  status: 'active' | 'ended';
}

// Global active blackjack sessions and general command cooldowns
const PRESET_ROLES = [
  { id: '1417575135279452221', name: 'Blossom 🌸', emoji: '🌸', price: 2500 },
  { id: '1417674566515560529', name: 'Overclocked ⚡', emoji: '⚡', price: 5000 },
  { id: '1417679884733649007', name: 'Shieldbearer 🛡️', emoji: '🛡️', price: 7500 },
  { id: '1423454938784075949', name: 'The Honored One', emoji: '💫', price: 10000 },
  { id: '1417681913069572267', name: 'Ribbon Rebel 🎀', emoji: '🎀', price: 12500 },
  { id: '1417688194098659389', name: 'Warrior ⚔️', emoji: '⚔️', price: 15000 },
  { id: '1417689418034319394', name: 'Guardian 🪽', emoji: '🪽', price: 17500 },
  { id: '1420103265298813009', name: 'Viber 🎧', emoji: '🎧', price: 20000 },
  { id: '1420108774445682719', name: 'Elite 💸', emoji: '💸', price: 22500 },
  { id: '1417692877227561064', name: 'Royal ⚜️', emoji: '⚜️', price: 25000 }
];

const activeBlackjackGames = new Map<string, {
  bet: number;
  playerHand: string[];
  dealerHand: string[];
  deck: string[];
  messageId: string;
}>();

// Cooldowns: user ID -> { beg: timestamp, work: timestamp }
const cooldowns = new Map<string, { beg?: number, work?: number }>();

const CARD_SUITS = ['♠️', '♥️', '♦️', '♣️'];
const CARD_RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

// Helpers for Blackjack deck and score calculation
function createDeck(): string[] {
  const deck: string[] = [];
  for (const suit of CARD_SUITS) {
    for (const rank of CARD_RANKS) {
      deck.push(`${suit} ${rank}`);
    }
  }
  // Shuffle
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

function getCardValue(card: string): number {
  const rank = card.split(' ')[1];
  if (['J', 'Q', 'K'].includes(rank)) return 10;
  if (rank === 'A') return 11;
  return parseInt(rank, 10);
}

function calculateHandScore(hand: string[]): number {
  let score = 0;
  let acesCount = 0;
  for (const card of hand) {
    const val = getCardValue(card);
    score += val;
    if (card.endsWith(' A')) acesCount++;
  }
  while (score > 21 && acesCount > 0) {
    score -= 10;
    acesCount--;
  }
  return score;
}

function formatTimeOnWebsite(seconds: number): string {
  if (!seconds) return '0s';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hrs > 0) {
    return `${hrs}h ${mins}m`;
  }
  if (mins > 0) {
    return `${mins}m ${secs}s`;
  }
  return `${secs}s`;
}

function getLeaderboardEmbed(category: 'points' | 'streak' | 'web_time' | 'invites', farmersList: any[]): EmbedBuilder {
  let title = '';
  let color = 15844367; // Gold/Yellow default
  let desc = '';

  if (category === 'points') {
    title = '🏆 Global Points Leaderboard';
    const sorted = [...farmersList].sort((a, b) => b.points - a.points).slice(0, 10);
    desc = 'The elite of Aura Farmers rankings (Aura Points):\n\n';
    sorted.forEach((f, idx) => {
      const medal = idx === 0 ? '👑' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '▪️';
      desc += `${medal} **#${idx + 1}** \`${f.name}\` — **${(f.points || 0).toLocaleString()} AP**\n`;
    });
  } else if (category === 'streak') {
    title = '🔥 Daily Streak Leaderboard';
    color = 15105570; // Orange/Fire
    const sorted = [...farmersList].filter(f => (f.streak || 0) > 0).sort((a, b) => (b.streak || 0) - (a.streak || 0)).slice(0, 10);
    desc = 'Top daily claim streaks (Consecutive Days):\n\n';
    if (sorted.length === 0) {
      desc += 'No active streaks right now. Claim yours with `+daily`!\n';
    } else {
      sorted.forEach((f, idx) => {
        const medal = idx === 0 ? '👑' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '▪️';
        desc += `${medal} **#${idx + 1}** \`${f.name}\` — **${f.streak} days** 🔥\n`;
      });
    }
  } else if (category === 'web_time') {
    title = '⏱️ Web Time Leaderboard';
    color = 3447003; // Cyan/Blue
    const sorted = [...farmersList].filter(f => (f.timeOnWebsite || 0) > 0).sort((a, b) => (b.timeOnWebsite || 0) - (a.timeOnWebsite || 0)).slice(0, 10);
    desc = 'Most dedicated users (Time Active on Website):\n\n';
    if (sorted.length === 0) {
      desc += 'No active time recorded yet. Visit and stay active on the website!\n';
    } else {
      sorted.forEach((f, idx) => {
        const medal = idx === 0 ? '👑' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '▪️';
        desc += `${medal} **#${idx + 1}** \`${f.name}\` — **${formatTimeOnWebsite(f.timeOnWebsite || 0)}**\n`;
      });
    }
  } else if (category === 'invites') {
    title = '👥 Invites Leaderboard';
    color = 10181046; // Purple
    const sorted = [...farmersList].filter(f => (f.invites || 0) > 0).sort((a, b) => (b.invites || 0) - (a.invites || 0)).slice(0, 10);
    desc = 'Most successful referrers (Total Invites):\n\n';
    if (sorted.length === 0) {
      desc += 'No invites recorded yet.\n';
    } else {
      sorted.forEach((f, idx) => {
        const medal = idx === 0 ? '👑' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '▪️';
        desc += `${medal} **#${idx + 1}** \`${f.name}\` — **${f.invites} invites** 👥\n`;
      });
    }
  }

  return new EmbedBuilder()
    .setTitle(title)
    .setDescription(desc)
    .setColor(color)
    .setTimestamp()
    .setFooter({ text: 'Aurlets Economy • Leaderboard Categories' });
}

export function startDiscordBot(
  farmers: Record<string, Farmer>,
  lastDailyClaims: Record<string, number>,
  dailyBetEarnings: Record<string, Record<string, number>>,
  presetRolePurchases: Array<{
    username: string;
    roleId: string;
    roleName: string;
    cost: number;
    purchasedAt: number;
  }>,
  redeemCodes: Record<string, {
    code: string;
    rewardAmount: number;
    maxUses: number;
    uses: number;
    redeemedBy: string[];
    createdAt: number;
  }>,
  saveData: () => void,
  logActivity?: (title: string, description: string, color?: number) => void,
  puzzleImages?: Array<{
    id: string;
    url: string;
    uploadedBy: string;
    approved: boolean;
    createdAt: number;
  }>,
  giveaways?: Giveaway[]
) {
  const token = process.env.DISCORD_BOT_TOKEN;
  if (!token) {
    console.warn('[DISCORD BOT] DISCORD_BOT_TOKEN not configured in Environment Secrets. Gateway bot will not start.');
    return;
  }

  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.GuildInvites,
      GatewayIntentBits.GuildVoiceStates
    ]
  });

  // Client error handlers for stability ("bot works sometime and sometime not")
  client.on('error', (err) => {
    console.error('[DISCORD BOT GATEWAY ERROR]', err);
  });

  client.on('shardError', (err) => {
    console.error('[DISCORD BOT SHARD ERROR]', err);
  });

  // Cache of invites: guildId -> Map<inviteCode, inviteUses>
  const guildInvites = new Map<string, Map<string, number>>();

  // Helper to fetch and cache invites for a guild
  const cacheGuildInvites = async (guildId: string) => {
    try {
      const guild = client.guilds.cache.get(guildId);
      if (!guild) return;
      const invites = await guild.invites.fetch();
      const codeUses = new Map<string, number>();
      invites.forEach(inv => {
        codeUses.set(inv.code, inv.uses || 0);
      });
      guildInvites.set(guildId, codeUses);
      console.log(`[INVITES] Cached ${invites.size} invites for guild: ${guild.name} (${guildId})`);
    } catch (err) {
      console.warn(`[INVITES] Could not cache invites for guild ${guildId}:`, err);
    }
  };

  // Activity rate limiting & counter maps
  const lastMessageTime = new Map<string, number>();
  const userMessageCounts = new Map<string, number>();

  // Helper: Find farmer by Discord ID
  const findFarmerByDiscordId = (discordId: string): Farmer | null => {
    for (const farmer of Object.values(farmers)) {
      if (farmer.discordId === discordId) {
        return farmer;
      }
    }
    return null;
  };

  // Helper: Get or create farmer profile linked to Discord
  const getOrCreateFarmerByDiscord = (discordId: string, discordUsername: string): Farmer => {
    let farmer = findFarmerByDiscordId(discordId);
    if (!farmer) {
      // Link if website farmer has same name and no Discord ID linked yet
      const websiteFarmer = farmers[discordUsername];
      if (websiteFarmer && !websiteFarmer.discordId) {
        websiteFarmer.discordId = discordId;
        websiteFarmer.discordUsername = discordUsername;
        saveData();
        return websiteFarmer;
      }

      // Create new profile with 100 AP sign-on reward
      farmers[discordUsername] = {
        name: discordUsername,
        points: 100,
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&fit=crop&q=80',
        lastActive: Date.now(),
        discordId,
        discordUsername,
        streak: 0,
        timeOnWebsite: 0,
        invites: 0
      };
      saveData();
      return farmers[discordUsername];
    }
    return farmer;
  };

  const recordBotGamePlayed = (currentFarmer: Farmer, gameKey: string) => {
    if (!currentFarmer.gamesPlayed) {
      currentFarmer.gamesPlayed = {};
    }
    currentFarmer.gamesPlayed[gameKey] = (currentFarmer.gamesPlayed[gameKey] || 0) + 1;
    currentFarmer.totalGamesPlayed = (currentFarmer.totalGamesPlayed || 0) + 1;
    saveData();
  };

  client.once('ready', async () => {
    console.log(`[DISCORD BOT] Logged in successfully as ${client.user?.tag}! Listening to economy commands starting with '+' prefix.`);

    // Register Giveaway Slash Commands
    const commands = [
      {
        name: 'giveaway',
        description: 'Manage and participate in giveaways',
        options: [
          {
            name: 'list',
            description: 'List all active and completed giveaways',
            type: 1
          },
          {
            name: 'enter',
            description: 'Enter an active giveaway',
            type: 1,
            options: [
              {
                name: 'id',
                description: 'The ID of the giveaway to enter',
                type: 3,
                required: true
              }
            ]
          },
          {
            name: 'create',
            description: 'Create a new giveaway (Admin only)',
            type: 1,
            options: [
              {
                name: 'type',
                description: 'The type of prize',
                type: 3,
                required: true,
                choices: [
                  { name: 'Aura Points (ap)', value: 'ap' },
                  { name: 'Custom Discord Role (role)', value: 'role' },
                  { name: 'Minecraft reward (minecraft)', value: 'minecraft' },
                  { name: 'Other (other)', value: 'other' }
                ]
              },
              {
                name: 'prize',
                description: 'The name of the prize',
                type: 3,
                required: true
              },
              {
                name: 'messages',
                description: 'Minimum Discord messages required',
                type: 4,
                required: false
              },
              {
                name: 'games',
                description: 'Minimum arcade games played required',
                type: 4,
                required: false
              },
              {
                name: 'reward_value',
                description: 'Aura points reward value (for ap type giveaways)',
                type: 4,
                required: false
              }
            ]
          },
          {
            name: 'end',
            description: 'End a giveaway and roll the winner (Admin only)',
            type: 1,
            options: [
              {
                name: 'id',
                description: 'The ID of the giveaway to end',
                type: 3,
                required: true
              }
            ]
          }
        ]
      }
    ];

    try {
      const rest = new REST({ version: '10' }).setToken(token);
      console.log('[DISCORD BOT] Registering global slash commands...');
      await rest.put(
        Routes.applicationCommands(client.user!.id),
        { body: commands }
      );
      console.log('[DISCORD BOT] Successfully registered global slash commands.');
    } catch (err) {
      console.error('[DISCORD BOT] Error registering slash commands:', err);
    }

    // Cache invites for target server 1392526036520009779
    await cacheGuildInvites('1392526036520009779');

    // Also cache for any other guilds the bot is in
    for (const [id, guild] of client.guilds.cache) {
      if (id !== '1392526036520009779') {
        await cacheGuildInvites(id);
      }
    }

    // Send status update 5 seconds after boot to channel 1492412169931718656 for immediate testing
    setTimeout(async () => {
      try {
        const channel = await client.channels.fetch('1492412169931718656');
        if (channel && channel.isTextBased()) {
          const totalFarmers = Object.keys(farmers).length;
          const totalPoints = Object.values(farmers).reduce((sum, f) => sum + (f.points || 0), 0);
          
          const startupEmbed = new EmbedBuilder()
            .setTitle('🟢 Aurlets Bot Status Update')
            .setDescription('The Aurlets Economy bot has successfully initialized and is now active!')
            .addFields(
              { name: '🟢 Status', value: 'Online & Active', inline: true },
              { name: '👥 Registered Farmers', value: `${totalFarmers}`, inline: true },
              { name: '💰 Total Economy Wealth', value: `${totalPoints.toLocaleString()} AP`, inline: true }
            )
            .setColor(3066993)
            .setTimestamp();
          
          await (channel as any).send({ embeds: [startupEmbed] });
          console.log('[BOT STATUS] Initial boot status update sent to 1492412169931718656.');
        }
      } catch (err) {
        console.error('[BOT STATUS] Failed to send initial status update:', err);
      }
    }, 5000);

    // Set up Hourly status updates inside 1492412169931718656
    setInterval(async () => {
      try {
        const channel = await client.channels.fetch('1492412169931718656');
        if (channel && channel.isTextBased()) {
          const totalFarmers = Object.keys(farmers).length;
          const totalPoints = Object.values(farmers).reduce((sum, f) => sum + (f.points || 0), 0);
          
          const uptimeMs = client.uptime || 0;
          const hours = Math.floor(uptimeMs / 3600000);
          const mins = Math.floor((uptimeMs % 3600000) / 60000);
          const uptimeStr = `${hours}h ${mins}m`;

          const statusEmbed = new EmbedBuilder()
            .setTitle('🤖 Aurlets Bot - Hourly Status')
            .setDescription('The Aurlets Economy Bot is fully operational and healthy!')
            .addFields(
              { name: '🟢 Status', value: 'Online & Active', inline: true },
              { name: '⏱️ Uptime', value: uptimeStr, inline: true },
              { name: '👥 Registered Farmers', value: `${totalFarmers}`, inline: true },
              { name: '💰 Total Economy Wealth', value: `${totalPoints.toLocaleString()} AP`, inline: true }
            )
            .setColor(3066993)
            .setTimestamp();

          await (channel as any).send({ embeds: [statusEmbed] });
          console.log('[BOT STATUS] Hourly status update sent to 1492412169931718656.');
        }
      } catch (err) {
        console.error('[BOT STATUS] Failed to send hourly status update:', err);
      }
    }, 3600000); // Hourly (3,600,000 ms)

    // Set up VC activity reward scan (every 1 minute)
    setInterval(async () => {
      try {
        const guild = client.guilds.cache.get('1392526036520009779');
        if (!guild) return;

        let awardedCount = 0;
        guild.channels.cache.forEach((channel) => {
          if (channel.isVoiceBased()) {
            const activeMembers = channel.members.filter(m => !m.user.bot);
            activeMembers.forEach((member) => {
              const farmer = getOrCreateFarmerByDiscord(member.id, member.user.username);
              farmer.points = (farmer.points || 0) + 1;
              farmer.lastActive = Date.now();
              awardedCount++;
            });
          }
        });

        if (awardedCount > 0) {
          saveData();
          console.log(`[VC ACTIVITY] Awarded 1 AP to ${awardedCount} members currently active in Voice Channels.`);
        }
      } catch (err) {
        console.error('[VC ACTIVITY] Error in VC scanning loop:', err);
      }
    }, 60000); // 1 minute
  });

  // Keep invites cache in sync
  client.on('inviteCreate', (invite) => {
    if (!invite.guild) return;
    const codeUses = guildInvites.get(invite.guild.id) || new Map<string, number>();
    codeUses.set(invite.code, invite.uses || 0);
    guildInvites.set(invite.guild.id, codeUses);
  });

  client.on('inviteDelete', (invite) => {
    if (!invite.guild) return;
    const codeUses = guildInvites.get(invite.guild.id);
    if (codeUses) {
      codeUses.delete(invite.code);
    }
  });

  // Track member invites on join
  client.on('guildMemberAdd', async (member) => {
    if (member.guild.id !== '1392526036520009779') return;
    try {
      const cachedCodes = guildInvites.get(member.guild.id);
      const newInvites = await member.guild.invites.fetch();
      
      let usedInvite = null;
      if (cachedCodes) {
        for (const [code, inv] of newInvites) {
          const cachedUses = cachedCodes.get(code) || 0;
          if ((inv.uses || 0) > cachedUses) {
            usedInvite = inv;
            break;
          }
        }
      }
      
      // Update cache
      const newCodes = new Map<string, number>();
      newInvites.forEach(inv => {
        newCodes.set(inv.code, inv.uses || 0);
      });
      guildInvites.set(member.guild.id, newCodes);
      
      if (usedInvite && usedInvite.inviter) {
        const inviter = usedInvite.inviter;
        const farmer = getOrCreateFarmerByDiscord(inviter.id, inviter.username);
        
        farmer.points = (farmer.points || 0) + 150;
        farmer.invites = (farmer.invites || 0) + 1;
        farmer.lastActive = Date.now();
        saveData();
        
      }
    } catch (err) {
      console.error('[INVITES] Error tracking member invite on join:', err);
    }
  });

  client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const { commandName, options, user, member, guild } = interaction;

    if (commandName === 'giveaway') {
      const subCommand = options.getSubcommand();
      const authorId = user.id;
      const authorTag = user.username;

      // Get or create farmer profile for this user
      const farmer = getOrCreateFarmerByDiscord(authorId, authorTag);

      const sendEmbedInt = async (title: string, description: string, color = 10181046) => {
        const embed = new EmbedBuilder()
          .setTitle(title)
          .setDescription(description)
          .setColor(color)
          .setTimestamp()
          .setFooter({ text: 'Aurlets Economy System', iconURL: client.user?.displayAvatarURL() });
        await interaction.reply({ embeds: [embed] });
      };

      const sendErrorInt = async (description: string) => {
        await sendEmbedInt('❌ Error', description, 15158332);
      };

      // 1. LIST subCommand
      if (subCommand === 'list') {
        const listGiveaways = giveaways || [];
        if (listGiveaways.length === 0) {
          return sendEmbedInt('🎉 Giveaways List', 'No giveaways have been created yet!');
        }

        let desc = '';
        listGiveaways.forEach(g => {
          const reqs = [];
          if (g.requirements?.discordMessages) reqs.push(`💬 ${g.requirements.discordMessages} Msgs`);
          if (g.requirements?.gamesPlayed) reqs.push(`🎮 ${g.requirements.gamesPlayed} Games`);
          const reqStr = reqs.length > 0 ? reqs.join(', ') : 'No requirements';

          const participantsCount = g.participants ? g.participants.length : 0;
          
          if (g.status === 'active') {
            desc += `🔹 **[ACTIVE] ID:** \`${g.id}\`\n` +
                    `🎁 **Prize:** ${g.prizeName} (${g.prizeType.toUpperCase()})\n` +
                    `📜 **Reqs:** ${reqStr}\n` +
                    `👥 **Participants:** ${participantsCount}\n\n`;
          } else {
            desc += `🔸 **[ENDED] ID:** \`${g.id}\`\n` +
                    `🎁 **Prize:** ${g.prizeName}\n` +
                    `🏆 **Winner:** **${g.winner || 'No participants'}**\n\n`;
          }
        });

        return sendEmbedInt('🎉 Active & Ended Giveaways', desc);
      }

      // 2. ENTER subCommand
      if (subCommand === 'enter') {
        const gId = options.getString('id', true).trim();

        const listGiveaways = giveaways || [];
        const g = listGiveaways.find(x => x.id === gId);
        if (!g) {
          return sendErrorInt(`Giveaway with ID \`${gId}\` not found! Use \`/giveaway list\` to see valid IDs.`);
        }

        if (g.status !== 'active') {
          return sendErrorInt('This giveaway has already ended!');
        }

        if (g.participants.includes(farmer.name)) {
          return sendErrorInt('You have already entered this giveaway!');
        }

        // Verify requirements
        const userMsgs = farmer.discordMessagesCount || 0;
        const userGames = farmer.totalGamesPlayed || 0;

        if (g.requirements?.discordMessages && userMsgs < g.requirements.discordMessages) {
          return sendErrorInt(`❌ You do not meet the Discord messages requirement!\nRequired: **${g.requirements.discordMessages}** | You have: **${userMsgs}**`);
        }

        if (g.requirements?.gamesPlayed && userGames < g.requirements.gamesPlayed) {
          return sendErrorInt(`❌ You do not meet the games played requirement!\nRequired: **${g.requirements.gamesPlayed}** | You have: **${userGames}**`);
        }

        // Add to participants
        g.participants.push(farmer.name);
        saveData();

        return sendEmbedInt(
          '✅ Joined Giveaway!',
          `You have successfully entered the giveaway for **${g.prizeName}**!\n` +
          `Total participants: **${g.participants.length}** 👥`
        );
      }

      // 3. CREATE subCommand (Admin Only)
      if (subCommand === 'create') {
        const isAdmin = member && (member as any).permissions.has(PermissionFlagsBits.Administrator) || authorId === '840560998011502593';
        if (!isAdmin) {
          return sendErrorInt('❌ Only server administrators can create giveaways.');
        }

        const prizeType = options.getString('type', true).toLowerCase();
        const prizeName = options.getString('prize', true);
        const reqMessages = options.getInteger('messages') || 0;
        const reqGames = options.getInteger('games') || 0;
        const rewardValue = options.getInteger('reward_value') || undefined;

        const newId = 'gw_' + Math.random().toString(36).substring(2, 9);
        const newGw: Giveaway = {
          id: newId,
          prizeType: prizeType as any,
          prizeName,
          rewardValue,
          requirements: {
            discordMessages: reqMessages > 0 ? reqMessages : undefined,
            gamesPlayed: reqGames > 0 ? reqGames : undefined
          },
          participants: [],
          startedBy: authorTag,
          startedAt: Date.now(),
          status: 'active'
        };

        if (giveaways) {
          giveaways.push(newGw);
          saveData();
        }

        if (logActivity) {
          logActivity(
            '🎉 New Giveaway Started (Discord Slash)',
            `**${authorTag}** started a giveaway for **${prizeName}** (ID: \`${newId}\`)\n` +
            `Requirements - Messages: **${reqMessages}** | Games Played: **${reqGames}**`,
            10181046
          );
        }

        return sendEmbedInt(
          '🎉 Giveaway Created!',
          `🎁 **Prize:** ${prizeName} (${prizeType.toUpperCase()})\n` +
          `🆔 **Giveaway ID:** \`${newId}\`\n` +
          `📜 **Requirements:** Messages: **${reqMessages}** | Games Played: **${reqGames}**\n\n` +
          `Users can enter by typing: \`/giveaway enter id: ${newId}\` or joining via the Web Dashboard!`
        );
      }

      // 4. END subCommand (Admin Only)
      if (subCommand === 'end') {
        const isAdmin = member && (member as any).permissions.has(PermissionFlagsBits.Administrator) || authorId === '840560998011502593';
        if (!isAdmin) {
          return sendErrorInt('❌ Only server administrators can end giveaways.');
        }

        const gId = options.getString('id', true).trim();

        const listGiveaways = giveaways || [];
        const g = listGiveaways.find(x => x.id === gId);
        if (!g) {
          return sendErrorInt(`Giveaway with ID \`${gId}\` not found!`);
        }

        if (g.status !== 'active') {
          return sendErrorInt('This giveaway has already ended!');
        }

        g.status = 'ended';
        g.endedAt = Date.now();

        if (!g.participants || g.participants.length === 0) {
          g.winner = undefined;
          saveData();
          return sendEmbedInt('🎉 Giveaway Ended!', `The giveaway for **${g.prizeName}** has ended, but there were no participants! 😔`);
        }

        const winnerIndex = Math.floor(Math.random() * g.participants.length);
        const winnerName = g.participants[winnerIndex];
        g.winner = winnerName;

        // Distribute AP rewards automatically if prizeType is ap
        if (g.prizeType === 'ap' && g.rewardValue) {
          const winnerFarmer = farmers[winnerName];
          if (winnerFarmer) {
            winnerFarmer.points = (winnerFarmer.points || 0) + g.rewardValue;
          }
        }

        saveData();

        if (logActivity) {
          logActivity(
            '🎉 Giveaway Ended (Winner Drawn!)',
            `Giveaway **${g.prizeName}** has concluded!\n🏆 **Winner:** **${winnerName}** (from ${g.participants.length} total participants!)`,
            3066993
          );
        }

        return sendEmbedInt(
          '🎉 Giveaway Concluded!',
          `🎁 **Prize:** ${g.prizeName}\n` +
          `🏆 **Winner:** **${winnerName}**!\n` +
          `👥 **Total Entries:** **${g.participants.length}**\n\n` +
          `Congratulations to the winner! 🥳`
        );
      }
    }
  });

  client.on('messageCreate', async (message: Message) => {
    // Ignore bots and webhooks
    if (message.author.bot) return;

    // Award activity points for messages in guild 1392526036520009779
    if (message.guild && message.guild.id === '1392526036520009779') {
      const userId = message.author.id;
      const now = Date.now();
      const lastTime = lastMessageTime.get(userId) || 0;

      // Cooldown of 2 seconds
      if (now - lastTime >= 2000) {
        lastMessageTime.set(userId, now);
        
        const farmer = getOrCreateFarmerByDiscord(userId, message.author.username);
        farmer.discordMessagesCount = (farmer.discordMessagesCount || 0) + 1;
        farmer.lastActive = now;

        const count = (userMessageCounts.get(userId) || 0) + 1;

        // 1 point per 3 messages
        if (count >= 3) {
          userMessageCounts.set(userId, 0);
          farmer.points = (farmer.points || 0) + 1;
          saveData();
          console.log(`[ACTIVITY] Awarded 1 AP to ${message.author.username} for sending 3 messages. Total msgs: ${farmer.discordMessagesCount}`);
        } else {
          userMessageCounts.set(userId, count);
          saveData();
        }
      }
    }

    const content = message.content.trim();
    if (!content.startsWith('+')) return;

    // Split args and extract command name (args now only contains real arguments)
    const args = content.slice(1).split(/ +/);
    const commandName = args.shift()!.toLowerCase();

    // List of valid economy commands handled by this bot
    const VALID_COMMANDS = new Set([
      'help', 'commands',
      'bal', 'balance',
      'profile',
      'daily',
      'beg',
      'work',
      'cf', 'coinflip',
      'slots', 's',
      'bj', 'blackjack',
      'leaderboard', 'lb',
      'give', 'transfer',
      'shop', 'store',
      'buy', 'purchase',
      'customrole', 'cr', 'custom',
      'redeem',
      'website', 'web', 'site',
      'channel',
      'add',
      'remove',
      'set',
      'reset',
      'purge',
      'puzzle',
      'giveaway', 'giveaways'
    ]);

    if (!VALID_COMMANDS.has(commandName)) return;

    const authorId = message.author.id;
    const authorTag = message.author.username;

    // Helper to send embedded responses
    const sendEmbed = (title: string, description: string, color = 10181046) => {
      const embed = new EmbedBuilder()
        .setTitle(title)
        .setDescription(description)
        .setColor(color)
        .setTimestamp()
        .setFooter({ text: 'Aurlets Economy System', iconURL: client.user?.displayAvatarURL() });
      return message.reply({ embeds: [embed] });
    };

    const sendError = (description: string) => {
      return sendEmbed('⚠️ Error', description, 15158332);
    };

    // Parse and retrieve user profile
    const farmer = getOrCreateFarmerByDiscord(authorId, authorTag);

    // --- COOLDOWN TRACKING UTILITIES ---
    const checkCooldown = (type: 'beg' | 'work', ms: number): number => {
      const userCooldowns = cooldowns.get(authorId) || {};
      const lastUsed = userCooldowns[type] || 0;
      const now = Date.now();
      if (now - lastUsed < ms) {
        return ms - (now - lastUsed);
      }
      userCooldowns[type] = now;
      cooldowns.set(authorId, userCooldowns);
      return 0;
    };

    // Helper: Parse Bet Amount (supports custom numbers and 'all')
    const parseBetAmount = (str: string, currentBalance: number): number | string => {
      if (!str) return 'missing';
      if (str.toLowerCase() === 'all') {
        return Math.min(currentBalance, 10000);
      }
      const num = Math.floor(Number(str));
      if (isNaN(num) || num <= 0) return 'invalid';
      return num;
    };

    // Helper: Check and update daily earning caps (5000 net won)
    const checkDailyEarningsLimit = (name: string, netGain: number): { allowed: boolean, capGain: number } => {
      const today = new Date().toISOString().split('T')[0];
      if (!dailyBetEarnings[name]) {
        dailyBetEarnings[name] = {};
      }
      const earnedToday = dailyBetEarnings[name][today] || 0;
      if (earnedToday >= 5000) {
        return { allowed: false, capGain: 0 };
      }
      if (earnedToday + netGain > 5000) {
        return { allowed: true, capGain: 5000 - earnedToday };
      }
      return { allowed: true, capGain: netGain };
    };

    const commitDailyEarnings = (name: string, netGain: number) => {
      const today = new Date().toISOString().split('T')[0];
      if (!dailyBetEarnings[name]) {
        dailyBetEarnings[name] = {};
      }
      dailyBetEarnings[name][today] = (dailyBetEarnings[name][today] || 0) + netGain;
    };

    // Check channel restriction
    if (botConfig.allowedChannelId && message.channel.id !== botConfig.allowedChannelId) {
      // Allow admin/mod commands and help anywhere
      const bypassCommands = ['channel', 'add', 'remove', 'set', 'reset', 'purge', 'help', 'commands'];
      if (!bypassCommands.includes(commandName)) {
        return sendError(`❌ Economy commands can only be used in the <#${botConfig.allowedChannelId}> channel!`);
      }
    }

    // ==========================================
    // 1. HELP COMMAND
    // ==========================================
    if (commandName === 'help' || commandName === 'commands') {
      const description = `Welcome to **Aurlets Economy System**! Here are the commands you can play directly from Discord. Any points you earn are **instantly updated** on the website!\n\n` +
        `🪙 **Games & Gambling:**\n` +
        `• \`+cf <amount> [heads/tails]\` - Bet your AP on a coin flip. Capped at 10k/bet. (e.g. \`+cf 50 heads\`)\n` +
        `• \`+bj <amount>\` - Play Blackjack against the Dealer using buttons! Capped at 10k/bet. (e.g. \`+bj 100\`)\n` +
        `• \`+slots <amount>\` - Spin the slot machine for big wins! Capped at 10k/bet. (e.g. \`+slots 50\`)\n` +
        `• \`+puzzle deposit\` - Deposit an attached image (or reply to one) as a custom slide puzzle image!\n\n` +
        `💸 **Earning AP:**\n` +
        `• \`+beg\` - Beg generous strangers for pocket points (5 min cooldown).\n` +
        `• \`+work\` - Work funny jobs around the server to make a salary (30 min cooldown).\n` +
        `• \`+daily\` - Claim your daily reward of up to **10 AP** (only 1 claim per 24h shared between Web and Discord!).\n\n` +
        `🛍️ **Reward Shop & Custom Roles:**\n` +
        `• \`+shop\` - View roles and items available in the Reward Shop.\n` +
        `• \`+buy <number/name>\` - Buy a server role from the Shop (e.g. \`+buy 1\`)\n` +
        `• \`+redeem <code>\` - Redeem a promo/rewards code for Aura Points (e.g. \`+redeem AURLETS100\`)\n` +
        `• \`+customrole\` (or \`+cr\`) - Get the direct link to configure/buy your premium Custom Discord Role!\n` +
        `• \`+website\` (or \`+web\`, \`+site\`) - Get the official link to the Aurlets web dashboard!\n\n` +
        `📊 **User & Rankings:**\n` +
        `• \`+bal [user]\` - Check your points balance and streak. Mention a user to check theirs!\n` +
        `• \`+profile [user]\` - View detailed Aurlets player profile including streak, time on website, and invites.\n` +
        `• \`+give <@user> <amount>\` - Safe points transfer to another user. (e.g. \`+give @user 50\`)\n` +
        `• \`+leaderboard\` (or \`+lb\`) - Show Top 10 Aurlets Players.\n\n` +
        `🛡️ **Admin & Moderation Commands:**\n` +
        `• \`+add <@user> <amount>\` - Add points to a user (Admin Only).\n` +
        `• \`+remove <@user> <amount>\` - Remove points from a user (Admin Only).\n` +
        `• \`+set <@user> <amount>\` - Set exact points for a user (Admin Only).\n` +
        `• \`+reset <@user>\` - Reset a user's points & streak to 0 (Admin Only).\n` +
        `• \`+purge <quantity>\` / \`+purge <@user/humans/bots> <quantity>\` - Delete messages from a channel (Manage Messages permission required).`;
      return sendEmbed('📋 Aurlets Economy Bot Instructions', description, 3447003);
    }

    // ==========================================
    // 2. BALANCE COMMAND
    // ==========================================
    if (commandName === 'bal' || commandName === 'balance') {
      const mentionedUser = message.mentions.users.first();
      if (mentionedUser) {
        const targetFarmer = getOrCreateFarmerByDiscord(mentionedUser.id, mentionedUser.username);
        return sendEmbed(
          `💰 ${targetFarmer.name}'s Balance`,
          `User **${targetFarmer.name}** holds **${targetFarmer.points} AP**!\n🔥 Daily Streak: **${targetFarmer.streak || 0} days**`,
          3447003
        );
      } else {
        return sendEmbed(
          `💰 Your Balance`,
          `You hold **${farmer.points} AP**!\n🔥 Daily Streak: **${farmer.streak || 0} days**`,
          3447003
        );
      }
    }

    // ==========================================
    // 2.5 PROFILE COMMAND
    // ==========================================
    if (commandName === 'profile') {
      const mentionedUser = message.mentions.users.first();
      let targetFarmer: Farmer | null = null;
      let targetUserObj: any = null;
      const searchName = args[0];

      if (mentionedUser) {
        targetFarmer = getOrCreateFarmerByDiscord(mentionedUser.id, mentionedUser.username);
        targetUserObj = mentionedUser;
      } else if (searchName) {
        const cleanSearch = searchName.toLowerCase().trim();
        targetFarmer = Object.values(farmers).find(f => f.name.toLowerCase() === cleanSearch || f.discordUsername?.toLowerCase() === cleanSearch) || null;
      } else {
        targetFarmer = farmer;
        targetUserObj = message.author;
      }

      if (!targetFarmer) {
        return sendError('Could not find that player profile. Specify a mentioned user or exact username. (e.g. `+profile @user` or `+profile John`)');
      }

      const points = targetFarmer.points || 0;
      const streak = targetFarmer.streak || 0;
      const timeSecs = targetFarmer.timeOnWebsite || 0;
      const invites = targetFarmer.invites || 0;
      const invitedBy = targetFarmer.invitedBy || 'Nobody';
      const lastActiveDate = targetFarmer.lastActive ? new Date(targetFarmer.lastActive).toLocaleDateString() : 'Never';

      const embed = new EmbedBuilder()
        .setTitle(`👤 Player Profile: ${targetFarmer.name}`)
        .setColor(3447003) // Cyan
        .addFields(
          { name: '🪙 Aura Points (AP)', value: `**${points.toLocaleString()} AP**`, inline: true },
          { name: '🔥 Daily Streak', value: `**${streak} days**`, inline: true },
          { name: '⏱️ Time Spent on Web', value: `**${formatTimeOnWebsite(timeSecs)}**`, inline: true },
          { name: '👥 Referrals/Invites', value: `**${invites} invites**`, inline: true },
          { name: '🤝 Invited By', value: `\`${invitedBy}\``, inline: true },
          { name: '📅 Last Active', value: `\`${lastActiveDate}\``, inline: true }
        )
        .setTimestamp()
        .setFooter({ text: 'Aurlets Economy System • Player Card' });

      // Use target user's avatar if available, otherwise fallback to their database avatarUrl
      if (targetUserObj) {
        const avatarUrl = targetUserObj.displayAvatarURL({ dynamic: true });
        embed.setThumbnail(avatarUrl);
      } else if (targetFarmer.avatarUrl) {
        embed.setThumbnail(targetFarmer.avatarUrl);
      }

      return message.reply({ embeds: [embed] });
    }

    // ==========================================
    // 3. DAILY COMMAND (Shared Web & Discord)
    // ==========================================
    if (commandName === 'daily') {
      const now = Date.now();
      const lastClaim = lastDailyClaims[farmer.name] || lastDailyClaims[farmer.discordId || ''] || 0;
      const COOLDOWN_MS = 24 * 60 * 60 * 1000;

      if (now - lastClaim < COOLDOWN_MS) {
        const remaining = COOLDOWN_MS - (now - lastClaim);
        const hours = Math.floor(remaining / (3600 * 1000));
        const mins = Math.floor((remaining % (3600 * 1000)) / (60 * 1000));
        return sendError(`⏳ You already claimed your daily reward! Try again in **${hours}h ${mins}m**.\n*(Note: This reward is shared with your website claims!)*`);
      }

      const rewardAmount = Math.floor(Math.random() * 10) + 1;
      
      // Update cooldown on both username and discordId to be robust!
      lastDailyClaims[farmer.name] = now;
      if (farmer.discordId) {
        lastDailyClaims[farmer.discordId] = now;
      }

      let currentStreak = 1;
      const maxStreakWindow = 48 * 60 * 60 * 1000;
      if (lastClaim > 0 && now - lastClaim <= maxStreakWindow) {
        currentStreak = (farmer.streak || 0) + 1;
      } else {
        currentStreak = 1;
      }

      farmer.streak = currentStreak;
      farmer.points = (farmer.points || 0) + rewardAmount;
      farmer.lastActive = now;
      saveData();

      return sendEmbed(
        '🎁 Daily Reward Claimed!',
        `You claimed **${rewardAmount} Aura Points**!\n🌟 New Balance: **${farmer.points} AP**\n🔥 Streak: **${currentStreak} days**`,
        3066993 // Emerald Green
      );
    }

    // ==========================================
    // 4. BEG COMMAND (5 min cooldown)
    // ==========================================
    if (commandName === 'beg') {
      const cdLeft = checkCooldown('beg', 300000); // 5 minutes
      if (cdLeft > 0) {
        const mins = Math.floor(cdLeft / 60000);
        const secs = Math.ceil((cdLeft % 60000) / 1000);
        const timeStr = mins > 0 ? `**${mins}m ${secs}s**` : `**${secs} seconds**`;
        return sendError(`⏳ Calm down! You are begging too much. Wait another ${timeStr}.`);
      }

      const isSuccess = Math.random() < 0.65; // 65% success rate
      if (isSuccess) {
        const amountGained = Math.floor(Math.random() * 15) + 2; // 2 to 16 points
        farmer.points = (farmer.points || 0) + amountGained;
        farmer.lastActive = Date.now();
        saveData();

        const successMemeTexts = [
          `A generous stranger looked at you with pity and handed you **${amountGained} AP**!`,
          `You clean-swept the local mosque floor and a passing uncle gifted you **${amountGained} AP**!`,
          `You did puppy dog eyes at the server Admin, and they dropped **${amountGained} AP**!`,
          `You found a misplaced wallet containing **${amountGained} AP**! You kept it. No regrets.`
        ];
        const text = successMemeTexts[Math.floor(Math.random() * successMemeTexts.length)];
        return sendEmbed('🥺 Beg Success', text, 3066993);
      } else {
        const failMemeTexts = [
          `A rude rich guy walked past and threw a half-eaten banana at you instead of AP.`,
          `The server Admin looked at your request and kicked sand into your face.`,
          `You tried to beg, but you tripped, fell, and everyone laughed at you. 0 AP earned.`,
          `"Go get a real job!" yelled an old lady while hitting you with her purse.`
        ];
        const text = failMemeTexts[Math.floor(Math.random() * failMemeTexts.length)];
        return sendEmbed('💀 Beg Failed', text, 15158332);
      }
    }

    // ==========================================
    // 5. WORK COMMAND (30 mins cooldown)
    // ==========================================
    if (commandName === 'work') {
      const cdLeft = checkCooldown('work', 1800000); // 30 minutes
      if (cdLeft > 0) {
        const mins = Math.floor(cdLeft / 60000);
        const secs = Math.ceil((cdLeft % 60000) / 1000);
        return sendError(`⏳ Take a break! You are working yourself to the bone. Wait **${mins}m ${secs}s** before your next shift.`);
      }

      const salary = Math.floor(Math.random() * 36) + 15; // 15 to 50 AP
      farmer.points = (farmer.points || 0) + salary;
      farmer.lastActive = Date.now();
      saveData();

      const jobs = [
        `You moderated the Discord server for 4 hours, banned 3 trolls, and earned **${salary} AP**!`,
        `You wrote a couple of clean React hook files for the website and was paid a premium of **${salary} AP**!`,
        `You streamed cricket matches for the server members and gathered a total tip of **${salary} AP**!`,
        `You worked a shift at the virtual Aurlets juice stand, selling fresh fruit cups for **${salary} AP**!`,
        `You polished the server's database indexes, saving the website from crashing, and was rewarded **${salary} AP**!`,
        `You stayed AFK in the voice channel singing late-night mehfil songs and collected **${salary} AP** in donations!`
      ];
      const text = jobs[Math.floor(Math.random() * jobs.length)];
      return sendEmbed('💼 Shift Completed!', text, 3066993);
    }

    // ==========================================
    // 6. COINFLIP COMMAND
    // ==========================================
    if (commandName === 'cf' || commandName === 'coinflip') {
      const betStr = args[0];
      let choice = args[1]?.toLowerCase();

      // Flexible syntax: support "+cf heads 100" and "+cf 100 heads"
      let finalBetStr = betStr;
      if (['heads', 'tails', 'h', 't'].includes(betStr?.toLowerCase())) {
        choice = betStr.toLowerCase();
        finalBetStr = args[1];
      }

      const parsedBet = parseBetAmount(finalBetStr, farmer.points);
      if (parsedBet === 'missing') {
        return sendError('Usage: `+cf <amount> <heads/tails>` (e.g. \`+cf 50 heads\`)');
      }
      if (parsedBet === 'invalid') {
        return sendError('Please provide a valid betting amount or type `all`.');
      }

      const bet = parsedBet as number;
      if (bet < 5) {
        return sendError('Minimum bet is **5 Aura Points (AP)**.');
      }
      if (bet > 10000) {
        return sendError('Maximum bet is **10,000 Aura Points (AP)** at a time.');
      }
      if (farmer.points < bet) {
        return sendError(`Insufficient balance! You tried to bet **${bet} AP** but only hold **${farmer.points} AP**.`);
      }

      // Default to heads if choice omitted
      if (!choice) choice = 'heads';
      if (choice === 'h') choice = 'heads';
      if (choice === 't') choice = 'tails';

      if (choice !== 'heads' && choice !== 'tails') {
        return sendError('Invalid choice! Choose either `heads` (h) or `tails` (t).');
      }

      // Respect daily limit (5000 AP net earnings)
      const limits = checkDailyEarningsLimit(farmer.name, bet);
      if (!limits.allowed) {
        return sendError('You have reached your daily maximum betting earnings limit of **5000 AP** on the web/discord! Try again tomorrow.');
      }

      // Reduce win rate of coinflip to 45% as requested by user
      const won = Math.random() < 0.45;
      const coinResult = won ? choice : (choice === 'heads' ? 'tails' : 'heads');

      let gain = 0;
      let outputText = '';
      let color = 15158332;

      if (won) {
        gain = limits.capGain;
        farmer.points += gain;
        commitDailyEarnings(farmer.name, gain);
        color = 3066993;

        const limitCappedText = (gain < bet) ? ` (Capped by 5000 daily earnings limit!)` : '';
        outputText = `The coin landed on **🪙 ${coinResult.toUpperCase()}**.\n\n🎉 **Victory!** You guessed correctly and won **+${gain} AP**!${limitCappedText}\n👛 New Balance: **${farmer.points} AP**`;
      } else {
        farmer.points -= bet;
        outputText = `The coin landed on **🪙 ${coinResult.toUpperCase()}**.\n\n💀 **Loss!** You guessed wrong and lost **-${bet} AP**.\n👛 New Balance: **${farmer.points} AP**`;
      }

      farmer.lastActive = Date.now();
      saveData();

      return sendEmbed(won ? '🪙 Coinflip Won!' : '🪙 Coinflip Lost', outputText, color);
    }

    // ==========================================
    // 7. SLOTS COMMAND
    // ==========================================
    if (commandName === 'slots' || commandName === 's') {
      const parsedBet = parseBetAmount(args[0], farmer.points);
      if (parsedBet === 'missing') {
        return sendError('Usage: \`+slots <amount>\` (e.g. \`+slots 100\`)');
      }
      if (parsedBet === 'invalid') {
        return sendError('Please provide a valid betting amount or type `all`.');
      }

      const bet = parsedBet as number;
      if (bet < 5) {
        return sendError('Minimum bet is **5 Aura Points (AP)**.');
      }
      if (bet > 10000) {
        return sendError('Maximum bet is **10,000 Aura Points (AP)** at a time.');
      }
      if (farmer.points < bet) {
        return sendError(`Insufficient points! You tried to spin with **${bet} AP** but only have **${farmer.points} AP**.`);
      }

      // Check if user has already hit the daily limit
      const limits = checkDailyEarningsLimit(farmer.name, 1);
      if (!limits.allowed) {
        return sendError('You have reached your daily maximum betting earnings limit of **5000 AP** on the web/discord! Try again tomorrow.');
      }

      const emojis = ['🍒', '🍋', '💎', '🔔', '🍇', '💀'];
      const reel1 = emojis[Math.floor(Math.random() * emojis.length)];
      const reel2 = emojis[Math.floor(Math.random() * emojis.length)];
      const reel3 = emojis[Math.floor(Math.random() * emojis.length)];

      let multiplier = 0;
      let outcomeText = '';
      let netWinnings = 0;
      let isJackpot = false;

      if (reel1 === reel2 && reel2 === reel3) {
        multiplier = 5;
        netWinnings = bet * 4;
        isJackpot = true;
        outcomeText = `🎰 **JACKPOT!** 3 matching symbols! You win **${bet * 5} AP** (+${netWinnings} net)!`;
      } else if (reel1 === reel2 || reel2 === reel3 || reel1 === reel3) {
        multiplier = 1.5;
        netWinnings = Math.floor(bet * 0.5);
        outcomeText = `🎉 **Nice!** 2 matching symbols! You win **${Math.floor(bet * 1.5)} AP** (+${netWinnings} net)!`;
      } else {
        multiplier = 0;
        netWinnings = -bet;
        outcomeText = `💀 **Better luck next time!** No matches. You lost **${bet} AP**.`;
      }

      if (netWinnings > 0) {
        const netLimit = checkDailyEarningsLimit(farmer.name, netWinnings);
        if (netLimit.capGain < netWinnings) {
          netWinnings = netLimit.capGain;
          if (isJackpot) {
            outcomeText = `🎰 **JACKPOT CAPPED!** You won **+${netWinnings} AP** (Capped to 5000 daily earnings limit!)`;
          } else {
            outcomeText = `🎉 **Nice! Capped!** You won **+${netWinnings} AP** (Capped to 5000 daily earnings limit!)`;
          }
        }
        farmer.points += netWinnings;
        commitDailyEarnings(farmer.name, netWinnings);
      } else {
        farmer.points += netWinnings; // Subtracting bet
      }

      farmer.lastActive = Date.now();
      saveData();

      const slotsColor = netWinnings > 0 ? 3066993 : 15158332;
      return sendEmbed(
        '🎰 Slot Machine',
        `Reels: \`[ ${reel1} | ${reel2} | ${reel3} ]\`\n\n${outcomeText}\n👛 New Balance: **${farmer.points} AP**`,
        slotsColor
      );
    }

    // ==========================================
    // 8. BLACKJACK COMMAND (with interactive Buttons!)
    // ==========================================
    if (commandName === 'bj' || commandName === 'blackjack') {
      if (activeBlackjackGames.has(authorId)) {
        return sendError('You already have an active Blackjack game session! Finish that one first.');
      }

      const parsedBet = parseBetAmount(args[0], farmer.points);
      if (parsedBet === 'missing') {
        return sendError('Usage: \`+bj <amount>\` (e.g. \`+bj 150\`)');
      }
      if (parsedBet === 'invalid') {
        return sendError('Please provide a valid betting amount or type `all`.');
      }

      const bet = parsedBet as number;
      if (bet < 5) {
        return sendError('Minimum bet is **5 Aura Points (AP)**.');
      }
      if (bet > 10000) {
        return sendError('Maximum bet is **10,000 Aura Points (AP)** at a time.');
      }
      if (farmer.points < bet) {
        return sendError(`Insufficient balance! You tried to play with **${bet} AP** but only have **${farmer.points} AP**.`);
      }

      // Check daily earning limit
      const limits = checkDailyEarningsLimit(farmer.name, bet);
      if (!limits.allowed) {
        return sendError('You have reached your daily maximum betting earnings limit of **5000 AP** on the web/discord! Try again tomorrow.');
      }

      // Start blackjack game
      const deck = createDeck();
      const playerHand = [deck.pop()!, deck.pop()!];
      const dealerHand = [deck.pop()!, deck.pop()!];

      const playerScore = calculateHandScore(playerHand);
      const dealerScore = calculateHandScore(dealerHand);

      const embed = new EmbedBuilder()
        .setTitle('🃏 Blackjack Table')
        .setColor(10181046)
        .addFields(
          { name: `🧑 Your Hand (${playerScore})`, value: playerHand.join(' | '), inline: true },
          { name: `Dealer's Hand (${getCardValue(dealerHand[0])})`, value: `${dealerHand[0]} | ❓ Hidden`, inline: true }
        )
        .setDescription(`Bet Amount: **${bet} AP**\n\nClick **Hit** to draw a card, **Stand** to hold your score, or **Double Down** to double your bet and draw exactly 1 card.`)
        .setTimestamp()
        .setFooter({ text: 'Blackjack Table • Aurlets Economy' });

      // Action buttons
      const hitBtn = new ButtonBuilder()
        .setCustomId('bj_hit')
        .setLabel('Hit')
        .setStyle(ButtonStyle.Success);

      const standBtn = new ButtonBuilder()
        .setCustomId('bj_stand')
        .setLabel('Stand')
        .setStyle(ButtonStyle.Danger);

      const doubleBtn = new ButtonBuilder()
        .setCustomId('bj_double')
        .setLabel('Double Down')
        .setStyle(ButtonStyle.Primary)
        .setDisabled(farmer.points < bet * 2);

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(hitBtn, standBtn, doubleBtn);

      const replyMsg = await message.reply({
        embeds: [embed],
        components: [row]
      });

      // If natural blackjack immediately
      if (playerScore === 21) {
        // Natural victory or tie
        let netWon = 0;
        let finalDesc = '';
        let resultColor = 3066993;

        if (dealerScore === 21) {
          finalDesc = `🤝 **Both got Blackjack!** It's a push/tie. You kept your points.`;
          resultColor = 15844367; // Gold
        } else {
          // Blackjack pays 1.5x payout usually, or just 1x. Let's do 1.5x (net profit of 1.5x bet)
          const multiplierProfit = 1.5;
          const blackjackNet = Math.floor(bet * multiplierProfit);
          const betLimit = checkDailyEarningsLimit(farmer.name, blackjackNet);
          netWon = betLimit.capGain;

          farmer.points += netWon;
          commitDailyEarnings(farmer.name, netWon);
          finalDesc = `🎉 **Natural Blackjack (21)!** You won **+${netWon} AP**!${netWon < blackjackNet ? ' (Capped by 5000 limit)' : ''}`;
        }

        embed.setDescription(finalDesc)
          .setColor(resultColor)
          .setFields(
            { name: `🧑 Your Hand (${playerScore})`, value: playerHand.join(' | '), inline: true },
            { name: `Dealer's Hand (${dealerScore})`, value: dealerHand.join(' | '), inline: true }
          );

        saveData();
        await replyMsg.edit({ embeds: [embed], components: [] });
        return;
      }

      // Store in active games map
      activeBlackjackGames.set(authorId, {
        bet,
        playerHand,
        dealerHand,
        deck,
        messageId: replyMsg.id
      });

      // Collector for button interactions
      const collector = replyMsg.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: 90000 // 90 seconds timeout
      });

      collector.on('collect', async (interaction) => {
        // Only the player who started can click
        if (interaction.user.id !== authorId) {
          await interaction.reply({ content: '⚠️ This is not your game session! Start your own with `+bj <amount>`.', ephemeral: true });
          return;
        }

        const game = activeBlackjackGames.get(authorId);
        if (!game) {
          await interaction.reply({ content: 'Game state not found or already finished.', ephemeral: true });
          return;
        }

        await interaction.deferUpdate();

        const customId = interaction.customId;

        // Fetch user state again to verify balance changes
        const currentFarmer = getOrCreateFarmerByDiscord(authorId, interaction.user.username);

        if (customId === 'bj_hit') {
          // Draw card
          const drawn = game.deck.pop()!;
          game.playerHand.push(drawn);
          const score = calculateHandScore(game.playerHand);

          if (score > 21) {
            // Bust! Loss
            currentFarmer.points -= game.bet;
            recordBotGamePlayed(currentFarmer, 'blackjack');
            activeBlackjackGames.delete(authorId);
            collector.stop();

            const bustEmbed = new EmbedBuilder()
              .setTitle('💀 Blackjack Bust!')
              .setColor(15158332)
              .setDescription(`You drew **${drawn}** and busted with a score of **${score}**! You lost **-${game.bet} AP**.\n\n👛 Balance: **${currentFarmer.points} AP**`)
              .addFields(
                { name: `🧑 Your Hand (${score})`, value: game.playerHand.join(' | '), inline: true },
                { name: `Dealer's Hand (${calculateHandScore(game.dealerHand)})`, value: game.dealerHand.join(' | '), inline: true }
              )
              .setTimestamp()
              .setFooter({ text: 'Busted! • Aurlets Economy' });

            await replyMsg.edit({ embeds: [bustEmbed], components: [] });
            return;
          }

          // Otherwise update embed
          const updatedEmbed = EmbedBuilder.from(embed)
            .setFields(
              { name: `🧑 Your Hand (${score})`, value: game.playerHand.join(' | '), inline: true },
              { name: `Dealer's Hand (${getCardValue(game.dealerHand[0])})`, value: `${game.dealerHand[0]} | ❓ Hidden`, inline: true }
            );

          // If exactly 21, stand automatically
          if (score === 21) {
            collector.stop();
            await standLogic(replyMsg, authorId, currentFarmer);
          } else {
            await replyMsg.edit({ embeds: [updatedEmbed] });
          }
        } 
        else if (customId === 'bj_double') {
          // Double bet
          if (currentFarmer.points < game.bet * 2) {
            await interaction.followUp({ content: '⚠️ You do not have enough points to Double Down!', ephemeral: true });
            return;
          }

          // Respect double-bet limits
          const limitsDouble = checkDailyEarningsLimit(currentFarmer.name, game.bet * 2);
          if (!limitsDouble.allowed) {
            await interaction.followUp({ content: '⚠️ Double-down winnings would exceed your daily AP limit! Stand or hit instead.', ephemeral: true });
            return;
          }

          game.bet *= 2;
          const drawn = game.deck.pop()!;
          game.playerHand.push(drawn);
          const score = calculateHandScore(game.playerHand);

          if (score > 21) {
            currentFarmer.points -= game.bet;
            recordBotGamePlayed(currentFarmer, 'blackjack');
            activeBlackjackGames.delete(authorId);
            collector.stop();

            const bustEmbed = new EmbedBuilder()
              .setTitle('💀 Blackjack Bust!')
              .setColor(15158332)
              .setDescription(`Double Down card: **${drawn}**.\nBusted with **${score}**! You lost **-${game.bet} AP**.\n\n👛 Balance: **${currentFarmer.points} AP**`)
              .addFields(
                { name: `🧑 Your Hand (${score})`, value: game.playerHand.join(' | '), inline: true },
                { name: `Dealer's Hand (${calculateHandScore(game.dealerHand)})`, value: game.dealerHand.join(' | '), inline: true }
              )
              .setTimestamp();

            await replyMsg.edit({ embeds: [bustEmbed], components: [] });
          } else {
            collector.stop();
            await standLogic(replyMsg, authorId, currentFarmer);
          }
        } 
        else if (customId === 'bj_stand') {
          collector.stop();
          await standLogic(replyMsg, authorId, currentFarmer);
        }
      });

      collector.on('end', async (collected, reason) => {
        // If expired without interaction
        if (reason === 'time' && activeBlackjackGames.has(authorId)) {
          const game = activeBlackjackGames.get(authorId)!;
          activeBlackjackGames.delete(authorId);
          farmer.points -= game.bet;
          saveData();

          const timeoutEmbed = new EmbedBuilder()
            .setTitle('⏳ Blackjack Expired')
            .setColor(15158332)
            .setDescription(`Game session timed out due to inactivity! You forfeited **-${game.bet} AP**.\n👛 Balance: **${farmer.points} AP**`);

          await replyMsg.edit({ embeds: [timeoutEmbed], components: [] }).catch(() => {});
        }
      });
    }

    // Blackjack Dealer Play logic helper
    async function standLogic(replyMsg: any, playerId: string, currentFarmer: Farmer) {
      const game = activeBlackjackGames.get(playerId);
      if (!game) return;
      activeBlackjackGames.delete(playerId);

      const playerScore = calculateHandScore(game.playerHand);
      let dealerScore = calculateHandScore(game.dealerHand);

      // Dealer draws until 17 or higher
      while (dealerScore < 17) {
        game.dealerHand.push(game.deck.pop()!);
        dealerScore = calculateHandScore(game.dealerHand);
      }

      let outcomeTitle = '';
      let outcomeDesc = '';
      let outcomeColor = 15844367; // default tie

      if (dealerScore > 21) {
        // Dealer busts, player wins
        const winLimit = checkDailyEarningsLimit(currentFarmer.name, game.bet);
        const gained = winLimit.capGain;
        currentFarmer.points += gained;
        commitDailyEarnings(currentFarmer.name, gained);

        outcomeTitle = '🎉 Victory! Dealer Busts!';
        outcomeDesc = `Dealer scored **${dealerScore}** and busted! You won **+${gained} AP**!${gained < game.bet ? ' (Capped by limit)' : ''}`;
        outcomeColor = 3066993;
      } 
      else if (playerScore > dealerScore) {
        // Player wins
        const winLimit = checkDailyEarningsLimit(currentFarmer.name, game.bet);
        const gained = winLimit.capGain;
        currentFarmer.points += gained;
        commitDailyEarnings(currentFarmer.name, gained);

        outcomeTitle = '🎉 Blackjack Win!';
        outcomeDesc = `Your score: **${playerScore}** | Dealer's score: **${dealerScore}**.\n\nYou won **+${gained} AP**!${gained < game.bet ? ' (Capped by limit)' : ''}`;
        outcomeColor = 3066993;
      } 
      else if (playerScore < dealerScore) {
        // Dealer wins, player loses
        currentFarmer.points -= game.bet;
        outcomeTitle = '💀 Dealer Wins';
        outcomeDesc = `Your score: **${playerScore}** | Dealer's score: **${dealerScore}**.\n\nYou lost **-${game.bet} AP**.`;
        outcomeColor = 15158332;
      } 
      else {
        // Tie
        outcomeTitle = '🤝 Push/Tie!';
        outcomeDesc = `Both you and dealer scored **${playerScore}**! Points remain unchanged.`;
        outcomeColor = 15844367;
      }

      currentFarmer.lastActive = Date.now();
      recordBotGamePlayed(currentFarmer, 'blackjack');

      const finalEmbed = new EmbedBuilder()
        .setTitle(outcomeTitle)
        .setDescription(`${outcomeDesc}\n\n👛 Current Balance: **${currentFarmer.points} AP**`)
        .setColor(outcomeColor)
        .addFields(
          { name: `🧑 Your Hand (${playerScore})`, value: game.playerHand.join(' | '), inline: true },
          { name: `Dealer's Hand (${dealerScore})`, value: game.dealerHand.join(' | '), inline: true }
        )
        .setTimestamp()
        .setFooter({ text: 'Blackjack Table Ended' });

      await replyMsg.edit({ embeds: [finalEmbed], components: [] });
    }

    // ==========================================
    // 9. LEADERBOARD COMMAND (with interactive Buttons!)
    // ==========================================
    if (commandName === 'leaderboard' || commandName === 'lb') {
      const farmersList = Object.values(farmers);
      let activeCategory: 'points' | 'streak' | 'web_time' | 'invites' = 'points';

      // Helper to generate the ActionRow for buttons
      const getLeaderboardRow = (currentCategory: 'points' | 'streak' | 'web_time' | 'invites') => {
        const pointsBtn = new ButtonBuilder()
          .setCustomId('lb_points')
          .setLabel('Points 🪙')
          .setStyle(currentCategory === 'points' ? ButtonStyle.Primary : ButtonStyle.Secondary);

        const streakBtn = new ButtonBuilder()
          .setCustomId('lb_streak')
          .setLabel('Streak 🔥')
          .setStyle(currentCategory === 'streak' ? ButtonStyle.Primary : ButtonStyle.Secondary);

        const timeBtn = new ButtonBuilder()
          .setCustomId('lb_web_time')
          .setLabel('Web Time ⏱️')
          .setStyle(currentCategory === 'web_time' ? ButtonStyle.Primary : ButtonStyle.Secondary);

        const invitesBtn = new ButtonBuilder()
          .setCustomId('lb_invites')
          .setLabel('Invites 👥')
          .setStyle(currentCategory === 'invites' ? ButtonStyle.Primary : ButtonStyle.Secondary);

        return new ActionRowBuilder<ButtonBuilder>().addComponents(pointsBtn, streakBtn, timeBtn, invitesBtn);
      };

      const initialEmbed = getLeaderboardEmbed(activeCategory, farmersList);
      const initialRow = getLeaderboardRow(activeCategory);

      const replyMsg = await message.reply({
        embeds: [initialEmbed],
        components: [initialRow]
      });

      // Collector for button interactions
      const collector = replyMsg.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: 90000 // 90 seconds timeout
      });

      collector.on('collect', async (interaction) => {
        // Only the player who requested the leaderboard can switch categories
        if (interaction.user.id !== authorId) {
          await interaction.reply({ 
            content: '⚠️ Only the user who executed `+leaderboard` can switch categories here. Please type `+leaderboard` to view and explore yourself!', 
            ephemeral: true 
          });
          return;
        }

        await interaction.deferUpdate();

        const customId = interaction.customId;
        if (customId === 'lb_points') {
          activeCategory = 'points';
        } else if (customId === 'lb_streak') {
          activeCategory = 'streak';
        } else if (customId === 'lb_web_time') {
          activeCategory = 'web_time';
        } else if (customId === 'lb_invites') {
          activeCategory = 'invites';
        }

        const updatedEmbed = getLeaderboardEmbed(activeCategory, Object.values(farmers));
        const updatedRow = getLeaderboardRow(activeCategory);

        await replyMsg.edit({
          embeds: [updatedEmbed],
          components: [updatedRow]
        });
      });

      collector.on('end', async () => {
        // Disable all buttons when timed out
        const disabledPointsBtn = new ButtonBuilder()
          .setCustomId('lb_points')
          .setLabel('Points 🪙')
          .setStyle(activeCategory === 'points' ? ButtonStyle.Primary : ButtonStyle.Secondary)
          .setDisabled(true);

        const disabledStreakBtn = new ButtonBuilder()
          .setCustomId('lb_streak')
          .setLabel('Streak 🔥')
          .setStyle(activeCategory === 'streak' ? ButtonStyle.Primary : ButtonStyle.Secondary)
          .setDisabled(true);

        const disabledTimeBtn = new ButtonBuilder()
          .setCustomId('lb_web_time')
          .setLabel('Web Time ⏱️')
          .setStyle(activeCategory === 'web_time' ? ButtonStyle.Primary : ButtonStyle.Secondary)
          .setDisabled(true);

        const disabledInvitesBtn = new ButtonBuilder()
          .setCustomId('lb_invites')
          .setLabel('Invites 👥')
          .setStyle(activeCategory === 'invites' ? ButtonStyle.Primary : ButtonStyle.Secondary)
          .setDisabled(true);

        const disabledRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
          disabledPointsBtn, 
          disabledStreakBtn, 
          disabledTimeBtn, 
          disabledInvitesBtn
        );

        await replyMsg.edit({
          components: [disabledRow]
        }).catch(() => {});
      });

      return;
    }

    // ==========================================
    // 10. GIVE COMMAND
    // ==========================================
    if (commandName === 'give' || commandName === 'transfer') {
      const mentioned = message.mentions.users.first();
      const amountStr = args[1];

      if (!mentioned) {
        return sendError('Usage: \`+give <@user> <amount>\` (e.g. \`+give @username 50\`)');
      }

      const parsedAmount = parseBetAmount(amountStr, farmer.points);
      if (parsedAmount === 'missing' || parsedAmount === 'invalid') {
        return sendError('Please specify a valid point amount to transfer.');
      }

      const amount = parsedAmount as number;
      if (amount <= 0) {
        return sendError('Transfer amount must be greater than zero.');
      }

      if (mentioned.id === authorId) {
        return sendError('You cannot transfer points to yourself!');
      }

      if (farmer.points < amount) {
        return sendError(`Insufficient balance! You need **${amount} AP** but only have **${farmer.points} AP**.`);
      }

      const targetFarmer = getOrCreateFarmerByDiscord(mentioned.id, mentioned.username);

      const confirmBtn = new ButtonBuilder()
        .setCustomId('give_confirm')
        .setLabel('Confirm')
        .setStyle(ButtonStyle.Success);

      const cancelBtn = new ButtonBuilder()
        .setCustomId('give_cancel')
        .setLabel('Cancel')
        .setStyle(ButtonStyle.Danger);

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(confirmBtn, cancelBtn);

      const promptEmbed = new EmbedBuilder()
        .setTitle('💸 Points Transfer Confirmation')
        .setDescription(`Are you sure you want to transfer **${amount.toLocaleString()} AP** to **${targetFarmer.name}**?`)
        .setColor(15844367) // Gold
        .setTimestamp()
        .setFooter({ text: 'This transfer is irreversible.' });

      const promptMsg = await message.reply({
        embeds: [promptEmbed],
        components: [row]
      });

      const collector = promptMsg.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: 30000 // 30 seconds timeout
      });

      let interactionHandled = false;

      collector.on('collect', async (interaction) => {
        if (interaction.user.id !== authorId) {
          await interaction.reply({ 
            content: '⚠️ Only the sender can confirm this transfer!', 
            ephemeral: true 
          });
          return;
        }

        interactionHandled = true;
        await interaction.deferUpdate();
        collector.stop();

        if (interaction.customId === 'give_confirm') {
          // Double check balance right before transfer
          if (farmer.points < amount) {
            const errEmbed = new EmbedBuilder()
              .setTitle('⚠️ Transfer Failed')
              .setDescription(`Insufficient balance! You no longer have **${amount} AP** to transfer.`)
              .setColor(15158332);
            await promptMsg.edit({ embeds: [errEmbed], components: [] });
            return;
          }

          // Perform transfer
          farmer.points -= amount;
          targetFarmer.points = (targetFarmer.points || 0) + amount;

          farmer.lastActive = Date.now();
          targetFarmer.lastActive = Date.now();
          saveData();

          const successEmbed = new EmbedBuilder()
            .setTitle('💸 Points Transferred!')
            .setDescription(
              `Successfully transferred **${amount.toLocaleString()} AP** to **${targetFarmer.name}**!\n\n` +
              `👛 Your balance: **${farmer.points.toLocaleString()} AP**\n` +
              `👛 Their balance: **${targetFarmer.points.toLocaleString()} AP**`
            )
            .setColor(3066993) // Green
            .setTimestamp()
            .setFooter({ text: 'Aurlets Economy System' });

          await promptMsg.edit({ embeds: [successEmbed], components: [] });
        } else {
          const cancelEmbed = new EmbedBuilder()
            .setTitle('❌ Transfer Cancelled')
            .setDescription(`The points transfer to **${targetFarmer.name}** was cancelled.`)
            .setColor(15158332);
          await promptMsg.edit({ embeds: [cancelEmbed], components: [] });
        }
      });

      collector.on('end', async () => {
        if (!interactionHandled) {
          const timeoutEmbed = new EmbedBuilder()
            .setTitle('❌ Transfer Timed Out')
            .setDescription('The points transfer request timed out.')
            .setColor(15158332);
          await promptMsg.edit({ embeds: [timeoutEmbed], components: [] }).catch(() => {});
        }
      });

      return;
    }

    // ==========================================
    // 11. SHOP COMMAND
    // ==========================================
    if (commandName === 'shop' || commandName === 'store') {
      let desc = 'Here are the premium roles you can purchase with your Aura Points (AP):\n\n';
      PRESET_ROLES.forEach((r, idx) => {
        desc += `**${idx + 1}.** ${r.name} — **${r.price.toLocaleString()} AP**\n`;
      });
      desc += `\n👑 **Custom Discord Role** — **49,999 AP**\n*(Design and configure yours on the website! Type \`+customrole\` for details.)*\n`;
      desc += `\n👉 To purchase a preset role, type: \`+buy <number/name>\` (e.g. \`+buy 1\` to get Blossom 🌸).`;
      
      return sendEmbed('🛍️ Aurlets Reward Shop', desc, 10181046);
    }

    // ==========================================
    // 12. BUY COMMAND
    // ==========================================
    if (commandName === 'buy' || commandName === 'purchase') {
      const selection = args[0];
      if (!selection) {
        return sendError('Please specify the role index or name to purchase. (e.g. `+buy 1` or `+buy Blossom`)');
      }

      let targetRole: typeof PRESET_ROLES[0] | undefined;

      // Try parsing as number index
      const idx = parseInt(selection, 10);
      if (!isNaN(idx) && idx >= 1 && idx <= PRESET_ROLES.length) {
        targetRole = PRESET_ROLES[idx - 1];
      } else {
        // Search by name
        const searchStr = selection.toLowerCase();
        targetRole = PRESET_ROLES.find(r => r.name.toLowerCase().includes(searchStr));
      }

      if (!targetRole) {
        return sendError('Invalid selection! Please check available roles using `+shop` and choose a valid index or name.');
      }

      if (farmer.points < targetRole.price) {
        return sendError(`Insufficient balance! The **${targetRole.name}** role costs **${targetRole.price.toLocaleString()} AP**, but you only hold **${farmer.points.toLocaleString()} AP**.`);
      }

      // Check if user already owns the role
      const hasPurchasedInDb = presetRolePurchases.some(p => p.username === farmer.name && p.roleId === targetRole!.id);
      const member = message.member;
      const alreadyHasRole = member && member.roles.cache.has(targetRole.id);

      if (hasPurchasedInDb || alreadyHasRole) {
        return sendError(`You already own/purchased the **${targetRole.name}** role!`);
      }

      // Deduct points
      farmer.points -= targetRole.price;
      farmer.lastActive = Date.now();

      let botLog = '';
      if (member) {
        try {
          await member.roles.add(targetRole.id);
          botLog = 'The role has been successfully assigned to your Discord account!';
        } catch (err: any) {
          console.error('[DISCORD BOT] Failed to add role:', err.message || err);
          botLog = '⚠️ *Note: Points deducted and purchase recorded, but the bot could not auto-assign the role. Please ask an Admin to manually assign your role.*';
        }
      } else {
        botLog = '⚠️ *Note: Points deducted and purchase recorded, but we could not find your member profile in this channel context to assign the role.*';
      }

      // Save purchase in list
      presetRolePurchases.push({
        username: farmer.name,
        roleId: targetRole.id,
        roleName: targetRole.name,
        cost: targetRole.price,
        purchasedAt: Date.now()
      });

      saveData();

      return sendEmbed(
        '🎉 Purchase Successful!',
        `Successfully purchased the **${targetRole.name}** role for **${targetRole.price.toLocaleString()} AP**!\n` +
        `${botLog}\n\n👛 Remaining Balance: **${farmer.points.toLocaleString()} AP**`,
        3066993 // Green
      );
    }

    // ==========================================
    // 13. CUSTOM ROLE COMMAND
    // ==========================================
    if (commandName === 'customrole' || commandName === 'cr' || commandName === 'custom') {
      const webLink = process.env.APP_URL || 'https://ais-pre-mi5isjwmxcwzz2wnkckp6y-950813206559.asia-east1.run.app';
      const desc = `🎭 **Create Your Own Custom Discord Role!**\n\n` +
        `You can buy and configure a unique premium role that is fully custom to you!\n\n` +
        `✨ **Customization Mechanics:**\n` +
        `• **Custom Name**: Set any custom name you want.\n` +
        `• **Custom Color**: Pick any Hex color code or use the color wheel.\n` +
        `• **Custom Icon/Emoji**: Display a custom server emoji next to your name.\n` +
        `• **Top Placement**: Sits directly above Server Boosters so your name renders beautifully at the top of the sidebar!\n\n` +
        `💰 **Price**: **49,999 AP**\n\n` +
        `👉 **[Click Here to Configure and Buy Custom Role on the Web](${webLink})**\n` +
        `*(Ensure you are logged in to the website via Discord sync to link your points!)*`;
      
      return sendEmbed('🎭 Custom Role Creation', desc, 10181046);
    }

    // ==========================================
    // 14. REDEEM COMMAND
    // ==========================================
    if (commandName === 'redeem') {
      const codeArg = args[0];
      if (!codeArg) {
        return sendError('Usage: `+redeem <code>` (e.g. `+redeem AURLETS100`)');
      }

      const cleanCode = codeArg.toUpperCase().trim();
      const codeItem = redeemCodes[cleanCode];

      if (!codeItem) {
        return sendError('Invalid or expired redeem code!');
      }

      if (codeItem.uses >= codeItem.maxUses) {
        return sendError('This redeem code has reached its maximum usage limit!');
      }

      if (codeItem.redeemedBy.includes(farmer.name)) {
        return sendError('You have already redeemed this code!');
      }

      // Process redemption
      codeItem.uses += 1;
      codeItem.redeemedBy.push(farmer.name);

      farmer.points = (farmer.points || 0) + codeItem.rewardAmount;
      farmer.lastActive = Date.now();

      saveData();

      return sendEmbed(
        '🎉 Code Redeemed Successfully!',
        `Successfully redeemed code **${cleanCode}**!\n` +
        `💰 Gained **+${codeItem.rewardAmount.toLocaleString()} AP**\n` +
        `👛 New Balance: **${farmer.points.toLocaleString()} AP**`,
        3066993 // Green
      );
    }

    // ==========================================
    // 14.5 WEBSITE COMMAND
    // ==========================================
    if (commandName === 'website' || commandName === 'web' || commandName === 'site') {
      const webLink = process.env.APP_URL || 'https://ais-pre-mi5isjwmxcwzz2wnkckp6y-950813206559.asia-east1.run.app';
      const desc = `🌐 **Welcome to Aurlets!**\n\n` +
        `Visit our official website to save progress, check detailed stats, play games, and customize your premium rewards!\n\n` +
        `✨ **Website Features:**\n` +
        `• **Live AFK Farm**: Earn passive Aura Points just by staying on the site!\n` +
        `• **Leaderboard & Badges**: Check ranks, daily streaks, and custom badges.\n` +
        `• **Reward Shop**: Spend your hard-earned AP on custom Discord roles and other custom items!\n` +
        `• **Admin Control Panel**: For server management & custom role setup.\n\n` +
        `👉 **[Click Here to Visit the Aurlets Website](${webLink})**\n` +
        `*(Be sure to log in with your Discord account to instantly link your progress and points!)*`;

      return sendEmbed('🌐 Aurlets Official Website', desc, 3447003); // Cyan
    }

    // ==========================================
    // 14.8 ADMIN: CHANNEL COMMAND
    // ==========================================
    if (commandName === 'channel') {
      if (!message.member?.permissions.has(PermissionFlagsBits.Administrator)) {
        return sendError('❌ This command is restricted to Discord Administrators only.');
      }

      const subcommand = args[0]?.toLowerCase();
      if (!subcommand) {
        return sendError('Usage:\n• `+channel set #channel` - Restrict economy commands to a channel\n• `+channel unset` - Allow economy commands in all channels\n• `+channel info` - View current configuration');
      }

      if (subcommand === 'set') {
        const targetArg = args[1];
        if (!targetArg) {
          return sendError('Please specify a channel to set. (e.g. `+channel set #auraeco`)');
        }

        const match = targetArg.match(/<#(\d+)>/);
        const channelId = match ? match[1] : targetArg;

        // Check if the channel actually exists in the guild
        const channel = message.guild?.channels.cache.get(channelId);
        if (!channel) {
          return sendError('Could not find that channel in this server. Please make sure to mention it or provide a valid channel ID.');
        }

        botConfig.allowedChannelId = channelId;
        saveBotConfig();

        return sendEmbed(
          '🔒 Economy Channel Set',
          `Successfully restricted all economy commands to the <#${channelId}> channel!\n*(Note: Admin & moderation commands still work in any channel.)*`,
          3066993 // Green
        );
      }

      if (subcommand === 'unset' || subcommand === 'clear') {
        botConfig.allowedChannelId = undefined;
        saveBotConfig();

        return sendEmbed(
          '🔓 Economy Channel Unrestricted',
          'All economy commands can now be used in any channel of this server!',
          3447003 // Cyan
        );
      }

      if (subcommand === 'info' || subcommand === 'status' || subcommand === 'view') {
        const allowedId = botConfig.allowedChannelId;
        const desc = allowedId 
          ? `Economy commands are currently **restricted** to: <#${allowedId}>`
          : 'Economy commands are currently **unrestricted** (can be used in any channel).';
        return sendEmbed('ℹ️ Economy Channel Info', desc, 3447003);
      }

      return sendError('Unknown subcommand. Use `+channel set #channel`, `+channel unset`, or `+channel info`.');
    }

    // ==========================================
    // 15. ADMIN: ADD COMMAND
    // ==========================================
    if (commandName === 'add') {
      if (!message.member?.permissions.has(PermissionFlagsBits.Administrator)) {
        return sendError('❌ This command is restricted to Discord Administrators only.');
      }

      const targetUser = message.mentions.users.first();
      let targetFarmer: Farmer | null = null;
      const searchName = args[0];

      if (targetUser) {
        targetFarmer = getOrCreateFarmerByDiscord(targetUser.id, targetUser.username);
      } else if (searchName) {
        const cleanSearch = searchName.toLowerCase().trim();
        targetFarmer = Object.values(farmers).find(f => f.name.toLowerCase() === cleanSearch || f.discordUsername?.toLowerCase() === cleanSearch) || null;
      }

      if (!targetFarmer) {
        return sendError('Please mention a valid user or specify an existing username. (e.g. `+add @user 500` or `+add John 500`)');
      }

      const amountStr = args[1];
      const amount = parseInt(amountStr, 10);
      if (isNaN(amount) || amount <= 0) {
        return sendError('Please specify a valid positive number of points to add. (e.g. `+add @user 500`)');
      }

      targetFarmer.points = (targetFarmer.points || 0) + amount;
      targetFarmer.lastActive = Date.now();
      saveData();

      return sendEmbed(
        '🪙 Points Added (Admin)',
        `Successfully added **${amount.toLocaleString()} AP** to **${targetFarmer.name}**!\n` +
        `👛 New Balance: **${targetFarmer.points.toLocaleString()} AP**`,
        3066993 // Green
      );
    }

    // ==========================================
    // 16. ADMIN: REMOVE COMMAND
    // ==========================================
    if (commandName === 'remove') {
      if (!message.member?.permissions.has(PermissionFlagsBits.Administrator)) {
        return sendError('❌ This command is restricted to Discord Administrators only.');
      }

      const targetUser = message.mentions.users.first();
      let targetFarmer: Farmer | null = null;
      const searchName = args[0];

      if (targetUser) {
        targetFarmer = getOrCreateFarmerByDiscord(targetUser.id, targetUser.username);
      } else if (searchName) {
        const cleanSearch = searchName.toLowerCase().trim();
        targetFarmer = Object.values(farmers).find(f => f.name.toLowerCase() === cleanSearch || f.discordUsername?.toLowerCase() === cleanSearch) || null;
      }

      if (!targetFarmer) {
        return sendError('Please mention a valid user or specify an existing username. (e.g. `+remove @user 500` or `+remove John 500`)');
      }

      const amountStr = args[1];
      const amount = parseInt(amountStr, 10);
      if (isNaN(amount) || amount <= 0) {
        return sendError('Please specify a valid positive number of points to remove. (e.g. `+remove @user 500`)');
      }

      targetFarmer.points = Math.max(0, (targetFarmer.points || 0) - amount);
      targetFarmer.lastActive = Date.now();
      saveData();

      return sendEmbed(
        '🪙 Points Removed (Admin)',
        `Successfully removed **${amount.toLocaleString()} AP** from **${targetFarmer.name}**!\n` +
        `👛 New Balance: **${targetFarmer.points.toLocaleString()} AP**`,
        15158332 // Red
      );
    }

    // ==========================================
    // 17. ADMIN: SET COMMAND
    // ==========================================
    if (commandName === 'set') {
      if (!message.member?.permissions.has(PermissionFlagsBits.Administrator)) {
        return sendError('❌ This command is restricted to Discord Administrators only.');
      }

      const targetUser = message.mentions.users.first();
      let targetFarmer: Farmer | null = null;
      const searchName = args[0];

      if (targetUser) {
        targetFarmer = getOrCreateFarmerByDiscord(targetUser.id, targetUser.username);
      } else if (searchName) {
        const cleanSearch = searchName.toLowerCase().trim();
        targetFarmer = Object.values(farmers).find(f => f.name.toLowerCase() === cleanSearch || f.discordUsername?.toLowerCase() === cleanSearch) || null;
      }

      if (!targetFarmer) {
        return sendError('Please mention a valid user or specify an existing username. (e.g. `+set @user 1000` or `+set John 1000`)');
      }

      const amountStr = args[1];
      const amount = parseInt(amountStr, 10);
      if (isNaN(amount) || amount < 0) {
        return sendError('Please specify a valid non-negative number of points to set. (e.g. `+set @user 1000`)');
      }

      targetFarmer.points = amount;
      targetFarmer.lastActive = Date.now();
      saveData();

      return sendEmbed(
        '🪙 Points Set (Admin)',
        `Successfully set points of **${targetFarmer.name}** to **${targetFarmer.points.toLocaleString()} AP**!`,
        3447003 // Cyan
      );
    }

    // ==========================================
    // 18. ADMIN: RESET COMMAND
    // ==========================================
    if (commandName === 'reset') {
      if (!message.member?.permissions.has(PermissionFlagsBits.Administrator)) {
        return sendError('❌ This command is restricted to Discord Administrators only.');
      }

      const targetUser = message.mentions.users.first();
      let targetFarmer: Farmer | null = null;
      const searchName = args[0];

      if (targetUser) {
        targetFarmer = getOrCreateFarmerByDiscord(targetUser.id, targetUser.username);
      } else if (searchName) {
        const cleanSearch = searchName.toLowerCase().trim();
        targetFarmer = Object.values(farmers).find(f => f.name.toLowerCase() === cleanSearch || f.discordUsername?.toLowerCase() === cleanSearch) || null;
      }

      if (!targetFarmer) {
        return sendError('Please mention a valid user or specify an existing username. (e.g. `+reset @user` or `+reset John`)');
      }

      targetFarmer.points = 0;
      targetFarmer.streak = 0;
      targetFarmer.lastActive = Date.now();
      saveData();

      return sendEmbed(
        '🔄 Profile Reset (Admin)',
        `Successfully reset **${targetFarmer.name}**'s points and streak to **0**!`,
        15158332 // Red
      );
    }

    // ==========================================
    // 19. MOD: PURGE COMMAND
    // ==========================================
    if (commandName === 'purge') {
      if (!message.member?.permissions.has(PermissionFlagsBits.ManageMessages)) {
        return sendError('❌ You need the **Manage Messages** permission to use this command.');
      }

      if (!message.guild) {
        return sendError('This command can only be used in a Discord Server (guild) channel.');
      }

      const arg0 = args[0];
      if (!arg0) {
        return sendError('Usage:\n• `+purge <number>`\n• `+purge @user <number>`\n• `+purge humans <number>`\n• `+purge bots <number>`');
      }

      let quantity = 0;
      let targetType: 'all' | 'user' | 'humans' | 'bots' = 'all';
      let targetUserId: string | null = null;
      const mentionedUser = message.mentions.users.first();

      if (mentionedUser) {
        targetType = 'user';
        targetUserId = mentionedUser.id;
        const qStr = args[1];
        quantity = parseInt(qStr, 10);
        if (isNaN(quantity) || quantity <= 0) {
          return sendError('Please specify a valid number of messages to delete. (e.g. `+purge @user 10`)');
        }
      } else if (arg0.toLowerCase() === 'humans') {
        targetType = 'humans';
        const qStr = args[1];
        quantity = parseInt(qStr, 10);
        if (isNaN(quantity) || quantity <= 0) {
          return sendError('Please specify a valid number of messages to delete. (e.g. `+purge humans 10`)');
        }
      } else if (arg0.toLowerCase() === 'bots') {
        targetType = 'bots';
        const qStr = args[1];
        quantity = parseInt(qStr, 10);
        if (isNaN(quantity) || quantity <= 0) {
          return sendError('Please specify a valid number of messages to delete. (e.g. `+purge bots 10`)');
        }
      } else {
        quantity = parseInt(arg0, 10);
        if (isNaN(quantity) || quantity <= 0) {
          return sendError('Please specify a valid number of messages to delete, or use user/humans/bots filters.');
        }
      }

      // Limit to 100 at a time
      if (quantity > 100) {
        quantity = 100;
      }

      // Delete the trigger command message first
      await message.delete().catch(() => {});

      try {
        // Fetch up to 100 messages from the channel
        const fetched = await message.channel.messages.fetch({ limit: 100 });
        let messagesArray = Array.from(fetched.values());

        if (targetType === 'user') {
          messagesArray = messagesArray.filter(m => m.author.id === targetUserId);
         } else if (targetType === 'humans') {
          messagesArray = messagesArray.filter(m => !m.author.bot);
         } else if (targetType === 'bots') {
          messagesArray = messagesArray.filter(m => m.author.bot);
         }

        // Slice to the requested quantity
        messagesArray = messagesArray.slice(0, quantity);

        if (messagesArray.length === 0) {
          const infoEmbed = new EmbedBuilder()
            .setTitle('🗑️ Purge Complete')
            .setDescription('No matching messages found to delete.')
            .setColor(3447003);
          const tempMsg = await (message.channel as any).send({ embeds: [infoEmbed] });
          setTimeout(() => {
            tempMsg.delete().catch(() => {});
          }, 5000);
          return;
        }

        if ('bulkDelete' in message.channel) {
          const deleted = await message.channel.bulkDelete(messagesArray, true);
          const successEmbed = new EmbedBuilder()
            .setTitle('🗑️ Messages Purged')
            .setDescription(`Successfully deleted **${deleted.size}** messages with filter \`${targetType}\`.`)
            .setColor(3066993)
            .setTimestamp();
          const tempMsg = await (message.channel as any).send({ embeds: [successEmbed] });
          setTimeout(() => {
            tempMsg.delete().catch(() => {});
          }, 5000);
        } else {
          return sendError('Bulk delete is not supported in this channel type.');
        }
      } catch (err: any) {
        console.error('[PURGE ERROR]', err);
        const errEmbed = new EmbedBuilder()
          .setTitle('⚠️ Purge Failed')
          .setDescription('Failed to bulk delete messages. Note: Discord does not allow bulk deleting messages that are older than 14 days.')
          .setColor(15158332);
        const tempMsg = await (message.channel as any).send({ embeds: [errEmbed] });
        setTimeout(() => {
          tempMsg.delete().catch(() => {});
        }, 5000);
      }
      return;
    }

    // ==========================================
    // 20. GAME: PUZZLE COMMAND
    // ==========================================
    if (commandName === 'puzzle') {
      const subCommand = args[0]?.toLowerCase();
      if (subCommand !== 'deposit') {
        return sendError(
          'Usage:\n' +
          '• `+puzzle deposit <url>`\n' +
          '• `+puzzle deposit <@user>`\n' +
          '• `+puzzle deposit` with an attached image (or reply to a message containing one)'
        );
      }

      let imageUrl = '';
      let isPfp = false;
      let targetUserTag = '';

      // 1. Check for user mentions (e.g., @user)
      const mentionedUser = message.mentions.users.first();
      if (mentionedUser) {
        imageUrl = mentionedUser.displayAvatarURL({ size: 1024 });
        isPfp = true;
        targetUserTag = mentionedUser.tag;
      }

      // 2. Check for URL in args (e.g., +puzzle deposit https://example.com/pic.jpg)
      if (!imageUrl && args[1]) {
        const urlArg = args[1].trim();
        if (urlArg.startsWith('http://') || urlArg.startsWith('https://')) {
          imageUrl = urlArg;
        }
      }

      // 3. Check for attachments (directly or via reply)
      if (!imageUrl) {
        let attachment = message.attachments.first();
        if (!attachment && message.reference && message.reference.messageId) {
          try {
            const repliedMsg = await message.channel.messages.fetch(message.reference.messageId);
            attachment = repliedMsg.attachments.first();
          } catch (err) {
            console.error('[PUZZLE DEPOSIT] Error fetching replied message:', err);
          }
        }
        if (attachment) {
          const isImage = attachment.contentType?.startsWith('image/') || 
                          /\.(jpg|jpeg|png|webp|gif)$/i.test(attachment.url);
          if (isImage) {
            imageUrl = attachment.url;
          } else {
            return sendError('❌ The attached file is not a valid image. Supported formats: PNG, JPG, JPEG, WEBP, GIF.');
          }
        }
      }

      if (!imageUrl) {
        return sendError(
          '❌ No valid image deposit source found!\n' +
          'Please use one of the following methods:\n' +
          '• **Attachment**: Attach an image and type `+puzzle deposit`\n' +
          '• **Mention**: Type `+puzzle deposit @username` to use their profile picture (PFP)\n' +
          '• **URL**: Type `+puzzle deposit <image-url>`'
        );
      }

      // Add to puzzleImages array if it exists
      if (puzzleImages) {
        // Check for duplicates
        const exists = puzzleImages.some(img => img.url === imageUrl);
        if (exists) {
          return sendError('⚠️ This image has already been submitted for approval!');
        }

        const newImg = {
          id: 'img_' + Math.random().toString(36).substring(2, 11),
          url: imageUrl,
          uploadedBy: isPfp ? `${targetUserTag}'s PFP (via ${authorTag})` : authorTag,
          approved: false,
          createdAt: Date.now()
        };

        puzzleImages.push(newImg);
        saveData();

        // Send a success embed
        const successEmbed = new EmbedBuilder()
          .setTitle('🧩 Puzzle Image Deposited!')
          .setDescription(
            `✅ Custom puzzle image has been successfully deposited by **${authorTag}**!\n\n` +
            (isPfp ? `Selected Target: **${targetUserTag}**'s Profile Picture (PFP)\n\n` : '') +
            `It has been submitted for **Admin Approval**. Once approved, it will be playable by everyone on the web dashboard.`
          )
          .setThumbnail(imageUrl)
          .setColor(3066993)
          .setTimestamp();

        await message.reply({ embeds: [successEmbed] });

        // Log the activity
        if (logActivity) {
          logActivity(
            '📥 Puzzle Image Deposited (Discord)',
            `**${authorTag}** deposited a custom puzzle image (PFP/URL/File) via Discord for approval!`,
            10181046
          );
        }
      } else {
        return sendError('❌ Puzzle database is currently offline or not initialized.');
      }
      return;
    }

    if (commandName === 'giveaway' || commandName === 'giveaways') {
      const subCommand = args[0]?.toLowerCase();

      // Help menu for giveaway command if no args or invalid args
      if (!subCommand || (subCommand !== 'list' && subCommand !== 'enter' && subCommand !== 'create' && subCommand !== 'end')) {
        return sendEmbed(
          '🎉 Giveaway System Commands',
          '• `+giveaway list` - View all active and completed giveaways\n' +
          '• `+giveaway enter <giveawayId>` - Enter an active giveaway\n' +
          '• `+giveaway create <prizeType> <prizeName> [reqMessages] [reqGames] [rewardValue]` - (Admin) Create a giveaway\n' +
          '• `+giveaway end <giveawayId>` - (Admin) End a giveaway and pick a winner'
        );
      }

      // 1. LIST giveaways
      if (subCommand === 'list') {
        const listGiveaways = giveaways || [];
        if (listGiveaways.length === 0) {
          return sendEmbed('🎉 Giveaways List', 'No giveaways have been created yet!');
        }

        let desc = '';
        listGiveaways.forEach(g => {
          const reqs = [];
          if (g.requirements?.discordMessages) reqs.push(`💬 ${g.requirements.discordMessages} Msgs`);
          if (g.requirements?.gamesPlayed) reqs.push(`🎮 ${g.requirements.gamesPlayed} Games`);
          const reqStr = reqs.length > 0 ? reqs.join(', ') : 'No requirements';

          const participantsCount = g.participants ? g.participants.length : 0;
          
          if (g.status === 'active') {
            desc += `🔹 **[ACTIVE] ID:** \`${g.id}\`\n` +
                    `🎁 **Prize:** ${g.prizeName} (${g.prizeType.toUpperCase()})\n` +
                    `📜 **Reqs:** ${reqStr}\n` +
                    `👥 **Participants:** ${participantsCount}\n\n`;
          } else {
            desc += `🔸 **[ENDED] ID:** \`${g.id}\`\n` +
                    `🎁 **Prize:** ${g.prizeName}\n` +
                    `🏆 **Winner:** **${g.winner || 'No participants'}**\n\n`;
          }
        });

        return sendEmbed('🎉 Active & Ended Giveaways', desc);
      }

      // 2. ENTER giveaway
      if (subCommand === 'enter') {
        const gId = args[1]?.trim();
        if (!gId) {
          return sendError('Usage: `+giveaway enter <giveawayId>`');
        }

        const listGiveaways = giveaways || [];
        const g = listGiveaways.find(x => x.id === gId);
        if (!g) {
          return sendError(`Giveaway with ID \`${gId}\` not found! Use \`+giveaway list\` to see valid IDs.`);
        }

        if (g.status !== 'active') {
          return sendError('This giveaway has already ended!');
        }

        // Check if user already entered
        if (g.participants.includes(farmer.name)) {
          return sendError('You have already entered this giveaway!');
        }

        // Verify requirements
        const userMsgs = farmer.discordMessagesCount || 0;
        const userGames = farmer.totalGamesPlayed || 0;

        if (g.requirements?.discordMessages && userMsgs < g.requirements.discordMessages) {
          return sendError(`❌ You do not meet the Discord messages requirement!\nRequired: **${g.requirements.discordMessages}** | You have: **${userMsgs}**`);
        }

        if (g.requirements?.gamesPlayed && userGames < g.requirements.gamesPlayed) {
          return sendError(`❌ You do not meet the games played requirement!\nRequired: **${g.requirements.gamesPlayed}** | You have: **${userGames}**`);
        }

        // Add to participants
        g.participants.push(farmer.name);
        saveData();

        return sendEmbed(
          '✅ Joined Giveaway!',
          `You have successfully entered the giveaway for **${g.prizeName}**!\n` +
          `Total participants: **${g.participants.length}** 👥`
        );
      }

      // 3. CREATE giveaway (Admin Only)
      if (subCommand === 'create') {
        // Check if author has Admin permission or matches specific ID
        const isAdmin = message.member?.permissions.has(PermissionFlagsBits.Administrator) || authorId === '840560998011502593';
        if (!isAdmin) {
          return sendError('❌ Only server administrators can create giveaways.');
        }

        const prizeType = args[1]?.toLowerCase(); // role, ap, minecraft, other
        let prizeName = args[2];
        const reqMessages = args[3] ? parseInt(args[3], 10) : 0;
        const reqGames = args[4] ? parseInt(args[4], 10) : 0;
        const rewardValue = args[5] ? parseInt(args[5], 10) : undefined;

        if (!prizeType || !prizeName) {
          return sendError('Usage: `+giveaway create <role|ap|minecraft|other> <prizeName> [reqMessages] [reqGames] [rewardValue]`\n*(Tip: use quotes for spaces in prizeName)*');
        }

        // Strip quotes if they were added to prizeName
        if (prizeName.startsWith('"') && prizeName.endsWith('"')) {
          prizeName = prizeName.slice(1, -1);
        }

        const newId = 'gw_' + Math.random().toString(36).substring(2, 9);
        const newGw: Giveaway = {
          id: newId,
          prizeType: prizeType as any,
          prizeName,
          rewardValue,
          requirements: {
            discordMessages: reqMessages > 0 ? reqMessages : undefined,
            gamesPlayed: reqGames > 0 ? reqGames : undefined
          },
          participants: [],
          startedBy: authorTag,
          startedAt: Date.now(),
          status: 'active'
        };

        if (giveaways) {
          giveaways.push(newGw);
          saveData();
        }

        if (logActivity) {
          logActivity(
            '🎉 New Giveaway Started (Discord)',
            `**${authorTag}** started a giveaway for **${prizeName}** (ID: \`${newId}\`)\n` +
            `Requirements - Messages: **${reqMessages}** | Games Played: **${reqGames}**`,
            10181046
          );
        }

        return sendEmbed(
          '🎉 Giveaway Created!',
          `🎁 **Prize:** ${prizeName} (${prizeType.toUpperCase()})\n` +
          `🆔 **Giveaway ID:** \`${newId}\`\n` +
          `📜 **Requirements:** Messages: **${reqMessages}** | Games Played: **${reqGames}**\n\n` +
          `Users can enter by typing: \`+giveaway enter ${newId}\` or joining via the Web Dashboard!`
        );
      }

      // 4. END giveaway (Admin Only)
      if (subCommand === 'end') {
        const isAdmin = message.member?.permissions.has(PermissionFlagsBits.Administrator) || authorId === '840560998011502593';
        if (!isAdmin) {
          return sendError('❌ Only server administrators can end giveaways.');
        }

        const gId = args[1]?.trim();
        if (!gId) {
          return sendError('Usage: `+giveaway end <giveawayId>`');
        }

        const listGiveaways = giveaways || [];
        const g = listGiveaways.find(x => x.id === gId);
        if (!g) {
          return sendError(`Giveaway with ID \`${gId}\` not found!`);
        }

        if (g.status !== 'active') {
          return sendError('This giveaway has already ended!');
        }

        g.status = 'ended';
        g.endedAt = Date.now();

        if (!g.participants || g.participants.length === 0) {
          g.winner = undefined;
          saveData();
          return sendEmbed('🎉 Giveaway Ended!', `The giveaway for **${g.prizeName}** has ended, but there were no participants! 😔`);
        }

        const winnerIndex = Math.floor(Math.random() * g.participants.length);
        const winnerName = g.participants[winnerIndex];
        g.winner = winnerName;

        // Distribute AP rewards automatically if prizeType is ap
        if (g.prizeType === 'ap' && g.rewardValue) {
          const winnerFarmer = farmers[winnerName];
          if (winnerFarmer) {
            winnerFarmer.points = (winnerFarmer.points || 0) + g.rewardValue;
          }
        }

        saveData();

        if (logActivity) {
          logActivity(
            '🎉 Giveaway Ended (Winner Drawn!)',
            `Giveaway **${g.prizeName}** has concluded!\n🏆 **Winner:** **${winnerName}** (from ${g.participants.length} total participants!)`,
            3066993
          );
        }

        return sendEmbed(
          '🎉 Giveaway Concluded!',
          `🎁 **Prize:** ${g.prizeName}\n` +
          `🏆 **Winner:** **${winnerName}**!\n` +
          `👥 **Total Entries:** **${g.participants.length}**\n\n` +
          `Congratulations to the winner! 🥳`
        );
      }
    }
    return;
  });

  // Login to Discord
  client.login(token).catch((err) => {
    console.error('[DISCORD BOT] Failed to log in to Discord gateway:', err.message || err);
  });

  return client;
}
