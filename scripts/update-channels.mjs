import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CATEGORIES = [
  { name: 'News', m3u: 'https://iptv-org.github.io/iptv/categories/news.m3u', icon: 'Globe' },
  { name: 'Sports', m3u: 'https://iptv-org.github.io/iptv/categories/sports.m3u', icon: 'Gamepad2' },
  { name: 'Movies', m3u: 'https://iptv-org.github.io/iptv/categories/movies.m3u', icon: 'Film' },
  { name: 'Entertainment', m3u: 'https://iptv-org.github.io/iptv/categories/entertainment.m3u', icon: 'Tv' },
  { name: 'Kids', m3u: 'https://iptv-org.github.io/iptv/categories/kids.m3u', icon: 'MonitorPlay' },
  { name: 'Music', m3u: 'https://iptv-org.github.io/iptv/categories/music.m3u', icon: 'MonitorPlay' },
];

const OUTPUT_FILE = path.join(__dirname, '..', 'public', 'channels.json');

function generateLogoUrl(name) {
  if (!name) name = "TV";
  const cleanName = encodeURIComponent(name);
  const colors = ['0D8ABC', 'E50914', '222222', '00A3E0', '004B87', '005A9B', '1D3A83', 'E5A91E', '14345B', '5B1E8A', 'FF4500', '00843D', '0D47A1', 'FF6600', 'E10B13', 'FFED00', 'F75C03', '008080', '444444', 'E25453', 'F7941D', '00B4FF', '4CAF50', '9C27B0', '7CB342', 'E91E63', '00BCD4', 'FF9800', '3F51B5', '8BC34A', 'F44336'];
  const bgColor = colors[name.length % colors.length];
  const textColor = bgColor === 'FFED00' || bgColor === 'FFFF00' ? '000' : 'fff';
  return `https://ui-avatars.com/api/?name=${cleanName}&background=${bgColor}&color=${textColor}&size=256&font-size=0.33`;
}

async function isChannelLive(url) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000); // 3 sec timeout for faster checking
    
    const response = await fetch(url, { 
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)',
        'Accept': 'application/vnd.apple.mpegurl,*/*;q=0.9',
      },
      signal: controller.signal
    });
    
    clearTimeout(timeout);
    return response.ok;
  } catch (error) {
    return false;
  }
}

async function processInBatches(items, batchSize, processFn) {
  let results = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchPromises = batch.map(item => processFn(item));
    const batchResults = await Promise.all(batchPromises);
    results = results.concat(batchResults);
    process.stdout.write(`\rProgress: ${Math.min(i + batchSize, items.length)} / ${items.length}`);
  }
  return results;
}

// Simple sleep to prevent hammering network
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function runAutomation() {
  console.log(`[${new Date().toISOString()}] Starting Resilient Deep Filter...`);
  
  const finalData = [];
  let totalLiveChannels = 0;

  // Step 1: Pre-fetch ALL M3U files first to avoid network timeout later
  console.log('Pre-fetching all M3U playlists...');
  const categoryData = [];
  for (const cat of CATEGORIES) {
    try {
      const response = await fetch(cat.m3u);
      if (!response.ok) throw new Error('Bad response');
      const text = await response.text();
      categoryData.push({ cat, text });
      await sleep(1000); // Wait 1s between fetches
    } catch (e) {
      console.error(`Failed to download ${cat.name} playlist:`, e.message);
    }
  }

  // Step 2: Parse and Ping
  for (const { cat, text } of categoryData) {
    console.log(`\n\n--- Processing ${cat.name} ---`);
    const lines = text.split('\n');
    const allChannels = [];
    let currentChannel = {};

    for (const line of lines) {
      if (line.startsWith('#EXTINF:')) {
        const logoMatch = line.match(/tvg-logo="([^"]+)"/);
        if (logoMatch && logoMatch[1]) currentChannel.logo = logoMatch[1];
        const parts = line.split(',');
        if (parts.length > 0) currentChannel.name = parts[parts.length - 1].trim();
      } else if (line.startsWith('http')) {
        currentChannel.url = line.trim();
        if (!currentChannel.logo) currentChannel.logo = generateLogoUrl(currentChannel.name);
        currentChannel.id = Math.random().toString(36).substring(2, 9);
        if (currentChannel.name && currentChannel.url) {
          allChannels.push(currentChannel);
        }
        currentChannel = {};
      }
    }

    console.log(`Found ${allChannels.length} raw channels. Starting Deep Ping Check...`);
    
    // Ping check all channels in batches of 25 (safer connection limit)
    const liveChannels = [];
    await processInBatches(allChannels, 25, async (channel) => {
      const isLive = await isChannelLive(channel.url);
      if (isLive) {
        liveChannels.push(channel);
      }
    });

    console.log(`\n-> Saved ${liveChannels.length} ALIVE channels.`);
    
    if (liveChannels.length > 0) {
      finalData.push({
        category: cat.name,
        icon: cat.icon,
        channels: liveChannels
      });
      totalLiveChannels += liveChannels.length;
    }
    
    // Let OS clean up sockets before next category
    await sleep(2000);
  }

  // Save to public/channels.json
  await fs.writeFile(OUTPUT_FILE, JSON.stringify(finalData, null, 2), 'utf-8');
  console.log(`\n[${new Date().toISOString()}] ✅ Deep Filter complete! Total ${totalLiveChannels} WORKING channels saved.`);
}

runAutomation();
