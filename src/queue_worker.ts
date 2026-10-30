import { sendLifecycleMail } from "./receipt_sender.ts";

const event = {
  kind: "delivered",
  shipmentId: "shp_2048",
  recipient: process.env.DEMO_EMAIL_TO,
  recipientName: "Ari",
  trackingNumber: "LT-2048",
  proofOfDelivery: { name: "pod-2048.pdf", mediaType: "application/pdf" }
};

if (!event.recipient) throw new Error("DEMO_EMAIL_TO is required");
const result = await sendLifecycleMail(event);
console.log(`sent lifecycle mail ${result.message_id}`);
