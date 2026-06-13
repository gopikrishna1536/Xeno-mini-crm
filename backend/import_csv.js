require('dotenv').config();
const fs = require('fs');
const readline = require('readline');
const supabase = require('./src/db/client');

async function main() {
  const filePath = '../my_profile.csv';
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    return;
  }

  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let isHeader = true;
  const customers = [];

  for await (const line of rl) {
    if (isHeader) {
      isHeader = false;
      continue;
    }

    // Basic CSV parsing (assuming no commas inside fields for this simple file)
    // The CSV has: name,email,phone,city,total_spend,total_orders,last_order_date
    const parts = line.split(',');
    if (parts.length >= 7) {
      const name = parts[0].replace(/"/g, '').trim();
      const email = parts[1].trim();
      const phone = parts[2].trim();
      const city = parts[3].trim();
      const total_spend = parseFloat(parts[4]);
      const total_orders = parseInt(parts[5], 10);
      const last_order_date = parts[6].trim();

      customers.push({
        name,
        email,
        phone,
        city,
        total_spend,
        total_orders,
        last_order_date: new Date(last_order_date).toISOString(),
      });
    }
  }

  if (customers.length > 0) {
    console.log(`Importing ${customers.length} customers...`);
    // Upsert to handle duplicates cleanly
    const { error } = await supabase.from('customers').upsert(customers, { onConflict: 'email' });
    if (error) {
      console.error("Error inserting customers:", error);
    } else {
      console.log("Successfully imported customers from CSV.");
    }
  } else {
    console.log("No valid customers found in CSV.");
  }
}

main();
