import { BotIcon, Cloud } from "lucide-solid";
import { Modal } from "../components/commons/Modal";
import { marked } from "marked";
// import logo from "../img/logo.svg";
import bagArrow from "../img/bag-arrow.svg";

const markdown = `This proof-of-concept (POC) showcases **Agent-to-Agent autonomous payments** between two simulated business entities:

- **☘️ Clover Pharmacy** – a retail agent responsible for managing inventory and initiating payments.
- **💊 Pfifier Meds Manufacturing Ltd.** – a vendor agent that issues invoices and supplies goods.

### **<u>How It Works</u>**
- The **retail agent**, within a pre-set **budget**, evaluates inventory and places orders to re-stock low inventory items.
- The **vendor agent** generates quotations and invoices for the goods requested by the retail agent.
- The **retail agent**, parses the invoice and initiates a **PayPal Payment** to the vendor.
- The **vendor agent** on payment confirmation generates a receipt and dispatches the goods.
- Payments are made **autonomously**, simulating real-world A2A interactions without human intervention.
`;

export default function home() {
  return (
    // <section class="retail h-full flex items-center" data-theme="dark">
    //   <div class="container mx-auto">
    //     <div class="text-5xl text-center font-bold mb-12 text-purple-400">
    //       Agent-to-Agent Autonomous Payments
    //     </div>
    //     <div class="flex justify-between">
    //       {/* @ts-ignore */}
    //     <dotlottie-player
    //       src="https://lottie.host/a26b8bc0-ee5f-491e-a72d-950675f8dd95/JzyuVt3Wbb.lottie"
    //       background="transparent"
    //       speed="1"
    //       style="width: 400px;"
    //       loop
    //       autoplay
    //     />
    //       <img src={bagArrow} width={700} class="mb-12" />
    //       <div class="-scale-x-[1]">
    //         {/* @ts-ignore */}
		// 		<dotlottie-player
		// 			src="https://lottie.host/ebe0bee9-4942-46a5-9be6-0a94075efb9a/6MK6HFBzQo.lottie"
		// 			background="transparent"
		// 			speed="1"
		// 			style="width: 300px;"
		// 			loop
		// 			autoplay
		// 		/>
    //       </div>
    //     </div>
    //       <a
    //       class="rounded-full text-center glass p-4 text-white/70 cursor-pointer text-2xl mx-auto block w-[250px]"
    //       href="/app"
    //     >
    //       <BotIcon class="inline mr-2" /> Demo
    //     </a>
    //       <a
    //       class="rounded-full mt-5 text-center glass p-4 text-white/70 cursor-pointer text-2xl mx-auto block w-[250px]"
    //       href="/architecture"
    //     >
    //       <Cloud class="inline mr-2" /> Architecture
    //     </a>
    //   </div>
    // </section>
    <section class="retail h-full flex items-center" data-theme="dark">
      <div class="container mx-auto max-w-2xl rounded-md">
        <div class="glass rounded-md">
          <h2 class="bg-black/70 p-4 font-bold rounded-t-md">
          Agents Paying Autonomously
        </h2>
        <div
          class="md-content p-4"
          innerHTML={marked.parse(markdown) as string}
        />
        </div>
      <div class="mt-4">
        <a
          class="rounded-full glass px-2 py-1 text-white/70 cursor-pointer"
          href="/app"
        >
          <BotIcon class="inline mr-2" /> Demo
        </a>
        <a
          href="/architecture"
          class="rounded-full glass px-2 py-1 text-white/70 ml-2"
        >
          <Cloud class="inline mr-2" /> Architecture
        </a>
      </div>
      </div>
    </section>
  );
}
