import mongoose from 'mongoose';

const embeddedServiceSchema = new mongoose.Schema(
  {
    serviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service',
      required: true,
    },
    nameEn: {
      type: String,
      required: true,
    },
    nameGu: {
      type: String,
      required: true,
    },
    durationMin: {
      type: Number,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
  },
  { _id: false }
);

const queueTicketSchema = new mongoose.Schema(
  {
    dateKey: {
      type: String,
      required: [true, 'Date key in YYYY-MM-DD format is required'],
      index: true,
    },
    sequence: {
      type: Number,
      required: [true, 'Sequence number is required'],
    },
    token: {
      type: String,
      required: [true, 'Token identifier (e.g. S-1) is required'],
    },
    customerName: {
      type: String,
      required: [true, 'Customer name is required'],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      validate: {
        validator: function (v) {
          return /^\d{10}$/.test(v);
        },
        message: (props) => `${props.value} is not a valid 10-digit phone number`,
      },
    },
    services: {
      type: [embeddedServiceSchema],
      validate: {
        validator: function (v) {
          return Array.isArray(v) && v.length >= 1 && v.length <= 3;
        },
        message: 'A ticket must have between 1 and 3 selected services',
      },
    },
    totalDurationMin: {
      type: Number,
      required: true,
    },
    totalPrice: {
      type: Number,
      required: true,
    },
    preferredBarber: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    assignedBarber: {
      type: String,
      lowercase: true,
      trim: true,
      default: null,
    },
    source: {
      type: String,
      enum: ['online', 'walkin'],
      default: 'online',
    },
    status: {
      type: String,
      enum: ['waiting', 'called', 'in_chair', 'done', 'cancelled', 'no_show'],
      default: 'waiting',
      index: true,
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
    calledAt: {
      type: Date,
      default: null,
    },
    startedAt: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    cancelledAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes as specified
queueTicketSchema.index({ dateKey: 1, status: 1, joinedAt: 1 });
queueTicketSchema.index({ dateKey: 1, phone: 1, status: 1 });

export const QueueTicket = mongoose.model('QueueTicket', queueTicketSchema);
export default QueueTicket;
