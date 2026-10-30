import { z } from "zod";
import { infrai } from "./infrai_client.ts";

export const shipmentEventSchema = z.object({
  kind: z.enum(["delivered", "exception"]),
  shipmentId: z.string().min(1),
  recipient: z.string().email(),
  recipientName: z.string().min(1),
  trackingNumber: z.string().min(1),
  proofOfDelivery: z.object({ name: z.string().min(1), mediaType: z.string().min(1) }).optional(),
  exceptionReason: z.string().min(1).optional()
});

export type ShipmentEvent = z.infer<typeof shipmentEventSchema>;

export function chooseLifecycleMail(event: ShipmentEvent): { subject: string; body: string } {
  if (event.kind === "exception") {
    return {
      subject: `Shipment ${event.trackingNumber} needs attention`,
      body: `Hello ${event.recipientName}, shipment ${event.trackingNumber} needs attention: ${event.exceptionReason ?? "delivery exception"}.`
    };
  }
  const proof = event.proofOfDelivery ? ` Proof of delivery: ${event.proofOfDelivery.name}.` : "";
  return {
    subject: `Shipment ${event.trackingNumber} delivered`,
    body: `Hello ${event.recipientName}, shipment ${event.trackingNumber} was delivered.${proof}`
  };
}

export async function sendLifecycleMail(input: unknown) {
  const event = shipmentEventSchema.parse(input);
  const mail = chooseLifecycleMail(event);
  return infrai.email.send({
    to: event.recipient,
    subject: mail.subject,
    body: mail.body,
    template_vars: { shipment_id: event.shipmentId, tracking_number: event.trackingNumber }
  }, `shipment-${event.shipmentId}-${event.kind}`);
}
