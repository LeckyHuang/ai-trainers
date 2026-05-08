// ## API 类型定义（管理端 TypeScript 接口）

export interface User {
  id: string
  phone?: string
  username: string
  role: 'superadmin' | 'admin' | 'learner'
  display_name?: string
  is_active: boolean
  created_at: string
}

export interface FileItem {
  id: string
  original_name: string
  mime_type?: string
  size_bytes?: number
  file_type?: string
  storage_key: string
  created_at: string
}

// alias kept for backward compat with any imports using 'File'
export type File = FileItem

export interface QuestionBank {
  id: string
  name: string
  description?: string
  source?: string
  question_count?: number
  created_at: string
}

export interface ScorePoint {
  keyword: string
  weight: number
  match_type: 'exact' | 'semantic' | 'keyword'
}

export interface Question {
  id: string
  bank_id: string
  question_text: string
  answer_text: string
  score_points?: ScorePoint[]
  max_score?: number
  difficulty?: string
  is_active?: boolean
  created_at: string
}

export interface Persona {
  id: string
  name: string
  gender?: string
  age?: number
  industry?: string
  position?: string
  experience_years?: number
  big_five?: Record<string, number>
  background?: any
  persona_card?: any
  is_active: boolean
  created_at: string
}

export interface Task {
  id: string
  title: string
  description?: string
  type: 'qa' | 'roleplay'
  status: 'draft' | 'active' | 'archived'
  config?: Record<string, any>
  start_at?: string
  end_at?: string
  material_ids?: string[]
  bank_ids?: string[]
  persona_ids?: string[]
  assigned_user_ids?: string[]
  created_at: string
}

export interface TaskAssignment {
  id: string
  user_id: string
  task_id: string
  status: 'not_started' | 'in_progress' | 'completed' | 'expired'
  score?: number
  started_at?: string
  completed_at?: string
  user?: User
}

export interface Notification {
  id: string
  type?: string
  title: string
  body?: string
  is_read: boolean
  created_at: string
}

export interface QaSession {
  id: string
  questions: Question[]
}

export interface SubmissionAnswer {
  question_id: string
  score: number
  max_score: number
  transcribed_text?: string
  feedback?: string
  reference_answer?: string
}

export interface PagedResponse<T> {
  total: number
  items: T[]
}
