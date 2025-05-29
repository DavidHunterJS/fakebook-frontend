// Jenkinsfile

pipeline {
    // Defines the agent where the pipeline will run. 'any' means any available Jenkins agent.
    agent any

    // Environment variables used throughout the pipeline.
    // Secrets (like HEROKU_API_KEY) are retrieved from Jenkins Credentials.
    environment {
        // --- IMPORTANT: Replace with your actual Heroku app name ---
        HEROKU_APP_NAME = 'fakebook-frontend' // e.g., 'my-awesome-js-app-12345'

        // --- Reference the ID of the Heroku API Key credential you added in Jenkins ---
        // This will inject the secret text into the HEROKU_API_KEY environment variable during the build.
        HEROKU_API_KEY = credentials('HEROKU_API_KEY') // 'HEROKU_API_KEY' is the ID you gave in Jenkins
    }

    // Tools configuration. 'nodejs' here references the NodeJS tool configured in Jenkins.
    tools {
        // --- IMPORTANT: 'NodeJS_18_on_EC2' must match the 'Name' you configured in Manage Jenkins -> Global Tool Configuration ---
        nodejs 'NodeJS_18_on_EC2'
    }

    // Define the stages of your CI/CD pipeline.
    stages {
        stage('Checkout Code') {
            steps {
                script {
                    echo 'Cloning repository from GitHub...'
                    // --- IMPORTANT: Replace with your actual GitHub repository URL ---
                    // For public repos: git url: 'https://github.com/your-username/your-repo.git'
                    // For private repos (using credentials ID from Jenkins):
                    git branch: 'main', url: 'https://github.com/DavidHunterJS/fakebook-frontend.git'
                    // ^^^ If your GitHub repo is public, remove 'credentials: "..."'.
                    // ^^^ If private, replace 'your_github_credentials_id' with the ID of your GitHub credentials (e.g., 'github_pat' or 'jenkins_github_ssh').
                }
            }
        }

        stage('Install Dependencies') {
            steps {
                script {
                    echo 'Cleaning and reinstalling dependencies...'
                    sh 'rm -rf node_modules package-lock.json'
                    sh 'npm install --force'
                }
            }
        }
        stage('Verify Installations') {
            steps {
                sh 'npm list has-flag supports-color chalk jest'
            }   
        }
        stage('Run Tests') {
            steps {
                script {
                    echo 'Running tests...'
                    // --- Adjust these commands based on your project structure and test runner ---
                    // If your app has a single test script at the root:
                    sh 'npm test' // Assumes 'test' script in package.json runs all necessary tests

                    // OR, if you have separate frontend/backend tests:
                    // sh 'cd backend && npm test'
                    // sh 'cd frontend && npm test'
                }
            }
        }

        stage('Build Frontend (if applicable)') {
            // This stage only runs if a 'build' script exists in package.json (common for SPAs)
            when {
                // Check if 'package.json' exists and contains a 'build' script
                expression { fileExists('package.json') && new File('package.json').text.contains('"build":') }
            }
            steps {
                script {
                    echo 'Building frontend assets...'
                    // --- Adjust based on your frontend build command ---
                    // If frontend build is run from the root:
                    sh 'npm run build'

                    // OR, if your frontend is in a separate folder:
                    // sh 'cd frontend && npm run build'
                }
            }
        }

        stage('Deploy to Heroku') {
            steps {
                script {
                    echo 'Deploying to Heroku...'
                    // Add Heroku to known hosts (important for the first deploy from Jenkins)
                    // This prevents SSH prompts when Git pushes to Heroku.
                    sh 'mkdir -p ~/.ssh'
                    sh 'chmod 700 ~/.ssh'
                    sh 'ssh-keyscan heroku.com >> ~/.ssh/known_hosts'
                    sh 'chmod 600 ~/.ssh/known_hosts'

                    // Set NODE_ENV to production on Heroku (important for optimized builds)
                    sh 'heroku config:set --app ${HEROKU_APP_NAME} NODE_ENV=production --json || true'

                    // Add Heroku git remote for the specific app (if not already added for the Jenkins user)
                    // This ensures 'git push heroku' targets the correct app.
                    sh 'heroku git:remote -a ${HEROKU_APP_NAME}'

                    // Git push to Heroku using the HEROKU_API_KEY for authentication
                    // This command uses the HEROKU_API_KEY environment variable that Jenkins injects.
                    // IMPORTANT: Adjust 'HEAD:main' to 'HEAD:master' if your main branch on Heroku is 'master'.
                    sh 'git push https://heroku:${HEROKU_API_KEY}@git.heroku.com/${HEROKU_APP_NAME}.git HEAD:main'
                }
            }
        }
    }

    // Post-build actions: runs after all stages complete.
    post {
        always {
            // This block always runs, regardless of success or failure.
            echo 'Pipeline finished.'
        }
        success {
            // This block runs only if the pipeline completes successfully.
            echo 'Pipeline succeeded! Your app is deployed.'
            // You can add more notifications here (e.g., Slack, Email)
        }
        failure {
            // This block runs only if any stage in the pipeline fails.
            echo 'Pipeline failed! Check the console output for errors.'
            // You can add notifications for failures here.
        }
    }
}