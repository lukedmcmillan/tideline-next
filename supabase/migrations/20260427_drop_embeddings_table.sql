-- Drop orphaned embeddings table
-- Created in 20260402_create_embeddings.sql with vector(1536) linked to stories.
-- Was never populated (0 rows) and is not queried by any route.
-- RAG over stories is handled by story_chunks (Jina 768-dim) via match_story_chunks RPC.
drop table if exists embeddings;
