-- Keep the merchant product page distinct from the tracked affiliate click.
-- Existing direct merchant offers remain valid.
ALTER TABLE offers ADD COLUMN affiliate_url TEXT
    CHECK (affiliate_url IS NULL OR (
        affiliate_url LIKE 'https://rzekl.com/%'
        AND instr(affiliate_url, ' ') = 0
        AND instr(affiliate_url, char(10)) = 0
        AND instr(affiliate_url, char(13)) = 0
        AND instr(affiliate_url, '@') = 0
    ));

DROP VIEW public_offers;

CREATE VIEW public_offers AS
SELECT o.id, o.cultivar_id, o.product_name, o.kind, o.price_minor,
       o.currency, o.availability, o.destination_url, o.affiliate_url,
       o.checked_at, o.expires_at, s.display_name AS seller_name,
       s.website_url AS seller_url,
       'Партнёрская ссылка: при переходе к продавцу сайт может получить вознаграждение.'
           AS disclosure
FROM offers o
JOIN sellers s ON s.id = o.seller_id AND s.review_status = 'verified'
JOIN public_cultivars c ON c.id = o.cultivar_id
WHERE o.kind = 'affiliate'
  AND o.editorial_status = 'published'
  AND o.checked_at IS NOT NULL
  AND o.checked_at <= strftime('%Y-%m-%d %H:%M:%S', 'now')
  AND o.expires_at > o.checked_at
  AND o.expires_at > strftime('%Y-%m-%d %H:%M:%S', 'now')
  AND s.website_url LIKE 'https://%'
  AND length(rtrim(s.website_url, '/')) > length('https://')
  AND instr(s.website_url, '?') = 0
  AND instr(s.website_url, '#') = 0
  AND instr(s.website_url, '@') = 0
  AND instr(s.website_url, ' ') = 0
  AND o.destination_url IS NOT NULL
  AND (o.destination_url = rtrim(s.website_url, '/') OR
       substr(o.destination_url, 1, length(rtrim(s.website_url, '/')) + 1) =
           rtrim(s.website_url, '/') || '/')
  AND instr(o.destination_url, ' ') = 0
  AND instr(o.destination_url, char(10)) = 0
  AND instr(o.destination_url, char(13)) = 0;
