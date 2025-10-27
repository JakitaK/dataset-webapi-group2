const https = require('https');

function testAPIDatabase() {
  const url = 'https://movie-api-group2-20e70498bde4.herokuapp.com/api/v1/moviebyyear?year=2019';
  
  const options = {
    headers: {
      'x-api-key': '0b071ddf-967d-4b1a-b39d-47134d9cb881',
      'User-Agent': 'Node.js Test Client'
    }
  };
  
  console.log('🔍 Testing Heroku API database connection...\n');
  
  https.get(url, options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const jsonData = JSON.parse(data);
        
        if (jsonData.data && Array.isArray(jsonData.data)) {
          // Analyze the movie IDs to understand which database is being used
          const movieIds = jsonData.data.map(movie => movie.movie_id);
          const minId = Math.min(...movieIds);
          const maxId = Math.max(...movieIds);
          
          console.log(`API returned ${jsonData.data.length} movies for 2019`);
          console.log(`Movie ID range: ${minId} - ${maxId}`);
          console.log(`Expected range: 29089 - 38414\n`);
          
          if (minId < 29089 || maxId > 38414) {
            console.log('🚨 API is NOT using the same database we tested!');
            console.log('The API movie IDs are outside the expected range.');
          } else {
            console.log('✅ API seems to be using the correct database');
          }
          
          // Show some sample IDs
          console.log('\nSample movie IDs from API:');
          jsonData.data.slice(0, 10).forEach((movie, index) => {
            console.log(`${index + 1}. ID: ${movie.movie_id} - "${movie.title}"`);
          });
          
          // Check for the specific movie we know exists
          const movie1917 = jsonData.data.find(m => m.title === '1917' && m.release_year === 2019);
          if (movie1917) {
            console.log(`\n"1917" movie ID from API: ${movie1917.movie_id}`);
            console.log(`Expected "1917" movie ID from our test: 30849`);
            
            if (movie1917.movie_id !== 30849) {
              console.log('🚨 DIFFERENT DATABASE! API is not using our production database.');
            }
          }
          
        }
        
      } catch (error) {
        console.error('❌ Error parsing response:', error.message);
      }
    });
    
  }).on('error', (error) => {
    console.error('❌ Request error:', error.message);
  });
}

testAPIDatabase();