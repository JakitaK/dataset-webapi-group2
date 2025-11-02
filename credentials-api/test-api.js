// Test credentials API endpoints
const http = require('http');

const BASE_URL = 'http://localhost:3001';

function makeRequest(method, path, data = null) {
    return new Promise((resolve, reject) => {
        const url = new URL(path, BASE_URL);
        const options = {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const req = http.request(url, options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    resolve({
                        status: res.statusCode,
                        data: JSON.parse(body)
                    });
                } catch (e) {
                    resolve({
                        status: res.statusCode,
                        data: body
                    });
                }
            });
        });

        req.on('error', reject);
        
        if (data) {
            req.write(JSON.stringify(data));
        }
        
        req.end();
    });
}

async function runTests() {
    console.log('🧪 Testing Credentials API\n');

    try {
        // Test 1: Health check
        console.log('1. Testing health endpoint...');
        const health = await makeRequest('GET', '/health');
        console.log('   ✅ Status:', health.status);
        console.log('   📄 Response:', JSON.stringify(health.data, null, 2));

        // Test 2: Get carriers
        console.log('\n2. Testing carriers endpoint...');
        const carriers = await makeRequest('GET', '/auth/verify/carriers');
        console.log('   ✅ Status:', carriers.status);
        console.log('   📄 Response:', JSON.stringify(carriers.data, null, 2));

        // Test 3: Register (will fail without DB, but should show validation)
        console.log('\n3. Testing registration validation...');
        const register = await makeRequest('POST', '/auth/register', {
            firstname: 'Test',
            lastname: 'User',
            email: 'test@example.com',
            username: 'testuser',
            password: 'TestPass123!',
            phone: '1234567890'
        });
        console.log('   ✅ Status:', register.status);
        console.log('   📄 Response:', JSON.stringify(register.data, null, 2));

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

// Run tests
runTests().then(() => {
    console.log('\n✅ Tests completed');
    process.exit(0);
}).catch(err => {
    console.error('\n❌ Tests failed:', err);
    process.exit(1);
});
