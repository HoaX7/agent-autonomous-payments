import { putItem } from ".";
import { MEDICAL_INVENTORY_PK, VENDOR_DETAILS_PK } from "./models/medicalInventory";
import { WALLET_PK } from "./models/wallet";

const PAYPAL_SANDBOX_EMAIL = "sb-pypk55251785@personal.example.com";

const fakeItems = [
    {
      name: "Paracetamol 500mg",
      price: 15.0,
      inStock: 120,
    },
    {
      name: "Ibuprofen 200mg",
      price: 25.0,
      inStock: 100,
    },
    {
      name: "Cough Syrup (100ml)",
      price: 50.0,
      inStock: 100,
    },
    {
      name: "Antiseptic Cream",
      price: 40.0,
      inStock: 100,
    },
    {
      name: "Bandage Roll",
      price: 20.0,
      inStock: 100,
    },
    {
      name: "Digital Thermometer",
      price: 19.0,
      inStock: 100,
    },
    {
      name: "Blood Pressure Monitor",
      price: 14.0,
      inStock: 100,
    },
    {
      name: "Hand Sanitizer (250ml)",
      price: .0,
      inStock: 100,
    },
    // {
    //   name: "Cotton Swabs (pack of 100)",
    //   price: 3.0,
    //   inStock: 15,
    // },
    // {
    //   name: "Medical Gloves (pack of 50)",
    //   price: 12.0,
    //   inStock: 9,
    // },
];

const isValidUrl = (str?: string) => str && (str?.startsWith("http://") || str?.startsWith("https://"))

/**
 * Seed the database with initial inventory
 */
async function main() {
    console.log("seeding database...")
    for (const item of fakeItems) {
        item.inStock = 100;
        await putItem(MEDICAL_INVENTORY_PK, item)
    }
    console.log("inventory seeded")
    console.log("adding money to wallet")
    await putItem(WALLET_PK, { balance: 100000, budget: 2000 })

    console.log("adding vendor payment details")
    const vendorAgentUrl = process.argv[2];
    if (isValidUrl(vendorAgentUrl)) {
        await putItem(VENDOR_DETAILS_PK, {
            name: "Vendor Agent",
            url: vendorAgentUrl,
            email: PAYPAL_SANDBOX_EMAIL
        })
    } else {
        console.warn("[WARNING!!] Invalid vendor agent url provided. Retail Agent will not be able to make payments. " +
            "Re-run `npm run seed <url>` with vendor agent url. " +
            "Comment the above code to avoid creating duplicate records."
        );
        console.log("[HINT] Copy the vendor APIGateway url from the previous command.")
    }
    console.log("completed")
}

main().catch(console.error)