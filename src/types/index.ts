export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  department?: string;
  role: 'USER' | 'CLUB_ADMIN' | 'ADMIN';
  profile_image?: string;
  is_active: boolean;
  created_at: string;
}

export interface Club {
  id: number;
  name: string;
  icon: string;
  icon_color: string;
  slogan: string;
  description?: string;
  category: string;
  poster_image?: string;
  target_age?: string;
  target_gender?: string;
  max_members?: number;
  schedule_text?: string;
  location?: string;
  fee_text?: string;
  instructor_info?: string;
  curriculum?: string;
  total_sessions?: number;
  external_link?: string;
  recruitment_status: 'OPEN' | 'CLOSED';
  approval_mode: 'CLUB_ADMIN' | 'AUTO';
  display_order: number;
  is_active: boolean;
  created_at: string;
  member_count?: number;
  newcomer_count?: number;
}

export interface ClubMember {
  id: number;
  club_id: number;
  user_id: number;
  role: 'MEMBER' | 'ADMIN';
  joined_at: string;
  user_name?: string;
  user_email?: string;
}

export interface ClubApplication {
  id: number;
  user_id: number;
  club_id: number;
  department?: string;
  phone?: string;
  purpose?: string;
  target_type?: 'FRIEND' | 'COLLEAGUE' | 'NEW_CONTACT' | 'OTHER';
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reviewed_by?: number;
  reviewed_at?: string;
  created_at: string;
  user_name?: string;
  club_name?: string;
}

export interface Newcomer {
  id: number;
  club_id: number;
  registered_by: number;
  assigned_to?: number;
  name: string;
  phone?: string;
  age_group?: string;
  gender?: string;
  introduction?: string;
  how_met?: string;
  status: 'ATTEMPT' | 'PRELIM' | 'GOSPEL' | 'WORSHIP' | 'COMPLETE' | 'LOST';
  prayer_request?: string;
  last_contact_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  club_name?: string;
  club_icon?: string;
  registered_by_name?: string;
  assigned_to_name?: string;
}

export interface ActivityLog {
  id: number;
  newcomer_id: number;
  author_id: number;
  content: string;
  activity_type: 'ATTEMPT' | 'PRELIM' | 'GOSPEL' | 'WORSHIP' | 'COMPLETE';
  created_at: string;
  author_name?: string;
}

export interface Post {
  id: number;
  board_type: string;
  club_id?: number;
  author_id: number;
  title: string;
  content?: string;
  file_path?: string;
  file_name?: string;
  resource_category?: string;
  view_count: number;
  created_at: string;
  author_name?: string;
  comment_count?: number;
  like_count?: number;
  is_liked?: boolean;
}

export interface Comment {
  id: number;
  post_id: number;
  parent_id?: number;
  author_id: number;
  content: string;
  created_at: string;
  author_name?: string;
  like_count?: number;
  is_liked?: boolean;
  replies?: Comment[];
}

export interface ChatMessage {
  id: number;
  club_id: number;
  user_id: number;
  content?: string;
  image_path?: string;
  is_pinned: boolean;
  created_at: string;
  user_name?: string;
}

export interface MissionAppointment {
  id: number;
  appointment_type: 'STREET' | 'PROMOTION';
  title: string;
  description?: string;
  appointment_date: string;
  start_time?: string;
  location?: string;
  created_by: number;
  participants?: string;
  created_at: string;
  creator_name?: string;
}

export interface MissionLog {
  id: number;
  user_id: number;
  log_type: 'STREET' | 'PROMOTION';
  appointment_id?: number;
  content: string;
  location?: string;
  result_summary?: string;
  attempt_count: number;
  images?: string;
  created_at: string;
  user_name?: string;
  like_count?: number;
}

export interface Notification {
  id: number;
  user_id: number;
  type: string;
  title: string;
  message?: string;
  link?: string;
  is_read: boolean;
  created_at: string;
}

export interface PipelineData {
  ATTEMPT: number;
  PRELIM: number;
  GOSPEL: number;
  WORSHIP: number;
  COMPLETE: number;
  LOST: number;
}
