-- Track ticket-reply edits and deletions in the audit trail. Records the
-- fact and actor only (replyId + ticketId in metadata), not the reply
-- body — preserving pre-edit content is a separate concern handled (or
-- not) at the TicketReply layer. Only the author can mutate their own
-- reply (admins are blocked by the auth check in editReplyAction /
-- deleteReplyAction), so these rows specifically catch author
-- self-tampering rather than admin moderation.
ALTER TYPE "ActivityAction" ADD VALUE 'TICKET_REPLY_UPDATED';
ALTER TYPE "ActivityAction" ADD VALUE 'TICKET_REPLY_DELETED';
