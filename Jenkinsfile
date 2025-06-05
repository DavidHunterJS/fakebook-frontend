pipeline {
    agent any
    
    parameters {
        choice(name: 'ENVIRONMENT', choices: ['dev', 'staging', 'production'], description: 'Deploy to which environment?')
        string(name: 'DEPLOY_BRANCH', defaultValue: 'develop', description: 'Explicit branch name to deploy (e.g. feature/my-branch)')
        // Fixed: Moved booleanParam to a new line
        booleanParam(name: 'SKIP_TESTS', defaultValue: false, description: 'Skip running tests')
        booleanParam(name: 'FORCE_DEPLOY', defaultValue: false, description: 'Force deployment without approval')
        booleanParam(name: 'CREATE_FEATURE_APP', defaultValue: false, description: 'Create ephemeral Heroku app for feature branches')
    }
    
    environment {
        // Dynamic app name based on environment
        // BRANCH_NAME defined here was using env.GIT_BRANCH which might not be ideal for parameter-driven branch selection logic later.
        // Let's rely on RESOLVED_BRANCH from Initialize stage for consistency.
        // BRANCH_NAME = "${env.GIT_BRANCH?.replaceFirst(/^origin\//, '') ?: 'main'}" // This was likely for the frontend. Review if still needed globally.
        HEROKU_APP_NAME = "${params.ENVIRONMENT == 'production' ? 'fakebook-frontend' : 'fakebook-frontend-' + params.ENVIRONMENT}"
        HEROKU_API_KEY = credentials('HEROKU_API_KEY') // Ensure this credential ID is correct in Jenkins
        DEPLOY_ENV = "${params.ENVIRONMENT}"
        ORIGINAL_APP_NAME = "${HEROKU_APP_NAME}" // Used if Create Feature App modifies HEROKU_APP_NAME
    }
    
    tools { // This is the single, correctly placed tools block
        nodejs 'NodeJS_18_on_EC2' // Ensure this Node.js installation is configured in Jenkins Global Tool Configuration
    }
    
    stages { // This is the single, correctly placed stages block
        stage('Initialize') {
            steps {
                script {
                    // Resolve branch name early
                    def branchName = params.DEPLOY_BRANCH // Start with parameter (for manual builds)
                    
                    // If the DEPLOY_BRANCH parameter is still its default 'develop' (or empty),
                    // and this build was triggered by SCM, try to get the branch from SCM variables.
                    if (params.DEPLOY_BRANCH == 'develop' || !params.DEPLOY_BRANCH) {
                        if (env.GIT_BRANCH) { // env.GIT_BRANCH is often set by Git plugin from webhook (e.g., origin/feature/foo)
                            branchName = env.GIT_BRANCH
                        } else if (env.BRANCH_NAME) { // env.BRANCH_NAME is often set by Multibranch pipelines or some Git plugins
                            branchName = env.BRANCH_NAME
                        } else {
                            // Fallback for safety if SCM variables aren't populated as expected for a triggered build
                            // but if DEPLOY_BRANCH was intentionally 'develop', this is fine.
                            // If triggered manually without changing DEPLOY_BRANCH, it will remain 'develop'.
                            echo "No SCM branch environment variable found, using DEPLOY_BRANCH parameter: ${branchName}"
                        }
                    }
                    
                    // Clean up common prefixes from the branch name
                    branchName = branchName.replaceFirst(/^origin\//, '')
                                           .replaceFirst(/^refs\/heads\//, '')
                                           .replaceFirst(/^refs\/remotes\/origin\//, '')
                    
                    // Store resolved branch for all stages
                    env.RESOLVED_BRANCH = branchName
                    // Overwrite env.DEPLOY_BRANCH to ensure consistency if it was derived from SCM env vars
                    env.DEPLOY_BRANCH = branchName 
                    
                    echo "✅ Resolved branch for this build: ${env.RESOLVED_BRANCH}"

                    // Adjust Heroku app name if it's a feature branch and CREATE_FEATURE_APP is true
                    if (env.RESOLVED_BRANCH.startsWith('feature/') && params.CREATE_FEATURE_APP == true && params.ENVIRONMENT == 'dev') {
                        def featureNameSanitized = env.RESOLVED_BRANCH.replace('feature/', '').replaceAll('[^a-zA-Z0-9-]', '-').toLowerCase()
                        env.HEROKU_APP_NAME = "fakebook-ft-${featureNameSanitized}".take(30)
                        echo "ℹ️  Feature branch will target dynamically named Heroku app: ${env.HEROKU_APP_NAME}"
                    } else {
                         // Use environment-based name (already set globally, but re-affirming for clarity if needed)
                        env.HEROKU_APP_NAME = "${params.ENVIRONMENT == 'production' ? 'fakebook-frontend' : 'fakebook-frontend-' + params.ENVIRONMENT}"
                        echo "ℹ️  Branch will target standard Heroku app: ${env.HEROKU_APP_NAME} for environment ${params.ENVIRONMENT}"
                    }
                }
            }
        }
        
        stage('Environment Info') {
            steps {
                script {
                    echo "🎯 Deploying to: ${params.ENVIRONMENT}"
                    echo "📦 Heroku app: ${env.HEROKU_APP_NAME}" // Use the potentially modified app name
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
                        echo "📌 Custom branch deployment"
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
                            error("❌ Production can only be deployed from main, release/*, or hotfix/* branches")
                        }
                    } else if (env_param == 'staging') {
                        if (!branch.matches('develop|release/.*|hotfix/.*')) {
                            if (!params.FORCE_DEPLOY) {
                                error("❌ Staging typically deploys from develop, release/*, or hotfix/* branches. Use FORCE_DEPLOY to override.")
                            } else {
                                echo "⚠️  WARNING: Force deploying ${branch} to staging"
                            }
                        }
                    } else if (env_param == 'dev') {
                        echo "✅ Dev environment accepts all branches"
                    }
                    
                    echo "✅ GitFlow validation passed: ${branch} → ${env_param}"
                }
            }
        }   
        
        stage('Checkout Code') { // This stage now relies on the initial SCM checkout by Jenkins
            steps {
                // The actual code for env.RESOLVED_BRANCH should already be in the workspace
                // if the Jenkins job UI SCM is configured correctly (Branch Specifier: **)
                // and the Jenkinsfile was read from that branch.
                // The Initialize stage then confirms this branch.
                echo "✅ Code for branch '${env.RESOLVED_BRANCH}' should already be checked out in: ${env.WORKSPACE}"
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
                    expression { env.RESOLVED_BRANCH.startsWith('feature/') }
                    expression { params.CREATE_FEATURE_APP == true }
                    expression { params.ENVIRONMENT == 'dev' } // Typically feature apps deploy to a 'dev' like setup
                }
            }
            steps {
                script {
                    // HEROKU_APP_NAME should already be set by the Initialize stage if conditions met
                    sh """
                        echo "Managing ephemeral app for feature branch: ${env.HEROKU_APP_NAME}"
                        
                        if ! heroku apps:info -a ${env.HEROKU_APP_NAME} &> /dev/null; then
                            echo "Creating new feature Heroku app: ${env.HEROKU_APP_NAME}"
                            heroku create ${env.HEROKU_APP_NAME} || echo "App creation failed - may already exist or name conflict."
                        else
                            echo "ℹ️  Feature app '${env.HEROKU_APP_NAME}' already exists."
                        fi
                        
                        heroku config:set APP_TYPE=feature FEATURE_BRANCH=${env.RESOLVED_BRANCH} -a ${env.HEROKU_APP_NAME}
                        echo "✅ Feature app '${env.HEROKU_APP_NAME}' tagged."
                    """
                }
            }
        }
        
        stage('Backup Current Config') {
            steps {
                script {
                    sh '''
                        echo "Backing up current Heroku configuration for app: ${HEROKU_APP_NAME}..."
                        # Using a dynamic filename for the backup
                        BACKUP_FILE="heroku-config-backup-${HEROKU_APP_NAME}-$(date +%Y%m%d-%H%M%S).json"
                        if heroku config -a ${HEROKU_APP_NAME} --json > "${BACKUP_FILE}"; then
                            echo "Current config backed up to ${BACKUP_FILE} for app ${HEROKU_APP_NAME}"
                            archiveArtifacts artifacts: "${BACKUP_FILE}", allowEmptyArchive: true
                        else
                            echo "No existing config to backup for ${HEROKU_APP_NAME}, or app does not exist yet."
                        fi
                    '''
                }
            }
        }
        
        stage('Install Dependencies') {
            steps {
                script {
                    sh '''
                        echo "Installing dependencies..."
                        # Use npm ci for cleaner installs if package-lock.json exists
                        if [ -f "package-lock.json" ]; then
                            if [ ! -d "node_modules" ] || [ package.json -nt node_modules ] || [ package-lock.json -nt node_modules ]; then
                                npm ci
                            else
                                echo "Using cached node_modules (package.json and package-lock.json not newer)"
                            fi
                        else
                            echo "package-lock.json not found, using npm install"
                            npm install
                        fi
                        
                        # Configure git for potential commits within the pipeline (like package-lock updates)
                        # This uses generic CI user details.
                        git config user.email "ci-builder@jenkins.invalid"
                        git config user.name "Jenkins CI"
                        
                        # If npm ci/install modifies package-lock.json, commit it back
                        # This is optional and depends on your workflow.
                        # if ! git diff --quiet package-lock.json; then
                        #     echo "Committing updated package-lock.json"
                        #     git add package-lock.json
                        #     git commit -m "Update package-lock.json by CI build ${BUILD_NUMBER} [skip ci]"
                        # else
                        #     echo "No changes to package-lock.json to commit."
                        # fi
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
                            CURRENT_NODE_ENV="staging" # Or 'production' if staging runs optimized builds
                        else # dev
                            TARGET_API_URL="https://fakebook-backend-dev.herokuapp.com/api"
                            CURRENT_NODE_ENV="development"
                        fi
                        
                        echo "NEXT_PUBLIC_API_URL=${TARGET_API_URL}" > .env.production
                        echo "NODE_ENV=${CURRENT_NODE_ENV}" >> .env.production
                        
                        # Add branch info for non-production environments
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
                        expression { env.RESOLVED_BRANCH.startsWith('hotfix/') } // Hotfixes to any env might need approval
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
                        set -x # Echo executed commands
                        set -e # Exit on error
                        
                        echo "Step 1: Verifying HEROKU_API_KEY is set..."
                        if [ -z "$HEROKU_API_KEY" ]; then
                            echo "ERROR: HEROKU_API_KEY environment variable is not set."
                            exit 1
                        fi
                        echo "HEROKU_API_KEY is present."
                        
                        echo "Step 2: Ensuring Heroku CLI is available..."
                        # Heroku CLI should be available via Jenkins tool 'NodeJS_18_on_EC2' if it includes global heroku, or from local install.
                        # This script assumes heroku command is in PATH or uses node_modules/.bin/heroku.
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
                        # These credentials are for the commit to Heroku, not for GitHub.
                        git config user.email "jenkins-ci@example.com"
                        git config user.name "Jenkins CI Bot"
                        
                        echo "Step 4: Creating deployment tag..."
                        # Sanitize branch name for use in tag
                        BRANCH_SAFE=$(echo "${RESOLVED_BRANCH}" | tr '/' '-' | sed 's/[^a-zA-Z0-9-]//g')
                        DEPLOY_TAG="${DEPLOY_ENV}-deploy-$(date +%Y%m%d-%H%M%S)-b${BUILD_NUMBER}-${BRANCH_SAFE}"
                        git tag -a "$DEPLOY_TAG" -m "Deployment to ${DEPLOY_ENV} from branch ${RESOLVED_BRANCH}, build ${BUILD_NUMBER}"
                        
                        echo "Step 5: Setting up Heroku git remote..."
                        # Using a unique remote name to avoid conflicts if 'heroku' already exists
                        HEROKU_REMOTE_NAME="heroku-${HEROKU_APP_NAME}" 
                        if git remote | grep -q "^${HEROKU_REMOTE_NAME}$"; then
                            git remote set-url ${HEROKU_REMOTE_NAME} https://heroku:$HEROKU_API_KEY@git.heroku.com/${HEROKU_APP_NAME}.git
                            echo "Updated existing Heroku remote: ${HEROKU_REMOTE_NAME}"
                        else
                            git remote add ${HEROKU_REMOTE_NAME} https://heroku:$HEROKU_API_KEY@git.heroku.com/${HEROKU_APP_NAME}.git
                            echo "Added new Heroku remote: ${HEROKU_REMOTE_NAME}"
                        fi
                        
                        echo "Step 6: Deploying current HEAD to Heroku's main branch..."
                        # We are pushing the current state of the checked-out branch (env.RESOLVED_BRANCH)
                        # to the 'main' branch on Heroku. Heroku apps build from 'main' by default.
                        git add -f .env.production || echo "No .env.production file to add" # Add generated env file if it exists
                        # Commit only if there are staged changes (like .env.production)
                        if ! git diff --cached --quiet; then
                            git commit -m "CI: Add/Update .env.production for ${DEPLOY_ENV} build ${BUILD_NUMBER} [skip ci]"
                        else
                            echo "No changes to commit before Heroku push."
                        fi

                        git push ${HEROKU_REMOTE_NAME} HEAD:main --force
                        
                        echo "Step 7: Pushing deployment tag to Heroku remote..."
                        git push ${HEROKU_REMOTE_NAME} "$DEPLOY_TAG"
                        
                        echo "Step 8: Setting deployment metadata as Heroku Config Vars..."
                        $HEROKU_CMD config:set DEPLOY_BRANCH="${RESOLVED_BRANCH}" DEPLOY_TAG="${FULL_TAG}" DEPLOY_TIME="$(date -u +%Y-%m-%dT%H:%M:%SZ)" -a ${HEROKU_APP_NAME}
                        
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
                        sleep 45 # Increased sleep time for Heroku dyno to restart and app to boot
                        
                        # Fetch the actual web URL from Heroku info
                        APP_URL=$(heroku info -a ${HEROKU_APP_NAME} --json | grep web_url | cut -d '"' -f 4)
                        if [ -z "$APP_URL" ]; then
                            echo "⚠️ Could not retrieve web_url for ${HEROKU_APP_NAME}. Using default construction."
                            APP_URL="https://${HEROKU_APP_NAME}.herokuapp.com/"
                        fi
                        echo "${DEPLOY_ENV} App URL: $APP_URL"
                        
                        # Check if the app is responding with a 200 OK
                        # Allowing a few retries as apps can take a moment to be fully healthy
                        echo "Attempting to reach the app..."
                        for i in 1 2 3; do
                            HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 10 --max-time 20 "$APP_URL")
                            echo "Attempt $i: Status $HTTP_STATUS"
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
                            # Attempt to fetch recent logs - remove --since if not supported by your Heroku CLI version
                            heroku logs -n 75 -a ${HEROKU_APP_NAME} || echo "Could not fetch logs for ${HEROKU_APP_NAME}."
                            # Consider not failing the build here if a temporary glitch, or add specific conditions for failure
                        fi
                    '''
                }
            }
        }
        
        stage('Post-Deployment Tasks') {
            when {
                // Example: Run only for release branches deployed to staging
                expression { env.RESOLVED_BRANCH.startsWith('release/') && params.ENVIRONMENT == 'staging' }
            }
            steps {
                echo "📋 Release branch '${env.RESOLVED_BRANCH}' deployed to staging. Ready for QA."
                // Add any specific post-deployment steps for staging releases, like notifications
            }
        }
    } // End of main stages block
    
    post {
        always {
            echo "Pipeline finished for ${DEPLOY_ENV} environment, branch ${env.RESOLVED_BRANCH}."
            archiveArtifacts artifacts: 'heroku-config-backup-*.json', allowEmptyArchive: true
            
            script {
                def branch = env.RESOLVED_BRANCH
                if (branch.startsWith('feature/') && params.CREATE_FEATURE_APP == true && params.ENVIRONMENT == 'dev') {
                    echo """
                    📝 Feature Branch Deployed to Ephemeral App: ${env.HEROKU_APP_NAME}
                    1. Test your feature at: https://${env.HEROKU_APP_NAME}.herokuapp.com
                    2. When ready, create a PR from '${branch}' to 'develop'.
                    3. After merging to 'develop', you can manually destroy the ephemeral app:
                       heroku apps:destroy ${env.HEROKU_APP_NAME} --confirm ${env.HEROKU_APP_NAME}
                    """
                } else if (branch.startsWith('hotfix/') && params.ENVIRONMENT == 'production') {
                    echo """
                    🔥 Hotfix Deployed to Production! Next Steps:
                    1. Verify the fix in production.
                    2. Merge hotfix branch back to both 'main' AND 'develop'.
                    3. Tag the release on 'main'.
                    """
                } else if (branch.startsWith('release/') && params.ENVIRONMENT == 'production') {
                     echo """
                    📦 Release Deployed to Production! Next Steps:
                    1. Verify in production.
                    2. Merge release branch back to both 'main' (should be done by PR) AND 'develop'.
                    3. Tag the release on 'main'.
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
                    echo "🌿 Branch: ${env.RESOLVED_BRANCH}"
                    echo "🌐 URL: \$APP_URL"
                    echo "🏷️  App Name: ${HEROKU_APP_NAME}"
                """
            }
        }
        failure {
            echo "❌ Pipeline failed for ${DEPLOY_ENV}!"
            echo "Branch: ${env.RESOLVED_BRANCH ?: 'unknown'}" // Use resolved, fallback to unknown
            echo "Build: ${BUILD_NUMBER}"
            echo "Environment: ${DEPLOY_ENV}"
            echo "Check the console output above for specific error details."
        }
    } // End of post block
} // End of pipeline
