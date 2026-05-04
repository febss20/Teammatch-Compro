export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string;
                    full_name: string | null;
                    campus_name: string | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id: string;
                    full_name?: string | null;
                    campus_name?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    full_name?: string | null;
                    campus_name?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Relationships: [];
            };
            competition_idea_boards: {
                Row: {
                    id: string;
                    user_id: string;
                    title: string;
                    competition_type: string;
                    description: string;
                    deadline: string;
                    required_skills: string[];
                    status: string;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    user_id: string;
                    title: string;
                    competition_type: string;
                    description: string;
                    deadline: string;
                    required_skills: string[];
                    status?: string;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    user_id?: string;
                    title?: string;
                    competition_type?: string;
                    description?: string;
                    deadline?: string;
                    required_skills?: string[];
                    status?: string;
                    created_at?: string;
                    updated_at?: string;
                };
                Relationships: [];
            };
        };
        Views: Record<string, never>;
        Functions: Record<string, never>;
        Enums: Record<string, never>;
        CompositeTypes: Record<string, never>;
    };
}
