import assert from "node:assert/strict";
import test from "node:test";
import { chooseLifecycleMail } from "./receipt_sender.ts";

test("exception events produce an attention mail without a proof link", () => {
  const mail = chooseLifecycleMail({
    kind: "exception",
    shipmentId: "shp_7",
    recipient: "care@example.test",
    recipientName: "Mina",
    trackingNumber: "LT-7",
    exceptionReason: "address requires confirmation"
  });
  assert.equal(mail.subject, "Shipment LT-7 needs attention");
  assert.match(mail.body, /address requires confirmation/);
  assert.doesNotMatch(mail.body, /pod|download/i);
});
