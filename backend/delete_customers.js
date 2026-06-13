require('dotenv').config();
const supabase = require('./src/db/client');

async function main() {
  console.log("Deleting all customers...");
  // Use a filter that matches all UUIDs (or effectively all rows)
  const { data, error } = await supabase
    .from('customers')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');
    
  if (error) {
    console.error("Error deleting customers:", error);
  } else {
    console.log("Successfully deleted all customers.");
  }
}

main();
