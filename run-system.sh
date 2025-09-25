#!/bin/bash

echo "========================================"
echo "   NewBetting Lottery System Setup"
echo "========================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[$1]${NC} $2"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    print_error "PostgreSQL is not installed. Please install PostgreSQL 13+ first."
    exit 1
fi

print_status "1/6" "Installing backend dependencies..."
cd backend
npm install
if [ $? -ne 0 ]; then
    print_error "Failed to install backend dependencies"
    exit 1
fi

print_status "2/6" "Installing frontend dependencies..."
cd ../frontend
npm install
if [ $? -ne 0 ]; then
    print_error "Failed to install frontend dependencies"
    exit 1
fi

print_status "3/6" "Setting up environment files..."
cd ..
cp env.example .env
print_warning "Environment file created. Please edit .env with your database credentials."

print_status "4/6" "Database setup..."
echo "Please run the following commands in PostgreSQL:"
echo "1. psql -U postgres -f setup-database.sql"
echo "2. psql -U postgres -d newbetting -f database_schema.sql"
echo ""
read -p "Press Enter after setting up the database..."

print_status "5/6" "Starting backend server..."
cd backend
npm run dev &
BACKEND_PID=$!

print_status "6/6" "Starting frontend server..."
cd ../frontend
npm start &
FRONTEND_PID=$!

echo ""
echo "========================================"
echo "   System is starting up..."
echo "========================================"
echo ""
echo "Backend: http://localhost:3000"
echo "Frontend: http://localhost:3001"
echo ""
echo "Press Ctrl+C to stop both servers"
echo ""

# Wait for user to stop
trap "kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait




