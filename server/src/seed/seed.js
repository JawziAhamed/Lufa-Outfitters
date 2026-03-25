import dotenv from 'dotenv';

import { connectDB } from '../config/db.js';
import Category from '../models/Category.js';
import GiftCard from '../models/GiftCard.js';
import Inventory from '../models/Inventory.js';
import Product from '../models/Product.js';
import PromoCode from '../models/PromoCode.js';
import User from '../models/User.js';

dotenv.config();

const seed = async () => {
  await connectDB();

  await Promise.all([
    User.deleteMany({}),
    Category.deleteMany({}),
    Product.deleteMany({}),
    Inventory.deleteMany({}),
    PromoCode.deleteMany({}),
    GiftCard.deleteMany({}),
  ]);

  const users = await Promise.all([
    User.create({
      name: 'System Admin',
      email: 'admin@example.com',
      password: process.env.SEED_ADMIN_PASSWORD || 'Admin@12345',
      role: 'admin',
      phone: '+1-555-1000',
      address: '1 Admin Plaza, NY',
    }),
    User.create({
      name: 'Operations Staff',
      email: 'staff@example.com',
      password: process.env.SEED_STAFF_PASSWORD || 'Staff@12345',
      role: 'staff',
      phone: '+1-555-2000',
      address: '200 Warehouse Ave, CA',
    }),
    User.create({
      name: 'Demo Customer',
      email: 'customer@example.com',
      password: process.env.SEED_CUSTOMER_PASSWORD || 'Customer@12345',
      role: 'customer',
      phone: '+1-555-3000',
      address: '45 Customer Street, TX',
      walletBalance: 25,
    }),
  ]);

  const categorySeeds = [
    {
      name: 'New Arrivals',
      slug: 'new-arrivals',
      description: 'Recently released t-shirt collections',
      sortOrder: 10,
    },
    {
      name: 'Giveaways',
      slug: 'giveaways',
      description: 'T-shirts suitable for gifting and campaigns',
      sortOrder: 20,
    },
    {
      name: 'Promotional Offers',
      slug: 'promotional-offers',
      description: 'Discounted and promotional t-shirt products',
      sortOrder: 30,
    },
    {
      name: 'Regular Products',
      slug: 'regular-products',
      description: 'Everyday catalog products',
      sortOrder: 40,
    },
    {
      name: 'Best Sellers',
      slug: 'best-sellers',
      description: 'Most popular customer picks',
      sortOrder: 50,
    },
  ];

  const createdCategories = await Category.insertMany(categorySeeds);
  const categoriesBySlug = new Map(createdCategories.map((category) => [category.slug, category]));

  const productSeeds = [
    {
      name: 'Classic Cotton Tee',
      description: 'Premium 180 GSM cotton t-shirt suitable for everyday wear.',
      categorySlugs: ['regular-products', 'best-sellers'],
      basePrice: 19.99,
      sizes: [
        { size: 'S', priceModifier: 0 },
        { size: 'M', priceModifier: 0 },
        { size: 'L', priceModifier: 2 },
        { size: 'XL', priceModifier: 3 },
      ],
      colors: ['#000000', '#FFFFFF', '#EF4444', '#3B82F6'],
      customArtworkAllowed: true,
      defaultTemplates: ['/uploads/template-1.png', '/uploads/template-2.png'],
      imageUrl: '/uploads/sample-tee-1.png',
      tags: ['cotton', 'classic'],
      stock: 120,
      lowStockThreshold: 20,
    },
    {
      name: 'Urban Streetwear Tee',
      description: 'Oversized fit with high quality cotton blend.',
      categorySlugs: ['new-arrivals', 'best-sellers'],
      basePrice: 24.5,
      sizes: [
        { size: 'M', priceModifier: 0 },
        { size: 'L', priceModifier: 1.5 },
        { size: 'XL', priceModifier: 2.5 },
      ],
      colors: ['#111827', '#1F2937', '#F59E0B'],
      customArtworkAllowed: true,
      defaultTemplates: ['/uploads/template-3.png'],
      imageUrl: '/uploads/sample-tee-2.png',
      tags: ['street', 'oversized'],
      stock: 80,
      lowStockThreshold: 15,
    },
    {
      name: 'Sports Performance Tee',
      description: 'Breathable and lightweight performance t-shirt.',
      categorySlugs: ['promotional-offers', 'regular-products'],
      basePrice: 29.99,
      sizes: [
        { size: 'S', priceModifier: 0 },
        { size: 'M', priceModifier: 0 },
        { size: 'L', priceModifier: 1 },
      ],
      colors: ['#0EA5E9', '#22C55E', '#F97316'],
      customArtworkAllowed: true,
      defaultTemplates: ['/uploads/template-4.png'],
      imageUrl: '/uploads/sample-tee-3.png',
      tags: ['sports', 'performance'],
      stock: 60,
      lowStockThreshold: 12,
    },
    {
      name: 'Eco Recycled Tee',
      description: 'Eco-friendly recycled fabric with soft finish.',
      categorySlugs: ['giveaways', 'regular-products'],
      basePrice: 27.0,
      sizes: [
        { size: 'S', priceModifier: 0 },
        { size: 'M', priceModifier: 0 },
        { size: 'L', priceModifier: 1 },
        { size: 'XL', priceModifier: 2 },
      ],
      colors: ['#14532D', '#4D7C0F', '#F3F4F6'],
      customArtworkAllowed: true,
      defaultTemplates: ['/uploads/template-5.png'],
      imageUrl: '/uploads/sample-tee-4.png',
      tags: ['eco', 'recycled'],
      stock: 90,
      lowStockThreshold: 18,
    },
    {
      name: 'Premium Polo Tee',
      description: 'Semi-formal polo tee for business casual needs.',
      categorySlugs: ['regular-products'],
      basePrice: 34.99,
      sizes: [
        { size: 'M', priceModifier: 0 },
        { size: 'L', priceModifier: 1.5 },
        { size: 'XL', priceModifier: 2.5 },
      ],
      colors: ['#1E3A8A', '#374151', '#991B1B'],
      customArtworkAllowed: true,
      defaultTemplates: ['/uploads/template-6.png'],
      imageUrl: '/uploads/sample-tee-5.png',
      tags: ['polo', 'premium'],
      stock: 70,
      lowStockThreshold: 14,
    },
  ];

  for (const seedProduct of productSeeds) {
    const { stock, lowStockThreshold, categorySlugs = [], ...productData } = seedProduct;
    const matchedCategoryIds = categorySlugs
      .map((slug) => categoriesBySlug.get(slug)?._id)
      .filter(Boolean);

    const defaultCategory = categoriesBySlug.get('regular-products');
    const productCategoryIds = matchedCategoryIds.length
      ? matchedCategoryIds
      : defaultCategory
        ? [defaultCategory._id]
        : [];

    const primaryCategory = matchedCategoryIds.length
      ? categoriesBySlug.get(categorySlugs[0])
      : defaultCategory;

    const product = await Product.create({
      ...productData,
      categories: productCategoryIds,
      category: primaryCategory?.slug || 'custom-tshirt',
    });

    await Inventory.create({
      product: product._id,
      stock,
      lowStockThreshold,
    });
  }

  await PromoCode.insertMany([
    {
      code: 'WELCOME10',
      description: '10% off for new customers',
      discountType: 'percent',
      discountValue: 10,
      minOrderValue: 30,
      maxDiscount: 20,
      usageLimit: 500,
      isActive: true,
      newCustomersOnly: true,
      promotionalAlert: 'Welcome offer: Save 10% using WELCOME10',
    },
    {
      code: 'SAVE15',
      description: 'Flat 15 off orders over 100',
      discountType: 'fixed',
      discountValue: 15,
      minOrderValue: 100,
      usageLimit: 300,
      isActive: true,
      promotionalAlert: 'Limited-time deal: SAVE15 for flat discount',
    },
  ]);

  await GiftCard.create({
    code: 'GIFT100',
    balance: 100,
    issuedTo: users[2]._id,
    isActive: true,
  });

  console.log('Seed completed successfully');
  console.log('Admin: admin@example.com / Admin@12345');
  console.log('Staff: staff@example.com / Staff@12345');
  console.log('Customer: customer@example.com / Customer@12345');

  process.exit(0);
};

seed().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
