pipeline {
    agent any
    
    parameters {
        choice(name: 'ENVIRONMENT', choices: ['staging', 'production'], description: 'Deploy to which environment?')
        string(name: 'DEPLOY_BRANCH', defaultValue: 'develop', description: 'Explicit branch name to deploy (e.g. feature/my-branch)')         booleanParam(name: 'SKIP_TESTS', defaultValue: false, description: 'Skip running tests')
        booleanParam(name: 'FORCE_DEPLOY', defaultValue: false, description: 'Force deployment without approval')
        booleanParam(name: 'CREATE_FEATURE_APP', defaultValue: false, description: 'Create ephemeral Heroku app for feature branches')
    }
    
    environment {
        // Dynamic app name based on environment
        HEROKU_APP_NAME = "${params.ENVIRONMENT == 'staging' ? 'fakebook-frontend-staging' : 'fakebook-frontend'}"
        HEROKU_API_KEY = credentials('HEROKU_API_KEY')
        // For CI/CD clarity
        DEPLOY_ENV = "${params.ENVIRONMENT}"
    }
    
    tools {
        nodejs 'NodeJS_18_on_EC2'
    }
    
    stages {
        stage('Environment Info') {
            steps {
                echo "🎯 Deploying to: ${params.ENVIRONMENT}"
                echo "📦 Heroku app: ${HEROKU_APP_NAME}"
                echo "🌿 Branch: ${params.DEPLOY_BRANCH}"
                echo "🔨 Build: ${BUILD_NUMBER}"
                
                // Validate branch/environment combination
                script {
                    if (params.ENVIRONMENT == 'production' && params.DEPLOY_BRANCH != 'main') {
                        echo "⚠️  WARNING: Deploying non-main branch to production!"
                    }
                    if (params.ENVIRONMENT == 'staging' && params.DEPLOY_BRANCH == 'main') {
                        echo "ℹ️  INFO: Deploying main branch to staging"
                    }
                }
            }
        }
        
        stage('Checkout Code') {
            steps {
                script {
                    // Get branch from webhook trigger or parameter
                    def branch = env.GIT_BRANCH ?: params.DEPLOY_BRANCH
                    
                    // Fallback to develop if still not resolved
                    branch = branch ?: 'develop'
                    
                    // Clean branch name
                    branch = branch.replaceAll('origin/', '').replaceAll('refs/heads/', '')
                    
                    echo "Resolved branch: ${branch}"
                    
                    checkout([
                        $class: 'GitSCM',
                        branches: [[name: branch]],
                        extensions: [[$class: 'LocalBranch']],
                        userRemoteConfigs: [[
                            url: 'https://github.com/DavidHunterJS/fakebook-frontend.git',
                            credentialsId: 'your-github-credentials' // Add this line
                        ]]
                    ])
                }
            }
        }
        
        stage('Backup Current Config') {
            steps {
                script {
                    sh '''
                        echo "Backing up current Heroku configuration..."
                        heroku config -a ${HEROKU_APP_NAME} --json > heroku-config-backup-${DEPLOY_ENV}-$(date +%Y%m%d-%H%M%S).json || echo "No existing config to backup"
                        echo "Current config backed up for ${DEPLOY_ENV}"
                    '''
                }
            }
        }
        
        stage('Install Dependencies') {
            steps {
                script {
                    sh '''
                        # Only reinstall if package.json changed
                        if [ ! -d "node_modules" ] || [ package.json -nt node_modules ]; then
                            npm ci
                        else
                            echo "Using cached node_modules"
                        fi
                        
                        # Configure git for the commit
                        git config user.email "lazer@trippy.wtf"
                        git config user.name "Jenkins CI"
                        
                        # Add and commit the updated package-lock.json
                        git add package-lock.json
                        git commit -m "Update package-lock.json for ${DEPLOY_ENV} deployment [skip ci]" || echo "No changes to commit"
                    '''
                }
            }
        }
        
        stage('Configure Environment') {
            steps {
                script {
                    sh '''
                        echo "Configuring for ${DEPLOY_ENV} environment..."
                        
                        # Set environment-specific API URL
                        if [ "${DEPLOY_ENV}" = "staging" ]; then
                            echo "NEXT_PUBLIC_API_URL=https://fakebook-backend-staging.herokuapp.com" > .env.production
                            echo "NODE_ENV=staging" >> .env.production
                        else
                            echo "NEXT_PUBLIC_API_URL=https://fakebook-backend-a2a77a290552.herokuapp.com" > .env.production
                            echo "NODE_ENV=production" >> .env.production
                        fi
                        
                        echo "Environment configured for ${DEPLOY_ENV}"
                        cat .env.production
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
                sh '''
                    echo "Building for ${DEPLOY_ENV}..."
                    npm run build
                '''
            }
        }
        
        stage('Deployment Approval') {
            when {
                allOf {
                    expression { params.ENVIRONMENT == 'production' }
                    expression { params.FORCE_DEPLOY == false }
                }
            }
            steps {
                script {
                    def userInput = input(
                        message: "Deploy to PRODUCTION?",
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
                    echo "Deploying to ${DEPLOY_ENV}..."
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
                        DEPLOY_TAG="${DEPLOY_ENV}-deploy-$(date +%Y%m%d-%H%M%S)-${BUILD_NUMBER}"
                        git tag -a "$DEPLOY_TAG" -m "${DEPLOY_ENV} deployment ${BUILD_NUMBER} from ${DEPLOY_BRANCH} branch"
                        
                        echo "Step 5: Adding Heroku remote..."
                        git remote add heroku https://heroku:$HEROKU_API_KEY@git.heroku.com/${HEROKU_APP_NAME}.git || \
                        git remote set-url heroku https://heroku:$HEROKU_API_KEY@git.heroku.com/${HEROKU_APP_NAME}.git
                        
                        echo "Step 6: Deploying to Heroku ${DEPLOY_ENV}..."
                        # Add environment files to git temporarily for deployment
                        git add .env.production
                        git commit -m "Add ${DEPLOY_ENV} environment config [skip ci]" || echo "No env changes"
                        
                        git push heroku HEAD:main --force
                        
                        echo "Step 7: Pushing deployment tag..."
                        git push heroku "$DEPLOY_TAG"
                        
                        echo "Step 8: Deployment complete!"
                        echo "${DEPLOY_ENV} app should be available at: https://${HEROKU_APP_NAME}.herokuapp.com"
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
                        echo "${DEPLOY_ENV} App URL: $APP_URL"
                        
                        echo "Waiting for app to be ready..."
                        sleep 30
                        
                        # Check if the app is responding
                        HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$APP_URL")
                        
                        if [ "$HTTP_STATUS" -eq 200 ]; then
                            echo "✅ ${DEPLOY_ENV} app is live and responding with status 200!"
                            echo "Visit your ${DEPLOY_ENV} app at: $APP_URL"
                        else
                            echo "⚠️  ${DEPLOY_ENV} app returned status $HTTP_STATUS"
                            # Don't fail the build since the app is actually deployed
                            echo "Note: App may still be starting up. Check $APP_URL"
                        fi
                        
                        # Show app info
                        echo "${DEPLOY_ENV} app info:"
                        heroku info -a ${HEROKU_APP_NAME}
                    '''
                }
            }
        }
    }
    
    post {
        always {
            echo "Pipeline finished for ${DEPLOY_ENV} environment."
            
            // Archive backup files
            archiveArtifacts artifacts: 'heroku-config-backup-*.json', allowEmptyArchive: true
        }
        success {
            script {
                sh """
                    APP_URL=\$(heroku info -a ${HEROKU_APP_NAME} --json | grep web_url | cut -d '"' -f 4 || echo "https://${HEROKU_APP_NAME}.herokuapp.com")
                    echo "✅ Pipeline succeeded!"
                    echo "📍 Environment: ${DEPLOY_ENV}"
                    echo "🌿 Branch: ${params.DEPLOY_BRANCH}"
                    echo "🌐 URL: \$APP_URL"
                """
            }
        }
        failure {
            echo "❌ Pipeline failed for ${DEPLOY_ENV}!"
            echo "Branch: ${params.DEPLOY_BRANCH}"
            echo "Build: ${BUILD_NUMBER}"
            echo "Environment: ${DEPLOY_ENV}"
        }
    }
}