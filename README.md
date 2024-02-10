
## setup

- tunnel ollama exposed api
- setup `.env`
- run the server


## endpoints:

- `/onboarding` : initialises the AI agent with name and age
 
 ```
 {
    "name": "string",
    "age": "string",
    "model": "string" (llama2 or mistral)
 } 
 ```

- `/chat` : general chat on the day for journal entry

 ```
 {
    "message": "string",
    "model": "string" (llama2 or mistral)
 } 
 ```

- `/submit-daily-entry` : submit the entry for the day

 ```
 {
    "model": "string" (llama2 or mistral)
 } 
 ```

- `/semantic-search` : searches for a similar conversation base on vector embedding match 

```
 {
    "message": "string",
    "model": "string" (llama2 or mistral)
 } 
 ```

- `/journal-entry/:model/:timestamp` : returns the journal entry for the day matching the timestamp
- 
```
url params : 
    model: "string" (llama2 or mistral)
    timestamp: "number" (unix epoch)
 ```