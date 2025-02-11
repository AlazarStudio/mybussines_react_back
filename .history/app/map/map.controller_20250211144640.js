import asyncHandler from 'express-async-handler';
import { prisma } from '../prisma.js';

// 📌 Получить список карт (без пагинации)
export const getMaps = asyncHandler(async (req, res) => {
  const { sort, filter } = req.query;

  const sortField = sort ? JSON.parse(sort)[0] : 'createdAt';
  const sortOrder = sort ? JSON.parse(sort)[1].toLowerCase() : 'desc';

  const filters = filter ? JSON.parse(filter) : {};

  const where = Object.keys(filters).reduce((acc, field) => {
    const value = filters[field];
    if (Array.isArray(value)) {
      acc[field] = { in: value };
    } else if (typeof value === 'string') {
      acc[field] = { contains: value, mode: 'insensitive' };
    } else {
      acc[field] = { equals: value };
    }
    return acc;
  }, {});

  const maps = await prisma.map.findMany({
    where,
    orderBy: { [sortField]: sortOrder },
  });

  res.json(maps);
});
