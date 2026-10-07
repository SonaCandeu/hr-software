# backend/app/routers/ratings.py
from datetime import datetime, timedelta, timezone
from typing import List
from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy import desc, text
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import EmployeeModel, RatingModel
from app.schemas import RatingCreate, RatingResponse

router = APIRouter(prefix="/api/employees/{employee_id}/ratings", tags=["Ratings"])


def is_leader_above_employee(db: Session, leader_id: int, target_employee_id: int) -> bool:
    """
    Recursively checks if leader_id is a direct or indirect manager of target_employee_id
    using the leader_lead hierarchy table.
    """
    query = text("""
        WITH RECURSIVE org_chart AS (
            -- Base case: direct reports of the active leader
            SELECT leader_id, lead_id
            FROM leader_lead
            WHERE leader_id = :leader_id

            UNION ALL

            -- Recursive step: reports of those direct reports
            SELECT ll.leader_id, ll.lead_id
            FROM leader_lead ll
            INNER JOIN org_chart oc ON ll.leader_id = oc.lead_id
        )
        SELECT 1 
        FROM org_chart 
        WHERE lead_id = :target_employee_id
        LIMIT 1;
    """)

    result = db.execute(
        query, 
        {"leader_id": leader_id, "target_employee_id": target_employee_id}
    ).fetchone()

    return result is not None


@router.post("/", response_model=RatingResponse, status_code=status.HTTP_201_CREATED)
def add_rating_for_employee(
    employee_id: int, 
    payload: RatingCreate, 
    db: Session = Depends(get_db),
    x_reviewer_id: int = Header(..., alias="X-Reviewer-Id")
):
    """
    Submits a new rating for an employee with hierarchy validation and a 1-week cooldown.
    """
    # 1. Verify target employee exists
    target_employee = db.query(EmployeeModel).filter(EmployeeModel.id == employee_id).first()
    if not target_employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Employee not found."
        )

    # 2. Prevent self-rating
    if x_reviewer_id == employee_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="You cannot rate yourself."
        )

    # 3. Verify reviewer exists in the database
    reviewer = db.query(EmployeeModel).filter(EmployeeModel.id == x_reviewer_id).first()
    if not reviewer:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid reviewer ID provided in header."
        )

    # 4. Enforce reporting line hierarchy
    if not is_leader_above_employee(db, leader_id=x_reviewer_id, target_employee_id=employee_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permission denied: You can only rate employees within your reporting line."
        )

    # 5. Enforce 1-week (7-day) cooldown per leader-employee pair
    last_rating = (
        db.query(RatingModel)
        .filter(
            RatingModel.employee_id == employee_id,
            RatingModel.reviewer_name == reviewer.name
        )
        .order_by(RatingModel.created_at.desc())
        .first()
    )

    if last_rating and last_rating.created_at:
        now = datetime.now(timezone.utc)
        
        # Ensure timezone compatibility
        last_created = (
            last_rating.created_at.replace(tzinfo=timezone.utc)
            if last_rating.created_at.tzinfo is None
            else last_rating.created_at
        )
        
        cooldown_end = last_created + timedelta(days=7)
        if now < cooldown_end:
            days_left = (cooldown_end - now).days or 1
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Cooldown active: You must wait {days_left} more day(s) before rating {target_employee.name} again."
            )

    # 6. Save rating
    db_rating = RatingModel(
        score=payload.score,
        feedback=payload.feedback,
        reviewer_name=reviewer.name,
        employee_id=employee_id
    )
    
    db.add(db_rating)
    db.commit()
    db.refresh(db_rating)

    return db_rating


@router.get("/", response_model=List[RatingResponse])
def get_employee_ratings(employee_id: int, db: Session = Depends(get_db)):
    """Fetches all ratings received by a specific employee."""
    employee = db.query(EmployeeModel).filter(EmployeeModel.id == employee_id).first()
    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Employee not found."
        )

    return employee.ratings