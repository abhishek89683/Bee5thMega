require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../models/Product');
const { connectDB } = require('../config/db');
const base = require('./products.json');

function genProducts() {
  const categories = [
    { name: 'Mobiles', brands: ['iphone', 'Novus', 'OneTek', 'Alpha'] },
    { name: 'Audio', brands: ['SoundMax', 'EchoBeat', 'BoomBox', 'ToneX'] },
    { name: 'TVs', brands: ['ViewPlus', 'LuxView', 'Pixio'] },
    { name: 'Laptops', brands: ['GigaWare', 'Feather', 'WorkMate', 'Ultra'] },
    { name: 'Cameras', brands: ['Photon', 'Aurora', 'GoAction'] },
    { name: 'Wearables', brands: ['Pulse', 'FitLine'] },
    { name: 'Accessories', brands: ['ClickPro', 'KeyForge', 'PortaLink'] },
    { name: 'Appliances', brands: ['HomeChef', 'CleanBot', 'Kitchena'] },
    { name: 'Fashion', brands: ['Stride', 'Moda', 'Basics'] },
    { name: 'Home & Kitchen', brands: ['HomeDine', 'LoomCraft', 'LiteUp'] },
  ];

  // Curated, category-correct image pools (stable placeholder images by category)
  const imagePool = {
    'Mobiles': [
      'https://placehold.co/800x600/fff/111?text=Smartphone',
      'https://placehold.co/800x600/fff/111?text=Android+Phone',
      'https://placehold.co/800x600/fff/111?text=5G+Phone',
      'https://placehold.co/800x600/fff/111?text=Camera+Phone',
      'https://placehold.co/800x600/fff/111?text=Budget+Phone',
      'https://placehold.co/800x600/fff/111?text=Flagship+Phone'
    ],
    'Audio': [
      'https://placehold.co/800x600/ffffff/111111?text=Headphones',
      'https://placehold.co/800x600/ffffff/111111?text=Earbuds',
      'https://placehold.co/800x600/ffffff/111111?text=Bluetooth+Speaker',
      'https://placehold.co/800x600/ffffff/111111?text=Soundbar'
    ],
    'TVs': [
      'https://placehold.co/800x600/fafafa/111?text=4K+TV',
      'https://placehold.co/800x600/fafafa/111?text=QLED+TV',
      'https://placehold.co/800x600/fafafa/111?text=Smart+TV'
    ],
    'Laptops': [
      'https://placehold.co/800x600/ffffff/111?text=Gaming+Laptop',
      'https://placehold.co/800x600/ffffff/111?text=Ultrabook',
      'https://placehold.co/800x600/ffffff/111?text=Everyday+Laptop'
    ],
    'Cameras': [
      'https://placehold.co/800x600/ffffff/111?text=DSLR+Camera',
      'https://placehold.co/800x600/ffffff/111?text=Mirrorless+Camera',
      'https://placehold.co/800x600/ffffff/111?text=Action+Camera'
    ],
    'Wearables': [
      'https://placehold.co/800x600/ffffff/111?text=Smartwatch',
      'https://placehold.co/800x600/ffffff/111?text=Fitness+Band'
    ],
    'Accessories': [
      'https://placehold.co/800x600/ffffff/111?text=Mouse',
      'https://placehold.co/800x600/ffffff/111?text=Keyboard',
      'https://placehold.co/800x600/ffffff/111?text=USB-C+Hub'
    ],
    'Appliances': [
      'https://placehold.co/800x600/ffffff/111?text=Air+Fryer',
      'https://placehold.co/800x600/ffffff/111?text=Robot+Vacuum',
      'https://placehold.co/800x600/ffffff/111?text=Mixer+Grinder'
    ],
    'Fashion': [
      'https://placehold.co/800x600/ffffff/111?text=Shoes',
      'https://placehold.co/800x600/ffffff/111?text=Tote+Bag',
      'https://placehold.co/800x600/ffffff/111?text=T-Shirts'
    ],
    'Home & Kitchen': [
      'https://placehold.co/800x600/ffffff/111?text=Dinner+Set',
      'https://placehold.co/800x600/ffffff/111?text=Bedsheet',
      'https://placehold.co/800x600/ffffff/111?text=Study+Lamp'
    ],
  };

  const getImage = (category, index) => {
    const pool = imagePool[category] || imagePool['Home & Kitchen'];
    return pool[index % pool.length];
  };

  const items = [];
  let id = 1;
  for (const cat of categories) {
    for (let i = 0; i < 6; i++) {
      const brand = cat.brands[i % cat.brands.length];
      const price = Math.floor(500 + Math.random() * 1000) * (1 + (i % 5));
      const stock = 20 + Math.floor(Math.random() * 120);
      const rating = +(3.8 + Math.random() * 1.2).toFixed(1);
      const numReviews = 20 + Math.floor(Math.random() * 230);
      const name = `${brand} ${cat.name.slice(0, cat.name.indexOf('&') > 0 ? cat.name.indexOf('&') : cat.name.length)} ${id}`.trim();
      items.push({
        name,
        description: `${brand} ${cat.name} product with quality build and great performance. Model ${id}.`,
        brand,
        category: cat.name,
        price,
        countInStock: stock,
        image: getImage(cat.name, i),
        rating,
        numReviews,
      });
      id++;
    }
  }
  return items;
}

(async () => {
  try {
    await connectDB();
    const generated = genProducts();

    // Apply curated images to base products as well for consistency
    const applyImages = (list) => list.map((p, idx) => ({
      ...p,
      image: p.image && !p.image.startsWith('http') ? p.image : (p.image || (p.category ? (function() { const pool = {
        'Mobiles': 'https://placehold.co/800x600/fff/111?text=Smartphone',
        'Audio': 'https://placehold.co/800x600/ffffff/111111?text=Headphones',
        'TVs': 'https://placehold.co/800x600/fafafa/111?text=4K+TV',
        'Laptops': 'https://placehold.co/800x600/ffffff/111?text=Laptop',
        'Cameras': 'https://placehold.co/800x600/ffffff/111?text=Camera',
        'Wearables': 'https://placehold.co/800x600/ffffff/111?text=Smartwatch',
        'Accessories': 'https://placehold.co/800x600/ffffff/111?text=Accessory',
        'Appliances': 'https://placehold.co/800x600/ffffff/111?text=Appliance',
        'Fashion': 'https://placehold.co/800x600/ffffff/111?text=Fashion',
        'Home & Kitchen': 'https://placehold.co/800x600/ffffff/111?text=Home+%26+Kitchen',
      }; return pool[p.category] || 'https://placehold.co/800x600/ffffff/111?text=Product'; })() : 'https://placehold.co/800x600/ffffff/111?text=Product'))
    }));

    const merged = applyImages([...base, ...generated]);
    await Product.deleteMany({});
    await Product.insertMany(merged);
    console.log(`Seeded ${merged.length} products (base: ${base.length}, generated: ${generated.length}).`);
    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
