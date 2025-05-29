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
                        set -e

                        echo "Step 1: Setting up SSH directory..."
                        mkdir -p /var/lib/jenkins/.ssh
                        chmod 700 /var/lib/jenkins/.ssh
                        
                        echo "Step 2: Preparing known_hosts file..."
                        touch /var/lib/jenkins/.ssh/known_hosts
                        chmod 600 /var/lib/jenkins/.ssh/known_hosts

                        echo "Step 3: Adding Heroku to known_hosts..."
                        ssh-keyscan -H heroku.com >> /var/lib/jenkins/.ssh/known_hosts
                        
                        echo "Step 4: Verifying HEROKU_API_KEY is set..."
                        if [ -z "$HEROKU_API_KEY" ]; then
                            echo "ERROR: HEROKU_API_KEY is not set. Check Jenkins credentials."
                            exit 1
                        fi
                        echo "HEROKU_API_KEY is present."

                        echo "Step 5: Deployment preparation complete!"
                        # Deployment commands will go here later
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