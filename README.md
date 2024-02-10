
## setup

- tunnel ollama exposed api
- setup `.env`
- run the server


## endpoints:

- `/onboarding` : initialises the AI agent with name and age
- `/chat` : general chat on the day for journal entry
- `/submit-daily-entry` : submit the entry for the day
- `/semantic-search` : searches for a similar conversation base on vector embedding match 
- `/journal-entry/:timestamp` : returns the journal entry for the day matching the timestamp