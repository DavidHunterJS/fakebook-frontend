pipeline {
    agent any
    environment {
        HEROKU_APP_NAME = 'fakebook-frontend'
        HEROKU_API_KEY = credentials('HEROKU_API_KEY')  // Correct credential ID
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
                        set -x
                        # Temporarily remove set -e to see all errors
                        # set -e

                        echo "Step 1: Setting up SSH directory..."
                        mkdir -p /var/lib/jenkins/.ssh
                        chmod 700 /var/lib/jenkins/.ssh
                        
                        echo "Step 2: Preparing known_hosts file..."
                        touch /var/lib/jenkins/.ssh/known_hosts
                        chmod 600 /var/lib/jenkins/.ssh/known_hosts

                        echo "Step 3: Testing network connectivity..."
                        # Check if we can reach heroku.com
                        ping -c 1 heroku.com || echo "Ping failed, but continuing..."
                        
                        echo "Step 4: Adding Heroku to known_hosts..."
                        # Try with timeout and verbose mode
                        ssh-keyscan -v -T 10 -H heroku.com 2>&1 || echo "ssh-keyscan failed with exit code: $?"
                        
                        # Try appending to known_hosts even if it fails
                        ssh-keyscan -T 10 -H heroku.com >> /var/lib/jenkins/.ssh/known_hosts 2>&1 || true
                        
                        echo "Step 5: Check known_hosts content..."
                        cat /var/lib/jenkins/.ssh/known_hosts || echo "known_hosts is empty"
                        
                        echo "SSH directory contents:"
                        ls -lsa /var/lib/jenkins/.ssh/
                        
                        echo "Step 6: Verifying HEROKU_API_KEY is set..."
                        if [ -z "$HEROKU_API_KEY" ]; then
                            echo "ERROR: HEROKU_API_KEY is not set. Check Jenkins credentials."
                            exit 1
                        fi
                        echo "HEROKU_API_KEY is present."

                        echo "Step 7: Deployment preparation complete!"
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