import { EventEmitter } from "events";

export interface OrderRealtimeEvent {
  orderId: string;
  slug?: string | null;
  orderNumber: string;
  paymentStatus: string;
  orderStatus: string;
  updatedAt: string;
}

class PaymentEventBus extends EventEmitter {
  emitOrderUpdated(payload: OrderRealtimeEvent) {
    this.emit("order-updated", payload);
  }
}

export const paymentEvents = new PaymentEventBus();
paymentEvents.setMaxListeners(200);
