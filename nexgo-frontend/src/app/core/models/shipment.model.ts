export type ShipmentStatus =
  | 'PENDIENTE'
  | 'RECOGIDO'
  | 'EN_TRANSITO'
  | 'EN_DESTINO'
  | 'ENTREGADO'
  | 'CANCELADO';

export interface ShipmentStatusEntry {
  id: number;
  status: ShipmentStatus;
  notes: string;
  location: string;
  updatedByName: string;
  createdAt: string;
}

export interface Shipment {
  id: string;
  trackingNumber: string;
  clientId: string;
  clientName?: string;
  companyName?: string;
  assignedDriverId?: string;
  driverName?: string;
  driverPhone?: string;
  pricingRuleId?: number;

  // Remitente
  senderName: string;
  senderPhone: string;
  senderAddress: string;
  originCity: string;
  originLat?: number;
  originLng?: number;

  // Destinatario
  recipientName: string;
  recipientPhone: string;
  recipientAddress: string;
  destinationCity: string;
  destinationLat?: number;
  destinationLng?: number;

  // Paquete
  weightKg: number;
  lengthCm?: number;
  widthCm?: number;
  heightCm?: number;
  quantity: number;
  description?: string;
  isFragile: boolean;

  // Costos
  distanceKm?: number;
  estimatedCost?: number;
  finalCost?: number;

  // Estado
  currentStatus: ShipmentStatus;
  estimatedDelivery?: string;
  deliveredAt?: string;
  notes?: string;

  createdAt: string;
  updatedAt: string;

  statusHistory?: ShipmentStatusEntry[];
}

export interface CreateShipmentRequest {
  senderName: string;
  senderPhone: string;
  senderAddress: string;
  originCity: string;
  originLat?: number;
  originLng?: number;
  recipientName: string;
  recipientPhone: string;
  recipientAddress: string;
  destinationCity: string;
  destinationLat?: number;
  destinationLng?: number;
  weightKg: number;
  lengthCm?: number;
  widthCm?: number;
  heightCm?: number;
  quantity: number;
  description?: string;
  isFragile?: boolean;
  distanceKm?: number;
  pricingRuleId?: number;
}

export interface CotizacionResult {
  ruleId: number;
  ruleName: string;
  basePrice: number;
  totalCost: number;
  breakdown: {
    baseCost: number;
    weightCost: number;
    distanceCost: number;
    extraPkgCost: number;
  };
}

export interface PricingRule {
  id: number;
  name: string;
  basePrice: number;
  pricePerKg: number;
  pricePerKm: number;
  pricePerExtraPkg: number;
  dimensionSurcharge: number;
  maxWeightKg: number;
  isActive: boolean;
}
