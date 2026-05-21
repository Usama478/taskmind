from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ai_engine import build_task_list_string, call_openai
from crud import create_task, delete_task, get_all_tasks, update_task
from database import get_db
from schemas import ChatRequest, ChatResponse, TaskCreate, TaskResponse, TaskUpdate

router = APIRouter()


@router.post("/", response_model=ChatResponse)
def chat(request: ChatRequest, db: Session = Depends(get_db)):
    """
    Process a chat message with TaskMind AI.
    
    The AI analyzes the message, determines what action to take (if any),
    executes the appropriate database operation, and returns a response
    with the updated task list.
    """
    # Fetch all current tasks
    tasks = get_all_tasks(db)
    
    # Build task list string for AI context
    task_list_string = build_task_list_string(tasks)
    
    # Call OpenAI to analyze the message
    ai_response = call_openai(
        message=request.message,
        conversation_history=request.conversation_history,
        task_list_string=task_list_string
    )
    
    # Extract action and task details from AI response
    action = ai_response.get("action", "NONE")
    task_data = ai_response.get("task", {})
    reply = ai_response.get("reply", "I'm not sure how to respond to that. 😊")
    
    task_affected = None
    action_taken = action
    
    # Execute the appropriate database operation based on action
    if action == "CREATE":
        # Create a new task. The AI may explicitly return null for priority/status,
        # so we can't rely on dict.get()'s default — fall back when the value is falsy.
        task_create = TaskCreate(
            title=task_data.get("title") or "Untitled Task",
            priority=task_data.get("priority") or "MEDIUM",
            status=task_data.get("status") or "TODO",
            deadline=task_data.get("deadline")
        )
        created_task = create_task(db, task_create)
        task_affected = TaskResponse.model_validate(created_task)
    
    elif action == "UPDATE":
        target_id = task_data.get("target_id")
        if not target_id:
            reply = "I couldn't find that task. Could you be more specific? 😊"
        else:
            task_update = TaskUpdate(
                title=task_data.get("title"),
                priority=task_data.get("priority"),
                status=task_data.get("status"),
                deadline=task_data.get("deadline"),
            )
            updated_task = update_task(db, target_id, task_update)
            if updated_task:
                task_affected = TaskResponse.model_validate(updated_task)
            else:
                reply = "I couldn't find that task. Could you be more specific? 😊"

    elif action == "DELETE":
        target_id = task_data.get("target_id")
        if not target_id:
            reply = "I couldn't find that task to delete. Which one did you mean? 😊"
        elif not delete_task(db, target_id):
            reply = "I couldn't find that task to delete. Which one did you mean? 😊"
    
    # For FOCUS, SUMMARY, CLARIFY, NONE: no database operation needed
    
    # Fetch fresh task list after any DB operation
    fresh_tasks = get_all_tasks(db)
    
    # Build and return the response
    return ChatResponse(
        reply=reply,
        action_taken=action_taken,
        task_affected=task_affected,
        tasks=[TaskResponse.model_validate(task) for task in fresh_tasks]
    )
