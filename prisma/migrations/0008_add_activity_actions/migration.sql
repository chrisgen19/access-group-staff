-- Add product-side ActivityAction values so the audit trail covers what users
-- actually do (cards, reactions, comments, tickets), not just auth events.
ALTER TYPE "ActivityAction" ADD VALUE 'CARD_CREATED';
ALTER TYPE "ActivityAction" ADD VALUE 'CARD_UPDATED';
ALTER TYPE "ActivityAction" ADD VALUE 'CARD_DELETED';
ALTER TYPE "ActivityAction" ADD VALUE 'CARD_REACTED';
ALTER TYPE "ActivityAction" ADD VALUE 'CARD_UNREACTED';
ALTER TYPE "ActivityAction" ADD VALUE 'COMMENT_CREATED';
ALTER TYPE "ActivityAction" ADD VALUE 'COMMENT_UPDATED';
ALTER TYPE "ActivityAction" ADD VALUE 'COMMENT_DELETED';
ALTER TYPE "ActivityAction" ADD VALUE 'TICKET_CREATED';
ALTER TYPE "ActivityAction" ADD VALUE 'TICKET_REPLIED';
