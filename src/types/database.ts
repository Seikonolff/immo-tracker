export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type ApartmentStatus =
  | 'to_visit'
  | 'visit_planned'
  | 'visited'
  | 'application_sent'
  | 'rejected'

export interface Database {
  public: {
    Tables: {
      teams: {
        Row: {
          id: string
          name: string
          invite_code: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          invite_code?: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          invite_code?: string
          created_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          user_id: string
          team_id: string | null
          full_name: string | null
          avatar_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          team_id?: string | null
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          team_id?: string | null
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
        }
      }
      apartments: {
        Row: {
          id: string
          team_id: string
          url: string | null
          title: string
          price: number
          surface: number
          rooms: number | null
          charges: number | null
          photo_url: string | null
          is_furnished: boolean
          terrace: boolean
          parking: boolean
          address: string | null
          latitude: number | null
          longitude: number | null
          is_archived: boolean
          status: ApartmentStatus
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          team_id: string
          url?: string | null
          title: string
          price: number
          surface: number
          rooms?: number | null
          charges?: number | null
          photo_url?: string | null
          is_furnished?: boolean
          terrace?: boolean
          parking?: boolean
          address?: string | null
          latitude?: number | null
          longitude?: number | null
          is_archived?: boolean
          status?: ApartmentStatus
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          team_id?: string
          url?: string | null
          title?: string
          price?: number
          surface?: number
          rooms?: number | null
          charges?: number | null
          photo_url?: string | null
          is_furnished?: boolean
          terrace?: boolean
          parking?: boolean
          address?: string | null
          latitude?: number | null
          longitude?: number | null
          is_archived?: boolean
          status?: ApartmentStatus
          created_by?: string | null
          created_at?: string
        }
      }
      ratings: {
        Row: {
          id: string
          apartment_id: string
          user_id: string
          score: number
          comment: string | null
          created_at: string
        }
        Insert: {
          id?: string
          apartment_id: string
          user_id: string
          score: number
          comment?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          apartment_id?: string
          user_id?: string
          score?: number
          comment?: string | null
          created_at?: string
        }
      }
      remarks: {
        Row: {
          id: string
          apartment_id: string
          user_id: string
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          apartment_id: string
          user_id: string
          content: string
          created_at?: string
        }
        Update: {
          id?: string
          apartment_id?: string
          user_id?: string
          content?: string
          created_at?: string
        }
      }
      points_of_interest: {
        Row: {
          id: string
          team_id: string
          name: string
          type: 'friend' | 'bar' | 'work'
          latitude: number
          longitude: number
          created_at: string
        }
        Insert: {
          id?: string
          team_id: string
          name: string
          type: 'friend' | 'bar' | 'work'
          latitude: number
          longitude: number
          created_at?: string
        }
        Update: {
          id?: string
          team_id?: string
          name?: string
          type?: 'friend' | 'bar' | 'work'
          latitude?: number
          longitude?: number
          created_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          team_id: string
          user_id: string
          actor_id: string
          type: 'apartment_added' | 'rating_added' | 'remark_added' | 'status_changed'
          apartment_id: string | null
          message: string
          read_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          team_id: string
          user_id: string
          actor_id: string
          type: 'apartment_added' | 'rating_added' | 'remark_added' | 'status_changed'
          apartment_id?: string | null
          message: string
          read_at?: string | null
          created_at?: string
        }
        Update: {
          read_at?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Helper types
export type Team = Database['public']['Tables']['teams']['Row']
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Apartment = Database['public']['Tables']['apartments']['Row']
export type Rating = Database['public']['Tables']['ratings']['Row']
export type Remark = Database['public']['Tables']['remarks']['Row']
export type PointOfInterest = Database['public']['Tables']['points_of_interest']['Row']
export type Notification = Database['public']['Tables']['notifications']['Row']

export type NewApartment = Database['public']['Tables']['apartments']['Insert']
export type UpdateApartment = Database['public']['Tables']['apartments']['Update']
export type NewRating = Database['public']['Tables']['ratings']['Insert']
export type NewRemark = Database['public']['Tables']['remarks']['Insert']
export type NewPointOfInterest = Database['public']['Tables']['points_of_interest']['Insert']

// Extended types with relations
export type ApartmentWithRatings = Apartment & {
  ratings: Rating[]
  average_rating?: number
}

export type RemarkWithProfile = Remark & {
  profiles: {
    full_name: string | null
    avatar_url: string | null
  } | null
}
