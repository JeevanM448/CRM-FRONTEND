export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          name: string;
          email: string;
          role: string;
          department: string;
          avatar: string | null;
          title: string | null;
          status: string;
          last_active: string;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["users"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["users"]["Row"]>;
      };
      customers: {
        Row: {
          id: string;
          name: string;
          industry: string;
          location: string;
          owner_id: string;
          contact_name: string;
          contact_email: string;
          contact_phone: string;
          revenue: number;
          status: string;
          last_activity: string;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["customers"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["customers"]["Row"]>;
      };
      contacts: {
        Row: {
          id: string;
          name: string;
          company_id: string;
          designation: string;
          email: string;
          phone: string;
          owner_id: string;
          status: string;
          last_contact: string;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["contacts"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["contacts"]["Row"]>;
      };
      deals: {
        Row: {
          id: string;
          title: string;
          customer_id: string;
          owner_id: string;
          value: number;
          stage: string;
          probability: number;
          expected_close: string;
          last_activity: string;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["deals"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["deals"]["Row"]>;
      };
      emails: {
        Row: {
          id: string;
          thread_id: string;
          subject: string;
          from_email: string;
          body: string;
          folder: string;
          customer_id: string | null;
          deal_id: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["emails"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["emails"]["Row"]>;
      };
      purchase_orders: {
        Row: {
          id: string;
          po_number: string;
          customer_id: string;
          deal_id: string;
          amount: number;
          po_date: string;
          delivery_date: string;
          status: string;
          owner_id: string;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["purchase_orders"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["purchase_orders"]["Row"]>;
      };
      follow_ups: {
        Row: {
          id: string;
          title: string;
          customer_id: string;
          deal_id: string;
          due_date: string;
          status: string;
          owner_id: string;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["follow_ups"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["follow_ups"]["Row"]>;
      };
      activities: {
        Row: {
          id: string;
          type: string;
          title: string;
          description: string | null;
          entity_type: string | null;
          entity_id: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["activities"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["activities"]["Row"]>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
