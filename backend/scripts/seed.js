import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import User from '../models/User.js';
import Document from '../models/Document.js';
import Asset from '../models/Asset.js';
import Expense from '../models/Expense.js';
import Reminder from '../models/Reminder.js';
import Chat from '../models/Chat.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Look for .env in the root folder first, then backend folder, then fallback to current working directory
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });
dotenv.config({ path: path.join(__dirname, '..', '.env') });
dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/lifevault';

const createDummyUploads = () => {
  const uploadsDir = path.join(__dirname, '..', 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const dummyFiles = [
    'fridge_invoice.pdf',
    'laptop_invoice.pdf',
    'bike_insurance.pdf',
    'internet_bill.pdf',
    'phone_receipt.pdf',
  ];

  dummyFiles.forEach((file) => {
    const filePath = path.join(uploadsDir, file);
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, 'Mock document file for LifeVault Demo.', 'utf8');
      console.log(`Created dummy upload file: ${file}`);
    }
  });
};

const seed = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB successfully.');

    // 1. Create uploads folder and files
    createDummyUploads();

    // 2. Clean existing demo data
    console.log('Cleaning existing demo data...');
    const demoEmail = 'demo@lifevault.com';
    const existingUser = await User.findOne({ email: demoEmail });
    if (existingUser) {
      await Document.deleteMany({ user: existingUser._id });
      await Asset.deleteMany({ user: existingUser._id });
      await Expense.deleteMany({ user: existingUser._id });
      await Reminder.deleteMany({ user: existingUser._id });
      await Chat.deleteMany({ userId: existingUser._id });
      await User.deleteOne({ _id: existingUser._id });
      console.log('Removed existing demo user data.');
    }

    // 3. Create demo user
    console.log('Creating demo user...');
    const demoUser = await User.create({
      name: 'Subika',
      email: demoEmail,
      password: 'Demo@123', // Will be hashed by User schema pre-save hook
    });
    console.log(`Demo user created: ${demoUser.name} (${demoUser.email})`);

    const userId = demoUser._id;

    // 4. Create Documents
    console.log('Seeding Documents...');
    const today = new Date();
    const expiryInOneMonth = new Date();
    expiryInOneMonth.setMonth(today.getMonth() + 1);

    const expiryInTwoYears = new Date();
    expiryInTwoYears.setFullYear(today.getFullYear() + 2);

    const doc1 = await Document.create({
      user: userId,
      title: 'Refrigerator Invoice',
      category: 'financial',
      description: 'Purchase receipt for Samsung double-door refrigerator.',
      fileUrl: '/uploads/fridge_invoice.pdf',
      fileName: 'fridge_invoice.pdf',
      fileSize: 1024,
      mimeType: 'application/pdf',
      expiryDate: expiryInTwoYears,
      tags: ['appliance', 'invoice', 'samsung'],
      aiStatus: 'analyzed',
      aiAnalyzedAt: today,
      aiData: {
        documentType: 'invoice',
        productName: 'Double Door Refrigerator',
        brand: 'Samsung',
        model: 'RT28A3022GS',
        purchaseDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 15),
        amount: 32999,
        currency: 'INR',
        seller: 'XYZ Electronics Ltd',
        warrantyPeriodMonths: 24,
        warrantyExpiryDate: expiryInTwoYears,
        serialNumber: 'SAMSFRIDGE1029384',
        aiCategory: 'financial',
        summary: 'Purchase invoice for Samsung Refrigerator with 2-year warranty.',
      },
    });

    const doc2 = await Document.create({
      user: userId,
      title: 'Laptop Invoice',
      category: 'financial',
      description: 'Purchase receipt for Dell Inspiron 15 laptop.',
      fileUrl: '/uploads/laptop_invoice.pdf',
      fileName: 'laptop_invoice.pdf',
      fileSize: 1250,
      mimeType: 'application/pdf',
      expiryDate: new Date(today.getFullYear() + 1, today.getMonth(), today.getDate()),
      tags: ['electronics', 'invoice', 'dell'],
      aiStatus: 'analyzed',
      aiAnalyzedAt: today,
      aiData: {
        documentType: 'invoice',
        productName: 'Dell Inspiron 15 Laptop',
        brand: 'Dell',
        model: 'Inspiron 5510',
        purchaseDate: new Date(today.getFullYear(), today.getMonth() - 2, today.getDate()),
        amount: 58900,
        currency: 'INR',
        seller: 'Croma Retail',
        warrantyPeriodMonths: 12,
        warrantyExpiryDate: new Date(today.getFullYear() + 1, today.getMonth(), today.getDate()),
        serialNumber: 'DELL-CN-09283-X98',
        aiCategory: 'financial',
        summary: 'Purchase invoice for Dell Inspiron 15. Includes 1-year standard warranty.',
      },
    });

    const doc3 = await Document.create({
      user: userId,
      title: 'Bike Insurance Policy',
      category: 'insurance',
      description: 'Annual third-party and comprehensive insurance policy for Honda Shine.',
      fileUrl: '/uploads/bike_insurance.pdf',
      fileName: 'bike_insurance.pdf',
      fileSize: 2048,
      mimeType: 'application/pdf',
      expiryDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 5), // Expires in 5 days
      tags: ['vehicle', 'insurance', 'honda'],
      aiStatus: 'analyzed',
      aiAnalyzedAt: today,
      aiData: {
        documentType: 'insurance',
        productName: 'Two-Wheeler Package Policy',
        brand: 'Acko General Insurance',
        model: null,
        purchaseDate: new Date(today.getFullYear() - 1, today.getMonth(), today.getDate() + 6),
        amount: 1480,
        currency: 'INR',
        seller: 'Acko Insurance',
        warrantyPeriodMonths: null,
        warrantyExpiryDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 5),
        serialNumber: 'POL-ACKO-TWO-908123',
        aiCategory: 'insurance',
        summary: 'Annual insurance certificate for Honda Shine (MH12-AB-1234). Expires in 5 days.',
      },
    });

    const doc4 = await Document.create({
      user: userId,
      title: 'Internet Broadband Bill',
      category: 'financial',
      description: 'Monthly broadband invoice from Airtel.',
      fileUrl: '/uploads/internet_bill.pdf',
      fileName: 'internet_bill.pdf',
      fileSize: 512,
      mimeType: 'application/pdf',
      expiryDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1), // Due tomorrow
      tags: ['utilities', 'bill', 'internet'],
      aiStatus: 'analyzed',
      aiAnalyzedAt: today,
      aiData: {
        documentType: 'bill',
        productName: 'Fiber 200Mbps Plan',
        brand: 'Airtel Broadband',
        model: null,
        purchaseDate: today,
        amount: 943,
        currency: 'INR',
        seller: 'Bharti Airtel Ltd',
        warrantyPeriodMonths: null,
        warrantyExpiryDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1),
        serialNumber: 'ACCT-AIRTEL-98234-A',
        aiCategory: 'financial',
        summary: 'Monthly internet broadband bill for account 98234-A. Amount: 943 INR.',
      },
    });

    const doc5 = await Document.create({
      user: userId,
      title: 'iPhone Receipt',
      category: 'financial',
      description: 'Purchase receipt for Apple iPhone 15 Pro.',
      fileUrl: '/uploads/phone_receipt.pdf',
      fileName: 'phone_receipt.pdf',
      fileSize: 850,
      mimeType: 'application/pdf',
      expiryDate: new Date(today.getFullYear() + 1, today.getMonth() - 1, today.getDate()),
      tags: ['phone', 'invoice', 'apple'],
      aiStatus: 'analyzed',
      aiAnalyzedAt: today,
      aiData: {
        documentType: 'receipt',
        productName: 'iPhone 15 Pro (128GB)',
        brand: 'Apple',
        model: 'A3102',
        purchaseDate: new Date(today.getFullYear(), today.getMonth() - 1, today.getDate()),
        amount: 119900,
        currency: 'INR',
        seller: 'Imagine Apple Premium Reseller',
        warrantyPeriodMonths: 12,
        warrantyExpiryDate: new Date(today.getFullYear() + 1, today.getMonth() - 1, today.getDate()),
        serialNumber: 'APPLE-DX-1092834-Y',
        aiCategory: 'financial',
        summary: 'Purchase receipt for Apple iPhone 15 Pro 128GB Titanium.',
      },
    });

    console.log('Seeded 5 Documents.');

    // 5. Create Assets
    console.log('Seeding Assets...');
    await Asset.create([
      {
        user: userId,
        name: 'Samsung Refrigerator',
        category: 'appliance',
        brand: 'Samsung',
        model: 'RT28A3022GS',
        purchaseDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 15),
        purchasePrice: 32999,
        warrantyExpiry: expiryInTwoYears,
        serialNumber: 'SAMSFRIDGE1029384',
        notes: 'Kept in the kitchen. Inverter compressor has 10 years separate warranty.',
      },
      {
        user: userId,
        name: 'Dell Laptop',
        category: 'electronics',
        brand: 'Dell',
        model: 'Inspiron 5510',
        purchaseDate: new Date(today.getFullYear(), today.getMonth() - 2, today.getDate()),
        purchasePrice: 58900,
        warrantyExpiry: new Date(today.getFullYear() + 1, today.getMonth(), today.getDate()),
        serialNumber: 'DELL-CN-09283-X98',
        notes: 'Work laptop. Extended warranty purchased separately.',
      },
      {
        user: userId,
        name: 'iPhone 15 Pro',
        category: 'electronics',
        brand: 'Apple',
        model: '15 Pro (128GB)',
        purchaseDate: new Date(today.getFullYear(), today.getMonth() - 1, today.getDate()),
        purchasePrice: 119900,
        warrantyExpiry: new Date(today.getFullYear() + 1, today.getMonth() - 1, today.getDate()),
        serialNumber: 'APPLE-DX-1092834-Y',
        notes: 'Primary personal phone. Screen guard and Apple official case applied.',
      },
      {
        user: userId,
        name: 'Honda Shine Bike',
        category: 'vehicle',
        brand: 'Honda',
        model: 'Shine 125 BS6',
        purchaseDate: new Date(today.getFullYear() - 1, today.getMonth(), today.getDate() + 6),
        purchasePrice: 85000,
        warrantyExpiry: new Date(today.getFullYear() + 2, today.getMonth(), today.getDate()),
        serialNumber: 'HONDA-ENG-98234908',
        notes: 'Registration: MH12-AB-1234. Color: Matte Black.',
      },
      {
        user: userId,
        name: 'Sony Smart TV',
        category: 'electronics',
        brand: 'Sony',
        model: 'Bravia 55X74K',
        purchaseDate: new Date(today.getFullYear() - 1, today.getMonth() - 6, today.getDate()),
        purchasePrice: 62000,
        warrantyExpiry: new Date(today.getFullYear(), today.getMonth() - 6, today.getDate()), // Expired
        serialNumber: 'SONY-TV-8923048',
        notes: 'Living room wall mounted display.',
      },
    ]);
    console.log('Seeded 5 Assets.');

    // 6. Create Expenses (at least 12 realistic expenses)
    console.log('Seeding Expenses...');
    const expenseData = [
      {
        description: 'Monthly Groceries - Nature Basket',
        amount: 4250,
        category: 'Food',
        date: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 10),
        paymentMethod: 'UPI',
      },
      {
        description: 'Petrol Refill - Indian Oil',
        amount: 1200,
        category: 'Transport',
        date: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 2),
        paymentMethod: 'Card',
      },
      {
        description: 'iPhone Purchase',
        amount: 119900,
        category: 'Electronics',
        date: new Date(today.getFullYear(), today.getMonth() - 1, today.getDate()),
        paymentMethod: 'Card',
      },
      {
        description: 'Broadband Internet Bill Airtel',
        amount: 943,
        category: 'Utilities',
        date: today,
        paymentMethod: 'UPI',
      },
      {
        description: 'Acko Two-Wheeler Insurance Premium',
        amount: 1480,
        category: 'Subscription',
        date: new Date(today.getFullYear() - 1, today.getMonth(), today.getDate() + 6),
        paymentMethod: 'Net Banking',
      },
      {
        description: 'Weekly Dinner out - Barbeque Nation',
        amount: 2800,
        category: 'Food',
        date: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 4),
        paymentMethod: 'UPI',
      },
      {
        description: 'Zara Winter Clothes Shopping',
        amount: 5400,
        category: 'Shopping',
        date: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 12),
        paymentMethod: 'Card',
      },
      {
        description: 'Dentist Clean Up Clinic',
        amount: 1500,
        category: 'Healthcare',
        date: new Date(today.getFullYear(), today.getMonth() - 1, today.getDate() - 5),
        paymentMethod: 'UPI',
      },
      {
        description: 'Netflix Monthly Subscription',
        amount: 649,
        category: 'Subscription',
        date: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1),
        paymentMethod: 'Card',
      },
      {
        description: 'PVR Movie Tickets & Popcorn',
        amount: 1150,
        category: 'Entertainment',
        date: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 8),
        paymentMethod: 'UPI',
      },
      {
        description: 'Uber Office Commute rides',
        amount: 950,
        category: 'Transport',
        date: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 5),
        paymentMethod: 'UPI',
      },
      {
        description: 'Utility Electricity Bill MSEDCL',
        amount: 3100,
        category: 'Utilities',
        date: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 14),
        paymentMethod: 'Net Banking',
      },
      {
        description: 'Milk & Dairy Delivery Daily',
        amount: 1250,
        category: 'Food',
        date: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1),
        paymentMethod: 'UPI',
      },
    ];

    await Expense.create(expenseData.map((e) => ({ ...e, user: userId })));
    console.log(`Seeded ${expenseData.length} Expenses.`);

    // 7. Create Reminders
    console.log('Seeding Reminders...');
    await Reminder.create([
      {
        user: userId,
        title: 'Renew Bike Insurance',
        description: 'Current insurance certificate expires in 5 days (Policy #POL-ACKO-TWO-908123).',
        dueDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 5), // Due Soon
        priority: 'High',
        isCompleted: false,
      },
      {
        user: userId,
        title: 'Pay Airtel Broadband Internet Bill',
        description: 'Broadband bill is due tomorrow. Amount: 943 INR.',
        dueDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1), // Due Tomorrow / Urgent
        priority: 'Medium',
        isCompleted: false,
      },
      {
        user: userId,
        title: 'Honda Shine Bike 3rd Free Service',
        description: 'Take the bike to MH Honda Service Center, Pune.',
        dueDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 15), // Upcoming
        priority: 'Low',
        isCompleted: false,
      },
      {
        user: userId,
        title: 'Submit Dental Bills to Insurance',
        description: 'Upload receipt from dentist clean up.',
        dueDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 2), // Overdue
        priority: 'High',
        isCompleted: false,
      },
      {
        user: userId,
        title: 'Review Laptop Extended Warranty Options',
        description: 'Dell warranty expires next year. Check email alerts.',
        dueDate: new Date(today.getFullYear(), today.getMonth() + 1, today.getDate()), // Upcoming
        priority: 'Low',
        isCompleted: true, // Completed
      },
    ]);
    console.log('Seeded 5 Reminders.');

    console.log('Seeding completed successfully!');
  } catch (error) {
    console.error('Seeding failed with error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed.');
  }
};

seed();
