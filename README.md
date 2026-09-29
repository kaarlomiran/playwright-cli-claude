Summary: 
- This is a simple set up for playwright-cli project that uses traces, and playwright dashboard to create test plans and test execution reports via the actual app and not halluciante.
- By adding input test scope from a test mgt tool like azure dev ops or jira, and one prompt it will generate test plans and generate test reports.
- When qa enginner analyzes that the recently generated test cases, test plans merit a test automation script, it will only require a separate prompt and it will re use the same snapshot tree it used to navigate and generate test automation script. The Test Automation Report will be generated separately again with traces too.
- I will add the prompts later and add more commands to check playwright/traces to investigate any bugs or variances that the playwright-cli had captured
- Updates to follow on integrating playwright/dashboard and playwright/annotations that will be useful for test executions
- Updates to follow to resolve action failed runs
