# India USDT Deal backend

Railway-ready PostgreSQL and WebSocket service for real users, agents and administrators.

## Railway setup

1. Add a PostgreSQL service to the Railway project.
2. Add this repository again as a service and set its Root Directory to `/backend`.
3. Add the variables from `.env.example`. Railway supplies `DATABASE_URL` from PostgreSQL.
4. Generate a strong `JWT_SECRET`, set the Telegram bot token, admin email/password and exact frontend origin.
5. Generate a public domain. Railway uses `/health` for its health check.

The schema is applied safely at startup. Closed orders, messages and related uploads are deleted automatically 15 days after closure through cascading database relations.

## Message receipts

- `sent`: saved while the recipient is offline.
- `delivered`: recipient has an authenticated WebSocket connection.
- `seen`: recipient opened the order conversation and called the seen endpoint.

The UI must never manufacture receipt states; it should render the status returned by the API.
