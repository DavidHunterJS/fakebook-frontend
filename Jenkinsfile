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
                        
                        echo "Step 1: Verifying HEROKU_API_KEY is set..."
                        if [ -z "$HEROKU_API_KEY" ]; then
                            echo "ERROR: HEROKU_API_KEY is not set."
                            exit 1
                        fi
                        echo "HEROKU_API_KEY is present."
                        
                        echo "Step 2: Setting up Heroku CLI..."
                        export HEROKU_API_KEY=$HEROKU_API_KEY
                        
                        # Check if Heroku CLI is available
                        if command -v heroku &> /dev/null; then
                            echo "Using system Heroku CLI"
                            HEROKU_CMD="heroku"
                        elif [ -f "node_modules/.bin/heroku" ]; then
                            echo "Using local Heroku CLI"
                            HEROKU_CMD="node_modules/.bin/heroku"
                        else
                            echo "ERROR: Heroku CLI not found!"
                            exit 1
                        fi
                        
                        echo "Step 3: Configuring git..."
                        git config user.email "jenkins@your-domain.com"
                        git config user.name "Jenkins CI"
                        
                        echo "Step 4: Adding Heroku remote..."
                        git remote add heroku https://heroku:$HEROKU_API_KEY@git.heroku.com/${HEROKU_APP_NAME}.git || \
                        git remote set-url heroku https://heroku:$HEROKU_API_KEY@git.heroku.com/${HEROKU_APP_NAME}.git
                        
                        echo "Step 5: Deploying to Heroku..."
                        git push heroku main --force
                        
                        echo "Step 6: Deployment complete!"
                        echo "App should be available at: https://${HEROKU_APP_NAME}.herokuapp.com"
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