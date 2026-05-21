from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from auth import get_current_user
from crud import (
    add_project_member_by_email,
    create_project,
    delete_project,
    get_project_by_id,
    list_project_members,
    list_projects,
    lookup_user_by_email,
    remove_project_member,
    update_project,
)
from database import get_db
from models import Project, ProjectMember, User
from schemas import (
    AddMemberRequest,
    ProjectCreate,
    ProjectMemberResponse,
    ProjectMembersListResponse,
    ProjectResponse,
    ProjectUpdate,
    ProjectsListResponse,
    UserLookupResponse,
    UserResponse,
)

router = APIRouter()


def _project_to_response(project: Project, viewer_id: int) -> ProjectResponse:
    if project.user_id == viewer_id:
        role = "OWNER"
    else:
        role = "MEMBER"
    return ProjectResponse(
        id=project.id,
        name=project.name,
        description=project.description,
        created_at=project.created_at,
        updated_at=project.updated_at,
        owner_id=project.user_id,
        role=role,
    )


def _require_owner(db: Session, project_id: int, user_id: int) -> Project:
    project = db.query(Project).filter(Project.id == project_id).first()
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")
    if project.user_id != user_id:
        raise HTTPException(
            status_code=403, detail="Only the project owner can do this."
        )
    return project


@router.get("", response_model=ProjectsListResponse)
def list_user_projects(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    projects = list_projects(db, current_user.id)
    return ProjectsListResponse(
        projects=[_project_to_response(p, current_user.id) for p in projects],
        total=len(projects),
    )


@router.post("", response_model=ProjectResponse)
def create_user_project(
    project: ProjectCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not project.name.strip():
        raise HTTPException(status_code=400, detail="Project name is required")
    created = create_project(db, project, current_user.id)
    return _project_to_response(created, current_user.id)


@router.patch("/{project_id}", response_model=ProjectResponse)
def update_user_project(
    project_id: int,
    updates: ProjectUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _require_owner(db, project_id, current_user.id)
    updated = update_project(db, project_id, updates, current_user.id)
    if updated is None:
        raise HTTPException(status_code=404, detail="Project not found")
    return _project_to_response(updated, current_user.id)


@router.delete("/{project_id}")
def delete_user_project(
    project_id: int,
    confirm: bool = False,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    project = _require_owner(db, project_id, current_user.id)
    task_count = len(project.tasks)
    if task_count > 0 and not confirm:
        raise HTTPException(
            status_code=400,
            detail=f"Project has {task_count} task(s). Pass confirm=true to delete.",
        )

    delete_project(db, project_id, current_user.id)
    return {"message": "Project deleted successfully", "id": project_id}


# --- Team / members ---


def _member_to_response(member: ProjectMember) -> ProjectMemberResponse:
    return ProjectMemberResponse(
        id=member.id,
        user_id=member.user_id,
        role=member.role,
        email=member.user.email,
        name=member.user.name,
        picture=member.user.picture,
    )


@router.get("/{project_id}/members", response_model=ProjectMembersListResponse)
def list_members(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if get_project_by_id(db, project_id, current_user.id) is None:
        raise HTTPException(status_code=404, detail="Project not found")
    members = list_project_members(db, project_id)
    return ProjectMembersListResponse(
        members=[_member_to_response(m) for m in members],
        total=len(members),
    )


@router.post("/{project_id}/members", response_model=ProjectMemberResponse)
def add_member(
    project_id: int,
    body: AddMemberRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _require_owner(db, project_id, current_user.id)
    member, code = add_project_member_by_email(db, project_id, body.email)

    if code == "invalid_email":
        raise HTTPException(status_code=400, detail="Please enter a valid email.")
    if code == "not_found":
        raise HTTPException(
            status_code=404,
            detail="No registered user found with that email.",
        )
    if code == "already_member":
        raise HTTPException(
            status_code=409,
            detail="That user is already a member of this project.",
        )

    return _member_to_response(member)


@router.delete("/{project_id}/members/{member_user_id}")
def remove_member(
    project_id: int,
    member_user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _require_owner(db, project_id, current_user.id)
    if member_user_id == current_user.id:
        raise HTTPException(
            status_code=400, detail="Owners cannot remove themselves."
        )
    ok = remove_project_member(db, project_id, member_user_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Member not found")
    return {"message": "Member removed", "user_id": member_user_id}


@router.get("/lookup-user", response_model=UserLookupResponse)
def lookup_member_candidate(
    email: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Look up a registered user by email so the UI can confirm before adding them."""
    user = lookup_user_by_email(db, email)
    if user is None:
        return UserLookupResponse(found=False)
    return UserLookupResponse(found=True, user=UserResponse.model_validate(user))
