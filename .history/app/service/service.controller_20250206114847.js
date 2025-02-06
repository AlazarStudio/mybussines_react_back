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
    include: {
      centers: { include: { center: true } }, // ✅ Подключаем центры через M:N связь
      form: true,
    },
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
    include: {
      centers: { include: { center: true } }, // ✅ Подключаем центры через M:N связь
      form: true,
    },
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
  const { title, description, img, centerIds, formId } = req.body;

  if (!title || !description) {
    return res.status(400).json({ error: 'Title and description are required' });
  }

  try {
    console.log(`🛠 Создание сервиса с title: ${title}`);

    // ✅ Проверяем, что `centerIds` массив
    if (!Array.isArray(centerIds)) {
      console.error('❌ Ошибка: centerIds должен быть массивом, получено:', centerIds);
      return res.status(400).json({ error: 'centerIds must be an array' });
    }

    console.log(`🏢 Привязываем центры:`, centerIds);

    // ✅ Преобразование изображений
    const images = Array.isArray(img)
      ? img.map((image) =>
          typeof image === 'object' && image.rawFile?.path
            ? `/uploads/${image.rawFile.path}`
            : image
        )
      : [];

    console.log(`🖼 Обработанные изображения:`, images);

    // ✅ Создание сервиса в БД
    const service = await prisma.service.create({
      data: {
        title,
        description,
        img: images,
        centers: {
          connect: centerIds.map((id) => ({ centerId: parseInt(id, 10) })),
        },
        formId: formId ? parseInt(formId, 10) : null,
      },
      include: {
        centers: { include: { center: true } },
        form: true,
      },
    });

    console.log(`✅ Сервис создан успешно:`, service);
    res.status(201).json(service);
  } catch (error) {
    console.error(`❌ Ошибка при создании сервиса:`, error);
    res.status(500).json({ error: `Error creating service: ${error.message}` });
  }
});


// @desc    Update service
// @route   PUT /api/services/:id
// @access  Private
export const updateService = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title, description, img, centerIds, formId } = req.body;

  try {
    console.log(`🔹 Обновление сервиса ID: ${id}`);

    // Проверяем, существует ли сервис
    const existingService = await prisma.service.findUnique({
      where: { id: parseInt(id, 10) },
      include: { centers: true },
    });

    if (!existingService) {
      console.log(`❌ Сервис ID: ${id} не найден`);
      return res.status(404).json({ error: 'Service not found!' });
    }

    console.log('✅ Найден сервис:', existingService);

    // Преобразование изображений
    const images = Array.isArray(img)
      ? img.map((image) =>
          typeof image === 'object' && image.rawFile?.path
            ? `/uploads/${image.rawFile.path}`
            : image
        )
      : [];

    console.log('🖼 Обновленные изображения:', images);

    // Проверяем `centerIds`, чтобы избежать ошибок
    if (!Array.isArray(centerIds)) {
      console.error(
        '❌ Ошибка: centerIds должен быть массивом, получено:',
        centerIds
      );
      return res.status(400).json({ error: 'centerIds must be an array' });
    }

    console.log('🏢 Связываем с центрами:', centerIds);

    // Удаляем старые связи
    await prisma.serviceOnCenters.deleteMany({
      where: { serviceId: parseInt(id, 10) },
    });

    console.log('🔄 Старые связи центров удалены');

    // Обновляем сервис с новыми центрами
    const updatedService = await prisma.service.update({
      where: { id: parseInt(id, 10) },
      data: {
        title: title ?? existingService.title,
        description: description ?? existingService.description,
        img: images ?? existingService.img,
        formId: formId ?? existingService.formId,
        centers: {
          connect: centerIds.map((centerId) => ({
            centerId: parseInt(centerId, 10),
          })),
        },
      },
      include: {
        centers: { include: { center: true } },
        form: true,
      },
    });

    console.log('✅ Сервис обновлен успешно:', updatedService);
    res.json(updatedService);
  } catch (error) {
    console.error('❌ Ошибка при обновлении сервиса:', error);
    res.status(500).json({ error: 'Error updating service' });
  }
});

// @desc    Delete service
// @route   DELETE /api/services/:id
// @access  Private
export const deleteService = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.serviceOnCenters.deleteMany({
      where: { serviceId: parseInt(id, 10) }, // ✅ Удаляем связи перед удалением сервиса
    });

    await prisma.service.delete({
      where: { id: parseInt(id, 10) },
    });

    res.json({ message: 'Service deleted successfully!' });
  } catch (error) {
    console.error('Error deleting service:', error);
    res.status(404).json({ error: 'Service not found!' });
  }
});
