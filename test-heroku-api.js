const https = require('https');

function testHerokuAPI() {
  const url = 'https://movie-api-group2-20e70498bde4.herokuapp.com/api/v1/moviebyyear?year=2019';
  
  const options = {
    headers: {
      'x-api-key': '0b071ddf-967d-4b1a-b39d-47134d9cb881',
      'User-Agent': 'Node.js Test Client'
    }
  };
  
  console.log('Testing Heroku API for 2019 movies...');
  console.log(`URL: ${url}\n`);
  
  https.get(url, options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const jsonData = JSON.parse(data);
        
        console.log(`Status Code: ${res.statusCode}`);
        console.log(`Total movies returned: ${jsonData.data ? jsonData.data.length : 'N/A'}`);
        console.log(`Total count field: ${jsonData.total || 'N/A'}\n`);
        
        if (jsonData.data && Array.isArray(jsonData.data)) {
          // Check for duplicates in the API response
          const titleCounts = {};
          const movieIds = new Set();
          let duplicateIds = 0;
          
          jsonData.data.forEach(movie => {
            const key = `${movie.title}|${movie.release_year}`;
            titleCounts[key] = (titleCounts[key] || 0) + 1;
            
            if (movieIds.has(movie.movie_id)) {
              duplicateIds++;
            }
            movieIds.add(movie.movie_id);
          });
          
          const duplicates = Object.entries(titleCounts).filter(([key, count]) => count > 1);
          
          if (duplicates.length > 0) {
            console.log('🚨 FOUND DUPLICATES in API response:');
            duplicates.slice(0, 10).forEach(([key, count]) => {
              const [title, year] = key.split('|');
              console.log(`   "${title}" (${year}): appears ${count} times`);
            });
          } else {
            console.log('✅ No duplicates found in API response');
          }
          
          if (duplicateIds > 0) {
            console.log(`🚨 Found ${duplicateIds} duplicate movie IDs`);
          }
          
          // Show first few movies
          console.log('\nFirst 5 movies in response:');
          jsonData.data.slice(0, 5).forEach((movie, index) => {
            console.log(`${index + 1}. ID: ${movie.movie_id} - "${movie.title}"`);
          });
          
        } else {
          console.log('❌ Invalid response format');
          console.log('Response:', JSON.stringify(jsonData, null, 2).substring(0, 500));
        }
        
      } catch (error) {
        console.error('❌ Error parsing JSON:', error.message);
        console.log('Raw response:', data.substring(0, 500));
      }
    });
    
  }).on('error', (error) => {
    console.error('❌ Request error:', error.message);
  });
}

testHerokuAPI();