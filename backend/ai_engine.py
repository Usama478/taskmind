import json
import os
from datetime import datetime

from dotenv import load_dotenv
from openai import OpenAI

# Load environment variables
load_dotenv()

# Initialize OpenAI client
client = OpenAI()


def build_task_list_string(tasks) -> str:
    """
    Converts a list of Task objects to a formatted string for the AI.
    
    Args:
        tasks: List of Task objects from the database
        
    Returns:
        Formatted string with task details, one per line
    """
    if not tasks:
        return "No tasks currently in the system."
    
    lines = []
    for task in tasks:
        deadline_str = task.deadline if task.deadline else "null"
        category_str = task.category if hasattr(task, 'category') and task.category else "General"
        assignee_str = task.assignee if hasattr(task, 'assignee') and task.assignee else "None"
        line = f"ID: {task.id} | Title: {task.title} | Priority: {task.priority} | Status: {task.status} | Category: {category_str} | Assignee: {assignee_str} | Deadline: {deadline_str}"
        lines.append(line)
    
    return "\n".join(lines)


SYSTEM_PROMPT_TEMPLATE = """You are TaskMind AI, an intelligent project management assistant embedded in a task management application.

CURRENT DATE: {today_date}

CURRENT TASKS IN SYSTEM:
{task_list}

YOUR JOB:
Analyze the user's message and respond with ONLY a valid JSON object. No explanation. No markdown. No text before or after the JSON.

RESPONSE FORMAT (strict):
{{
  "action": "CREATE" | "UPDATE" | "DELETE" | "FOCUS" | "SUMMARY" | "CLARIFY" | "NONE",
  "task": {{
    "title": "string or null",
    "priority": "HIGH" | "MEDIUM" | "LOW" | null,
    "status": "TODO" | "IN_PROGRESS" | "DONE" | null,
    "deadline": "YYYY-MM-DD or null",
    "category": "string or null",
    "assignee": "string or null",
    "asset_link": "string (URL) or null",
    "target_id": number_or_null
  }},
  "reply": "Your response to the user"
}}

ACTION RULES:
- CREATE: User wants to add a new task. Extract title, priority, deadline.
- UPDATE: User wants to change an existing task. Set target_id to matching task id.
- DELETE: User wants to remove a task. Set target_id to matching task id.
- FOCUS: User asks what to work on. Analyze tasks by priority + deadline. Suggest top 2-3.
- SUMMARY: User asks for progress. Count done vs total. Mention overdue. Mention HIGH pending.
- CLARIFY: Message is too ambiguous to act on. Ask exactly ONE question.
- NONE: General conversation. No task action needed.

PRIORITY INFERENCE RULES:
- urgent / critical / asap / today / important = HIGH
- someday / whenever / low priority / not urgent = LOW
- everything else or unspecified = MEDIUM

DEADLINE PARSING RULES:
- "today" = current date
- "tomorrow" = current date + 1 day
- "this Friday" / "Friday" = upcoming Friday's date
- "next week" = current date + 7 days
- "Monday" = upcoming Monday
- Specific dates like "January 15" = parse to YYYY-MM-DD
- Vague like "soon" or "sometime" = null

EXTRACTION RULES:
- category: Assign to a relevant bucket (e.g., "Video", "Copy", "Design", "Social", "Review", "General"). Default to "General" if unclear.
- assignee: Extract any person's name mentioned as the one who should do the task (e.g., "Sarah", "John").
- asset_link: Extract any valid URL provided in the message (e.g., https://figma.com/...).

REPLY RULES:
- Always 1-3 sentences maximum
- Always end with a relevant emoji
- Never mention JSON or technical terms
- Always confirm what action was taken
- Be friendly, concise, and encouraging
- For FOCUS: explain WHY you're suggesting each task
- For SUMMARY: always end with a motivational line
- For CLARIFY: ask only ONE question, be friendly

MATCHING EXISTING TASKS:
- Match by title similarity (fuzzy match — "login bug" matches "Fix login bug")
- If multiple could match, pick the closest match
- Always mention the exact task title in your reply so user can confirm"""


def call_openai(message: str, conversation_history: list, task_list_string: str) -> dict:
    """
    Calls OpenAI API with the user message and conversation history.
    
    Args:
        message: The user's current message
        conversation_history: List of previous messages in format [{"role": "user"|"assistant", "content": "..."}]
        task_list_string: Formatted string of current tasks
        
    Returns:
        Dictionary with action, task details, and reply from the AI
    """
    try:
        # Get today's date in YYYY-MM-DD format
        today_date = datetime.now().strftime("%Y-%m-%d")
        
        # Build the system prompt
        system_prompt = SYSTEM_PROMPT_TEMPLATE.format(
            today_date=today_date,
            task_list=task_list_string
        )
        
        # Build messages array
        messages = [
            {"role": "system", "content": system_prompt}
        ]
        messages.extend(conversation_history)
        messages.append({"role": "user", "content": message})
        
        # Call OpenAI API
        response = client.chat.completions.create(
            model="gpt-4o",
            max_tokens=1000,
            messages=messages
        )
        
        # Extract response text
        response_text = response.choices[0].message.content
        
        # Strip markdown fences if present
        response_text = response_text.strip()
        if response_text.startswith("```json"):
            response_text = response_text[7:]
        elif response_text.startswith("```"):
            response_text = response_text[3:]
        if response_text.endswith("```"):
            response_text = response_text[:-3]
        response_text = response_text.strip()
        
        # Parse JSON
        result = json.loads(response_text)
        return result
        
    except json.JSONDecodeError:
        return {
            "action": "NONE",
            "task": {},
            "reply": "I didn't quite catch that. Could you rephrase? 😊"
        }
    except Exception:
        return {
            "action": "NONE",
            "task": {},
            "reply": "I'm having trouble connecting right now. Please try again! 🔄"
        }
