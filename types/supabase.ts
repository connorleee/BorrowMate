export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            users: {
                Row: {
                    id: string
                    name: string
                    email: string
                    phone: string | null
                    created_at: string
                }
                Insert: {
                    id: string
                    name: string
                    email: string
                    phone?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    email?: string
                    phone?: string | null
                    created_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "users_id_fkey"
                        columns: ["id"]
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    }
                ]
            }
            groups: {
                Row: {
                    id: string
                    name: string
                    description: string | null
                    created_by: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    description?: string | null
                    created_by: string
                    created_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    description?: string | null
                    created_by?: string
                    created_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "groups_created_by_fkey"
                        columns: ["created_by"]
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    }
                ]
            }
            group_memberships: {
                Row: {
                    id: string
                    user_id: string
                    group_id: string
                    role: "owner" | "member"
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    group_id: string
                    role?: "owner" | "member"
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    group_id?: string
                    role?: "owner" | "member"
                    created_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "group_memberships_group_id_fkey"
                        columns: ["group_id"]
                        referencedRelation: "groups"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "group_memberships_user_id_fkey"
                        columns: ["user_id"]
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    }
                ]
            }
            items: {
                Row: {
                    id: string
                    group_id: string
                    name: string
                    description: string | null
                    category: string | null
                    owner_user_id: string | null
                    visibility: "shared" | "personal"
                    status: "available" | "unavailable"
                    price_usd: number | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    group_id: string
                    name: string
                    description?: string | null
                    category?: string | null
                    owner_user_id?: string | null
                    visibility?: "shared" | "personal"
                    status?: "available" | "unavailable"
                    price_usd?: number | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    group_id?: string
                    name?: string
                    description?: string | null
                    category?: string | null
                    owner_user_id?: string | null
                    visibility?: "shared" | "personal"
                    status?: "available" | "unavailable"
                    price_usd?: number | null
                    created_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "items_group_id_fkey"
                        columns: ["group_id"]
                        referencedRelation: "groups"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "items_owner_user_id_fkey"
                        columns: ["owner_user_id"]
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    }
                ]
            }
            borrow_records: {
                Row: {
                    id: string
                    item_id: string
                    group_id: string
                    lender_user_id: string
                    borrower_user_id: string | null
                    borrower_name: string | null
                    start_date: string
                    due_date: string | null
                    returned_at: string | null
                    status: "borrowed" | "returned" | "overdue"
                    created_at: string
                }
                Insert: {
                    id?: string
                    item_id: string
                    group_id: string
                    lender_user_id: string
                    borrower_user_id?: string | null
                    borrower_name?: string | null
                    start_date: string
                    due_date?: string | null
                    returned_at?: string | null
                    status?: "borrowed" | "returned" | "overdue"
                    created_at?: string
                }
                Update: {
                    id?: string
                    item_id?: string
                    group_id?: string
                    lender_user_id?: string
                    borrower_user_id?: string | null
                    borrower_name?: string | null
                    start_date?: string
                    due_date?: string | null
                    returned_at?: string | null
                    status?: "borrowed" | "returned" | "overdue"
                    created_at?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "borrow_records_group_id_fkey"
                        columns: ["group_id"]
                        referencedRelation: "groups"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "borrow_records_item_id_fkey"
                        columns: ["item_id"]
                        referencedRelation: "items"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "borrow_records_lender_user_id_fkey"
                        columns: ["lender_user_id"]
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "borrow_records_borrower_user_id_fkey"
                        columns: ["borrower_user_id"]
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    }
                ]
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            [_ in never]: never
        }
        Enums: {
            membership_role: "owner" | "member"
            item_visibility: "shared" | "personal"
            item_status: "available" | "unavailable"
            borrow_status: "borrowed" | "returned" | "overdue"
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
}
