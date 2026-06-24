const fs = require('fs');
const path = require('path');

const fileContent = `
export const fetchMockData = (data: any, delayMs: number = 800) => {
  return new Promise<any>((resolve) => setTimeout(() => resolve(data), delayMs));
};

function generateId(prefix: string, i: number) {
  return prefix + Math.random().toString(36).substr(2, 9) + i;
}

export const stores = Array.from({ length: 25 }).map((_, i) => ({
  _id: generateId("store_", i),
  name: \`Store Location \${i + 1}\`,
  createdAt: new Date(Date.now() - Math.random() * 10000000000).toISOString()
}));

export const products = Array.from({ length: 25 }).map((_, i) => ({
  _id: generateId("prod_", i),
  name: \`Premium Product \${i + 1}\`,
  type: i % 3 === 0 ? "Electronic" : i % 2 === 0 ? "Perishable" : "Hardware",
  unitBuyingPrice: Math.floor(Math.random() * 50) + 10,
  amount: Math.floor(Math.random() * 500) + 50,
  soldAmount: Math.floor(Math.random() * 50),
  createdAt: new Date().toISOString()
}));

export const suppliers = Array.from({ length: 25 }).map((_, i) => ({
  _id: generateId("sup_", i),
  name: \`Global Supplier Corp \${i + 1}\`,
  createdAt: new Date().toISOString()
}));

export const customers = Array.from({ length: 25 }).map((_, i) => ({
  _id: generateId("cust_", i),
  name: \`Client Persona \${i + 1}\`,
  createdAt: new Date().toISOString()
}));

export const purchases = Array.from({ length: 25 }).map((_, i) => {
  const isPaid = i % 2 === 0;
  const totalPrice = Math.floor(Math.random() * 5000) + 1000;
  return {
    _id: generateId("pur_", i),
    supplierId: suppliers[i % suppliers.length]._id,
    storeId: stores[i % stores.length]._id,
    products: [
      { productId: products[i % products.length]._id, amount: 20, unitBuyingPrice: 15 }
    ],
    totalPrice,
    paidPrice: isPaid ? totalPrice : Math.floor(totalPrice * (Math.random() * 0.8)),
    paymentStatus: isPaid ? 'Paid' : 'Unpaid',
    shouldBePaidBeforeDate: isPaid ? null : new Date(Date.now() + 86400000 * 10).toISOString(),
    createdAt: new Date(Date.now() - Math.random() * 5000000000).toISOString()
  };
});

export const transactions = Array.from({ length: 25 }).map((_, i) => {
  const tTotal = Math.floor(Math.random() * 2000) + 100;
  const unpaid = Math.random() > 0.6;
  return {
    _id: generateId("tx_", i),
    storeId: stores[i % stores.length]._id,
    customerId: customers[i % customers.length]._id,
    products: [
      { productId: products[i % products.length]._id, amount: 2, unitPrice: 50, unitBuyingPrice: 20 }
    ],
    totalPrice: tTotal,
    paidPrice: unpaid ? Math.floor(tTotal / 2) : tTotal,
    paymentStatus: unpaid ? 'Partial' : 'Paid',
    shouldBePaidBeforeDate: unpaid ? new Date(Date.now() - 86400000 * (i % 5)).toISOString() : null, // some are overdue
    isOutOfStore: true,
    createdAt: new Date(Date.now() - Math.random() * 5000000000).toISOString() // Randomize timeline for charts
  };
});

export const notifications = Array.from({ length: 25 }).map((_, i) => ({
  _id: generateId("notif_", i),
  content: \`Important System Notification #\${i + 1}: \${i % 2 === 0 ? 'Transaction completed successfully.' : 'New stock arrived at Store Location.'}\`,
  viewed: i % 3 === 0,
  createdAt: new Date(Date.now() - Math.random() * 86400000 * 3).toISOString()
}));
`;

fs.writeFileSync(path.join(__dirname, '../src/lib/testData.ts'), fileContent);
console.log("Mock data expanded to 25 items per paradigm.");
