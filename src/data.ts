export interface StaffMember {
  name: string;
  username: string;
  role: 'FOUNDER' | 'CO FOUNDER' | 'OWNER' | 'MANAGER' | 'LEAD ADMIN' | 'ADMIN' | 'SENIOR MODERATOR' | 'MODERATOR';
  color: string;
  avatarUrl?: string;
}

export interface Announcement {
  id: string;
  title: string;
  description: string;
  date: string;
  tag?: string;
}

export interface Highlight {
  title: string;
  description: string;
  icon: string;
}

export interface Creation {
  author: string;
  title: string;
  type: 'Edit' | 'Meme' | 'Art';
  mediaUrl?: string;
  placeholderColor: string;
}

export const STAFF_MEMBERS: StaffMember[] = [
  { name: 'Palindrome ☭', username: '@panadol_xx03', role: 'FOUNDER', color: 'from-purple-500 to-indigo-600', avatarUrl: 'https://i.postimg.cc/02tt7yvS/pali.webp' },
  { name: 'Queenz', username: '@queen_z', role: 'CO FOUNDER', color: 'from-pink-500 to-rose-600', avatarUrl: 'https://i.postimg.cc/VLZHQp1L/queenz.webp' },
  { name: 'Masab Ellahi', username: '@masabellahi', role: 'OWNER', color: 'from-red-500 to-orange-600', avatarUrl: 'https://i.postimg.cc/3R4yf90H/masab.webp' },
  { name: 'PeanutLiver', username: '@loyalpeanut', role: 'OWNER', color: 'from-amber-500 to-yellow-600', avatarUrl: 'https://i.postimg.cc/8zZj1xhc/peanut.webp' },
  { name: 'SoulMalik', username: '@soulmalik._.', role: 'OWNER', color: 'from-teal-500 to-emerald-600', avatarUrl: 'https://i.postimg.cc/G2QPrXh2/Soul-Malik.webp' },
  { name: 'No Data', username: '-------', role: 'MANAGER', color: 'from-gray-500 to-slate-600' },
  { name: 'Farii', username: '@huhfarii', role: 'LEAD ADMIN', color: 'from-blue-500 to-cyan-600', avatarUrl: 'https://i.postimg.cc/dt06QcC3/fariii.webp' },
  { name: 'Ibn-e-batota', username: '@ibbi_hehe', role: 'ADMIN', color: 'from-cyan-500 to-blue-600', avatarUrl: 'https://i.postimg.cc/wjykJ50M/ibbi.webp' },
  { name: 'No Data', username: '------', role: 'SENIOR MODERATOR', color: 'from-zinc-500 to-neutral-600' },
  { name: 'No Data', username: '------', role: 'SENIOR MODERATOR', color: 'from-zinc-500 to-neutral-600' },
  { name: 'Allama', username: '@no._.one9.11', role: 'MODERATOR', color: 'from-violet-400 to-purple-500', avatarUrl: 'https://i.postimg.cc/G25fd3pT/allama.webp' },
  { name: 'Mighty.burg3r', username: '@brzrkr_.', role: 'MODERATOR', color: 'from-violet-400 to-purple-500', avatarUrl: 'https://i.postimg.cc/W4bj432R/brzrkr.webp' },
  { name: 'KOLE', username: '@purpuleeee', role: 'MODERATOR', color: 'from-violet-400 to-purple-500', avatarUrl: 'https://i.postimg.cc/wBv8pGVx/kole.webp' },
  { name: 'PRINCESS MIRCHII', username: '@804_qadi', role: 'MODERATOR', color: 'from-violet-400 to-purple-500', avatarUrl: 'https://i.postimg.cc/qq9Mhd1K/princess.webp' },
  { name: 'Ded_inside', username: '@ded_inside13', role: 'MODERATOR', color: 'from-violet-400 to-purple-500', avatarUrl: 'https://i.postimg.cc/ZK7XLcm1/ded.webp' },
  { name: 'Bipolar Disorder', username: '@good_hai_boss', role: 'MODERATOR', color: 'from-violet-400 to-purple-500', avatarUrl: 'https://i.postimg.cc/yNgKRGSy/bipolar.webp' },
  { name: 'Toxic_Mustafa', username: '@toxic_mustafa', role: 'MODERATOR', color: 'from-violet-400 to-purple-500', avatarUrl: 'https://i.postimg.cc/L80YRrpW/mustafa.webp' },
  { name: 'shino.presence', username: '@shino.presencex999', role: 'MODERATOR', color: 'from-violet-400 to-purple-500', avatarUrl: 'https://i.postimg.cc/7hDbm4gF/shino.webp' }
];

