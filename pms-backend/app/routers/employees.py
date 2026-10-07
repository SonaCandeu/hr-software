from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List

from app.database import get_db
from app.models import EmployeeModel
from app.schemas import EmployeeCreate, EmployeeResponse

router = APIRouter(prefix="/api/employees", tags=["Employees"])

@router.get("/{leader_id}/subordinates", response_model=List[int])
def get_subordinate_ids(leader_id: int, db: Session = Depends(get_db)):
    """Returns a list of all employee IDs managed directly or indirectly by leader_id."""
    query = text("""
        WITH RECURSIVE org_chart AS (
            SELECT leader_id, lead_id
            FROM leader_lead
            WHERE leader_id = :leader_id

            UNION ALL

            SELECT ll.leader_id, ll.lead_id
            FROM leader_lead ll
            INNER JOIN org_chart oc ON ll.leader_id = oc.lead_id
        )
        SELECT DISTINCT lead_id FROM org_chart;
    """)
    result = db.execute(query, {"leader_id": leader_id}).fetchall()
    return [row[0] for row in result]

@router.get("/", response_model=List[EmployeeResponse])
def get_employees(db: Session = Depends(get_db)):
    query = db.query(EmployeeModel)
    return query.all()

@router.post("/", response_model=EmployeeResponse, status_code=status.HTTP_201_CREATED)
def create_employee(payload: EmployeeCreate, db: Session = Depends(get_db)):
    db_employee = EmployeeModel(**payload.model_dump())
    
    db.add(db_employee)
    db.commit()
    db.refresh(db_employee)
    
    return db_employee

@router.get("/{employee_id}", response_model=EmployeeResponse)
def get_employee(employee_id: int, db: Session = Depends(get_db)):
    db_employee = db.query(EmployeeModel).filter(EmployeeModel.id == employee_id).first()
    if not db_employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    return db_employee