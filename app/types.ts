// types.ts
export type CalendarEvent = {
  id: string;
  technician_id: string;
  time: Date;
  end: Date;
  customer_id: string;
  tip: number;
  payment: string;
  status: string;
  appointment_services: AppointmentService[];
  color?: string;
};

export interface AppointmentService {
  id: string;
  services: Service;
}

export interface Service {
  id: string;
  service: string;
  price: number;
}
