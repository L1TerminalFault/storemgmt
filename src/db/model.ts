import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI || "";

let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

export async function dbConnect() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }
  return cached.conn;
}

// INFO: Schemas
const supplierSchema = new mongoose.Schema({
	clerkId: String,
	name: String,
	__more: String,
});

// const notificationSchema = new mongoose.Schema({
// 	clerkId: String,
// 	content: String,
// 	__more: String,
// }, { timestamps: true });

// 1. PRODUCTS (The master catalog definition of what exists)
// INFO: Admin use only when purchasing
const productSchema = new mongoose.Schema({
    clerkId: String,
    type: { type: String, required: true },
    name: { type: String, required: true },
    // INFO: Admin use only
    unitBuyingPrice: { type: Number, required: true, min: 0 },
    __more: String,
});

const storeSchema = new mongoose.Schema({
    clerkId: String,
    title: { type: String, required: true },
    inventory: [
        {
            _id: false, // Prevents Mongoose from auto-generating sub-IDs for every single stock row
            productId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Product',
                required: true
            },
            amount: {
                type: Number,
                required: true,
                default: 0,
                min: 0 // Prevents accidental negative stock entries
            },
	    approved: Boolean,
        },
    ],
    __more: String,
});

// INFO: Selling to customers
const transactionSchema = new mongoose.Schema({
    clerkId: String,
    storeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Store',
        required: true
    },
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer',
        required: true
    },
    products: [
        {
            _id: false,
	    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
	    amount: Number,
            // CRITICAL: Captures the exact retail price typed by the user during checkout
	    unitPrice: Number,
	    unitBuyingPrice: Number  // What it cost the admin to buy it (stamped at checkout)
        },
    ],
    totalPrice: { type: Number, required: true, min: 0 },
    paidPrice: { type: Number, required: true, default: 0, min: 0 },
    paymentStatus: { 
        type: String, 
        enum: ['Paid', 'Partial', 'Unpaid'], 
        required: true 
    },
    shouldBePaidBeforeDate: { type: String },
    isOutOfStore: { type: Boolean  },
    comment: String,
    __more: String,
}, { timestamps: true });

// INFO: when admin purchases products from suppliers
const purchaseSchema = new mongoose.Schema({
    clerkId: String,
    storeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Store',
        required: true
    },
    supplierId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Supplier',
        required: true
    },
    products: [
        {
            _id: false,
            productId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Product',
                required: true
            },
            amount: { type: Number, required: true, min: 1 },
            // CRITICAL: Captures the exact acquisition cost typed by the admin during restocking
            unitBuyingPrice: { type: Number, required: true, min: 0 } 
        },
    ],
    totalPrice: { type: Number, required: true, min: 0 },
    paidPrice: { type: Number, required: true, default: 0, min: 0 },
    paymentStatus: { 
        type: String, 
        enum: ['Paid', 'Partial', 'Unpaid'], 
        required: true 
    },
    shouldBePaidBeforeDate: { type: Date },
    comment: String,
}, { timestamps: true });

const customerSchema = new mongoose.Schema({
    clerkId: String,
    name: { type: String, required: true },
    __more: String,
});

// INFO: Interfaces
export const Supplier = 
  mongoose.models.Supplier || 
  mongoose.model("Supplier", supplierSchema);

export const Notification = 
  mongoose.models.Notification || 
  mongoose.model("Notification", notificationSchema);

export const Product = 
  mongoose.models.Product || 
  mongoose.model("Product", productSchema);

export const Store = 
  mongoose.models.Store || 
  mongoose.model("Store", storeSchema);

export const Transaction = 
  mongoose.models.Transaction || 
  mongoose.model("Transaction", transactionSchema);

export const Customer = 
  mongoose.models.Customer || 
  mongoose.model("Customer", customerSchema);

export const Purchase =
  mongoose.models.Purchase ||
  mongoose.model("Purchase", purchaseSchema);
