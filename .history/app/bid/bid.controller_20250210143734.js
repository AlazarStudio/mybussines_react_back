import asyncHandler from "express-async-handler";
import { prisma } from "../prisma.js";

// @desc    Получить список заявок с пагинацией, сортировкой и фильтрацией
// @route   GET /api/bids
// @access  Private
export const getBids = asyncHandler(async (req, res) => {
  const { range, sort, filter } = req.query;

  const rangeStart = range ? JSON.parse(range)[0] : 0;
  const rangeEnd = range ? JSON.parse(range)[1] : rangeStart + 10;

  const sortField = sort ? JSON.parse(sort)[0] : "createdAt";
  const sortOrder = sort ? JSON.parse(sort)[1].toLowerCase() : "desc";

  const filters = filter ? JSON.parse(filter) : {};

  const where = Object.keys(filters).reduce((acc, field) => {
    const value = filters[field];
    if (Array.isArray(value)) {
      acc[field] = { in: value };
    } else if (typeof value === "string") {
      acc[field] = { contains: value, mode: "insensitive" };
    } else {
      acc[field] = { equals: value };
    }
    return acc;
  }, {});

  const totalBids = await prisma.bid.count({ where });

  const bids = await prisma.bid.findMany({
    where,
    skip: rangeStart,
    take: Math.min(rangeEnd - rangeStart + 1, totalBids),
    orderBy: { [sortField]: sortOrder },
  });

  res.set(
    "Content-Range",
    `bids ${rangeStart}-${Math.min(rangeEnd, totalBids - 1)}/${totalBids}`
  );
  res.json(bids);
});

// @desc    Получить одну заявку по ID
// @route   GET /api/bids/:id
// @access  Private
export const getBidById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const bid = await prisma.bid.findUnique({
    where: { id: parseInt(id, 10) },
  });

  if (!bid) {
    res.status(404).json({ error: "Заявка не найдена!" });
    return;
  }

  res.json(bid);
});

// @desc    Создать новую заявку
// @route   POST /api/bids
// @access  Private
export const createBid = asyncHandler(async (req, res) => {
  const { name, phone, email, form, inn, comment } = req.body;

  if (!name || !phone || !email || !form || !inn) {
    res.status(400).json({ error: "Все поля (кроме комментария) обязательны" });
    return;
  }

  const bid = await prisma.bid.create({
    data: { name, phone, email, form, inn, comment },
  });

  res.status(201).json(bid);
});

// @desc    Обновить заявку
// @route   PUT /api/bids/:id
// @access  Private
export const updateBid = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, phone, email, form, inn, comment } = req.body;

  try {
    const existingBid = await prisma.bid.findUnique({
      where: { id: parseInt(id, 10) },
    });

    if (!existingBid) {
      res.status(404).json({ error: "Заявка не найдена!" });
      return;
    }

    const updatedBid = await prisma.bid.update({
      where: { id: parseInt(id, 10) },
      data: {
        name: name ?? existingBid.name,
        phone: phone ?? existingBid.phone,
        email: email ?? existingBid.email,
        form: form ?? existingBid.form,
        inn: inn ?? existingBid.inn,
        comment: comment ?? existingBid.comment,
      },
    });

    res.json(updatedBid);
  } catch (error) {
    console.error("Ошибка при обновлении заявки:", error);
    res.status(500).json({ error: "Ошибка обновления заявки" });
  }
});

// @desc    Удалить заявку
// @route   DELETE /api/bids/:id
// @access  Private
export const deleteBid = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    await prisma.bid.delete({
      where: { id: parseInt(id, 10) },
    });

    res.json({ message: "Заявка успешно удалена!" });
  } catch (error) {
    console.error("Ошибка при удалении заявки:", error);
    res.status(404).json({ error: "Заявка не найдена!" });
  }
});
