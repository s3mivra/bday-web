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
  theme: string | null;
  updated_at: string;
}

export type InvitationSettings = {
  id: number;
  envelope_enabled: boolean;
  envelope_heading: string | null;
  hero_tagline: string | null;
  song_title: string | null;
  song_subtitle: string | null;
  song_url: string | null;
  song_path: string | null;
  countdown_title: string | null;
  countdown_text: string | null;
  countdown_image_url: string | null;
  countdown_image_path: string | null;
  banner_text: string | null;
  ceremony_title: string | null;
  ceremony_time: string | null;
  ceremony_venue: string | null;
  ceremony_address: string | null;
  ceremony_maps_url: string | null;
  reception_title: string | null;
  fun_title: string | null;
  fun_text: string | null;
  ninong: string | null;
  ninang: string | null;
  gift_guide: string | null;
  reminders: string | null;
  photo_image_url: string | null;
  photo_image_path: string | null;
  save_date_text: string | null;
  closing_letter: string | null;
  closing_signature: string | null;
  closing_image_url: string | null;
  closing_image_path: string | null;
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
  invitation: InvitationSettings | null;
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
      invitation_settings: {
        Row: InvitationSettings;
        Insert: Partial<InvitationSettings> & { id?: number };
        Update: Partial<InvitationSettings>;
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
