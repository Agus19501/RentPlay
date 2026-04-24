const mongoose = require('mongoose');

const rentalSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    game: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120
    },
    price: {
      type: String,
      required: true,
      trim: true,
      maxlength: 40
    },
    payment: {
      type: String,
      required: true,
      enum: ['PayPal', 'Tarjeta de Crédito', 'ApplePay']
    },
    durationDays: {
      type: Number,
      required: true,
      min: 1,
      max: 60,
      default: 6
    },
    startsAt: {
      type: Date,
      required: true,
      default: Date.now
    },
    endsAt: {
      type: Date,
      required: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Rental', rentalSchema);
