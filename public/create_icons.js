const fs = require('fs');
const { createCanvas } = require('canvas');

const icons = [
    { id: 'space-shooter', color: '#4a90e2', text: '🚀' },
    { id: 'rpg', color: '#e74c3c', text: '⚔️' },
    { id: 'garden', color: '#2ecc71', text: '🌱' },
    { id: 'puzzle', color: '#9b59b6', text: '🧩' }
];

// Create images directory if it doesn't exist
if (!fs.existsSync('./public/images')) {
    fs.mkdirSync('./public/images', { recursive: true });
}

// Generate each icon
icons.forEach(icon => {
    const size = 64;
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');
    
    // Draw background
    ctx.fillStyle = icon.color;
    ctx.fillRect(0, 0, size, size);
    
    // Draw text (emoji)
    ctx.font = '40px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fff';
    ctx.fillText(icon.text, size/2, size/2);
    
    // Save as PNG
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(`./public/images/${icon.id}-icon.png`, buffer);
});

console.log('Icons created successfully!');
