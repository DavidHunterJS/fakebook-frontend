pipeline {
    agent any
    
    parameters {
        choice(name: 'ENVIRONMENT', choices: ['dev', 'staging', 'production'], description: 'Deploy to which environment?')
        string(name: 'DEPLOY_BRANCH', defaultValue: '${env.BRANCH_NAME}', description: 'Branch to deploy (e.g., main, develop, feature/user-auth)')
        booleanParam(name: 'SKIP_TESTS', defaultValue: false, description: 'Skip running tests')
        booleanParam(name: 'FORCE_DEPLOY', defaultValue: false, description: 'Force deployment without approval')
        booleanParam(name: 'CREATE_FEATURE_APP', defaultValue: false, description: 'Create ephemeral Heroku app for feature branches')
    }
    
    environment {
        // Dynamic app name based on environment
        HEROKU_APP_NAME = "${params.ENVIRONMENT == 'production' ? 'fakebook-frontend' : 'fakebook-frontend-' + params.ENVIRONMENT}"
        HEROKU_API_KEY = credentials('HEROKU_API_KEY')
        DEPLOY_ENV = "${params.ENVIRONMENT}"
        ORIGINAL_APP_NAME = "${HEROKU_APP_NAME}"
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
                
                script {
                    // Display GitFlow branch type
                    def branch = params.DEPLOY_BRANCH
                    if (branch.startsWith('feature/')) {
                        echo "🚀 Feature branch deployment"
                    } else if (branch.startsWith('release/')) {
                        echo "📦 Release branch deployment"
                    } else if (branch.startsWith('hotfix/')) {
                        echo "🔥 Hotfix branch deployment"
                    } else if (branch == 'develop') {
                        echo "🔧 Development branch deployment"
                    } else if (branch == 'main' || branch == 'master') {
                        echo "🏭 Production branch deployment"
                    } else {
                        echo "📌 Custom branch deployment"
                    }
                }
            }
        }
        
        stage('Validate GitFlow Rules') {
            steps {
                script {
                    def branch = params.DEPLOY_BRANCH
                    def env = params.ENVIRONMENT
                    
                    // GitFlow validation rules
                    if (env == 'production') {
                        if (!branch.matches('main|master|hotfix/.*|release/.*')) {
                            error("❌ Production can only be deployed from main, release/*, or hotfix/* branches")
                        }
                    } else if (env == 'staging') {
                        if (!branch.matches('develop|release/.*|hotfix/.*')) {
                            if (!params.FORCE_DEPLOY) {
                                error("❌ Staging typically deploys from develop, release/*, or hotfix/* branches. Use FORCE_DEPLOY to override.")
                            } else {
                                echo "⚠️  WARNING: Force deploying ${branch} to staging"
                            }
                        }
                    } else if (env == 'dev') {
                        // Dev can deploy any branch - useful for feature testing
                        echo "✅ Dev environment accepts all branches"
                    }
                    
                    echo "✅ GitFlow validation passed: ${branch} → ${env}"
                }
            }
        }
        
        stage('Checkout Code') {
            steps {
                git branch: "${params.DEPLOY_BRANCH}", url: 'https://github.com/DavidHunterJS/fakebook-frontend.git'
                echo "Checked out branch: ${params.DEPLOY_BRANCH}"
            }
        }
        
        stage('GitFlow Compliance Check') {
            steps {
                script {
                    def branch = params.DEPLOY_BRANCH
                    
                    // Ensure feature branches are created from develop
                    if (branch.startsWith('feature/')) {
                        sh """
                            git fetch origin develop
                            if ! git merge-base --is-ancestor origin/develop HEAD; then
                                echo "⚠️  Warning: Feature branch not based on develop - this may cause integration issues"
                            else
                                echo "✅ Feature branch correctly based on develop"
                            fi
                        """
                    }
                    
                    // Ensure hotfixes are created from main
                    if (branch.startsWith('hotfix/')) {
                        sh """
                            git fetch origin main
                            if ! git merge-base --is-ancestor origin/main HEAD; then
                                echo "❌ Error: Hotfix must be based on main branch"
                                exit 1
                            else
                                echo "✅ Hotfix correctly based on main"
                            fi
                        """
                    }
                    
                    // Ensure release branches are created from develop
                    if (branch.startsWith('release/')) {
                        sh """
                            git fetch origin develop
                            if ! git merge-base --is-ancestor origin/develop HEAD; then
                                echo "⚠️  Warning: Release branch not based on develop"
                            else
                                echo "✅ Release branch correctly based on develop"
                            fi
                        """
                    }
                }
            }
        }
        
        stage('Create Feature Environment') {
            when {
                allOf {
                    expression { params.DEPLOY_BRANCH.startsWith('feature/') }
                    expression { params.CREATE_FEATURE_APP == true }
                    expression { params.ENVIRONMENT == 'dev' }
                }
            }
            steps {
                script {
                    def featureName = params.DEPLOY_BRANCH.replace('feature/', '').replaceAll('[^a-zA-Z0-9-]', '-').toLowerCase()
                    env.HEROKU_APP_NAME = "fakebook-ft-${featureName}".take(30) // Heroku app names have a 30 char limit
                    
                    sh """
                        echo "Creating ephemeral app for feature branch: ${env.HEROKU_APP_NAME}"
                        
                        # Create app if it doesn't exist
                        if ! heroku apps:info -a ${env.HEROKU_APP_NAME} &> /dev/null; then
                            heroku create ${env.HEROKU_APP_NAME} || echo "App creation failed - may already exist"
                            echo "✅ Created new feature app: ${env.HEROKU_APP_NAME}"
                        else
                            echo "ℹ️  Feature app already exists: ${env.HEROKU_APP_NAME}"
                        fi
                        
                        # Tag this as a feature app for cleanup
                        heroku config:set APP_TYPE=feature -a ${env.HEROKU_APP_NAME}
                        heroku config:set FEATURE_BRANCH=${params.DEPLOY_BRANCH} -a ${env.HEROKU_APP_NAME}
                    """
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
                        if [ "${DEPLOY_ENV}" = "production" ]; then
                            echo "NEXT_PUBLIC_API_URL=https://fakebook-backend-a2a77a290552.herokuapp.com" > .env.production
                            echo "NODE_ENV=production" >> .env.production
                        elif [ "${DEPLOY_ENV}" = "staging" ]; then
                            echo "NEXT_PUBLIC_API_URL=https://fakebook-backend-staging.herokuapp.com" > .env.production
                            echo "NODE_ENV=staging" >> .env.production
                        else
                            # Dev environment
                            echo "NEXT_PUBLIC_API_URL=https://fakebook-backend-dev.herokuapp.com" > .env.production
                            echo "NODE_ENV=development" >> .env.production
                        fi
                        
                        # Add branch info for non-production environments
                        if [ "${DEPLOY_ENV}" != "production" ]; then
                            echo "NEXT_PUBLIC_DEPLOY_BRANCH=${DEPLOY_BRANCH}" >> .env.production
                            echo "NEXT_PUBLIC_BUILD_NUMBER=${BUILD_NUMBER}" >> .env.production
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
                anyOf {
                    allOf {
                        expression { params.ENVIRONMENT == 'production' }
                        expression { params.FORCE_DEPLOY == false }
                    }
                    allOf {
                        expression { params.DEPLOY_BRANCH.startsWith('hotfix/') }
                        expression { params.FORCE_DEPLOY == false }
                    }
                }
            }
            steps {
                script {
                    def message = params.ENVIRONMENT == 'production' ? 
                        "Deploy to PRODUCTION?" : 
                        "Deploy HOTFIX to ${params.ENVIRONMENT}?"
                    
                    def userInput = input(
                        message: message,
                        ok: 'Deploy',
                        parameters: [
                            string(name: 'CONFIRMATION', defaultValue: '', description: 'Type "DEPLOY" to confirm deployment')
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
                        BRANCH_SAFE=$(echo "${DEPLOY_BRANCH}" | sed 's/[^a-zA-Z0-9-]/-/g')
                        FULL_TAG="${DEPLOY_TAG}-${BRANCH_SAFE}"
                        git tag -a "$FULL_TAG" -m "${DEPLOY_ENV} deployment ${BUILD_NUMBER} from ${DEPLOY_BRANCH} branch"
                        
                        echo "Step 5: Adding Heroku remote..."
                        git remote add heroku https://heroku:$HEROKU_API_KEY@git.heroku.com/${HEROKU_APP_NAME}.git || \
                        git remote set-url heroku https://heroku:$HEROKU_API_KEY@git.heroku.com/${HEROKU_APP_NAME}.git
                        
                        echo "Step 6: Deploying to Heroku ${DEPLOY_ENV}..."
                        # Add environment files to git temporarily for deployment
                        git add -f .env.production
                        git commit -m "Add ${DEPLOY_ENV} environment config [skip ci]" || echo "No env changes"
                        
                        git push heroku HEAD:main --force
                        
                        echo "Step 7: Pushing deployment tag..."
                        git push heroku "$FULL_TAG"
                        
                        echo "Step 8: Setting deployment metadata..."
                        heroku config:set DEPLOY_BRANCH="${DEPLOY_BRANCH}" -a ${HEROKU_APP_NAME}
                        heroku config:set DEPLOY_TAG="${FULL_TAG}" -a ${HEROKU_APP_NAME}
                        heroku config:set DEPLOY_TIME="$(date -u +%Y-%m-%dT%H:%M:%SZ)" -a ${HEROKU_APP_NAME}
                        
                        echo "Step 9: Deployment complete!"
                        echo "${DEPLOY_ENV} app should be available at: https://${HEROKU_APP_NAME}.herokuapp.com"
                        echo "Deployment tagged as: $FULL_TAG"
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
                        
                        # Show recent logs for debugging
                        echo "Recent app logs:"
                        heroku logs --tail -n 50 -a ${HEROKU_APP_NAME} || echo "Could not fetch logs"
                    '''
                }
            }
        }
        
        stage('Post-Deployment Tasks') {
            when {
                expression { params.DEPLOY_BRANCH.startsWith('release/') && params.ENVIRONMENT == 'staging' }
            }
            steps {
                echo "📋 Release branch deployed to staging - Ready for QA"
                echo "Next steps:"
                echo "1. Perform QA testing on staging"
                echo "2. If approved, merge to main"
                echo "3. Deploy main to production"
                echo "4. Merge back to develop"
            }
        }
    }
    
    post {
        always {
            echo "Pipeline finished for ${DEPLOY_ENV} environment."
            
            // Archive backup files
            archiveArtifacts artifacts: 'heroku-config-backup-*.json', allowEmptyArchive: true
            
            script {
                // Show GitFlow next steps
                def branch = params.DEPLOY_BRANCH
                if (branch.startsWith('feature/') && params.ENVIRONMENT == 'dev') {
                    echo """
                    📝 Feature Branch Next Steps:
                    1. Test your feature at the deployed URL
                    2. Create a PR to merge into develop
                    3. After merge, this feature environment can be destroyed
                    """
                } else if (branch.startsWith('hotfix/') && params.ENVIRONMENT == 'production') {
                    echo """
                    🔥 Hotfix Deployed! Next Steps:
                    1. Verify the fix in production
                    2. Merge hotfix back to both main and develop
                    3. Tag the release
                    """
                }
            }
        }
        success {
            script {
                sh """
                    APP_URL=\$(heroku info -a ${HEROKU_APP_NAME} --json | grep web_url | cut -d '"' -f 4 || echo "https://${HEROKU_APP_NAME}.herokuapp.com")
                    echo "✅ Pipeline succeeded!"
                    echo "📍 Environment: ${DEPLOY_ENV}"
                    echo "🌿 Branch: ${params.DEPLOY_BRANCH}"
                    echo "🌐 URL: \$APP_URL"
                    echo "🏷️  App Name: ${HEROKU_APP_NAME}"
                """
                
                // Feature branch cleanup reminder
                if (params.DEPLOY_BRANCH.startsWith('feature/') && params.CREATE_FEATURE_APP) {
                    echo """
                    💡 Remember: This is an ephemeral feature environment.
                    To clean up after merging, run: heroku apps:destroy -a ${HEROKU_APP_NAME}
                    """
                }
            }
        }
        failure {
            echo "❌ Pipeline failed for ${DEPLOY_ENV}!"
            echo "Branch: ${params.DEPLOY_BRANCH}"
            echo "Build: ${BUILD_NUMBER}"
            echo "Environment: ${DEPLOY_ENV}"
            echo "Check the logs above for details"
        }
    }
}