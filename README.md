

Installation instructions

How to run the project

Dependencies list

Screenshots/demo section

You can paste this directly into README.md in your GitHub repo.

Git Time Traveller

Git Time Traveller is a visualization and analytics tool that helps developers explore and understand the evolution of a Git repository over time. Instead of analyzing raw Git logs, the system converts repository history into interactive visualizations that reveal development patterns, contributor activity, and file change behavior.

The tool analyzes a repository’s commit history and presents insights through a dashboard that includes commit timelines, code churn heatmaps, contributor graphs, and file evolution visualizations.

Problem Statement

Modern software projects generate thousands of commits, making it difficult to analyze repository history using traditional Git logs.

Developers often struggle to answer questions such as:

Which files change most frequently?

How has the codebase evolved over time?

Which developers contribute the most?

What are the development activity patterns?

Git Time Traveller solves this by transforming raw Git history into interactive visual analytics.

Key Features
Code Churn Heatmap

Shows which files change most frequently and highlights high-churn files that may require attention.

File Evolution

Tracks how individual files grow or shrink over time in terms of lines of code.

Contributor Graph

Visualizes collaboration between developers and shows contribution patterns.

Activity Patterns

Analyzes commit activity by hour, day, and month.

Time Scrubbing

Allows users to jump to any point in the repository history using the commit timeline.

Interactive Visualizations

Users can click elements to view detailed commit and file information.

Branch Visualization

Displays the structure and relationships between repository branches.

Repository Health Score

Calculates a health score based on activity, code churn, and contributor distribution.

Tech Stack

Frontend

React

TypeScript

Recharts (data visualizations)

Tailwind CSS

Backend

Python

FastAPI

GitPython / Git CLI

Other Tools

Git

REST API communication

Data analysis using Python

Installation Instructions

Clone the repository:

git clone https://github.com/yourusername/git-time-traveller.git
cd git-time-traveller
Backend Setup

Navigate to the backend directory:

cd backend

Create a virtual environment:

python -m venv venv

Activate the environment.

Windows:

venv\Scripts\activate

Mac/Linux:

source venv/bin/activate

Install dependencies:

pip install -r requirements.txt

Start the backend server:

uvicorn main:app --reload

The backend will run at:

http://localhost:8000
Frontend Setup

Open a new terminal and navigate to the frontend directory:

cd frontend

Install dependencies:

npm install

Run the development server:

npm run dev

The frontend will run at:

http://localhost:8080
How to Run the Project

Start the backend server using FastAPI.

Start the frontend React application.

Open the application in your browser.

Enter a GitHub repository URL.

Explore the repository insights using the interactive dashboard.

Dependencies

Backend dependencies include:

fastapi

uvicorn

gitpython

networkx

pydantic

Frontend dependencies include:

react

typescript

recharts

axios

framer-motion

lucide-react

tailwindcss

Install them using:

pip install -r requirements.txt
npm install
Screenshots / Demo

Add screenshots of the dashboard here.

Example sections:

Commit Timeline

Code Churn Heatmap

Contributor Network

File Evolution

Future Improvements

3D repository visualizations

Export repository evolution as GIF or video

Real-time Git log streaming

Advanced diff visualization on hover

Improved performance for very large repositories
