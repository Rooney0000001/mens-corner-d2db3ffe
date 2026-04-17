
DROP POLICY "Anyone can subscribe" ON public.subscribers;
CREATE POLICY "Anyone can subscribe" ON public.subscribers
  FOR INSERT WITH CHECK (
    char_length(email) BETWEEN 3 AND 254
    AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  );

DROP POLICY "Anyone can submit contact" ON public.contact_messages;
CREATE POLICY "Anyone can submit contact" ON public.contact_messages
  FOR INSERT WITH CHECK (
    char_length(name) BETWEEN 1 AND 100
    AND char_length(email) BETWEEN 3 AND 254
    AND char_length(message) BETWEEN 1 AND 5000
    AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
    AND read = false
  );
