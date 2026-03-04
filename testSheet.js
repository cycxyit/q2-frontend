const jwt = require('jsonwebtoken');

const token = jwt.sign(
    { id: 999, email: "test-user@example.com", role: "CUSTOMER" },
    process.env.JWT_SECRET || 'ecommerce_secret_key_123'
);

const runTest = async () => {
    try {
        const response = await fetch('http://localhost:5000/api/orders', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                items: [{ productId: 1, name: 'Minimalist Watch', quantity: 1, price: 120 }],
                totalAmount: 120,
                phone: "123-456-7890",
                address: "123 Test St",
                remarks: "Test order"
            })
        });

        const data = await response.text();
        console.log(`Status: ${response.status}`);
        console.log(`Response: ${data}`);
    } catch (e) {
        console.error(e);
    }
}

runTest();
