#!/bin/sh

# Exit immediately if a command exits with a non-zero status.
set -e

# Log the start of the script
echo "Entrypoint script started..."

# Run the database migration
echo "Running database migrations..."
npm run migrate

# Check if the migration was successful
if [ $? -eq 0 ]; then
  echo "Migrations completed successfully."
else
  echo "Migrations failed. Exiting."
  exit 1
fi

# Execute the main command (passed from Dockerfile CMD)
echo "Starting the main application..."
exec "$@"
