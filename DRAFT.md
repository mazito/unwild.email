# DRAFT

This is a temp file for writing long instructions or descriptions instead of very long prompts.

## CONTEXT

We will be dong some client UI work

## DESIGN

I want a small floating Input box at the bottom and center of the content area, 
about 30rem width aprox that:

When not focused it is just a small input with a search button on the right. 
Use a rounded-sm border for the full box and NO border for the input 
and search button inside the box.

When focused it transforms into a full panel that grows from the bottom up.
The panel has 2 areas: 

1) A top area where we will be showing search results. 
- This area should grow when the content grows.

2) A bottom area that has 
  - An autogrow "textarea" that grows in size as user types, to a max of 5 lines.
  - The search btn at the top right of the bottom area.

The total heighht of the 2 areas must not exceed the window height minus some 4rems.

For now simulate we are adding paragraphs with 2 lines each paragraph as the user types.



