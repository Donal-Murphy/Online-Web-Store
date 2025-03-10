// calculate.js - A custom node module to calculate the total price of items in cart

// Function to calculate total price of items
function calculateTotalPrice(items) {
    // Initialize total price
    let totalPrice = 0;

    // Iterate over each item and sum up the prices
    items.forEach(item => {
        totalPrice += item.price || 0; // Add item price to total, default to 0 if price is undefined
    });

    return totalPrice;
}

module.exports = {
    calculateTotalPrice
};