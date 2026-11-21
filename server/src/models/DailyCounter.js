import mongoose from 'mongoose';

const dailyCounterSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      required: true,
    },
    seq: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Static atomic token generator for daily ticket sequence
 * @param {string} dateKey - Format 'YYYY-MM-DD'
 * @returns {Promise<{ sequence: number, token: string }>}
 */
dailyCounterSchema.statics.getNextToken = async function (dateKey) {
  const counterId = `ticket_${dateKey}`;
  const doc = await this.findOneAndUpdate(
    { _id: counterId },
    { $inc: { seq: 1 } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  return {
    sequence: doc.seq,
    token: `S-${doc.seq}`,
  };
};

export const DailyCounter = mongoose.model('DailyCounter', dailyCounterSchema);
export default DailyCounter;
