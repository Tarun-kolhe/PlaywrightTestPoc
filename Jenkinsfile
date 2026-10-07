// One parameterized job for every brand x environment x device x target.
// Plugins: Pipeline, Docker Pipeline, Credentials Binding, JUnit, HTML Publisher, Timestamper,
//          Parameterized Scheduler (for the nightly parameterizedCron below).
//
// Credentials expected in Jenkins:
//   lambdatest              Username with password  (LT username / access key)
//   test-users-<TEST_ENV>   Secret file             (.env with <BRAND>_<ENV>_<ROLE>_PWD lines)

def BRANDS = ['DAZN_UK', 'DAZN_ES', 'DAZN_DE']

def runSuite(String brand) {
  // REPORT_SUBDIR: each brand writes to its own report folders so parallel branches don't collide.
  withEnv(["BRAND=${brand}", "REPORT_SUBDIR=${brand}", "LT_BUILD=${brand}-${params.TEST_ENV}-${env.BUILD_NUMBER}"]) {
    withCredentials([
      usernamePassword(credentialsId: 'lambdatest', usernameVariable: 'LT_USERNAME', passwordVariable: 'LT_ACCESS_KEY'),
      file(credentialsId: "test-users-${params.TEST_ENV}", variable: 'USERS_ENV_FILE')
    ]) {
      sh 'npx playwright test --grep "$TAGS"'
    }
  }
}

pipeline {
  // Keep the image tag in step with @playwright/test in package.json.
  agent { docker { image 'mcr.microsoft.com/playwright:v1.53.2-noble'; args '--ipc=host' } }

  parameters {
    choice(name: 'BRAND', choices: ['DAZN_UK', 'DAZN_ES', 'DAZN_DE', 'all'])
    choice(name: 'TEST_ENV', choices: ['QA', 'UAT', 'PREPROD', 'PROD'])
    choice(name: 'DEVICE', choices: ['all', 'desktop', 'mobile'])
    choice(name: 'RUN_ON', choices: ['lambdatest', 'local'])
    string(name: 'TAGS', defaultValue: '@smoke', description: 'Playwright --grep, e.g. @smoke, @regression, @critical')
    booleanParam(name: 'LT_TUNNEL', defaultValue: false, description: 'Use the LambdaTest tunnel (QA/UAT behind the office network)')
    booleanParam(name: 'LT_REAL_DEVICES', defaultValue: false, description: 'Mobile projects on real devices')
    string(name: 'LT_CONCURRENCY', defaultValue: '2', description: 'Max parallel LambdaTest sessions')
  }

  // Nightly regression at ~02:00 on weekdays. Deploy jobs trigger smoke with parameters.
  triggers {
    parameterizedCron('H 2 * * 1-5 % TAGS=@regression; BRAND=all; TEST_ENV=QA; DEVICE=all; RUN_ON=lambdatest')
  }

  options {
    timestamps()
    timeout(time: 90, unit: 'MINUTES')
    buildDiscarder(logRotator(numToKeepStr: '30'))
  }

  environment {
    CI = 'true'
    TEST_ENV = "${params.TEST_ENV}"
    DEVICE = "${params.DEVICE}"
    RUN_ON = "${params.RUN_ON}"
    TAGS = "${params.TAGS}"
    LT_TUNNEL = "${params.LT_TUNNEL}"
    LT_REAL_DEVICES = "${params.LT_REAL_DEVICES}"
    LT_CONCURRENCY = "${params.LT_CONCURRENCY}"
  }

  stages {
    stage('Install') {
      steps {
        sh 'npm ci'
        sh 'npx bddgen'
      }
    }

    stage('Test') {
      steps {
        script {
          def brands = params.BRAND == 'all' ? BRANDS : [params.BRAND]
          def branches = brands.collectEntries { b -> [(b): { runSuite(b) }] }
          // A failing brand marks the build unstable via JUnit; let every brand finish.
          catchError(buildResult: 'FAILURE', stageResult: 'FAILURE') {
            parallel branches
          }
        }
      }
    }
  }

  post {
    always {
      junit testResults: 'results/**/junit.xml', allowEmptyResults: true
      publishHTML(target: [
        reportDir: 'playwright-report', reportFiles: '*/index.html',
        reportName: 'Playwright', keepAll: true, alwaysLinkToLastBuild: true, allowMissing: true
      ])
      archiveArtifacts artifacts: 'test-results/**, results/**', allowEmptyArchive: true
    }
  }
}
