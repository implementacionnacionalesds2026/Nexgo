export interface DriverLocation {
  id: number;
  driverId: string;
  driverName: string;
  driverPhone?: string;
  shipmentId?: string;
  trackingNumber?: string;
  currentStatus?: string;
  destinationCity?: string;
  latitude: number;
  longitude: number;
  speedKmh?: number;
  heading?: number;
  isActive: boolean;
  recordedAt: string;
}
