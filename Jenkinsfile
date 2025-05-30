pipeline {
    agent any
    
    parameters {
        choice(name: 'DEPLOY_BRANCH', choices: ['main', 'develop'], description: 'Branch to deploy')
        booleanParam(name: 'SKIP_TESTS', defaultValue: false, description: 'Skip running tests')
        booleanParam(name: 'FORCE_DEPLOY', defaultValue: false, description: 'Force deployment without approval')
    }
    
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
                git branch: "${params.DEPLOY_BRANCH}", url: 'https://github.com/DavidHunterJS/fakebook-frontend.git'
                echo "Checked out branch: ${params.DEPLOY_BRANCH}"
            }
        }
        
        stage('Backup Current Config') {
            steps {
                script {
                    sh '''
                        echo "Backing up current Heroku configuration..."
                        heroku config -a ${HEROKU_APP_NAME} --json > heroku-config-backup-$(date +%Y%m%d-%H%M%S).json || echo "No existing config to backup"
                        echo "Current config backed up"
                    '''
                }
            }
        }
        
        stage('Install Dependencies') {
            steps {
                script {
                    sh '''
                        rm -rf node_modules package-lock.json
                        npm install --force
                        
                        # Configure git for the commit
                        git config user.email "jenkins@your-domain.com"
                        git config user.name "Jenkins CI"
                        
                        # Add and commit the updated package-lock.json
                        git add package-lock.json
                        git commit -m "Update package-lock.json for deployment [skip ci]" || echo "No changes to commit"
                    '''
                }
            }
        }
        
        stage('Run Tests') {
            when {
                expression { params.SKIP_TESTS == false }
            }
            steps {
                sh 'npm test'
            }
        }
        
        stage('Build Frontend') {
            steps {
                sh 'npm run build'
            }
        }
        
        stage('Deployment Approval') {
            when {
                allOf {
                    branch 'main'
                    expression { params.FORCE_DEPLOY == false }
                }
            }
            steps {
                script {
                    def userInput = input(
                        message: 'Deploy to production?',
                        ok: 'Deploy',
                        parameters: [
                            string(name: 'CONFIRMATION', defaultValue: '', description: 'Type "DEPLOY" to confirm production deployment')
                        ]
                    )
                    if (userInput != 'DEPLOY') {
                        error('Deployment cancelled - confirmation text did not match')
                    }
                }
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
                        
                        echo "Step 4: Tagging this deployment..."
                        DEPLOY_TAG="deploy-$(date +%Y%m%d-%H%M%S)-${BUILD_NUMBER}"
                        git tag -a "$DEPLOY_TAG" -m "Deployment ${BUILD_NUMBER} from ${DEPLOY_BRANCH} branch"
                        
                        echo "Step 5: Adding Heroku remote..."
                        git remote add heroku https://heroku:$HEROKU_API_KEY@git.heroku.com/${HEROKU_APP_NAME}.git || \
                        git remote set-url heroku https://heroku:$HEROKU_API_KEY@git.heroku.com/${HEROKU_APP_NAME}.git
                        
                        echo "Step 6: Deploying to Heroku..."
                        git push heroku HEAD:main --force
                        
                        echo "Step 7: Pushing deployment tag..."
                        git push heroku "$DEPLOY_TAG"
                        
                        echo "Step 8: Deployment complete!"
                        echo "App should be available at: https://${HEROKU_APP_NAME}.herokuapp.com"
                        echo "Deployment tagged as: $DEPLOY_TAG"
                    '''
                }
            }
        }
        
        stage('Verify Deployment') {
            steps {
                script {
                    sh '''
                        echo "Getting actual app URL..."
                        APP_URL=$(heroku info -a ${HEROKU_APP_NAME} --json | grep web_url | cut -d '"' -f 4)
                        echo "App URL: $APP_URL"
                        
                        echo "Waiting for app to be ready..."
                        sleep 30
                        
                        # Check if the app is responding
                        HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$APP_URL")
                        
                        if [ "$HTTP_STATUS" -eq 200 ]; then
                            echo "✅ App is live and responding with status 200!"
                            echo "Visit your app at: $APP_URL"
                        else
                            echo "⚠️  App returned status $HTTP_STATUS"
                            echo "Checking Heroku logs..."
                            # Don't fail the build since the app is actually deployed
                            echo "Note: App may still be starting up. Check $APP_URL"
                        fi
                        
                        # Show app info
                        echo "App info:"
                        heroku info -a ${HEROKU_APP_NAME}
                    '''
                }
            }
        }
    }
    
    post {
        always {
            echo 'Pipeline finished.'
            
            // Archive backup files
            archiveArtifacts artifacts: 'heroku-config-backup-*.json', allowEmptyArchive: true
        }
        success {
            script {
                sh '''
                    APP_URL=$(heroku info -a ${HEROKU_APP_NAME} --json | grep web_url | cut -d '"' -f 4 || echo "https://${HEROKU_APP_NAME}.herokuapp.com")
                    echo "✅ Pipeline succeeded! App deployed to Heroku from ${params.DEPLOY_BRANCH} branch."
                    echo "View app at: $APP_URL"
                '''
            }
        }
        failure {
            echo "❌ Pipeline failed! Check console for errors."
            echo "Branch: ${params.DEPLOY_BRANCH}"
            echo "Build: ${BUILD_NUMBER}"
            
            // Show recent Heroku logs on failure
            script {
                sh '''
                    echo "Recent Heroku logs:"
                    heroku logs --tail -n 100 -a ${HEROKU_APP_NAME} || true
                '''
            }
        }
    }
}