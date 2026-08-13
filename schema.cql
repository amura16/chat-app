-- Création du Keyspace
CREATE KEYSPACE IF NOT EXISTS chat_app
WITH replication = {'class': 'SimpleStrategy', 'replication_factor': 1};

USE chat_app;

-- Table Utilisateurs
CREATE TABLE IF NOT EXISTS users (
    user_id uuid,
    username text,
    email text,
    password_hash text,
    created_at timestamp,
    PRIMARY KEY (user_id)
);

CREATE INDEX IF NOT EXISTS ON users (email);

-- Table Conversations par utilisateur
CREATE TABLE IF NOT EXISTS user_conversations (
    user_id uuid,
    conversation_id uuid,
    participant_id uuid,
    participant_username text,
    updated_at timestamp,
    PRIMARY KEY (user_id, updated_at, conversation_id)
) WITH CLUSTERING ORDER BY (updated_at DESC, conversation_id ASC);

-- Table Messages par conversation
CREATE TABLE IF NOT EXISTS messages (
    conversation_id uuid,
    message_id timeuuid,
    sender_id uuid,
    content text,
    status text,
    PRIMARY KEY (conversation_id, message_id)
) WITH CLUSTERING ORDER BY (message_id DESC);

-- Index SAI (Storage-Attached Indexing) natif pour Cassandra 5.0
CREATE CUSTOM INDEX IF NOT EXISTS messages_content_idx ON chat_app.messages (content) 
USING 'sai';