# Kevin

Kevin is an enterprise AI pair programmer because enterprise apps follows standard architecture, coding patterns. Kevin can automatically create code based on boilerplate templates.

## Definition files

1. Generate Prisma schema

```json
{
  "file_name": "generated_schema.prisma",
  "model_name": "CaseLocation",
  "fields": [
    {
      "name": "location",
      "type": "string",
      "required": true
    },
    {
      "name": "case",
      "type": "case",
      "required": true
    },
    {
      "name": "createdAt",
      "type": "DateTime",
      "required": true
    },
    {
      "name": "updatedAt",
      "type": "DateTime",
      "required": true
    },
    {
      "name": "deletedAt",
      "type": "DateTime",
      "required": false
    }
  ]
}
```

2. Generate Form

```json
{
  "file_name": "add-activities.tsx",
  "fields": [
    {
      "name": "activityType",
      "type": "string",
      "required": true
    },
    {
      "name": "activityName",
      "type": "string",
      "required": true
    },
    {
      "name": "remarks",
      "type": "string",
      "required": false
    }
  ]
}
```
