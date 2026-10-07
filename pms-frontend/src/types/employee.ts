export interface Rating {
  id: number;
  score: number;
  feedback?: string;
  reviewer_name: string;
  created_at: string;
  employee_id: number;
}

export interface Employee {
  id: number;
  name: string;
  position: string;
  ratings: Rating[];
}

export interface RatingCreate {
  score: number;
  feedback?: string;
  reviewer_name: string;
}