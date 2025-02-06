import asyncHandler from 'express-async-handler';
import { prisma } from '../prisma.js';

// 📌 Получить список сервисов с пагинацией, сортировкой и фильтрацией
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
      centers: {
        include: { center: true }, // ✅ Получаем названия центров
      },
      form: true,
    },
  });

  res.set(
    'Content-Range',
    `services ${rangeStart}-${Math.min(rangeEnd, totalServices - 1)}/${totalServices}`
  );
  res.json(services);
});

// 📌 Получить один сервис по ID
export const getOneService = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const service = await prisma.service.findUnique({
    where: { id: parseInt(id, 10) },
    include: {
      centers: {
        select: { centerId: true, center: { select: { title: true } } },
      }, // ✅ Исправлено
      form: true,
    },
  });

  if (!service) {
    return res.status(404).json({ error: 'Service not found!' });
  }

  res.json(service);
});

// 📌 Создать новый сервис
export const createNewService = asyncHandler(async (req, res) => {
  const { title, description, img, centerIds, formId } = req.body;

  if (!title || !description) {
    return res
      .status(400)
      .json({ error: 'Title and description are required' });
  }

  try {
    const images = Array.isArray(img)
      ? img
          .filter((image) => image !== null)
          .map((image) =>
            typeof image === 'object' && image.rawFile?.path
              ? `/uploads/${image.rawFile.path}`
              : image
          )
      : [];

    // ✅ Создаём сервис без связей
    const service = await prisma.service.create({
      data: {
        title,
        description,
        img: images,
        formId: formId ? parseInt(formId, 10) : null,
      },
    });

    // ✅ Добавляем связи с центрами
    await prisma.serviceOnCenters.createMany({
      data: centerIds.map((centerId) => ({
        serviceId: service.id,
        centerId: parseInt(centerId, 10),
      })),
    });

    // ✅ Получаем обновленный сервис
    const updatedService = await prisma.service.findUnique({
      where: { id: service.id },
      include: {
        centers: { include: { center: true } },
        form: true,
      },
    });

    res.status(201).json(updatedService);
  } catch (error) {
    console.error('❌ Ошибка при создании сервиса:', error);
    res.status(500).json({ error: `Error creating service: ${error.message}` });
  }
});

// 📌 Обновить сервис
export const updateService = asyncHandler(async (req, res) => {
  const { id } = req.params;
  let { title, description, img, centerIds = [], formId } = req.body; // ✅ `centerIds` по умолчанию пустой массив

  try {
    const existingService = await prisma.service.findUnique({
      where: { id: parseInt(id, 10) },
      include: { centers: true },
    });

    if (!existingService) {
      return res.status(404).json({ error: 'Service not found!' });
    }

    // ✅ Проверяем формат изображений
    if (!Array.isArray(img)) {
      img = existingService.img; // Если `img` не массив, используем старые изображения
    }

    // ✅ Обновляем сервис
    const updatedService = await prisma.service.update({
      where: { id: parseInt(id, 10) },
      data: {
        title: title ?? existingService.title,
        description: description ?? existingService.description,
        img,
        formId: formId ? parseInt(formId, 10) : existingService.formId,
      },
    });

    // ✅ Обновляем связи с центрами
    if (Array.isArray(centerIds) && centerIds.length > 0) {
      await prisma.serviceOnCenters.deleteMany({
        where: { serviceId: updatedService.id },
      });

      await prisma.serviceOnCenters.createMany({
        data: centerIds.map((centerId) => ({
          serviceId: updatedService.id,
          centerId: parseInt(centerId, 10),
        })),
      });
    }

    // ✅ Получаем обновленный сервис
    const finalService = await prisma.service.findUnique({
      where: { id: updatedService.id },
      include: {
        centers: { include: { center: true } },
        form: true,
      },
    });

    res.json(finalService);
  } catch (error) {
    console.error('❌ Ошибка при обновлении сервиса:', error);
    res
      .status(500)
      .json({ error: 'Error updating service', details: error.message });
  }
});

// 📌 Удалить сервис
export const deleteService = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    // ✅ Удаляем связи перед удалением сервиса
    await prisma.serviceOnCenters.deleteMany({
      where: { serviceId: parseInt(id, 10) },
    });

    await prisma.service.delete({ where: { id: parseInt(id, 10) } });

    res.json({ message: 'Service deleted successfully!' });
  } catch (error) {
    console.error('❌ Ошибка при удалении сервиса:', error);
    res.status(404).json({ error: 'Service not found!' });
  }
});
