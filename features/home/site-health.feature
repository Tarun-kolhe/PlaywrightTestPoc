@smoke @critical
Feature: Site health
  Every DAZN Bet brand and environment loads its home page, title and sportsbook.

  Scenario: Home page loads correctly
    Given I open the "home" page
    Then the site should load correctly
    And the page title should be correct for the "home" page
    And the sportsbook should load correctly
    When I wait 10 seconds to review the page
