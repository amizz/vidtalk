import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

export const videos = sqliteTable('videos', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  filename: text('filename').notNull(),
  url: text('url').notNull(),
  duration: integer('duration'),
  status: text('status').notNull().default('processing'),
  uploadedAt: integer('uploaded_at', { mode: 'timestamp' }).notNull(),
  processedAt: integer('processed_at', { mode: 'timestamp' }),
});

export const transcripts = sqliteTable('transcripts', {
  id: text('id').primaryKey(),
  videoId: text('video_id').notNull().references(() => videos.id),
  content: text('content').notNull(),
  language: text('language').default('en'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

export const transcriptSegments = sqliteTable('transcript_segments', {
  id: text('id').primaryKey(),
  transcriptId: text('transcript_id').notNull().references(() => transcripts.id),
  text: text('text').notNull(),
  startTime: real('start_time').notNull(),
  endTime: real('end_time').notNull(),
  speaker: text('speaker'),
  confidence: real('confidence'),
  order: integer('order').notNull(),
});

export const collections = sqliteTable('collections', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

export const collectionVideos = sqliteTable('collection_videos', {
  collectionId: text('collection_id').notNull().references(() => collections.id),
  videoId: text('video_id').notNull().references(() => videos.id),
  addedAt: integer('added_at', { mode: 'timestamp' }).notNull(),
});