export const ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'ann-1',
    title: 'Aurlets Vs Pookiestan PFP Battle',
    description: 'Nitro - Bundles and Decos Rewards -> Join Discord For More Details..',
    date: 'Sep 25, 2025',
    tag: 'Event'
  },
  {
    id: 'ann-2',
    title: 'Aurlets Vs Raat PFP Battle',
    description: 'Nitro - Bundles and Decos Rewards -> Join Discord For More Details..',
    date: 'Sep 12, 2025',
    tag: 'Event'
  },
  {
    id: 'ann-3',
    title: 'Casino Shop Update 1.0 [Coming Soon]',
    description: 'Buy Exclusive Ranks Using Casino Bal (Unbelievable Bot) -> Join Discord For More Details..',
    date: 'Aug 27, 2025',
    tag: 'Bot'
  },
  {
    id: 'ann-4',
    title: '🚀 Aura Games',
    description: 'Aurlets Introducing Gaming Events. Click the Games tab for more details or join the server.',
    date: 'Aug 26, 2025',
    tag: 'Gaming'
  },
  {
    id: 'ann-5',
    title: 'Aurlets Staff Application Announcement',
    description: 'Apply Now to become a part of Aurlets Staff Team! Join Discord For More Details..',
    date: 'Aug 25, 2025',
    tag: 'Staff'
  },
  {
    id: 'ann-6',
    title: '🎉 Community Milestone',
    description: 'We just hit 300 members! Thank you Aura Fam for making Aurlets the most chill server in Pakistan. 💜',
    date: 'Aug 25, 2025',
    tag: 'Milestone'
  },
  {
    id: 'ann-7',
    title: 'Community Content Highlights Update',
    description: 'Guys, submit your content (Memes, Edits, or anything related to Aurlets) on Discord, and it will be highlighted in the Highlights section.',
    date: 'Aug 25, 2025',
    tag: 'Content'
  },
  {
    id: 'ann-8',
    title: '🛠 Server Update',
    description: 'We’ve revamped the roles & channels to keep things clean and fun. Check #rules for the updates.',
    date: 'Aug 24, 2025',
    tag: 'Update'
  }
];

export const HIGHLIGHTS: Highlight[] = [
  {
    title: '🎉 Launch Day',
    description: 'The day Aurlets opened doors to the community. A new beginning for Aura Farmers!',
    icon: 'Sparkles'
  },
  {
    title: '🔥 300+ Members',
    description: 'Celebrating our first big milestone together. Growth and vibes!',
    icon: 'Users'
  },
  {
    title: '🎮 Gaming Nights',
    description: 'From Scribble to Valorant — our community gaming nights are pure chaos & fun.',
    icon: 'Gamepad2'
  },
  {
    title: '🎤 Chill VC Sessions',
    description: 'Random vibes, music, and deep talks — the heart of Aurlets!',
    icon: 'Mic'
  },
  {
    title: '🏆 Events & Giveaways',
    description: 'Exciting giveaways and community events bringing us all closer!',
    icon: 'Trophy'
  }
];

export const CREATIONS: Creation[] = [
  {
    author: '@SoulMalik',
    title: 'Aurlets Official Server Edit 🔥',
    type: 'Edit',
    placeholderColor: 'from-purple-600 to-indigo-900'
  },
  {
    author: '@Maheen',
    title: 'Aura Farming Mascot Fanart 🎨',
    type: 'Art',
    placeholderColor: 'from-emerald-600 to-teal-900'
  },
  {
    author: '@Ded Inside',
    title: 'When Palindrome asks for Mod 😭',
    type: 'Meme',
    placeholderColor: 'from-rose-600 to-pink-900'
  },
  {
    author: '@SoulMalik',
    title: 'Late Night Vibe Aesthetics ✨',
    type: 'Edit',
    placeholderColor: 'from-violet-600 to-pink-900'
  },
  {
    author: '@Ded Inside',
    title: 'Server Admin vs Mod Logic 💀',
    type: 'Meme',
    placeholderColor: 'from-amber-600 to-red-900'
  }
];
