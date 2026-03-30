export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

interface TrackingEvent {
  date: string;
  status: string;
  location: string;
  description: string;
}

interface TrackingInfo {
  carrier: string;
  carrierName: string;
  trackingNumber: string;
  trackingUrl: string;
  currentStatus: string;
  estimatedDelivery: string | null;
  events: TrackingEvent[];
}

const CARRIER_NAMES: Record<string, string> = {
  dhl: "DHL Express",
  fedex: "FedEx",
  sea_freight: "海运",
  air_freight: "空运",
};

function getTrackingUrl(method: string, trackingNumber: string): string {
  switch (method) {
    case "dhl":
      return `https://www.dhl.com/en/express/tracking.html?AWB=${trackingNumber}`;
    case "fedex":
      return `https://www.fedex.com/fedextrack/?trknbr=${trackingNumber}`;
    default:
      return "";
  }
}

// Generate mock tracking events based on order status
function generateMockEvents(
  method: string,
  trackingNumber: string,
  orderStatus: string,
  createdAt: Date
): TrackingEvent[] {
  const events: TrackingEvent[] = [];
  const baseDate = new Date(createdAt);

  const addDays = (date: Date, days: number): Date => {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
  };

  // Statuses that imply shipping has happened
  const shippedStatuses = ["shipped", "in_transit", "delivered", "completed"];
  if (!shippedStatuses.includes(orderStatus)) {
    return [];
  }

  if (method === "dhl" || method === "fedex" || method === "air_freight") {
    events.push({
      date: addDays(baseDate, 0).toISOString(),
      status: "picked_up",
      location: "Shanghai, China",
      description: `包裹已揽收 - 运单号: ${trackingNumber}`,
    });
    events.push({
      date: addDays(baseDate, 1).toISOString(),
      status: "in_transit",
      location: "Shanghai Pudong Airport, China",
      description: "包裹已离开始发地设施",
    });

    if (["in_transit", "delivered", "completed"].includes(orderStatus)) {
      events.push({
        date: addDays(baseDate, 2).toISOString(),
        status: "in_transit",
        location: "Transit Hub",
        description: "包裹运输中",
      });
    }

    if (["delivered", "completed"].includes(orderStatus)) {
      events.push({
        date: addDays(baseDate, 4).toISOString(),
        status: "out_for_delivery",
        location: "Destination City",
        description: "包裹正在派送",
      });
      events.push({
        date: addDays(baseDate, 4).toISOString(),
        status: "delivered",
        location: "Destination City",
        description: "包裹已签收",
      });
    }
  } else if (method === "sea_freight") {
    events.push({
      date: addDays(baseDate, 0).toISOString(),
      status: "loaded",
      location: "Zhoushan Port, China",
      description: `货物已装船 - 提单号: ${trackingNumber}`,
    });
    events.push({
      date: addDays(baseDate, 3).toISOString(),
      status: "departed",
      location: "Zhoushan Port, China",
      description: "船舶已离港",
    });

    if (["in_transit", "delivered", "completed"].includes(orderStatus)) {
      events.push({
        date: addDays(baseDate, 15).toISOString(),
        status: "in_transit",
        location: "At Sea",
        description: "货物海上运输中",
      });
    }

    if (["delivered", "completed"].includes(orderStatus)) {
      events.push({
        date: addDays(baseDate, 28).toISOString(),
        status: "arrived",
        location: "Destination Port",
        description: "船舶已到达目的港",
      });
      events.push({
        date: addDays(baseDate, 30).toISOString(),
        status: "delivered",
        location: "Destination Port",
        description: "货物已提取",
      });
    }
  }

  return events;
}

// GET: Fetch tracking info
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth(["viewer"]);

    const order = await prisma.order.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        status: true,
        shippingMethod: true,
        trackingNumber: true,
        trackingUrl: true,
        createdAt: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (!order.trackingNumber || !order.shippingMethod) {
      return NextResponse.json({
        carrier: null,
        trackingNumber: null,
        trackingUrl: null,
        currentStatus: "no_tracking",
        estimatedDelivery: null,
        events: [],
      });
    }

    const events = generateMockEvents(
      order.shippingMethod,
      order.trackingNumber,
      order.status,
      order.createdAt
    );

    const lastEvent = events.length > 0 ? events[events.length - 1] : null;

    // Estimate delivery based on method
    let estimatedDelivery: string | null = null;
    const baseDate = new Date(order.createdAt);
    if (order.shippingMethod === "dhl" || order.shippingMethod === "fedex") {
      const est = new Date(baseDate);
      est.setDate(est.getDate() + 5);
      estimatedDelivery = est.toISOString();
    } else if (order.shippingMethod === "air_freight") {
      const est = new Date(baseDate);
      est.setDate(est.getDate() + 7);
      estimatedDelivery = est.toISOString();
    } else if (order.shippingMethod === "sea_freight") {
      const est = new Date(baseDate);
      est.setDate(est.getDate() + 30);
      estimatedDelivery = est.toISOString();
    }

    const tracking: TrackingInfo = {
      carrier: order.shippingMethod,
      carrierName: CARRIER_NAMES[order.shippingMethod] || order.shippingMethod,
      trackingNumber: order.trackingNumber,
      trackingUrl: order.trackingUrl || getTrackingUrl(order.shippingMethod, order.trackingNumber),
      currentStatus: lastEvent?.status || "pending",
      estimatedDelivery,
      events,
    };

    return NextResponse.json(tracking);
  } catch (error) {
    if (error instanceof Response) return error;
    console.error("Tracking info error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
