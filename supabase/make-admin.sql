-- Make an existing account the admin.
-- 1) Sign up in the app first.  2) Replace the email below.  3) Run in Supabase SQL Editor.
update public.profiles
   set role = 'admin'
 where id = (select id from auth.users where email = 'YOUR-EMAIL@example.com');

-- Check: should list your name with role = admin
select p.full_name, u.email, p.role
  from public.profiles p join auth.users u on u.id = p.id
 where p.role = 'admin';
