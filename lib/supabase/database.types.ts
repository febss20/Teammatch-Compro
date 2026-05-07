export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type Table<Row, Insert, Update> = {
    Row: Row;
    Insert: Insert;
    Update: Update;
    Relationships: [];
};

export interface Database {
    public: {
        Tables: {
            profiles: Table<
                {
                    id: string;
                    full_name: string | null;
                    campus_name: string | null;
                    username: string | null;
                    bio: string | null;
                    public_visibility: boolean;
                    show_competition_history: boolean;
                    profile_completed_at: string | null;
                    verification_status: string;
                    verified_at: string | null;
                    created_at: string;
                    updated_at: string;
                },
                {
                    id: string;
                    full_name?: string | null;
                    campus_name?: string | null;
                    username?: string | null;
                    bio?: string | null;
                    public_visibility?: boolean;
                    show_competition_history?: boolean;
                    profile_completed_at?: string | null;
                    verification_status?: string;
                    verified_at?: string | null;
                    created_at?: string;
                    updated_at?: string;
                },
                {
                    id?: string;
                    full_name?: string | null;
                    campus_name?: string | null;
                    username?: string | null;
                    bio?: string | null;
                    public_visibility?: boolean;
                    show_competition_history?: boolean;
                    profile_completed_at?: string | null;
                    verification_status?: string;
                    verified_at?: string | null;
                    created_at?: string;
                    updated_at?: string;
                }
            >;
            skill_taxonomy: Table<
                {
                    id: string;
                    slug: string;
                    label: string;
                    category: string;
                    is_active: boolean;
                    sort_order: number;
                    created_at: string;
                },
                {
                    id?: string;
                    slug: string;
                    label: string;
                    category: string;
                    is_active?: boolean;
                    sort_order?: number;
                    created_at?: string;
                },
                {
                    id?: string;
                    slug?: string;
                    label?: string;
                    category?: string;
                    is_active?: boolean;
                    sort_order?: number;
                    created_at?: string;
                }
            >;
            competition_type_taxonomy: Table<
                {
                    id: string;
                    slug: string;
                    label: string;
                    recommended_skills: string[];
                    is_active: boolean;
                    sort_order: number;
                    created_at: string;
                },
                {
                    id?: string;
                    slug: string;
                    label: string;
                    recommended_skills?: string[];
                    is_active?: boolean;
                    sort_order?: number;
                    created_at?: string;
                },
                {
                    id?: string;
                    slug?: string;
                    label?: string;
                    recommended_skills?: string[];
                    is_active?: boolean;
                    sort_order?: number;
                    created_at?: string;
                }
            >;
            profile_skills: Table<
                {
                    profile_id: string;
                    skill_id: string;
                    created_at: string;
                },
                {
                    profile_id: string;
                    skill_id: string;
                    created_at?: string;
                },
                {
                    profile_id?: string;
                    skill_id?: string;
                    created_at?: string;
                }
            >;
            profile_competition_preferences: Table<
                {
                    profile_id: string;
                    competition_type_id: string;
                    created_at: string;
                },
                {
                    profile_id: string;
                    competition_type_id: string;
                    created_at?: string;
                },
                {
                    profile_id?: string;
                    competition_type_id?: string;
                    created_at?: string;
                }
            >;
            profile_availability: Table<
                {
                    profile_id: string;
                    available_months: string[];
                    hours_per_week: number;
                    created_at: string;
                    updated_at: string;
                },
                {
                    profile_id: string;
                    available_months: string[];
                    hours_per_week: number;
                    created_at?: string;
                    updated_at?: string;
                },
                {
                    profile_id?: string;
                    available_months?: string[];
                    hours_per_week?: number;
                    created_at?: string;
                    updated_at?: string;
                }
            >;
            profile_testimonial_summaries: Table<
                {
                    profile_id: string;
                    average_rating: number;
                    testimonial_count: number;
                    best_result: string | null;
                    competitions_count: number;
                    updated_at: string;
                },
                {
                    profile_id: string;
                    average_rating?: number;
                    testimonial_count?: number;
                    best_result?: string | null;
                    competitions_count?: number;
                    updated_at?: string;
                },
                {
                    profile_id?: string;
                    average_rating?: number;
                    testimonial_count?: number;
                    best_result?: string | null;
                    competitions_count?: number;
                    updated_at?: string;
                }
            >;
            candidate_saved_profiles: Table<
                {
                    user_id: string;
                    target_profile_id: string;
                    created_at: string;
                },
                {
                    user_id: string;
                    target_profile_id: string;
                    created_at?: string;
                },
                {
                    user_id?: string;
                    target_profile_id?: string;
                    created_at?: string;
                }
            >;
            competition_idea_boards: Table<
                {
                    id: string;
                    user_id: string;
                    title: string;
                    competition_type: string;
                    summary: string | null;
                    description: string;
                    deadline: string;
                    required_skills: string[];
                    status: string;
                    visibility: string;
                    is_draft: boolean;
                    published_at: string | null;
                    closed_at: string | null;
                    last_applicant_at: string | null;
                    created_at: string;
                    updated_at: string;
                },
                {
                    id?: string;
                    user_id: string;
                    title: string;
                    competition_type: string;
                    summary?: string | null;
                    description: string;
                    deadline: string;
                    required_skills: string[];
                    status?: string;
                    visibility?: string;
                    is_draft?: boolean;
                    published_at?: string | null;
                    closed_at?: string | null;
                    last_applicant_at?: string | null;
                    created_at?: string;
                    updated_at?: string;
                },
                {
                    id?: string;
                    user_id?: string;
                    title?: string;
                    competition_type?: string;
                    summary?: string | null;
                    description?: string;
                    deadline?: string;
                    required_skills?: string[];
                    status?: string;
                    visibility?: string;
                    is_draft?: boolean;
                    published_at?: string | null;
                    closed_at?: string | null;
                    last_applicant_at?: string | null;
                    created_at?: string;
                    updated_at?: string;
                }
            >;
            board_slots: Table<
                {
                    id: string;
                    board_id: string;
                    role_name: string;
                    slot_count: number;
                    required_skills: string[];
                    created_at: string;
                    updated_at: string;
                },
                {
                    id?: string;
                    board_id: string;
                    role_name: string;
                    slot_count?: number;
                    required_skills?: string[];
                    created_at?: string;
                    updated_at?: string;
                },
                {
                    id?: string;
                    board_id?: string;
                    role_name?: string;
                    slot_count?: number;
                    required_skills?: string[];
                    created_at?: string;
                    updated_at?: string;
                }
            >;
            board_drafts: Table<
                {
                    id: string;
                    user_id: string;
                    title: string | null;
                    summary: string | null;
                    competition_type: string | null;
                    description: string | null;
                    deadline: string | null;
                    required_skills: string[];
                    visibility: string;
                    slots: Json;
                    updated_at: string;
                    created_at: string;
                },
                {
                    id?: string;
                    user_id: string;
                    title?: string | null;
                    summary?: string | null;
                    competition_type?: string | null;
                    description?: string | null;
                    deadline?: string | null;
                    required_skills?: string[];
                    visibility?: string;
                    slots?: Json;
                    updated_at?: string;
                    created_at?: string;
                },
                {
                    id?: string;
                    user_id?: string;
                    title?: string | null;
                    summary?: string | null;
                    competition_type?: string | null;
                    description?: string | null;
                    deadline?: string | null;
                    required_skills?: string[];
                    visibility?: string;
                    slots?: Json;
                    updated_at?: string;
                    created_at?: string;
                }
            >;
            join_requests: Table<
                {
                    id: string;
                    requester_id: string;
                    target_profile_id: string;
                    board_id: string | null;
                    selected_role: string;
                    message: string;
                    status: string;
                    rejection_locked: boolean;
                    created_at: string;
                    updated_at: string;
                    responded_at: string | null;
                },
                {
                    id?: string;
                    requester_id: string;
                    target_profile_id: string;
                    board_id?: string | null;
                    selected_role: string;
                    message: string;
                    status?: string;
                    rejection_locked?: boolean;
                    created_at?: string;
                    updated_at?: string;
                    responded_at?: string | null;
                },
                {
                    id?: string;
                    requester_id?: string;
                    target_profile_id?: string;
                    board_id?: string | null;
                    selected_role?: string;
                    message?: string;
                    status?: string;
                    rejection_locked?: boolean;
                    created_at?: string;
                    updated_at?: string;
                    responded_at?: string | null;
                }
            >;
            join_request_events: Table<
                {
                    id: string;
                    join_request_id: string;
                    actor_id: string | null;
                    event_type: string;
                    note: string | null;
                    created_at: string;
                },
                {
                    id?: string;
                    join_request_id: string;
                    actor_id?: string | null;
                    event_type: string;
                    note?: string | null;
                    created_at?: string;
                },
                {
                    id?: string;
                    join_request_id?: string;
                    actor_id?: string | null;
                    event_type?: string;
                    note?: string | null;
                    created_at?: string;
                }
            >;
            board_applications: Table<
                {
                    id: string;
                    board_id: string;
                    applicant_id: string;
                    board_slot_id: string | null;
                    selected_role: string;
                    message: string;
                    status: string;
                    skill_match_score: number;
                    created_at: string;
                    updated_at: string;
                    responded_at: string | null;
                },
                {
                    id?: string;
                    board_id: string;
                    applicant_id: string;
                    board_slot_id?: string | null;
                    selected_role: string;
                    message: string;
                    status?: string;
                    skill_match_score?: number;
                    created_at?: string;
                    updated_at?: string;
                    responded_at?: string | null;
                },
                {
                    id?: string;
                    board_id?: string;
                    applicant_id?: string;
                    board_slot_id?: string | null;
                    selected_role?: string;
                    message?: string;
                    status?: string;
                    skill_match_score?: number;
                    created_at?: string;
                    updated_at?: string;
                    responded_at?: string | null;
                }
            >;
            board_application_events: Table<
                {
                    id: string;
                    board_application_id: string;
                    actor_id: string | null;
                    event_type: string;
                    note: string | null;
                    created_at: string;
                },
                {
                    id?: string;
                    board_application_id: string;
                    actor_id?: string | null;
                    event_type: string;
                    note?: string | null;
                    created_at?: string;
                },
                {
                    id?: string;
                    board_application_id?: string;
                    actor_id?: string | null;
                    event_type?: string;
                    note?: string | null;
                    created_at?: string;
                }
            >;
            teams: Table<
                {
                    id: string;
                    board_id: string | null;
                    creator_id: string;
                    name: string;
                    competition_name: string | null;
                    deadline: string | null;
                    created_at: string;
                    updated_at: string;
                },
                {
                    id?: string;
                    board_id?: string | null;
                    creator_id: string;
                    name: string;
                    competition_name?: string | null;
                    deadline?: string | null;
                    created_at?: string;
                    updated_at?: string;
                },
                {
                    id?: string;
                    board_id?: string | null;
                    creator_id?: string;
                    name?: string;
                    competition_name?: string | null;
                    deadline?: string | null;
                    created_at?: string;
                    updated_at?: string;
                }
            >;
            team_members: Table<
                {
                    id: string;
                    team_id: string;
                    profile_id: string;
                    role_name: string;
                    confirmation_status: string;
                    created_at: string;
                    updated_at: string;
                },
                {
                    id?: string;
                    team_id: string;
                    profile_id: string;
                    role_name: string;
                    confirmation_status?: string;
                    created_at?: string;
                    updated_at?: string;
                },
                {
                    id?: string;
                    team_id?: string;
                    profile_id?: string;
                    role_name?: string;
                    confirmation_status?: string;
                    created_at?: string;
                    updated_at?: string;
                }
            >;
            team_commitments: Table<
                {
                    id: string;
                    team_member_id: string;
                    hours_per_week: number;
                    deadline_at: string;
                    confirmed_at: string | null;
                    last_reminded_at: string | null;
                    created_at: string;
                    updated_at: string;
                },
                {
                    id?: string;
                    team_member_id: string;
                    hours_per_week: number;
                    deadline_at: string;
                    confirmed_at?: string | null;
                    last_reminded_at?: string | null;
                    created_at?: string;
                    updated_at?: string;
                },
                {
                    id?: string;
                    team_member_id?: string;
                    hours_per_week?: number;
                    deadline_at?: string;
                    confirmed_at?: string | null;
                    last_reminded_at?: string | null;
                    created_at?: string;
                    updated_at?: string;
                }
            >;
            competition_history: Table<
                {
                    id: string;
                    profile_id: string;
                    competition_name: string;
                    role_name: string;
                    best_result: string | null;
                    team_id: string | null;
                    created_at: string;
                },
                {
                    id?: string;
                    profile_id: string;
                    competition_name: string;
                    role_name: string;
                    best_result?: string | null;
                    team_id?: string | null;
                    created_at?: string;
                },
                {
                    id?: string;
                    profile_id?: string;
                    competition_name?: string;
                    role_name?: string;
                    best_result?: string | null;
                    team_id?: string | null;
                    created_at?: string;
                }
            >;
            team_results: Table<
                {
                    id: string;
                    team_id: string;
                    result_summary: string;
                    competition_ended_at: string;
                    created_at: string;
                },
                {
                    id?: string;
                    team_id: string;
                    result_summary: string;
                    competition_ended_at: string;
                    created_at?: string;
                },
                {
                    id?: string;
                    team_id?: string;
                    result_summary?: string;
                    competition_ended_at?: string;
                    created_at?: string;
                }
            >;
            testimonials: Table<
                {
                    id: string;
                    team_id: string;
                    author_id: string;
                    target_profile_id: string;
                    rating: number;
                    body: string;
                    locked_at: string | null;
                    created_at: string;
                    updated_at: string;
                },
                {
                    id?: string;
                    team_id: string;
                    author_id: string;
                    target_profile_id: string;
                    rating: number;
                    body: string;
                    locked_at?: string | null;
                    created_at?: string;
                    updated_at?: string;
                },
                {
                    id?: string;
                    team_id?: string;
                    author_id?: string;
                    target_profile_id?: string;
                    rating?: number;
                    body?: string;
                    locked_at?: string | null;
                    created_at?: string;
                    updated_at?: string;
                }
            >;
            testimonial_edits: Table<
                {
                    id: string;
                    testimonial_id: string;
                    previous_body: string;
                    previous_rating: number;
                    edited_at: string;
                },
                {
                    id?: string;
                    testimonial_id: string;
                    previous_body: string;
                    previous_rating: number;
                    edited_at?: string;
                },
                {
                    id?: string;
                    testimonial_id?: string;
                    previous_body?: string;
                    previous_rating?: number;
                    edited_at?: string;
                }
            >;
            notification_preferences: Table<
                {
                    user_id: string;
                    request_updates: boolean;
                    board_updates: boolean;
                    commitment_updates: boolean;
                    reminder_updates: boolean;
                    created_at: string;
                    updated_at: string;
                },
                {
                    user_id: string;
                    request_updates?: boolean;
                    board_updates?: boolean;
                    commitment_updates?: boolean;
                    reminder_updates?: boolean;
                    created_at?: string;
                    updated_at?: string;
                },
                {
                    user_id?: string;
                    request_updates?: boolean;
                    board_updates?: boolean;
                    commitment_updates?: boolean;
                    reminder_updates?: boolean;
                    created_at?: string;
                    updated_at?: string;
                }
            >;
            user_notifications: Table<
                {
                    id: string;
                    user_id: string;
                    category: string;
                    title: string;
                    body: string;
                    link_path: string | null;
                    is_read: boolean;
                    created_at: string;
                },
                {
                    id?: string;
                    user_id: string;
                    category: string;
                    title: string;
                    body: string;
                    link_path?: string | null;
                    is_read?: boolean;
                    created_at?: string;
                },
                {
                    id?: string;
                    user_id?: string;
                    category?: string;
                    title?: string;
                    body?: string;
                    link_path?: string | null;
                    is_read?: boolean;
                    created_at?: string;
                }
            >;
        };
        Views: Record<string, never>;
        Functions: Record<string, never>;
        Enums: Record<string, never>;
        CompositeTypes: Record<string, never>;
    };
}
