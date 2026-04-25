-- Track ticket-reply edits and deletions in the audit trail. Without these,
-- a user could edit (or admin could delete) a reply with no record of the
-- change, which matters for HR-category tickets where original wording
-- may be material later.
ALTER TYPE "ActivityAction" ADD VALUE 'TICKET_REPLY_UPDATED';
ALTER TYPE "ActivityAction" ADD VALUE 'TICKET_REPLY_DELETED';
