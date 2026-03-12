from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings

client = AsyncIOMotorClient(settings.mongodb_url)
database = client[settings.database_name]

# Collections
users_collection = database.get_collection("users")
student_profiles_collection = database.get_collection("student_profiles")
test_results_collection = database.get_collection("test_results")
actionable_remedies_collection = database.get_collection("actionable_remedies")
quiz_history_collection = database.get_collection("quiz_history")

async def create_indexes():
    """Create database indexes for optimal querying"""
    await users_collection.create_index("email", unique=True)
    await student_profiles_collection.create_index("apaar_id", unique=True)
    await test_results_collection.create_index("apaar_id")
    await actionable_remedies_collection.create_index("apaar_id")
    await quiz_history_collection.create_index("child_email")
    await quiz_history_collection.create_index([("child_email", 1), ("created_at", -1)])
    await quiz_history_collection.create_index("apaar_id")
