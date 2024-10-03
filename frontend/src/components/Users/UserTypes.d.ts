export type SafeUser = {
    email: string;
    full_name: string;
    id: number;
};

export type User = {
    display_name: string;
    division: number;
    email: string;
    first_name: string;
    full_name: string;
    hhs_id?: number;
    id: number;
    last_name: string;
    oidc_id: string;
    roles: UserRoles[];
    status: UserStatus;
    created_by?: number;
    created_on: Date;
    updated_by?: number;
    updated_on: Date;
};

type UserRoles = "USER_ADMIN" | "BUDGET_TEAM" | "admin" | "division-director" | "user" | "unassigned";
type UserStatus = "ACTIVE" | "INACTIVE" | "LOCKED";
