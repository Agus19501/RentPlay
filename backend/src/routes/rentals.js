const express = require('express');
const Rental = require('../models/Rental');
const requireAuth = require('../middleware/auth');

const router = express.Router();

function normalizePaymentMethod(payment) {
  const value = String(payment || '').trim().toLowerCase();

  if (value === 'paypal') {
    return 'PayPal';
  }

  if (value === 'credit-card' || value === 'tarjeta de crédito' || value === 'tarjeta de credito') {
    return 'Tarjeta de Crédito';
  }

  if (value === 'applepay' || value === 'apple pay') {
    return 'ApplePay';
  }

  return null;
}

router.get('/mine', requireAuth, async (req, res) => {
  const rentals = await Rental.find({ userId: req.user.id }).sort({ createdAt: -1 }).limit(20);
  return res.json({ rentals });
});

router.post('/', requireAuth, async (req, res) => {
  const { game, price, payment, durationDays } = req.body;
  const normalizedPayment = normalizePaymentMethod(payment);

  if (!game || !price || !normalizedPayment) {
    return res.status(400).json({ message: 'game, price y payment son obligatorios' });
  }

  const rentalDuration = Number.isFinite(Number(durationDays)) ? Number(durationDays) : 6;
  const startsAt = new Date();
  const endsAt = new Date(startsAt.getTime() + rentalDuration * 24 * 60 * 60 * 1000);

  const rental = await Rental.create({
    userId: req.user.id,
    game: String(game).trim(),
    price: String(price).trim(),
    payment: normalizedPayment,
    durationDays: rentalDuration,
    startsAt,
    endsAt
  });

  return res.status(201).json({ rental });
});

module.exports = router;
