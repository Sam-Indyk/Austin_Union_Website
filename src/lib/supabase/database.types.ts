
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "public": {
          Tables: {
            "ballots": {
                  Row: {
                    "created_at": string,"id": number,"option_id": string,"person_id": string | null,"round": number,"updated_at": string,"vote_id": string,"voter_key": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: never,"option_id": string,"person_id"?: string | null,"round": number,"updated_at"?: string,"vote_id": string,"voter_key": string
                  }
                  Update: {
                    "created_at"?: string,"id"?: never,"option_id"?: string,"person_id"?: string | null,"round"?: number,"updated_at"?: string,"vote_id"?: string,"voter_key"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "ballots_option_id_fkey"
      columns: ["option_id"]
isOneToOne: false
      referencedRelation: "vote_options"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "ballots_person_id_fkey"
      columns: ["person_id"]
isOneToOne: false
      referencedRelation: "people"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "ballots_vote_id_fkey"
      columns: ["vote_id"]
isOneToOne: false
      referencedRelation: "votes"
      referencedColumns: ["id"]
    }
                  ]
                },"collage_photos": {
                  Row: {
                    "created_at": string,"emphasis": number,"focal_x": number,"focal_y": number,"height": number,"id": string,"sort_order": number,"src": string,"width": number
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"emphasis"?: number,"focal_x"?: number,"focal_y"?: number,"height": number,"id"?: string,"sort_order"?: number,"src": string,"width": number
                  }
                  Update: {
                    "created_at"?: string,"emphasis"?: number,"focal_x"?: number,"focal_y"?: number,"height"?: number,"id"?: string,"sort_order"?: number,"src"?: string,"width"?: number
                  }
                  Relationships: [
                    
                  ]
                },"email_campaigns": {
                  Row: {
                    "audience": NonNullable<Json>,"content": NonNullable<Json>,"created_at": string,"created_by": string | null,"event_id": string | null,"id": string,"kind": string,"scheduled_at": string | null,"sent_at": string | null,"status": string,"subject": string,"updated_at": string,"vote_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "audience"?: NonNullable<Json>,"content"?: NonNullable<Json>,"created_at"?: string,"created_by"?: string | null,"event_id"?: string | null,"id"?: string,"kind": string,"scheduled_at"?: string | null,"sent_at"?: string | null,"status"?: string,"subject": string,"updated_at"?: string,"vote_id"?: string | null
                  }
                  Update: {
                    "audience"?: NonNullable<Json>,"content"?: NonNullable<Json>,"created_at"?: string,"created_by"?: string | null,"event_id"?: string | null,"id"?: string,"kind"?: string,"scheduled_at"?: string | null,"sent_at"?: string | null,"status"?: string,"subject"?: string,"updated_at"?: string,"vote_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "email_campaigns_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "people"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "email_campaigns_event_id_fkey"
      columns: ["event_id"]
isOneToOne: false
      referencedRelation: "events"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "email_campaigns_vote_fk"
      columns: ["vote_id"]
isOneToOne: false
      referencedRelation: "votes"
      referencedColumns: ["id"]
    }
                  ]
                },"email_sends": {
                  Row: {
                    "campaign_id": string,"created_at": string,"email": string,"error": string | null,"id": number,"person_id": string | null,"provider_id": string | null,"sent_at": string | null,"status": string
                  }
                  ComputedFields: never
                  Insert: {
                    "campaign_id": string,"created_at"?: string,"email": string,"error"?: string | null,"id"?: never,"person_id"?: string | null,"provider_id"?: string | null,"sent_at"?: string | null,"status"?: string
                  }
                  Update: {
                    "campaign_id"?: string,"created_at"?: string,"email"?: string,"error"?: string | null,"id"?: never,"person_id"?: string | null,"provider_id"?: string | null,"sent_at"?: string | null,"status"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "email_sends_campaign_id_fkey"
      columns: ["campaign_id"]
isOneToOne: false
      referencedRelation: "email_campaigns"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "email_sends_person_id_fkey"
      columns: ["person_id"]
isOneToOne: false
      referencedRelation: "people"
      referencedColumns: ["id"]
    }
                  ]
                },"events": {
                  Row: {
                    "address": string | null,"capacity": number | null,"created_at": string,"created_by": string | null,"description": string,"ends_at": string,"feature_on_home": boolean,"home_card": Json | null,"id": string,"image": NonNullable<Json>,"location_name": string,"member_kinds": (Database["public"]['Enums']["membership_kind"])[] | null,"partner": Json | null,"publish_at": string | null,"recap": Json | null,"rsvp_closes_at": string | null,"rsvp_mode": string,"slug": string,"starts_at": string,"status": Database["public"]['Enums']["event_status"],"summary": string,"title": string,"updated_at": string,"visibility": Database["public"]['Enums']["event_visibility"]
                  }
                  ComputedFields: never
                  Insert: {
                    "address"?: string | null,"capacity"?: number | null,"created_at"?: string,"created_by"?: string | null,"description"?: string,"ends_at": string,"feature_on_home"?: boolean,"home_card"?: Json | null,"id"?: string,"image": NonNullable<Json>,"location_name"?: string,"member_kinds"?: (Database["public"]['Enums']["membership_kind"])[] | null,"partner"?: Json | null,"publish_at"?: string | null,"recap"?: Json | null,"rsvp_closes_at"?: string | null,"rsvp_mode"?: string,"slug": string,"starts_at": string,"status"?: Database["public"]['Enums']["event_status"],"summary"?: string,"title": string,"updated_at"?: string,"visibility"?: Database["public"]['Enums']["event_visibility"]
                  }
                  Update: {
                    "address"?: string | null,"capacity"?: number | null,"created_at"?: string,"created_by"?: string | null,"description"?: string,"ends_at"?: string,"feature_on_home"?: boolean,"home_card"?: Json | null,"id"?: string,"image"?: NonNullable<Json>,"location_name"?: string,"member_kinds"?: (Database["public"]['Enums']["membership_kind"])[] | null,"partner"?: Json | null,"publish_at"?: string | null,"recap"?: Json | null,"rsvp_closes_at"?: string | null,"rsvp_mode"?: string,"slug"?: string,"starts_at"?: string,"status"?: Database["public"]['Enums']["event_status"],"summary"?: string,"title"?: string,"updated_at"?: string,"visibility"?: Database["public"]['Enums']["event_visibility"]
                  }
                  Relationships: [
                    {
      foreignKeyName: "events_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "people"
      referencedColumns: ["id"]
    }
                  ]
                },"member_pages": {
                  Row: {
                    "body": string,"created_at": string,"id": string,"member_kinds": (Database["public"]['Enums']["membership_kind"])[] | null,"published": boolean,"slug": string,"sort_order": number,"title": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "body"?: string,"created_at"?: string,"id"?: string,"member_kinds"?: (Database["public"]['Enums']["membership_kind"])[] | null,"published"?: boolean,"slug": string,"sort_order"?: number,"title": string,"updated_at"?: string
                  }
                  Update: {
                    "body"?: string,"created_at"?: string,"id"?: string,"member_kinds"?: (Database["public"]['Enums']["membership_kind"])[] | null,"published"?: boolean,"slug"?: string,"sort_order"?: number,"title"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"memberships": {
                  Row: {
                    "created_at": string,"ends_on": string | null,"granted_by": string | null,"honorary_reason": string | null,"id": string,"kind": Database["public"]['Enums']["membership_kind"],"notes": string | null,"person_id": string,"starts_on": string,"status": string,"updated_at": string,"membership_is_current": boolean | null
                  }
                  ComputedFields: "membership_is_current"
                  Insert: {
                    "created_at"?: string,"ends_on"?: string | null,"granted_by"?: string | null,"honorary_reason"?: string | null,"id"?: string,"kind": Database["public"]['Enums']["membership_kind"],"notes"?: string | null,"person_id": string,"starts_on"?: string,"status"?: string,"updated_at"?: string
                  }
                  Update: {
                    "created_at"?: string,"ends_on"?: string | null,"granted_by"?: string | null,"honorary_reason"?: string | null,"id"?: string,"kind"?: Database["public"]['Enums']["membership_kind"],"notes"?: string | null,"person_id"?: string,"starts_on"?: string,"status"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "memberships_granted_by_fkey"
      columns: ["granted_by"]
isOneToOne: false
      referencedRelation: "people"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "memberships_person_id_fkey"
      columns: ["person_id"]
isOneToOne: false
      referencedRelation: "people"
      referencedColumns: ["id"]
    }
                  ]
                },"messages": {
                  Row: {
                    "archived_at": string | null,"body": string,"created_at": string,"email": string,"id": string,"name": string,"page": string,"person_id": string | null,"read_at": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "archived_at"?: string | null,"body": string,"created_at"?: string,"email": string,"id"?: string,"name"?: string,"page"?: string,"person_id"?: string | null,"read_at"?: string | null
                  }
                  Update: {
                    "archived_at"?: string | null,"body"?: string,"created_at"?: string,"email"?: string,"id"?: string,"name"?: string,"page"?: string,"person_id"?: string | null,"read_at"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "messages_person_id_fkey"
      columns: ["person_id"]
isOneToOne: false
      referencedRelation: "people"
      referencedColumns: ["id"]
    }
                  ]
                },"people": {
                  Row: {
                    "class_year": number | null,"created_at": string,"email": string,"first_name": string | null,"id": string,"last_name": string | null,"notes": string | null,"source": string,"subscribed": boolean,"subscribed_at": string | null,"uaustin_email": string | null,"uaustin_verified_at": string | null,"unsubscribe_token": string,"unsubscribed_at": string | null,"updated_at": string,"user_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "class_year"?: number | null,"created_at"?: string,"email": string,"first_name"?: string | null,"id"?: string,"last_name"?: string | null,"notes"?: string | null,"source"?: string,"subscribed"?: boolean,"subscribed_at"?: string | null,"uaustin_email"?: string | null,"uaustin_verified_at"?: string | null,"unsubscribe_token"?: string,"unsubscribed_at"?: string | null,"updated_at"?: string,"user_id"?: string | null
                  }
                  Update: {
                    "class_year"?: number | null,"created_at"?: string,"email"?: string,"first_name"?: string | null,"id"?: string,"last_name"?: string | null,"notes"?: string | null,"source"?: string,"subscribed"?: boolean,"subscribed_at"?: string | null,"uaustin_email"?: string | null,"uaustin_verified_at"?: string | null,"unsubscribe_token"?: string,"unsubscribed_at"?: string | null,"updated_at"?: string,"user_id"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"rsvps": {
                  Row: {
                    "checked_in_at": string | null,"checked_in_by": string | null,"created_at": string,"email": string,"event_id": string,"first_name": string,"guests": number,"id": string,"last_name": string,"manage_token": string,"partner_error": string | null,"partner_ref": string | null,"partner_status": string,"person_id": string | null,"status": string,"updated_at": string
                  }
                  ComputedFields: never
                  Insert: {
                    "checked_in_at"?: string | null,"checked_in_by"?: string | null,"created_at"?: string,"email": string,"event_id": string,"first_name": string,"guests"?: number,"id"?: string,"last_name": string,"manage_token"?: string,"partner_error"?: string | null,"partner_ref"?: string | null,"partner_status"?: string,"person_id"?: string | null,"status"?: string,"updated_at"?: string
                  }
                  Update: {
                    "checked_in_at"?: string | null,"checked_in_by"?: string | null,"created_at"?: string,"email"?: string,"event_id"?: string,"first_name"?: string,"guests"?: number,"id"?: string,"last_name"?: string,"manage_token"?: string,"partner_error"?: string | null,"partner_ref"?: string | null,"partner_status"?: string,"person_id"?: string | null,"status"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "rsvps_checked_in_by_fkey"
      columns: ["checked_in_by"]
isOneToOne: false
      referencedRelation: "people"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "rsvps_event_id_fkey"
      columns: ["event_id"]
isOneToOne: false
      referencedRelation: "events"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "rsvps_person_id_fkey"
      columns: ["person_id"]
isOneToOne: false
      referencedRelation: "people"
      referencedColumns: ["id"]
    }
                  ]
                },"site_content": {
                  Row: {
                    "key": string,"updated_at": string,"updated_by": string | null,"value": NonNullable<Json>
                  }
                  ComputedFields: never
                  Insert: {
                    "key": string,"updated_at"?: string,"updated_by"?: string | null,"value": NonNullable<Json>
                  }
                  Update: {
                    "key"?: string,"updated_at"?: string,"updated_by"?: string | null,"value"?: NonNullable<Json>
                  }
                  Relationships: [
                    {
      foreignKeyName: "site_content_updated_by_fkey"
      columns: ["updated_by"]
isOneToOne: false
      referencedRelation: "people"
      referencedColumns: ["id"]
    }
                  ]
                },"staff": {
                  Row: {
                    "created_at": string,"person_id": string,"role": Database["public"]['Enums']["staff_role"]
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"person_id": string,"role"?: Database["public"]['Enums']["staff_role"]
                  }
                  Update: {
                    "created_at"?: string,"person_id"?: string,"role"?: Database["public"]['Enums']["staff_role"]
                  }
                  Relationships: [
                    {
      foreignKeyName: "staff_person_id_fkey"
      columns: ["person_id"]
isOneToOne: true
      referencedRelation: "people"
      referencedColumns: ["id"]
    }
                  ]
                },"team_members": {
                  Row: {
                    "active": boolean,"created_at": string,"email": string | null,"ended_on": string | null,"id": string,"linkedin_url": string | null,"name": string,"person_id": string | null,"photo": NonNullable<Json>,"role": string,"sort_order": number,"started_on": string | null,"updated_at": string,"x_url": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "active"?: boolean,"created_at"?: string,"email"?: string | null,"ended_on"?: string | null,"id"?: string,"linkedin_url"?: string | null,"name": string,"person_id"?: string | null,"photo": NonNullable<Json>,"role": string,"sort_order"?: number,"started_on"?: string | null,"updated_at"?: string,"x_url"?: string | null
                  }
                  Update: {
                    "active"?: boolean,"created_at"?: string,"email"?: string | null,"ended_on"?: string | null,"id"?: string,"linkedin_url"?: string | null,"name"?: string,"person_id"?: string | null,"photo"?: NonNullable<Json>,"role"?: string,"sort_order"?: number,"started_on"?: string | null,"updated_at"?: string,"x_url"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "team_members_person_id_fkey"
      columns: ["person_id"]
isOneToOne: false
      referencedRelation: "people"
      referencedColumns: ["id"]
    }
                  ]
                },"vote_options": {
                  Row: {
                    "color": string | null,"description": string | null,"id": string,"label": string,"sort_order": number,"vote_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "color"?: string | null,"description"?: string | null,"id"?: string,"label": string,"sort_order"?: number,"vote_id": string
                  }
                  Update: {
                    "color"?: string | null,"description"?: string | null,"id"?: string,"label"?: string,"sort_order"?: number,"vote_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "vote_options_vote_id_fkey"
      columns: ["vote_id"]
isOneToOne: false
      referencedRelation: "votes"
      referencedColumns: ["id"]
    }
                  ]
                },"votes": {
                  Row: {
                    "allow_change": boolean,"closes_at": string | null,"created_at": string,"created_by": string | null,"description": string,"eligibility": Database["public"]['Enums']["vote_eligibility"],"event_id": string | null,"feature_on_home": boolean,"format": Database["public"]['Enums']["vote_format"],"id": string,"is_anonymous": boolean,"member_kinds": (Database["public"]['Enums']["membership_kind"])[] | null,"opens_at": string | null,"phase": Database["public"]['Enums']["vote_phase"],"phase_changed_at": string | null,"resolution": string,"results_visibility": Database["public"]['Enums']["results_visibility"],"slug": string,"title": string,"updated_at": string,"winner_rule": Database["public"]['Enums']["winner_rule"]
                  }
                  ComputedFields: never
                  Insert: {
                    "allow_change"?: boolean,"closes_at"?: string | null,"created_at"?: string,"created_by"?: string | null,"description"?: string,"eligibility"?: Database["public"]['Enums']["vote_eligibility"],"event_id"?: string | null,"feature_on_home"?: boolean,"format"?: Database["public"]['Enums']["vote_format"],"id"?: string,"is_anonymous"?: boolean,"member_kinds"?: (Database["public"]['Enums']["membership_kind"])[] | null,"opens_at"?: string | null,"phase"?: Database["public"]['Enums']["vote_phase"],"phase_changed_at"?: string | null,"resolution": string,"results_visibility"?: Database["public"]['Enums']["results_visibility"],"slug": string,"title": string,"updated_at"?: string,"winner_rule"?: Database["public"]['Enums']["winner_rule"]
                  }
                  Update: {
                    "allow_change"?: boolean,"closes_at"?: string | null,"created_at"?: string,"created_by"?: string | null,"description"?: string,"eligibility"?: Database["public"]['Enums']["vote_eligibility"],"event_id"?: string | null,"feature_on_home"?: boolean,"format"?: Database["public"]['Enums']["vote_format"],"id"?: string,"is_anonymous"?: boolean,"member_kinds"?: (Database["public"]['Enums']["membership_kind"])[] | null,"opens_at"?: string | null,"phase"?: Database["public"]['Enums']["vote_phase"],"phase_changed_at"?: string | null,"resolution"?: string,"results_visibility"?: Database["public"]['Enums']["results_visibility"],"slug"?: string,"title"?: string,"updated_at"?: string,"winner_rule"?: Database["public"]['Enums']["winner_rule"]
                  }
                  Relationships: [
                    {
      foreignKeyName: "votes_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "people"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "votes_event_id_fkey"
      columns: ["event_id"]
isOneToOne: false
      referencedRelation: "events"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "current_person_id":
{ Args: Record<PropertyKey, never>; Returns: string
                           },
"has_membership":
{ Args: { "kinds"?: (Database["public"]['Enums']["membership_kind"])[] }; Returns: boolean
                           },
"is_staff":
{ Args: { "min_role"?: Database["public"]['Enums']["staff_role"] }; Returns: boolean
                           },
"membership_is_current":
{ Args: { "m": Omit<Database["public"]['Tables']["memberships"]['Row'], Database["public"]['Tables']["memberships"]['ComputedFields']> }; Returns: boolean
                           },
"retire_graduates":
{ Args: Record<PropertyKey, never>; Returns: number
                           },
"upsert_contact":
{ Args: { "p_email": string,"p_first": string,"p_last": string,"p_opt_in"?: string,"p_source": string }; Returns: {
              "created": boolean,"person_id": string
            }[]
                           },
"vote_tally":
{ Args: { "p_vote": string }; Returns: {
              "ballots": number,"option_id": string,"round": number
            }[]
                           },
"vote_transitions":
{ Args: { "p_vote": string }; Returns: {
              "from_option": string,"to_option": string,"voters": number
            }[]
                           }
          }
          Enums: {
            "event_status": "draft"|"published"|"cancelled","event_visibility": "public"|"members"|"unlisted","membership_kind": "voting"|"associate"|"honorary","results_visibility": "live"|"after_round"|"after_close"|"admins_only","staff_role": "editor"|"admin","vote_eligibility": "anyone"|"signed_in"|"uaustin"|"members","vote_format": "single"|"pre_post","vote_phase": "draft"|"initial_open"|"initial_closed"|"final_open"|"closed","winner_rule": "plurality"|"swing"|"none"
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "public": {
          Enums: {
            "event_status": ["draft", "published", "cancelled"],"event_visibility": ["public", "members", "unlisted"],"membership_kind": ["voting", "associate", "honorary"],"results_visibility": ["live", "after_round", "after_close", "admins_only"],"staff_role": ["editor", "admin"],"vote_eligibility": ["anyone", "signed_in", "uaustin", "members"],"vote_format": ["single", "pre_post"],"vote_phase": ["draft", "initial_open", "initial_closed", "final_open", "closed"],"winner_rule": ["plurality", "swing", "none"]
          }
        }
} as const
