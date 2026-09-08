-- Optional starter content. Run after schema.sql if you want the invitation to
-- render immediately instead of showing the first-time setup screen.
-- Replace every value before using this for a real client.

insert into public.event_settings (
  id, celebrant_name, age, event_date, start_time, end_time,
  venue, address, dress_code, description, birthday_message,
  additional_info, rsvp_method
) values (
  1,
  'Maria Santos',
  30,
  current_date + interval '60 days',
  '18:00',
  '22:00',
  'ABC Events Place',
  'Angeles City, Pampanga',
  'Formal / Smart casual',
  'Thirty years, and the best part has been the people in them.',
  'Come hungry, stay late, and dance badly with me.',
  'Free parking is available at the rear entrance. Doors open 30 minutes before the program.',
  'supabase'
)
on conflict (id) do nothing;

insert into public.hero_settings (id, label, title, subtitle, show_countdown)
values (1, 'You are invited', 'An evening of good company', 'to celebrate the 30th birthday', true)
on conflict (id) do nothing;

insert into public.about_settings (id, title, greeting, description, birthday_message)
values (
  1,
  'About the celebrant',
  'Hi, I am Maria',
  'I grew up in Pampanga, spent my twenties building things, and I am spending this birthday with everyone who made those years worth it.',
  'No gifts needed. Just come.'
)
on conflict (id) do nothing;
