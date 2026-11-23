// Declarative pipeline for playwright-cli-claude.
// Intended job type: Multibranch Pipeline (GitHub Branch Source plugin) so
// this file is discovered on every branch AND every PR — see
// docs/jenkins-setup.md for the one-time Jenkins-side job/webhook setup.
//
// Runs directly on the Jenkins agent host (no Docker) — a Homebrew-installed
// Jenkins (brew services) launches with a minimal launchd PATH that doesn't
// include Homebrew's own bin dir, so it's prepended explicitly below rather
// than assumed.
pipeline {
  agent any

  options {
    timestamps()
    disableConcurrentBuilds()
    buildDiscarder(logRotator(numToKeepStr: '30'))
  }

  environment {
    PATH = "/opt/homebrew/bin:${env.PATH}"
  }

  stages {
    stage('Restore flaky history') {
      steps {
        script {
          try {
            copyArtifacts(projectName: env.JOB_NAME, selector: lastCompleted(),
                           filter: 'debug/reports/history/flaky-history.json', optional: true)
          } catch (e) {
            echo 'No previous history yet'
          }
        }
      }
    }

    stage('Install dependencies') {
      steps {
        sh 'npm ci'
        // Browsers aren't preinstalled without the Docker image this
        // Jenkinsfile used before — installed here instead, every run.
        sh 'npx playwright install chromium'
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
      sh 'npm run flaky || true'
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
