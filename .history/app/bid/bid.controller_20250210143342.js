import asyncHandler from 'express-async-handler';
import { prisma } from '../prisma.js';

// @desc    Получить список Support с фильтрацией, сортировкой и пагинацией
// @route   GET /api/support
// @access  Private
export const getSupports = asyncHandler(async (req, res) => {
  const { range, sort, filter } = req.query;

  const rangeStart = range ? JSON.parse(range)[0] : 0;
  const rangeEnd = range ? JSON.parse(range)[1] : rangeStart + 10;

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

  const totalSupports = await prisma.support.count({ where });

  const supports = await prisma.support.findMany({
    where,
    skip: rangeStart,
    take: Math.min(rangeEnd - rangeStart + 1, totalSupports),
    orderBy: { [sortField]: sortOrder },
    include: {
      typeSupport: true,
      tags: true,
    },
  });

  res.set(
    'Content-Range',
    `supports ${rangeStart}-${Math.min(rangeEnd, totalSupports - 1)}/${totalSupports}`
  );
  res.json(supports);
});

// @desc    Получить один Support по ID
// @route   GET /api/support/:id
// @access  Private
export const getOneSupport = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const support = await prisma.support.findUnique({
    where: { id: parseInt(id, 10) },
    include: {
      typeSupport: true,
      tags: true,
    },
  });

  if (!support) {
    res.status(404).json({ error: 'Support not found!' });
    return;
  }

  res.json(support);
});

// @desc    Создать новый Support
// @route   POST /api/support
// @access  Private
export const createSupport = asyncHandler(async (req, res) => {
  const { title, description, popular, img, typeSupportId, tagIds } = req.body;

  if (!title || !description || !typeSupportId) {
    return res.status(400).json({ error: 'Title, description, and typeSupportId are required' });
  }

  try {
    const images = img?.map((image) =>
      typeof image === 'object' && image.rawFile?.path
        ? `/uploads/${image.rawFile.path}`
        : image
    ) || [];

    const support = await prisma.support.create({
      data: {
        title,
        description,
        popular: popular || false,
        img: images,
        typeSupportId: parseInt(typeSupportId, 10),
        tags: {
          connect: tagIds?.map((tagId) => ({ id: parseInt(tagId, 10) })) || [],
        },
      },
      include: {
        typeSupport: true,
        tags: true,
      },
    });

    res.status(201).json(support);
  } catch (error) {
    console.error('Error creating support:', error);
    res.status(500).json({ error: 'Error creating support' });
  }
});

// @desc    Обновить Support
// @route   PUT /api/support/:id
// @access  Private
export const updateSupport = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title, description, popular, img, typeSupportId, tagIds } = req.body;

  try {
    const existingSupport = await prisma.support.findUnique({
      where: { id: parseInt(id, 10) },
      include: { tags: true },
    });

    if (!existingSupport) {
      return res.status(404).json({ error: 'Support not found!' });
    }

    const images = img?.map((image) =>
      typeof image === 'object' && image.rawFile?.path
        ? `/uploads/${image.rawFile.path}`
        : image
    ) || existingSupport.img;

    // Удаляем старые теги перед добавлением новых
    await prisma.support.update({
      where: { id: parseInt(id, 10) },
      data: { tags: { set: [] } },
    });

    const updatedSupport = await prisma.support.update({
      where: { id: parseInt(id, 10) },
      data: {
        title: title ?? existingSupport.title,
        description: description ?? existingSupport.description,
        popular: popular ?? existingSupport.popular,
        img: images,
        typeSupportId: typeSupportId ? parseInt(typeSupportId, 10) : existingSupport.typeSupportId,
        tags: {
          connect: tagIds?.map((tagId) => ({ id: parseInt(tagId, 10) })) || [],
        },
      },
      include: {
        typeSupport: true,
        tags: true,
      },
    });

    res.json(updatedSupport);
  } catch (error) {
    console.error('Error updating support:', error);
    res.status(500).json({ error: 'Error updating support' });
  }
});

// @desc    Удалить Support
// @route   DELETE /api/support/:id
// @access  Private
export const deleteSupport = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.support.update({
      where: { id: parseInt(id, 10) },
      data: { tags: { set: [] } },
    });

    await prisma.support.delete({
      where: { id: parseInt(id, 10) },
    });

    res.json({ message: 'Support deleted successfully!' });
  } catch (error) {
    console.error('Error deleting support:', error);
    res.status(404).json({ error: 'Support not found!' });
  }
});
