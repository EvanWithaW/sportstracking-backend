export interface User {
    id?: string;
    email: string;
    username?: string;
    first_name?: string;
    last_name?: string;
    created_at?: Date;
    profile_picture_url?: string;
  }
  
  export interface UserCredentials {
    email: string;
    password: string;
  }
  
  export interface UserRegistration extends UserCredentials {
    username?: string;
    first_name?: string;
    last_name?: string;
  }