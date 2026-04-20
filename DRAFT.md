# DRAFT

This is a temp file for writing long instructions or descriptions instead of very long prompts.

## CONTEXT

We will be dong some client UI work

## DESIGN

Now we will add the Compose Email button to the bottom floating area.

Look as "Compose email" button in the Header for the btn we want to add.

Now the bottom floating area will have 2 horizaontal area:

1) The FloatingSearch we already completed
2) To the right of it as an independent btn (NOT inside the search area) we will 
  have the "Compose email" btn

How does it work:

1) when we focus on the Search input it works exactly as it is working now, with 
  a small twist: when serach is focused the "Compose" btn should be HIDDEN.

2) NOW when we click the "Compose" btn the following happens:
  - the Search area is HIDDEN now
  - in its place appears the Compose panel
  
The compose panel: This is a panel of same width than the results top panel. It has 2 parts:

Top panel: 
- The top panel is "a growing edit area", that grows as the text grows, it tops
 at the top of the screen minus 7rem (like the resuklts panel before)
- It must have overlaid buttons on top right: [Expand] and [Close] 
- Close will close all and go back to 

Bottom buttons area: 
- separated in left and right email btns
- left: [Attachs] [Links]
- Right: ["To"] ["Cc"] [Send]  

Notes:
- "Attachs" can add files to the email
- "Links" can add links to the email
- The "To" and "Cc" buttons dont have an icon, just the text labels. Latter we will see what they do.
- "Send" is a drowdown primary btn with be "Send now" or "Save as draft" options
- Now we will not have a WYSIWYG editor/formatter (Later may be). Formater 
  options may go in the top left of the composer panel.

