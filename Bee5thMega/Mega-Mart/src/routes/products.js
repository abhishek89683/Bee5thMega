const express = require('express');
const { body, validationResult } = require('express-validator');
const Product = require('../models/Product');
const { protect, admin } = require('../middleware/auth');

const router = express.Router();

// GET /api/products?keyword=&category=&page=&limit=
router.get('/', async (req, res) => {
  const { keyword = '', category = '', page = 1, limit = 12, sort = 'newest' } = req.query;
  const q = {
    ...(keyword ? { name: { $regex: keyword, $options: 'i' } } : {}),
    ...(category ? { category } : {}),
  };
  const skip = (Number(page) - 1) * Number(limit);

  const sortMap = {
    newest: { createdAt: -1 },
    price_asc: { price: 1 },
    price_desc: { price: -1 },
    rating_desc: { rating: -1 },
  };
  const sortSpec = sortMap[sort] || sortMap.newest;

  const [items, total] = await Promise.all([
    Product.find(q).skip(skip).limit(Number(limit)).sort(sortSpec),
    Product.countDocuments(q),
  ]);
  res.json({ items, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
});

// GET /api/products/categories - distinct categories list for filters
router.get('/categories/list', async (_req, res) => {
  const categories = await Product.distinct('category');
  res.json(categories.sort());
});

// GET /api/products/:id
router.get('/:id', async (req, res) => {
  const p = await Product.findById(req.params.id);
  if (!p) return res.status(404).json({ message: 'Product not found' });
  res.json(p);
});

// POST /api/products (admin)
router.post(
  '/',
  protect,
  admin,
  [body('name').notEmpty(), body('price').isNumeric(), body('description').notEmpty()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const product = await Product.create(req.body);
    res.status(201).json(product);
  }
);

// PUT /api/products/:id (admin)
router.put('/:id', protect, admin, async (req, res) => {
  const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!product) return res.status(404).json({ message: 'Product not found' });
  res.json(product);
});

// DELETE /api/products/:id (admin)
router.delete('/:id', protect, admin, async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) return res.status(404).json({ message: 'Product not found' });
  res.json({ message: 'Product removed' });
});

module.exports = router;
