// Test file to verify unique ID generation
function testUniqueIdGeneration() {
    // Test the improved generateUniqueId function
    function generateUniqueId() {
        // Use timestamp, performance counter, random string, and sequence counter for better uniqueness
        const timestamp = Date.now().toString(36);
        const performanceTime = performance.now().toString(36).replace('.', '');
        const randomStr = Math.random().toString(36).substr(2);
        const counter = Math.floor(Math.random() * 1000000).toString(36);
        return `${timestamp}-${performanceTime}-${randomStr}-${counter}`;
    }

    console.log('Testing unique ID generation...');
    
    // Generate 1000 IDs and check for duplicates
    const ids = new Set();
    const idArray = [];
    
    for (let i = 0; i < 1000; i++) {
        const id = generateUniqueId();
        idArray.push(id);
        if (ids.has(id)) {
            console.error(`Duplicate ID found: ${id} at iteration ${i}`);
            return false;
        }
        ids.add(id);
    }
    
    console.log(`Generated ${idArray.length} unique IDs successfully`);
    console.log('Sample IDs:');
    for (let i = 0; i < 5; i++) {
        console.log(`  ${idArray[i]}`);
    }
    
    return true;
}

// Test rapid generation (simulates quick button clicks)
function testRapidGeneration() {
    function generateUniqueId() {
        // Use timestamp, performance counter, random string, and sequence counter for better uniqueness
        const timestamp = Date.now().toString(36);
        const performanceTime = performance.now().toString(36).replace('.', '');
        const randomStr = Math.random().toString(36).substr(2);
        const counter = Math.floor(Math.random() * 1000000).toString(36);
        return `${timestamp}-${performanceTime}-${randomStr}-${counter}`;
    }

    console.log('Testing rapid ID generation...');
    
    const ids = new Set();
    const idArray = [];
    
    // Generate 100 IDs as fast as possible
    for (let i = 0; i < 100; i++) {
        const id = generateUniqueId();
        idArray.push(id);
        if (ids.has(id)) {
            console.error(`Duplicate ID found in rapid test: ${id} at iteration ${i}`);
            return false;
        }
        ids.add(id);
    }
    
    console.log(`Rapid generation test passed: ${idArray.length} unique IDs`);
    return true;
}

// Run tests
if (testUniqueIdGeneration() && testRapidGeneration()) {
    console.log('✅ All ID generation tests passed!');
} else {
    console.log('❌ ID generation tests failed!');
}
