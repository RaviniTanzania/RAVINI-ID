// Test importing client modules to detect any module loading or initialization errors
import { readdirSync, statSync } from 'fs';
import { join } from 'path';

console.log('Testing client module imports...');

async function testImports() {
  const modulesToTest = [
    '../src/types/index.ts',
    '../src/lib/translations.ts',
    '../src/lib/storage.ts',
    '../src/lib/offlineQueue.ts',
    '../src/lib/useNetworkStatus.ts',
    '../src/lib/useNativeBridge.ts',
    '../src/lib/downloadService.ts',
    '../src/lib/shareService.ts',
  ];

  for (const mod of modulesToTest) {
    try {
      const imported = await import(mod);
      console.log(`✅ ${mod}: successfully loaded`);
    } catch (err: any) {
      console.error(`❌ FAILED ${mod}:`, err.message);
    }
  }

  // Test storage calls in fresh node environment where window/localStorage might be mocked or missing
  try {
    const { 
      getPermanentUsers, 
      getCurrentUserId, 
      isUserAuthenticated, 
      getPermanentPosts, 
      getPermanentStories, 
      getPermanentMarketItems,
      getOfficialAds,
      getPermanentComments
    } = await import('../src/lib/storage');

    console.log('Testing storage initial calls...');
    const users = getPermanentUsers();
    console.log(`Loaded ${users.length} users`);
    const currId = getCurrentUserId();
    console.log(`Current user ID: ${currId}`);
    const isAuth = isUserAuthenticated();
    console.log(`Is authenticated: ${isAuth}`);
    const posts = getPermanentPosts();
    console.log(`Loaded ${posts.length} posts`);
    const stories = getPermanentStories();
    console.log(`Loaded ${stories.length} stories`);
    const market = getPermanentMarketItems();
    console.log(`Loaded ${market.length} market items`);
    const ads = getOfficialAds();
    console.log(`Loaded ${ads.length} ads`);
    console.log('✅ Storage functions executed successfully!');
  } catch (err: any) {
    console.error('❌ Error executing storage functions:', err);
  }
}

testImports().then(() => console.log('Done testing core modules.'));
