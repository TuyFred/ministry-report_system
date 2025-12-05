#!/usr/bin/env node

/**
 * Production Deployment Verification Script
 * Tests both frontend and backend connectivity
 */

const https = require('https');

const FRONTEND_URL = 'https://ministry-report-system.vercel.app';
const BACKEND_URL = 'https://ministry-report-system.onrender.com';
const HEALTH_URL = `${BACKEND_URL}/api/health`;

console.log('🔍 Verifying Production Deployment...\n');

// Test Backend
function testBackend() {
    return new Promise((resolve, reject) => {
        https.get(BACKEND_URL, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (res.statusCode === 200) {
                    console.log('✅ Backend is accessible');
                    console.log(`   URL: ${BACKEND_URL}`);
                    console.log(`   Response: ${data}\n`);
                    resolve();
                } else {
                    console.log(`❌ Backend returned status ${res.statusCode}\n`);
                    reject();
                }
            });
        }).on('error', (err) => {
            console.log('❌ Backend is not accessible');
            console.log(`   Error: ${err.message}\n`);
            reject(err);
        });
    });
}

// Test Health Endpoint
function testHealth() {
    return new Promise((resolve, reject) => {
        https.get(HEALTH_URL, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (res.statusCode === 200) {
                    const health = JSON.parse(data);
                    console.log('✅ Health Check Passed');
                    console.log(`   Status: ${health.status}`);
                    console.log(`   Database: ${health.db}\n`);
                    resolve();
                } else {
                    console.log(`❌ Health check failed with status ${res.statusCode}\n`);
                    reject();
                }
            });
        }).on('error', (err) => {
            console.log('❌ Health endpoint not accessible');
            console.log(`   Error: ${err.message}\n`);
            reject(err);
        });
    });
}

// Test Frontend
function testFrontend() {
    return new Promise((resolve, reject) => {
        https.get(FRONTEND_URL, (res) => {
            if (res.statusCode === 200) {
                console.log('✅ Frontend is accessible');
                console.log(`   URL: ${FRONTEND_URL}\n`);
                resolve();
            } else {
                console.log(`❌ Frontend returned status ${res.statusCode}\n`);
                reject();
            }
        }).on('error', (err) => {
            console.log('❌ Frontend is not accessible');
            console.log(`   Error: ${err.message}\n`);
            reject(err);
        });
    });
}

// Run tests
async function verify() {
    try {
        await testBackend();
        await testHealth();
        await testFrontend();
        
        console.log('═══════════════════════════════════════════');
        console.log('🎉 All Systems Operational!');
        console.log('═══════════════════════════════════════════');
        console.log(`\n🌍 Your application is live at:\n   ${FRONTEND_URL}\n`);
        console.log('✨ Anyone in the world can now access it!\n');
        
    } catch (error) {
        console.log('═══════════════════════════════════════════');
        console.log('⚠️  Some Issues Detected');
        console.log('═══════════════════════════════════════════');
        console.log('\n📋 Next Steps:');
        console.log('1. Check Render: Verify DATABASE_URL is set');
        console.log('2. Check Render: Verify JWT_SECRET is set');
        console.log('3. Check Logs: Review deployment logs');
        console.log('4. Wait: Render may take 1-2 minutes to start\n');
    }
}

verify();
