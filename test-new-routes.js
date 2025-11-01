/**
 * Test script for new POST, PUT, DELETE routes
 * Run this to test the new write operations
 */

const https = require('https');

const API_BASE = 'https://movie-api-group2-20e70498bde4.herokuapp.com/api/v1';
const API_KEY = '0b071ddf-967d-4b1a-b39d-47134d9cb881'; // Replace with correct key

async function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(API_BASE + path);
    
    const options = {
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'x-api-key': API_KEY,
        'Content-Type': 'application/json',
        'User-Agent': 'Test Client'
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(responseData);
          resolve({
            status: res.statusCode,
            data: jsonData
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            data: responseData
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function testNewRoutes() {
  console.log('🧪 Testing New POST, PUT, DELETE Routes\n');

  try {
    // Test 1: Create a new director
    console.log('1. Testing POST /directors - Create Director');
    const newDirector = await makeRequest('POST', '/directors', {
      name: 'Test Director ' + Date.now()
    });
    console.log(`   Status: ${newDirector.status}`);
    console.log(`   Response:`, newDirector.data);

    if (newDirector.status === 201 && newDirector.data.data) {
      const directorId = newDirector.data.data.director_id;
      
      // Test 2: Update the director
      console.log('\n2. Testing PUT /directors/:id - Update Director');
      const updatedDirector = await makeRequest('PUT', `/directors/${directorId}`, {
        name: 'Updated Test Director ' + Date.now()
      });
      console.log(`   Status: ${updatedDirector.status}`);
      console.log(`   Response:`, updatedDirector.data);

      // Test 3: Get all directors to see our new one
      console.log('\n3. Testing GET /directors - List Directors');
      const allDirectors = await makeRequest('GET', '/directors?limit=5');
      console.log(`   Status: ${allDirectors.status}`);
      console.log(`   Found ${allDirectors.data.data?.length || 0} directors`);

      // Test 4: Delete the test director
      console.log('\n4. Testing DELETE /directors/:id - Delete Director');
      const deletedDirector = await makeRequest('DELETE', `/directors/${directorId}`);
      console.log(`   Status: ${deletedDirector.status}`);
      console.log(`   Response:`, deletedDirector.data);
    }

    // Test 5: Try to create a new movie
    console.log('\n5. Testing POST /movies - Create Movie');
    const newMovie = await makeRequest('POST', '/movies', {
      title: 'Test Movie ' + Date.now(),
      release_year: 2024,
      runtime_minutes: 120,
      rating: '8.5',
      overview: 'A test movie for API validation'
    });
    console.log(`   Status: ${newMovie.status}`);
    console.log(`   Response:`, newMovie.data);

    console.log('\n✅ Route testing completed!');

  } catch (error) {
    console.error('❌ Error during testing:', error);
  }
}

// Run the tests
testNewRoutes();