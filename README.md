# Resume Scanner: LLM-Powered Resume Analysis

This project is a web application designed to help recruiters or hiring managers efficiently screen resumes. It automates the process of extracting data from PDF resumes and analyzing their compatibility with a given job description using the Gemini Large Language Model (LLM), providing a numerical rating and a concise summary.

The application is built with a Next.js frontend and a Node.js backend using Socket.IO for real-time communication.

## Table of Contents

1.  [Features](#features)
2.  [Live Demos](#live-demos)
3.  [Project Structure](#project-structure)
4.  [LLM Role and Data Flow](#llm-role-and-data-flow)
5.  [Local Development](#local-development)
    -   [Prerequisites](#prerequisites)
    -   [Setup](#setup)
    -   [Running Locally](#running-locally)
6.  [Cloud Deployment](#cloud-deployment)
    -   [Vercel (Frontend)](#vercel-frontend)
    -   [Render (Backend)](#render-backend)
    -   [AWS EC2 (Combined, for Advanced Users)](#aws-ec2-combined-for-advanced-users)
7.  [Screenshots](#screenshots)

---

## 1. Features

-   **CSV & Text File Upload:** Upload a CSV file containing resume links (e.g., Google Drive links) and a text file with the job description.
-   **PDF Text Extraction:** Extracts text content from PDF resumes directly from provided links.
-   **LLM-Powered Analysis:** Utilizes the Gemini LLM to compare extracted resume text against the job description.
-   **Resume-Job Fit Rating:** Generates a numerical rating (0-10) indicating how well each resume matches the job description.
-   **Summarized Report:** Provides a concise, single-line summary explaining the LLM's rating for each resume.
-   **Real-time Progress:** Live updates on processing status via Socket.IO.
-   **CSV Download:** Download the final processed data, including LLM ratings and summaries, as a new CSV file.

---

## 2. Live Demos

You can access the deployed versions of this application:

-   **Frontend (Vercel):** <https://resume-scanner-frontend-hardik242s-projects.vercel.app>
-   **Backend (Render):** <https://resume-scanner-backend-3cac.onrender.com>
    _(Note: This URL only serves a basic message on HTTP requests, as its primary function is WebSocket communication.)_

-   **Frontend (AWS EC2):** <http://13.234.66.14:3000>
-   **Backend (AWS EC2):** <http://13.234.66.14:5000>

---

## 3. Project Structure

The project is logically separated into two main parts: `Frontend` (Next.js application) and `Backend` (Node.js/Socket.IO server).

.
├── Backend/
│ ├── node_modules/
│ ├── .env # Environment variables for backend (e.g., GEMINI_API_KEY)
│ ├── .gitignore
│ ├── eslint.config.mjs
│ ├── jsconfig.json
│ ├── package-lock.json
│ ├── package.json # Backend dependencies only
│ ├── README.md
│ └── server.js # Node.js backend with Socket.IO & LLM logic
├── Frontend/
│ ├── .next/ # Next.js build output (generated)
│ ├── app/ # Next.js App Router pages and components
│ │ ├── \_component/
│ │ ├── \_utils/
│ │ ├── globals.css
│ │ ├── icon.png
│ │ ├── layout.js
│ │ └── page.js
│ ├── node_modules/
│ ├── public/ # Static assets (images, etc.)
│ │ └── .env # Environment variables for frontend (e.g., NEXT_PUBLIC_BACKEND_URL)
│ ├── .gitignore
│ ├── eslint.config.mjs
│ ├── jsconfig.json
│ ├── next.config.mjs
│ ├── package-lock.json
│ ├── package.json # Frontend dependencies only
│ ├── postcss.config.mjs
│ ├── README.md
│ ├── sample_data.csv # Example CSV for testing
│ └── sample_job_description.txt # Example TXT for testing
├── README.md # This global README
└── screenshots/ # Folder containing project screenshots
├── backend_structure.png
└── frontend_structure.png

**Screenshot of Project Structure:**

<img src="Screenshots/image_4.png" alt="Frontend Folder Structure" width="300"/>
<img src="Screenshots/image_5.png" alt="Backend Folder Structure" width="300"/>

---

## 4. LLM Role and Data Flow

The Gemini Large Language Model (LLM) is the core intelligence behind the resume analysis. The data flows as follows:

1.  **Frontend (DataUploader.js) -> Backend (server.js) - Initial Data Transfer:**

    -   The user uploads a CSV file (containing resume URLs) and a job description text file via the frontend.
    -   This data is sent to the Node.js backend using **Socket.IO** (`startProcessing` event).

2.  **Backend (server.js) - Pre-processing:**

    -   For each resume link in the CSV, the backend fetches the PDF content.
    -   It uses `pdf-parse` to extract text directly from the PDF.

3.  **Backend (server.js) -> Gemini LLM - Analysis Request:**

    -   The extracted resume text and the job description are formatted into a prompt for the Gemini LLM (`gemini-2.5-flash`).
    -   This prompt is sent to the Google Gemini API using your `GEMINI_API_KEY`.

4.  **Gemini LLM - Processing and Response:**

    -   The Gemini LLM analyzes the resume content against the job description based on the prompt's instructions.
    -   It generates a numeric rating (0-10) and a single-line summarized report.
    -   The LLM's response is sent back to `server.js`.

5.  **Backend (server.js) - Data Aggregation:**

    -   The backend parses the LLM's response to extract the rating and summary.
    -   This LLM-generated data is then integrated with the original resume information.
    -   Real-time processing updates are sent back to the frontend via Socket.IO.

6.  **Backend (server.js) -> Frontend (DataUploader.js) - Final Results:**

    -   Once all resumes are processed, the complete dataset (original resume data + LLM analysis) is sent back to the frontend via a `processingComplete` Socket.IO event.

7.  **Frontend (DataUploader.js) - User Interface:**
    -   The frontend displays the processing progress and provides an option to download the final processed data as a CSV file.

---

## 5. Local Development

To run the project on your local machine, you'll need Node.js, npm/Yarn, and Git installed.

### Prerequisites

-   Node.js (LTS version, e.g., v18.x or v20.x) & npm (or Yarn)
-   Git
-   A **Google Gemini API Key**: [Get your API key here](https://aistudio.google.com/app/apikey).
    -   Ensure the API key has access to the `gemini-pro` model.

### Setup

1.  **Clone the repositories:**
    Since the project is designed for separate deployments, it's best to handle them as separate local repositories:

    ```bash
    # For the Frontend
    git clone [https://github.com/Hardik242/Resume-Scanner-Frontend.git](https://github.com/Hardik242/Resume-Scanner-Frontend.git)
    cd Resume-Scanner-Frontend

    # For the Backend (assuming it's in a separate repo, or you create one)
    git clone [https://github.com/Hardik242/Resume-Scanner-Backend.git](https://github.com/Hardik242/Resume-Scanner-Backend.git) # Replace with your actual backend repo
    cd Resume-Scanner-Backend
    ```

2.  **Install dependencies:**

    -   **For Frontend (in `Resume-Scanner-Frontend` directory):**

        ```bash
        npm install
        # or
        yarn install
        ```

    -   **For Backend (in `Resume-Scanner-Backend` directory):**
        ```bash
        npm install
        # or
        yarn install
        ```

3.  **Environment Variables:**

    -   **Backend (`Resume-Scanner-Backend/.env`):**
        Create a file named `.env` in the root of your backend directory and add your Gemini API key:

        ```
        GEMINI_API_KEY="YOUR_GEMINI_API_KEY_HERE"
        # Optional: If you want to specify a port other than 3000
        # PORT=5000
        ```

    -   **Frontend (`Resume-Scanner-Frontend/.env.local`):**
        Create a file named `.env.local` in the root of your frontend directory and specify your local backend URL:
        ```
        NEXT_PUBLIC_BACKEND_URL="http://localhost:3000"
        # If you changed the backend port above, update this accordingly, e.g., "http://localhost:5000"
        ```

### Running Locally

1.  **Start the Backend Server:**
    Open a terminal, navigate to the `Resume-Scanner-Backend` directory, and run:

    ```bash
    npm start
    # The server will start on http://localhost:3000 by default (or your specified PORT)
    ```

    You should see `> Backend Socket.IO server ready on http://0.0.0.0:3000` (or similar) in your console.

2.  **Start the Frontend Development Server:**
    Open a **separate** terminal, navigate to the `Resume-Scanner-Frontend` directory, and run:

    ```bash
    npm run dev
    ```

    The frontend will start on `http://localhost:3000` by default.

3.  **Access the Application:**
    Open your web browser and go to `http://localhost:3000` (or whatever port your Next.js frontend is running on).

---

## 6. Cloud Deployment

The project is set up for a split deployment strategy for optimal performance and free-tier utilization.

### Vercel (Frontend)

Vercel is the recommended platform for deploying your Next.js frontend due to its seamless integration and generous free tier.

1.  **Repository:** Ensure your `Frontend` code is in its own Git repository (e.g., `Resume-Scanner-Frontend`).
2.  **Vercel Setup:**

    -   Sign up for a Vercel account and connect your Git provider (GitHub, GitLab, or Bitbucket).
    -   Import your `Resume-Scanner-Frontend` repository. Vercel will automatically detect it as a Next.js project.
    -   In the project settings on Vercel, navigate to "Environment Variables."
    -   Add a new environment variable:
        -   **Name:** `NEXT_PUBLIC_BACKEND_URL`
        -   **Value:** `https://resume-scanner-backend-3cac.onrender.com` (This is your Render backend URL)
    -   Deploy the project. Vercel will automatically deploy new changes on every push to your main branch.

3.  **Live Link:** [https://resume-scanner-frontend-hardik242s-projects.vercel.app/](https://resume-scanner-frontend-hardik242s-projects.vercel.app/)

### Render (Backend)

Render is an excellent choice for hosting your persistent Node.js/Socket.IO backend due to its free web services tier and WebSocket support.

1.  **Repository:** Ensure your `Backend` code is in its own Git repository (e.g., `Resume-Scanner-Backend`).
2.  **Render Setup:**

    -   Sign up for a Render account and connect your Git provider.
    -   Click "New" -> "Web Service."
    -   Select your `Resume-Scanner-Backend` repository.
    -   **Name:** `resume-scanner-backend` (or any name you prefer)
    -   **Region:** Choose a region close to your Vercel frontend's region for lower latency.
    -   **Branch:** `main` (or your default branch)
    -   **Root Directory:** If `server.js` is at the root of your backend repo, leave empty. If it's in a subdirectory, specify it.
    -   **Runtime:** Node.js
    -   **Build Command:** `npm install`
    -   **Start Command:** `node server.js`
    -   **Environment Variables:** Add your Gemini API Key:
        -   **Name:** `GEMINI_API_KEY`
        -   **Value:** `YOUR_GEMINI_API_KEY_HERE`
    -   **Health Check Path (Optional but Recommended):** `/` (your simple HTTP response)
    -   Click "Create Web Service." Render will automatically deploy your backend on every push.

3.  **Live Link:** [https://resume-scanner-backend-3cac.onrender.com](https://resume-scanner-backend-3cac.onrender.com)

### AWS EC2 (Combined, for Advanced Users)

While the project is designed for split deployment, you can deploy both frontend (after building) and backend on a single AWS EC2 instance. This is more advanced and requires manual server management.

**Important:** AWS Free Tier offers 750 hours/month of `t2.micro`/`t3.micro`. AWS Academy sandboxes are temporary and will be deleted.

#### **Backend (`server.js`) on AWS EC2:**

1.  **Launch EC2 Instance:**

    -   Login to AWS Console.
    -   Navigate to EC2 -> Launch Instance.
    -   **AMI:** Ubuntu Server 20.04 LTS (Free Tier Eligible).
    -   **Instance Type:** `t2.micro` (Free Tier Eligible).
    -   **Key Pair:** Create or use an existing one (`.pem` file required for SSH).
    -   **Network Settings (Security Group):**
        -   Allow **SSH (Port 22)** from "My IP" (recommended).
        -   Allow **Custom TCP Port 5000** (your backend port) from "Anywhere" (or specific IPs).
    -   Launch Instance.

2.  **Connect via SSH:**

    ```bash
    ssh -i /path/to/your-key.pem ubuntu@YOUR_EC2_PUBLIC_IP
    ```

3.  **Install Node.js, npm, Git, PM2:**

    ```bash
    sudo apt update
    sudo apt install -y curl git
    curl -fsSL [https://deb.nodesource.com/setup_lts.x](https://deb.nodesource.com/setup_lts.x) | sudo -E bash -
    sudo apt install -y nodejs
    sudo npm install -g pm2
    ```

4.  **Clone Backend Repo:**

    ```bash
    git clone [https://github.com/Hardik242/Resume-Scanner-Backend.git](https://github.com/Hardik242/Resume-Scanner-Backend.git)
    cd Resume-Scanner-Backend
    npm install
    ```

5.  **Environment Variables:** Create `.env` in `Resume-Scanner-Backend` directory:

    ```
    GEMINI_API_KEY="YOUR_GEMINI_API_KEY_HERE"
    PORT=5000
    ```

6.  **Start Backend with PM2:**
    ```bash
    pm2 start server.js --name resume-backend
    pm2 save
    pm2 startup # Follow instructions to enable startup on reboot
    ```

#### **Frontend (Next.js) on AWS EC2:**

1.  **Build Frontend Locally:**
    In your `Resume-Scanner-Frontend` local directory:

    ```bash
    npm run build
    ```

    This creates the optimized `.next` directory.

2.  **Transfer Frontend Files to EC2:**
    Use `scp` to copy the built frontend to your EC2 instance.

    ```bash
    scp -r -i /path/to/your-key.pem Resume-Scanner-Frontend/ ubuntu@YOUR_EC2_PUBLIC_IP:/home/ubuntu/Resume-Scanner-Frontend/
    ```

    Then, SSH back into EC2 and navigate: `cd /home/ubuntu/Resume-Scanner-Frontend`

3.  **Install Nginx (Web Server):**

    ```bash
    sudo apt install -y nginx
    ```

4.  **Configure Nginx:**
    Create a new Nginx config file:

    ```bash
    sudo nano /etc/nginx/sites-available/resume-scanner-frontend
    ```

    Paste the following (adjust paths if your project is not in `/home/ubuntu/Resume-Scanner-Frontend`):

    ```nginx
    server {
        listen 80;
        server_name YOUR_EC2_PUBLIC_IP; # Or your domain name

        root /home/ubuntu/Resume-Scanner-Frontend/.next/standalone; # Next.js 15 standalone output

        index index.html;

        # Serve static assets from .next/static and public
        location /_next/static/ {
            alias /home/ubuntu/Resume-Scanner-Frontend/.next/static/;
            try_files $uri $uri/ =404;
        }

        location / {
            # Serve Next.js static output
            try_files $uri $uri/index.html $uri.html @backend;
        }

        # Proxy for Socket.IO
        location /socket.io/ {
            proxy_pass http://localhost:5000; # Port your backend runs on
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Redirect other requests to the backend for API routes or server-side functions
        location @backend {
            proxy_pass http://localhost:5000; # Port your backend runs on
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        error_page 404 /404.html; # Customize if needed
        location = /404.html {
            internal;
        }
    }
    ```

    -   Save and exit.
    -   **Enable Nginx config:**
        ```bash
        sudo ln -s /etc/nginx/sites-available/resume-scanner-frontend /etc/nginx/sites-enabled/
        sudo rm /etc/nginx/sites-enabled/default # Remove default Nginx config
        ```

5.  **Configure Security Group (Frontend Port):**

    -   In AWS Console -> EC2 -> Security Groups -> Select your instance's security group.
    -   Add an inbound rule: **HTTP (Port 80)** from "Anywhere".

6.  **Restart Nginx:**
    ```bash
    sudo systemctl restart nginx
    ```

#### Accessing on AWS EC2:

-   **Frontend:** `http://YOUR_EC2_PUBLIC_IP:80` (or just `http://YOUR_EC2_PUBLIC_IP`)
-   **Backend:** `http://YOUR_EC2_PUBLIC_IP:5000` (Used internally, frontend will connect via `/socket.io` through Nginx)

## 7. Screenshots

### Application Flow

<img src="Screenshots/image_1.png" alt="Application Screenshot 1" width="600"/>

<img src="Screenshots/image_2.png" alt="Application Screenshot 2" width="600"/>

<img src="Screenshots/image_3.png" alt="Application Screenshot 3" width="600"/>
