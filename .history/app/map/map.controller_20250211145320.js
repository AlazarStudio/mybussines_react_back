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


// 📌 Получить одну карту по ID
export const getOneMap = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const map = await prisma.map.findUnique({
    where: { id: parseInt(id, 10) },
  });

  if (!map) {
    return res.status(404).json({ error: 'Map not found!' });
  }

  res.json(map);
});

// 📌 Создать новую карту
export const createMap = asyncHandler(async (req, res) => {
  const { title, ip, ul, smsp } = req.body;

  if (!title || !ip || !ul || !smsp) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    const map = await prisma.map.create({
      data: { title, ip, ul, smsp },
    });

    res.status(201).json(map);
  } catch (error) {
    console.error('❌ Ошибка при создании карты:', error);
    res.status(500).json({ error: 'Error creating map' });
  }
});

// 📌 Обновить карту
export const updateMap = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title, ip, ul, smsp } = req.body;

  try {
    const existingMap = await prisma.map.findUnique({
      where: { id: parseInt(id, 10) },
    });

    if (!existingMap) {
      return res.status(404).json({ error: 'Map not found!' });
    }

    const updatedMap = await prisma.map.update({
      where: { id: parseInt(id, 10) },
      data: {
        title: title ?? existingMap.title,
        ip: ip ?? existingMap.ip,
        ul: ul ?? existingMap.ul,
        smsp: smsp ?? existingMap.smsp,
      },
    });

    res.json(updatedMap);
  } catch (error) {
    console.error('❌ Ошибка при обновлении карты:', error);
    res.status(500).json({ error: 'Error updating map' });
  }
});

// 📌 Удалить карту
export const deleteMap = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.map.delete({ where: { id: parseInt(id, 10) } });

    res.json({ message: 'Map deleted successfully!' });
  } catch (error) {
    console.error('❌ Ошибка при удалении карты:', error);
    res.status(404).json({ error: 'Map not found!' });
  }
});
