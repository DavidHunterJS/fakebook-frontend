pipeline {
    agent any
    environment {
        HEROKU_APP_NAME = 'fakebook-frontend'
        HEROKU_API_KEY = credentials('HEROKU_API_KEY')
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
                    sh 'mkdir -p ~/.ssh && chmod 700 ~/.ssh'
                    sh 'ssh-keyscan -v -H heroku.com >> ~/.ssh/known_hosts'
                    sh 'chmod 600 ~/.ssh/known_hosts'
                    sh 'npx heroku git:remote -a ${HEROKU_APP_NAME}'
                    sh 'git push https://heroku:${HEROKU_API_KEY}@git.heroku.com/${HEROKU_APP_NAME}.git HEAD:main -f'
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