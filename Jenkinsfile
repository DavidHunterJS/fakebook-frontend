pipeline {
    agent any
    environment {
        HEROKU_APP_NAME = 'fakebook-frontend'
        HEROKU_API_KEY = credentials('HRKU-818f997e-100f-4f98-867e-a10ddb680222')
    }
    tools {
        nodejs 'NodeJS_18_on_EC2'
    }
    stages {
        stage('Checkout Code') {
            steps {
                git branch: 'main', url: 'https://github.com/DavidHunterJS/fakebook-frontend.git'
            }
        }
        stage('Install Dependencies') {
            steps {
                script {
                    sh 'rm -rf node_modules package-lock.json'
                    sh 'npm install heroku --save-dev'
                    sh 'npm install --force'
                }
            }
        }
        stage('Run Tests') {
            steps {
                sh 'npm test'
            }
        }
        stage('Build Frontend') {
            steps {
                sh 'npm run build'
            }
        }
    stage('Deploy to Heroku') {
        steps {
            script {
                echo 'Deploying to Heroku...'
                sh '''
                    set -x # Prints commands before execution (you already have this effect)
                    set -e # Exits immediately if a command exits with a non-zero status

                    echo "Step 1: Setting up SSH directory..."
                    mkdir -p /var/lib/jenkins/.ssh
                    chmod 700 /var/lib/jenkins/.ssh
                    
                    echo "Step 2: Preparing known_hosts file..."
                    # Ensure known_hosts is a file and writable (optional, but good for safety)
                    touch /var/lib/jenkins/.ssh/known_hosts
                    chmod 600 /var/lib/jenkins/.ssh/known_hosts

                    echo "Step 3: Attempting to add Heroku to known_hosts..."
                    # Try running ssh-keyscan with verbose output and capture stderr
                    # Remove the redirection (>>) for a moment to see if ssh-keyscan itself prints an error
                    ssh-keyscan -v -H heroku.com 
                    # If the above works (prints keys), then try with redirection again,
                    # explicitly checking the exit code:
                    
                    # ssh-keyscan -H heroku.com >> /var/lib/jenkins/.ssh/known_hosts
                    # if [ $? -ne 0 ]; then
                    #   echo "ERROR: ssh-keyscan command failed!"
                    #   exit 1
                    # fi
                    # echo "ssh-keyscan command seems to have succeeded."

                    # --- Your subsequent deployment commands ---
                    echo "Step 4: Verifying HEROKU_API_KEY is set..."
                    if [ -z "$HEROKU_API_KEY" ]; then
                        echo "ERROR: HEROKU_API_KEY is not set. Check Jenkins credentials."
                        exit 1
                    fi
                    echo "HEROKU_API_KEY is present."

                    echo "Step 5: Your actual deployment command(s)..."
                    # Example: node_modules/.bin/heroku apps --all 
                '''
            }
        }
    }
    }
    post {
        always {
            echo 'Pipeline finished.'
        }
        success {
            echo 'Pipeline succeeded! App deployed to Heroku.'
        }
        failure {
            echo 'Pipeline failed! Check console for errors.'
        }
    }
}