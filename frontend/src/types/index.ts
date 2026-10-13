export interface User {
  id: number;
  email: string;
  username: string;
  is_active: boolean;
  is_superuser: boolean;
  is_verified: boolean;
}

export interface Comment {
  id: number;
  text: string;
  pub_date: string;
  author: User; 
}

export interface Post {
  id: number;
  text: string; 
  pub_date: string;
  image: string | null;
  author: User; 
  author_id: number;
  group_id: number | null;
  comments?: Comment[]; 
}
