import mongoose from 'mongoose';

const giftCardSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    balance: {
      type: Number,
      required: true,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
    issuedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

giftCardSchema.methods.canUse = function canUse(amount) {
  const notExpired = !this.expiresAt || this.expiresAt > new Date();
  return this.isActive && notExpired && this.balance >= amount;
};

const GiftCard = mongoose.model('GiftCard', giftCardSchema);

export default GiftCard;
