from datetime import datetime, timezone
from sqlalchemy import String, Float, Integer, ForeignKey, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import List, Optional
from app.database import Base

class EmployeeModel(Base):
    __tablename__ = "employee"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    email: Mapped[str] = mapped_column(String(50), nullable=False)
    position: Mapped[str] = mapped_column(String(50), nullable=False)

    ratings: Mapped[List["RatingModel"]] = relationship(
        "RatingModel", back_populates="employee", cascade="all, delete-orphan"
    )


class RatingModel(Base):
    __tablename__ = "ratings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    score: Mapped[int] = mapped_column(Integer, nullable=False)
    feedback: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    reviewer_name: Mapped[str] = mapped_column(String(100), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    employee_id: Mapped[int] = mapped_column(Integer, ForeignKey("employee.id"), nullable=False)
    employee: Mapped["EmployeeModel"] = relationship("EmployeeModel", back_populates="ratings")
