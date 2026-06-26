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

export const EID_PASSWORDS: Record<string, string> = {
  queenz: "4futya",
  peanut: "moti",
  masab: "elahi",
  ibbi: "nibbi",
  palindrome: "twerk",
  brooks: "urdu teacher",
  bipolar: "chaos",
  maki: "bacchi",
  shino: "duo",
  malu: "twins",
  hajji: "cutie",
  allama: "painter",
  cipher: "arnold",
  fari: "furry",
  kole: "baccha",
  mahi: "tindu",
  merited: "taken",
  brzrkr: "poster boy",
  everyone: ""
};

export const EID_LETTERS: Record<string, string> = {
  queenz: `Eid Mubarak Zaman 🌙

Queenzieeeee kasi ho? while writing this idk where to start from but agar itna organized way me likhna shuru karu toh isme "Ded" wala vibe kase rahega!! haina? :3

Lemme just start randomly.. as you know mera koi bhai behn toh hai nahi.. gap year pe hu.. itne dino se wo akelapan kabhi mehsus hi nahi hua cz I've always kept myself busy.. but jabse gap year chalu hua tabse I started feeling sooo lonely.. na daily friends ke sath mulakaat & na koi chahal pahal.. it's just me & my devices the whole day.. ab mai hu sidha sadha social banda who just watched a few pakistani dramas & became a fan of the culture.. I started looking for pak sv & that's where I found GUPSHUP.. THAT'S WHERE I FOUND YOU ALL!!

Iske baad wala story ka kya zikr karu tumhe toh sab malum hai hi waise bhi.. aurlets gang banna, hamara gupshup se alag ho jana, khud aurlets sv banna & the way you & a few others like masab, pali, peani ne ye sv ko apne haato se brick by brick banaya hai na.. massive respect to you all cz gap year me this sv actually played a beautiful role in this chapter of my life.. 10 mahina ho geya queenz!!

par pata hai? specifically "tumne" kaha pe mera dil jeet liya? firstly, that time when you stood alone for me against sohail after he banned me from a different ID.. secondly, when you called me "bhai" :D
As I've alr mentioned siblings toh hai nahi mere, so jo log mujhe bhai manta hai I automatically get attached to them emotionally!! but.. ek brutal reality bhi hai.. ek din na ekdin toh ye sab khatm hona hi hai.. we all are gonna get busy with our own "real life" & jab zindegi se sahi me muqabla karne ka waqt aa jayega tab shayed dheere dheere mera discord ana bhi chhut jayega.. 

so.. I just hope ke chhota sa hi sahi I'll remain as a positive memory in your journey.. I hope guzare huye mahino me I was able to be a good friend.. ha troll/bully wagera toh mai karunga hi, cz.. pata hai? I've always been on myself since my childhood & I've grown up in such a way that now I'm scared of looking emotionally vulnerable.. that's why I rarely express my emotions the way I'm doing today & ab ye tang karna hi mera love language hai.. agar kisi din satana band kar du toh bas samajh lena either I'm upset with you or something really bad happened to me! so.. mere tang karne se kabhi naraz maat ho jana :)

Yaar queenz, bas socials pe itna active rehna ke agar Allah ne mere naseeb me Umrah likha hoga, toh tume bata saku ke "I'm coming to Saudiiiii" kyu ki yaad hai?? I owe you a coffee treat!! sachme treat dunga fr frrrr wada haii :3

Baki Allah tumhe sehat dey, success dey, izzat dey, & wo har chiz tumhe dila dey jo tum sacche dil se mangte ho with good intentions!! Once again, Eid Mubarak Queenz!!
Also, thank you mujhpe aitbar (flexing my heavy urdu skills HUH) karke mod banane ke liye.. I won't break ts trust Insha Allah.. Thank you for everything!!!

— Your dur ka bhai, Ded inside`,

  peanut: `Eid Mubarak Peanutliver 🌙

Hey Peanut… ajeeb hai na? Ek online server me na jaan na pehchaan, aur phir bhi baat karte karte 10 months ho gaye.. Baat baat pe "mi amore", slapping bot ko abuse karna, uni applications, essays ko leke tana dena, phir milke essays likhna, VC me gaaney gana, streams, reels, yaps, trolls… & finally the uni acceptances!!..

We're growing up so fast… haina?

I know sv me mere alawa bhi you got a lot of peeps to yap with but pata hai? mere liye you're the closest one here.. (isi liye kabhi kabhara overshare karta hu shayed & now yk a lil too much about me🙄).. but yeah that's the reason ye sabse bara wala letter tumhari hai!!

ab asal baat.. ahh yeah, ye sach hai ke tumhare sath mere pehle jesa utne baatey ya bakloli nahi hotey ab cz ik.. i've alr gone through these A Levels ka pressure, uni application & all.. bimar bhi rehti ho aj kal.. ek karwa sach ye bhi hai ke uni start hone ke baad both of us will get busy with our own "real" lives & tab shayad dc pe aana bhi dheere dheere chhut jayega... & uske baad ek din shayed aisa bhi ayega when we'll become nothing but strangers with a little universe of memories left behind in the virtual world.. 

SO... I just hope ke in mahino me I was able to be a good friend & agey ke zindegime tumhari zehn me I'll be able to remain as a lil hi sahi but positive memory.. but HA JO BHI HO, ye yaad rakhna ke thousands of miles away from you, someone's genuinely rooting for your success.. never give up on yourself yaar & jab kabhi bhi kisi bhi time agar lage ke ded can help me, just remember - I'm only a knock away from you on insta! 

About the UCL thing, scholarship application chal raha hai abhi but as yk me, I always expect the least.. & even though I hyped up the acceptance a few days ago, agar scholarship na mile toh according to the financial condition of my family, studying at the UK is an unrealistic dream rn.. south korea chala jaunga bas, agar UCL se scholarship na mile toh.. waha se spring & autumn foliage ka pics bhejunga tumhe nw!!:3

soooo.. likhna toh aur bhi boht kuchh tha but I wonder yehi letter parhogi bhi ya nahi.. anyways!! Allah tumhe sehat, success, & tumhe wo sab kuchh de that you want with a good intention.. 

& HA!!! do keep me updated with your life peanut ki bacchi!!.. ekdam se bas bhul na jana :))

Once again, Eid Mubarak! & Thank you for everything!!

— Your British Urdu`,

  masab: `Eid Mubarak Masab 🌙

Masabbb meri jaannnn kesi ho? Damn yaar, 10 mahine ho gaye.. kitne jaldi jaldi bare ho rahe hai na hum? 

10 months earlier from now, jab mera gap year shuru ho geya tha it was me & my devices against the world.. real life me utney friends toh hai nahi, toh waqt guzar ne ke liye kuchh toh chahiye tha mujhe.. ab mai hu sidha sadha banda who just completed some pak dramas & became a fan of the culture as well as the language!! I started looking for pak sv & that's where I found GUPSHUP.. THAT'S WHERE I FOUND YOU ALL!!

ab iske agey aurlets ka banna, gupshup se bichharke apna sv banana from scratch, & usey yaha tak le ana.. you were one of the main pillars of all of these!! waise toh ofc tumse zyada active members hai server me but you know what? kuchh logo ka 5 texts bhi dusre bande ka hazar texts se zyada impactful hota hai.. your presence is exactly like that.. Moreover, the way you handled all the raids to save the sv, roles & everything chhoro you were more of a selfless protector of Aurlets..

Why it matters to me? yes, mane toh bas waqt guzar ne ke liye arso baad discord me aya tha but I never realized that y'all will eventually become my support system for this gap year wala life! alfazo me ye baya nahi kar sakta ke how beautiful the role of this server & it's people was in this chapter of my life.. late night chats, cricket streams, raat me gaaney ka mehfil.. we've been through all of it! & ab jab gap year khatm hone ka time nazdik aa raha hai, toh ye "bas time pass" ka ehmiyat samajh me aa rha hai.. boht jald jab zindegi se muqabla karne ka waqt aa jayega, tab shayed dheere dheere discord me ana phirse chhut jayega.. & maybe we will become nothing but strangers with a bubble of memory left behind somewhere in this virtual world.. 

Isi liye, I just hope that I was able to be a good friend & agey ke zindegi me tumhare zehn me I'll be able to live as a positive memory.. but ha jab Pakistan ghumne jaunga toh of course I'll contact & try my best to meet some of you.. bas yaar masab.. itna active rehne ke mere wo wala text dekh sako tum :)

Baki dua yehi rahega ke Allah tumhe sehat de, success de, cute sa humsafar de, aur wo sab kuchh de jo tum sachhe dil se acche intention se mangte ho.. 

Once again.. Eid Mubarak Masab! Thanks for everything😊

- Your dur ka dost, Ded inside`,

  ibbi: `Eid Mubarak Ibbi 🌙

Yaar nibbiiii kase ho?? Idk where should I start from but itna soch samajhke organized tarike se hi likhna start karu toh is khad me "Ded" wala baat kya hi reh jayega??

So... Let me just start randomly! Yaar ye baat toh sach hai ke masab, peanut, queenz, pali ke jase I don't know you for 10 months but main part jo hai which truly matters to me.. building aurlets from scractch, late night chats, cricket streams, raat bhar gaaney ka mehfil.. we've been through all of these together & look at you yaar.. It's you who has the highest texts in the server right now & texts chhoro you're in fact so much closer to me than so many members I've been been knowing from Gupshup!! Isi liye hi toh I felt comfortable while sharing with you about what I was going through.. sachme halka laga batane ke baad.. You're really mature for your age & Aurlets woudn't have been the same without you & your efforts, Ibbi.. Thank you for everything!!

Baki dua yehi hai ke bas Allah tumhe sehat de, success de, qt de, aur wo sab kuchh de that you want with a good intention.. Jeete raho yara! Once again, Eid Mubarak! Enjoy it to the fullest!!

- Your nibba, Ded Inside`,

  palindrome: `Eid Mubarak Pali 🌙

Paliii yaarrr kase ho?? I don't know ye khad kahase shuru karu kyu ki tum hi to wo ho jisse ye sab kuchh shuru hua tha! Aurlets ka gang banna (haha wo alag baat ke maine mazak mazak me delulu join kya tha), phir gupshup se bichhar ke khud Aurlets ek server baan na.. in fact I gave up on Gupshup cz of the toxicity of the senior members, phir dc pe ana chhor diya tha.. then ek din suddenly jab open kiya it was YOU with the text:
"ALL OGS here bro
if u wanna join
peanut queenz msab me farii lily ahhhhhh"

Istg that was really unexpected & I was soooo happy at that moment! & then late night chats, movie streams, raat bhar gaaney ka mehfil, raids sambhal na.. we've been through all of these together! This server means a lot to me & played a beautiful role in this "gap year" chapter of my life. 

Thanks for everything, Palindrome! Baki dua ye hai ke Allah tumhe sehat de, success de, qt de, aur wo sab kuchh de that you want with a good intention.. It's true that discord ka world won't last forever & gap year khatm hote hi jab zindegi se muqabla karne ka waqt aa jayega, tab shayed aur baatey na ho hamara.. but!! Pakistan jab aunga I'll ofc knock you to meet.. bas itna active rehna ke wo text dekh sako tum..
Once again, Eid Mubarak Pali! Enjoy it to the fullest!

- Your twerk partner, Ded Inside`,

  brooks: `Eid Mubarak Brooks 🌙

BRRRRRRRRRRRRROOOOOOOOOOOOOOOOOOOOOOOO
(cont.)
kasi ho? :3

Yaar neither I know how to write letters & shyt nor I know whereto even start from.. so bas jo dil me aye wohi likhe ja raha hu.. waise bhi agar itna soch samajhke likhu toh "Ded" wala vibes kase rahegaaaa ahahaha!!

Hmh.. it's true ke baki members jase pali, peani, queenz, masab inke tarha I ain't knowing you for 10 months.. In fact, mai toh tumhe bas is Ramadan ke shuru he hi janta hu bas😭 It was sooo fun talking you since the beginning & bas in kuchh hi dino me hi I've already counted you as a close one in the sv :3.. You've proved ke kuchh logo ke sath vibe match hone ke liye mahino nahi kuchh din hi kafi hai!! LMFAO I'm writing this & realizing ke ye wala letter is the most chaotic one ahahahahah.. anyways yaar, I really hope ye dosti aur ye energy dono aise hi barkarar rahe, even as life keeps moving forward!

Baki Allah tumhe sehat de, success de, & wo sab kuchh de that you wish for with good intentions.. AND BTW best of luck for your O Levels! hag maat dena or I'll spam "haiga dise" whenever you enter the chat!! & yeah Thanks for everything..
Once again, Eid Mubarak Brooks! 

- Your Urdu student!`,

  bipolar: `Eid Mubarak Halali 🌙

Hey Halali or Bipolar Disorder or whatever😭.. naam me kya rakha hai.. KASI HO?? Well tbh I really donno how to write a letter & where should I even start from.. So lemme just start randomly cz agar soch samajhke hi likhna hai toh khad me "Ded" wala baat kaha reh jayega??

Well Halali, ye baat toh sach hai I've been knowing some members for more than 10 months & uske mukable me you're relatively a new face to me! But ya Allahhh itna chaotic, itna energetic, itna yapping!!! After all these it feels like un logo se zyada recognizable toh ab tum ho! Kabhi kabhi esa lagta hai ke tumhari ghar me wo jo bhoot hai wo bhi tumse dar jaye.. I sometimes even think ke ye khud pagal pagalo ke subject leke par rahi hai😭

Jokes aside, mera dua yehi rahega ke khuda tumme ye positive energy barkarar rakhey cz it's not only you who's smiling but jinse baatey karti ho they start radiating your energy as well! & baki Allah tumhe sehat de, success de, & wo sab kuchh dey that you wish for with good intentions! Best of luck for your A Levels & Thank youuu for everything! I hope that this friendship will live along, even as life keeps moving forward.

Once again, Eid Mubarak halali/bipolar/benam_aurat!

- Ded Inside`,

  maki: `Eid Mubarak Maki 🌙

Hellowww maki ki bacchi, bauni, moti, chhotuuu kasi hooo??
Listen, mujhe nai pata letter khubsurat tarike se kase likhte hai & ye bhi nai pata ke kaha se start karna hai so lemme just write whatever mere dil me aye cz agar soch samajhke hi likhna hai toh "Ded" wali baat kase rahega is khad me :3

So.. pehli baat, ye toh sach hai that masab, pali, peani, queenz inke tarha I donno you for 10 months, in fact bas ramadan ke shuru se hi janta hu mai tumhe😭 But damn yaar, the energyyyy lmaoo!! Ye itne energy & vibes toh mere OGs ke sath convo me bhi nahi hotey.. ase lagta hai that I've known you for months.. people like you actually prove it ke kuchh log asa bhi hota hai jinke sath shuru se hi vibe match kar jaate hai & close hone ke liye you don't need to talk to them for months.. bas ho jata hai! I hope ke ye bond, energy, trolls future me bhi barkarar rahega, even as life keeps moving forward!

Baki dua ye hai ke Allah tumhe sehat de, success de, & wo sab kuchh de jo tum sacche dil se acche intention ke sath mangti ho. & yeah I never intentionally ignored your message, kabhi kabhi sach me notifications me nai milta😭 Lastly.. Thank you for everything, Maki! Stay Blessed!...

Once again, Eid Mubarak!

- Your billi ka business plan karne wala, Ded Inside`,

  shino: `Eid Mubarak Shino & Mustafa 🌙

Yo broskis.... kase ho?? Yaar ye baat to sach hai ke mai ap dono ko peani, pali, queenz, masab inke tarha 10 months se nahi pehchanta hu, but you know what? I realized something while talking to you two for the past 2 months.. kuchh log closed ones banne ke liye mahino nahi kuchh lambha hi kafi hai.. pehle it used to be some others yapping all day long, but now? specially if i talk about the duration of Ramadan, it was mostly 3 of us throughout the whole time.. & kismat toh dekho mai itne dino se hu Aurlets me, par mod hum tino toh ek sath hi bane😂

ab toh ek bhi gayeb rehte ho toh chat dead lagne lagta hai!
Thanks to you two for everything.. I hope ke ye dosti agey bhi barkarar rahe, even as life keeps moving forward.. Baki dua ye rahega ke ap dono ko success de, sehat de, izzat de, qt de, aur wo sab kuchh de jo ap log acche intention ke sath mangte ho! & yeah ab tak toh samajh aa hi geya hoga ap dono ko ek sath kyu likh raha hu.. We a trio fr :3

Once again, Eid Mubarak yaarz!

- Ded Inside`,

  malu: `Eid Mubarak Malu & Lilly 🌙

Hey Malu & Lillyy!!

I honestly don’t even know where to start with this one, but it feels kinda crazy thinking that it’s already been like 10 months since all of us were just random people in Gupshup… and now here we are! Late night chats, fun, laughters, members breaking apart to form Aurlets.. we've been through it all.. damn! Even though we didn’t talk that much one-on-one, you both were always a constant presence in the server. Like, it just wouldn’t feel the same without you guys being around. So.. on this occassion of Eid, I would like to thank you for everything & wish you both good health, happiness, and success in everything you do.. May you get everything you truly wish for with good intentions!

AND YEAHHHH… still lowkey disappointed we never got that selfie in Maldives, but that just means I owe you guys one in the future ig? :3

Once again, Eid Mubarak to both of you! Enjoy it to the fullets!!

- Ded Inside`,

  hajji: `Eid Mubarak Hajji 🌙

Yo Hajjiiii… kase ho? :3

Yaar sach bolu toh, even though I don’t know you for like 10 months jaisa baki kuch logon ko jaanta hu, but the past couple of months with you? solid scenes tha fr.. Specially Ramadan ke time pe jo hamare chats the… random yaps, inside jokes, peak bakchodi, aur wo hamara certified bromance🫦 & what not???. Ab toh aisa ho gaya hai ke agar tum online na ho kabhi kabhi, chat ka vibe hi off lagta hai.

But haan, jitna bhi fun ho, ek reality toh same hi hai na… aage jaake sab busy ho jayenge apni apni life me & all of a sudden we'll become strangers with a lil bubble of memories left behind in this virtual world of Aurlets.. But yeah Pakistan jab jana hoga, I'll ofc notify you, toh bas reels bhejna band maat karna & stay in touch :3

Baki dua yehi hai ke Allah tumhe sehat de, success de, aur wo sab kuchh de jo tum sach me chahte ho, with good intentions. Thank you for everything man!

Once again, Eid Mubarak!

- Ded Inside`,

  allama: `Eid Mubarak Allama 🌙

Hey Allama! Kasi ho? Well, I really donno how to write letters & shyts so lemmejust start randomly & write jo bhi dil me aye, warna "Ded" wala baat kase rahega is khad me :3

Yaar sach bolu toh, tum un logo me se ho jinke sath baat hota rehta hai regularly & kabhi properly realize nahi hota ke kitna time ho gaya.. Like 10 months is actually crazy when you think about it!! Late night chats, raat me gaaney ka mehfil, Gupshup se Aurlets ka alag hona.. We've been through all of it! We are.. growing up so fast haina?

Even though humne shayad utni deep baatein nahi ki jitni kuch aur logon ke sath hoti hai, but still… you’ve always been there. And it's exactly this presence that actually matters! Like, it just wouldn’t feel the same without you being around. So.. on this occassion of Eid, I would like to thank you for everything & wish you good health, happiness, and success in everything you do.. May you get everything you truly wish for with good intentions!

AND YEAHHH... I ain't forgetting ke kase tumne Delulu ko disband karke mera naak kata diya tha pali & peani ke samne.. Mai toh sina taanke Aurlets gang chhorke Delulu me aa geya tha tumhare kehne pe & akey khud delulu baan geya😀🥀

Anyways.. Once again, Eid Mubarak Allama!

- Ded Inside`,

  cipher: `Eid Mubarak Cipher 🌙

Cipherrrrr yaarrr kese ho? Well, I really donno how to write letters & shyts so lemmejust start randomly & write jo bhi dil me aye, warna "Ded" wala baat kase rahega is khad me :3

Yaar sach bolu toh, tum un logo me se ho jinke sath baat hota rehta hai regularly & kabhi properly realize nahi hota ke kitna time ho gaya.. Like 10 months is actually crazy when you think about it!! Late night chats, bodybuilding, raat me gaaney ka mehfil, Gupshup se Aurlets ka alag hona.. We've been through all of it! We are.. growing up so fast haina?

Even though humne shayad utni deep baatein nahi ki jitni kuch aur logon ke sath hoti hai, but there's a reason why you're on this list.. It's the way you're chasing your passion! Never stop man, cz I can see the immense potential there.. Ek time par mera shauk tha ye sab, but.. yk life ka mar para toh I had to quit most of my hobbies.. However, your "Every set till failure" series was exactly what brought me back to the gym again! I can't thank you enough for this & Never give up man, cz I can see the immense potential there.. We're genuinely rooting for you!

Baki Allah tumhe sehat de, success de, & wo sab kuchh de that you wish for with a good intention! Once again, Eid Mubarak! & yeah last thing.. kabhi kuchh heavy lage toh just know that I'm only a text away from you! Take love jaanz <3

- Your fan, Ded Inside`,

  fari: `Eid Mubarak Fari 🌙

Fariniiiii, kesi hooo?? 

Ajeeb hai na yaar, it's even hard to believe ke 10 months ho gaye that I've been knowing you guys! Tumhari toh shayed aur bhi zyada waqt ho geyi.. even though reality ye bhi hai ke agey jake at a point we all will get busy with our own lives.. tab shayed we'll just become strangers with a lil bubble of memories left behind in the virtual world..

But ykw? All the late night chats, gaane ke mehfil, laughters, trolls, aurlets gupshup ka lore.. I have been through ALL OF THESE with you guys.. So, bhalehi ye sab temporary hai, par ye moments, ye memories, tum sab.. y'all will remain as a precious part of this chapter of my life! & Ha northern Pakistan toh ghumne jaunga hi, agar Abottabad jana hua toh I'll ofc let you know, mujhe chhapri kabab ka treat dena!!.. Sabke samne udhar Princess Fardini na bol dena mujhe bas🙄

Baki Allah tumhe sehat de, success de, & wo sab kuchh de that you wish for with a good intention.. Thank you for everything Fariniiii! Bas Ray ko chhor do, he's mine :3

Once again, Eid Mubarak!

- Princess Fardini`,

  kole: `Eid Mubarak Kole 🌙

Hey Kole! Kasi ho? Well, I really donno how to write letters & shyts so lemmejust start randomly & write jo bhi dil me aye, warna "Ded" wala baat kase rahega is khad me.. haina? :3

Yaar sach bolu toh, tum un logo me se ho jinke sath baat hota rehta hai regularly & kabhi properly realize nahi hota ke kitna time ho gaya.. Like 10 months is actually crazy when you think about it!! Late night chats, raat me gaaney ka mehfil, Gupshup se Aurlets ka alag hona.. We've been through all of it! 

Even though humne shayad utni deep baatein nahi ki jitni kuch aur logon ke sath hoti hai, but still… you’ve always been there. And it's exactly this presence that actually matters! Like, it just wouldn’t feel the same without you being around. So.. on this occassion of Eid, I would like to thank you for everything & wish you good health, happiness, and success in everything you do.. May you get everything you truly wish for with good intentions!

AND YEAHHH.. tumhare andar toh mera baccha tha, 9 mahine lagta hai, 10 mahine ho gaye.. ab bhi kyu nahi ho raha? Push man! 😢

Anyways.. Once again, Eid Mubarak Kole!

- Ded Inside`,

  mahi: `Eid Mubarak Mahi 🌙

Mahilaaaa!! Kesi ho? :3

Yaar, dekho I really don't know how to write letters & all.. So, I'm just writing whatever comes to my mind! Cz agar soch samajhke hi likhna hai toh "Ded" wala vibe kaha reh jayega? Haina? :3

10 months… it’s kinda crazy na? Late night yaps, vc me gaaney ka mehfil, gupshup se bichhar ke Aurlets banna & Aurlets ka yaha tak ana.. We've been through all of these! And even though I know the reality yaar, ek din ye kuchh nahi rahega & we will become strangers with a lil bubble of memories left behind in the virtual world.. par phir bhi the Aurlets, the memories, & the people were really a precious addition to this specific chapter of my life..

Even though we might not always talk about everything directly, I just want you to know - I do notice & I do care.. life hasn’t been that easy on you lately… people changing, fake friendships, ghar ka environment bhi peaceful na hona… it all piles up. And sometimes it just feels like everything is happening at once. But you know what? You’re stronger than you think! Shayad abhi cheezein messy lag rahi ho, but remember.. this isn’t your whole story… just a phase of it. Keep fighting gurl cz yaad hai? Once a Bangali baba named Ded Inside said "Raat ka andhera chahe jitna bhi gehra aur khaufnak hi kyu na ho jaye.. sabr rakho kyuki ye sirf ek guzarta hua daur hai, jiske baad subha ka raushni tumhara intezaar kar rahi hoti hai."

So on this Eid, I just wanna wish you peace.. real peace.. Along with happiness, good health, and success in everything you do. May Allah ease your hardships and give you everything you truly deserve. Aur agar kabhi lage ke sab kuch heavy ho raha hai, ya kisi se baat karni hai.. you know right? Ded is just a text away. You don’t have to deal with everything alone. Baki Best of luck for your college exams & uni admissions Mahi!! Aurlets basi is rooting for your success.. So, never give up!

Once again, Eid Mubarak Mahi!

- Ded Inside`,

  merited: `Eid Mubarak Aayan 🌙

Hey Merited! Kasi ho? Well, I really donno how to write letters & shyts so lemmejust start randomly & write jo bhi dil me aye, warna "Ded" wala baat kase rahega is khad me :3

Yaar sach bolu toh, tum un logo me se ho jinke sath baat hota rehta hai regularly & kabhi properly realize nahi hota ke kitna time ho gaya.. Like 10 months is actually crazy when you think about it!! Late night chats, raat me gaaney ka mehfil, Gupshup se Aurlets ka alag hona.. We've been through all of it! 

Even though humne shayad utni deep baatein nahi ki jitni kuch aur logon ke sath hoti hai, but still… you’ve always been there. And it's exactly this presence that actually matters! Like, it just wouldn’t feel the same without you being around. So.. on this occassion of Eid, I would like to thank you for everything & wish you good health, happiness, and success in everything you do.. May you get everything you truly wish for with good intentions!

AND YEAHHH... Leave Kiara & be mine🫦
Once again, Eid Mubarak!

- Ded Inside`,

  brzrkr: `Eid Mubarak Zinger 🌙

Brzrkrrrr kase ho?
Well hamara shuru toh accha nahi hua tha to be very honest.. In fact chat me hamare first interaction pe I literally got blocked by you😭 But ha baadme pata chala banda acche ho tum.. Sach toh ye hai ke the special reason for which you're included on this list is music! Never stop man, I can see the immense potential there.. Ek time par mera shauk tha ye sab, but.. yk life ka mar para toh I had to quit most of my hobbies.. However, your version of "poster boy" reignited the spark inside me & maine phirse acoustic guitar practice karna shuru kya hai on a regular basis!

Baki I'm yet to know more about you, & I hope that even as life keeps moving forward, hamare regular baatey hote rehenge.. Best wishes for you & on this occassion of Eid, mere dua ye rehega ke Allah tumhe sehat de, success de, & wo sab kuchh de that you wish for with good intentions. 

Once again, Eid Mubarak Mr. "Gonna be Admin"

- Ded Inside`,

  everyone: `Eid Mubarak Aurlets Fam 🌙

To everyone whose name isn't on a specific envelope — this one is for you.

Even if we didn’t talk much or interact every day, you are still a part of Aurlets and part of the memories that made this place special. Servers are not built by a few people alone — it’s the presence of everyone that creates the vibe.

May Allah bless you with happiness, good health, and success in everything you pursue. I hope your Eid is filled with peace, laughter, and good moments with the people you care about.

Thank you for being a part of Aurlets.

— Aurlets Management`
};
