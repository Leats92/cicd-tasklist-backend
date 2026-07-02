pipeline {
    agent any

    environment {
        DOCKERHUB_CREDENTIALS = credentials('DOCKERHUB_CREDENTIALS')
        DOCKER_IMAGE          = "${DOCKERHUB_CREDENTIALS_USR}/tasklist-backend"
        DOCKER_TAG            = "${env.BUILD_NUMBER}"
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                sh 'npm ci'
            }
        }

        stage('Tests') {
            steps {
                sh 'npm run test:coverage'
            }
            post {
                always {
                    junit allowEmptyResults: true, testResults: 'reports/junit.xml'
                    publishHTML([
                        allowMissing         : true,
                        alwaysLinkToLastBuild: true,
                        keepAll              : true,
                        reportDir            : 'coverage',
                        reportFiles          : 'index.html',
                        reportName           : 'Coverage Backend'
                    ])
                }
            }
        }

        stage('Code Quality - SonarQube') {
            steps {
                withSonarQubeEnv('SonarQube') {
                    sh 'npx sonar-scanner'
                }
            }
        }

        stage('Quality Gate') {
            steps {
                timeout(time: 5, unit: 'MINUTES') {
                    waitForQualityGate abortPipeline: false
                }
            }
        }

        stage('Build') {
            steps {
                sh 'npm run build'
            }
        }

        stage('Build Docker Image') {
            steps {
                sh "docker build -t ${DOCKER_IMAGE}:${DOCKER_TAG} ."
                sh "docker tag  ${DOCKER_IMAGE}:${DOCKER_TAG} ${DOCKER_IMAGE}:latest"
            }
        }

        stage('Security Scan - Trivy') {
            steps {
                sh """
                    trivy image \
                        --format  table \
                        --exit-code 0 \
                        --severity HIGH,CRITICAL \
                        --no-progress \
                        ${DOCKER_IMAGE}:${DOCKER_TAG}
                """
            }
        }

        stage('Generate SBOM') {
            steps {
                sh "syft ${DOCKER_IMAGE}:${DOCKER_TAG} -o spdx-json=sbom-spdx.json"
            }
            post {
                always {
                    archiveArtifacts artifacts: 'sbom-spdx.json', allowEmptyArchive: true
                }
            }
        }

        stage('Push to Docker Hub') {
            steps {
                sh "echo ${DOCKERHUB_CREDENTIALS_PSW} | docker login -u ${DOCKERHUB_CREDENTIALS_USR} --password-stdin"
                sh "docker push ${DOCKER_IMAGE}:${DOCKER_TAG}"
                sh "docker push ${DOCKER_IMAGE}:latest"
            }
        }
    }

    post {
        always {
            sh "docker logout || true"
            sh "docker rmi ${DOCKER_IMAGE}:${DOCKER_TAG} || true"
            sh "docker rmi ${DOCKER_IMAGE}:latest || true"
        }
        success {
            echo "Pipeline backend terminé avec succès !"
        }
        failure {
            echo "Pipeline backend échoué."
        }
    }
}
