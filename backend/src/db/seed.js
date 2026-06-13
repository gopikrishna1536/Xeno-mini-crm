require('dotenv').config();
const supabase = require('./client');

const INDIAN_NAMES = [
  'Aarav Sharma', 'Priya Patel', 'Rohit Mehta', 'Ananya Singh', 'Vikram Nair',
  'Pooja Iyer', 'Arjun Reddy', 'Deepika Joshi', 'Karan Malhotra', 'Sneha Gupta',
  'Amit Kumar', 'Riya Desai', 'Nikhil Verma', 'Kavya Pillai', 'Rahul Bose',
  'Meera Nambiar', 'Siddharth Rao', 'Aditi Chatterjee', 'Manish Agarwal', 'Swati Mishra',
  'Rajesh Pandey', 'Nisha Kapoor', 'Aditya Banerjee', 'Pallavi Saxena', 'Suresh Yadav',
  'Tanvi Shah', 'Gaurav Tiwari', 'Divya Krishnamurthy', 'Manoj Dubey', 'Ritu Menon',
  'Varun Bhatt', 'Ishaan Choudhary', 'Sunita Wagh', 'Harsh Rastogi', 'Lavanya Nair',
  'Akash Srivastava', 'Smita Deshpande', 'Pratik Kulkarni', 'Neha Thakur', 'Vivek Patil',
  'Bhavna Jain', 'Chirag Solanki', 'Anjali Mukherjee', 'Sachin Ghosh', 'Preeti Ahuja',
  'Tarun Bajaj', 'Shweta Tripathi', 'Nitin Pawar', 'Komal Sethi', 'Pankaj Mathur',
  'Alok Sinha', 'Rupal Shah', 'Sandeep Nayak', 'Jyoti Bhatia', 'Mohit Arora',
  'Rekha Pillai', 'Ashish Misra', 'Nidhi Saxena', 'Sumit Sharma', 'Tanya Kapoor',
  'Vishal Raj', 'Priti Menon', 'Kunal Dixit', 'Namrata Joshi', 'Piyush Verma',
  'Harshita Rao', 'Deepak Pande', 'Simran Chadha', 'Yash Goel', 'Madhuri Iyer',
];

const CITIES = ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Hyderabad', 'Pune', 'Kolkata', 'Ahmedabad', 'Jaipur', 'Surat'];
const CHANNELS = ['online', 'store', 'app'];
const PRODUCT_CATEGORIES = ['Kurta', 'Saree', 'Jeans', 'T-Shirt', 'Dress', 'Blazer', 'Ethnic Set', 'Lehenga', 'Shirt', 'Palazzo'];

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min, max) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(2));
}

function randomDate(daysAgo) {
  const d = new Date();
  d.setDate(d.getDate() - randomBetween(0, daysAgo));
  return d.toISOString();
}

function generateCustomers(count) {
  const customers = [];
  for (let i = 0; i < count; i++) {
    const name = INDIAN_NAMES[i % INDIAN_NAMES.length] + (i >= INDIAN_NAMES.length ? ` ${Math.floor(i / INDIAN_NAMES.length) + 1}` : '');
    const emailBase = name.toLowerCase().replace(/\s+/g, '.').replace(/[^a-z.]/g, '');
    const totalOrders = randomBetween(1, 20);
    const totalSpend = randomFloat(500, 50000);
    const lastOrderDaysAgo = randomBetween(1, 365);
    const firstOrderDaysAgo = lastOrderDaysAgo + randomBetween(30, 730);

    customers.push({
      name,
      email: `${emailBase}${i}@example.com`,
      phone: `+91${randomBetween(7000000000, 9999999999)}`,
      city: CITIES[randomBetween(0, CITIES.length - 1)],
      gender: randomBetween(0, 1) === 0 ? 'female' : 'male',
      age: randomBetween(18, 55),
      total_spend: totalSpend,
      total_orders: totalOrders,
      last_order_date: randomDate(lastOrderDaysAgo),
      first_order_date: randomDate(firstOrderDaysAgo),
      tags: totalSpend > 20000 ? ['vip'] : totalOrders > 10 ? ['loyal'] : lastOrderDaysAgo > 90 ? ['at-risk'] : [],
    });
  }
  return customers;
}

function generateOrders(customers) {
  const orders = [];
  for (const customer of customers) {
    const numOrders = customer.total_orders;
    for (let i = 0; i < numOrders; i++) {
      const items = Array.from({ length: randomBetween(1, 4) }, () => ({
        name: PRODUCT_CATEGORIES[randomBetween(0, PRODUCT_CATEGORIES.length - 1)],
        price: randomFloat(299, 5999),
        qty: randomBetween(1, 3),
      }));
      orders.push({
        customer_id: customer.id,
        amount: items.reduce((sum, item) => sum + item.price * item.qty, 0).toFixed(2),
        items,
        channel: CHANNELS[randomBetween(0, CHANNELS.length - 1)],
        status: 'completed',
        order_date: randomDate(365),
      });
    }
  }
  return orders;
}

async function seed() {
  console.log('🌱 Seeding database...');

  // Clear existing data
  await supabase.from('communications').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('campaigns').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('orders').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('customers').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  console.log('🗑️  Cleared old data');

  // Insert customers in batches
  const customerData = generateCustomers(250);
  const { data: customers, error: custErr } = await supabase
    .from('customers')
    .insert(customerData)
    .select();

  if (custErr) { console.error('Customer seed error:', custErr); process.exit(1); }
  console.log(`✅ Inserted ${customers.length} customers`);

  // Insert orders in batches of 100
  const allOrders = generateOrders(customers);
  for (let i = 0; i < allOrders.length; i += 100) {
    const batch = allOrders.slice(i, i + 100);
    const { error: ordErr } = await supabase.from('orders').insert(batch);
    if (ordErr) console.error('Order batch error:', ordErr);
  }
  console.log(`✅ Inserted ~${allOrders.length} orders`);
  console.log('🎉 Seed complete!');
  process.exit(0);
}

seed().catch(console.error);
