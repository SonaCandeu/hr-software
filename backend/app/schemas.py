from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field
from typing import List, Optional

# ------------------
# - RATING SCHEMAS -
# ------------------
class RatingBase(BaseModel):
    score: float = Field(..., ge=1.0, le=5.0, description="Score between 1.0 and 5.0")
    feedback: Optional[str] = None
    reviewer_name: str

class RatingCreate(RatingBase):
    pass

class RatingResponse(RatingBase):
    id: int
    created_at: datetime
    employee_id: int

    model_config = ConfigDict(from_attributes=True)


# --------------------
# - EMPLOYEE SCHEMAS -
# --------------------
class EmployeeBase(BaseModel):
    name: str
    email: str
    position: str

class EmployeeCreate(EmployeeBase):
    pass

class EmployeeResponse(EmployeeBase):
    id: int
    ratings: List[RatingResponse] = [] 

    model_config = ConfigDict(from_attributes=True)