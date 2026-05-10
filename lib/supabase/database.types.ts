export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export type Database = {
    // Allows to automatically instantiate createClient with right options
    // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
    __InternalSupabase: {
        PostgrestVersion: "14.5"
    }
    public: {
        Tables: {
            board_application_events: {
                Row: {
                    actor_id: string | null
                    board_application_id: string
                    created_at: string
                    event_type: string
                    id: string
                    note: string | null
                }
                Insert: {
                    actor_id?: string | null
                    board_application_id: string
                    created_at?: string
                    event_type: string
                    id?: string
                    note?: string | null
                }
                Update: {
                    actor_id?: string | null
                    board_application_id?: string
                    created_at?: string
                    event_type?: string
                    id?: string
                    note?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "board_application_events_actor_id_fkey"
                        columns: ["actor_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "board_application_events_board_application_id_fkey"
                        columns: ["board_application_id"]
                        isOneToOne: false
                        referencedRelation: "board_applications"
                        referencedColumns: ["id"]
                    },
                ]
            }
            board_applications: {
                Row: {
                    applicant_id: string
                    board_id: string
                    board_slot_id: string | null
                    created_at: string
                    id: string
                    message: string
                    responded_at: string | null
                    selected_role: string
                    skill_match_score: number
                    status: string
                    team_id: string | null
                    updated_at: string
                }
                Insert: {
                    applicant_id: string
                    board_id: string
                    board_slot_id?: string | null
                    created_at?: string
                    id?: string
                    message: string
                    responded_at?: string | null
                    selected_role: string
                    skill_match_score?: number
                    status?: string
                    team_id?: string | null
                    updated_at?: string
                }
                Update: {
                    applicant_id?: string
                    board_id?: string
                    board_slot_id?: string | null
                    created_at?: string
                    id?: string
                    message?: string
                    responded_at?: string | null
                    selected_role?: string
                    skill_match_score?: number
                    status?: string
                    team_id?: string | null
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "board_applications_applicant_id_fkey"
                        columns: ["applicant_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "board_applications_board_id_fkey"
                        columns: ["board_id"]
                        isOneToOne: false
                        referencedRelation: "competition_idea_boards"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "board_applications_board_slot_id_fkey"
                        columns: ["board_slot_id"]
                        isOneToOne: false
                        referencedRelation: "board_slots"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "board_applications_team_id_fkey"
                        columns: ["team_id"]
                        isOneToOne: false
                        referencedRelation: "teams"
                        referencedColumns: ["id"]
                    },
                ]
            }
            board_drafts: {
                Row: {
                    competition_type: string | null
                    created_at: string
                    deadline: string | null
                    description: string | null
                    id: string
                    required_skills: string[]
                    slots: Json
                    summary: string | null
                    title: string | null
                    updated_at: string
                    user_id: string
                    visibility: string
                }
                Insert: {
                    competition_type?: string | null
                    created_at?: string
                    deadline?: string | null
                    description?: string | null
                    id?: string
                    required_skills?: string[]
                    slots?: Json
                    summary?: string | null
                    title?: string | null
                    updated_at?: string
                    user_id: string
                    visibility?: string
                }
                Update: {
                    competition_type?: string | null
                    created_at?: string
                    deadline?: string | null
                    description?: string | null
                    id?: string
                    required_skills?: string[]
                    slots?: Json
                    summary?: string | null
                    title?: string | null
                    updated_at?: string
                    user_id?: string
                    visibility?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "board_drafts_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: true
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                ]
            }
            board_slots: {
                Row: {
                    board_id: string
                    created_at: string
                    id: string
                    required_skills: string[]
                    role_name: string
                    slot_count: number
                    updated_at: string
                }
                Insert: {
                    board_id: string
                    created_at?: string
                    id?: string
                    required_skills?: string[]
                    role_name: string
                    slot_count?: number
                    updated_at?: string
                }
                Update: {
                    board_id?: string
                    created_at?: string
                    id?: string
                    required_skills?: string[]
                    role_name?: string
                    slot_count?: number
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "board_slots_board_id_fkey"
                        columns: ["board_id"]
                        isOneToOne: false
                        referencedRelation: "competition_idea_boards"
                        referencedColumns: ["id"]
                    },
                ]
            }
            candidate_saved_profiles: {
                Row: {
                    created_at: string
                    target_profile_id: string
                    user_id: string
                }
                Insert: {
                    created_at?: string
                    target_profile_id: string
                    user_id: string
                }
                Update: {
                    created_at?: string
                    target_profile_id?: string
                    user_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "candidate_saved_profiles_target_profile_id_fkey"
                        columns: ["target_profile_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "candidate_saved_profiles_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                ]
            }
            competition_history: {
                Row: {
                    best_result: string | null
                    competition_name: string
                    created_at: string
                    id: string
                    profile_id: string
                    role_name: string
                    team_id: string | null
                }
                Insert: {
                    best_result?: string | null
                    competition_name: string
                    created_at?: string
                    id?: string
                    profile_id: string
                    role_name: string
                    team_id?: string | null
                }
                Update: {
                    best_result?: string | null
                    competition_name?: string
                    created_at?: string
                    id?: string
                    profile_id?: string
                    role_name?: string
                    team_id?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "competition_history_profile_id_fkey"
                        columns: ["profile_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "competition_history_team_id_fkey"
                        columns: ["team_id"]
                        isOneToOne: false
                        referencedRelation: "teams"
                        referencedColumns: ["id"]
                    },
                ]
            }
            competition_idea_boards: {
                Row: {
                    closed_at: string | null
                    competition_type: string
                    created_at: string
                    deadline: string
                    description: string
                    id: string
                    is_draft: boolean
                    last_applicant_at: string | null
                    published_at: string | null
                    required_skills: string[]
                    status: string
                    summary: string | null
                    title: string
                    updated_at: string
                    user_id: string
                    visibility: string
                }
                Insert: {
                    closed_at?: string | null
                    competition_type: string
                    created_at?: string
                    deadline: string
                    description: string
                    id?: string
                    is_draft?: boolean
                    last_applicant_at?: string | null
                    published_at?: string | null
                    required_skills: string[]
                    status?: string
                    summary?: string | null
                    title: string
                    updated_at?: string
                    user_id: string
                    visibility?: string
                }
                Update: {
                    closed_at?: string | null
                    competition_type?: string
                    created_at?: string
                    deadline?: string
                    description?: string
                    id?: string
                    is_draft?: boolean
                    last_applicant_at?: string | null
                    published_at?: string | null
                    required_skills?: string[]
                    status?: string
                    summary?: string | null
                    title?: string
                    updated_at?: string
                    user_id?: string
                    visibility?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "competition_idea_boards_user_id_profiles_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                ]
            }
            competition_type_taxonomy: {
                Row: {
                    created_at: string
                    id: string
                    is_active: boolean
                    label: string
                    recommended_skills: string[]
                    slug: string
                    sort_order: number
                }
                Insert: {
                    created_at?: string
                    id?: string
                    is_active?: boolean
                    label: string
                    recommended_skills?: string[]
                    slug: string
                    sort_order?: number
                }
                Update: {
                    created_at?: string
                    id?: string
                    is_active?: boolean
                    label?: string
                    recommended_skills?: string[]
                    slug?: string
                    sort_order?: number
                }
                Relationships: []
            }
            join_request_events: {
                Row: {
                    actor_id: string | null
                    created_at: string
                    event_type: string
                    id: string
                    join_request_id: string
                    note: string | null
                }
                Insert: {
                    actor_id?: string | null
                    created_at?: string
                    event_type: string
                    id?: string
                    join_request_id: string
                    note?: string | null
                }
                Update: {
                    actor_id?: string | null
                    created_at?: string
                    event_type?: string
                    id?: string
                    join_request_id?: string
                    note?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "join_request_events_actor_id_fkey"
                        columns: ["actor_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "join_request_events_join_request_id_fkey"
                        columns: ["join_request_id"]
                        isOneToOne: false
                        referencedRelation: "join_requests"
                        referencedColumns: ["id"]
                    },
                ]
            }
            join_requests: {
                Row: {
                    board_id: string | null
                    created_at: string
                    id: string
                    message: string
                    rejection_locked: boolean
                    requester_id: string
                    responded_at: string | null
                    selected_role: string
                    status: string
                    target_profile_id: string
                    updated_at: string
                }
                Insert: {
                    board_id?: string | null
                    created_at?: string
                    id?: string
                    message: string
                    rejection_locked?: boolean
                    requester_id: string
                    responded_at?: string | null
                    selected_role: string
                    status?: string
                    target_profile_id: string
                    updated_at?: string
                }
                Update: {
                    board_id?: string | null
                    created_at?: string
                    id?: string
                    message?: string
                    rejection_locked?: boolean
                    requester_id?: string
                    responded_at?: string | null
                    selected_role?: string
                    status?: string
                    target_profile_id?: string
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "join_requests_board_id_fkey"
                        columns: ["board_id"]
                        isOneToOne: false
                        referencedRelation: "competition_idea_boards"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "join_requests_requester_id_fkey"
                        columns: ["requester_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "join_requests_target_profile_id_fkey"
                        columns: ["target_profile_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                ]
            }
            notification_preferences: {
                Row: {
                    board_updates: boolean
                    commitment_updates: boolean
                    created_at: string
                    reminder_updates: boolean
                    request_updates: boolean
                    updated_at: string
                    user_id: string
                }
                Insert: {
                    board_updates?: boolean
                    commitment_updates?: boolean
                    created_at?: string
                    reminder_updates?: boolean
                    request_updates?: boolean
                    updated_at?: string
                    user_id: string
                }
                Update: {
                    board_updates?: boolean
                    commitment_updates?: boolean
                    created_at?: string
                    reminder_updates?: boolean
                    request_updates?: boolean
                    updated_at?: string
                    user_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "notification_preferences_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: true
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                ]
            }
            privacy_audit_events: {
                Row: {
                    created_at: string
                    event_type: string
                    id: string
                    payload: Json
                    user_id: string
                }
                Insert: {
                    created_at?: string
                    event_type: string
                    id?: string
                    payload?: Json
                    user_id: string
                }
                Update: {
                    created_at?: string
                    event_type?: string
                    id?: string
                    payload?: Json
                    user_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "privacy_audit_events_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                ]
            }
            profile_availability: {
                Row: {
                    available_months: string[]
                    created_at: string
                    hours_per_week: number
                    profile_id: string
                    updated_at: string
                }
                Insert: {
                    available_months?: string[]
                    created_at?: string
                    hours_per_week?: number
                    profile_id: string
                    updated_at?: string
                }
                Update: {
                    available_months?: string[]
                    created_at?: string
                    hours_per_week?: number
                    profile_id?: string
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "profile_availability_profile_id_fkey"
                        columns: ["profile_id"]
                        isOneToOne: true
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                ]
            }
            profile_competition_preferences: {
                Row: {
                    competition_type_id: string
                    created_at: string
                    profile_id: string
                }
                Insert: {
                    competition_type_id: string
                    created_at?: string
                    profile_id: string
                }
                Update: {
                    competition_type_id?: string
                    created_at?: string
                    profile_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "profile_competition_preferences_competition_type_id_fkey"
                        columns: ["competition_type_id"]
                        isOneToOne: false
                        referencedRelation: "competition_type_taxonomy"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "profile_competition_preferences_profile_id_fkey"
                        columns: ["profile_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                ]
            }
            profile_custom_competition_type: {
                Row: {
                    created_at: string
                    id: string
                    label: string
                    normalized_label: string
                    profile_id: string
                }
                Insert: {
                    created_at?: string
                    id?: string
                    label: string
                    normalized_label: string
                    profile_id: string
                }
                Update: {
                    created_at?: string
                    id?: string
                    label?: string
                    normalized_label?: string
                    profile_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "profile_custom_competition_type_profile_id_fkey"
                        columns: ["profile_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                ]
            }
            profile_custom_skills: {
                Row: {
                    created_at: string
                    id: string
                    label: string
                    normalized_label: string
                    profile_id: string
                }
                Insert: {
                    created_at?: string
                    id?: string
                    label: string
                    normalized_label: string
                    profile_id: string
                }
                Update: {
                    created_at?: string
                    id?: string
                    label?: string
                    normalized_label?: string
                    profile_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "profile_custom_skills_profile_id_fkey"
                        columns: ["profile_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                ]
            }
            profile_skills: {
                Row: {
                    created_at: string
                    profile_id: string
                    skill_id: string
                }
                Insert: {
                    created_at?: string
                    profile_id: string
                    skill_id: string
                }
                Update: {
                    created_at?: string
                    profile_id?: string
                    skill_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "profile_skills_profile_id_fkey"
                        columns: ["profile_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "profile_skills_skill_id_fkey"
                        columns: ["skill_id"]
                        isOneToOne: false
                        referencedRelation: "skill_taxonomy"
                        referencedColumns: ["id"]
                    },
                ]
            }
            profile_testimonial_summaries: {
                Row: {
                    average_rating: number
                    best_result: string | null
                    competitions_count: number
                    profile_id: string
                    testimonial_count: number
                    updated_at: string
                }
                Insert: {
                    average_rating?: number
                    best_result?: string | null
                    competitions_count?: number
                    profile_id: string
                    testimonial_count?: number
                    updated_at?: string
                }
                Update: {
                    average_rating?: number
                    best_result?: string | null
                    competitions_count?: number
                    profile_id?: string
                    testimonial_count?: number
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "profile_testimonial_summaries_profile_id_fkey"
                        columns: ["profile_id"]
                        isOneToOne: true
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                ]
            }
            profiles: {
                Row: {
                    bio: string | null
                    campus_name: string | null
                    created_at: string
                    full_name: string | null
                    id: string
                    profile_completed_at: string | null
                    public_visibility: boolean
                    show_competition_history: boolean
                    updated_at: string
                    username: string | null
                    verification_status: string
                    verified_at: string | null
                }
                Insert: {
                    bio?: string | null
                    campus_name?: string | null
                    created_at?: string
                    full_name?: string | null
                    id: string
                    profile_completed_at?: string | null
                    public_visibility?: boolean
                    show_competition_history?: boolean
                    updated_at?: string
                    username?: string | null
                    verification_status?: string
                    verified_at?: string | null
                }
                Update: {
                    bio?: string | null
                    campus_name?: string | null
                    created_at?: string
                    full_name?: string | null
                    id?: string
                    profile_completed_at?: string | null
                    public_visibility?: boolean
                    show_competition_history?: boolean
                    updated_at?: string
                    username?: string | null
                    verification_status?: string
                    verified_at?: string | null
                }
                Relationships: []
            }
            skill_taxonomy: {
                Row: {
                    category: string
                    created_at: string
                    id: string
                    is_active: boolean
                    label: string
                    slug: string
                    sort_order: number
                }
                Insert: {
                    category: string
                    created_at?: string
                    id?: string
                    is_active?: boolean
                    label: string
                    slug: string
                    sort_order?: number
                }
                Update: {
                    category?: string
                    created_at?: string
                    id?: string
                    is_active?: boolean
                    label?: string
                    slug?: string
                    sort_order?: number
                }
                Relationships: []
            }
            team_activity_events: {
                Row: {
                    actor_id: string | null
                    created_at: string
                    event_type: string
                    id: string
                    payload: Json
                    team_id: string
                }
                Insert: {
                    actor_id?: string | null
                    created_at?: string
                    event_type: string
                    id?: string
                    payload?: Json
                    team_id: string
                }
                Update: {
                    actor_id?: string | null
                    created_at?: string
                    event_type?: string
                    id?: string
                    payload?: Json
                    team_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "team_activity_events_actor_id_fkey"
                        columns: ["actor_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "team_activity_events_team_id_fkey"
                        columns: ["team_id"]
                        isOneToOne: false
                        referencedRelation: "teams"
                        referencedColumns: ["id"]
                    },
                ]
            }
            team_commitments: {
                Row: {
                    confirmed_at: string | null
                    created_at: string
                    deadline_at: string
                    hours_per_week: number
                    id: string
                    last_reminded_at: string | null
                    team_member_id: string
                    updated_at: string
                }
                Insert: {
                    confirmed_at?: string | null
                    created_at?: string
                    deadline_at: string
                    hours_per_week: number
                    id?: string
                    last_reminded_at?: string | null
                    team_member_id: string
                    updated_at?: string
                }
                Update: {
                    confirmed_at?: string | null
                    created_at?: string
                    deadline_at?: string
                    hours_per_week?: number
                    id?: string
                    last_reminded_at?: string | null
                    team_member_id?: string
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "team_commitments_team_member_id_fkey"
                        columns: ["team_member_id"]
                        isOneToOne: true
                        referencedRelation: "team_members"
                        referencedColumns: ["id"]
                    },
                ]
            }
            team_members: {
                Row: {
                    confirmation_status: string
                    created_at: string
                    id: string
                    profile_id: string
                    role_name: string
                    team_id: string
                    updated_at: string
                }
                Insert: {
                    confirmation_status?: string
                    created_at?: string
                    id?: string
                    profile_id: string
                    role_name: string
                    team_id: string
                    updated_at?: string
                }
                Update: {
                    confirmation_status?: string
                    created_at?: string
                    id?: string
                    profile_id?: string
                    role_name?: string
                    team_id?: string
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "team_members_profile_id_fkey"
                        columns: ["profile_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "team_members_team_id_fkey"
                        columns: ["team_id"]
                        isOneToOne: false
                        referencedRelation: "teams"
                        referencedColumns: ["id"]
                    },
                ]
            }
            team_resources: {
                Row: {
                    created_at: string
                    id: string
                    label: string
                    resource_type: string
                    team_id: string
                    url: string | null
                }
                Insert: {
                    created_at?: string
                    id?: string
                    label: string
                    resource_type: string
                    team_id: string
                    url?: string | null
                }
                Update: {
                    created_at?: string
                    id?: string
                    label?: string
                    resource_type?: string
                    team_id?: string
                    url?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "team_resources_team_id_fkey"
                        columns: ["team_id"]
                        isOneToOne: false
                        referencedRelation: "teams"
                        referencedColumns: ["id"]
                    },
                ]
            }
            team_results: {
                Row: {
                    competition_ended_at: string
                    created_at: string
                    id: string
                    result_summary: string
                    team_id: string
                }
                Insert: {
                    competition_ended_at: string
                    created_at?: string
                    id?: string
                    result_summary: string
                    team_id: string
                }
                Update: {
                    competition_ended_at?: string
                    created_at?: string
                    id?: string
                    result_summary?: string
                    team_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "team_results_team_id_fkey"
                        columns: ["team_id"]
                        isOneToOne: false
                        referencedRelation: "teams"
                        referencedColumns: ["id"]
                    },
                ]
            }
            teams: {
                Row: {
                    board_id: string | null
                    competition_name: string | null
                    created_at: string
                    creator_id: string
                    deadline: string | null
                    id: string
                    name: string
                    updated_at: string
                }
                Insert: {
                    board_id?: string | null
                    competition_name?: string | null
                    created_at?: string
                    creator_id: string
                    deadline?: string | null
                    id?: string
                    name: string
                    updated_at?: string
                }
                Update: {
                    board_id?: string | null
                    competition_name?: string | null
                    created_at?: string
                    creator_id?: string
                    deadline?: string | null
                    id?: string
                    name?: string
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "teams_board_id_fkey"
                        columns: ["board_id"]
                        isOneToOne: false
                        referencedRelation: "competition_idea_boards"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "teams_creator_id_fkey"
                        columns: ["creator_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                ]
            }
            testimonial_edits: {
                Row: {
                    edited_at: string
                    id: string
                    previous_body: string
                    previous_rating: number
                    testimonial_id: string
                }
                Insert: {
                    edited_at?: string
                    id?: string
                    previous_body: string
                    previous_rating: number
                    testimonial_id: string
                }
                Update: {
                    edited_at?: string
                    id?: string
                    previous_body?: string
                    previous_rating?: number
                    testimonial_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "testimonial_edits_testimonial_id_fkey"
                        columns: ["testimonial_id"]
                        isOneToOne: false
                        referencedRelation: "testimonials"
                        referencedColumns: ["id"]
                    },
                ]
            }
            testimonials: {
                Row: {
                    author_id: string
                    body: string
                    created_at: string
                    id: string
                    locked_at: string | null
                    rating: number
                    target_profile_id: string
                    team_id: string
                    updated_at: string
                }
                Insert: {
                    author_id: string
                    body: string
                    created_at?: string
                    id?: string
                    locked_at?: string | null
                    rating: number
                    target_profile_id: string
                    team_id: string
                    updated_at?: string
                }
                Update: {
                    author_id?: string
                    body?: string
                    created_at?: string
                    id?: string
                    locked_at?: string | null
                    rating?: number
                    target_profile_id?: string
                    team_id?: string
                    updated_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "testimonials_author_id_fkey"
                        columns: ["author_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "testimonials_target_profile_id_fkey"
                        columns: ["target_profile_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "testimonials_team_id_fkey"
                        columns: ["team_id"]
                        isOneToOne: false
                        referencedRelation: "teams"
                        referencedColumns: ["id"]
                    },
                ]
            }
            user_notifications: {
                Row: {
                    body: string
                    category: string
                    created_at: string
                    id: string
                    is_read: boolean
                    link_path: string | null
                    title: string
                    user_id: string
                }
                Insert: {
                    body: string
                    category: string
                    created_at?: string
                    id?: string
                    is_read?: boolean
                    link_path?: string | null
                    title: string
                    user_id: string
                }
                Update: {
                    body?: string
                    category?: string
                    created_at?: string
                    id?: string
                    is_read?: boolean
                    link_path?: string | null
                    title?: string
                    user_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "user_notifications_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                ]
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            accept_board_application: {
                Args: { p_application_id: string }
                Returns: {
                    accepted_applicant_id: string
                    accepted_board_id: string
                    accepted_selected_role: string
                    accepted_team_created: boolean
                    accepted_team_id: string
                }[]
            }
            is_profile_teammate: {
                Args: { target_profile_id: string }
                Returns: boolean
            }
            is_team_creator: { Args: { target_team_id: string }; Returns: boolean }
            is_team_member: { Args: { target_team_id: string }; Returns: boolean }
            is_team_viewer: { Args: { target_team_id: string }; Returns: boolean }
            sync_legacy_team_data: {
                Args: { target_board_id: string }
                Returns: {
                    canonical_team_id: string
                    created_commitment_count: number
                    merged_team_count: number
                    processed_board_id: string
                    relinked_application_count: number
                    synced_member_count: number
                }[]
            }
        }
        Enums: {
            [_ in never]: never
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

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
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
}
    ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
            Row: infer R
        }
    ? R
    : never
    : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
}
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
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
}
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
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
}
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
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
}
    ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
    : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
    public: {
        Enums: {},
    },
} as const
