export interface AuthResponse {
    user: {
      id: string;
      email: string;
    };
    token: string;
    refresh_token?: string;  // Keep this for session management
  }
  
  export interface LoginCredentials {
    email: string;
    password: string;
  }
  
  export interface UserRegistration extends LoginCredentials {
    username?: string;
    first_name?: string;
    last_name?: string;
  }