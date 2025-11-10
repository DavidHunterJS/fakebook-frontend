pipeline {
    agent any
    
    parameters {
        choice(name: 'ENVIRONMENT', choices: ['dev', 'staging', 'production'], description: 'Deploy to which environment?')
        string(name: 'DEPLOY_BRANCH', defaultValue: 'develop', description: 'Explicit branch name to deploy (e.g. feature/my-branch). For webhook triggers, this is usually overridden.')
        // booleanParam(name: 'SKIP_TESTS', defaultValue: false, description: 'Skip running tests') // <-- REMOVED
        booleanParam(name: 'FORCE_DEPLOY', defaultValue: false, description: 'Force deployment without approval')
        booleanParam(name: 'CREATE_FEATURE_APP', defaultValue: false, description: 'Create ephemeral Heroku app for feature branches')
    }
    
    environment {
        HEROKU_API_KEY = credentials('HEROKU_API_KEY') 
        // DEPLOY_ENV, HEROKU_APP_NAME, ORIGINAL_APP_NAME, RESOLVED_BRANCH will be set in Initialize
    }
    
    tools {
        nodejs 'NodeJS_22_on_EC2' 
    }
    
    stages {
        stage('Initialize') {
            steps {
                script {
                    // --- Reliable Branch Resolution ---
                    def resolvedBranchName = params.DEPLOY_BRANCH 
                    
                    if (env.GIT_BRANCH) { 
                        resolvedBranchName = env.GIT_BRANCH
                    } else if (env.BRANCH_NAME) { 
                        resolvedBranchName = env.BRANCH_NAME
                    } else if (params.DEPLOY_BRANCH == 'develop') {
                        echo "GIT_BRANCH and BRANCH_NAME env vars not found. Trying 'git branch --show-current'."
                        def gitCurrentBranchInWorkspace = sh(script: 'git branch --show-current 2>/dev/null', returnStdout: true).trim()
                        if (gitCurrentBranchInWorkspace) {
                            resolvedBranchName = gitCurrentBranchInWorkspace 
                            echo "Using branch from workspace: ${resolvedBranchName}"
                        } else {
                           echo "Could not determine branch from git command. Using DEPLOY_BRANCH parameter: ${params.DEPLOY_BRANCH}."
                           resolvedBranchName = params.DEPLOY_BRANCH
                        }
                    }
                    
                    if (resolvedBranchName) {
                        resolvedBranchName = resolvedBranchName.replaceFirst(/^origin\//, '')
                                               .replaceFirst(/^refs\/heads\//, '')
                                               .replaceFirst(/^refs\/remotes\/origin\//, '')
                    } else {
                        echo "⚠️ WARNING: Could not determine actual pushed branch name, defaulting to 'develop'."
                        resolvedBranchName = 'develop' 
                    }
                    
                    env.RESOLVED_BRANCH = resolvedBranchName
                    env.DEPLOY_BRANCH = resolvedBranchName 

                    echo "✅ Resolved branch for this build: ${env.RESOLVED_BRANCH}"

                    // --- Determine DEPLOY_ENV and HEROKU_APP_NAME based on RESOLVED_BRANCH ---
                    def determinedEnv = params.ENVIRONMENT // Start with parameter default (usually 'dev' for webhook)

                    if (env.RESOLVED_BRANCH == 'main' || env.RESOLVED_BRANCH == 'master') {
                        determinedEnv = 'production' // Force to production if main/master branch
                    } else if (env.RESOLVED_BRANCH == 'develop') {
                        determinedEnv = 'staging'    // Develop deploys to staging
                    } else if (env.RESOLVED_BRANCH.startsWith('feature/')) {
                        determinedEnv = 'dev'        // Features deploy to dev
                    }
                    // If params.ENVIRONMENT was manually set to something specific, this logic might
                    // need adjustment if manual selection should always override branch-based logic.
                    // For now, branch-based logic takes precedence for main/develop/feature.

                    env.DEPLOY_ENV = determinedEnv
                    
                    if (determinedEnv == 'production') {
                        env.HEROKU_APP_NAME = 'fakebook-frontend' // Your actual production app name
                    } else {
                        env.HEROKU_APP_NAME = "fakebook-frontend-${determinedEnv}"
                    }
                    env.ORIGINAL_APP_NAME = env.HEROKU_APP_NAME // Base for feature apps

                    echo "ℹ️  Environment set to: ${env.DEPLOY_ENV}"
                    echo "ℹ️  Target Heroku app initially: ${env.HEROKU_APP_NAME}"

                    if (env.RESOLVED_BRANCH != null && env.RESOLVED_BRANCH.startsWith('feature/') && params.CREATE_FEATURE_APP == true && env.hh_ENV == 'dev') {
                        def featureNameSanitized = env.RESOLVED_BRANCH.replace('feature/', '').replaceAll('[^a-zA-Z0-9-]', '-').toLowerCase()
                        env.HEROKU_APP_NAME = "fakebook-ft-${featureNameSanitized}".take(30)
                        echo "ℹ️  Feature branch will target dynamically named Heroku app: ${env.HEROKU_APP_NAME}"
                    } else {
                        echo "ℹ️  Build will target standard Heroku app: ${env.HEROKU_APP_NAME} for environment ${env.DEPLOY_ENV}"
                    }
                }
            }
        }
        
        // ... [Rest of your stages: Environment Info, Validate GitFlow Rules, Checkout Code, etc.] ...
        // Ensure they use env.RESOLVED_BRANCH and env.HEROKU_APP_NAME, env.DEPLOY_ENV as set in Initialize.

        stage('Environment Info') {
            steps {
                script {
                    echo "🎯 Deploying to: ${env.DEPLOY_ENV}" // Use env.DEPLOY_ENV
                    echo "📦 Heroku app: ${env.HEROKU_APP_NAME}"
                    echo "🌿 Branch: ${env.RESOLVED_BRANCH}"
                    echo "🔨 Build: ${BUILD_NUMBER}"
                    
                    def branch = env.RESOLVED_BRANCH
                    if (branch != null && branch.startsWith('feature/')) {
                        echo "🚀 Feature branch deployment"
                    } else if (branch == 'develop') {
                        echo "🔧 Development branch deployment (to Staging)"
                    } else if (branch == 'main' || branch == 'master') {
                        echo "🏭 Production branch deployment (to Production)"
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
                    def current_env = env.DEPLOY_ENV // Use the environment determined by Initialize
                    
                    if (branch == null) {
                        error("❌ Critical Error: Resolved branch is null, cannot validate GitFlow rules.")
                    }

                    if (current_env == 'production') {
                        if (!branch.matches('main|master|hotfix/.*|release/.*')) {
                            error("❌ Production can only be deployed from main, release/*, or hotfix/* branches. Branch was: ${branch}")
                        }
                    } else if (current_env == 'staging') {
                        if (!branch.matches('develop|release/.*|hotfix/.*')) {
                            if (!params.FORCE_DEPLOY) { // FORCE_DEPLOY still comes from parameters
                                error("❌ Staging typically deploys from develop, release/*, or hotfix/* branches. Use FORCE_DEPLOY to override. Branch was: ${branch}")
                            } else {
                                echo "⚠️  WARNING: Force deploying ${branch} to staging"
                            }
                        }
                    } else if (current_env == 'dev') {
                        echo "✅ Dev environment accepts all branches (currently: ${branch})"
                    }
                    
                    echo "✅ GitFlow validation passed: ${branch} → ${current_env}"
                }
            }
        }   
        
        stage('Checkout Code') { // This primarily verifies what Jenkins' main SCM checkout did
             steps {
                script {
                    echo "✅ Verifying code for branch '${env.RESOLVED_BRANCH}' in workspace: ${env.WORKSPACE}"
                    sh """
                       echo "Current git branch in workspace (should match RESOLVED_BRANCH if UI SCM is correct):"
                       git branch --show-current || git symbolic-ref --short HEAD || echo "Detached HEAD or could not determine branch"
                       echo "Last commit in workspace:"
                       git log -1 --oneline
                    """
                }
            }
        }
        
        stage('GitFlow Compliance Check') {
             steps {
                script {
                    def branch = env.RESOLVED_BRANCH
                    if (branch == null) {
                        echo "⚠️ Skipping GitFlow Compliance Check as resolved branch is null."
                        return 
                    }
                    // ... (rest of your GitFlow Compliance logic using 'branch') ...
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
                                currentBuild.result = 'FAILURE' 
                                exit 1 
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
                    expression { env.RESOLVED_BRANCH != null && env.RESOLVED_BRANCH.startsWith('feature/') }
                    expression { params.CREATE_FEATURE_APP == true }
                    expression { env.DEPLOY_ENV == 'dev' } // Tied to the determined DEPLOY_ENV
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
                    def GStringSafeDate = new java.text.SimpleDateFormat("yyyyMMdd-HHmmss").format(new Date())
                    def backupFileName = "heroku-config-backup-${env.HEROKU_APP_NAME}-${GStringSafeDate}.json"
                    
                    sh """
                        echo "Backing up current Heroku configuration for app: ${env.HEROKU_APP_NAME}..."
                        echo "Attempting to backup to: ${backupFileName}"
                        if heroku config -a "${env.HEROKU_APP_NAME}" --json > "${backupFileName}"; then
                            echo "Current config successfully backed up to ${backupFileName} for app ${env.HEROKU_APP_NAME}"
                        else
                            echo "No existing config to backup for ${env.HEROKU_APP_NAME}, or app does not exist yet, or an error occurred."
                            touch "${backupFileName}" 
                        fi
                    """
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
                            TARGET_API_URL="https://fakebook-backend-a2a77a290552.herokuapp.com/api" # PROD BACKEND
                            CURRENT_NODE_ENV="production"
                        elif [ "${DEPLOY_ENV}" = "staging" ]; then
                            TARGET_API_URL="https://fakebook-backend-staging.herokuapp.com/api" # STAGING BACKEND
                            CURRENT_NODE_ENV="production" # Staging often uses production-like build
                        else # dev
                            TARGET_API_URL="https://fakebook-backend-dev.herokuapp.com/api" # DEV BACKEND
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
        stage('Debug - Verify Posts Directory') {
            steps {
                script {
                    sh '''
                        echo "=== Debugging Posts Directory ==="
                        echo "Current directory: $(pwd)"
                        echo "Listing root directory contents:"
                        ls -la
                        echo ""
                        echo "Checking for posts directory:"
                        if [ -d "posts" ]; then
                            echo "✅ posts/ directory exists"
                            echo "Contents of posts/:"
                            ls -la posts/
                        else
                            echo "❌ posts/ directory NOT FOUND"
                        fi
                        echo "=== End Debug ==="
                    '''
                }
            }
        }
        // stage('Run Tests') { // <-- ENTIRE STAGE REMOVED
        //     when { expression { params.SKIP_TESTS == false } }
        //     steps { sh 'npm test' }
        // }
        
        stage('Build Frontend') {
            steps { sh 'echo "Building frontend for ${DEPLOY_ENV}..."; npm run build' }
        }
        
        stage('Deployment Approval') {
            when {
                anyOf {
                    allOf {
                        expression { env.DEPLOY_ENV == 'production' } // Use determined DEPLOY_ENV
                        expression { params.FORCE_DEPLOY == false }
                    }
                    allOf {
                        expression { env.RESOLVED_BRANCH != null && env.RESOLVED_BRANCH.startsWith('hotfix/') } 
                        expression { params.FORCE_DEPLOY == false }
                    }
                }
            }
            steps {
                 script {
                    def branchForMessage = env.RESOLVED_BRANCH ?: "unknown branch"
                    def current_env_for_message = env.DEPLOY_ENV.toUpperCase()
                    def message = "Deploy branch '${branchForMessage}' to ${current_env_for_message} environment?"
                    
                    if (env.DEPLOY_ENV == 'production' || (env.RESOLVED_BRANCH != null && env.RESOLVED_BRANCH.startsWith('hotfix/'))) {
                         message = env.DEPLOY_ENV == 'production' ? 
                            "Deploy branch '${branchForMessage}' to PRODUCTION?" : 
                            "Deploy HOTFIX branch '${branchForMessage}' to ${current_env_for_message}?"
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
                    echo "Deploying branch '${env.RESOLVED_BRANCH}' to Heroku app '${env.HEROKU_APP_NAME}' (${env.DEPLOY_ENV})..."
                    sh '''
                        # ... (your existing deploy script, ensure it uses env.HEROKU_APP_NAME and env.RESOLVED_BRANCH) ...
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

                        git push ${HEROKU_REMOTE_NAME} HEAD:refs/heads/main --force
                        
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
                        # ... (your existing verify script, ensure it uses env.HEROKU_APP_NAME and env.DEPLOY_ENV) ...
                        echo "Verifying deployment of ${HEROKU_APP_NAME}..."
                        sleep 45 
                        
                        APP_URL=$(heroku info -a "${HEROKU_APP_NAME}" --json | grep web_url | cut -d '"' -f 4)
                        if [ -z "$APP_URL" ]; then
                            echo "⚠️ Could not retrieve web_url for ${HEROKU_APP_NAME}. Using default construction."
                            APP_URL="https://${HEROKU_APP_NAME}.herokuapp.com/"
                        fi
                        echo "${DEPLOY_ENV} App URL: $APP_URL"
                        
                        echo "Attempting to reach the app..."
                        HTTP_STATUS="000" 
                        for i in 1 2 3; do
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
                expression { env.RESOLVED_BRANCH != null && env.RESOLVED_BRANCH.startsWith('release/') && env.DEPLOY_ENV == 'staging' }
            }
            steps {
                echo "📋 Release branch '${env.RESOLVED_BRANCH}' deployed to staging. Ready for QA."
            }
        }
    } 
    
    post {
        always {
            echo "Pipeline finished for ${env.DEPLOY_ENV} environment, branch ${env.RESOLVED_BRANCH ?: 'unknown'}."
            // Removed archiveArtifacts from here as it's better placed after backup file creation
        }
        success {
            script {
                sh """
                    APP_URL=\$(heroku info -a "${HEROKU_APP_NAME}" --json | grep web_url | cut -d '"' -f 4 || echo "https://${HEROKU_APP_NAME}.herokuapp.com")
                    echo "✅ Pipeline succeeded!"
                    echo "📍 Environment: ${env.DEPLOY_ENV}"
                    echo "🌿 Branch: ${env.RESOLVED_BRANCH ?: 'unknown'}"
                    echo "🌐 URL: \$APP_URL"
                    echo "🏷️  App Name: ${env.HEROKU_APP_NAME}"
                """
            }
        }
        failure {
            echo "❌ Pipeline failed for ${env.DEPLOY_ENV}!"
            echo "Branch: ${env.RESOLVED_BRANCH ?: 'unknown'}" 
            echo "Build: ${BUILD_NUMBER}"
            echo "Environment: ${env.DEPLOY_ENV}" // Use env.DEPLOY_ENV for consistency
            echo "Check the console output above for specific error details."
        }
    } 
}