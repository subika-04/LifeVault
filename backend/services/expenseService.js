import Expense from '../models/Expense.js';

export const getExpenses = async (userId, { category, search, startDate, endDate } = {}) => {
  const query = { user: userId };

  if (category && category !== 'all') {
    query.category = category;
  }

  if (search) {
    const regex = new RegExp(search, 'i');
    query.description = regex;
  }

  if (startDate || endDate) {
    query.date = {};
    if (startDate) {
      query.date.$gte = new Date(startDate);
    }
    if (endDate) {
      query.date.$lte = new Date(endDate);
    }
  }

  return await Expense.find(query).sort({ date: -1 });
};

export const getExpenseById = async (userId, expenseId) => {
  const expense = await Expense.findOne({ _id: expenseId, user: userId });
  if (!expense) {
    const error = new Error('Expense not found');
    error.statusCode = 404;
    throw error;
  }
  return expense;
};

export const createExpense = async (userId, expenseData) => {
  const expense = await Expense.create({
    user: userId,
    amount: expenseData.amount,
    category: expenseData.category,
    description: expenseData.description,
    date: expenseData.date || new Date(),
    paymentMethod: expenseData.paymentMethod || 'Card',
  });
  return expense;
};

export const updateExpense = async (userId, expenseId, expenseData) => {
  const expense = await getExpenseById(userId, expenseId);

  if (expenseData.amount !== undefined) expense.amount = expenseData.amount;
  if (expenseData.category !== undefined) expense.category = expenseData.category;
  if (expenseData.description !== undefined) expense.description = expenseData.description;
  if (expenseData.date !== undefined) expense.date = expenseData.date || new Date();
  if (expenseData.paymentMethod !== undefined) expense.paymentMethod = expenseData.paymentMethod;

  await expense.save();
  return expense;
};

export const deleteExpense = async (userId, expenseId) => {
  const expense = await getExpenseById(userId, expenseId);
  await expense.deleteOne();
  return expense;
};
