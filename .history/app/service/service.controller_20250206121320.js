import asyncHandler from 'express-async-handler';
import { prisma } from '../prisma.js';

// @desc    Get services with pagination, sorting, and filtering
// @route   GET /api/services
// @access  Private
export const getServices = asyncHandler(async (req, res) => {
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

  const totalServices = await prisma.service.count({ where });

  const services = await prisma.service.findMany({
    where,
    skip: rangeStart,
    take: Math.min(rangeEnd - rangeStart + 1, totalServices),
    orderBy: { [sortField]: sortOrder },
    include: { center: true, Form: true },
  });

  res.set(
    'Content-Range',
    `services ${rangeStart}-${Math.min(rangeEnd, totalServices - 1)}/${totalServices}`
  );
  res.json(services);
});

// @desc    Get single service by ID
// @route   GET /api/services/:id
// @access  Private
export const getOneService = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const service = await prisma.service.findUnique({
    where: { id: parseInt(id, 10) },
    include: { center: true, form: true },
  });

  if (!service) {
    res.status(404).json({ error: 'Service not found!' });
    return;
  }

  res.json(service);
});

// @desc    Create new service
// @route   POST /api/services
// @access  Private
export const createNewService = asyncHandler(async (req, res) => {
  const { title, description, img, centerId, formId } = req.body;

  if (!title || !description) {
    res.status(400).json({ error: 'Title and description are required' });
    return;
  }

  const service = await prisma.service.create({
    data: { title, description, img, centerId, formId },
  });

  res.status(201).json(service);
});

// @desc    Update service
// @route   PUT /api/services/:id
// @access  Private
export const updateService = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title, description, img, centerId, formId } = req.body;

  try {
    const existingService = await prisma.service.findUnique({
      where: { id: parseInt(id, 10) },
    });

    if (!existingService) {
      res.status(404).json({ error: 'Service not found!' });
      return;
    }

    const updatedService = await prisma.service.update({
      where: { id: parseInt(id, 10) },
      data: {
        title: title ?? existingService.title,
        description: description ?? existingService.description,
        img: img ?? existingService.img,
        centerId: centerId ?? existingService.centerId,
        formId: formId ?? existingService.formId,
      },
    });

    res.json(updatedService);
  } catch (error) {
    console.error('Error updating service:', error);
    res.status(500).json({ error: 'Error updating service' });
  }
});

// @desc    Delete service
// @route   DELETE /api/services/:id
// @access  Private
export const deleteService = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.service.delete({
      where: { id: parseInt(id, 10) },
    });

    res.json({ message: 'Service deleted successfully!' });
  } catch (error) {
    console.error('Error deleting service:', error);
    res.status(404).json({ error: 'Service not found!' });
  }
});
