from supabase import create_client

url = "https://qhxhetjspjzdbpbeucfh.supabase.co"
key = "sb_secret_SQ3FwHmTSlPDJcGtu5mFBw_yMVX-JyQ"
db = create_client(url, key)

auth = db.auth.admin.create_user({
    "email": "ustaad.earn4pk@gmail.com",
    "password": "Ustaad@2024#Admin",
    "email_confirm": True
})
user_id = auth.user.id

db.table("users").insert({
    "id": user_id,
    "role": "admin",
    "full_name": "Yasir Khan",
    "email": "ustaad.earn4pk@gmail.com"
}).execute()

print("Admin created! ID:", user_id)
