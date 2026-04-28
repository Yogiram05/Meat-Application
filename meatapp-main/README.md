# meatapp

## Backend Setup

1. Put your MongoDB Atlas connection string in `backend/.env` as `MONGODB_URI=mongodb+srv://.../meatapp`.
2. The backend reads only `backend/.env` for MongoDB settings.
3. There is no local MongoDB fallback anymore. If `MONGODB_URI` is missing or invalid, startup fails with a visible error.
4. Make sure the Atlas cluster is ready and the current IP address is allowed in Network Access.
