# DRAFT

This is a temp file for writing long instructions or descriptions instead of very long prompts.

## CONTEXT

We will be working with the ./docs/DATA-MODEL.md defining the model structure, tables, etc

## DO 

Now that we have the full email data described, lets build a relational db model with tables and relations, that will be the repository of the raw emails.

I do not have a clear undesrtandig if emails already have an unique UUID, but i want ALL tables (even N:M relationship tables) to have an UUID v7 key as unique primary key. The name convention for the table primary unique key is 'uid', NOT 'id' please, we may use id for autoincremental numeric ids, not for UUIDs.

Also the naming convention for tables is use plurals, snake case, both for table and column names, like 'emails' and 'crated_utc'.

If using datetimes, i would like UTC times (ISO format), and be indicated with suffix '_utc', like 'created_utc'.

For foreign keys, always use the suffix '_uid' when it points to other table row, like in 'org_uid' or 'sender_uid'. Because ALL rows and tables have an uid this is integrity consistent. 

When dealing with "who" did something, it may be useful sometimes to use a '_by' suffix, to indicate the full name of the person like in 'created_by'. The '_by' suffix allong can conventonally indicte the full name, thoug not versu sure this woint take problems latter. If also we need the uid we may use 'created_by_uid'. 

But it would be preferable to use 'creator_fullname' and 'creator_uid' instead. The only ugly thing here is the suffix '_fullname' in every query is tedious, so '_by' my be good enough. 

Maybe we need other conventions too. 

Please add this conventions at the top of the file. All suggest other conventions we may also need.

Write it to the EMAILS-BASE-MODEL.md doc.

Do not write code, but please add the create table (in Duckdb SQL) when describing the table. 

I will review and add my comments with "!!!" .


