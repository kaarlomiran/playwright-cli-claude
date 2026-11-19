// Declarative pipeline for playwright-cli-claude.
// Intended job type: Multibranch Pipeline (GitHub Branch Source plugin) so
// this file is discovered on every branch AND every PR — see
// docs/jenkins-setup.md for the one-time Jenkins-side job/webhook setup.
//
// Uses Microsoft's official Playwright Docker image, pinned to the exact
// @playwright/test version in package.json (1.63.0) so browsers always
// match the installed library — bump both together when upgrading.
pipeline {
  agent {
    docker {
      image 'mcr.microsoft.com/playwright:v1.63.0-noble'
      args '-u root'
    }
  }

  options {
    timestamps()
    disableConcurrentBuilds()
    buildDiscarder(logRotator(numToKeepStr: '30'))
  }

  stages {
    stage('Install dependencies') {
      steps {
        sh 'npm ci'
      }
    }

    stage('Run tests') {
      steps {
        // Full evidence pass: trace + video + screenshot for every test,
        // same as CI's GitHub Actions workflow.
        sh 'npm run test:evidence'
      }
    }
  }

  post {
    always {
      junit testResults: 'debug/reports/junit-results.xml', allowEmptyResults: true

      publishHTML(target: [
        allowMissing: true,
        alwaysLinkToLastBuild: true,
        keepAll: true,
        reportDir: 'playwright-report',
        reportFiles: 'index.html',
        reportName: 'Playwright HTML Report',
      ])

      // Kept even on a failing build so a red run's evidence is never
      // hidden — mirrors the "if: always()" upload step in
      // .github/workflows/playwright.yml.
      archiveArtifacts artifacts: 'debug/INDEX.md,debug/reports/**,debug/traces/**,debug/videos/**,debug/screenshots/**',
                        allowEmptyArchive: true
    }
  }
}
