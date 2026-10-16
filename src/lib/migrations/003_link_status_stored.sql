-- A document with a stored file is served from App Storage; its legacy external URL no longer counts as broken.
-- Idempotent: re-running changes nothing once every stored row is 'n/a'.
UPDATE documents
   SET link_status = 'n/a', link_http_code = NULL
 WHERE storage_key IS NOT NULL AND link_status <> 'n/a';
