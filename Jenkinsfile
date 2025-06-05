pipeline {
    agent any
    
    parameters {
        choice(name: 'ENVIRONMENT', choices: ['dev', 'staging', 'production'], description: 'Deploy to which environment?')
        string(name: 'DEPLOY_BRANCH', defaultValue: 'develop', description: 'Explicit branch name to deploy (e.g. feature/my-branch)')
        booleanParam(name: 'SKIP_TESTS', defaultValue: false, description: 'Skip running tests')
        booleanParam(name: 'FORCE_DEPLOY', defaultValue: false, description: 'Force deployment without approval')
        booleanParam(name: 'CREATE_FEATURE_APP', defaultValue: false, description: 'Create ephemeral Heroku app for feature branches')
    }
    
    environment {
        HEROKU_API_KEY = credentials('HEROKU_API_KEY') // Ensure this credential ID is correct in Jenkins
        DEPLOY_ENV = "${params.ENVIRONMENT}"
        // ORIGINAL_APP_NAME and HEROKU_APP_NAME will be fully defined in Initialize stage
        // BRANCH_NAME also superseded by RESOLVED_BRANCH from Initialize stage
    }
    
    tools {
        nodejs 'NodeJS_18_on_EC2' // Ensure this Node.js installation is configured in Jenkins Global Tool Configuration
    }
    
    stages {
        stage('Initialize') {
            steps {
                script {
                    // ... (your existing branch resolution logic to set env.RESOLVED_BRANCH) ...
                    echo "✅ Resolved branch for this build: ${env.RESOLVED_BRANCH}"

                    // --- Determine DEPLOY_ENV based on resolved branch if webhook triggered ---
                    // For webhook triggers, params.ENVIRONMENT will be its default ('dev')
                    // We want to override it based on the actual branch for standard flows.
                    def determinedEnv = params.ENVIRONMENT // Start with parameter default
                    if (env.RESOLVED_BRANCH == 'main' || env.RESOLVED_BRANCH == 'master') {
                        determinedEnv = 'production'
                    } else if (env.RESOLVED_BRANCH == 'develop') {
                        determinedEnv = 'staging' // Or 'dev', depending on your flow for develop
                    } else if (env.RESOLVED_BRANCH.startsWith('feature/')) {
                        determinedEnv = 'dev'
                    }
                    // If it was a manual build and user selected something else, that will take precedence
                    // if params.ENVIRONMENT was not 'dev' (the default).
                    // This logic primarily helps set the right env for webhook-triggered builds.

                    env.DEPLOY_ENV = determinedEnv // Update DEPLOY_ENV

                    // --- Dynamic Heroku App Name Setup ---
                    env.ORIGINAL_APP_NAME = (determinedEnv == 'production' ? 
                                                'fakebook-frontend' : 
                                                "fakebook-frontend-${determinedEnv}")
                    env.HEROKU_APP_NAME = env.ORIGINAL_APP_NAME 

                    if (env.RESOLVED_BRANCH.startsWith('feature/') && params.CREATE_FEATURE_APP == true && determinedEnv == 'dev') {
                        def featureNameSanitized = env.RESOLVED_BRANCH.replace('feature/', '').replaceAll('[^a-zA-Z0-9-]', '-').toLowerCase()
                        env.HEROKU_APP_NAME = "fakebook-ft-${featureNameSanitized}".take(30)
                        echo "ℹ️  Feature branch will target dynamically named Heroku app: ${env.HEROKU_APP_NAME}"
                    } else {
                        echo "ℹ️  Branch will target Heroku app: ${env.HEROKU_APP_NAME} for environment ${determinedEnv}"
                    }
                }
            }
        }
        
        stage('Environment Info') {
            steps {
                script {
                    echo "🎯 Deploying to: ${params.ENVIRONMENT}"
                    echo "📦 Heroku app: ${env.HEROKU_APP_NAME}"
                    echo "🌿 Branch: ${env.RESOLVED_BRANCH}"
                    echo "🔨 Build: ${BUILD_NUMBER}"
                    
                    def branch = env.RESOLVED_BRANCH
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
                        echo "📌 Custom branch deployment: ${branch}"
                    }
                }
            }
        }
        
        stage('Validate GitFlow Rules') {
            steps {
                script {
                    def branch = env.RESOLVED_BRANCH
                    def env_param = params.ENVIRONMENT
                    
                    if (env_param == 'production') {
                        if (!branch.matches('main|master|hotfix/.*|release/.*')) {
                            error("❌ Production can only be deployed from main, release/*, or hotfix/* branches. Branch was: ${branch}")
                        }
                    } else if (env_param == 'staging') {
                        if (!branch.matches('develop|release/.*|hotfix/.*')) {
                            if (!params.FORCE_DEPLOY) {
                                error("❌ Staging typically deploys from develop, release/*, or hotfix/* branches. Use FORCE_DEPLOY to override. Branch was: ${branch}")
                            } else {
                                echo "⚠️  WARNING: Force deploying ${branch} to staging"
                            }
                        }
                    } else if (env_param == 'dev') {
                        echo "✅ Dev environment accepts all branches (currently: ${branch})"
                    }
                    
                    echo "✅ GitFlow validation passed: ${branch} → ${env_param}"
                }
            }
        }   
        
        stage('Checkout Code') {
            steps {
                echo "✅ Code for branch '${env.RESOLVED_BRANCH}' should already be checked out in workspace: ${env.WORKSPACE}"
                sh "echo 'Current git branch in workspace:'; git branch --show-current || git symbolic-ref --short HEAD"
            }
        }
        
        stage('GitFlow Compliance Check') {
            steps {
                script {
                    def branch = env.RESOLVED_BRANCH
                    
                    if (branch.startsWith('feature/')) {
                        sh """
                            git fetch origin develop --depth=100000 || echo "Could not fetch develop, proceeding with caution"
                            if ! git merge-base --is-ancestor origin/develop HEAD; then
                                echo "⚠️  Warning: Feature branch '${branch}' may not be based on 'origin/develop'. This might cause integration issues."
                            else
                                echo "✅ Feature branch '${branch}' correctly based on 'origin/develop'"
                            fi
                        """
                    }
                    if (branch.startsWith('hotfix/')) {
                        sh """
                            git fetch origin main --depth=100000 || echo "Could not fetch main, proceeding with caution"
                            if ! git merge-base --is-ancestor origin/main HEAD; then
                                echo "❌ Error: Hotfix branch '${branch}' must be based on 'origin/main'."
                                currentBuild.result = 'FAILURE' // Mark build as failed
                                exit 1 // Exit shell script with error
                            else
                                echo "✅ Hotfix branch '${branch}' correctly based on 'origin/main'"
                            fi
                        """
                    }
                    if (branch.startsWith('release/')) {
                        sh """
                            git fetch origin develop --depth=100000 || echo "Could not fetch develop, proceeding with caution"
                            if ! git merge-base --is-ancestor origin/develop HEAD; then
                                echo "⚠️  Warning: Release branch '${branch}' may not be based on 'origin/develop'."
                            else
                                echo "✅ Release branch '${branch}' correctly based on 'origin/develop'"
                            fi
                        """
                    }
                }
            }
        }
        
        stage('Create Feature Environment') {
            when {
                allOf {
                    expression { env.RESOLVED_BRANCH.startsWith('feature/') }
                    expression { params.CREATE_FEATURE_APP == true }
                    expression { params.ENVIRONMENT == 'dev' }
                }
            }
            steps {
                script {
                    // HEROKU_APP_NAME for feature app is already set in Initialize stage
                    sh """
                        echo "Managing ephemeral app for feature branch: ${env.HEROKU_APP_NAME}"
                        
                        if ! heroku apps:info -a "${env.HEROKU_APP_NAME}" &> /dev/null; then
                            echo "Creating new feature Heroku app: ${env.HEROKU_APP_NAME}"
                            heroku create "${env.HEROKU_APP_NAME}" || echo "App creation failed - may already exist or name conflict."
                        else
                            echo "ℹ️  Feature app '${env.HEROKU_APP_NAME}' already exists."
                        fi
                        
                        heroku config:set APP_TYPE=feature FEATURE_BRANCH="${env.RESOLVED_BRANCH}" -a "${env.HEROKU_APP_NAME}"
                        echo "✅ Feature app '${env.HEROKU_APP_NAME}' tagged."
                    """
                }
            }
        }
        
        stage('Backup Current Config') {
            steps {
                script {
                    // Use Groovy for date formatting to avoid shell interpolation issues in file name definition
                    def GStringSafeDate = new java.text.SimpleDateFormat("yyyyMMdd-HHmmss").format(new Date())
                    def backupFileName = "heroku-config-backup-${env.HEROKU_APP_NAME}-${GStringSafeDate}.json"
                    
                    sh """
                        echo "Backing up current Heroku configuration for app: ${env.HEROKU_APP_NAME}..."
                        echo "Attempting to backup to: ${backupFileName}"
                        # Use quotes around backupFileName in case app name has spaces (though unlikely for Heroku)
                        if heroku config -a "${env.HEROKU_APP_NAME}" --json > "${backupFileName}"; then
                            echo "Current config successfully backed up to ${backupFileName} for app ${env.HEROKU_APP_NAME}"
                        else
                            echo "No existing config to backup for ${env.HEROKU_APP_NAME}, or app does not exist yet, or an error occurred."
                            # Create an empty file if backup failed, so archiveArtifacts doesn't complain
                            touch "${backupFileName}" 
                        fi
                    """
                    // Call archiveArtifacts as a Pipeline step, using the Groovy variable
                    archiveArtifacts artifacts: backupFileName, allowEmptyArchive: true 
                }
            }
        }
        
        stage('Install Dependencies') {
            steps {
                script {
                    sh '''
                        echo "Installing dependencies..."
                        if [ -f "package-lock.json" ]; then
                            if [ ! -d "node_modules" ] || [ package.json -nt node_modules ] || [ package-lock.json -nt node_modules ]; then
                                echo "Running npm ci..."
                                npm ci
                            else
                                echo "Using cached node_modules (package.json and package-lock.json not newer)"
                            fi
                        else
                            echo "package-lock.json not found, using npm install"
                            npm install
                        fi
                        
                        git config user.email "ci-builder@jenkins.invalid"
                        git config user.name "Jenkins CI"
                    '''
                }
            }
        }
        
        stage('Configure Environment') {
            steps {
                script {
                    sh '''
                        echo "Configuring frontend for ${DEPLOY_ENV} environment..."
                        echo "TARGET_API_URL based on DEPLOY_ENV: ${DEPLOY_ENV}"

                        if [ "${DEPLOY_ENV}" = "production" ]; then
                            TARGET_API_URL="https://fakebook-backend-a2a77a290552.herokuapp.com/api"
                            CURRENT_NODE_ENV="production"
                        elif [ "${DEPLOY_ENV}" = "staging" ]; then
                            TARGET_API_URL="https://fakebook-backend-staging.herokuapp.com/api"
                            CURRENT_NODE_ENV="staging" 
                        else # dev
                            TARGET_API_URL="https://fakebook-backend-dev.herokuapp.com/api"
                            CURRENT_NODE_ENV="development"
                        fi
                        
                        echo "NEXT_PUBLIC_API_URL=${TARGET_API_URL}" > .env.production
                        echo "NODE_ENV=${CURRENT_NODE_ENV}" >> .env.production
                        
                        if [ "${DEPLOY_ENV}" != "production" ]; then
                            echo "NEXT_PUBLIC_DEPLOY_BRANCH=${RESOLVED_BRANCH}" >> .env.production
                            echo "NEXT_PUBLIC_BUILD_NUMBER=${BUILD_NUMBER}" >> .env.production
                        fi
                        
                        echo "Generated .env.production for ${DEPLOY_ENV}:"
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
                    echo "Building frontend for ${DEPLOY_ENV}..."
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
                        expression { env.RESOLVED_BRANCH.startsWith('hotfix/') }
                        expression { params.FORCE_DEPLOY == false }
                    }
                }
            }
            steps {
                script {
                    def message = "Deploy branch '${env.RESOLVED_BRANCH}' to ${params.ENVIRONMENT.toUpperCase()} environment?"
                    if (params.ENVIRONMENT == 'production' || env.RESOLVED_BRANCH.startsWith('hotfix/')) {
                         message = params.ENVIRONMENT == 'production' ? 
                            "Deploy branch '${env.RESOLVED_BRANCH}' to PRODUCTION?" : 
                            "Deploy HOTFIX branch '${env.RESOLVED_BRANCH}' to ${params.ENVIRONMENT.toUpperCase()}?"
                    }
                    
                    def userInput = input(
                        message: message,
                        ok: 'Deploy Now',
                        parameters: [
                            string(name: 'CONFIRMATION', defaultValue: '', description: 'Type "DEPLOY" to confirm deployment')
                        ]
                    )
                    if (userInput.trim().toUpperCase() != 'DEPLOY') {
                        error('Deployment cancelled - confirmation text did not match "DEPLOY".')
                    }
                }
            }
        }
        
        stage('Deploy to Heroku') {
            steps {
                script {
                    echo "Deploying branch '${env.RESOLVED_BRANCH}' to Heroku app '${env.HEROKU_APP_NAME}' (${DEPLOY_ENV})..."
                    sh '''
                        set -x 
                        set -e 
                        
                        echo "Step 1: Verifying HEROKU_API_KEY is set..."
                        if [ -z "$HEROKU_API_KEY" ]; then
                            echo "ERROR: HEROKU_API_KEY environment variable is not set."
                            exit 1
                        fi
                        echo "HEROKU_API_KEY is present."
                        
                        echo "Step 2: Ensuring Heroku CLI is available..."
                        if command -v heroku &> /dev/null; then
                            HEROKU_CMD="heroku"
                            echo "Using system Heroku CLI found in PATH."
                        elif [ -f "node_modules/.bin/heroku" ]; then
                            HEROKU_CMD="node_modules/.bin/heroku"
                            echo "Using local Heroku CLI from node_modules."
                        else
                            echo "ERROR: Heroku CLI not found. Please ensure it's installed or in PATH."
                            exit 1
                        fi
                        
                        echo "Step 3: Configuring git for Heroku deployment..."
                        git config user.email "ci-builder@jenkins.invalid"
                        git config user.name "Jenkins CI Bot"
                        
                        echo "Step 4: Creating deployment tag..."
                        BRANCH_SAFE=$(echo "${RESOLVED_BRANCH}" | tr '/' '-' | sed 's/[^a-zA-Z0-9-]//g')
                        # Use Groovy for date formatting to ensure consistency
                        DEPLOY_TAG_DATE_PART=$(date +%Y%m%d-%H%M%S) 
                        DEPLOY_TAG="${DEPLOY_ENV}-deploy-${DEPLOY_TAG_DATE_PART}-b${BUILD_NUMBER}-${BRANCH_SAFE}"
                        git tag -a "$DEPLOY_TAG" -m "Deployment to ${DEPLOY_ENV} from branch ${RESOLVED_BRANCH}, build ${BUILD_NUMBER}"
                        
                        echo "Step 5: Setting up Heroku git remote..."
                        HEROKU_REMOTE_NAME="heroku-${HEROKU_APP_NAME}" 
                        if git remote | grep -q "^${HEROKU_REMOTE_NAME}$"; then
                            git remote set-url ${HEROKU_REMOTE_NAME} https://heroku:$HEROKU_API_KEY@git.heroku.com/${HEROKU_APP_NAME}.git
                            echo "Updated existing Heroku remote: ${HEROKU_REMOTE_NAME}"
                        else
                            git remote add ${HEROKU_REMOTE_NAME} https://heroku:$HEROKU_API_KEY@git.heroku.com/${HEROKU_APP_NAME}.git
                            echo "Added new Heroku remote: ${HEROKU_REMOTE_NAME}"
                        fi
                        
                        echo "Step 6: Deploying current HEAD to Heroku's main branch..."
                        git add -f .env.production || echo "No .env.production file to add" 
                        if ! git diff --cached --quiet; then
                            git commit -m "CI: Add/Update .env.production for ${DEPLOY_ENV} build ${BUILD_NUMBER} [skip ci]"
                        else
                            echo "No changes to commit before Heroku push."
                        fi

                        git push ${HEROKU_REMOTE_NAME} HEAD:main --force
                        
                        echo "Step 7: Pushing deployment tag to Heroku remote..."
                        git push ${HEROKU_REMOTE_NAME} "$DEPLOY_TAG"
                        
                        echo "Step 8: Setting deployment metadata as Heroku Config Vars..."
                        $HEROKU_CMD config:set DEPLOY_BRANCH="${RESOLVED_BRANCH}" DEPLOY_TAG="${DEPLOY_TAG}" DEPLOY_TIME="$(date -u +%Y-%m-%dT%H:%M:%SZ)" -a "${HEROKU_APP_NAME}"
                        
                        echo "Step 9: Deployment to Heroku app '${HEROKU_APP_NAME}' complete!"
                        echo "Deployed version tagged as: $DEPLOY_TAG"
                        echo "App URL (approximate): https://${HEROKU_APP_NAME}.herokuapp.com"
                    '''
                }
            }
        }
        
        stage('Verify Deployment') {
            steps {
                script {
                    sh '''
                        echo "Verifying deployment of ${HEROKU_APP_NAME}..."
                        sleep 45 
                        
                        APP_URL=$(heroku info -a "${HEROKU_APP_NAME}" --json | grep web_url | cut -d '"' -f 4)
                        if [ -z "$APP_URL" ]; then
                            echo "⚠️ Could not retrieve web_url for ${HEROKU_APP_NAME}. Using default construction."
                            APP_URL="https://${HEROKU_APP_NAME}.herokuapp.com/"
                        fi
                        echo "${DEPLOY_ENV} App URL: $APP_URL"
                        
                        echo "Attempting to reach the app..."
                        HTTP_STATUS="000" # Default to error
                        for i in 1 2 3; do
                            # Ensure APP_URL is quoted if it might contain special chars, though unlikely for Heroku URLs
                            HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 10 --max-time 20 "$APP_URL")
                            echo "Attempt $i: Status $HTTP_STATUS for $APP_URL"
                            if [ "$HTTP_STATUS" -eq 200 ]; then
                                break
                            fi
                            if [ $i -lt 3 ]; then
                                echo "Retrying in 15 seconds..."
                                sleep 15
                            fi
                        done
                        
                        if [ "$HTTP_STATUS" -eq 200 ]; then
                            echo "✅ ${DEPLOY_ENV} app '${HEROKU_APP_NAME}' is live and responding with status 200!"
                            echo "Visit your ${DEPLOY_ENV} app at: $APP_URL"
                        else
                            echo "⚠️  ${DEPLOY_ENV} app '${HEROKU_APP_NAME}' returned status $HTTP_STATUS (or failed to connect) after retries."
                            echo "Please check Heroku logs for ${HEROKU_APP_NAME} for more details."
                            heroku logs -n 75 -a "${HEROKU_APP_NAME}" || echo "Could not fetch logs for ${HEROKU_APP_NAME}."
                        fi
                    '''
                }
            }
        }
        
        stage('Post-Deployment Tasks') {
            when {
                expression { env.RESOLVED_BRANCH.startsWith('release/') && params.ENVIRONMENT == 'staging' }
            }
            steps {
                echo "📋 Release branch '${env.RESOLVED_BRANCH}' deployed to staging. Ready for QA."
            }
        }
    } 
    
    post {
        always {
            echo "Pipeline finished for ${DEPLOY_ENV} environment, branch ${env.RESOLVED_BRANCH}."
            // archiveArtifacts was moved into the 'Backup Current Config' stage
        }
        success {
            script {
                sh """
                    APP_URL=\$(heroku info -a "${HEROKU_APP_NAME}" --json | grep web_url | cut -d '"' -f 4 || echo "https://${HEROKU_APP_NAME}.herokuapp.com")
                    echo "✅ Pipeline succeeded!"
                    echo "📍 Environment: ${DEPLOY_ENV}"
                    echo "🌿 Branch: ${env.RESOLVED_BRANCH}"
                    echo "🌐 URL: \$APP_URL"
                    echo "🏷️  App Name: ${HEROKU_APP_NAME}"
                """
            }
        }
        failure {
            echo "❌ Pipeline failed for ${DEPLOY_ENV}!"
            echo "Branch: ${env.RESOLVED_BRANCH ?: 'unknown'}" 
            echo "Build: ${BUILD_NUMBER}"
            echo "Environment: ${DEPLOY_ENV}"
            echo "Check the console output above for specific error details."
        }
    } 
}
