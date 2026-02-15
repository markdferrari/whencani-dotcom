import { getPopularGames } from './lib/igdb.js';

async function test() {
  try {
    console.log('Testing getPopularGames...');
    const games = await getPopularGames(5);
    console.log('Result:', games.length, 'games');
    console.log('First game:', games[0]);
  } catch (error) {
    console.error('Error:', error);
  }
}

test();