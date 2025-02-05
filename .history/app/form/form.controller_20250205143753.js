import asyncHandler from 'express-async-handler';
import { prisma } from '../prisma.js';

// @desc    Get forms with pagination, sorting, and filtering
// @route   GET /api/forms
// @access  Private
export const getForms = asyncHandler(async (req, res) => {
  const { range, sort, filter } = req.query;

  const rangeStart = range ? JSON.parse(range)[0] : 0;
  const rangeEnd = range ? JSON.parse(range)[1] : rangeStart + 10; // Безопасное ограничение

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

  const totalForms = await prisma.form.count({ where });

  const forms = await prisma.form.findMany({
    where,
    skip: rangeStart,
    take: Math.min(rangeEnd - rangeStart + 1, totalForms), // Безопасное ограничение
    orderBy: { [sortField]: sortOrder },
    include: { services: true }, // Загрузка связанных услуг
  });

  res.set(
    'Content-Range',
    `forms ${rangeStart}-${Math.min(rangeEnd, totalForms - 1)}/${totalForms}`
  );
  res.json(forms);
});

// @desc    Get single form by ID
// @route   GET /api/forms/:id
// @access  Private
export const getOneForm = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const form = await prisma.form.findUnique({
    where: { id: parseInt(id, 10) },
    include: { services: true }, // Если нужно загрузить связанные услуги
  });

  if (!form) {
    res.status(404).json({ error: 'Form not found!' });
    return;
  }

  res.json(form);
});

// @desc    Create new form
// @route   POST /api/forms
// @access  Private
export const createNewForm = asyncHandler(async (req, res) => {
  const { title, services } = req.body;

  if (!title) {
    res.status(400).json({ error: 'Title is required' });
    return;
  }

  const form = await prisma.form.create({
    data: {
      title,
      services: services
        ? { connect: services.map((serviceId) => ({ id: serviceId })) }
        : undefined,
    },
  });

  res.status(201).json(form);
});

// @desc    Update form
// @route   PUT /api/forms/:id
// @access  Private
export const updateForm = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title, services } = req.body;

  try {
    const existingForm = await prisma.form.findUnique({
      where: { id: parseInt(id, 10) },
    });

    if (!existingForm) {
      res.status(404).json({ error: 'Form not found!' });
      return;
    }

    const updatedForm = await prisma.form.update({
      where: { id: parseInt(id, 10) },
      data: {
        title: title ?? existingForm.title,
        services: services
          ? {
              set: [], // Удаляем старые связи
              connect: services.map((serviceId) => ({ id: serviceId })),
            }
          : undefined,
      },
    });

    res.json(updatedForm);
  } catch (error) {
    console.error('Error updating form:', error);
    res.status(500).json({ error: 'Error updating form' });
  }
});

// @desc    Delete form
// @route   DELETE /api/forms/:id
// @access  Private
export const deleteForm = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.form.delete({
      where: { id: parseInt(id, 10) },
    });

    res.json({ message: 'Form deleted successfully!' });
  } catch (error) {
    console.error('Error deleting form:', error);
    res.status(404).json({ error: 'Form not found!' });
  }
});
