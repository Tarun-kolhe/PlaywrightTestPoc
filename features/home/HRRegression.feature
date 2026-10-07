#Author: Ranger
@checklist_Regression @HappyPath_NonProd
@HorseRacing @CheckListReg_UAT_UK @CheckListReg_UAT_PP @HR_Racecard @HR_Regression
Feature: Verify Horse Racing Functionality on RaceCard Page

  @HR_RunnerDetails @HRSanity
  Scenario: Verify Runner details are showing in race card page
    Given user navigate to URL
    Then navigate to Horse Racing sport page
    And navigate to meeting page 'HR'
    Then Verify RunnerDetails showing in the Racecard