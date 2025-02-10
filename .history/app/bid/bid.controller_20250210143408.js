import asyncHandler from "express-async-handler";
import { prisma } from "../prisma.js";

// @desc    Получить все заявки
// @route   GET /api/bids
// @access  Private
export const getBids = asyncHandler(async (req, res) => {
  try {
    const bids = await prisma.bid.findMany({
      orderBy: { createdAt: "desc" }, // Сортировка по дате создания
    });
    res.json(bids);
  } catch (error) {
    console.error("Ошибка при получении заявок:", error);
    res.status(500).json({ error: "Ошибка получения заявок" });
  }
});

// @desc    Получить одну заявку по ID
// @route   GET /api/bids/:id
// @access  Private
export const getBidById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    const bid = await prisma.bid.findUnique({
      where: { id: parseInt(id, 10) },
    });

    if (!bid) {
      return res.status(404).json({ error: "Заявка не найдена" });
    }

    res.json(bid);
  } catch (error) {
    console.error("Ошибка при получении заявки:", error);
    res.status(500).json({ error: "Ошибка получения заявки" });
  }
});

// @desc    Создать новую заявку
// @route   POST /api/bids
// @access  Public
export const createBid = asyncHandler(async (req, res) => {
  const { name, phone, email, form, inn, comment } = req.body;

  if (!name || !phone || !email || !form || !inn) {
    return res.status(400).json({ error: "Заполните все обязательные поля" });
  }

  try {
    const bid = await prisma.bid.create({
      data: { name, phone, email, form, inn, comment },
    });

    res.status(201).json(bid);
  } catch (error) {
    console.error("Ошибка при создании заявки:", error);
    res.status(500).json({ error: "Ошибка создания заявки" });
  }
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
      return res.status(404).json({ error: "Заявка не найдена" });
    }

    const updatedBid = await prisma.bid.update({
      where: { id: parseInt(id, 10) },
      data: { name, phone, email, form, inn, comment },
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
    const existingBid = await prisma.bid.findUnique({
      where: { id: parseInt(id, 10) },
    });

    if (!existingBid) {
      return res.status(404).json({ error: "Заявка не найдена" });
    }

    await prisma.bid.delete({
      where: { id: parseInt(id, 10) },
    });

    res.json({ message: "Заявка удалена" });
  } catch (error) {
    console.error("Ошибка при удалении заявки:", error);
    res.status(500).json({ error: "Ошибка удаления заявки" });
  }
});
