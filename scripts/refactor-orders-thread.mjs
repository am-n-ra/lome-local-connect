import { readFileSync, writeFileSync } from "node:fs";

const path = "src/components/omni/OrdersPanel.tsx";
let source = readFileSync(path, "utf8");
source = source.replace(
  'import { CheckCircle2, Clock3, CreditCard, MessageCircle, QrCode, Star } from "lucide-react";',
  'import { Star } from "lucide-react";',
);
source = source.replace('import { Badge } from "@/components/ui/badge";\n', "");
source = source.replace('import { QRCodeSVG } from "qrcode.react";\n', "");
source = source.replace(
  'import { ChatPanel } from "@/components/omni/ChatPanel";\n',
  'import { ChatPanel } from "@/components/omni/ChatPanel";\nimport { TransactionThreadCard } from "@/components/omni/TransactionThreadCard";\n',
);
source = source.replace(/\nconst STATUS_LABEL:[\s\S]*?\n\nexport function OrdersPanel/, "\nexport function OrdersPanel");
const start = source.indexOf("              return (\n                <div key={order.id}");
const end = source.indexOf("              );\n            })}", start);
if (start < 0 || end < 0) throw new Error("Orders map render block not found");
const replacement = `              return (\n                <TransactionThreadCard\n                  key={order.id}\n                  order={order}\n                  timeline={timeline}\n                  busy={busy === order.id || busy === order.transaction_id}\n                  onGenerateQr={() => void generate(order)}\n                  onConfirmPayment={() => void transition(order.transaction_id!, "payment")}\n                  onConfirmReceived={() => void transition(order.transaction_id!, "received")}\n                  onOpenChat={() => setChatOrder(order)}\n                />\n              )`;
source = source.slice(0, start) + replacement + source.slice(end + "              );".length);
source = source.replace(/\nconst EVENT_LABEL:[\s\S]*?\n\nexport function OrdersPanel/, "\nexport function OrdersPanel");
source = source.replace(/STATUS_LABEL\[[^\n]+\]/g, "chatOrder?.transaction_status ?? chatOrder?.status ?? \"En cours\"");
writeFileSync(path, source);
