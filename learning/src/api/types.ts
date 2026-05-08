// ## API 类型定义（学员端 TypeScript 接口）

export interface User {
  id: string
  username?: string
  phone?: string
  display_name?: string
  department?: string
  role: 'superadmin' | 'admin' | 'trainee'
}

export interface Notification {
  id: number
  title: string
  content: string
  notification_type: string
  is_read: boolean
  created_at: string
  task_id?: number
}

export interface Task {
  id: string
  title: string
  description?: string
  type?: 'qa' | 'roleplay'
  task_type?: 'qa' | 'roleplay'
  status: 'draft' | 'active' | 'archived'
  config: Record<string, any>
  material_ids?: string[]
  bank_ids?: string[]
  persona_ids?: string[]
  created_at: string
  start_at?: string
  end_at?: string
}

export interface TaskAssignment {
  id: number
  task_id: string
  user_id: string
  status: 'assigned' | 'started' | 'completed'
  task: Task
}

export interface FileItem {
  id: string
  original_name: string
  file_type: string
  size_bytes: number
  file_size: number
  storage_key: string
  created_at: string
}

export interface Persona {
  id: string
  name: string
  gender?: string
  age?: number
  industry?: string
  position?: string
  persona_card?: Record<string, string>
  is_active: boolean
}

export interface Question {
  id: string
  question_id?: string
  question_text: string
  max_score: number
  order: number
}

export interface SubmissionAnswer {
  question_id: string
  question_order: number
  score: number
  max_score: number
  feedback?: string
  reference_answer?: string
  transcribed_text?: string
  partial_scores?: Array<{ point: string; hit: boolean; score: number; max: number }>
}

export interface QaSession {
  submission_id: string
  mode: string
  questions: Question[]
}

export interface QaResult {
  submission_id: string
  score: number
  max_score: number
  answers: SubmissionAnswer[]
}

export interface RoleplayResult {
  id: string
  submission_id: string
  turns: Array<{ turn_id: string; role: 'user' | 'ai'; text: string; timestamp: string }>
  final_evaluation: {
    score: number
    max_score: number
    dimensions: Array<{ name: string; score: number; max: number }>
    summary: string
    strengths: string[]
    improvements: string[]
  }
  total_turns: number
  completed_at?: string
}
