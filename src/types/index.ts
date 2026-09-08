export type RsvpMethod = 'google_form' | 'supabase';

export type EventSettings = {
  id: number;
  celebrant_name: string;
  age: number | null;
  birthday_date: string | null;
  event_date: string;
  start_time: string | null;
  end_time: string | null;
  venue: string;
  address: string;
  dress_code: string | null;
  description: string | null;
  birthday_message: string | null;
  additional_info: string | null;
  google_maps_url: string | null;
  rsvp_url: string | null;
  rsvp_method: RsvpMethod;
  rsvp_deadline: string | null;
  rsvp_note: string | null;
  seo_title: string | null;
  seo_description: string | null;
  og_image_url: string | null;
  created_at: string;
  updated_at: string;
}

export type HeroSettings = {
  id: number;
  label: string | null;
  title: string;
  subtitle: string | null;
  image_url: string | null;
  image_path: string | null;
  primary_cta_text: string;
  secondary_cta_text: string;
  show_countdown: boolean;
  updated_at: string;
}

export type AboutSettings = {
  id: number;
  title: string;
  greeting: string | null;
  description: string | null;
  birthday_message: string | null;
  image_url: string | null;
  image_path: string | null;
  updated_at: string;
}

export type GalleryImage = {
  id: string;
  image_url: string;
  storage_path: string;
  caption: string | null;
  display_order: number;
  is_visible: boolean;
  width: number | null;
  height: number | null;
  created_at: string;
}

export type Attendance = 'attending' | 'not_attending';

export type Rsvp = {
  id: string;
  full_name: string;
  guest_count: number;
  attendance: Attendance;
  contact_number: string | null;
  message: string | null;
  created_at: string;
}

export interface SiteContent {
  event: EventSettings | null;
  hero: HeroSettings | null;
  about: AboutSettings | null;
}

export interface Database {
  public: {
    Tables: {
      event_settings: {
        Row: EventSettings;
        Insert: Partial<EventSettings> & { id?: number };
        Update: Partial<EventSettings>;
        Relationships: [];
      };
      hero_settings: {
        Row: HeroSettings;
        Insert: Partial<HeroSettings> & { id?: number };
        Update: Partial<HeroSettings>;
        Relationships: [];
      };
      about_settings: {
        Row: AboutSettings;
        Insert: Partial<AboutSettings> & { id?: number };
        Update: Partial<AboutSettings>;
        Relationships: [];
      };
      gallery: {
        Row: GalleryImage;
        Insert: Omit<GalleryImage, 'id' | 'created_at'> & { id?: string; created_at?: string };
        Update: Partial<GalleryImage>;
        Relationships: [];
      };
      rsvps: {
        Row: Rsvp;
        Insert: Omit<Rsvp, 'id' | 'created_at'> & { id?: string; created_at?: string };
        Update: Partial<Rsvp>;
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { rsvp_method: RsvpMethod; attendance_status: Attendance };
    CompositeTypes: { [_ in never]: never };
  };
}
